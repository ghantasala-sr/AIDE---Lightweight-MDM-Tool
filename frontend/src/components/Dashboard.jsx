import React from 'react';

const mockProfiles = [
  { id: 'g_1', name: 'John Doe', email: 'john.doe@example.com', sources: 3, confidence: 0.98, lastUpdated: '2 mins ago' },
  { id: 'g_2', name: 'Jane Smith', email: 'jane.s@acme.inc', sources: 2, confidence: 0.91, lastUpdated: '5 mins ago' },
  { id: 'g_3', name: 'Acme Corp', email: 'billing@acme.inc', sources: 4, confidence: 1.0, lastUpdated: '10 mins ago' },
];

function Dashboard() {
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2>Golden Profiles Dashboard</h2>
          <p>Unified customer records resolved across all connected sources.</p>
        </div>
        <button className="btn btn-primary">Export Data</button>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-secondary)' }}>Golden ID</th>
              <th style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-secondary)' }}>Name</th>
              <th style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-secondary)' }}>Primary Email</th>
              <th style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-secondary)' }}>Merged Sources</th>
              <th style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-secondary)' }}>Match Confidence</th>
            </tr>
          </thead>
          <tbody>
            {mockProfiles.map(profile => (
              <tr key={profile.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="hover-row">
                <td style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{profile.id}</td>
                <td style={{ padding: '16px 24px', fontWeight: 500 }}>{profile.name}</td>
                <td style={{ padding: '16px 24px' }}>{profile.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>
                    {profile.sources} sources
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 40, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${profile.confidence * 100}%`, height: '100%', background: 'var(--success)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem' }}>{Math.round(profile.confidence * 100)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .hover-row:hover {
          background: rgba(255, 255, 255, 0.02);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
