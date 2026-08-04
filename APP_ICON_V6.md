# App Icon Update V6

The Home Screen icon now follows the visual language of Apple dark icons: a near-black full-bleed background, high-contrast teal/mint wallet artwork, and a gold chart coin. It contains no text.

## Included icon files

- `icons/apple-touch-icon.png` — 180 x 180 iPhone/iPad Home Screen icon
- `icons/icon-192.png` — 192 x 192 manifest icon
- `icons/icon-512.png` — 512 x 512 manifest and maskable icon
- `icons/icon-1024.png` — 1024 x 1024 source render
- `icons/app-icon.svg` — editable vector source
- `icons/favicon.svg` — browser-tab icon

## iPhone behavior

The icon is deliberately designed as a universal dark-style icon, so it remains recognizable on both light and dark Home Screens. A Home Screen web app does not reliably switch between separate light and dark icon files in the same way as a native iOS app.

After publishing the update, remove the old Pocket Budget icon from the Home Screen and add it again so Safari captures the replacement icon.
