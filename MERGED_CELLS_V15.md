# Version 15 - Merged cells

## How to merge

1. Open **Sheet**.
2. Tap the first cell of the range.
3. Tap **Merge cells**.
4. Tap the opposite corner cell.

The rectangular range is merged and the value/formula from the top-left cell is retained. If other cells contain data, the app asks for confirmation before clearing them.

## How to unmerge

Tap the merged cell and then tap **Unmerge**. The top-left value remains and the other cells become empty editable cells.

Merged ranges are saved locally in IndexedDB and are included in the JSON backup. CSV exports place the merged value in the top-left position and leave covered positions blank.
