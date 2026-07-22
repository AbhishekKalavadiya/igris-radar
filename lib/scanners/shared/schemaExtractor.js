/**
 * Extracts and parses JSON-LD structured data and meta tags from a cheerio instance.
 */

/**
 * Extracts all JSON-LD schemas.
 * @param {cheerio.Root} $
 * @returns {{ schemas: Object[], types: string[], hasType: (type: string) => boolean }}
 */
export function extractSchemas($) {
  const schemas = [];
  const types = new Set();

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      
      const processSchema = (schema) => {
        if (!schema) return;
        schemas.push(schema);
        if (schema['@type']) {
          types.add(schema['@type']);
        }
      };

      if (Array.isArray(json)) {
        json.forEach(processSchema);
      } else {
        processSchema(json);
      }
    } catch (e) {
      // Ignore parse errors
    }
  });

  const typesArray = Array.from(types);

  return {
    schemas,
    types: typesArray,
    hasType: (type) => types.has(type)
  };
}

/**
 * Deep-walks parsed JSON-LD objects (descending into nested entities and
 * `@graph` arrays) and returns true as soon as any node satisfies `predicate`.
 *
 * Use this instead of `html.includes('someProp')`: a raw substring match on the
 * page source false-fires when the term appears inside a <script> bundle, an
 * HTML comment, CSS, or plain visible text that has nothing to do with
 * structured data — and it silently misses entities nested under `@graph`.
 *
 * @param {Object[]|Object} schemas  parsed schemas from extractSchemas().schemas
 * @param {(node: Object) => boolean} predicate
 */
export function schemaSome(schemas, predicate) {
  const walk = (node) => {
    if (!node || typeof node !== 'object') return false;
    if (!Array.isArray(node) && predicate(node)) return true;
    for (const key of Object.keys(node)) {
      if (walk(node[key])) return true;
    }
    return false;
  };
  return walk(schemas);
}

/**
 * True if any schema node defines `key` with a meaningful (non-empty) value.
 * @param {Object[]|Object} schemas
 * @param {string} key  e.g. 'sameAs', 'logo', '@id', 'datePublished'
 */
export function schemaHasProperty(schemas, key) {
  return schemaSome(schemas, (node) => {
    if (Array.isArray(node)) return false;
    const v = node[key];
    if (v == null || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
}

/**
 * True if any schema node's `@type` matches `type`, handling both string and
 * array `@type` values and entities nested under `@graph`. Unlike
 * `extractSchemas().hasType`, this is not limited to top-level schemas.
 * @param {Object[]|Object} schemas
 * @param {string} type  e.g. 'FAQPage', 'ContactPoint', 'PostalAddress'
 */
export function schemaHasTypeDeep(schemas, type) {
  return schemaSome(schemas, (node) => {
    const t = node['@type'];
    if (!t) return false;
    return Array.isArray(t) ? t.includes(type) : t === type;
  });
}

/**
 * Extracts Open Graph meta tags.
 * @param {cheerio.Root} $
 * @returns {Object}
 */
export function extractOpenGraph($) {
  return {
    title: $('meta[property="og:title"]').attr('content') || '',
    description: $('meta[property="og:description"]').attr('content') || '',
    image: $('meta[property="og:image"]').attr('content') || '',
    url: $('meta[property="og:url"]').attr('content') || '',
    type: $('meta[property="og:type"]').attr('content') || ''
  };
}

/**
 * Extracts Twitter Card meta tags.
 * @param {cheerio.Root} $
 * @returns {Object}
 */
export function extractTwitterCards($) {
  return {
    card: $('meta[name="twitter:card"]').attr('content') || '',
    title: $('meta[name="twitter:title"]').attr('content') || '',
    description: $('meta[name="twitter:description"]').attr('content') || '',
    image: $('meta[name="twitter:image"]').attr('content') || ''
  };
}
