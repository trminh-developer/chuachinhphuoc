import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdmin() {
    const username = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];

    if (!username || !email || !password) {
        console.log('❌ Cách sử dụng:');
        console.log('   npm run create-admin <username> <email> <password>');
        console.log('\nVí dụ:');
        console.log('   npm run create-admin admin admin@gmail.com MyPassword123');
        process.exit(1);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('❌ Lỗi: Email không hợp lệ!');
        process.exit(1);
    }

    if (password.length < 6) {
        console.log('❌ Lỗi: Mật khẩu phải có ít nhất 6 ký tự!');
        process.exit(1);
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'TrMinh',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pagoda_website'
        });

        // Ensure table exists
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(500) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        const passwordHash = await bcrypt.hash(password, 10);

        await connection.execute(
            'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );

        await connection.end();

        console.log('✅ Tạo admin thành công!');
        console.log(`\n📝 Thông tin đăng nhập:`);
        console.log(`   Username: ${username}`);
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`\n🔗 Truy cập admin tại: http://localhost:3001/admin`);

    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
        if (error.message.includes('Duplicate entry') || error.code === 'ER_DUP_ENTRY') {
            console.log('\n⚠️  Username hoặc email đã tồn tại!');
        }
        process.exit(1);
    }
}

createAdmin();