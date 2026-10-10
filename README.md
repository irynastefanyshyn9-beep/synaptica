# SYNAPTICA UI

Concept marketplace for animated game HUD assets, rebuilt as a live site for a Technical Artist portfolio.
UX, UI and tech art by **Iryna Stefanyshyn** · HCID portfolio, Woolf University.

## What's inside

| Page | Tech art showcase |
|---|---|
| `index.html` | Cursor-reactive smoke shader; SDF health ring with damage chip, shield, low-HP pulse, chromatic split; parameter code for Unity, Unreal and Godot |
| `builder.html` | Drag-and-drop HUD editor with grid snapping, auto-anchoring, 16:9 / 21:9 / 9:16 and RectTransform / UMG / Godot anchor code |
| `components.html` | Motion demos, packs and per-component render budgets |
| `customizer.html` | Theme variables with overrides; bezier curve editor exporting Unity, Unreal and Godot curve tangents |
| `pricing.html` | Plans, comparison, FAQ, four-step checkout (demo only, nothing is sent) |

No build step and no dependencies: plain HTML, CSS, JavaScript and WebGL 1 (GLSL ES 1.0).

## Publish on GitHub Pages

1. Create a public repository, for example `synaptica`.
2. Upload every file in this folder to the repository root.
3. Open **Settings → Pages**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After about a minute the site is live at `https://<your-username>.github.io/synaptica/`.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder and visit `http://localhost:8000`.
