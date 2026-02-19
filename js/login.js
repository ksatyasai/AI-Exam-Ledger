function login() {
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!userId || !password) {
      alert('Please enter both ID and Password.');
      return;
    }

    // Get the current role from the login page
    const role = currentRole || 'student';

    // Call backend API
    fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            password: password,
            role: role
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Store token and user info in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('loggedInUser', data.user.userId);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);
            
            // Redirect based on role
            const redirects = {
                'student': './student_dashboard.html',
                'faculty': './faculty_dashboard.html',
                'admin': './admin_dashboard.html',
                'chief': './chief_dashboard.html'
            };
            window.location.href = redirects[role] || './index.html';
        } else {
            alert('Login failed: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        alert('Error connecting to server. Make sure the backend is running on http://localhost:5000');
    });
  }