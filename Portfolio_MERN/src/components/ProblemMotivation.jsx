import React from 'react';
import { AlertTriangle, Scale, Lock } from 'lucide-react';

export default function ProblemMotivation() {
  return (
    <section id="motivation" className="section-wrapper" style={{ background: 'rgba(17, 23, 32, 0.4)' }}>
      <div className="container">
        {/* Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <span className="badge badge-steel">Step 2</span>
          <span style={{ fontSize: '0.82rem', color: '#C5C3C6' }}>The "Why" & Architectural Rationale</span>
        </div>

        <h2 className="section-title">2. The Problem & Motivation</h2>
        <p className="section-subtitle">
          While MERN provided rapid prototyping capabilities, scaling a financial core system required enterprise guarantees 
          in transaction safety, schema enforcement, and type resilience.
        </p>

        {/* 3 Core Drivers Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {/* Driver 1: The Trigger */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.45rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.45rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#DCDCDD' }}>1. The Trigger</h3>
            </div>
            <p style={{ color: '#C5C3C6', fontSize: '0.9rem', lineHeight: 1.6 }}>
              In a core banking environment, a balance transfer between Account A and Account B must be <strong>atomic, isolated, and strictly durable</strong>. 
              Under high concurrent stress testing in MERN, MongoDB required complex multi-document transaction sessions with replica set overhead, raising the risk of balance race conditions during net-speed fluctuations.
            </p>
          </div>

          {/* Driver 2: The Tradeoffs */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.45rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.45rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <Scale size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#DCDCDD' }}>2. The Tradeoffs</h3>
            </div>
            <p style={{ color: '#C5C3C6', fontSize: '0.9rem', lineHeight: 1.6 }}>
              MERN excels in speed of iteration, loose schema flexibility, and single-language JavaScript unification. However, 
              for banking ledgers, <strong>schema flexibility becomes a vulnerability</strong>. Missing property validations or implicit JavaScript type coercions (e.g. <code>"500" + 50 = "50050"</code>) are catastrophic for accounting systems.
            </p>
          </div>

          {/* Driver 3: Enterprise Needs */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.45rem', background: 'rgba(25, 133, 161, 0.2)', borderRadius: '0.45rem', color: '#1985A1', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <Lock size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#DCDCDD' }}>3. Enterprise Grade Needs</h3>
            </div>
            <p style={{ color: '#C5C3C6', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Enterprise financial applications require strict compile-time safety, Dependency Injection, native Object-Relational Mapping (ORM) tracking, audit log triggers at database level, and modular enterprise component architecture like Angular and C# .NET.
            </p>
          </div>
        </div>

        {/* Deep Dive Architectural Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Flexible NoSQL vs Structured SQL */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#DCDCDD' }}>
                Argument A: Flexible NoSQL ➔ Structured SQL
              </h4>
              <span className="badge badge-teal">ACID Guarantee</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'rgba(11, 17, 26, 0.8)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(76, 92, 104, 0.4)' }}>
                <div style={{ fontSize: '0.78rem', color: '#808e9b', fontWeight: 700, marginBottom: '0.5rem' }}>MONGODB (NO-SQL)</div>
                <ul style={{ fontSize: '0.82rem', color: '#C5C3C6', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li>❌ Unstructured JSON documents</li>
                  <li>❌ Eventual consistency default</li>
                  <li>❌ High session memory overhead</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(25, 133, 161, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <div style={{ fontSize: '0.78rem', color: '#5ec7e0', fontWeight: 700, marginBottom: '0.5rem' }}>SQL SERVER / SSMS</div>
                <ul style={{ fontSize: '0.82rem', color: '#DCDCDD', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li>✅ Strict relational tables & FKs</li>
                  <li>✅ 100% ACID transactional isolation</li>
                  <li>✅ Exact Decimal precision</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Card 2: Dynamic JS vs Strongly Typed C# & TS */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#DCDCDD' }}>
                Argument B: Dynamic JS ➔ Strongly-Typed C#
              </h4>
              <span className="badge badge-teal">Zero Runtime Nulls</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'rgba(11, 17, 26, 0.8)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(76, 92, 104, 0.4)' }}>
                <div style={{ fontSize: '0.78rem', color: '#808e9b', fontWeight: 700, marginBottom: '0.5rem' }}>EXPRESS & REACT (JS)</div>
                <ul style={{ fontSize: '0.82rem', color: '#C5C3C6', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li>❌ Runtime type evaluation</li>
                  <li>❌ Silent undefined property access</li>
                  <li>❌ Ad-hoc prop types maintenance</li>
                </ul>
              </div>

              <div style={{ background: 'rgba(25, 133, 161, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <div style={{ fontSize: '0.78rem', color: '#5ec7e0', fontWeight: 700, marginBottom: '0.5rem' }}>.NET & ANGULAR (C# & TS)</div>
                <ul style={{ fontSize: '0.82rem', color: '#DCDCDD', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <li>✅ Compile-time type checking</li>
                  <li>✅ Strongly-typed DTO contracts</li>
                  <li>✅ Injectable RxJS services</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
