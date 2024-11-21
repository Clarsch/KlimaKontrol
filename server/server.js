const express = require('express');
const cors = require('cors');

async function startServer() {
    try {
        const app = await require('./app');
        const port = process.env.PORT || 5001;
        
        // CORS configuration
        const corsOptions = {
            origin: [
                'https://klima-kontrol-five.vercel.app',
                'http://localhost:5173'
            ],
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
            exposedHeaders: ['Access-Control-Allow-Origin']
        };

        app.use(cors(corsOptions));
        app.options('*', cors(corsOptions));
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 