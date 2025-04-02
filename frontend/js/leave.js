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

// ฟังก์ชันส่งคำขอลางาน
async function submitLeaveRequest() {
    const leaveDate = document.getElementById('leaveDate').value;
    const leaveType = document.getElementById('leaveType').value;
    const reason = document.getElementById('reason').value;
    const token = localStorage.getItem('token');

    if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        return;
    }

    const userId = jwt_decode(token).userId;

    if (!leaveDate || !reason) {
        document.getElementById('leaveMessage').textContent = 'กรุณากรอกข้อมูลให้ครบ';
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/leaves', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ user_id: userId, leave_date: leaveDate, leave_type: leaveType, reason })
        });

        const result = await response.json();
        if (response.ok) {
            document.getElementById('leaveMessage').style.color = 'green';
            document.getElementById('leaveMessage').textContent = 'ส่งคำขอลาสำเร็จ';
            loadLeaveRequests();  // รีเฟรชข้อมูลการลา
        } else {
            document.getElementById('leaveMessage').textContent = result.message;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// ฟังก์ชันดึงข้อมูลการลา
async function loadLeaveRequests() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert("กรุณาเข้าสู่ระบบ");
        return;
    }

    const userId = jwt_decode(token).userId;

    try {
        const response = await fetch(`http://localhost:8000/leaves/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();
        const leaveTableBody = document.querySelector('#leaveTable tbody');
        leaveTableBody.innerHTML = ''; // ลบข้อมูลเก่าออก

        if (result.length > 0) {
            result.forEach(leave => {
                const row = document.createElement('tr');

                // แปลงวันที่ลาให้อยู่ในรูปแบบภาษาไทย
                const leaveDate = new Date(leave.leave_date);
                const formattedDate = leaveDate.toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${leave.leave_type}</td>
                    <td>${leave.reason}</td>
                    <td>${leave.status}</td>
                `;
                leaveTableBody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="4" style="text-align:center;">ไม่มีข้อมูลการลา</td>';
            leaveTableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error fetching leave requests:', error);
    }
}

function logout() {
    localStorage.removeItem('token');  // ลบ Token ออกจาก localStorage
    alert('ออกจากระบบเรียบร้อย');
    window.location.href = 'login.html';  // เปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ
}

// โหลดข้อมูลเมื่อเปิดหน้า
window.onload = loadLeaveRequests;
