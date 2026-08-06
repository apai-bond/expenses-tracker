# Publish Pocket Budget Version 16 with GitHub Pages

1. Extract the ZIP file on your Windows computer.
2. Open your existing `pocket-budget` GitHub repository.
3. Upload all replacement files to the repository root. Upload the complete Version 16 project or the listed replacement files from the update package.
4. Confirm these files are directly beside `index.html`:

```text
app.js
cycle.js
db.js
styles.css
calculations.py
service-worker.js
manifest.webmanifest
```

5. Commit the changes to the `main` branch.
6. In **Settings > Pages**, keep the source set to `main` and `/(root)`.
7. Wait for GitHub Pages to redeploy.
8. Open the Pages URL and refresh it once.
9. For an installed iPhone Home Screen app, close the app completely and reopen it.

Version 16 uses this service-worker cache:

```text
pocket-budget-v16-dashboard-links
```

If an old version remains in a desktop browser, open:

```text
https://YOUR-USERNAME.github.io/pocket-budget/?v=16
```

Do not upload exported personal backup JSON files to the public repository.
