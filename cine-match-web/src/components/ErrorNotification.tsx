import React from 'react';

interface ErrorProps {
  message: string;
  onClose: () => void;
}

export const ErrorNotification: React.FC<ErrorProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="error-notification">
      <p>{message}</p>
      <button onClick={onClose}>&times;</button>
    </div>
  );
};
