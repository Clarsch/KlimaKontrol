# CORS Configuration for KlimaKontrol Backend

This document outlines the complete CORS configuration implemented for the KlimaKontrol backend server.

## Features Implemented

### 1. Enhanced CORS Configuration
- **Credentials Support**: Enabled `credentials: true` for cookie and authentication support
- **Flexible Origins**: Configurable via environment variables or defaults
- **Comprehensive Headers**: Support for Authorization, Content-Type, and ngrok headers
- **Preflight Handling**: Proper OPTIONS request handling

### 2. Authentication System
- **JWT Access Tokens**: 15-minute expiry for security
- **Refresh Tokens**: 7-day expiry with httpOnly cookies
- **Token Refresh Endpoint**: Automatic token renewal
- **Authentication Middleware**: Protected route access

### 3. File Upload Support
- **Multer Integration**: Memory storage with 10MB limit
- **File Type Validation**: CSV and JSON files only
- **Secure Uploads**: Authentication required for all upload operations
- **File Management**: List, download, and delete uploaded files

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
REFRESH_TOKEN_SECRET=your-refresh-token-secret-change-this-in-production

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Origins (comma-separated)
CORS_ORIGINS=https://klima-kontrol-five.vercel.app,http://localhost:3000,http://localhost:5173,http://localhost:4173
```

### Default CORS Origins
- `https://klima-kontrol-five.vercel.app` - Production frontend
- `http://localhost:3000` - Local development
- `http://localhost:5173` - Vite dev server
- `http://localhost:4173` - Vite preview server
- `http://127.0.0.1:5173` - Alternative localhost
- `http://127.0.0.1:3000` - Alternative localhost

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with access and refresh tokens
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/logout` - Logout and clear refresh token

### Testing
- `GET /api/test` - Test endpoint to verify CORS configuration

### File Upload
- `POST /api/upload/file` - Upload file (requires authentication)
- `GET /api/upload/files` - List uploaded files (requires authentication)
- `GET /api/upload/files/:fileName` - Download file (requires authentication)
- `DELETE /api/upload/files/:fileName` - Delete file (requires authentication)

## Security Features

### CORS Security
- **Origin Validation**: Only allowed origins can make requests
- **Credential Support**: Secure cookie handling
- **Header Validation**: Only necessary headers allowed
- **Method Restriction**: Only required HTTP methods allowed

### Authentication Security
- **Short-lived Access Tokens**: 15-minute expiry
- **Secure Refresh Tokens**: httpOnly cookies with 7-day expiry
- **Token Validation**: JWT signature verification
- **Automatic Refresh**: Seamless token renewal

### File Upload Security
- **Authentication Required**: All upload operations require valid tokens
- **File Type Validation**: Only CSV and JSON files allowed
- **Size Limits**: 10MB maximum file size
- **Secure Storage**: Files stored in protected directory

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp config/env.example .env
```

3. Update environment variables in `.env`

4. Start the server:
```bash
npm start
```

## Testing

### CORS Testing
```bash
# Test from allowed origin
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3000/api/auth/login

# Test from disallowed origin (should fail)
curl -H "Origin: https://malicious-site.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3000/api/auth/login
```

### Authentication Testing
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"your-username","password":"your-password"}'

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
     -H "Cookie: refreshToken=your-refresh-token"
```

## Production Deployment

### Environment Variables
Set these in your production environment:
- `JWT_SECRET` - Strong, unique secret for access tokens
- `REFRESH_TOKEN_SECRET` - Strong, unique secret for refresh tokens
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `NODE_ENV=production`

### Security Considerations
- Use HTTPS in production
- Set secure cookie flags for production
- Rotate JWT secrets regularly
- Monitor CORS origins for unauthorized access
- Implement rate limiting for authentication endpoints

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check that your frontend URL is in the CORS_ORIGINS list
2. **Authentication Failures**: Verify JWT secrets are set correctly
3. **File Upload Issues**: Check file size limits and authentication
4. **Cookie Issues**: Ensure credentials are enabled in frontend requests

### Debug Mode
Set `NODE_ENV=development` to see detailed error messages in responses.
