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
      <div>
        {data.mr_link && (
          <a href={data.mr_link} target="_blank" rel="noopener noreferrer">
            View Merge Request
          </a>
        )}
      </div>
      <div>
        {data.actuator_health_url && (
          <a href={data.actuator_health_url} target="_blank" rel="noopener noreferrer">
            View API Health
          </a>
        )}
      </div>
      <div>
      {data.plantuml_png && (
        <a
          href={`http://localhost:5000/diagrams/${data.plantuml_png.split('\\').pop()}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {data.plantuml_png.split('\\').pop()}
        </a>
      )}
      </div>
    </div>
  );
}