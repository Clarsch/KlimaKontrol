import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 2rem;
  margin: 2rem;
  background-color: #fff3f3;
  border: 1px solid #ff0000;
  border-radius: 8px;
  text-align: center;
`;

const ErrorTitle = styled.h2`
  color: #ff0000;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: #666;
  margin-bottom: 1rem;
`;

const RetryButton = styled.button`
  background-color: #005670;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #004560;
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>{this.state.error?.message || 'An unexpected error occurred'}</ErrorMessage>
          <RetryButton onClick={this.handleRetry}>Retry</RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 