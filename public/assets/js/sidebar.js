document.addEventListener('DOMContentLoaded', async () => {
    const sidebarElement = document.getElementById('sidebar');
    if (sidebarElement) {
        try {
            const response = await fetch('../admin/sidebar.html');
            const sidebarHTML = await response.text();
            sidebarElement.innerHTML = sidebarHTML;
        } catch (error) {
            console.error('Error loading sidebar:', error);
        }
    }
});
