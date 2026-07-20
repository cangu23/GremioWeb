// Pages Router _error page — overrides Next.js internal _error fallback.
// Prevents prerender error: "<Html> should not be imported outside of pages/_document"
// which occurs in App Router-only projects using output: 'standalone'.
// This file provides a minimal error page that works with the default _document wrapper.

function Error({ statusCode }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 700, margin: 0 }}>
        {statusCode || 500}
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#666', marginTop: '12px' }}>
        {statusCode === 404
          ? 'Page not found'
          : 'Something went wrong'}
      </p>
      <a
        href="/"
        style={{
          marginTop: '24px',
          padding: '10px 24px',
          borderRadius: '8px',
          background: '#7C3AED',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        ← Back to home
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
