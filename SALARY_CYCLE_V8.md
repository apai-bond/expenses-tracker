# Salary Cycle Update - Version 8

## How the budget month works

The selected budget month is now based on the salary cycle instead of the calendar month.

Example for the August 2026 budget:

- Normal salary date: 27 July 2026
- August budget starts: 27 July 2026
- August budget ends: 26 August 2026
- A transaction dated 27 July is included in August, not July.

## Weekend adjustment

The app uses the 27th of the previous month as the automatic cycle start.

- If the 27th is Monday to Friday, it uses the 27th.
- If the 27th is Saturday, it moves to Friday the 26th.
- If the 27th is Sunday, it moves to Friday the 25th.

## Public holidays or other early payments

The app is offline and does not download a public-holiday calendar. In Monthly Setup, change **Salary received / cycle start date** to the actual earlier salary date.

The selected month ends one day before the next month's actual salary date. For example, if the September salary is received on 26 August, the August budget ends on 25 August.

## Existing records

Existing transactions do not need to be deleted or migrated. Version 8 reads transactions by their actual date and places them inside the selected salary-cycle date range.

## Updated files

- `cycle.js` - salary-cycle date rules
- `app.js` - interface and transaction-cycle handling
- `db.js` - date-range query for IndexedDB
- `calculations.py` - average daily spending by elapsed cycle days
- `index.html` - cycle display and salary-date setup
- `styles.css` - cycle interface styling
- `service-worker.js` - Version 8 cache
