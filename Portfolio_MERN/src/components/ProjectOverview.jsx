import React from 'react';
import { Target, Layers, ArrowRightLeft, CreditCard, Shield, Landmark, Activity } from 'lucide-react';

export default function ProjectOverview() {
  return (
    <section id="overview" className="section-wrapper">
      <div className="container">
        {/* Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <span className="badge badge-teal">Step 1</span>
          <span style={{ fontSize: '0.82rem', color: '#C5C3C6' }}>The Hook & Architecture Overview</span>
        </div>

        <h2 className="section-title">1. The Project Overview</h2>
        <p className="section-subtitle">
          An enterprise-grade financial ledger and full-service banking platform built to handle secure user authentication, 
          multi-currency accounts, real-time fund transfers, transaction auditing, and loan management.
        </p>

        {/* 2-Column Grid: The Product & The Goal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Card A: The Product */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.5rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <Landmark size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#DCDCDD' }}>The Product</h3>
            </div>
            <p style={{ color: '#C5C3C6', fontSize: '0.92rem', lineHeight: 1.6 }}>
              The <strong>Banking System Platform</strong> is a complete financial application engineered for high-concurrency 
              account management. It allows users to register verified profiles, open checking/savings accounts, perform 
              instant peer-to-peer transfers with transaction locking, view real-time balance ledgers, calculate loan interest, 
              and review administrative audit logs.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(76, 92, 104, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#DCDCDD' }}>
                <CreditCard size={15} color="#1985A1" /> Account Ledgers
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#DCDCDD' }}>
                <ArrowRightLeft size={15} color="#1985A1" /> Atomic Transfers
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#DCDCDD' }}>
                <Shield size={15} color="#1985A1" /> JWT & RBAC Auth
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#DCDCDD' }}>
                <Activity size={15} color="#1985A1" /> Immutable Audit Logs
              </div>
            </div>
          </div>

          {/* Card B: The Goal */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '3px solid #1985A1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.5rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <Target size={22} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#DCDCDD' }}>The One-Sentence Goal</h3>
            </div>
            <blockquote style={{
              background: 'rgba(11, 17, 26, 0.8)',
              padding: '1.15rem',
              borderRadius: '0.65rem',
              borderLeft: '3px solid #1985A1',
              color: '#DCDCDD',
              fontSize: '0.98rem',
              fontWeight: 500,
              fontStyle: 'italic',
              lineHeight: 1.6
            }}>
              "To design, implement, and rigorously benchmark an immutable banking system—first rapid-prototyped using the MERN stack and subsequently re-architected into an enterprise-grade C# .NET, Angular, and SQL Server solution to satisfy strict financial ACID compliance, strong typing, and high concurrency demands."
            </blockquote>
            <div style={{ fontSize: '0.82rem', color: '#C5C3C6' }}>
              🎯 Purpose: Senior Full-Stack Engineering Showcase (System Design, Polyglot Architecture, Performance Optimization).
            </div>
          </div>
        </div>

        {/* Visual Tech Stack Layout: Version 1 vs Version 2 */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', color: '#DCDCDD', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="#1985A1" /> Dual Tech Stack Architectural Layout
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '1.25rem'
          }}>
            {/* Version 1: MERN Stack */}
            <div style={{
              background: 'rgba(11, 17, 26, 0.9)',
              borderRadius: '0.65rem',
              padding: '1.25rem',
              border: '1px solid rgba(76, 92, 104, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ color: '#DCDCDD', fontSize: '1.05rem', fontWeight: 700 }}>Version 1: MERN Stack</h4>
                <span className="badge badge-steel">Rapid Prototype</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Database:</strong>
                  <span style={{ color: '#C5C3C6' }}>MongoDB (NoSQL Document Store)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Backend:</strong>
                  <span style={{ color: '#C5C3C6' }}>Express.js + Node.js (REST API)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Frontend:</strong>
                  <span style={{ color: '#C5C3C6' }}>React.js (Hooks & Context API)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Type Safety:</strong>
                  <span style={{ color: '#5ec7e0' }}>Dynamic / Loose (JavaScript)</span>
                </li>
              </ul>
            </div>

            {/* Version 2: Enterprise Stack */}
            <div style={{
              background: 'rgba(25, 133, 161, 0.08)',
              borderRadius: '0.65rem',
              padding: '1.25rem',
              border: '1px solid rgba(25, 133, 161, 0.4)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ color: '#5ec7e0', fontSize: '1.05rem', fontWeight: 700 }}>Version 2: Enterprise Stack</h4>
                <span className="badge badge-teal">Enterprise Scale</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Database:</strong>
                  <span style={{ color: '#DCDCDD' }}>SQL Server (SSMS Relational Tables)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Backend:</strong>
                  <span style={{ color: '#DCDCDD' }}>C# ASP.NET Core 10 + EF Core</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Frontend:</strong>
                  <span style={{ color: '#DCDCDD' }}>Angular 22 (RxJS & Dependency Injection)</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <strong style={{ minWidth: '90px', color: '#808e9b' }}>Type Safety:</strong>
                  <span style={{ color: '#5ec7e0', fontWeight: 600 }}>Strictly Typed (TypeScript & C#)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
