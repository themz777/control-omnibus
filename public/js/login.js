const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  loginMessage.className = 'message';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const response = await API.login({ username, password });
    localStorage.setItem('admin_token', response.token);
    localStorage.setItem('admin_user', response.user.username);
    window.location.href = '/admin.html';
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.classList.add('error');
  }
});
