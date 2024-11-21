import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #005670;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  color: #005670;
  margin-top: 1rem;
`;

const LoadingState = ({ message = 'Loading...' }) => (
  <LoadingContainer>
    <Spinner />
    <LoadingText>{message}</LoadingText>
  </LoadingContainer>
);

export default LoadingState; 