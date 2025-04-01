const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 8000;

const JWT_SECRET_KEY = 'your_secret_key';

app.use(bodyParser.json());
app.use(cors());

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // รับเฉพาะ token จาก 'Bearer <token>'
    if (!token) return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้' });

    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Token หมดอายุหรือไม่ถูกต้อง' });
        req.user = decoded;
        next();
    });
};


let conn;

const initMySQL = async () => {
    conn = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'projectdb',
        port: 8820,
    });
};

app.post('/register', async (req, res) => {
    try {
        const { username, password, fullname, role } = req.body;

        if (!username || !password || !fullname) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
        }

        const [existingUser] = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้ไปแล้ว' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await conn.query(
            'INSERT INTO users (username, password, fullname, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, fullname, role || 'พนักงาน']
        );

        res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await conn.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

        const user = rows[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

        // ✅ เพิ่ม `role` ลงไปใน JWT
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role }, // เพิ่ม role ตรงนี้
            JWT_SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ message: 'ล็อกอินสำเร็จ', token });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการล็อกอิน' });
    }
});


app.get('/attendance', verifyToken, async (req, res) => {
    try {
        const [results] = await conn.query('SELECT * FROM attendance');
        res.json(results);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการลงเวลา' });
    }
});

app.post('/attendance', verifyToken, async (req, res) => {
    try {
        const { user_id, check_in, check_out } = req.body;

        // ตรวจสอบว่ามีการส่งเวลาเข้างาน (check_in) หรือไม่
        if (!check_in) {
            return res.status(400).json({ message: 'กรุณากรอกเวลาเข้างาน' });
        }

        // บันทึกเวลาเข้างานครั้งแรก
        await conn.query('INSERT INTO attendance (user_id, check_in, check_out) VALUES (?, ?, ?)', 
            [user_id, check_in, null] // เข้าก่อนแต่ไม่ต้องบันทึกเวลาออกงาน
        );
        res.json({ message: 'บันทึกเวลาเข้างานเรียบร้อย' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกการลงเวลา' });
    }
});

// API สำหรับบันทึกเวลาออกงาน (อัปเดตเวลาออกงาน)
app.put('/attendance', verifyToken, async (req, res) => {
    try {
        const { user_id, check_out } = req.body;

        // ตรวจสอบว่าเวลาที่ออกงานมีการกรอกหรือไม่
        if (!check_out) {
            return res.status(400).json({ message: 'กรุณากรอกเวลาออกงาน' });
        }

        // อัปเดตเวลาออกงาน
        const [result] = await conn.query(
            'UPDATE attendance SET check_out = ? WHERE user_id = ? AND check_out IS NULL', 
            [check_out, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบการลงเวลาที่ยังไม่ได้ออกงาน' });
        }

        res.json({ message: 'บันทึกเวลาออกงานเรียบร้อย' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกการออกงาน' });
    }
});


app.post('/leaves/:id/approve', verifyToken, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const [result] = await conn.query('UPDATE leaves SET status = "อนุมัติ" WHERE id = ?', [leaveId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบคำขอลา' });
        }

        res.json({ message: 'อนุมัติการลาสำเร็จ' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอนุมัติการลา' });
    }
});
// API สำหรับปฏิเสธการลา
app.post('/leaves/:id/deny', verifyToken, async (req, res) => {
    try {
        const leaveId = req.params.id;
        // อัพเดตสถานะคำขอลาเป็น "ไม่อนุมัติ"
        const [result] = await conn.query('UPDATE leaves SET status = "ไม่อนุมัติ" WHERE id = ?', [leaveId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบคำขอลา' });
        }

        res.json({ message: 'ปฏิเสธการลาเรียบร้อย' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปฏิเสธการลา' });
    }
});


app.get('/leaves', verifyToken, async (req, res) => {
    try {
        const [results] = await conn.query(`
            SELECT leaves.id, users.fullname, leaves.leave_type, leaves.reason, leaves.leave_date, leaves.status
            FROM leaves
            JOIN users ON leaves.user_id = users.id
        `);

        // ตรวจสอบว่าเรามีข้อมูลที่ต้องการหรือไม่
        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลา' });
        }

        // ส่งข้อมูลทั้งหมดกลับไปที่ฝั่ง client
        res.json(results);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา' });
    }
});

app.get('/leaves/:userId', verifyToken, async (req, res) => {
    const userId = req.params.userId;
    console.log('Request for leaves of userId:', userId);  // ตรวจสอบว่า userId ที่ส่งมาเป็นค่าถูกต้อง

    try {
        const [results] = await conn.query(`
            SELECT leaves.id, users.fullname, leaves.leave_type, leaves.reason, leaves.leave_date, leaves.status
            FROM leaves
            JOIN users ON leaves.user_id = users.id
            WHERE leaves.user_id = ?
        `, [userId]);

        if (results.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการลา' });
        }

        res.json(results);
    } catch (error) {
        console.error('Error fetching leave data:', error.message);  // พิมพ์ข้อความข้อผิดพลาดในกรณีที่เกิดข้อผิดพลาด
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการลา' });
    }
});




app.post('/leaves', verifyToken, async (req, res) => {
    try {
        const { user_id, leave_date, leave_type, reason } = req.body;

        // ตรวจสอบว่าได้รับข้อมูลครบถ้วนหรือไม่
        if (!user_id || !leave_date || !leave_type || !reason) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
        }

        // บันทึกข้อมูลการลา
        await conn.query('INSERT INTO leaves (user_id, leave_date, leave_type, reason) VALUES (?, ?, ?, ?)', [user_id, leave_date, leave_type, reason]);
        res.json({ message: 'บันทึกการลาสำเร็จ' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกการลา' });
    }
});


// 🔹 แก้ไขข้อมูลผู้ใช้
app.put('/users/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, fullname, role, password } = req.body;

        let updateFields = [];
        let values = [];

        if (username) {
            updateFields.push('username = ?');
            values.push(username);
        }
        if (fullname) {
            updateFields.push('fullname = ?');
            values.push(fullname);
        }
        if (role) {
            updateFields.push('role = ?');
            values.push(role);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            values.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'ไม่มีข้อมูลที่ต้องแก้ไข' });
        }

        values.push(userId);

        const [result] = await conn.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        res.json({ message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้' });
    }
});

// 🔹 ลบผู้ใช้
app.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;

        const [result] = await conn.query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้' });
    }
});

// 🔹 ดึงข้อมูลผู้ใช้ทั้งหมด
app.get('/users', verifyToken, async (req, res) => {
    try {
        const [users] = await conn.query(`
            SELECT u.id, u.username, u.fullname, u.role, 
                   d.name AS department, 
                   DATE_FORMAT(a.check_in, '%Y-%m-%d %H:%i:%s') AS check_in_time, 
                   DATE_FORMAT(a.check_out, '%Y-%m-%d %H:%i:%s') AS check_out_time
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN attendance a ON u.id = a.user_id
        `);
        res.json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
});



// 🔹 ดึงข้อมูลผู้ใช้ตาม ID
app.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const [users] = await conn.query('SELECT id, username, fullname, role FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้' });
    }
});

// 🔹 แก้ไขข้อมูลผู้ใช้
app.put('/users/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;  // รับค่า userId จาก URL
        const { username, fullname, role, password } = req.body;  // รับข้อมูลที่ต้องการแก้ไข

        // สร้างตัวแปรสำหรับเก็บการอัปเดตข้อมูล
        let updateFields = [];
        let values = [];

        // ตรวจสอบว่ามีข้อมูลใดบ้างที่ต้องการอัปเดต
        if (username) {
            updateFields.push('username = ?');
            values.push(username);
        }
        if (fullname) {
            updateFields.push('fullname = ?');
            values.push(fullname);
        }
        if (role) {
            updateFields.push('role = ?');
            values.push(role);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);  // เข้ารหัสรหัสผ่านใหม่
            updateFields.push('password = ?');
            values.push(hashedPassword);
        }

        // หากไม่มีข้อมูลที่ต้องการแก้ไข
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'ไม่มีข้อมูลที่ต้องแก้ไข' });
        }

        // เพิ่ม userId ไปยังค่าที่จะส่งไปอัปเดตในฐานข้อมูล
        values.push(userId);

        // คำสั่ง SQL สำหรับอัปเดตข้อมูล
        const [result] = await conn.query(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            values
        );

        // ตรวจสอบว่าอัปเดตสำเร็จหรือไม่
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้ที่ต้องการแก้ไข' });
        }

        res.json({ message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' });
    } catch (error) {
        // แสดงข้อความข้อผิดพลาดที่เกิดขึ้น
        console.error('Error updating user:', error.message);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขผู้ใช้', error: error.message });
    }
});



// เพิ่มการรีสตาร์ทเซิร์ฟเวอร์ในกรณีการเปลี่ยนแปลงข้อมูล
const startServer = async () => {
    try {
        await initMySQL();
        app.listen(port, () => {
            console.log('http server is running on port ' + port);
        });
    } catch (error) {
        console.error('ไม่สามารถเชื่อมต่อกับ MySQL ได้:', error.message);
    }
};

startServer();
