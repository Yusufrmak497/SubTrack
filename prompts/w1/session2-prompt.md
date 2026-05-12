# W1 Session 2 – JavaScript Interactivity + PHP Contact Form

Now I want to add JavaScript to the landing page from session 1 and a PHP contact form. All JS goes in `landing/app.js` and link it at the bottom of `index.html` with `defer`.

## Dark mode toggle

Add a toggle button in the navbar (sun/moon icon). When clicked it adds/removes a `.dark` class on `<body>`. Save the preference with `localStorage.setItem('theme', 'dark')`. On page load, read it back and apply the class before the page renders so there's no flash:

```js
const saved = localStorage.getItem('theme');
if (saved === 'dark') document.body.classList.add('dark');
```

Add dark mode CSS variables on `body.dark`. Because session 1 uses CSS custom properties everywhere, just overriding the variables on `body.dark` should flip everything automatically:
```css
body.dark {
  --bg: #0f172a;
  --panel-bg: #1e293b;
  --text: #f1f5f9;
  --muted: #94a3b8;
  --border: #334155;
}
```

## Scroll-activated navbar

Add a shadow and solid background to the navbar when the user scrolls more than 60px. Use a scroll event listener and toggle a `.scrolled` class:
```js
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 60);
});
```
Style `.scrolled` in CSS to add `background: var(--panel-bg)` and a box-shadow.

## Hamburger menu for mobile

Add a hamburger button (`id="hamburger"`) to the navbar that only shows on screens under 768px. Clicking it toggles an `.open` class on the nav links container. CSS hides the links by default on mobile and shows them when `.open` is present using `display: flex; flex-direction: column`.

## FAQ accordion

Add a `<section id="faq">` with 3 questions about the app (e.g. "Is SubTrack free?", "Which currencies are supported?", "Can I cancel anytime?"). Each FAQ item is a container `div.faq-item` with a `button.faq-q` and a `div.faq-a` inside.

The answer div should be hidden by default using `max-height: 0; overflow: hidden; transition: max-height 0.35s ease`. When `.open` is added, set `max-height: 200px`.

JavaScript: clicking a question adds `.open` to that item and removes it from all others (only one open at a time).

## Counter animation

The stats row in the hero ("1,200+ Users" etc.) should count up from 0 when scrolled into view. Store the target number as `data-target="1200"` on a `span.counter`. Use `IntersectionObserver` with `threshold: 0.5` to trigger the animation:

```js
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = +el.dataset.target;
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;
    const tick = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString();
      if (current < target) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    observer.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(c => observer.observe(c));
```

## PHP contact form

Add a contact section at the bottom of the page with a form: name (text), email (email), message (textarea), submit button.

Create `landing/contact.php`. It should:
- Check `$_SERVER['REQUEST_METHOD'] === 'POST'`
- Get the three fields from `$_POST` and sanitize with `htmlspecialchars()`
- Return `400` JSON if any field is empty or email fails `filter_var($email, FILTER_VALIDATE_EMAIL)`
- Return `200` JSON `{"success": true, "message": "Thanks, NAME!"}` on success
- Set `header('Content-Type: application/json')` at the top

Wire it in JS using `fetch('contact.php', { method: 'POST', body: new FormData(form) })`. Show the response message below the form. Disable the submit button while the request is in progress and re-enable it after. Reset the form on success. Don't reload the page.

## Smooth scroll

All navbar links and the hero "See Features" button have `href="#section-id"`. Override the default jump with `scrollIntoView({ behavior: 'smooth' })` using event listeners on all `a[href^="#"]` elements.
