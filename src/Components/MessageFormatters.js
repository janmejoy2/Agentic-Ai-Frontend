import React from 'react';

export function formatSummaryGrouped(summary) {
  const sections = summary.split('\n\n* ').map(s => s.trim().replace(/^\* /, ''));
  return (
    <div>
      <strong>Summary:</strong>
      <ul>
        {sections.map((section, idx) => {
          const [heading, ...rest] = section.split(':');
          const cleanHeading = heading.replace(/^\*+\s*/, '').replace(/\*+/g, '').trim();
          const content = rest.join(':').trim();
          return (
            <li key={idx}>
              <strong>{cleanHeading}:</strong>
              <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                {content
                  .split('\n')
                  .filter(line => line.trim())
                  .map((line, i) => (
                    <div key={i}>{line.replace(/^\*+\s*/, '').replace(/\*+/g, '').trim()}</div>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function formatMrDetails(details, data) {

  //  const diagramUrl = data.plantuml_png
  //   ? `file:///C:/Users/ypragna/Agentic%20recent/Agentic-Ai-Backend/diagrams/${data.plantuml_png.split('\\').pop()}`
  //   : null;
const diagramUrl = data.plantuml_png
  ? `http://localhost:5000/diagrams/${data.plantuml_png.split('\\').pop()}`
  : null;
  
  const diagramName = 'Flow Chart';

  const openDiagram = () => {
  if (diagramUrl) {
    console.log('Opening flow chart at:', diagramUrl); // Log the file path
    window.open(diagramUrl, '_blank', 'noopener,noreferrer');
  }
};

  // Format MR details similar to summary
  const sections = details
    .replace(/\*/g, '')
    .split(/\n\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return (
    <div>
      <strong>MR Details:</strong>
      <ul>
        {sections.map((section, idx) => {
          const [heading, ...rest] = section.split(':');
          const cleanHeading = heading.trim();
          const content = rest.join(':').trim();
          return (
            <li key={idx}>
              <strong>{cleanHeading}{content ? ':' : ''}</strong>
              {content && (
                <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                  {content
                    .split('\n')
                    .filter(line => line.trim())
                    .map((line, i) => (
                      <div key={i}>{line.trim()}</div>
                    ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        {data.mr_link && (
          <button
            type="button"
            className="diagram-btn"
            onClick={() => window.open(data.mr_link, '_blank', 'noopener,noreferrer')}
          >
            Merge Request
          </button>
        )}
        {data.actuator_health_url && (
          <button
            type="button"
            className="diagram-btn"
            onClick={() => window.open(data.actuator_health_url, '_blank', 'noopener,noreferrer')}
          >
            API Health
          </button>
        )}
        {diagramUrl && (
          <button
            type="button"
            className="diagram-btn"
            onClick={openDiagram}
          >
            {diagramName}
          </button>
        )}
      </div>
    </div>
  );
}