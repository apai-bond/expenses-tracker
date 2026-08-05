# Pocket Budget - Salary Cycle Test Version

Pocket Budget is a mobile-first personal expense tracker that can run in Safari on an iPhone. Records are stored locally in IndexedDB on the device.

## Version 8 features

- Budget month based on the salary cycle rather than the 1st to the last day of the month
- Standard salary day set to the 27th of the previous month
- Automatic weekend adjustment to the previous Friday
- Manual actual salary-date adjustment for public holidays or other early payments
- Expense, income, and saving transactions
- Monthly salary and saving target
- Custom categories
- Edit and delete transactions
- Summary cards and expense charts
- Local IndexedDB database
- JSON backup and restore
- Light and Dark appearance
- Progressive Web App files
- Python calculation logic through Pyodide

## Salary-cycle example

The **August 2026** budget normally covers:

```text
27 July 2026 to 26 August 2026
```

Therefore, a transaction entered on 27 July is part of the August budget.

If the 27th falls on a weekend, the automatic date moves backward to Friday. Public holidays are not downloaded because the app is designed to work locally and offline. Use **Setup > Salary received / cycle start date** to enter the actual earlier salary date.

The cycle end is calculated automatically as one day before the next salary date.

## Important test-version security note

This version does not encrypt the local database and does not use a password. Do not enter banking passwords, card numbers, identity documents, or other highly sensitive information.

GitHub contains only the application code. Salary and expense records remain in the browser database on the device that entered them.

## File responsibilities

- `index.html`: application screens
- `styles.css`: mobile design and Light/Dark appearance
- `cycle.js`: salary-cycle date calculations
- `db.js`: IndexedDB local database operations
- `app.js`: interface, navigation, charts, and cycle handling
- `calculations.py`: Python financial summary calculations
- `manifest.webmanifest`: installable app information
- `service-worker.js`: local asset caching
- `start_server.py`: simple Python development server

## Test on Windows

1. Extract the project folder.
2. Open Command Prompt or PowerShell in the folder.
3. Run:

```text
python start_server.py
```

4. Open:

```text
http://localhost:8000/?v=8
```

Do not double-click `index.html`. The app loads its files through the local web server.

## Test on an iPhone on the same Wi-Fi

1. Keep `python start_server.py` running on the Windows computer.
2. Run `ipconfig` in Command Prompt.
3. Find the computer IPv4 address, for example `192.168.1.50`.
4. Open Safari on the iPhone and enter:

```text
http://192.168.1.50:8000/?v=8
```

The computer and iPhone must be connected to the same local network. Allow Python through Windows Firewall on private networks when prompted.

## Publish with GitHub Pages

Upload all project files to the repository root, including the new `cycle.js` file. GitHub Pages should deploy from the `main` branch and `/ (root)` folder.

After deployment, close and reopen the Home Screen app. The Version 8 service worker uses this cache name:

```text
pocket-budget-v8-salary-cycle
```

## Data backup

Use **Setup > Export JSON backup** and keep the file privately. Importing a backup replaces the current local data.

Clearing Safari website data or removing stored site data can delete the local database. Keep backups while testing.

## Python learning area

Start in `calculations.py`. It calculates:

- total income
- total expenses
- total savings
- available balance
- savings rate
- saving-target progress
- average daily spending based on elapsed salary-cycle days
- expense totals by category

## Version 10 - iPhone date picker fit

The transaction date and salary-cycle start date are constrained to the form width on iPhone Safari. The fix preserves the native iPhone date picker and does not change existing IndexedDB records.

## Version 12: adjustable Custom Sheet sizes

The Custom Sheet now supports individual column widths and row heights. On iPhone, select a cell and open **Cell size** to use the sliders. On a computer, you can also drag the right edge of a column heading or the bottom edge of a row number. Size settings are saved locally and included in JSON backups.


## Version 13 layout cleanup

- Salary-cycle summary is shown only on the Setup page.
- Empty spreadsheet cells are vertically centered with their row numbers.
- Touch devices hide row/column drag guides; use the Cell size panel instead.
