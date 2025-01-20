// JavaScript to handle CRUD operations

document.addEventListener('DOMContentLoaded', () => {
    const createEventBtn = document.getElementById('createEventBtn');
    const eventModal = document.getElementById('eventModal');
    const closeBtn = document.querySelector('.close-btn');
    const eventForm = document.querySelector('.event-form');
    const eventTableBody = document.querySelector('.data-table tbody');

    // Function to toggle modal visibility
    function toggleModal() {
        eventModal.setAttribute('aria-hidden', eventModal.getAttribute('aria-hidden') === 'true' ? 'false' : 'true');
    }

    // Open the modal when 'Create New Event' button is clicked
    createEventBtn.addEventListener('click', () => {
        toggleModal();
        eventForm.reset(); // Clear form inputs
    });

    // Close the modal when the close button is clicked
    closeBtn.addEventListener('click', toggleModal);

    // Submit the event form to create or update an event
    eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect form data
        const eventData = {
            name: document.getElementById('eventName').value,
            date: document.getElementById('eventDate').value,
            time: document.getElementById('eventTime').value,
            category: document.getElementById('eventCategory').value,
            location: document.getElementById('eventLocation').value,
            capacity: document.getElementById('eventCapacity').value,
            description: document.getElementById('eventDescription').value,
        };

        try {
            const response = await fetch('/api/events', {
                method: 'POST', // Change to PUT for updates
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                const newEvent = await response.json();
                addEventToTable(newEvent);
                toggleModal();
            } else {
                console.error('Failed to save event');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    // Add event to the table
    function addEventToTable(event) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${event.name}</td>
            <td>${event.date}</td>
            <td>${event.category}</td>
            <td>${event.location}</td>
            <td>${event.capacity}</td>
            <td><span class="badge success">${event.status || 'Upcoming'}</span></td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn edit-btn" title="Edit Event" data-id="${event.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete-btn" title="Delete Event" data-id="${event.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        // Add edit and delete functionality
        row.querySelector('.edit-btn').addEventListener('click', () => editEvent(event));
        row.querySelector('.delete-btn').addEventListener('click', () => deleteEvent(event.id));

        eventTableBody.appendChild(row);
    }

    // Edit event
    function editEvent(event) {
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time;
        document.getElementById('eventCategory').value = event.category;
        document.getElementById('eventLocation').value = event.location;
        document.getElementById('eventCapacity').value = event.capacity;
        document.getElementById('eventDescription').value = event.description;

        toggleModal();
    }

    // Delete event
    async function deleteEvent(eventId) {
        try {
            const response = await fetch(`/api/events/${eventId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                document.querySelector(`[data-id="${eventId}"]`).closest('tr').remove();
            } else {
                console.error('Failed to delete event');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Fetch existing events and display them
    async function fetchEvents() {
        try {
            const response = await fetch('/api/events');
            if (response.ok) {
                const events = await response.json();
                events.forEach(addEventToTable);
            } else {
                console.error('Failed to fetch events');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Load events on page load
    fetchEvents();
});
