document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('status');
  status.textContent = 'Đang gửi...';
  const form = e.target;
  const payload = {
    email: form.email.value,
    password: form.password.value,
  };
  try {
    // Gợi ý: bạn sẽ gọi chương trình C (client) của bạn.
    // Ở đây giả sử có một endpoint local do C phục vụ: http://127.0.0.1:8080/login
    const res = await fetch('http://127.0.0.1:8080/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
    status.textContent = 'Đăng nhập thành công!';
    // Lưu token nếu backend trả về
    if (data.token) localStorage.setItem('auth_token', data.token);
    // Điều hướng
    window.location.href = '../home/index.html';
  } catch (err) {
    status.textContent = 'Lỗi: ' + err.message;
  }
});