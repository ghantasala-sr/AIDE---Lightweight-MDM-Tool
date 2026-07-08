import React, { useState } from 'react';

function UploadScreen({ onComplete }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload and profiling API call
    setTimeout(() => {
      setIsUploading(false);
      onComplete({ sourceId: 'src_123', schema: 'mock_schema' });
    }, 2000);
  };

  return (
    <div className="flex-col items-center justify-center mt-8 text-center animate-fade-in">
      <h2>Connect Your Data Sources</h2>
      <p style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
        Upload a CSV or connect a database. Our AI will automatically infer the schema, identify primary match keys, and propose a canonical mapping for identity resolution.
      </p>

      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: 600, 
          padding: '4rem 2rem', 
          borderStyle: 'dashed',
          cursor: 'pointer'
        }}
        onClick={handleUpload}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
          📁
        </div>
        <h3 style={{ margin: 0 }}>Click to browse or drag and drop</h3>
        <p style={{ marginTop: '0.5rem' }}>CSV, JSON, or SQL DDL (max 50MB)</p>
        
        {isUploading && (
          <div className="mt-4 flex-col items-center gap-4">
            <div className="spinner" style={{ width: 30, height: 30, border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>AI is profiling your schema...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default UploadScreen;
