import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { Link } from 'react-router-dom';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 80px; // Add space for fixed TopBar
`;

const UploadContainer = styled.div`
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const DropZone = styled.div`
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 3rem 2rem;  // Increased padding to make the drop zone larger
  text-align: center;
  margin: 2rem 0;      // Increased margin
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: ${props => props.$isDragActive ? 'rgba(0, 86, 112, 0.1)' : '#f5f5f5'};
  border-color: ${props => props.$isDragActive ? '#005670' : '#ccc'};

  &:hover {
    border-color: #005670;
    background-color: rgba(0, 86, 112, 0.05);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const UploadButton = styled.button`
  background-color: #005670;
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-top: 1rem;

  &:hover {
    background-color: #004560;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FileInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #005670;
`;

const ErrorMessage = styled.div`
  color: #FF0000;
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: #FFE8E8;
  border-radius: 4px;
`;

const SuccessMessage = styled.div`
  color: #00FF00;
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: #E8FFE8;
  border-radius: 4px;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin: 1.5rem 0;
`;

const FileSelectButton = styled.button`
  background-color: #005670;
  color: white;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #004560;
  }
`;

const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackLink = styled(Link)`
  color: #005670;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h2`
  color: #005670;
  margin-bottom: 1.5rem;
`;

const FileContent = styled.div`
  color: #005670;
  margin: 1rem 0;

  p {
    margin: 0.5rem 0;
  }

  .file-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .instruction {
    color: #666;
    font-size: 0.9rem;
  }
`;

const Upload = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (file) => {
    setError('');
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(file);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!user || !user.locations || !user.locations[0]) {
      setError('User location not found. Please try logging in again.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('location', user.locations[0]);

    try {
      const response = await axios.post('http://localhost:5001/api/data/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('File uploaded successfully!');
      setFile(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user || !user.locations) {
    return (
      <PageContainer>
        <TopBar locationName="Error" />
        <UploadContainer>
          <ErrorMessage>
            User data not found. Please try logging in again.
          </ErrorMessage>
        </UploadContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TopBar locationName={user.locations[0] || "Upload Data"} />
      <UploadContainer>
        <NavigationContainer>
          <BackLink to="/dashboard">← Back to Dashboard</BackLink>
          <Title>Upload Data for {user.locations[0]}</Title>
        </NavigationContainer>

        <DropZone
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          $isDragActive={isDragActive}
          onClick={() => document.getElementById('file-input').click()}
        >
          <FileContent>
            {file ? (
              <>
                <div className="file-icon">📄</div>
                <p><strong>Selected file:</strong> {file.name}</p>
                <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                <p className="instruction">Click or drag a new file to replace</p>
              </>
            ) : (
              <>
                <div className="file-icon">📁</div>
                <p>Drag & drop your CSV file here</p>
                <p className="instruction">or click anywhere in this area to select a file</p>
              </>
            )}
          </FileContent>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </DropZone>

        <UploadButton
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Data'}
        </UploadButton>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </UploadContainer>
    </PageContainer>
  );
};

export default Upload; 