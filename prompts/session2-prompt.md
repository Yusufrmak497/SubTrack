Extend the TinyVault page from Session 1 with more interactivity using vanilla JavaScript and DOM manipulation.

New requirements:
1. Add a form to create new subscriptions:
   - service name
   - category dropdown
   - billing cycle dropdown (Monthly/Yearly)
   - amount input
   - next payment date input
2. Dynamically render new cards into the subscription list.
3. Add a remove button on every card.
4. Add a live search box to filter subscriptions by service name.
5. Add a category filter dropdown.
6. Keep summary metrics updated in real time:
   - active count
   - estimated monthly total
7. Highlight cards with upcoming payments in the next 7 days.
8. Keep dark mode support compatible with dynamically added cards.

Goal: demonstrate why manual DOM/state updates become complex before React/Vue.
