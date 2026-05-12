# W4 Session 2 – CRUD, Filters, Detail Modal

Now I want to make the frontend fully interactive. Add create, delete, search/filter/sort controls, and a detail modal with edit mode.

## Add subscription form (`src/components/AddSubscriptionForm.jsx`)

A form component with these fields: service name (text input), category (text input), billing cycle (select: Monthly/Yearly), amount (number input), next payment date (date input).

On submit, call `POST /subscriptions` with the form data as JSON. Use the `Authorization: Bearer {token}` header if a token is available (I'll add real auth later, for now just pass an empty string). After a successful create:
- Call a `onCreate` callback prop so the parent can refresh the list
- Reset the form fields
- Show a success toast with `react-hot-toast`

Show an error toast if the request fails.

## Delete

In `SubscriptionCard`, add a "Remove" button. When clicked, call `DELETE /subscriptions/{id}`. On success, call an `onDelete` callback prop and show a toast. The parent component removes the card from the list state without re-fetching everything.

## Search and filter controls (`src/components/SubscriptionList.jsx`)

Add above the card grid:
- A text input for searching by service name. As the user types, update a `search` state. Pass it as a query param to the fetch: `?search=netflix`.
- A `<select>` for category filter (build the options from the unique categories in the loaded data).
- Sort controls: a `<select>` for sort field (Name, Amount, Next Payment) and a toggle button for asc/desc.

When any filter changes, re-fetch from the API with the updated query params. Debounce the search input by 300ms so it doesn't fire on every keystroke.

## Detail modal (`src/components/SubscriptionDetail.jsx`)

When a subscription card is clicked (but not the Remove button – use `stopPropagation`), open a modal overlay showing full details:
- All subscription fields
- The audit history from `GET /subscriptions/{id}/audits`
- Pause/Resume button that calls `PUT /subscriptions/{id}` with `{is_active: !current}`
- Edit button
- Calendar download link: `<a href="{API_URL}/subscriptions/{id}/calendar" download>`
- Close button + click outside to close

**Edit mode:** When Edit is clicked, replace the displayed values with input fields (same fields as the add form). Show Save and Cancel buttons. Save calls `PUT /subscriptions/{id}` with only the changed fields. On success update the card in the parent list state and close edit mode. On cancel revert to the original values.

## State management in parent

In `App.jsx` (or `SubscriptionList.jsx`), hold the `subscriptions` array in state. After create/delete/update, update the state directly instead of re-fetching the whole list where possible. After a full create, add the new subscription to the front of the array. After delete, filter it out by id. After update, replace the item in the array with the updated response.
