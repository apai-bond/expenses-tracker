# Pocket Budget V10 - iPhone Date Picker Fix

This update fixes the iPhone Safari date field extending beyond the transaction form.

Changes:

- Constrains date controls to the width of their form field.
- Resets Safari's intrinsic date-input width.
- Keeps the normal iPhone date picker available when the field is tapped.
- Left-aligns the displayed date consistently.
- Applies the same fix to the transaction date and salary-cycle start date.
- Updates the service-worker cache to `pocket-budget-v10-date-picker-fit`.

Existing local records and IndexedDB data are not changed.
