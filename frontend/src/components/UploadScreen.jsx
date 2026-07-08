import React, { useState } from 'react';

function UploadScreen({ onComplete }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      // For now we send an empty array or a sample to the profiler
      // You can hook up a real CSV parser here later.
      const samplePayload = [
        {
          column_name: "email",
          source_table_name: "users",
          sample_values: ["test@example.com", "user@domain.com"]
        }
      ];

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(samplePayload),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      onComplete({ sourceId: 'src_123', schema: data });
    } catch (error) {
      console.error("Failed to profile schema:", error);
      alert("Error profiling schema. See console for details.");
    } finally {
      setIsUploading(false);
    }
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
