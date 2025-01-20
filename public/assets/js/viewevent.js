document.addEventListener('DOMContentLoaded', () => {
    const eventsContainer = document.getElementById('eventsContainer');

    // Function to fetch events from the backend
    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('Failed to fetch events');
            }

            const events = await response.json();
            renderEvents(events);
        } catch (error) {
            console.error('Error fetching events:', error);
            eventsContainer.innerHTML = '<p>Failed to load events. Please try again later.</p>';
        }
    };

    // Function to render events on the page
    const renderEvents = (events) => {
        eventsContainer.innerHTML = ''; // Clear any existing content
    
        if (events.length === 0) {
            eventsContainer.innerHTML = '<p>No events available at the moment.</p>';
            return;
        }
    
        events.forEach((event) => {
            const eventCard = document.createElement('article');
            eventCard.className = 'event-card';
            eventCard.innerHTML = `
                <img src="images/sample-event.jpg" alt="${event.name}" loading="lazy">
                <div class="event-info">
                    <h3 class="event-title">${event.name}</h3>
                    <p class="event-date"><i class="fas fa-calendar"></i> ${event.date}</p>
                    <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    <a href="view_event.html?id=${event.id}" class="btn btn-primary">View Event</a>
                </div>
            `;
            eventsContainer.appendChild(eventCard);
        });
    };
    

    // Fetch and display events on page load
    fetchEvents();
});
