import React, { useState } from 'react';

const mockProposals = [
  { id: 1, column: 'cust_eml', proposed: 'email', confidence: 0.97, reason: 'Matched on column name similarity and email-format sample values', status: 'pending' },
  { id: 2, column: 'fst_nm', proposed: 'first_name', confidence: 0.92, reason: 'Sample values resemble common first names', status: 'pending' },
  { id: 3, column: 'phn_num', proposed: 'phone', confidence: 0.88, reason: 'Numeric patterns match standard phone formats', status: 'pending' },
];

function MappingReview({ data, onComplete }) {
  const [proposals, setProposals] = useState(mockProposals);

  const handleAction = (id, action) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status: action } : p));
  };

  const pendingCount = proposals.filter(p => p.status === 'pending').length;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2>Review AI Mapping Proposals</h2>
          <p>The AI has analyzed your source and proposed the following canonical fields.</p>
        </div>
        <div className="glass-panel" style={{ padding: '10px 20px', display: 'inline-block' }}>
          <span style={{ fontWeight: 'bold', color: pendingCount === 0 ? 'var(--success)' : 'var(--warning)' }}>
            {pendingCount}
          </span> items need review
        </div>
      </div>

      <div className="flex-col gap-4">
        {proposals.map(proposal => (
          <div key={proposal.id} className="glass-panel flex justify-between items-center transition" style={{ 
            borderLeft: proposal.status === 'approved' ? '4px solid var(--success)' : proposal.status === 'rejected' ? '4px solid var(--error)' : '4px solid var(--accent-primary)' 
          }}>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-4 mb-2">
                <span style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 4 }}>
                  {proposal.column}
                </span>
                <span>→</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {proposal.proposed}
                </span>
                <span style={{ background: proposal.confidence > 0.9 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: proposal.confidence > 0.9 ? 'var(--success)' : 'var(--warning)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {Math.round(proposal.confidence * 100)}% Match
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--accent-secondary)' }}>AI Reasoning:</span> {proposal.reason}
              </p>
            </div>
            
            <div className="flex gap-4">
              {proposal.status === 'pending' ? (
                <>
                  <button className="btn btn-secondary" onClick={() => handleAction(proposal.id, 'rejected')}>Reject</button>
                  <button className="btn btn-primary" onClick={() => handleAction(proposal.id, 'approved')}>Accept</button>
                </>
              ) : (
                <span style={{ 
                  color: proposal.status === 'approved' ? 'var(--success)' : 'var(--error)',
                  fontWeight: 'bold', textTransform: 'capitalize' 
                }}>
                  {proposal.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button 
          className="btn btn-primary" 
          style={{ padding: '12px 32px', fontSize: '1.1rem' }}
          disabled={pendingCount > 0}
          onClick={onComplete}
        >
          Run Identity Resolution Engine
        </button>
      </div>
    </div>
  );
}

export default MappingReview;
