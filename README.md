# Pocket Budget - Test Version

Pocket Budget is a mobile-first monthly expense tracker that can run in Safari on an iPhone.

## Included in Version 1

- Monthly salary setup
- Monthly saving target
- Expense, income, and saving transactions
- Custom categories
- Edit and delete transactions
- Monthly summary cards
- Expense category doughnut chart
- Highest-category bars
- Search and filter
- Local IndexedDB database
- JSON backup and restore
- Progressive Web App files
- Python calculation logic through Pyodide

## Important Test-Version Security Note

This version does not encrypt the local database and does not use a password. Do not enter banking passwords, card numbers, identity documents, or other highly sensitive information.

The financial records are stored in the browser database on the device that opened the app. GitHub contains only the application code when the project is hosted on GitHub Pages.

## File Responsibilities

- `index.html`: application screens
- `styles.css`: iPhone-friendly design
- `db.js`: IndexedDB local database operations
- `app.js`: interface, navigation, charts, and connection to Python
- `calculations.py`: Python monthly summary calculations
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

4. Open this address on the computer:

```text
http://localhost:8000
```

Do not double-click `index.html`. The app loads `calculations.py` through the web server.

## Test on an iPhone on the Same Wi-Fi

1. Keep `python start_server.py` running on the Windows computer.
2. Run `ipconfig` in Command Prompt.
3. Find the computer IPv4 address, for example `192.168.1.50`.
4. On the iPhone, open Safari and enter:

```text
http://192.168.1.50:8000
```

Windows Firewall may ask whether Python is allowed on the private network. Allow private-network access for testing.

This local HTTP test is suitable for checking the interface and records. Full PWA caching works best after HTTPS deployment.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload all project files, preserving the `icons` folder.
3. Open repository Settings.
4. Open Pages.
5. Select deployment from the main branch and root folder.
6. Open the generated HTTPS address in iPhone Safari.
7. Tap Share, then Add to Home Screen.

## Data Backup

Use Setup > Export JSON backup. Save the file to the iPhone Files app, iCloud Drive, Google Drive, or Dropbox.

Use Setup > Import JSON backup to restore it. Import replaces all current local app data.

Clearing Safari website data, changing browser, or removing stored site data can delete the local database. Keep backups while testing.

## Where to Learn Python

Start in `calculations.py`. The main function is:

```python
calculate_monthly_summary(month_json, transactions_json)
```

It calculates:

- total income
- total expenses
- total savings
- available balance
- savings rate
- savings target progress
- average daily spending
- expense totals by category

Change or add formulas there, refresh the app, and inspect how the dashboard changes.
