import Link from 'next/link';

export const metadata = {
  title: '404 - Page Not Found | Igris Radar',
  description: 'The requested page could not be found.',
  robots: 'noindex, nofollow',
};

/**
 * Lightweight, static 404 handler for unmatched routes and bot scanning traffic.
 * Absorbs non-existent scanner URLs without invoking database logic or 500 errors.
 */
export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '48px 36px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      }}>
        <h1 style={{
          fontSize: '72px',
          fontWeight: '800',
          margin: '0 0 8px 0',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1',
        }}>
          404
        </h1>
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px 0', color: '#e2e8f0' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 32px 0', lineHeight: '1.5' }}>
          The path you requested does not exist or has been moved.
        </p>
        <Link 
          href="/landing" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#6366f1',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px',
            borderRadius: '8px',
            textDecoration: 'none',
            transition: 'background-color 0.2s ease',
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
