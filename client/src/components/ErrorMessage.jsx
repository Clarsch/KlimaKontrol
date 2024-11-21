import styled from 'styled-components';

const ErrorContainer = styled.div`
  background-color: #fff3f3;
  border: 1px solid #ff0000;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  color: #ff0000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorIcon = styled.span`
  font-size: 1.2rem;
`;

const ErrorMessage = ({ children }) => (
  <ErrorContainer>
    <ErrorIcon>⚠️</ErrorIcon>
    {children}
  </ErrorContainer>
);

export default ErrorMessage; 