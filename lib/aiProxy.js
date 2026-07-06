/**
 * aiProxy.js
 * Runtime AI Safeguards: The Interception Proxy
 */

// In-memory store for tracking AI call frequencies per tenant/key to detect rate spikes
const callFrequencies = new Map();

// Configuration for anomaly detection
const SPIKE_THRESHOLD = 20; // max calls
const SPIKE_WINDOW_MS = 60000; // 1 minute

/**
 * Validates a tool call or prompt payload against destructive patterns.
 * @param {string} payload - The prompt or tool call name
 * @throws {Error} if a destructive pattern is matched
 */
export function scanForDestructivePatterns(payload) {
  if (!payload || typeof payload !== 'string') return;

  const dangerousPatterns = /^(delete_|drop_|rm_|destroy_)/i;
  
  if (dangerousPatterns.test(payload)) {
    throw new Error(`[Security Proxy] Blocked destructive pattern in AI tool call: ${payload}`);
  }
}

/**
 * Tracks AI calls to detect potential DoS attacks or infinite loops.
 * @param {string} identifier - The tenant ID or API key hash
 * @throws {Error} if a rate spike anomaly is detected
 */
export function checkRateSpikeAnomaly(identifier) {
  const now = Date.now();
  const record = callFrequencies.get(identifier) || { count: 0, firstCallTime: now };

  // Reset window if time has passed
  if (now - record.firstCallTime > SPIKE_WINDOW_MS) {
    record.count = 1;
    record.firstCallTime = now;
  } else {
    record.count += 1;
  }

  callFrequencies.set(identifier, record);

  if (record.count > SPIKE_THRESHOLD) {
    throw new Error(`[Security Proxy] Rate spike anomaly detected for ${identifier}. Connection cut off to prevent infrastructure DoS/Infinite Loop.`);
  }
}

/**
 * Intercepts and proxies requests to underlying AI models (e.g., Gemini)
 * applying all security safeguards before forwarding.
 * 
 * @param {string} identifier - Identifier for rate spike tracking (e.g., API key)
 * @param {Array|Object} tools - The tool configurations requested by the model
 * @param {Function} aiFunction - The actual async function to call the AI provider
 * @returns {Promise<any>} The AI response
 */
export async function executeProxiedAICall(identifier, tools = [], aiFunction) {
  // 1. Check for Rate Spikes (DoS / Loop prevention)
  checkRateSpikeAnomaly(identifier);

  // 2. Scan Tool Declarations for Destructive Patterns
  if (Array.isArray(tools)) {
    for (const tool of tools) {
      const toolName = tool.name || (tool.functionDeclarations && tool.functionDeclarations[0]?.name);
      if (toolName) {
        scanForDestructivePatterns(toolName);
      }
    }
  }

  // 3. Execute the actual call
  return await aiFunction();
}
