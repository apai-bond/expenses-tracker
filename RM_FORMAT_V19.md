# Pocket Budget Version 19 — RM cell format

## New custom-sheet option

Select any normal spreadsheet cell and tap **RM format**. A stored value such as `300` is displayed as `RM 300.00`, while the raw numeric value remains available to formulas such as `=A1+A2` or `=SUM(A1:A10)`.

Tap **Remove RM** to return the selected cell to plain-number display. Formula cells continue to use RM formatting by default for backward compatibility, but can now also be switched to plain-number display. Dashboard-linked cells remain RM formatted automatically.

The chosen cell formats are saved in IndexedDB and included in JSON backups. The calculation parser also accepts values manually entered with an `RM` or `MYR` prefix.
