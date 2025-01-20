document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorMessage = document.getElementById('errorMessage');

    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const role = document.getElementById('role').value; // Get the selected role

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role }),
            });

            if (response.ok) {
                alert('Registration successful!');
                window.location.href = 'login.html'; // Redirect to login page
            } else {
                const errorData = await response.json();
                showErrorMessage(errorData.message);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            showErrorMessage('An unexpected error occurred. Please try again later.');
        }
    });

    function showErrorMessage(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block'; // Show the error message
    }
});
