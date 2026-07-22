import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Zap, Server, Cpu, Code } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  return (
    <section id="hero" style={{ paddingTop: '6.5rem', paddingBottom: '3.5rem', position: 'relative' }}>
      <div className="container">
        {/* Top Tag Badge */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div className="badge badge-teal" style={{ padding: '0.35rem 1rem', fontSize: '0.82rem' }}>
            <Sparkles size={14} /> Senior Full-Stack Engineer | Architectural Case Study
          </div>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2.1rem, 4.5vw, 3.5rem)',
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.2,
          letterSpacing: '-0.025em',
          marginBottom: '1.25rem',
          maxWidth: '900px',
          margin: '0 auto 1.25rem',
          color: '#DCDCDD'
        }}>
          Architecting Enterprise Financial Systems: <br />
          <span className="text-gradient-teal">MERN Stack to Angular, .NET & SSMS</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          textAlign: 'center',
          color: '#C5C3C6',
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          maxWidth: '780px',
          margin: '0 auto 2rem',
          lineHeight: 1.6
        }}>
          A senior-level architectural deep dive demonstrating cross-framework migration, financial ACID ledger integrity, 
          and high-concurrency enterprise banking system refactoring.
        </p>

        {/* Tech Stack Comparison Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2.5rem'
        }}>
          <div className="glass-card" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: '#808e9b', fontWeight: 600 }}>V1 Prototype:</span>
            <span className="badge badge-steel">MongoDB</span>
            <span className="badge badge-steel">ExpressJS</span>
            <span className="badge badge-steel">React</span>
            <span className="badge badge-steel">NodeJS</span>
          </div>

          <div style={{ color: '#1985A1', fontWeight: 'bold', fontSize: '1.2rem' }}>➔</div>

          <div className="glass-card" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', borderColor: 'rgba(25, 133, 161, 0.4)' }}>
            <span style={{ fontSize: '0.82rem', color: '#808e9b', fontWeight: 600 }}>V2 Enterprise:</span>
            <span className="badge badge-teal">Angular 22</span>
            <span className="badge badge-teal">C# ASP.NET Core 10</span>
            <span className="badge badge-teal">SQL Server (SSMS)</span>
            <span className="badge badge-teal">EF Core</span>
          </div>
        </div>

        {/* Hero CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button onClick={() => onExploreClick('overview')} className="btn btn-primary">
            Explore 5-Step Migration <ArrowRight size={17} />
          </button>
          <button onClick={() => onExploreClick('comparison')} className="btn btn-secondary">
            <Code size={17} /> View Technical Proof
          </button>
        </div>

        {/* Metric Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}>
          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <ShieldCheck size={28} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DCDCDD' }}>100% ACID</div>
            <div style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.25rem' }}>Strict Relational Ledger Integrity in SSMS</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Zap size={28} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DCDCDD' }}>~4.2x Faster</div>
            <div style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.25rem' }}>LINQ & Indexed SQL Query Throughput</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Server size={28} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DCDCDD' }}>Strict Typing</div>
            <div style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.25rem' }}>C# DTOs & Angular TypeScript Contracts</div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <Cpu size={28} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DCDCDD' }}>Clean Arch</div>
            <div style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.25rem' }}>Separation of Domain, App, Infrastructure</div>
          </div>
        </div>
      </div>
    </section>
  );
}
