import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

function UploadScreen({ onComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleBoxClick = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data;
          const headers = results.meta.fields;
          
          if (!headers || headers.length === 0) {
            throw new Error("No columns found in CSV.");
          }

          // Build the payload for the AI Profiler
          // We need { column_name, source_table_name, sample_values }
          const payload = headers.map(header => {
            // Get up to 5 non-empty sample values for this column
            const sampleValues = data
              .map(row => row[header])
              .filter(val => val !== null && val !== undefined && val !== "")
              .slice(0, 5);

            return {
              column_name: header,
              source_table_name: file.name.replace('.csv', ''),
              sample_values: sampleValues
            };
          });

          const response = await fetch('/api/profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
          }

          const schemaMapping = await response.json();
          onComplete({ sourceId: file.name, schema: schemaMapping });
        } catch (error) {
          console.error("Failed to profile schema:", error);
          alert("Error profiling schema: " + error.message);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        console.error("CSV Parse error:", error);
        alert("Error parsing CSV.");
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="flex-col items-center justify-center mt-8 text-center animate-fade-in">
      <h2>Connect Your Data Sources</h2>
      <p style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
        Upload a CSV or connect a database. Our AI will automatically infer the schema, identify primary match keys, and propose a canonical mapping for identity resolution.
      </p>

      {/* Hidden file input */}
      <input 
        type="file" 
        accept=".csv" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      <div 
        className="glass-panel" 
        style={{ 
          width: '100%', 
          maxWidth: 600, 
          padding: '4rem 2rem', 
          borderStyle: 'dashed',
          cursor: isUploading ? 'wait' : 'pointer',
          pointerEvents: isUploading ? 'none' : 'auto'
        }}
        onClick={handleBoxClick}
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
