// โหลด Navbar จาก navadmin.html
function loadNavbar() {
    fetch('components/navemploy.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;
        });
}

// โหลด Navbar และข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", () => {
    loadNavbar();
});

// ฟังก์ชันดึงชื่อพนักงานจาก Token และแสดงผล
function displayEmployeeName() {
    const token = localStorage.getItem('token');
    const employeeNameElement = document.getElementById('employeeName');

    if (token) {
        try {
            const decodedToken = jwt_decode(token);
            const employeeName = decodedToken.fullname || "ไม่พบข้อมูลพนักงาน";  // ใช้ fullname จาก Token
            employeeNameElement.textContent = `ยินดีต้อนรับ, ${employeeName}`;
        } catch (error) {
            console.error("Error decoding token:", error);
            employeeNameElement.textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
        }
    } else {
        employeeNameElement.textContent = "ไม่ได้ล็อกอิน";
    }
}

// ฟังก์ชันแปลงเวลาเป็น MySQL DATETIME
function formatToMysqlDatetime(date) {
    return new Date(date).toISOString().slice(0, 19).replace('T', ' ');
}

// ฟังก์ชันบันทึกเวลาเข้างาน
async function checkIn() {
    const token = localStorage.getItem('token');
    if (!token) return alert("กรุณาเข้าสู่ระบบ");

    const userId = jwt_decode(token).userId;
    const checkInTime = formatToMysqlDatetime(new Date());

    try {
        const response = await fetch('http://localhost:8000/attendance', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, check_in: checkInTime })
        });

        const result = await response.json();
        document.getElementById('attendanceMessage').textContent = response.ok 
            ? `คุณมาเข้างานเวลา ${new Date(checkInTime).toLocaleString()}`
            : result.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('attendanceMessage').textContent = 'เกิดข้อผิดพลาดในการบันทึกเวลา';
    }
}

// ฟังก์ชันบันทึกเวลาออกงาน
async function checkOut() {
    const token = localStorage.getItem('token');
    if (!token) return alert("กรุณาเข้าสู่ระบบ");

    const userId = jwt_decode(token).userId;
    const checkOutTime = formatToMysqlDatetime(new Date());

    try {
        const response = await fetch('http://localhost:8000/attendance', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, check_out: checkOutTime })
        });

        const result = await response.json();
        document.getElementById('attendanceMessage').textContent = response.ok 
            ? `คุณออกงานเวลา ${new Date(checkOutTime).toLocaleString()}`
            : result.message;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('attendanceMessage').textContent = 'เกิดข้อผิดพลาดในการบันทึกเวลา';
    }
}

// ฟังก์ชันไปยังหน้าการลางาน
function goToLeavePage() {
    window.location.href = 'leave.html';
}

function logout() {
    localStorage.removeItem('token');  // ลบ Token ออกจาก localStorage
    alert('ออกจากระบบเรียบร้อย');
    window.location.href = 'login.html';  // เปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ
}


// โหลดข้อมูลเมื่อหน้าเว็บเสร็จสิ้น
window.onload = displayEmployeeName;
