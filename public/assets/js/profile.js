// Show password change section
function showChangePassword() {
    const passwordSection = document.getElementById('password-change-section');
    passwordSection.style.display = 'block';
}

// Confirm account deletion
function confirmDeleteAccount() {
    const confirmation = confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (confirmation) {
        alert("Account deleted successfully!");
        // Add account deletion logic here
    }
}