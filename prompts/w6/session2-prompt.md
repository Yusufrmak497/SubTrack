# W6 Session 2 – SaaS UI + Tags + GSAP + Category Chart

Big UI upgrade this session. The app needs to look like a real SaaS product before the presentation. I also want to wire up the tags feature that the backend now supports.

## Design system overhaul

Replace the basic CSS with a proper design system in `src/index.css`. Use CSS custom properties for everything:

```css
:root {
  --primary: #4f46e5;
  --secondary: #7c3aed;
  --bg: #f0f2f8;
  --panel-bg: rgba(255,255,255,0.82);
  --panel-border: rgba(255,255,255,0.55);
  --text: #1e1b4b;
  --muted: #64748b;
  --input-bg: rgba(255,255,255,0.7);
  --input-border: #c7d2fe;
  --overlay-bg: rgba(15,23,42,0.55);
  --shadow: 0 4px 24px rgba(79,70,229,0.10);
}

body.dark {
  --bg: #0f0f1a;
  --panel-bg: rgba(30,27,75,0.72);
  --panel-border: rgba(99,102,241,0.18);
  --text: #e2e8f0;
  --muted: #94a3b8;
  --input-bg: rgba(30,27,75,0.55);
  --input-border: #3730a3;
}
```

Add a dark mode toggle button in the header that adds/removes `.dark` on `<body>` and saves to `localStorage`.

## Form chip controls

The add subscription form currently uses plain inputs and dropdowns. Replace them:

**Category:** Replace the text input with clickable pill buttons. Create `.form-chips` container and `.form-chip` buttons for `['Entertainment','Music','Productivity','Cloud','Education','Finance']`. The selected chip gets an `.active` class with primary color background.

**Billing cycle:** Replace the `<select>` with a segmented toggle. Two buttons (`Monthly` / `Yearly`) inside a `.billing-toggle` container. Active one gets the primary color. Style with `border-radius: 10px; overflow: hidden` on the container.

## Tag input in the add form

Add a tag input below the other fields. The user types a tag name and presses Enter or comma to add it. Tags appear as removable chips (with an `×` button). On submit, send them in the `tags` array.

Show existing tags on subscription cards as small colored badges like `#streaming`.

In the detail modal, show tags in view mode. In edit mode, show the same chip input so tags can be added or removed.

## GSAP animation on modal open

Install `gsap` and `@gsap/react`. When the detail modal opens, animate the modal card in:
```js
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

useGSAP(() => {
  if (subscription && modalRef.current) {
    gsap.from(modalRef.current, {
      scale: 0.85, opacity: 0, y: 20,
      ease: 'back.out(1.4)', duration: 0.45, clearProps: 'all'
    })
  }
}, { dependencies: [subscription] })
```

## Category chart

Install `recharts`. Create `src/components/CategoryChart.jsx`. Show a `PieChart` that displays spending breakdown by category. Use `useMemo` to derive the chart data from the subscriptions array:

```js
const chartData = useMemo(() =>
  Object.entries(
    subscriptions
      .filter(s => s.is_active)
      .reduce((acc, s) => {
        acc[s.category] = (acc[s.category] || 0) + s.estimated_monthly_amount
        return acc
      }, {})
  ).map(([name, value]) => ({ name, value: +value.toFixed(2) })),
[subscriptions])
```

## Currency selector in summary cards

The backend has `GET /subscriptions/summary/converted?currency=TRY`. Add 3 chip buttons (USD / TRY / EUR) to the summary area. When one is clicked, fetch the converted total and show it in the "Converted Total" card. While loading show "Loading…", on error show "Unavailable".
