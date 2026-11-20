# W1 Session 1 – SubTrack Landing Page (HTML + CSS)

I'm building a subscription tracker app called SubTrack. For the first week I just want a static landing page using HTML and CSS only, no JavaScript yet.

The landing page should be in a `landing/` folder with `index.html` and `style.css`.

## Sections I need

**Navbar:** Logo "SubTrack" on the left, nav links on the right (Features, Pricing, Login). Make it sticky so it stays at the top when scrolling. The background should be slightly transparent with a blur effect using `backdrop-filter: blur(8px)`.

**Hero section:** Big headline like "Stop losing money on forgotten subscriptions." with a subtext explaining the app. Two buttons – a primary one ("Get Started Free") and a secondary outline one ("See Features") that's a link to the features section with `href="#features"`. Below the buttons add a small stats row showing "1,200+ Users", "4 Currencies", "5-min Setup".

**Features section (`id="features"`):** Three cards in a CSS grid layout. Each card has an emoji icon, a heading and a short description. The three features are: Unified Dashboard, Smart Alerts, Spending Insights. Cards should have a hover effect where they lift up a bit and get a box-shadow (`transform: translateY(-4px)`).

**Pricing section (`id="pricing"`):** Two plan cards side by side. Free plan and Pro plan ($5/mo). The Pro card should have a "Most Popular" badge on top. List 3-4 bullet points for each plan showing what's included.

**Footer:** Copyright `© 2026 SubTrack`, links to Privacy, Terms, GitHub.

## Styling requirements

Use CSS custom properties on `:root` for all colors, don't hardcode hex values anywhere in the CSS:
```css
:root {
  --primary: #4f46e5;
  --secondary: #7c3aed;
  --text: #0f172a;
  --muted: #64748b;
  --bg: #f8fafc;
  --panel-bg: #ffffff;
  --border: #e2e8f0;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(0,0,0,0.08);
}
```

Load Inter from Google Fonts. The `h1` should be around `3rem` with `font-weight: 800`. Section headings `h2` centered, `2rem`.

The features grid: `grid-template-columns: repeat(3, 1fr)`. Pricing grid: `repeat(2, 1fr)` with `max-width: 640px`.

For the "Most Popular" badge use `position: absolute` on the pricing card with `top: -12px; left: 50%; transform: translateX(-50%)` and give it the primary color background.

Mobile (`max-width: 768px`): everything stacks to 1 column, hide the nav links for now (I'll add a hamburger in session 2).

Primary button: filled with `--primary` color. Secondary button: outline style with `border: 2px solid var(--primary)` and transparent background.
