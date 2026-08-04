# Navigation icon fix V4

The malformed black icons were caused by `index.html` being updated while an older
`styles.css` remained in the service-worker cache.

V4 fixes this by:

- adding explicit SVG stroke/fill attributes;
- versioning browser assets with `?v=4`;
- using a network-first service-worker strategy;
- forcing service-worker update checks during development.

For the first local test, open:

`http://localhost:8000/?v=4`

If an old version still appears, clear the site data for `localhost:8000` once and reload.
