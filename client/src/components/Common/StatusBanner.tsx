import React, { useState, useEffect } from 'react';

export const StatusBanner: React.FC = () => {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(res => res.json())
      .then(setStatus)
      .catch(() => setStatus({ status: 'error', message: 'Offline' }));
  }, []);

  if (!status || status.mode === 'mongodb') return null;

  return (
    <div className="status-banner">
      {status.message}
    </div>
  );
};
