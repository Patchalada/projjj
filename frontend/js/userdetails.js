// ฟังก์ชัน logout
function logout() {
    localStorage.removeItem('token');
    alert('ออกจากระบบเรียบร้อย');
    window.location.href = 'login.html';
}

// โหลด Navbar จาก navadmin.html
function loadNavbar() {
    fetch('components/navadmin.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;
        });
}

// โหลดข้อมูลการเข้า-ออกงานและข้อมูลผู้ใช้
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:8000/attendance', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();

        const tableBody = document.querySelector('#attendanceTable tbody');
        tableBody.innerHTML = ''; // ล้างข้อมูลเก่าออก

        // แสดงข้อมูลการเข้า-ออกงานของพนักงาน
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.fullname}</td>
                <td>${user.role || 'N/A'}</td>
                <td>${user.department || 'N/A'}</td>
                <td>${user.check_in_time ? new Date(user.check_in_time).toLocaleString() : '-'}</td>
                <td>${user.check_out_time ? new Date(user.check_out_time).toLocaleString() : '-'}</td>












                

                <td>
                    <button onclick="editUser(${user.id})">แก้ไข</button>
                    <button class="deny" onclick="deleteUser(${user.id})">ลบ</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}


// แก้ไขผู้ใช้
function editUser(userId) {
    window.location.href = `edit_user.html?id=${userId}`;
}

// โหลด Navbar และข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
document.addEventListener("DOMContentLoaded", () => {
    loadNavbar();
    loadUsers();
});
