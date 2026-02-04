 document.addEventListener('DOMContentLoaded', function () {
      const user = localStorage.getItem('loggedInUser');
      const loginBtn  = document.getElementById('loginBtn');
      const logoutBtn = document.getElementById('logoutBtn');

      // If not logged in, redirect to login page
      if (!user) {
        window.location.href = 'login.html'; // adjust path if needed
        return;
      }

      // User is logged in: show profile + logout (same logic as index)
      if (loginBtn) {
        loginBtn.textContent = user;           // or "Hi, " + user
        loginBtn.style.backgroundColor = '#0b5ed7';
        loginBtn.onclick = function () {
          // Could redirect to profile.html
          alert('Profile for: ' + user);
        };
      }
      if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
        logoutBtn.onclick = function () {
          localStorage.removeItem('loggedInUser');
          window.location.href = 'login.html';
        };
      }
    });