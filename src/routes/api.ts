import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
    getEvents, addEvent, getGalleryItems, addGalleryItem, saveContact,
    createAdmin, getAdminByUsername, getAdminById
} from '../database';
import { authenticateAdmin, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ==================== Authentication Routes ====================
router.post('/auth/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: username, email, password'
            });
        }

        // Check if admin already exists
        const existingAdmin = await getAdminByUsername(username);
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists'
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const adminId = await createAdmin(username, email, passwordHash);

        const token = generateToken(adminId, username);

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            token,
            admin: { id: adminId, username, email }
        });
    } catch (error: any) {
        console.error('Error registering admin:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to register' });
    }
});

router.post('/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: username, password'
            });
        }

        const admin = await getAdminByUsername(username);
        if (!admin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password'
            });
        }

        const token = generateToken(admin.id, admin.username);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, error: 'Failed to login' });
    }
});

// ==================== Protected Events Routes ====================
router.get('/events', async (req: Request, res: Response) => {
    try {
        const events = await getEvents();
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch events' });
    }
});

router.post('/events', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { date, title, description, category } = req.body;

        if (!date || !title || !description || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: date, title, description, category'
            });
        }

        const eventId = await addEvent(date, title, description, category);
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            id: eventId
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, error: 'Failed to create event' });
    }
});

// ==================== Protected Gallery Routes ====================
router.get('/gallery', async (req: Request, res: Response) => {
    try {
        const items = await getGalleryItems();
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch gallery' });
    }
});

router.post('/gallery', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl, label, order } = req.body;

        if (!imageUrl || !label) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: imageUrl, label'
            });
        }

        const itemId = await addGalleryItem(imageUrl, label, order || 0);
        res.status(201).json({
            success: true,
            message: 'Gallery item added successfully',
            id: itemId
        });
    } catch (error) {
        console.error('Error adding gallery item:', error);
        res.status(500).json({ success: false, error: 'Failed to add gallery item' });
    }
});

// ==================== Contact Routes ====================
router.post('/contact', async (req: Request, res: Response) => {
    try {
        const { name, email, phone, message, type = 'inquiry' } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, email, message'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }

        const contactId = await saveContact(name, email, phone || null, message, type);
        res.status(201).json({
            success: true,
            message: 'Your message has been received. Thank you!',
            id: contactId
        });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ success: false, error: 'Failed to save message' });
    }
});

// ==================== Health Check ====================
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        service: 'Chùa Chính Phước API',
        timestamp: new Date().toISOString()
    });
});

export default router;
