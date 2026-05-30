# 🔄 Hướng Dẫn Migration: MySQL → SQL Server

## 📋 Tóm Tắt Những Thay Đổi

Dự án đã được cấu trúc lại hoàn toàn từ MySQL sang SQL Server (T-SQL) với các cải tiến hệ thống quan trọng:

### ✅ 1. **Database Layer** (`src/database.ts`)
- **Trước**: Sử dụng `mysql2` driver
- **Sau**: Sử dụng `mssql` driver (Microsoft SQL Server Client for Node.js)
- **Cải tiến**:
  - Connection pooling an toàn với xử lý lỗi tự động
  - Prepared statements chống SQL Injection hoàn toàn
  - Proper resource cleanup với `closePool()`
  - Error handling chi tiết ở mỗi operation

### ✅ 2. **Database Schema** (`database.sql`)
- **Trước**: MySQL syntax (ENGINE=InnoDB, AUTO_INCREMENT, TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **Sau**: T-SQL syntax (PRIMARY KEY IDENTITY(1,1), DATETIME DEFAULT GETDATE(), NVARCHAR)
- **Cải tiến**:
  - INT IDENTITY thay vì VARCHAR cho Primary Key → tối ưu indexing
  - NVARCHAR cho văn bản tiếng Việt
  - NVARCHAR(MAX) cho text dài
  - Proper check constraints cho enum fields

### ✅ 3. **API Routes** (`src/routes/api.ts`)
- **Trước**: Response format không hoàn toàn đồng nhất
- **Sau**: Response helper standardized - luôn trả về:
  ```json
  {
    "success": boolean,
    "data": optional,
    "message": optional,
    "error": optional
  }
  ```
- **Cải tiến**:
  - Consistent error handling
  - Proper HTTP status codes
  - Detailed error messages

### ✅ 4. **Frontend - Client** (`scripts/main.js`)
- **Trước**: Hardcoded mock data (eventsData, galleryData)
- **Sau**: Fetch từ API endpoints thực tế (`/api/events`, `/api/gallery`)
- **Cải tiến**:
  - XSS protection với escapeHtml()
  - Proper error handling và user feedback
  - Dynamic content loading from server
  - Remove mock data hoàn toàn

### ✅ 5. **Admin Dashboard** (`scripts/admin.js`)
- **Trước**: ID handling không nhất quán (mix string/number)
- **Sau**: ID uniformly handled as INT across all layers
- **Cải tiến**:
  - Proper input validation
  - XSS protection
  - Graceful token expiration handling
  - Better error messages

### ✅ 6. **Configuration** (`.env`, `.env.example`)
- **Trước**: MySQL-specific configuration
- **Sau**: SQL Server-specific configuration
- **Cải tiến**:
  - Clear comments on authentication methods
  - Support for both Windows Auth và SQL Auth

---

## 🚀 Hướng Dẫn Thiết Lập

### Bước 1: Chuẩn Bị SQL Server

**Option A: Windows Authentication**
```sql
-- Mở SQL Server Management Studio
-- Chạy database.sql từ thư mục root
-- Hoặc dùng sqlcmd:
sqlcmd -S your-server-name -d master -i database.sql
```

**Option B: SQL Authentication (nếu dùng `sa` user)**
```bash
# Cập nhật .env:
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=YourSecurePassword123!
DB_NAME=pagoda_website
```

### Bước 2: Cài Đặt Dependencies

```bash
# Gỡ mysql2 driver cũ
npm uninstall mysql2

# Cài đặt dependencies mới
npm install

# Hoặc nếu đã cài, chỉ cần chạy:
npm ci
```

### Bước 3: Cập Nhật Environment

```bash
# Copy .env.example nếu chưa có .env
cp .env.example .env

# Cập nhật giá trị DB_HOST, DB_USER, DB_PASSWORD theo SQL Server setup của bạn
```

### Bước 4: Chạy Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

---

## 📊 Mapping Giữa Các Layers

| Functionality | Client | API | Database | DB Table |
|---|---|---|---|---|
| Load Events | GET /api/events | ✅ `/api/events` | getEvents() | events |
| Add Event | POST /api/events | ✅ `/api/events` (protected) | addEvent() | events |
| Delete Event | DELETE /api/events/:id | ✅ `/api/events/{id}` (protected) | deleteEvent(INT) | events |
| Load Gallery | GET /api/gallery | ✅ `/api/gallery` | getGalleryItems() | gallery |
| Add Gallery | POST /api/gallery | ✅ `/api/gallery` (protected) | addGalleryItem() | gallery |
| Delete Gallery | DELETE /api/gallery/:id | ✅ `/api/gallery/{id}` (protected) | deleteGalleryItem(INT) | gallery |
| Submit Contact | POST /api/contact | ✅ `/api/contact` | saveContact() | contacts |
| Load Contacts | GET /api/contacts | ✅ `/api/contacts` (protected) | getContacts() | contacts |
| Login | POST /api/auth/login | ✅ `/api/auth/login` | getAdminByUsername() | admins |
| Register | POST /api/auth/register | ✅ `/api/auth/register` | createAdmin() | admins |

---

## 🔐 Security Improvements

### SQL Injection Prevention
✅ **Prepared Statements** - mssql driver tự động escape tất cả parameters:
```typescript
// Trước (unsafe):
const query = `SELECT * FROM events WHERE id = ${id}`;

// Sau (safe):
const result = await pool.request()
    .input('id', sql.Int, id)
    .query('SELECT * FROM events WHERE id = @id');
```

### XSS Protection
✅ **escapeHtml() function** - chống JavaScript injection ở frontend:
```javascript
// Trước: ${event.title} → có thể chạy script
// Sau: ${escapeHtml(event.title)} → text-only
```

### Token Validation
✅ **JWT + Bearer Token** - protected endpoints yêu cầu valid token:
```typescript
router.delete('/events/:id', authenticateAdmin, async (req, res) => {
    // Chỉ admin có token hợp lệ mới xóa được
});
```

---

## 🧪 Testing Checklist

### Frontend (Client)
- [ ] Truy cập `/` → Trang chủ load events từ API
- [ ] Trang chủ hiển thị gallery từ API
- [ ] Form liên hệ gửi được dữ liệu tới API
- [ ] Lỗi API hiển thị gracefully

### Admin Dashboard
- [ ] Truy cập `/admin` → login page
- [ ] Login với credentials hợp lệ
- [ ] Xem được danh sách events từ API
- [ ] Thêm event mới → API tạo bản ghi mới
- [ ] Xóa event → API xóa hợp lệ
- [ ] Xem được danh sách gallery từ API
- [ ] Thêm/xóa gallery items
- [ ] Audio management (localStorage-based) hoạt động
- [ ] Xem danh sách contacts từ API
- [ ] Token expiration → automatic logout

### API Testing (curl/Postman)
```bash
# Health check
curl http://localhost:3001/api/health

# Get events
curl http://localhost:3001/api/events

# Login (replace with real credentials)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Create event (protected - requires token)
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"date":"20/05","title":"Test","description":"Test desc","category":"Test"}'
```

---

## 🐛 Troubleshooting

### "Cannot connect to SQL Server"
```
❌ Lỗi: Error: Server is not accessible from JavaScript.
✅ Fix:
1. Kiểm tra SQL Server service đang chạy
2. Kiểm tra DB_HOST trong .env (localhost, server-name, hoặc IP)
3. Kiểm tra DB_USER và DB_PASSWORD
4. Kiểm tra database pagoda_website đã được tạo
```

### "Request timeout"
```
❌ Lỗi: Error: Timeout expired
✅ Fix:
1. Kiểm tra query complexity
2. Tăng requestTimeout trong database.ts
3. Kiểm tra network connectivity
```

### "Token is invalid or expired"
```
❌ Lỗi: Token không hợp lệ hoặc đã hết hạn
✅ Fix:
1. Kiểm tra JWT_SECRET일치
2. Re-login để lấy token mới
3. Token hết hạn sau 24 giờ (có thể đổi trong generateToken)
```

### "NVARCHAR data truncated"
```
❌ Lỗi: String or binary data would be truncated
✅ Fix:
1. Kiểm tra input length vs database column length
2. Sử dụng NVARCHAR(MAX) cho long text
3. Validate input client-side trước gửi
```

---

## 📈 Performance Optimization

### Connection Pooling
```typescript
// Pool tự động reuse connections
// Min: 2 connections, Max: 10 connections
// Idle timeout: 30 seconds
pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
}
```

### Indexing Strategy
```sql
-- Events table
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);

-- Gallery table
CREATE INDEX idx_gallery_order ON gallery([order]);

-- Contacts table
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_type ON contacts(type);

-- Admins table
CREATE INDEX idx_admins_username ON admins(username);
CREATE INDEX idx_admins_email ON admins(email);
```

---

## 📝 File Structure

```
Pagoda-Website/
├── src/
│   ├── database.ts          ← MSSQL connection pool & queries
│   ├── server.ts            ← Express setup
│   ├── routes/
│   │   └── api.ts           ← API endpoints
│   └── middleware/
│       └── auth.ts          ← JWT authentication
├── scripts/
│   ├── main.js              ← Client-side, fetches from API
│   └── admin.js             ← Admin dashboard, handles CRUD
├── database.sql             ← T-SQL schema
├── .env                     ← Configuration (git-ignored)
├── .env.example             ← Configuration template
├── package.json             ← Dependencies (removed mysql2)
└── README.md                ← Project documentation
```

---

## 🎯 Next Steps

1. ✅ **Database Setup**: Chạy `database.sql` trên SQL Server
2. ✅ **Dependencies**: `npm install` (mysql2 đã gỡ)
3. ✅ **Environment**: Cập nhật `.env` với SQL Server credentials
4. ✅ **Testing**: `npm run dev` và test API + frontend
5. ✅ **Deployment**: `npm run build && npm start`

---

## 📞 Support

Nếu gặp lỗi:
1. Kiểm tra console logs (server + browser)
2. Verify Database connection: `/api/health`
3. Review error messages - chúng chi tiết và descriptive
4. Check `.env` configuration matches SQL Server setup

---

**Đã hoàn tất migration! Hệ thống giờ đã chạy trên SQL Server với đầy đủ security và optimization. 🎉**
