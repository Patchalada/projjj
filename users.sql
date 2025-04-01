-- สร้างตารางผู้ใช้
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  role ENUM('พนักงาน', 'ผู้ดูแลระบบ') NOT NULL DEFAULT 'พนักงาน'
);

-- สร้างตารางบันทึกการลงเวลาทำงาน
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  check_in DATETIME DEFAULT NULL,
  check_out DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- สร้างตารางบันทึกการลา
CREATE TABLE leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  leave_date DATE NOT NULL,
  leave_type ENUM('ลาป่วย', 'ลากิจ', 'ลาพักร้อน') NOT NULL,
  reason TEXT,
  status ENUM('รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ') DEFAULT 'รออนุมัติ',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ตัวอย่างการเพิ่มข้อมูลผู้ใช้
INSERT INTO users (username, password, fullname, role) 
VALUES 
  ('employee1', 'pass123', 'สมชาย ใจดี', 'พนักงาน'),
  ('admin1', 'adminpass', 'ผู้ดูแลระบบ', 'ผู้ดูแลระบบ');

-- ตัวอย่างการลงเวลาเข้า-ออกงาน
INSERT INTO attendance (user_id, check_in) VALUES (1, '2024-04-01 08:00:00');
UPDATE attendance SET check_out = '2024-04-01 17:00:00' WHERE id = 1;

-- ตัวอย่างการบันทึกการลา
INSERT INTO leaves (user_id, leave_date, leave_type, reason) 
VALUES (1, '2024-04-10', 'ลาพักร้อน', 'ไปเที่ยวพักผ่อน');
