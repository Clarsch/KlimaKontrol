import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  padding: 1rem;
  background-color: #fff3f3;
  border: 1px solid #ff0000;
  border-radius: 4px;
  text-align: center;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

class GraphErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Graph error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          Failed to load graph. Please try refreshing the page.
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default GraphErrorBoundary; 