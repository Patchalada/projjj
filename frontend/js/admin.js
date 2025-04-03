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

// โหลดข้อมูลสมาชิก1
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:8000/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();

        const tableBody = document.querySelector('#usersTable tbody');
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.fullname}</td>
                <td>${user.role || 'N/A'}</td>
                <td>${user.department || 'N/A'}</td>
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

// ลบผู้ใช้2
async function deleteUser(userId) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?')) {
        await fetch(`http://localhost:8000/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        alert('ลบสมาชิกเรียบร้อย');
        loadUsers();
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
