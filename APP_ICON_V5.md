# App Icon Update V5

The Home Screen icon now uses a wallet, banknotes, and a spending chart instead of the text “RM”.

## Files

- `icons/apple-touch-icon.png` — iPhone and iPad Home Screen icon (180 x 180)
- `icons/icon-192.png` — PWA icon
- `icons/icon-512.png` — PWA and maskable icon
- `icons/icon-1024.png` — high-resolution source render
- `icons/app-icon.svg` — editable vector source
- `icons/favicon.svg` — browser-tab icon

The icon uses a deep teal full-bleed background and high-contrast mint artwork, so the same asset remains clear on both light and dark iPhone Home Screens. Web apps do not currently have a reliable native-style separate dark Home Screen icon asset, so this universal design is used.

After replacing the files, remove the existing Home Screen icon and add the web app again so iOS captures the new icon.
