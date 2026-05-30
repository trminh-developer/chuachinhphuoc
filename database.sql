-- =============================================================================
-- Chùa Chính Phước Website — SQL Server Database Schema (T-SQL)
-- Version: 2.0
-- Author: System Migration
-- Description: Chuẩn hóa toàn bộ schema sang T-SQL. 
--              PK = INT IDENTITY, Text tiếng Việt = NVARCHAR.
-- =============================================================================

-- Tạo Database (bỏ qua nếu đã tồn tại)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'pagoda_website')
BEGIN
    CREATE DATABASE pagoda_website;
END
GO

USE pagoda_website;
GO

-- =============================================================================
-- ADMINS TABLE
-- =============================================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'admins')
BEGIN
    CREATE TABLE admins (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        username        VARCHAR(100)    NOT NULL,
        email           VARCHAR(100)    NOT NULL,
        password_hash   VARCHAR(500)    NOT NULL,
        created_at      DATETIME        DEFAULT GETDATE(),
        updated_at      DATETIME        DEFAULT GETDATE(),

        CONSTRAINT UQ_admins_username UNIQUE (username),
        CONSTRAINT UQ_admins_email    UNIQUE (email)
    );

    CREATE INDEX IX_admins_username ON admins(username);
    CREATE INDEX IX_admins_email    ON admins(email);
END
GO

-- =============================================================================
-- EVENTS TABLE
-- =============================================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'events')
BEGIN
    CREATE TABLE events (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        event_date      VARCHAR(10)     NOT NULL,           -- Format: DD/MM/YYYY
        title           NVARCHAR(255)   NOT NULL,
        description     NVARCHAR(MAX)   NOT NULL,
        category        NVARCHAR(50)    NOT NULL,           -- Lễ hội, Tu tập, Giảng dạy, etc.
        image_url       VARCHAR(MAX)    NULL,
        created_at      DATETIME        DEFAULT GETDATE(),
        updated_at      DATETIME        DEFAULT GETDATE()
    );

    CREATE INDEX IX_events_date     ON events(event_date);
    CREATE INDEX IX_events_category ON events(category);
END
GO

-- =============================================================================
-- GALLERY TABLE
-- =============================================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'gallery')
BEGIN
    CREATE TABLE gallery (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        image_url       VARCHAR(500)    NOT NULL,
        label           NVARCHAR(255)   NOT NULL,
        [order]         INT             DEFAULT 0,
        created_at      DATETIME        DEFAULT GETDATE(),
        updated_at      DATETIME        DEFAULT GETDATE()
    );

    CREATE INDEX IX_gallery_order ON gallery([order]);
END
GO

-- =============================================================================
-- CONTACTS TABLE
-- =============================================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'contacts')
BEGIN
    CREATE TABLE contacts (
        id              INT             PRIMARY KEY IDENTITY(1,1),
        name            NVARCHAR(255)   NOT NULL,
        email           VARCHAR(255)    NOT NULL,
        phone           VARCHAR(20)     NULL,
        message         NVARCHAR(MAX)   NULL,
        type            VARCHAR(50)     DEFAULT 'inquiry',
        created_at      DATETIME        DEFAULT GETDATE(),

        CONSTRAINT CK_contacts_type CHECK (type IN ('inquiry', 'donation', 'newsletter'))
    );

    CREATE INDEX IX_contacts_email ON contacts(email);
    CREATE INDEX IX_contacts_type  ON contacts(type);
END
GO

-- =============================================================================
-- EXTENDED PROPERTIES (Thay thế cho MySQL COMMENT)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('events') AND name = 'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('events') AND name = 'event_date'))
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Format: DD/MM', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE',  @level1name = N'events', 
        @level2type = N'COLUMN', @level2name = N'event_date';
END
GO

IF NOT EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('events') AND name = 'MS_Description' AND minor_id = (SELECT column_id FROM sys.columns WHERE object_id = OBJECT_ID('events') AND name = 'category'))
BEGIN
    EXEC sp_addextendedproperty 
        @name = N'MS_Description', 
        @value = N'Lễ hội, Tu tập, Giảng dạy, Lễ tụng, Tết, etc.', 
        @level0type = N'SCHEMA', @level0name = N'dbo', 
        @level1type = N'TABLE',  @level1name = N'events', 
        @level2type = N'COLUMN', @level2name = N'category';
END
GO

-- =============================================================================
-- SAMPLE DATA — Events
-- =============================================================================
IF NOT EXISTS (SELECT TOP 1 1 FROM events)
BEGIN
    INSERT INTO events (event_date, title, description, category) 
    VALUES (N'15/07', N'Lễ Vu Lan', N'Tưởng nhớ những Phật tử đã từng mở chia, truyền kinh pháp cho chúng ta.', N'Lễ hội');

    INSERT INTO events (event_date, title, description, category) 
    VALUES (N'01/01', N'Tết Nguyên Đán', N'Kỷ niệm năm mới với các buổi tụng kinh và bài giảng Phật pháp đầu năm.', N'Tết');

    INSERT INTO events (event_date, title, description, category) 
    VALUES (N'15/04', N'Lễ Phật Đản', N'Kỷ niệm ngày Đức Phật Thích Ca Mâu Ni ra đời - ngày thiêng liêng của Phật giáo.', N'Lễ hội');

    INSERT INTO events (event_date, title, description, category) 
    VALUES (N'15/10', N'Thiền định chiều', N'Buổi thiền định lâu dài từ chiều đến tối, giúp tu tập sâu sắc hơn.', N'Tu tập');

    INSERT INTO events (event_date, title, description, category) 
    VALUES (N'28/03', N'Giảng kinh Pháp Hoa', N'Giáo sư giảng giải kinh Pháp Hoa - một trong những kinh điển quan trọng nhất của Phật giáo.', N'Giảng dạy');

    INSERT INTO events (event_date, title, description, category) 
    VALUES (N'09/06', N'Lễ Tam Bảo', N'Cúng dường Tam Bảo (Phật, Pháp, Tăng) trong không khí trang nghiêm và trang trọng.', N'Lễ tụng');
END
GO

-- =============================================================================
-- SAMPLE DATA — Gallery
-- =============================================================================
IF NOT EXISTS (SELECT TOP 1 1 FROM gallery)
BEGIN
    INSERT INTO gallery (image_url, label, [order]) VALUES (N'assets/gallery-1.jpg', N'Sảnh chính', 1);
    INSERT INTO gallery (image_url, label, [order]) VALUES (N'assets/gallery-2.jpg', N'Tượng Phật', 2);
    INSERT INTO gallery (image_url, label, [order]) VALUES (N'assets/gallery-3.jpg', N'Khu vườn', 3);
    INSERT INTO gallery (image_url, label, [order]) VALUES (N'assets/gallery-4.jpg', N'Cộng đồng tu tập', 4);
    INSERT INTO gallery (image_url, label, [order]) VALUES (N'assets/gallery-5.jpg', N'Tiền sảnh', 5);
    INSERT INTO gallery (image_url, label, [order]) VALUES (N'assets/gallery-6.jpg', N'Lễ hội', 6);
END
GO

-- =============================================================================
-- DEFAULT ADMIN ACCOUNT
-- Username: trminhdev
-- Password: Admin@2007  (bcrypt hashed)
-- =============================================================================
IF NOT EXISTS (SELECT TOP 1 1 FROM admins)
BEGIN
    INSERT INTO admins (username, email, password_hash) 
    VALUES (
        'trminhdev', 
        'trminhlaptrinhvien@gmail.com', 
        '$2a$10$HaPlyANPkwCy6vJ4SJGfdO9DCd66SLbjRIH8n5zwfO/cqSMgxye22'
    );
END
GO

-- =============================================================================
-- VERIFICATION
-- =============================================================================
SELECT 'ADMINS'   AS TableName, COUNT(*) AS RecordCount FROM admins
UNION ALL
SELECT 'EVENTS',   COUNT(*) FROM events
UNION ALL
SELECT 'GALLERY',  COUNT(*) FROM gallery
UNION ALL
SELECT 'CONTACTS', COUNT(*) FROM contacts;
GO

PRINT N'✅ Pagoda Website database schema created/verified successfully!';
GO
