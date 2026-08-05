# Pocket Budget Version 11 - Custom Sheet

Version 11 adds a new bottom navigation tab named **Sheet**.

Use it as a free spreadsheet-style record area for anything that does not belong in the monthly expense transaction records.

## Main features

- One local custom sheet stored in IndexedDB
- Editable cells
- Add row
- Add column
- Header row on/off
- Formula bar
- Formula cells
- Export CSV
- Clear sheet only

## Supported formulas

Type formulas directly into any cell or into the formula bar after selecting a cell.

Examples:

```text
=SUM(B2:B10)
=AVG(C2:C8)
=MIN(B2:B10)
=MAX(B2:B10)
=COUNT(A2:A20)
=A2+B2
=A2*B2
```

Formula result is shown under the formula in the same cell.

## Notes

- The custom sheet is independent from salary-cycle expenses.
- The sheet is included in JSON backup/export.
- The sheet is cleared when using Delete all test data.
- CSV export saves calculated formula results instead of the formula text.
