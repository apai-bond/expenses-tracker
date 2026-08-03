"""Python calculation layer for the Pocket Budget browser app.

The browser passes JSON strings into calculate_monthly_summary().
The function returns a JSON string so JavaScript can render the result.
"""

from __future__ import annotations

import calendar
import json
from collections import defaultdict
from datetime import date
from typing import Any


def _money(value: Any) -> float:
    """Convert a value to a safe two-decimal money amount."""
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def calculate_monthly_summary(month_json: str, transactions_json: str) -> str:
    """Calculate the dashboard summary for one selected month."""
    month_record = json.loads(month_json or "{}")
    transactions = json.loads(transactions_json or "[]")

    salary = _money(month_record.get("salary"))
    savings_target = _money(month_record.get("savingsTarget"))

    extra_income = 0.0
    expenses = 0.0
    savings = 0.0
    expense_by_category: dict[str, float] = defaultdict(float)

    for transaction in transactions:
        amount = _money(transaction.get("amount"))
        transaction_type = str(transaction.get("type", "")).lower()

        if transaction_type == "income":
            extra_income += amount
        elif transaction_type == "saving":
            savings += amount
        elif transaction_type == "expense":
            expenses += amount
            category = str(transaction.get("category") or "Uncategorised")
            expense_by_category[category] += amount

    total_income = round(salary + extra_income, 2)
    expenses = round(expenses, 2)
    savings = round(savings, 2)
    available = round(total_income - expenses - savings, 2)

    category_totals = [
        {"category": category, "amount": round(amount, 2)}
        for category, amount in expense_by_category.items()
    ]
    category_totals.sort(key=lambda item: item["amount"], reverse=True)

    top_category = category_totals[0]["category"] if category_totals else "-"
    savings_rate = round((savings / total_income) * 100, 1) if total_income else 0.0
    savings_progress = round((savings / savings_target) * 100, 1) if savings_target else 0.0

    selected_month = str(month_record.get("month") or "")
    average_daily = 0.0
    days_in_month = 0

    try:
        year, month_number = (int(part) for part in selected_month.split("-", 1))
        days_in_month = calendar.monthrange(year, month_number)[1]
        today = date.today()
        elapsed_days = today.day if (today.year == year and today.month == month_number) else days_in_month
        average_daily = round(expenses / max(elapsed_days, 1), 2)
    except (ValueError, TypeError):
        pass

    result = {
        "salary": salary,
        "extraIncome": round(extra_income, 2),
        "totalIncome": total_income,
        "expenses": expenses,
        "savings": savings,
        "savingsTarget": savings_target,
        "available": available,
        "savingsRate": savings_rate,
        "savingsProgress": savings_progress,
        "topCategory": top_category,
        "averageDaily": average_daily,
        "daysInMonth": days_in_month,
        "transactionCount": len(transactions),
        "categoryTotals": category_totals,
    }

    return json.dumps(result)
