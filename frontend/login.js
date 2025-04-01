const BASE_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token); // บันทึก token
                window.location.href = "index.html"; // พาไปที่หน้า index
            } else {
                document.getElementById("message").textContent = data.message;
            }
        } catch (error) {
            document.getElementById("message").textContent = "เกิดข้อผิดพลาด";
        }
    });
});
