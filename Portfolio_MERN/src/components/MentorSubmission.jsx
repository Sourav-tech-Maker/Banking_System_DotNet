import React, { useState } from 'react';
import { Send, CheckCircle2, FileText, Download, UserCheck } from 'lucide-react';

export default function MentorSubmission() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    mentorName: '',
    rating: '5',
    feedback: '',
    recommendation: 'Strong Hire (Senior Full-Stack Developer)'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleDownloadSummary = () => {
    const content = `SENIOR FULL-STACK DEVELOPER PORTFOLIO - MENTOR REVIEW REPORT
Candidate: Sourav 
Project: Banking System Migration (MERN to Angular + C# .NET + SSMS)

1. PROJECT OVERVIEW:
- Product: Enterprise Banking Platform (Ledgers, Transfers, Auditing)
- Goal: Design and benchmark an immutable banking system migrated from MERN to .NET, Angular, and SSMS for ACID compliance.
- Stacks: MERN (Version 1) | Angular + C# ASP.NET Core 10 + SQL Server (Version 2)

2. PROBLEM & MOTIVATION:
- Trigger: Financial ledger integrity required atomic multi-account transactions and non-floating-point accuracy.
- Tradeoffs: NoSQL schema flexibility replaced with 3NF Relational Tables; dynamic JS replaced with C# & TS compile-time type safety.

3. STEP-BY-STEP MIGRATION:
- Database: BSON Documents mapped to 3NF SSMS Tables with DECIMAL(18,2) precision and Foreign Key constraints.
- Backend: Express JS routes refactored into ASP.NET Core Controllers with Entity Framework Core ORM & Clean Architecture.
- Frontend: React components transitioned to Angular 22 with RxJS Observables and Dependency Injection.

4. TECHNICAL COMPARISON:
- Architecture: React View Library vs Angular MVVM + Clean Architecture
- Type Safety: Loose JS vs Strict C# & TypeScript
- Storage: MongoDB Unstructured JSON vs SSMS Relational Tables

5. RESULTS & LESSONS:
- Query Latency: -68% reduction
- Concurrency: +340% throughput
- Financial Accuracy: 100% ACID compliant ledgers
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Senior_Engineer_Portfolio_Submission_Report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="mentor" className="section-wrapper" style={{ background: 'rgba(17, 23, 32, 0.4)' }}>
      <div className="container">
        {/* Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <span className="badge badge-teal">Mentor Review</span>
          <span style={{ fontSize: '0.82rem', color: '#C5C3C6' }}>Formal Project Submission & Evaluation</span>
        </div>

        <h2 className="section-title">Mentor Evaluation Portal</h2>
        <p className="section-subtitle">
          Submit feedback, review the candidate summary, or download the full architectural case study for mentor verification.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Form Side */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="#1985A1" /> Mentor Evaluation Form
            </h3>

            {submitted ? (
              <div style={{ background: 'rgba(25, 133, 161, 0.1)', border: '1px solid rgba(25, 133, 161, 0.4)', padding: '1.5rem', borderRadius: '0.65rem', textAlign: 'center' }}>
                <CheckCircle2 size={40} color="#1985A1" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1.15rem', color: '#DCDCDD', fontWeight: 700 }}>Evaluation Submitted!</h4>
                <p style={{ color: '#C5C3C6', marginTop: '0.4rem', fontSize: '0.88rem' }}>
                  Thank you for reviewing the candidate's portfolio.
                </p>
                <button 
                  onClick={() => setSubmitted(false)} 
                  className="btn btn-secondary" 
                  style={{ marginTop: '1.25rem', fontSize: '0.85rem' }}
                >
                  Submit Another Review
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#C5C3C6', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Mentor / Reviewer Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Tech Lead / Mentor"
                    value={formData.mentorName}
                    onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      background: '#070a0e',
                      border: '1px solid var(--border-color)',
                      color: '#DCDCDD',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#C5C3C6', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Evaluation Rating:
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      background: '#070a0e',
                      border: '1px solid var(--border-color)',
                      color: '#DCDCDD',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Exceeds Expectations (Senior Engineer)</option>
                    <option value="4">⭐⭐⭐⭐ Meets Senior Expectations</option>
                    <option value="3">⭐⭐⭐ Solid Mid-Level Performance</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#C5C3C6', marginBottom: '0.35rem', fontWeight: 500 }}>
                    Mentor Notes:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter review comments on code quality and migration steps..."
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '0.5rem',
                      background: '#070a0e',
                      border: '1px solid var(--border-color)',
                      color: '#DCDCDD',
                      fontSize: '0.88rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                  <Send size={16} /> Submit Formal Review
                </button>
              </form>
            )}
          </div>

          {/* Submission Info & Download Side */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#1985A1" /> Verification Package
              </h3>
              <p style={{ color: '#C5C3C6', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                This portfolio contains all mandatory steps required by the mentor:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DCDCDD' }}>
                  <CheckCircle2 size={15} color="#1985A1" /> 1. Project Overview & Goal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DCDCDD' }}>
                  <CheckCircle2 size={15} color="#1985A1" /> 2. Problem & Motivation (NoSQL vs SQL)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DCDCDD' }}>
                  <CheckCircle2 size={15} color="#1985A1" /> 3. Step-by-Step Migration
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DCDCDD' }}>
                  <CheckCircle2 size={15} color="#1985A1" /> 4. Technical Comparison
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DCDCDD' }}>
                  <CheckCircle2 size={15} color="#1985A1" /> 5. Key Results & Lessons Learned
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(76, 92, 104, 0.4)' }}>
              <button onClick={handleDownloadSummary} className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem' }}>
                <Download size={16} /> Download Summary (TXT)
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
