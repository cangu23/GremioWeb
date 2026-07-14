"use client";

import Link from 'next/link';
import Image from 'next/image';

const footerLinks = {
  Plataforma: [
    { href: '/vtubers', label: 'VTubers' },
    { href: '/events', label: 'Eventos' },
    { href: '/guilds', label: 'Gremios' },
    { href: '/feed', label: 'Feed' },
    { href: '/leaderboard', label: 'Ranking' },
  ],
  Comunidad: [
    { href: '/chat', label: 'Chat Global' },
    { href: '/achievements', label: 'Logros' },
    { href: '/support', label: 'Apoyar' },
  ],
  Cuenta: [
    { href: '/login', label: 'Iniciar Sesión' },
    { href: '/register', label: 'Unirse Gratis' },
    { href: '/dashboard', label: 'Dashboard' },
  ],
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      position: 'relative',
      zIndex: 1,
      marginTop: 'auto',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      background: 'linear-gradient(to bottom, transparent, rgba(10, 8, 30, 0.95))',
    }}>
      {/* Top gradient accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        maxWidth: '600px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--primary), var(--secondary), transparent)',
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Main footer grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '48px',
          padding: '64px 0 48px',
        }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', width: 'fit-content' }}>
              <Image
                src="/logo.png"
                alt="Gremio Estelar"
                width={40}
                height={40}
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(138,43,226,0.5))' }}
              />
              <span style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}>
                Gremio Estelar
              </span>
            </Link>

            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              maxWidth: '280px',
            }}>
              La plataforma definitiva para conectar creadores de contenido virtual. Gestiona tu perfil, interactúa con la comunidad y lleva tu carrera al siguiente nivel.
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              {[
                {
                  label: 'Twitter / X',
                  href: 'https://twitter.com',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.745l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  ),
                },
                {
                  label: 'Discord',
                  href: 'https://discord.com',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
                    </svg>
                  ),
                },
                {
                  label: 'Twitch',
                  href: 'https://twitch.tv',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                    </svg>
                  ),
                },
                {
                  label: 'YouTube',
                  href: 'https://youtube.com',
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  ),
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-muted)',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--primary-subtle)';
                    e.currentTarget.style.borderColor = 'rgba(138,43,226,0.3)';
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([groupName, links]) => (
            <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}>
                {groupName}
              </h3>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    display: 'inline-block',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="/logo.png"
              alt=""
              width={18}
              height={18}
              style={{ objectFit: 'contain', opacity: 0.5 }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              © {currentYear} Gremio Estelar. Todos los derechos reservados.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            {[
              { href: '/support', label: 'Apoyar el proyecto' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {link.label}
              </Link>
            ))}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Hecho con{' '}
              <span style={{ color: 'var(--secondary)' }}>♥</span>
              {' '}para la comunidad VTuber
            </span>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  );
}
