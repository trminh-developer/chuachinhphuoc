# 🚀 Quick Start Guide - Chùa Chính Phước Website

## ⚡ Fast Track Setup (5 minutes)

### 1. SQL Server Setup
```bash
# Option A: Run SQL script
sqlcmd -S localhost -d master -i database.sql

# Option B: Use SQL Server Management Studio
# - Open database.sql and Execute
```

### 2. Update Environment
```bash
# Edit .env file
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=YourPassword123!
DB_NAME=pagoda_website
PORT=3001
JWT_SECRET=your-secret-key-here
```

### 3. Install & Run
```bash
npm install
npm run dev
# Server starts at http://localhost:3001
```

### 4. Test
```bash
# Client page
http://localhost:3001

# Admin dashboard
http://localhost:3001/admin

# API health check
curl http://localhost:3001/api/health
```

---

## 📚 API Endpoints Reference

### Public Endpoints

#### GET /api/events
```bash
curl http://localhost:3001/api/events

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_date": "15/07",
      "title": "Lễ Vu Lan",
      "description": "...",
      "category": "Lễ hội",
      "created_at": "2024-05-30T10:00:00Z"
    }
  ],
  "message": "Lấy danh sách hoạt động thành công"
}
```

#### GET /api/gallery
```bash
curl http://localhost:3001/api/gallery

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "image_url": "assets/gallery-1.jpg",
      "label": "Sảnh chính",
      "order": 1,
      "created_at": "2024-05-30T10:00:00Z"
    }
  ]
}
```

#### POST /api/contact
```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "phone": "0123456789",
    "message": "Xin liên hệ",
    "type": "inquiry"
  }'

Response:
{
  "success": true,
  "data": { "id": 1 },
  "message": "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm!"
}
```

#### GET /api/health
```bash
curl http://localhost:3001/api/health

Response:
{
  "success": true,
  "data": {
    "status": "OK",
    "service": "Chùa Chính Phước API",
    "timestamp": "2024-05-30T10:00:00.000Z"
  }
}
```

---

### Protected Endpoints (Require Admin Token)

#### POST /api/auth/login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Đăng nhập thành công"
}
```

#### POST /api/events (Protected)
```bash
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "20/05",
    "title": "Lễ mới",
    "description": "Mô tả chi tiết",
    "category": "Lễ hội"
  }'

Response:
{
  "success": true,
  "data": { "id": 7 },
  "message": "Thêm hoạt động thành công"
}
```

#### DELETE /api/events/:id (Protected)
```bash
curl -X DELETE http://localhost:3001/api/events/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

Response:
{
  "success": true,
  "message": "Xóa hoạt động thành công"
}
```

#### GET /api/contacts (Protected)
```bash
curl http://localhost:3001/api/contacts \
  -H "Authorization: Bearer YOUR_TOKEN"

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "phone": "0123456789",
      "message": "Xin liên hệ",
      "type": "inquiry",
      "created_at": "2024-05-30T10:00:00Z"
    }
  ]
}
```

---

## 🔑 Key Files Modified

### Backend
- `src/database.ts` - MSSQL connection & queries (Prepared statements)
- `src/server.ts` - Express server setup (Graceful shutdown)
- `src/routes/api.ts` - API endpoints (Standardized responses)
- `src/middleware/auth.ts` - JWT authentication (No changes needed)

### Frontend
- `scripts/main.js` - Client page (API integration, XSS protection)
- `scripts/admin.js` - Admin dashboard (ID validation, security)

### Configuration
- `.env` - Environment variables (SQL Server config)
- `.env.example` - Configuration template
- `package.json` - Dependencies (mysql2 removed)

### Documentation
- `database.sql` - T-SQL schema
- `MIGRATION.md` - Migration guide
- `REFACTORING_REPORT.md` - Detailed changes
- `QUICK_START.md` - This file

---

## 💡 Important Notes

### SQL Server Authentication
**Windows Authentication:**
```env
DB_HOST=localhost
DB_USER=
DB_PASSWORD=
```

**SQL Authentication (recommended):**
```env
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=YourPassword123!
```

### JWT Token
- Token expires in 24 hours
- Store in localStorage on client
- Send as: `Authorization: Bearer TOKEN`
- Token validation on protected endpoints

### Database Types
- INT IDENTITY(1,1) - Primary keys (auto-increment)
- NVARCHAR - Vietnamese text
- VARCHAR - ASCII text (URLs, emails, etc.)
- NVARCHAR(MAX) - Long text (descriptions, messages)

### Security Features
- ✅ Prepared statements (SQL Injection prevention)
- ✅ XSS protection (escapeHtml function)
- ✅ Token-based authentication
- ✅ Input validation on both client & server
- ✅ Error messages don't leak sensitive data

---

## 🐛 Common Issues & Fixes

### "Cannot find module 'mysql2'"
```bash
npm uninstall mysql2
npm install
```

### "Server is not accessible from JavaScript"
Check .env:
```env
DB_HOST=localhost  # or your server IP/name
DB_USER=sa
DB_PASSWORD=correct_password
DB_NAME=pagoda_website
```

### "Token expired" error
Login again to get a new token. Token is valid for 24 hours.

### "Could not create token"
Check JWT_SECRET in .env - it must be set:
```env
JWT_SECRET=my-super-secret-key-at-least-16-chars-long
```

---

## 📊 Database Schema Quick View

```sql
-- Events (Hoạt động)
id (INT), event_date (VARCHAR), title (NVARCHAR), 
description (NVARCHAR(MAX)), category (NVARCHAR), created_at

-- Gallery (Thư viện ảnh)
id (INT), image_url (VARCHAR), label (NVARCHAR), 
[order] (INT), created_at

-- Contacts (Liên hệ)
id (INT), name (NVARCHAR), email (VARCHAR), phone (VARCHAR),
message (NVARCHAR(MAX)), type (VARCHAR), created_at

-- Admins (Quản trị viên)
id (INT), username (VARCHAR), email (VARCHAR), 
password_hash (VARCHAR), created_at, updated_at
```

---

## 🎯 Deployment Checklist

- [ ] SQL Server instance running
- [ ] database.sql executed successfully
- [ ] .env configured with correct SQL Server details
- [ ] npm install completed
- [ ] npm run build successful
- [ ] npm run dev starts without errors
- [ ] API health check passes
- [ ] Client page loads events/gallery
- [ ] Admin login works
- [ ] Add/delete events works
- [ ] Contact form submits successfully

---

## 📞 Quick Support

**Server won't start?**
- Check SQL Server is running: `sqlcmd -S localhost`
- Check .env has correct DB_HOST, DB_USER, DB_PASSWORD
- Check database exists: `SELECT name FROM sys.databases WHERE name='pagoda_website'`

**Frontend shows error?**
- Check browser console (F12) for error messages
- Check `/api/health` endpoint works
- Clear browser cache and refresh

**Admin can't login?**
- Check JWT_SECRET in .env matches
- Check password hash is correct in database

---

**Happy coding! 🙏**
