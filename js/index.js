document.addEventListener('DOMContentLoaded', function () {
    const loginBtn  = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const user      = localStorage.getItem('loggedInUser');

    if (user) {
      // User is logged in: show profile and logout
      if (loginBtn) {
        loginBtn.textContent = user;           // or "Hi, " + user
        loginBtn.style.backgroundColor = '#0b5ed7';
        loginBtn.onclick = function () {
          // Go to profile page, or show popup
          // window.location.href = 'profile.html';
          alert('Profile for: ' + user);
        };
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
        logoutBtn.onclick = function () {
          localStorage.removeItem('loggedInUser'); // clear user
          // Optional: clear more auth data here
          window.location.href = 'login.html';     // go back to login
        };
      }
    } else {
      // Not logged in: show Login only
      if (loginBtn) {
        loginBtn.textContent = 'Login';
        loginBtn.style.backgroundColor = '#138f42';
        loginBtn.onclick = function () {
          window.location.href = 'login.html';
        };
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'none';
      }
    }
  });