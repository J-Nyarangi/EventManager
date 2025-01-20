document.addEventListener('DOMContentLoaded', () => {
    const createEventBtn = document.getElementById('createEventBtn');
    const eventModal = document.getElementById('eventModal');
    const closeModalBtn = eventModal.querySelector('.close-btn');
    const eventForm = document.getElementById('eventForm');
    const eventTableBody = document.querySelector('.data-table tbody');
    const addTicketBtn = document.getElementById('addTicketBtn');
    const ticketFields = document.getElementById('ticketFields');
    let editingEventId = null; // Track the event being edited

    // Toggle Modal
    const toggleModal = () => {
        const isHidden = eventModal.getAttribute('aria-hidden') === 'true';
        if (isHidden) {
            eventModal.setAttribute('aria-hidden', 'false');
            eventModal.classList.add('show'); // Add the show class
        } else {
            eventModal.setAttribute('aria-hidden', 'true');
            eventModal.classList.remove('show'); // Remove the show class
        }
    };
    // Open modal on "Create Event" button click
    createEventBtn.addEventListener('click', toggleModal);
    
    // Close modal on "X" button click
    closeModalBtn.addEventListener('click', toggleModal);

    // Fetch and Display Events
    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }
            const events = await response.json();

            eventTableBody.innerHTML = ''; // Clear existing rows
            events.forEach((event) => addEventToTable(event));
        } catch (err) {
            console.error('Error fetching events:', err);
            alert('Failed to fetch events. Please try again later.');
        }
    };

    // Add Event to Table
    const addEventToTable = (event) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.name}</td>
            <td>${event.date}</td>
            <td>${event.category}</td>
            <td>${event.location}</td>
            <td>${event.capacity}</td>
            <td>${event.status || 'N/A'}</td>
            <td>
                <button class="btn edit-btn" data-id="${event.id}">Edit</button>
                <button class="btn delete-btn" data-id="${event.id}">Delete</button>
            </td>
        `;

        // Attach event listeners for edit and delete buttons
        row.querySelector('.edit-btn').addEventListener('click', () => editEvent(event));
        row.querySelector('.delete-btn').addEventListener('click', () => deleteEvent(event.id));

        eventTableBody.appendChild(row);
    };

    // Add Ticket Field
    addTicketBtn.addEventListener('click', () => {
        const ticketField = document.createElement('div');
        ticketField.classList.add('ticket-field');
        ticketField.innerHTML = `
            <label>Ticket Type</label>
            <input type="text" name="ticketType[]" placeholder="e.g., VIP" required>
            <label>Price</label>
            <input type="number" name="ticketPrice[]" placeholder="e.g., 199" min="0" required>
            <label>Quantity</label>
            <input type="number" name="ticketQuantity[]" placeholder="e.g., 50" min="1" required>
            <button type="button" class="remove-ticket-btn">Remove</button>
        `;
        ticketFields.appendChild(ticketField);

        // Add event listener to remove ticket field
        ticketField.querySelector('.remove-ticket-btn').addEventListener('click', () => {
            ticketFields.removeChild(ticketField);
        });
    });

    // Create or Update Event
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(eventForm); // Automatically includes the file input
        const tickets = [];
        const ticketTypes = formData.getAll('ticketType[]');
        const ticketPrices = formData.getAll('ticketPrice[]');
        const ticketQuantities = formData.getAll('ticketQuantity[]');

        for (let i = 0; i < ticketTypes.length; i++) {
            tickets.push({
                type: ticketTypes[i],
                price: parseFloat(ticketPrices[i]),
                quantity: parseInt(ticketQuantities[i], 10),
            });
        }

        formData.append('tickets', JSON.stringify(tickets)); // Add tickets as JSON string

        const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
        const method = editingEventId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                body: formData, // Send the formData object directly
            });

            if (response.ok) {
                alert(editingEventId ? 'Event updated successfully!' : 'Event created successfully!');
                toggleModal();
                fetchEvents();
            } else {
                throw new Error('Failed to save event');
            }
        } catch (err) {
            console.error('Error saving event:', err);
            alert('Failed to save event. Please try again.');
        }
    });

    // Edit Event
    const editEvent = (event) => {
        editingEventId = event.id;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventCategory').value = event.category;
        document.getElementById('eventLocation').value = event.location;
        document.getElementById('eventCapacity').value = event.capacity;

        // Populate ticket fields (if available)
        if (event.tickets) {
            ticketFields.innerHTML = ''; // Clear current fields
            event.tickets.forEach((ticket) => {
                const ticketField = document.createElement('div');
                ticketField.classList.add('ticket-field');
                ticketField.innerHTML = `
                    <label>Ticket Type</label>
                    <input type="text" name="ticketType[]" value="${ticket.type}" required>
                    <label>Price</label>
                    <input type="number" name="ticketPrice[]" value="${ticket.price}" min="0" required>
                    <label>Quantity</label>
                    <input type="number" name="ticketQuantity[]" value="${ticket.quantity}" min="1" required>
                    <button type="button" class="remove-ticket-btn">Remove</button>
                `;
                ticketFields.appendChild(ticketField);

                // Add event listener to remove ticket field
                ticketField.querySelector('.remove-ticket-btn').addEventListener('click', () => {
                    ticketFields.removeChild(ticketField);
                });
            });
        }
        toggleModal();
    };

    // Delete Event
    const deleteEvent = async (id) => {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

            if (response.ok) {
                alert('Event deleted successfully!');
                fetchEvents();
            } else {
                throw new Error('Failed to delete event');
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Failed to delete event. Please try again.');
        }
    };

    // Initialize
    createEventBtn.addEventListener('click', toggleModal);
    closeModalBtn.addEventListener('click', toggleModal);
    fetchEvents();
});
