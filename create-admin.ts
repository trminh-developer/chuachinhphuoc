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
        console.log('   npm run create-admin admin admin@gmail.com 123456');
        process.exit(1);
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        console.log('❌ Lỗi: Email không hợp lệ!');
        console.log('   Ví dụ email hợp lệ: admin@gmail.com, user@temple.com');
        process.exit(1);
    }

    // Optional: Chỉ cho phép email từ các domain cụ thể
    // Uncomment để chỉ chấp nhận gmail.com
    const allowedDomains = ['gmail.com']; // ← Sửa domain ở đây
    if (!allowedDomains.some(domain => email.endsWith('@' + domain))) {
        console.log(`❌ Lỗi: Chỉ chấp nhận email từ: ${allowedDomains.map(d => '@' + d).join(', ')}`);
        console.log(`   Ví dụ: user@gmail.com`);
        process.exit(1);
    }

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pagoda_website'
        });

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert admin
        await connection.execute(
            `INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)`,
            [username, email, passwordHash]
        );

        await connection.end();

        console.log('✅ Tạo admin thành công!');
        console.log(`\n📝 Thông tin đăng nhập:`);
        console.log(`   Username: ${username}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`\n🔗 Truy cập admin tại: http://localhost:3001/admin`);

    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
        if (error.message.includes('Duplicate entry')) {
            console.log('\n⚠️ Username hoặc email đã tồn tại!');
        }
        process.exit(1);
    }
}

createAdmin();
