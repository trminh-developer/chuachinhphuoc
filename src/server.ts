import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import path from 'path';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database configuration for SQL Server
const sqlConfig = {
    server: process.env.DB_HOST || 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: process.env.DB_USER || 'sa',
            password: process.env.DB_PASSWORD || ''
        }
    },
    options: {
        database: process.env.DB_NAME || 'chuachinhphuoc',
        trustServerCertificate: true,
        encrypt: true,
        connectionTimeout: 15000,
    }
};

export const dbPool = sql;


// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
    // Sử dụng path.join và __dirname để trỏ chính xác ra thư mục chứa index.html
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Admin route
app.get('/admin', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../Admin/admin.html'));
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, error: 'Not found' });
});

// Start server
async function start() {
    app.listen(PORT, () => {
        console.log(`🙏 Chùa Chính Phước server running on port ${PORT}`);
    });
}
start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

export default app;
