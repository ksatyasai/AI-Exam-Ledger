document.getElementById('name').innerHTML=localStorage.getItem('loggedInUser');
    document.addEventListener('DOMContentLoaded', function () {
      const user      = localStorage.getItem('loggedInUser');
      const loginBtn  = document.getElementById('loginBtn');
      const logoutBtn = document.getElementById('logoutBtn');

      if (!user) {
        // Not logged in -> redirect to login page
        window.location.href = 'login.html'; // adjust path if needed
        return;
      }

      // User is logged in: show username + logout
      if (loginBtn) {
        loginBtn.textContent = user;
        loginBtn.style.backgroundColor = '#0b5ed7';
        loginBtn.onclick = function () {
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