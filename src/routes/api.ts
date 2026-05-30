import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
    getEvents, addEvent, updateEvent, deleteEvent,
    getEventById,
    getGalleryItems, addGalleryItem, updateGalleryItem, deleteGalleryItem,
    saveContact, getContacts, deleteContact,
    createAdmin, getAdminByUsername
} from '../database';
import { authenticateAdmin, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// =============================================================================
// Standardized Response Helper
// =============================================================================
interface ApiResponse {
    success: boolean;
    data?: any;
    message?: string;
    error?: string;
}

function sendResponse(res: Response, statusCode: number, success: boolean, data?: any, message?: string, error?: string): void {
    const response: ApiResponse = { success };
    if (data !== undefined) response.data = data;
    if (message) response.message = message;
    if (error) response.error = error;
    res.status(statusCode).json(response);
}

// =============================================================================
// Authentication
// =============================================================================
router.post('/auth/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu thông tin: username, email, password');
        }

        if (typeof username !== 'string' || username.trim().length < 3) {
            return sendResponse(res, 400, false, undefined, undefined, 'Username phải có ít nhất 3 ký tự');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendResponse(res, 400, false, undefined, undefined, 'Định dạng email không hợp lệ');
        }

        if (typeof password !== 'string' || password.length < 6) {
            return sendResponse(res, 400, false, undefined, undefined, 'Mật khẩu phải có ít nhất 6 ký tự');
        }

        const existingAdmin = await getAdminByUsername(username.trim());
        if (existingAdmin) {
            return sendResponse(res, 400, false, undefined, undefined, 'Username đã tồn tại');
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const adminId = await createAdmin(username.trim(), email.trim(), passwordHash);
        const token = generateToken(adminId, username.trim());

        sendResponse(res, 201, true, { id: adminId, username: username.trim(), email: email.trim(), token }, 'Tạo tài khoản admin thành công');
        return;
    } catch (error: any) {
        console.error('❌ Register error:', error);
        return sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi đăng ký');
    }
});

router.post('/auth/login', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu username hoặc password');
        }

        const admin = await getAdminByUsername(username.trim());
        if (!admin) {
            return sendResponse(res, 401, false, undefined, undefined, 'Sai username hoặc password');
        }

        const passwordMatch = await bcrypt.compare(password, admin.password_hash);
        if (!passwordMatch) {
            return sendResponse(res, 401, false, undefined, undefined, 'Sai username hoặc password');
        }

        const token = generateToken(admin.id, admin.username);

        sendResponse(res, 200, true, { id: admin.id, username: admin.username, email: admin.email, token }, 'Đăng nhập thành công');
        return;
    } catch (error: any) {
        console.error('❌ Login error:', error);
        return sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi đăng nhập');
    }
});

// =============================================================================
// File Upload (Supabase Storage)
// =============================================================================
router.post('/upload-token', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu tên file');
        }

        const SUPABASE_URL = process.env.POSTGRES_URL_SUPABASE_URL;
        const SERVICE_KEY = process.env.POSTGRES_URL_SUPABASE_SERVICE_ROLE_KEY;

        if (!SUPABASE_URL || !SERVICE_KEY) {
            return sendResponse(res, 500, false, undefined, undefined, 'Cấu hình Server thiếu thông tin Supabase Storage');
        }

        // Tạo tên file an toàn và duy nhất
        const safeFilename = Date.now() + '-' + filename.replace(/[^a-zA-Z0-9.-]/g, '_');

        // Gọi Supabase API để lấy Signed Upload URL
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/uploads/${safeFilename}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Supabase API error: ${errorText}`);
        }

        const data = (await response.json()) as any;
        const signedUrl = `${SUPABASE_URL}/storage/v1${data.url}`;
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/uploads/${safeFilename}`;

        return sendResponse(res, 200, true, { 
            signedUrl,
            token: data.token,
            publicUrl,
            path: safeFilename
        }, 'Lấy token thành công');
    } catch (error: any) {
        console.error('❌ Upload token error:', error);
        return sendResponse(res, 500, false, undefined, undefined, 'Lỗi khi tạo token upload: ' + error.message);
    }
});

// =============================================================================
// Events CRUD
// =============================================================================
router.get('/events', async (req: Request, res: Response) => {
    try {
        const events = await getEvents();
        sendResponse(res, 200, true, events, 'Lấy danh sách hoạt động thành công');
    } catch (error: any) {
        console.error('❌ Error fetching events:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi tải danh sách hoạt động');
    }
});

router.get('/events/:id', async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return sendResponse(res, 400, false, undefined, undefined, 'ID không hợp lệ');
        }

        const event = await getEventById(id);
        if (!event) {
            return sendResponse(res, 404, false, undefined, undefined, 'Không tìm thấy hoạt động');
        }
        sendResponse(res, 200, true, event, 'Lấy chi tiết hoạt động thành công');
    } catch (error: any) {
        console.error('❌ Error fetching event by ID:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi tải chi tiết hoạt động');
    }
});

router.post('/events', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { date, title, description, category, imageUrl } = req.body;

        if (!date || !title || !description || !category) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu thông tin: date, title, description, category');
        }

        // Validate date format DD/MM/YYYY
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(date.trim())) {
            return sendResponse(res, 400, false, undefined, undefined, 'Định dạng ngày phải là DD/MM/YYYY (vd: 01/01/2026)');
        }

        if (imageUrl) {
            const urlLower = imageUrl.trim().toLowerCase();
            if (urlLower.startsWith('c:\\') || urlLower.startsWith('file://') || urlLower.startsWith('d:\\') || (!urlLower.startsWith('http') && !urlLower.startsWith('/'))) {
                return sendResponse(res, 400, false, undefined, undefined, 'URL ảnh không hợp lệ (Không dùng đường dẫn cục bộ)');
            }
        }

        const eventId = await addEvent(date.trim(), title.trim(), description.trim(), category.trim(), imageUrl?.trim());
        sendResponse(res, 201, true, { id: eventId }, 'Thêm hoạt động thành công');
    } catch (error: any) {
        console.error('❌ Error creating event:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi tạo hoạt động');
    }
});

router.put('/events/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return sendResponse(res, 400, false, undefined, undefined, 'ID không hợp lệ');
        }

        const { date, title, description, category, imageUrl } = req.body;
        if (!date || !title || !description || !category) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu thông tin: date, title, description, category');
        }

        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(date.trim())) {
            return sendResponse(res, 400, false, undefined, undefined, 'Định dạng ngày phải là DD/MM/YYYY');
        }

        if (imageUrl) {
            const urlLower = imageUrl.trim().toLowerCase();
            if (urlLower.startsWith('c:\\') || urlLower.startsWith('file://') || urlLower.startsWith('d:\\') || (!urlLower.startsWith('http') && !urlLower.startsWith('/'))) {
                return sendResponse(res, 400, false, undefined, undefined, 'URL ảnh không hợp lệ (Không dùng đường dẫn cục bộ)');
            }
        }

        const updated = await updateEvent(id, date.trim(), title.trim(), description.trim(), category.trim(), imageUrl?.trim());
        if (!updated) {
            return sendResponse(res, 404, false, undefined, undefined, 'Không tìm thấy hoạt động');
        }

        sendResponse(res, 200, true, { id }, 'Cập nhật hoạt động thành công');
    } catch (error: any) {
        console.error('❌ Error updating event:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi cập nhật hoạt động');
    }
});

router.delete('/events/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return sendResponse(res, 400, false, undefined, undefined, 'ID không hợp lệ');
        }

        const deleted = await deleteEvent(id);
        if (!deleted) {
            return sendResponse(res, 404, false, undefined, undefined, 'Không tìm thấy hoạt động');
        }

        sendResponse(res, 200, true, undefined, 'Xóa hoạt động thành công');
    } catch (error: any) {
        console.error('❌ Error deleting event:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi xóa hoạt động');
    }
});

// =============================================================================
// Gallery CRUD
// =============================================================================
router.get('/gallery', async (req: Request, res: Response) => {
    try {
        const items = await getGalleryItems();
        sendResponse(res, 200, true, items, 'Lấy thư viện ảnh thành công');
    } catch (error: any) {
        console.error('❌ Error fetching gallery:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi tải thư viện ảnh');
    }
});

router.post('/gallery', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const { imageUrl, label, order } = req.body;

        if (!imageUrl || !label) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu imageUrl hoặc label');
        }

        const urlLower = imageUrl.trim().toLowerCase();
        if (urlLower.startsWith('c:\\') || urlLower.startsWith('file://') || urlLower.startsWith('d:\\') || (!urlLower.startsWith('http') && !urlLower.startsWith('/'))) {
            return sendResponse(res, 400, false, undefined, undefined, 'URL ảnh không hợp lệ (Không dùng đường dẫn cục bộ)');
        }

        const parsedOrder = typeof order === 'number' ? order : parseInt(order, 10) || 0;
        const itemId = await addGalleryItem(imageUrl.trim(), label.trim(), parsedOrder);
        sendResponse(res, 201, true, { id: itemId }, 'Thêm hình ảnh thành công');
    } catch (error: any) {
        console.error('❌ Error adding gallery item:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi thêm hình ảnh');
    }
});

router.put('/gallery/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return sendResponse(res, 400, false, undefined, undefined, 'ID không hợp lệ');
        }

        const { imageUrl, label, order } = req.body;
        if (!imageUrl || !label) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu imageUrl hoặc label');
        }

        const urlLower = imageUrl.trim().toLowerCase();
        if (urlLower.startsWith('c:\\') || urlLower.startsWith('file://') || urlLower.startsWith('d:\\') || (!urlLower.startsWith('http') && !urlLower.startsWith('/'))) {
            return sendResponse(res, 400, false, undefined, undefined, 'URL ảnh không hợp lệ (Không dùng đường dẫn cục bộ)');
        }

        const parsedOrder = typeof order === 'number' ? order : parseInt(order, 10) || 0;
        const updated = await updateGalleryItem(id, imageUrl.trim(), label.trim(), parsedOrder);
        if (!updated) {
            return sendResponse(res, 404, false, undefined, undefined, 'Không tìm thấy hình ảnh');
        }

        sendResponse(res, 200, true, { id }, 'Cập nhật hình ảnh thành công');
    } catch (error: any) {
        console.error('❌ Error updating gallery item:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi cập nhật hình ảnh');
    }
});

router.delete('/gallery/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return sendResponse(res, 400, false, undefined, undefined, 'ID không hợp lệ');
        }

        const deleted = await deleteGalleryItem(id);
        if (!deleted) {
            return sendResponse(res, 404, false, undefined, undefined, 'Không tìm thấy hình ảnh');
        }

        sendResponse(res, 200, true, undefined, 'Xóa hình ảnh thành công');
    } catch (error: any) {
        console.error('❌ Error deleting gallery item:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi xóa hình ảnh');
    }
});

// =============================================================================
// Contacts
// =============================================================================
router.post('/contact', async (req: Request, res: Response) => {
    try {
        const { name, email, phone, message, type = 'inquiry' } = req.body;

        if (!name || !email || !message) {
            return sendResponse(res, 400, false, undefined, undefined, 'Thiếu thông tin: name, email, message');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return sendResponse(res, 400, false, undefined, undefined, 'Định dạng email không hợp lệ');
        }

        const validTypes = ['inquiry', 'donation', 'newsletter'];
        const contactType = validTypes.includes(type) ? type : 'inquiry';

        const contactId = await saveContact(name.trim(), email.trim(), phone?.trim() || null, message.trim(), contactType);
        sendResponse(res, 201, true, { id: contactId }, 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm!');
    } catch (error: any) {
        console.error('❌ Error saving contact:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi lưu tin nhắn');
    }
});

router.get('/contacts', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const contacts = await getContacts();
        sendResponse(res, 200, true, contacts, 'Lấy danh sách liên hệ thành công');
    } catch (error: any) {
        console.error('❌ Error fetching contacts:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi tải danh sách liên hệ');
    }
});

router.delete('/contacts/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return sendResponse(res, 400, false, undefined, undefined, 'ID không hợp lệ');
        }

        const deleted = await deleteContact(id);
        if (!deleted) {
            return sendResponse(res, 404, false, undefined, undefined, 'Không tìm thấy liên hệ');
        }

        sendResponse(res, 200, true, undefined, 'Xóa liên hệ thành công');
    } catch (error: any) {
        console.error('❌ Error deleting contact:', error);
        sendResponse(res, 500, false, undefined, undefined, error.message || 'Lỗi xóa liên hệ');
    }
});

// =============================================================================
// Health Check
// =============================================================================
router.get('/health', (req: Request, res: Response) => {
    sendResponse(res, 200, true, {
        status: 'OK',
        service: 'Chùa Chính Phước API',
        timestamp: new Date().toISOString()
    });
});

export default router;
