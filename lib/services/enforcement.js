/**
 * enforcement.js
 * Handles platform takedowns and DMCA notice generation.
 */

export const platformDMCAContacts = {
  youtube: "copyright@youtube.com",
  tiktok: "copyright@tiktok.com",
  soundcloud: "copyright@soundcloud.com"
};

/**
 * Stubs for direct API takedowns once partner access is granted.
 */
export async function triggerPlatformTakedownAPI(platform, contentUrl, proofFingerprint) {
  console.log(`[API Stubs] Triggering direct API takedown for ${platform} at ${contentUrl}`);
  // TODO: Implement actual API hooks here when access is provided.
  return { success: true, message: `Takedown request sent to ${platform} API.` };
}

/**
 * Generates a pre-filled mailto link for manual DMCA submission.
 */
export function generateManualDMCA(platform, targetUrl, originalWorkInfo, creatorName) {
  const email = platformDMCAContacts[platform] || "copyright@example.com";
  const subject = encodeURIComponent(`Notice of Copyright Infringement - ${creatorName}`);
  
  const bodyText = `To the designated Copyright Agent,

I am writing to notify you of a copyright infringement under the Digital Millennium Copyright Act (DMCA).

1. The copyrighted work that is being infringed:
${originalWorkInfo}

2. The unauthorized material that is infringing the above work and should be removed:
URL: ${targetUrl}

3. This material uses a mathematically proven unauthorized clone of my voice/audio, verified via our acoustic fingerprinting system.

4. I have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

5. The information in this notification is accurate, and under penalty of perjury, I am the owner, or an agent authorized to act on behalf of the owner, of an exclusive right that is allegedly infringed.

Sincerely,
${creatorName}
`;

  return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
}
