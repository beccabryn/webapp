# External Widget Generation Contract

Generate small static external widgets for HN glanceables.

## Runtime

- The phone or companion receives a GitHub Pages base URL.
- It fetches `<base_url>/manifest.json`.
- `manifest.json` contains a `widgets` array.
- Each widget has `name`, `url`, and optionally `l2_url`.
- The L1 route at `url` is fetched as HTML-lite and rendered natively through
  `HtmlToWdsMapper` and WDS-backed components.
- The L2 route at `l2_url` can be a normal web app page.

## Manifest Shape

```json
{
  "widgets": [
    {
      "name": "Flight",
      "url": "flight/",
      "l2_url": "app/flight/"
    }
  ]
}
```

Rules:

- Keep `widgets` to 5 entries or fewer.
- Use relative URLs.
- Make L1 URLs directory routes ending in `/` for GitHub Pages compatibility.
- Keep names short enough for compact surfaces.

## L1 HTML-Lite Rules

L1 is for glanceable native rendering, not a web app.

- Bake all data directly into the HTML.
- Do not use JavaScript.
- Do not use external CSS.
- Avoid unsupported tags, including `table`, `ul`, `ol`, `canvas`, and `iframe`.
- Prefer simple structural tags: `div`, `span`, `p`, `h1`, `h2`, `h3`, `strong`,
  `em`, `small`, and `br`.
- Keep copy short and scannable.
- Use restrained inline styles only when they help hierarchy or spacing.
- Avoid web-card chrome that fights the native host container.
- Avoid assumptions about viewport, scrolling, absolute positioning, or complex
  layout.

## L1 Design Guidance

- Choose the layout archetype from the data being shown.
- Surface only the most glanceable facts.
- Use a compact title row with a simple monochrome leading icon or monogram.
- Use restrained hierarchy: one primary line, one status line, and a small number
  of supporting facts.
- Keep padding modest because the host widget container already provides outer
  spacing, radius, and border treatment.
- Do not include instructions, marketing copy, or explanatory UI text.

## L2 Guidance

L2 can be a fuller static app experience.

- Use normal HTML, CSS, and JavaScript if useful.
- Include more complete details, controls, or drill-down views.
- Keep hard-coded prototype data isolated and easy to replace.
- Preserve a clear relationship to the L1 widget's content.

## Flight Tracker L1 Content

For the first Flight Tracker example, assume the user linked United MileagePlus,
but use hard-coded data. Surface:

- Flight number and route
- Current status
- Departure time
- Gate
- Boarding or delay info if relevant

Do not include lower-priority details like seat, baggage claim, aircraft, or
long timeline content in L1. Put those in L2.
