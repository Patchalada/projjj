// navbar.js
function logout() {
    localStorage.removeItem('token');  // ลบ Token ออกจาก localStorage
    alert('ออกจากระบบเรียบร้อย');
    window.location.href = 'login.html';  // เปลี่ยนเส้นทางไปหน้าเข้าสู่ระบบ
}
