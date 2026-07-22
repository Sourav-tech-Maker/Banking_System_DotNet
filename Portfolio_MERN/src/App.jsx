import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProjectOverview from './components/ProjectOverview';
import ProblemMotivation from './components/ProblemMotivation';
import MigrationProcess from './components/MigrationProcess';
import TechnicalComparison from './components/TechnicalComparison';
import ResultsAndLessons from './components/ResultsAndLessons';
import MentorSubmission from './components/MentorSubmission';
import Footer from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <main style={{ flex: 1 }}>
        <Hero onExploreClick={scrollToSection} />
        <ProjectOverview />
        <ProblemMotivation />
        <MigrationProcess />
        <TechnicalComparison />
        <ResultsAndLessons />
        <MentorSubmission />
      </main>

      <Footer />
    </div>
  );
}
