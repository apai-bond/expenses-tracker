# Pocket Budget V16 - Dashboard value links

The Custom Sheet can now display the current budget's **Available balance** in any cell.

## Use

1. Open **Sheet**.
2. In **Dashboard link**, choose **Available balance**.
3. Enter a target cell such as `A10`.
4. Tap **Link value**.

The linked cell updates automatically whenever the selected budget month, salary, saving entries, or expense transactions change. Use **Refresh** for an immediate manual recalculation and **Unlink cell** to return it to a normal editable cell.

You can also type `=AVAILABLE()` directly in a normal formula cell. Linked cells are saved in IndexedDB and included in JSON backups.
