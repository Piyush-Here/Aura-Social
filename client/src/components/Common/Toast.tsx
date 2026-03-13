import React from 'react';

interface ToastProps {
  message: string;
}

export const Toast: React.FC<ToastProps> = ({ message }) => (
  <div className="toast">
    {message}
  </div>
);
