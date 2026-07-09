import Link from 'next/link';

const footerLinks = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Eventos', href: '/events' },
      { label: 'Gremios', href: '/guilds' },
      { label: 'VTubers', href: '/vtubers' },
      { label: 'Ranking', href: '/leaderboard' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { label: 'Feed', href: '/feed' },
      { label: 'Chat', href: '/chat' },
      { label: 'Logros', href: '/achievements' },
      { label: 'Apoyar', href: '/support' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Notificaciones', href: '/notifications' },
      { label: 'Iniciar Sesión', href: '/login' },
      { label: 'Registrarse', href: '/register' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid var(--glass-border)',
        background: 'rgba(15, 12, 41, 0.8)',
        backdropFilter: 'blur(20px)',
        marginTop: 'auto',
      }}
    >
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '40px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '40px',
            marginBottom: '40px',
          }}
        >
          {/* Brand */}
          <div style={{ minWidth: '200px' }}>
            <Link
              href="/"
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'var(--text)',
                textDecoration: 'none',
              }}
            >
              <span className="gradient-text">Gremio Estelar</span>
            </Link>
            <p
              style={{
                marginTop: '12px',
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                maxWidth: '280px',
              }}
            >
              La plataforma definitiva para creadores de contenido virtual. Conecta, crea y crece con
              la comunidad.
            </p>
          </div>

          {/* Link groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {group.title}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {group.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="footer-link"
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      transition: 'color 0.2s',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} Gremio Estelar. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hecho con ✦ para la comunidad VTuber
          </p>
        </div>
      </div>
    </footer>
  );
}
