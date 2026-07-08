import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import MappingReview from './components/MappingReview';
import Dashboard from './components/Dashboard';

function App() {
  const [currentStep, setCurrentStep] = useState('upload'); // 'upload', 'review', 'dashboard'
  const [sources, setSources] = useState([]);

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return <UploadScreen onComplete={(data) => { setSources(prev => [...prev, data]); setCurrentStep('review'); }} />;
      case 'review':
        return <MappingReview sources={sources} onComplete={() => setCurrentStep('dashboard')} onAddAnother={() => setCurrentStep('upload')} />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <UploadScreen onComplete={(data) => { setSources(prev => [...prev, data]); setCurrentStep('review'); }} />;
    }
  };

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: '3rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="logo flex items-center gap-4">
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
            AI
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>AIDE</h1>
        </div>
        <nav className="flex gap-4">
          <button className="btn btn-secondary" onClick={() => setCurrentStep('upload')}>New Source</button>
          <button className="btn btn-secondary" onClick={() => setCurrentStep('dashboard')}>Dashboard</button>
        </nav>
      </header>

      <main className="animate-fade-in">
        {renderStep()}
      </main>
    </div>
  );
}

export default App;
