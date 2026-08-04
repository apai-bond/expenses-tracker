"use strict";

const state = {
  currentMonth: getLocalMonth(new Date()),
  currentView: "home",
  monthRecord: null,
  transactions: [],
  categories: [],
  python: null,
  pythonReady: false,
  toastTimer: null
};

const THEME_STORAGE_KEY = "pocket-budget-theme";
const THEME_COLORS = {
  light: "#f3f6f8",
  dark: "#0d1514"
};

const CHART_COLORS = [
  "#0f766e",
  "#315f93",
  "#b57a2b",
  "#8b5f9e",
  "#b64545",
  "#4f7f45"
];

document.addEventListener("DOMContentLoaded", initializeApp);

async function initializeApp() {
  initializeTheme();
  bindEvents();
  document.getElementById("monthPicker").value = state.currentMonth;
  setDefaultTransactionDate();

  try {
    await BudgetDB.initialize();
    setEngineStatus("Local database ready. Loading Python calculations...", "");
    await refreshAll();
    loadPythonEngine();
    registerServiceWorker();
  } catch (error) {
    console.error(error);
    setEngineStatus("Unable to open the local database.", "warning");
    showToast("Database error: " + error.message);
  }
}

function bindEvents() {
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const view = button.dataset.view;
      if (view === "add" && !document.getElementById("editingId").value) {
        resetTransactionForm();
      }
      showView(view);
    });
  });

  document.querySelectorAll("[data-go-view]").forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.goView));
  });

  document.getElementById("monthPicker").addEventListener("change", async (event) => {
    state.currentMonth = event.target.value || getLocalMonth(new Date());
    setDefaultTransactionDate();
    await refreshAll();
  });

  document.querySelectorAll(".type-button").forEach((button) => {
    button.addEventListener("click", () => setTransactionType(button.dataset.type));
  });

  document.getElementById("transactionForm").addEventListener("submit", saveTransactionFromForm);
  document.getElementById("cancelEditButton").addEventListener("click", () => {
    resetTransactionForm();
    showView("transactions");
  });

  document.getElementById("monthSetupForm").addEventListener("submit", saveMonthSetup);
  document.getElementById("categoryForm").addEventListener("submit", addCategoryFromForm);

  document.getElementById("transactionSearch").addEventListener("input", renderAllTransactions);
  document.getElementById("transactionTypeFilter").addEventListener("change", renderAllTransactions);

  document.getElementById("sampleDataButton").addEventListener("click", createSampleData);
  document.getElementById("exportButton").addEventListener("click", exportBackup);
  document.getElementById("importFile").addEventListener("change", importBackup);
  document.getElementById("resetButton").addEventListener("click", resetAllData);

  window.addEventListener("resize", debounce(() => renderDashboard(), 150));
}

function initializeTheme() {
  const savedTheme = getSavedTheme();
  const systemTheme = getSystemTheme();
  applyTheme(savedTheme || systemTheme, false);

  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return;

  const handleSystemThemeChange = (event) => {
    if (!getSavedTheme()) {
      applyTheme(event.matches ? "dark" : "light", false);
    }
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handleSystemThemeChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(handleSystemThemeChange);
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
  renderDashboard();
  showToast(`${capitalize(nextTheme)} mode enabled.`);
}

function applyTheme(theme, savePreference) {
  const resolvedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;

  if (savePreference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    } catch (error) {
      console.warn("Theme preference could not be saved:", error);
    }
  }

  const meta = document.getElementById("themeColorMeta");
  if (meta) meta.setAttribute("content", THEME_COLORS[resolvedTheme]);

  const toggle = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  if (toggle && icon) {
    const targetTheme = resolvedTheme === "dark" ? "light" : "dark";
    icon.textContent = resolvedTheme === "dark" ? "☀" : "☾";
    toggle.setAttribute("aria-label", `Switch to ${targetTheme} mode`);
    toggle.setAttribute("title", `Switch to ${targetTheme} mode`);
  }
}

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : null;
  } catch (_) {
    return null;
  }
}

function getSystemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

async function loadPythonEngine() {
  try {
    await loadExternalScript("https://cdn.jsdelivr.net/pyodide/v314.0.3/full/pyodide.js");
    state.python = await globalThis.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.3/full/"
    });

    const response = await fetch("calculations.py", { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Could not load calculations.py");
    }

    const pythonCode = await response.text();
    await state.python.runPythonAsync(pythonCode);
    state.pythonReady = true;
    setEngineStatus("Local database ready. Python calculations active.", "ready");
    renderDashboard();
  } catch (error) {
    console.error("Python engine failed to load:", error);
    state.pythonReady = false;
    setEngineStatus("Local database ready. JavaScript calculation fallback is active.", "warning");
  }
}

async function refreshAll() {
  const [monthRecord, transactions, categories] = await Promise.all([
    BudgetDB.getMonth(state.currentMonth),
    BudgetDB.getTransactionsByMonth(state.currentMonth),
    BudgetDB.getAllCategories()
  ]);

  state.monthRecord = monthRecord;
  state.transactions = transactions;
  state.categories = categories;

  populateMonthSetup();
  renderCategoryOptions();
  renderCategoryList();
  renderAllTransactions();
  renderDashboard();
}

function showView(viewName) {
  const validViews = ["home", "transactions", "add", "settings"];
  const nextView = validViews.includes(viewName) ? viewName : "home";
  state.currentView = nextView;

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.getElementById(nextView + "View").classList.add("active");

  document.querySelectorAll(".nav-button").forEach((button) => {
    const isActive = button.dataset.view === nextView;
    button.classList.toggle("active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (nextView === "home") renderDashboard();
  if (nextView === "transactions") renderAllTransactions();
  if (nextView === "settings") populateMonthSetup();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveMonthSetup(event) {
  event.preventDefault();

  const salary = numberValue(document.getElementById("monthlySalary").value);
  const savingsTarget = numberValue(document.getElementById("monthlySavingTarget").value);

  state.monthRecord = {
    ...state.monthRecord,
    month: state.currentMonth,
    salary,
    savingsTarget,
    createdAt: state.monthRecord?.createdAt || new Date().toISOString()
  };

  await BudgetDB.saveMonth(state.monthRecord);
  await refreshAll();
  showToast("Monthly setup saved.");
  showView("home");
}

function populateMonthSetup() {
  if (!state.monthRecord) return;
  document.getElementById("monthlySalary").value = state.monthRecord.salary || "";
  document.getElementById("monthlySavingTarget").value = state.monthRecord.savingsTarget || "";
  document.getElementById("setupMonthName").textContent = formatMonthName(state.currentMonth);
}

async function saveTransactionFromForm(event) {
  event.preventDefault();

  const editingId = document.getElementById("editingId").value;
  const type = document.getElementById("transactionType").value;
  const amount = numberValue(document.getElementById("transactionAmount").value);
  const date = document.getElementById("transactionDate").value;
  const category = document.getElementById("transactionCategory").value;
  const note = document.getElementById("transactionNote").value.trim();

  if (!amount || amount <= 0) {
    showToast("Enter an amount greater than zero.");
    return;
  }

  if (!date || !category) {
    showToast("Date and category are required.");
    return;
  }

  const month = date.slice(0, 7);
  const existing = editingId
    ? state.transactions.find((record) => Number(record.id) === Number(editingId))
    : null;

  const record = {
    id: editingId ? Number(editingId) : undefined,
    type,
    amount,
    date,
    month,
    category,
    note,
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  if (editingId) {
    await BudgetDB.updateTransaction(record);
    showToast("Transaction updated.");
  } else {
    delete record.id;
    await BudgetDB.addTransaction(record);
    showToast("Transaction saved.");
  }

  if (state.currentMonth !== month) {
    state.currentMonth = month;
    document.getElementById("monthPicker").value = month;
  }

  resetTransactionForm();
  await refreshAll();
  showView("home");
}

function setTransactionType(type) {
  const validType = ["expense", "income", "saving"].includes(type) ? type : "expense";
  document.getElementById("transactionType").value = validType;
  document.querySelectorAll(".type-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === validType);
  });
  renderCategoryOptions();
}

function renderCategoryOptions() {
  const select = document.getElementById("transactionCategory");
  const currentValue = select.value;
  const type = document.getElementById("transactionType").value || "expense";
  const matching = state.categories.filter((category) => category.type === type);

  select.innerHTML = matching
    .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
    .join("");

  if (matching.some((category) => category.name === currentValue)) {
    select.value = currentValue;
  }
}

function resetTransactionForm() {
  document.getElementById("transactionForm").reset();
  document.getElementById("editingId").value = "";
  document.getElementById("transactionFormTitle").textContent = "Add transaction";
  document.getElementById("cancelEditButton").classList.add("hidden");
  setTransactionType("expense");
  setDefaultTransactionDate();
}

function editTransaction(id) {
  const record = state.transactions.find((item) => Number(item.id) === Number(id));
  if (!record) return;

  document.getElementById("editingId").value = record.id;
  document.getElementById("transactionFormTitle").textContent = "Edit transaction";
  document.getElementById("transactionAmount").value = record.amount;
  document.getElementById("transactionDate").value = record.date;
  document.getElementById("transactionNote").value = record.note || "";
  document.getElementById("cancelEditButton").classList.remove("hidden");
  setTransactionType(record.type);
  document.getElementById("transactionCategory").value = record.category;
  showView("add");
}

async function removeTransaction(id) {
  const record = state.transactions.find((item) => Number(item.id) === Number(id));
  if (!record) return;

  const confirmed = window.confirm(`Delete ${record.category} for ${formatMoney(record.amount)}?`);
  if (!confirmed) return;

  await BudgetDB.deleteTransaction(id);
  await refreshAll();
  showToast("Transaction deleted.");
}

async function addCategoryFromForm(event) {
  event.preventDefault();

  const type = document.getElementById("newCategoryType").value;
  const input = document.getElementById("newCategoryName");
  const name = input.value.trim();

  if (!name) return;

  const duplicate = state.categories.some(
    (category) => category.type === type && category.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    showToast("That category already exists.");
    return;
  }

  await BudgetDB.addCategory({
    id: `${type}-${slugify(name)}-${Date.now()}`,
    name,
    type,
    isDefault: false
  });

  input.value = "";
  state.categories = await BudgetDB.getAllCategories();
  renderCategoryOptions();
  renderCategoryList();
  showToast("Category added.");
}

function renderCategoryList() {
  const container = document.getElementById("categoryList");
  const types = ["expense", "income", "saving"];

  container.innerHTML = types.map((type) => {
    const items = state.categories.filter((category) => category.type === type);
    return `
      <div class="category-group">
        <h3>${escapeHtml(type)} categories</h3>
        <div class="category-chips">
          ${items.map((category) => `
            <span class="category-chip">
              ${escapeHtml(category.name)}
              <button type="button" data-delete-category="${escapeHtml(category.id)}" aria-label="Delete ${escapeHtml(category.name)}">x</button>
            </span>
          `).join("")}
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll("[data-delete-category]").forEach((button) => {
    button.addEventListener("click", () => removeCategory(button.dataset.deleteCategory));
  });
}

async function removeCategory(id) {
  const category = state.categories.find((item) => item.id === id);
  if (!category) return;

  const sameTypeCount = state.categories.filter((item) => item.type === category.type).length;
  if (sameTypeCount <= 1) {
    showToast("Keep at least one category for each transaction type.");
    return;
  }

  const confirmed = window.confirm(`Remove the ${category.name} category? Existing transactions will keep the old category name.`);
  if (!confirmed) return;

  await BudgetDB.deleteCategory(id);
  state.categories = await BudgetDB.getAllCategories();
  renderCategoryOptions();
  renderCategoryList();
  showToast("Category removed.");
}

function renderAllTransactions() {
  const container = document.getElementById("allTransactions");
  if (!container) return;

  const searchText = document.getElementById("transactionSearch").value.trim().toLowerCase();
  const typeFilter = document.getElementById("transactionTypeFilter").value;

  const filtered = state.transactions.filter((record) => {
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    const searchable = `${record.category} ${record.note || ""}`.toLowerCase();
    const matchesSearch = !searchText || searchable.includes(searchText);
    return matchesType && matchesSearch;
  });

  document.getElementById("transactionCount").textContent = `${filtered.length} ${filtered.length === 1 ? "record" : "records"}`;

  if (!filtered.length) {
    container.innerHTML = emptyState("No matching transactions for this month.");
    return;
  }

  container.innerHTML = filtered.map((record) => transactionRow(record, true)).join("");

  container.querySelectorAll("[data-edit-transaction]").forEach((button) => {
    button.addEventListener("click", () => editTransaction(button.dataset.editTransaction));
  });

  container.querySelectorAll("[data-delete-transaction]").forEach((button) => {
    button.addEventListener("click", () => removeTransaction(button.dataset.deleteTransaction));
  });
}

async function renderDashboard() {
  if (!state.monthRecord) return;

  const summary = await calculateSummary();
  document.getElementById("totalIncome").textContent = formatMoney(summary.totalIncome);
  document.getElementById("totalExpenses").textContent = formatMoney(summary.expenses);
  document.getElementById("totalSavings").textContent = formatMoney(summary.savings);
  document.getElementById("availableBalance").textContent = formatMoney(summary.available);
  document.getElementById("savingTargetText").textContent = `${formatMoney(summary.savings)} of ${formatMoney(summary.savingsTarget)}`;
  document.getElementById("savingPercent").textContent = `${Math.round(summary.savingsProgress || 0)}%`;
  document.getElementById("savingProgress").style.width = `${Math.min(Math.max(summary.savingsProgress || 0, 0), 100)}%`;
  document.getElementById("savingsRate").textContent = `${Number(summary.savingsRate || 0).toFixed(1)}%`;
  document.getElementById("topCategory").textContent = summary.topCategory || "-";
  document.getElementById("averageDaily").textContent = formatMoney(summary.averageDaily || 0);
  document.getElementById("chartTotal").textContent = compactMoney(summary.expenses);

  const needsSetup = Number(state.monthRecord.salary || 0) === 0 && state.transactions.length === 0;
  document.getElementById("setupNotice").classList.toggle("hidden", !needsSetup);

  const chartData = groupChartData(summary.categoryTotals || []);
  drawDoughnut(document.getElementById("categoryChart"), chartData);
  renderChartLegend(chartData, summary.expenses || 0);
  renderCategoryBars(summary.categoryTotals || [], summary.expenses || 0);
  renderRecentTransactions();
}

async function calculateSummary() {
  if (state.pythonReady && state.python) {
    try {
      state.python.globals.set("month_json", JSON.stringify(state.monthRecord));
      state.python.globals.set("transactions_json", JSON.stringify(state.transactions));
      const result = state.python.runPython(
        "calculate_monthly_summary(month_json, transactions_json)"
      );
      return JSON.parse(result);
    } catch (error) {
      console.error("Python calculation error:", error);
    }
  }

  return calculateSummaryFallback(state.monthRecord, state.transactions);
}

function calculateSummaryFallback(monthRecord, transactions) {
  const salary = numberValue(monthRecord.salary);
  const savingsTarget = numberValue(monthRecord.savingsTarget);
  let extraIncome = 0;
  let expenses = 0;
  let savings = 0;
  const categories = {};

  transactions.forEach((record) => {
    const amount = numberValue(record.amount);
    if (record.type === "income") extraIncome += amount;
    if (record.type === "saving") savings += amount;
    if (record.type === "expense") {
      expenses += amount;
      categories[record.category || "Uncategorised"] =
        (categories[record.category || "Uncategorised"] || 0) + amount;
    }
  });

  const categoryTotals = Object.entries(categories)
    .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const totalIncome = roundMoney(salary + extraIncome);
  const currentDate = new Date();
  const selectedIsCurrent = state.currentMonth === getLocalMonth(currentDate);
  const elapsedDays = selectedIsCurrent ? currentDate.getDate() : daysInMonth(state.currentMonth);

  return {
    salary,
    extraIncome: roundMoney(extraIncome),
    totalIncome,
    expenses: roundMoney(expenses),
    savings: roundMoney(savings),
    savingsTarget,
    available: roundMoney(totalIncome - expenses - savings),
    savingsRate: totalIncome ? roundMoney((savings / totalIncome) * 100) : 0,
    savingsProgress: savingsTarget ? roundMoney((savings / savingsTarget) * 100) : 0,
    topCategory: categoryTotals[0]?.category || "-",
    averageDaily: roundMoney(expenses / Math.max(elapsedDays, 1)),
    categoryTotals,
    transactionCount: transactions.length
  };
}

function renderRecentTransactions() {
  const container = document.getElementById("recentTransactions");
  const records = state.transactions.slice(0, 5);
  container.innerHTML = records.length
    ? records.map((record) => transactionRow(record, false)).join("")
    : emptyState("No transactions yet. Tap Add to create your first record.");
}

function transactionRow(record, includeActions) {
  const initial = escapeHtml(String(record.category || "?").charAt(0).toUpperCase());
  const note = record.note ? ` - ${escapeHtml(record.note)}` : "";
  const sign = record.type === "income" ? "+" : record.type === "expense" ? "-" : "";

  return `
    <article class="transaction-item">
      <div class="transaction-icon ${escapeHtml(record.type)}">${initial}</div>
      <div class="transaction-main">
        <strong>${escapeHtml(record.category)}</strong>
        <span>${formatDate(record.date)}${note}</span>
      </div>
      <div class="transaction-side">
        <strong class="${escapeHtml(record.type)}">${sign}${formatMoney(record.amount)}</strong>
        <small>${escapeHtml(capitalize(record.type))}</small>
      </div>
      ${includeActions ? `
        <div class="row-actions">
          <button class="row-action" type="button" data-edit-transaction="${record.id}">Edit</button>
          <button class="row-action" type="button" data-delete-transaction="${record.id}">Delete</button>
        </div>
      ` : ""}
    </article>
  `;
}

function groupChartData(categoryTotals) {
  if (categoryTotals.length <= 6) return categoryTotals;

  const topFive = categoryTotals.slice(0, 5);
  const otherAmount = categoryTotals.slice(5).reduce((total, item) => total + numberValue(item.amount), 0);
  return [...topFive, { category: "Others", amount: roundMoney(otherAmount) }];
}

function drawDoughnut(canvas, data) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const size = Math.max(Math.min(rect.width || 250, 300), 180);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * ratio);
  canvas.height = Math.round(size * ratio);

  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, size, size);

  const center = size / 2;
  const radius = size * 0.39;
  const lineWidth = size * 0.16;
  const total = data.reduce((sum, item) => sum + numberValue(item.amount), 0);

  context.lineWidth = lineWidth;
  context.lineCap = "butt";

  if (total <= 0) {
    context.beginPath();
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--canvas-empty").trim() || "#e2ebe8";
    context.arc(center, center, radius, 0, Math.PI * 2);
    context.stroke();
    return;
  }

  let startAngle = -Math.PI / 2;
  data.forEach((item, index) => {
    const slice = (numberValue(item.amount) / total) * Math.PI * 2;
    context.beginPath();
    context.strokeStyle = CHART_COLORS[index % CHART_COLORS.length];
    context.arc(center, center, radius, startAngle, startAngle + slice);
    context.stroke();
    startAngle += slice;
  });
}

function renderChartLegend(data, total) {
  const container = document.getElementById("chartLegend");
  if (!data.length) {
    container.innerHTML = emptyState("Expense categories will appear here.");
    return;
  }

  container.innerHTML = data.map((item, index) => {
    const percentage = total ? (numberValue(item.amount) / total) * 100 : 0;
    return `
      <div class="legend-row">
        <span class="legend-dot" style="background:${CHART_COLORS[index % CHART_COLORS.length]}"></span>
        <span>${escapeHtml(item.category)} (${percentage.toFixed(0)}%)</span>
        <strong>${formatMoney(item.amount)}</strong>
      </div>
    `;
  }).join("");
}

function renderCategoryBars(categoryTotals, total) {
  const container = document.getElementById("categoryBars");
  const items = categoryTotals.slice(0, 6);

  if (!items.length) {
    container.innerHTML = emptyState("No expense data for this month.");
    return;
  }

  container.innerHTML = items.map((item) => {
    const percentage = total ? (numberValue(item.amount) / total) * 100 : 0;
    return `
      <div class="category-bar-row">
        <div class="category-bar-label">
          <span>${escapeHtml(item.category)}</span>
          <strong>${formatMoney(item.amount)}</strong>
        </div>
        <div class="category-bar-track">
          <div class="category-bar-fill" style="width:${Math.min(percentage, 100)}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

async function createSampleData() {
  if (state.transactions.length) {
    const confirmed = window.confirm("This month already has records. Add sample data anyway?");
    if (!confirmed) return;
  }

  await BudgetDB.saveMonth({
    ...state.monthRecord,
    month: state.currentMonth,
    salary: 5000,
    savingsTarget: 800,
    createdAt: state.monthRecord?.createdAt || new Date().toISOString()
  });

  const samples = [
    ["expense", 245.30, "Groceries", 2, "Weekly groceries"],
    ["expense", 120.00, "Transport", 4, "Fuel and toll"],
    ["expense", 180.00, "Utilities", 6, "Internet and mobile"],
    ["expense", 65.50, "Eating Out", 8, "Family dinner"],
    ["expense", 90.00, "Shopping", 10, "Household item"],
    ["income", 250.00, "Overtime / Allowance", 5, "Overtime claim"],
    ["saving", 500.00, "Emergency Fund", 3, "Monthly contribution"]
  ];

  for (const [type, amount, category, day, note] of samples) {
    const date = dateWithinMonth(state.currentMonth, day);
    await BudgetDB.addTransaction({
      type,
      amount,
      category,
      date,
      month: state.currentMonth,
      note
    });
  }

  await refreshAll();
  showToast("Sample data created.");
  showView("home");
}

async function exportBackup() {
  const data = await BudgetDB.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `pocket-budget-backup-${getLocalDate(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Backup file created.");
}

async function importBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  const confirmed = window.confirm("Importing will replace all current local data. Continue?");
  if (!confirmed) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    await BudgetDB.importData(data);
    await refreshAll();
    showToast("Backup imported successfully.");
    showView("home");
  } catch (error) {
    console.error(error);
    showToast("Import failed: " + error.message);
  }
}

async function resetAllData() {
  const confirmed = window.confirm("Delete every month, transaction, and custom category from this browser?");
  if (!confirmed) return;

  await BudgetDB.clearAll();
  resetTransactionForm();
  await refreshAll();
  showToast("All test data deleted.");
  showView("home");
}

function loadExternalScript(url) {
  if (typeof globalThis.loadPyodide === "function") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Python engine download failed.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Python engine download failed."));
    document.head.appendChild(script);
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("service-worker.js", {
        updateViaCache: "none"
      });
      await registration.update();
    } catch (error) {
      console.warn("Service worker registration failed:", error);
    }
  });
}

function setDefaultTransactionDate() {
  const input = document.getElementById("transactionDate");
  const today = getLocalDate(new Date());
  input.value = today.startsWith(state.currentMonth) ? today : `${state.currentMonth}-01`;
}

function setEngineStatus(message, className) {
  const element = document.getElementById("engineStatus");
  element.textContent = message;
  element.className = "engine-status" + (className ? ` ${className}` : "");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue(value));
}

function compactMoney(value) {
  const amount = numberValue(value);
  if (Math.abs(amount) >= 1000) return `RM ${(amount / 1000).toFixed(1)}k`;
  return `RM ${amount.toFixed(0)}`;
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(year, month - 1, day));
}

function formatMonthName(value) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function getLocalMonth(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getLocalDate(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateWithinMonth(monthValue, requestedDay) {
  const maxDay = daysInMonth(monthValue);
  const day = String(Math.min(requestedDay, maxDay)).padStart(2, "0");
  return `${monthValue}-${day}`;
}

function daysInMonth(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value) {
  return Math.round((numberValue(value) + Number.EPSILON) * 100) / 100;
}

function capitalize(value) {
  const text = String(value || "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function debounce(callback, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}
