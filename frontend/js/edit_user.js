// ฟังก์ชันโหลดข้อมูลผู้ใช้จาก URL
async function loadUserData() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id'); // ดึงค่า id จาก URL

    try {
        const response = await fetch(`http://localhost:8000/users/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const result = await response.json();

        if (response.ok) {
            document.getElementById('username').value = result.username;
            document.getElementById('fullname').value = result.fullname;
            document.getElementById('role').value = result.role;
            document.getElementById('department').value = result.department ? result.department.id : ''; 
        } else {
            document.getElementById('errorMessage').textContent = result.message || 'ไม่สามารถโหลดข้อมูลได้';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('errorMessage').textContent = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    }
}

// ฟังก์ชันบันทึกการแก้ไขข้อมูล
// ฟังก์ชันบันทึกการแก้ไขข้อมูล
document.getElementById('editUserForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const fullname = document.getElementById('fullname').value.trim();
    const role = document.getElementById('role').value;  // ตรงนี้จะส่งค่า 'พนักงาน' หรือ 'ผู้ดูแลระบบ'
    const department_id = document.getElementById('department').value || null;

    // ตรวจสอบให้แน่ใจว่ามีการกรอกข้อมูลที่จำเป็น
    if (!username || !password || !fullname) {
        document.getElementById('errorMessage').textContent = 'กรุณากรอกข้อมูลให้ครบ';
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                username, 
                password, 
                fullname, 
                role,  // ส่งค่า 'พนักงาน' หรือ 'ผู้ดูแลระบบ'
                department_id: department_id || null  // ส่งข้อมูลแผนก
            })
        });

        const result = await response.json();

        if (response.ok) {
            document.getElementById('successMessage').textContent = 'ข้อมูลถูกอัปเดตสำเร็จ';
            // รีเฟรชหน้าหลังจากบันทึกสำเร็จ
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            document.getElementById('errorMessage').textContent = result.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('errorMessage').textContent = 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
    }
});


// โหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
window.onload = loadUserData;
