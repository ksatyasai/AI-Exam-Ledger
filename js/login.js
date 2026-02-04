function login() {
    const id = document.getElementById('studentId').value.trim();
    const pwd = document.getElementById('studentPassword').value.trim();

    if (!id || !pwd) {
      alert('Please enter both Student ID and Password.');
      return;
    }

    localStorage.setItem('loggedInUser', id);
    // TODO: here you would normally verify id/pwd with a backend

    // Redirect to index.html (same folder)
    window.location.href = './index.html';  // or './index.html'
  }