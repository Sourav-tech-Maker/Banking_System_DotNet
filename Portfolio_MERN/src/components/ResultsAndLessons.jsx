import React from 'react';
import { Zap, TrendingUp, ShieldCheck, BookOpen, GitBranch, CheckCircle2 } from 'lucide-react';

export default function ResultsAndLessons() {
  return (
    <section id="results" className="section-wrapper">
      <div className="container">
        {/* Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <span className="badge badge-teal">Step 5</span>
          <span style={{ fontSize: '0.82rem', color: '#C5C3C6' }}>Metrics & Key Takeaways</span>
        </div>

        <h2 className="section-title">5. Key Results & Lessons Learned</h2>
        <p className="section-subtitle">
          Quantifiable performance gains achieved through refactoring, alongside deep takeaways in system design, 
          architecture patterns, and enterprise software engineering.
        </p>

        {/* 4 Quantitative Result Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ padding: '1.25rem', borderTop: '3px solid #1985A1' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={20} /> <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>LATENCY REDUCTION</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DCDCDD' }}>-68%</div>
            <p style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.35rem' }}>
              SQL Server non-clustered index scans on <code>AccountId</code> reduced query latency from 145ms to 46ms.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderTop: '3px solid #4C5C68' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={20} /> <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>THROUGHPUT</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DCDCDD' }}>+340%</div>
            <p style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.35rem' }}>
              ASP.NET Core Kestrel thread pool handling concurrent transfer requests cleanly.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderTop: '3px solid #1985A1' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={20} /> <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ACCURACY</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DCDCDD' }}>100.00%</div>
            <p style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.35rem' }}>
              Zero floating-point balance inaccuracies thanks to strict <code>DECIMAL(18,2)</code> storage.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', borderTop: '3px solid #46494C' }}>
            <div style={{ color: '#1985A1', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GitBranch size={20} /> <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>TYPE SAFETY</span>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#DCDCDD' }}>Zero Nulls</div>
            <p style={{ fontSize: '0.82rem', color: '#C5C3C6', marginTop: '0.35rem' }}>
              TypeScript strict mode + C# reference types eliminated runtime null pointer exceptions.
            </p>
          </div>
        </div>

        {/* 2-Column Personal Growth & System Design Takeaways */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Takeaway A: Performance & Security Gains */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.15rem' }}>
              <div style={{ padding: '0.45rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.45rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD' }}>Performance & Security Gains</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: '#C5C3C6' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CheckCircle2 size={16} color="#1985A1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#DCDCDD' }}>LINQ & Query Optimization:</strong> Replaced client-side array filtering in JS with server-evaluated LINQ expressions in EF Core.
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CheckCircle2 size={16} color="#1985A1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#DCDCDD' }}>Enterprise Security Pipeline:</strong> Integrated ASP.NET Core Claims-Based authorization and Angular XSS sanitization.
                </div>
              </li>
            </ul>
          </div>

          {/* Takeaway B: Personal Growth & Architectural Mastery */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.15rem' }}>
              <div style={{ padding: '0.45rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.45rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <BookOpen size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD' }}>System Design Takeaways</h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: '#C5C3C6' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CheckCircle2 size={16} color="#1985A1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#DCDCDD' }}>Polyglot System Design:</strong> Evaluating when rapid-prototyping stacks (MERN) should transition into high-integrity enterprise engines (.NET/Angular).
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                <CheckCircle2 size={16} color="#1985A1" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#DCDCDD' }}>Clean Architecture:</strong> Decoupling enterprise business rules from UI frameworks and database persistence layers.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
