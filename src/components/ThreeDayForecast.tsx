'use client';

import React from 'react';

// Minimal props, can be expanded later
interface ThreeDayForecastProps {
  expanded?: boolean;
}

const ThreeDayForecast: React.FC<ThreeDayForecastProps> = ({ expanded }) => {
  return (
    <div style={{ padding: '1rem', border: '1px dashed #555', borderRadius: '8px', margin: '1rem 0' }}>
      <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>3-Day Forecast (Placeholder)</h4>
      <p style={{ fontSize: '0.9rem', color: '#aaa' }}>
        {expanded ? 'Detailed forecast view here.' : 'Compact summary here.'}
      </p>
    </div>
  );
};

export default ThreeDayForecast; 