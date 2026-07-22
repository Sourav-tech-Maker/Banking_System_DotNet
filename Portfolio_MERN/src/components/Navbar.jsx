import React, { useState, useEffect } from 'react';
import { Code2, Award, Menu, X } from 'lucide-react';

export default function Navbar({ activeSection, setActiveSection }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'overview', label: '1. Overview' },
    { id: 'motivation', label: '2. Motivation' },
    { id: 'migration', label: '3. Migration' },
    { id: 'comparison', label: '4. Tech Proof' },
    { id: 'results', label: '5. Results' },
  ];

  const scrollTo = (id) => {
    setActiveSection(id);
    setMobileOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled ? 'rgba(17, 23, 32, 0.94)' : 'rgba(10, 14, 19, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(76, 92, 104, 0.5)' : '1px solid rgba(76, 92, 104, 0.2)',
        padding: '0.75rem 0'
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1985A1 0%, #4C5C68 100%)',
            border: '1px solid #C5C3C6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#DCDCDD',
            boxShadow: '0 4px 12px rgba(25, 133, 161, 0.3)'
          }}>
            <Code2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', color: '#DCDCDD', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Sourav <span className="badge badge-teal" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>Senior Engineer</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#C5C3C6' }}>Full-Stack Architectural Portfolio</div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav style={{ display: 'flex', gap: '0.25rem' }} className="desktop-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`tab-btn ${activeSection === item.id ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right CTA / Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            onClick={() => scrollTo('mentor')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Award size={15} /> Mentor Review
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#DCDCDD',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'none'
            }}
            className="mobile-toggle"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div style={{
          background: '#111720',
          borderBottom: '1px solid #4C5C68',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`tab-btn ${activeSection === item.id ? 'active' : ''}`}
              style={{ textAlign: 'left', width: '100%' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
