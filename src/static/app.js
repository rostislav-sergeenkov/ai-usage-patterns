document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear select and add placeholder to avoid duplicates
      activitySelect.innerHTML = '<option value="" disabled selected>-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - (details.participants ? details.participants.length : 0);

        // Build participants list HTML
        let participantsHtml = "";
        if (details.participants && details.participants.length > 0) {
          participantsHtml += '<ul class="participants-list">';
          details.participants.forEach((p) => {
            const email = typeof p === "string" ? p : (p.email || p.name || JSON.stringify(p));
            const display = email;
            // Include a delete button which will call the unregister endpoint
            participantsHtml += `<li data-email="${encodeURIComponent(email)}"><span class="participant-name">${display}</span> <button class="participant-delete" title="Unregister">\u2716</button></li>`;
          });
          participantsHtml += "</ul>";
        } else {
          participantsHtml = '<p class="no-participants">No participants yet</p>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants-section">
            <strong>Participants</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      // After rendering all activities, attach delete handlers
      document.querySelectorAll('.participant-delete').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
          // Prevent other click handlers
          event.stopPropagation();
          const li = btn.closest('li');
          if (!li) return;
          const encodedEmail = li.getAttribute('data-email');
          const email = decodeURIComponent(encodedEmail || '');
          // Determine activity name from nearest activity card
          const activityCard = btn.closest('.activity-card');
          if (!activityCard) return;
          const activityName = activityCard.querySelector('h4')?.textContent;

          if (!activityName) return;

          // Confirm action with the user
          if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

          try {
            const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
            const result = await resp.json().catch(() => ({}));
            if (resp.ok) {
              // Remove the participant from the UI
              li.remove();
              // If list becomes empty, show no participants message
              const ul = activityCard.querySelector('.participants-list');
              if (ul && ul.children.length === 0) {
                const section = activityCard.querySelector('.participants-section');
                if (section) {
                  const noP = document.createElement('p');
                  noP.className = 'no-participants';
                  noP.textContent = 'No participants yet';
                  // remove the empty ul
                  ul.remove();
                  section.appendChild(noP);
                }
              }
              // show a brief success message
              messageDiv.textContent = result.message || `${email} unregistered from ${activityName}`;
              messageDiv.className = 'success';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              // Refresh activities to ensure UI matches server state
              fetchActivities();
            } else {
              messageDiv.textContent = result.detail || 'Failed to unregister participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          } catch (err) {
            console.error('Unregister error', err);
            messageDiv.textContent = 'Failed to unregister participant';
            messageDiv.className = 'error';
            messageDiv.classList.remove('hidden');
            setTimeout(() => messageDiv.classList.add('hidden'), 4000);
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to show updated participants without page reload
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
