function validateData(userData) {
    let errors = [];
    if (!userData.username) errors.push('กรุณากรอกชื่อผู้ใช้');
    if (!userData.password) errors.push('กรุณากรอกรหัสผ่าน');
    if (!userData.fullname) errors.push('กรุณากรอกชื่อเต็ม');
    if (!userData.role) errors.push('กรุณาเลือกบทบาท');
    if (!userData.department_id) errors.push('กรุณาเลือกแผนก');
    return errors;
}

async function register() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const fullname = document.getElementById('fullname').value.trim();
    const role = document.getElementById('role').value;
    const department_id = document.getElementById('department').value;

    const userData = { username, password, fullname, role, department_id };
    const errors = validateData(userData);

    if (errors.length > 0) {
        document.getElementById('message').innerHTML = errors.join('<br>');
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        document.getElementById('message').textContent = result.message;

        if (response.ok) {
            alert('สมัครสมาชิกสำเร็จ!');
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').textContent = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    }
}
