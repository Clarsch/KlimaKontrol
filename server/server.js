const express = require('express');
const { verifyDataStructure } = require('./utils/dataStructure');

async function startServer() {
    try {
        await verifyDataStructure();
        const app = await require('./app');
        const port = process.env.PORT || 5001;
        
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 