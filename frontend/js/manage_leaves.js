// leave.js

// ✅ โหลด Navbar จาก navadmin.html
fetch('components/navadmin.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('nav-placeholder').innerHTML = data;

        // เมื่อ Navbar โหลดเสร็จแล้วให้ผูกฟังก์ชัน logout เข้ากับปุ่ม "ออกจากระบบ"
        const logoutButton = document.querySelector('.navbar a[href="#"]');
        if (logoutButton) {
            logoutButton.onclick = function () {
                logout();  // เรียกใช้ฟังก์ชัน logout
            };
        }
    });

// ฟังก์ชัน logout
function logout() {
    localStorage.removeItem('token');  // ลบ Token ออกจาก localStorage
    alert('ออกจากระบบเรียบร้อย');
    window.location.href = 'login.html';  // เปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ
}

// ฟังก์ชันโหลดข้อมูลการลา
async function loadLeaveRequests() {
    try {
        const response = await fetch('http://localhost:8000/leaves', {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        const tableBody = document.querySelector('#leaveRequestsTable tbody');
        tableBody.innerHTML = ''; // ล้างตาราง

        result.forEach(leave => {
            const row = document.createElement('tr');

            // ตรวจสอบและแปลงวันที่ลา
            const leaveDate = new Date(leave.leave_date);
            const formattedDate = isNaN(leaveDate.getTime()) 
                ? 'ไม่สามารถแสดงวันที่ได้' 
                : leaveDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

            row.innerHTML = `
                <td>${leave.fullname}</td>
                <td>${leave.position || 'ไม่ระบุ'}</td> <!-- แสดงตำแหน่ง -->
                <td>${leave.leave_type}</td>
                <td>${leave.reason}</td>
                <td>${formattedDate}</td> 
                <td>${leave.status}</td>
                <td><button onclick="approveLeave(${leave.id})">อนุมัติ</button></td>
                <td><button class="deny" onclick="denyLeave(${leave.id})">ไม่อนุมัติ</button></td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading leave requests:', error);
    }
}

// ฟังก์ชันอนุมัติการลา
async function approveLeave(leaveId) {
    try {
        const response = await fetch(`http://localhost:8000/leaves/${leaveId}/approve`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (response.ok) {
            alert('อนุมัติการลาเรียบร้อย');
            loadLeaveRequests();
        } else {
            alert('ไม่สามารถอนุมัติการลาได้');
        }
    } catch (error) {
        console.error('Error approving leave:', error);
    }
}

// ฟังก์ชันปฏิเสธการลา
async function denyLeave(leaveId) {
    try {
        const response = await fetch(`http://localhost:8000/leaves/${leaveId}/deny`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (response.ok) {
            alert('ปฏิเสธการลาเรียบร้อย');
            loadLeaveRequests();
        } else {
            alert('ไม่สามารถปฏิเสธการลาได้');
        }
    } catch (error) {
        console.error('Error denying leave:', error);
    }
}

// ฟังก์ชันแสดงวันที่ปัจจุบัน
function showCurrentDate() {
    const today = new Date();
    const dateStr = today.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('currentDate').innerText = `วันนี้คือ: ${dateStr}`;
}

// เรียกฟังก์ชันแสดงวันที่
showCurrentDate();

// โหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
loadLeaveRequests();
