# HN External Widgets Demo

Static GitHub Pages demo for generated external HN glanceable widgets.

The phone or companion app points at the GitHub Pages base URL, fetches
`manifest.json`, then loads each widget's L1 route. L1 routes are HTML-lite and
are intended to be rendered natively through `HtmlToWdsMapper` and WDS-backed
components. L2 routes can use normal web HTML, CSS, and JavaScript.

## Routes

- `manifest.json` - widget manifest
- `flight/` - L1 Flight Tracker widget
- `app/flight/` - L2 Flight Tracker app view

## Validate L1 HTML

Run the local validator before deploying:

```sh
node scripts/validate-l1-html.js
```

The validator checks that `manifest.json` exists, includes a `widgets` array with
at most five widgets, and that each L1 route exists and avoids scripts, external
CSS, and unsupported tags.

## Enable GitHub Pages

1. Push this repository to GitHub.
2. In the GitHub repository, open `Settings` -> `Pages`.
3. Set `Source` to `Deploy from a branch`.
4. Set `Branch` to `main` and folder to `/ (root)`.
5. Save and wait for the Pages deployment to complete.

## Verify Routes

Replace `<username>` and `<repo>` with the deployed Pages path:

```sh
curl -i https://<username>.github.io/<repo>/manifest.json
curl -i https://<username>.github.io/<repo>/flight/
curl -i https://<username>.github.io/<repo>/app/flight/
```

## Android Override

Point the device at the deployed GitHub Pages base URL:

```sh
adb shell setprop debug.glanceables.ext_widget_url "https://<username>.github.io/<repo>/"
```

After deployment or URL changes, restart Stella/SystemUI so the new manifest and
routes are fetched.
