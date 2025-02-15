import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import TopBar from '../components/TopBar';
import axiosInstance from '../api/axiosConfig';
import { useTranslation } from 'react-i18next';
const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ImageContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
`;

const FullPageImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
`;

const ErrorMessage = styled.div`
  color: #FF0000;
  position: absolute;
  top: 70px;
  right: 2rem;
  background-color: #FFE8E8;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  z-index: 10;
`;

const LoginForm = styled.form`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const Button = styled.button`
  padding: 0.5rem 1.5rem;
  background-color: #005670;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background-color: #004560;
  }
`;

const Login = () => {

  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post(`/api/auth/login`, {
        username,
        password
      });

      login(response.data.user, response.data.token);
      
      if (response.data.user.role === 'collector') {
        navigate('/upload');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <PageContainer>
      <ImageContainer>
        <FullPageImage 
          src={import.meta.env.VITE_LANDING_PAGE_BACKGROUND_IMAGE_URL}
          alt="Front page image" 
        />
      </ImageContainer>
      <TopBar>
        <LoginForm onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Brugernavn"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit">{t('login')}</Button>
        </LoginForm>
      </TopBar>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </PageContainer>
  );
};

export default Login; 