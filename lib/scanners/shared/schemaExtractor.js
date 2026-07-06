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
