import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    adminId?: number;
    username?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export function generateToken(adminId: number, username: string): string {
    return jwt.sign({ adminId, username }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    req.adminId = decoded.adminId;
    req.username = decoded.username;
    next();
}
