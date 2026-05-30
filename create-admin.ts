import sql from 'mssql/msnodesqlv8';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbServer = process.env.DB_HOST || 'localhost';
const dbName = process.env.DB_NAME || 'pagoda_website';

const sqlConfig: any = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${dbServer};Database=${dbName};Trusted_Connection=Yes;`,
    pool: {
        min: 1,
        max: 3,
        idleTimeoutMillis: 10000
    }
};

async function createAdmin(): Promise<void> {
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

    let pool: sql.ConnectionPool | null = null;

    try {
        pool = new sql.ConnectionPool(sqlConfig);
        await pool.connect();
        console.log('✅ Đã kết nối SQL Server');

        // Đảm bảo bảng admins tồn tại
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'admins')
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
        `);

        // Kiểm tra admin đã tồn tại chưa
        const existingCheck = await pool.request()
            .input('username', sql.VarChar(100), username)
            .input('email', sql.VarChar(100), email)
            .query('SELECT id, username, email FROM admins WHERE username = @username OR email = @email');

        if (existingCheck.recordset.length > 0) {
            const existing = existingCheck.recordset[0];
            if (existing.username === username) {
                console.log(`\n⚠️  Username "${username}" đã tồn tại!`);
            }
            if (existing.email === email) {
                console.log(`\n⚠️  Email "${email}" đã tồn tại!`);
            }
            process.exit(1);
        }

        // Hash password và tạo admin
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.request()
            .input('username', sql.VarChar(100), username)
            .input('email', sql.VarChar(100), email)
            .input('password_hash', sql.VarChar(500), passwordHash)
            .query('INSERT INTO admins (username, email, password_hash) OUTPUT INSERTED.id VALUES (@username, @email, @password_hash)');

        const adminId = result.recordset[0].id;

        console.log('\n✅ Tạo admin thành công!');
        console.log(`\n📝 Thông tin đăng nhập:`);
        console.log(`   ID:       ${adminId}`);
        console.log(`   Username: ${username}`);
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`\n🔗 Truy cập admin tại: http://localhost:${process.env.PORT || 3001}/admin`);

    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);

        // SQL Server duplicate key error: number 2627 (UNIQUE violation) hoặc 2601 (UNIQUE INDEX violation)
        if (error.number === 2627 || error.number === 2601) {
            console.log('\n⚠️  Username hoặc email đã tồn tại!');
        }
        process.exit(1);
    } finally {
        if (pool) {
            try {
                await pool.close();
            } catch {
                // Bỏ qua lỗi khi đóng pool
            }
        }
    }
}

createAdmin();