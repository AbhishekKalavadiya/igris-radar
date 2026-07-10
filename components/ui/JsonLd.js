/**
 * Renders a Schema.org JSON-LD script tag.
 * Works in both server and client components - client components are still
 * server-rendered on first load, so crawlers see the script in the HTML.
 */
export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
