import React from 'react';
import { Code2, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#070a0e', borderTop: '1px solid var(--border-color)', padding: '2.5rem 0', color: 'var(--text-muted)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DCDCDD', fontWeight: 700, fontSize: '1.05rem' }}>
              <Code2 size={18} color="#1985A1" /> Sourav Tech Portfolio
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', color: '#C5C3C6' }}>
              Senior Full-Stack Engineer | MERN Stack & Enterprise .NET / Angular
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-teal" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={13} /> GitHub Pages Ready
            </span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(76, 92, 104, 0.3)', marginTop: '1.75rem', paddingTop: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: '#808e9b' }}>
          Crafted with React, Vite, Express, and Custom Color Palette (#DCDCDD, #C5C3C6, #46494C, #4C5C68, #1985A1).
        </div>
      </div>
    </footer>
  );
}
