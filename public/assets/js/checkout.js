// checkout.js
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageBox = document.getElementById('message');
    let checkoutRequestId = null;

    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formData = {
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            amount: parseFloat(document.getElementById('amount').value),
            eventId: document.getElementById('eventId').value,
            ticketType: document.getElementById('ticketType').value,
            quantity: parseInt(document.getElementById('quantity').value, 10)
        };

        console.log('Form Data:', formData);

        // Validate form data
        if (!formData.phoneNumber || isNaN(formData.amount)) {
            showMessage('Please provide valid details for all fields.', 'error');
            return;
        }

        try {
            showMessage('Processing payment request...', 'info');
            
            const response = await fetch('/api/mpesa/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log('Response Data:', data);

            if (response.ok) {
                checkoutRequestId = data.checkoutRequestID;
                showMessage('Payment request sent. Please check your phone to complete the payment.', 'success');
                startTicketPolling(formData.phoneNumber);
            } else {
                showMessage(data.message || 'Payment failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            showMessage('An unexpected error occurred. Please try again.', 'error');
        }
    });

    function startTicketPolling(phoneNumber) {
        let attempts = 0;
        const maxAttempts = 20; // Poll for up to 1 minute (20 * 3 seconds)
        
        const pollInterval = setInterval(async () => {
            if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                showMessage('Payment status check timed out. If you completed the payment, please contact support.', 'warning');
                return;
            }

            try {
                const response = await fetch('/api/mpesa/ticket-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumber, checkoutRequestId })
                });

                const data = await response.json();

                if (data.ticketUrl) {
                    clearInterval(pollInterval);
                    showTicketDownload(data.ticketUrl);
                }
            } catch (error) {
                console.error('Error checking ticket status:', error);
            }

            attempts++;
        }, 3000); // Poll every 3 seconds
    }

    function showTicketDownload(ticketUrl) {
        messageBox.innerHTML = `
            <div class="success-message">
                <p>Payment successful! Your ticket is ready.</p>
                <a href="${ticketUrl}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-download"></i> Download Ticket
                </a>
            </div>
        `;
    }

    function showMessage(message, type) {
        messageBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }
});