import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import styled from 'styled-components';

const SuccessContainer = styled.div`
  background-color: #e8ffe8;
  border: 1px solid #00ff00;
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 4px;
  color: #008000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: ${props => props.$visible ? 1 : 0};
  transform: translateY(${props => props.$visible ? 0 : '10px'});
  transition: opacity 0.3s ease, transform 0.3s ease;
`;

const SuccessIcon = styled.span`
  font-size: 1.2rem;
`;

let timeoutId;

export const SuccessMessage = ({ children, onDismiss, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    timeoutId = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [duration, onDismiss]);

  return (
    <SuccessContainer $visible={visible}>
      <SuccessIcon>✓</SuccessIcon>
      {children}
    </SuccessContainer>
  );
};

export const showSuccess = (message, duration = 3000) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1000';
  document.body.appendChild(container);

  const root = createRoot(container);

  const handleDismiss = () => {
    root.unmount();
    document.body.removeChild(container);
  };

  root.render(
    <SuccessMessage onDismiss={handleDismiss} duration={duration}>
      {message}
    </SuccessMessage>
  );
}; 