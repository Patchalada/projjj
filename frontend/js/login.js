// ฟังก์ชันเปลี่ยนหน้าไป Register
function goToRegister() {
    window.location.href = 'register.html';
}

// ฟังก์ชัน Login
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginMessage = document.getElementById('loginMessage');

    // เคลียร์ข้อความก่อนเริ่ม
    loginMessage.textContent = '';

    if (!username || !password) {
        loginMessage.textContent = 'กรุณากรอกข้อมูลให้ครบ';
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();
        console.log('Login Response:', result);

        if (response.ok) {
            if (!result.token) {
                loginMessage.textContent = 'ไม่พบ Token ในการตอบกลับ';
                return;
            }

            localStorage.setItem('token', result.token); //เก็บไว้

            try {
                const user = jwt_decode(result.token);
                console.log('Decoded User:', user);

                if (!user.role) {
                    loginMessage.textContent = 'Token ไม่ถูกต้อง: ไม่มีข้อมูล role';
                    return;
                }

                if (user.role === 'ผู้ดูแลระบบ') {
                    window.location.href = 'admin.html';  // ไปยังหน้าแอดมิน
                } else {
                    window.location.href = 'employee.html';  // ไปยังหน้าพนักงาน
                }
            } catch (decodeError) {
                console.error('JWT Decode Error:', decodeError);
                loginMessage.textContent = 'Token ไม่ถูกต้อง';
            }
        } else {
            loginMessage.textContent = result.message || 'เข้าสู่ระบบไม่สำเร็จ';
        }
    } catch (error) {
        console.error('Error:', error);
        loginMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
    }
}
