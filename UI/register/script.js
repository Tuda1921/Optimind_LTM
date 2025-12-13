document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const status = document.getElementById('status');
  status.textContent = 'Đang gửi...';
  const form = e.target;
  const payload = {
    email: form.email.value,
    password: form.password.value,
    username: form.username.value,
  };
  try {
    // Gợi ý endpoint local do chương trình C cung cấp
    const res = await fetch('http://127.0.0.1:8080/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng ký thất bại');
    status.textContent = 'Đăng ký thành công! Hãy đăng nhập.';
    window.location.href = '../login/index.html';
  } catch (err) {
    status.textContent = 'Lỗi: ' + err.message;
  }
});