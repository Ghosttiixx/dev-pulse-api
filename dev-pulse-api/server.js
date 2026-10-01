import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});


app.get('/api/v1/info', (req, res) => {
    res.json({
        name: 'DevPulse API',
        version: '1.0.0',
        description: 'Starter microservice ready for expansion.'
    });
});

app.get('/', (req, res) => {
    res.send('<h1>DevPulse API is running 🚀</h1><p>Try /api/health or /api/v1/info</p>');
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});