import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
    getEvents, addEvent, deleteEvent,
    getGalleryItems, addGalleryItem, deleteGalleryItem,
    saveContact, getContacts,
    createAdmin, getAdminByUsername, getAdminById
} from '../database';
import { authenticateAdmin, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ==================== Authentication ====================
router.post('/auth/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin: username, email, password' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, error: 'Định dạng email không hợp lệ' });
        }

        const existingAdmin = await getAdminByUsername(username);
        if (existingAdmin) {
            return res.status(400).json({ success: false, error: 'Username đã tồn tại' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const adminId = await createAdmin(username, email, passwordHash);
        const token = generateToken(adminId, username);

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản admin thành công',
            token,
            admin: { id: adminId, username, email }
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: error.message || 'Lỗi đăng ký' });
    }
});

router.post('/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Thiếu username hoặc password' });
        }

        const admin = await getAdminByUsername(username);
        if (!admin) {
            return res.status(401).json({ success: false, error: 'Sai username hoặc password' });
        }

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, error: 'Sai username hoặc password' });
        }

        const token = generateToken(admin.id, admin.username);

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            admin: { id: admin.id, username: admin.username, email: admin.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Lỗi đăng nhập' });
    }
});

// ==================== Events ====================
router.get('/events', async (req: Request, res: Response) => {
    try {
        const events = await getEvents();
        res.json({ success: true, data: events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, error: 'Lỗi tải hoạt động' });
    }
});

router.post('/events', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { date, title, description, category } = req.body;

        if (!date || !title || !description || !category) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin: date, title, description, category' });
        }

        const eventId = await addEvent(date, title, description, category);
        res.status(201).json({ success: true, message: 'Thêm hoạt động thành công', id: eventId });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, error: 'Lỗi tạo hoạt động' });
    }
});

router.delete('/events/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

        await deleteEvent(id);
        res.json({ success: true, message: 'Xóa hoạt động thành công' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, error: 'Lỗi xóa hoạt động' });
    }
});

// ==================== Gallery ====================
router.get('/gallery', async (req: Request, res: Response) => {
    try {
        const items = await getGalleryItems();
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error fetching gallery:', error);
        res.status(500).json({ success: false, error: 'Lỗi tải thư viện ảnh' });
    }
});

router.post('/gallery', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl, label, order } = req.body;

        if (!imageUrl || !label) {
            return res.status(400).json({ success: false, error: 'Thiếu imageUrl hoặc label' });
        }

        const itemId = await addGalleryItem(imageUrl, label, order || 0);
        res.status(201).json({ success: true, message: 'Thêm hình ảnh thành công', id: itemId });
    } catch (error) {
        console.error('Error adding gallery item:', error);
        res.status(500).json({ success: false, error: 'Lỗi thêm hình ảnh' });
    }
});

router.delete('/gallery/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ success: false, error: 'ID không hợp lệ' });

        await deleteGalleryItem(id);
        res.json({ success: true, message: 'Xóa hình ảnh thành công' });
    } catch (error) {
        console.error('Error deleting gallery item:', error);
        res.status(500).json({ success: false, error: 'Lỗi xóa hình ảnh' });
    }
});

// ==================== Contacts ====================
router.post('/contact', async (req: Request, res: Response) => {
    try {
        const { name, email, phone, message, type = 'inquiry' } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, error: 'Thiếu thông tin: name, email, message' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, error: 'Định dạng email không hợp lệ' });
        }

        const contactId = await saveContact(name, email, phone || null, message, type);
        res.status(201).json({ success: true, message: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm!', id: contactId });
    } catch (error) {
        console.error('Error saving contact:', error);
        res.status(500).json({ success: false, error: 'Lỗi lưu tin nhắn' });
    }
});

// GET /contacts — protected, for admin panel
router.get('/contacts', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const contacts = await getContacts();
        res.json({ success: true, data: contacts });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, error: 'Lỗi tải danh sách liên hệ' });
    }
});

// ==================== Health Check ====================
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', service: 'Chùa Chính Phước API', timestamp: new Date().toISOString() });
});

export default router;