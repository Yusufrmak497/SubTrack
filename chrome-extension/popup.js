document.addEventListener('DOMContentLoaded', () => {
    // Attempt auto-filling service name from current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      
      let url = tabs[0].url;
      let title = tabs[0].title;
      
      try {
        let hostname = new URL(url).hostname;
        let parts = hostname.split('.');
        
        // Remove subdomain 'www' and the top-level domain '.com'
        if (parts[0] === 'www') parts.shift();
        parts.pop();
        
        // Example: netflix -> Netflix
        let name = parts.join(' ');
        name = name.charAt(0).toUpperCase() + name.slice(1);
        
        if (name && name.length > 1) {
          document.getElementById('service_name').value = name;
        } else if (title) {
          document.getElementById('service_name').value = title.split(' ')[0];
        }
      } catch(e) {
        console.log('Error parsing URL for autofill', e);
      }
    });
  
    // Listen for form submission
    document.getElementById('add-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const serviceName = document.getElementById('service_name').value;
      const amount = parseFloat(document.getElementById('amount').value);
      const billingCycle = document.getElementById('billing_cycle').value;
      
      const submitBtn = document.getElementById('submit-btn');
      const statusMsg = document.getElementById('status-msg');
      
      submitBtn.textContent = 'Saving locally...';
      submitBtn.disabled = true;
      
      // Default next payment date to 30 days from today for a fresh addition
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const nextDateStr = futureDate.toISOString().split('T')[0];
      
      const payload = {
        service_name: serviceName,
        amount: amount,
        billing_cycle: billingCycle,
        category: "Uncategorized",
        next_payment_date: nextDateStr,
        is_active: true
      };
      
      try {
        const response = await fetch("http://localhost:8000/subscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error('Server returned ' + response.status);
        }
        
        // Show success and close the popup after slight delay
        statusMsg.textContent = '✅ Saved securely to TinyVault!';
        statusMsg.className = 'success';
        submitBtn.style.display = 'none';
        
        setTimeout(() => {
          window.close();
        }, 1500);
        
      } catch(err) {
        statusMsg.textContent = '❌ Connection Error: Ensure api is running on localhost:8000';
        statusMsg.className = 'error';
        submitBtn.textContent = 'Retry Save';
        submitBtn.disabled = false;
      }
    });
  });
