import React, { useState } from 'react';
import { formatSummaryGrouped } from './MessageFormatters';

const SummaryWithDiagram = ({ summary, diagramUrl }) => {
  const [showDiagram, setShowDiagram] = useState(false);

  return (
    <div>
      {formatSummaryGrouped(summary)}
      <div style={{ textAlign: 'left', marginTop: '18px' }}>
        {diagramUrl && (
          <button
            className="diagram-btn"
            style={{
              background: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
            onClick={() => setShowDiagram((prev) => !prev)}
          >
            {showDiagram ? 'Hide Flow Chart' : 'Show Summary Flow Chart'}
          </button>
        )}
        {showDiagram && diagramUrl && (
          <div>
            <img
              src={diagramUrl}
              alt="Flow Chart"
              style={{
                maxWidth: '100%',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 8px #eee',
                marginTop: '10px'
              }}
            />
            <div style={{ marginTop: '8px', fontWeight: 500, color: '#1976d2' }}>
              Flow Chart (Diagram represents project structure)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryWithDiagram;