import { ImageResponse } from 'next/og'

export const alt = 'Igris Radar - AI Search Visibility & Web Audit Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Site-wide Open Graph / Twitter Card image, generated at build time.
 * Twitter falls back to this image automatically via metadata resolution.
 * Hex values are required: ImageResponse renders off-DOM (Tailwind N/A).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a1016 0%, #0d1b24 100%)',
          color: '#e6f4f8',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#3bbcdc" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            width={88}
            height={88}
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="4" stroke="#ffffff" fill="none" />
            <circle cx="12" cy="12" r="1.5" stroke="#ffffff" fill="#ffffff" />
            <path d="M12 8v2" />
            <path d="M12 14v2" />
            <path d="M8 12h2" />
            <path d="M14 12h2" />
          </svg>
          <div style={{ fontSize: 88, fontWeight: 700 }}>Igris Radar</div>
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: '#8fb4c2' }}>
          AI Search Visibility &amp; Web Audit Platform
        </div>
        <div style={{ marginTop: 48, display: 'flex', gap: 18, fontSize: 24, color: '#3bbcdc' }}>
          <span>Security</span>
          <span style={{ color: '#33505c' }}>·</span>
          <span>SEO</span>
          <span style={{ color: '#33505c' }}>·</span>
          <span>AEO</span>
          <span style={{ color: '#33505c' }}>·</span>
          <span>GEO</span>
          <span style={{ color: '#33505c' }}>·</span>
          <span>Brand Visibility</span>
          <span style={{ color: '#33505c' }}>·</span>
          <span>Site Health</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
