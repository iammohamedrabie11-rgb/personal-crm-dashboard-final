"use client";

import { FormEvent, ReactNode, useState } from "react";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { incomeSources, useCrmData } from "@/lib/crmStorage";
import {
  accountTypes,
  expenseCategories,
  expenseStatuses,
  FinanceAccount,
  FinanceBudget,
  FinanceExpense,
  PlannedPayment,
  plannedPaymentStatuses,
  useFinanceData,
} from "@/lib/financeStorage";
import { IncomeEntry } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const today = new Date().toISOString().split("T")[0];

type ModalType = "account" | "expense" | "budget" | "payment" | "income" | null;
type DeleteTarget =
  | { type: "account"; id: string; label: string }
  | { type: "expense"; id: string; label: string }
  | { type: "budget"; id: string; label: string }
  | { type: "payment"; id: string; label: string }
  | { type: "income"; id: string; label: string };

type AccountForm = Omit<FinanceAccount, "id" | "balance"> & { balance: string };
type ExpenseForm = Omit<FinanceExpense, "id" | "amount"> & { amount: string };
type BudgetForm = Omit<FinanceBudget, "id" | "amount"> & { amount: string };
type PaymentForm = Omit<PlannedPayment, "id" | "amount"> & { amount: string };
type IncomeForm = Omit<IncomeEntry, "id" | "amount"> & { amount: string };

const emptyAccountForm: AccountForm = {
  name: "",
  type: "Cash",
  balance: "",
  notes: "",
};

const emptyExpenseForm: ExpenseForm = {
  date: today,
  category: "Food",
  description: "",
  amount: "",
  accountId: "",
  status: "Paid",
  notes: "",
};

const emptyBudgetForm: BudgetForm = {
  category: "Food",
  amount: "",
};

const emptyPaymentForm: PaymentForm = {
  name: "",
  amount: "",
  dueDate: today,
  category: "Food",
  accountId: "",
  status: "Upcoming",
  notes: "",
};

const emptyIncomeForm: IncomeForm = {
  source: "Freelance",
  amount: "",
  date: today,
  leadId: "",
  notes: "",
};

export default function FinancePage() {
  const { incomeEntries, updateIncomeEntry, deleteIncomeEntry } = useCrmData();
  const {
    accounts,
    expenses,
    budgets,
    plannedPayments,
    addAccount,
    updateAccount,
    deleteAccount,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    deleteBudget,
    addPlannedPayment,
    updatePlannedPayment,
    deletePlannedPayment,
  } = useFinanceData();

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
  const [editingExpense, setEditingExpense] = useState<FinanceExpense | null>(null);
  const [editingBudget, setEditingBudget] = useState<FinanceBudget | null>(null);
  const [editingPayment, setEditingPayment] = useState<PlannedPayment | null>(null);
  const [editingIncome, setEditingIncome] = useState<IncomeEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccountForm);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm);
  const [budgetForm, setBudgetForm] = useState<BudgetForm>(emptyBudgetForm);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPaymentForm);
  const [incomeForm, setIncomeForm] = useState<IncomeForm>(emptyIncomeForm);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthIncome = incomeEntries
    .filter((entry) => isCurrentMonth(entry.date, currentMonth, currentYear))
    .reduce((sum, entry) => sum + entry.amount, 0);

  const currentMonthPaidExpenses = expenses.filter(
    (expense) =>
      expense.status === "Paid" && isCurrentMonth(expense.date, currentMonth, currentYear)
  );

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalMonthlyExpenses = currentMonthPaidExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const upcomingPlannedPayments = plannedPayments
    .filter((payment) => payment.status === "Upcoming")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const upcomingPlannedTotal = upcomingPlannedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const remainingMonthlyBudget = totalBudget - totalMonthlyExpenses;
  const netSavings = currentMonthIncome - totalMonthlyExpenses;

  const spentByCategory = expenseCategories.map((category) => ({
    category,
    amount: currentMonthPaidExpenses
      .filter((expense) => expense.category === category)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));

  const accountDistribution = accounts.map((account) => ({
    label: account.name,
    amount: Math.max(account.balance, 0),
  }));

  const budgetUsage = budgets.map((budget) => {
    const spent = spentByCategory.find((item) => item.category === budget.category)?.amount ?? 0;
    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percent: budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0,
    };
  });

  const records = [
    ...incomeEntries.map((entry) => ({
      id: entry.id,
      date: entry.date,
      type: "Income" as const,
      category: entry.source,
      description: entry.notes || entry.source,
      account: "-",
      amount: entry.amount,
      status: "Received",
      source: entry,
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      date: expense.date,
      type: "Expense" as const,
      category: expense.category,
      description: expense.description,
      account: getAccountName(accounts, expense.accountId),
      amount: expense.amount,
      status: expense.status,
      source: expense,
    })),
    ...plannedPayments.map((payment) => ({
      id: payment.id,
      date: payment.dueDate,
      type: "Planned Payment" as const,
      category: payment.category,
      description: payment.name,
      account: getAccountName(accounts, payment.accountId),
      amount: payment.amount,
      status: payment.status,
      source: payment,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function openAccountModal(account?: FinanceAccount) {
    setEditingAccount(account ?? null);
    setAccountForm(
      account
        ? { name: account.name, type: account.type, balance: String(account.balance), notes: account.notes }
        : emptyAccountForm
    );
    setModalType("account");
  }

  function openExpenseModal(expense?: FinanceExpense) {
    setEditingExpense(expense ?? null);
    setExpenseForm(
      expense
        ? { ...expense, amount: String(expense.amount) }
        : { ...emptyExpenseForm, accountId: accounts[0]?.id ?? "" }
    );
    setModalType("expense");
  }

  function openBudgetModal(budget?: FinanceBudget) {
    setEditingBudget(budget ?? null);
    setBudgetForm(
      budget ? { category: budget.category, amount: String(budget.amount) } : emptyBudgetForm
    );
    setModalType("budget");
  }

  function openPaymentModal(payment?: PlannedPayment) {
    setEditingPayment(payment ?? null);
    setPaymentForm(
      payment
        ? { ...payment, amount: String(payment.amount) }
        : { ...emptyPaymentForm, accountId: accounts[0]?.id ?? "" }
    );
    setModalType("payment");
  }

  function openIncomeModal(entry: IncomeEntry) {
    setEditingIncome(entry);
    setIncomeForm({
      source: incomeSources.includes(entry.source as (typeof incomeSources)[number])
        ? entry.source
        : "Other",
      amount: String(entry.amount),
      date: entry.date,
      leadId: entry.leadId ?? "",
      notes: entry.notes ?? "",
    });
    setModalType("income");
  }

  function closeModal() {
    setModalType(null);
    setEditingAccount(null);
    setEditingExpense(null);
    setEditingBudget(null);
    setEditingPayment(null);
    setEditingIncome(null);
  }

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = {
      name: accountForm.name.trim(),
      type: accountForm.type,
      balance: Number(accountForm.balance) || 0,
      notes: accountForm.notes.trim(),
    };
    if (editingAccount) updateAccount({ ...editingAccount, ...account });
    else addAccount(account);
    closeModal();
  }

  function saveExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const expense = {
      date: expenseForm.date,
      category: expenseForm.category,
      description: expenseForm.description.trim(),
      amount: Number(expenseForm.amount) || 0,
      accountId: expenseForm.accountId,
      status: expenseForm.status,
      notes: expenseForm.notes.trim(),
    };
    if (editingExpense) updateExpense({ ...editingExpense, ...expense });
    else addExpense(expense);
    closeModal();
  }

  function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const budget = {
      category: budgetForm.category,
      amount: Number(budgetForm.amount) || 0,
    };
    if (editingBudget) updateBudget({ ...editingBudget, ...budget });
    else addBudget(budget);
    closeModal();
  }

  function savePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payment = {
      name: paymentForm.name.trim(),
      amount: Number(paymentForm.amount) || 0,
      dueDate: paymentForm.dueDate,
      category: paymentForm.category,
      accountId: paymentForm.accountId,
      status: paymentForm.status,
      notes: paymentForm.notes.trim(),
    };
    if (editingPayment) updatePlannedPayment({ ...editingPayment, ...payment });
    else addPlannedPayment(payment);
    closeModal();
  }

  function saveIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingIncome) return;
    updateIncomeEntry({
      ...editingIncome,
      source: incomeForm.source,
      amount: Number(incomeForm.amount) || 0,
      date: incomeForm.date,
      leadId: incomeForm.leadId || undefined,
      notes: incomeForm.notes?.trim(),
    });
    closeModal();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "account") deleteAccount(deleteTarget.id);
    if (deleteTarget.type === "expense") deleteExpense(deleteTarget.id);
    if (deleteTarget.type === "budget") deleteBudget(deleteTarget.id);
    if (deleteTarget.type === "payment") deletePlannedPayment(deleteTarget.id);
    if (deleteTarget.type === "income") deleteIncomeEntry(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-semibold text-white">Finance</h1>
            <p className="text-sm text-slate-400">
              Track accounts, expenses, budgets, planned payments, and cash flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => openAccountModal()}>Add account</ActionButton>
            <ActionButton onClick={() => openExpenseModal()}>Add expense</ActionButton>
            <ActionButton onClick={() => openBudgetModal()}>Add budget</ActionButton>
            <ActionButton onClick={() => openPaymentModal()}>Add planned payment</ActionButton>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          <OverviewCard label="Total Balance" value={formatCurrency(totalBalance)} tone="blue" />
          <OverviewCard
            label="Monthly Income"
            value={formatCurrency(currentMonthIncome)}
            tone="emerald"
          />
          <OverviewCard
            label="Monthly Expenses"
            value={formatCurrency(totalMonthlyExpenses)}
            tone="rose"
          />
          <OverviewCard label="Net Savings" value={formatCurrency(netSavings)} tone="amber" />
          <OverviewCard
            label="Planned Payments"
            value={formatCurrency(upcomingPlannedTotal)}
            tone="purple"
          />
          <OverviewCard
            label="Remaining Budget"
            value={formatCurrency(remainingMonthlyBudget)}
            tone="white"
          />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Panel title="Accounts">
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-xl border border-slate-700/50 bg-slate-700/20 p-4 shadow-sm shadow-black/5 sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 pr-1">
                      <p className="break-words text-sm font-semibold leading-5 text-white">
                        {account.name}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{account.type}</p>
                    </div>
                    <p className="break-words text-left text-base font-bold leading-5 text-blue-300 sm:max-w-[45%] sm:text-right">
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  {account.notes && (
                    <p className="mt-3 break-words rounded-lg bg-slate-700/20 px-3 py-2 text-xs leading-5 text-slate-500">
                      {account.notes}
                    </p>
                  )}
                  <RowActions
                    onEdit={() => openAccountModal(account)}
                    onDelete={() =>
                      setDeleteTarget({
                        type: "account",
                        id: account.id,
                        label: `the ${account.name} account`,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Upcoming Planned Payments">
            <div className="space-y-3">
              {upcomingPlannedPayments.length > 0 ? (
                upcomingPlannedPayments.slice(0, 6).map((payment) => (
                  <div key={payment.id} className="rounded-lg bg-slate-700/20 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-white">{payment.name}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(payment.dueDate)} · {payment.category}
                        </p>
                      </div>
                      <p className="break-words text-right text-sm font-bold text-amber-300">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <RowActions
                      onEdit={() => openPaymentModal(payment)}
                      onDelete={() =>
                        setDeleteTarget({
                          type: "payment",
                          id: payment.id,
                          label: payment.name,
                        })
                      }
                    />
                  </div>
                ))
              ) : (
                <EmptyText>No upcoming payments.</EmptyText>
              )}
            </div>
          </Panel>

          <Panel title="Budget Planning">
            <div className="space-y-4">
              {budgetUsage.map((budget) => (
                <div key={budget.id} className="rounded-lg bg-slate-700/20 p-3">
                  <div className="mb-2 flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{budget.category}</p>
                      <p className="text-xs text-slate-400">
                        Spent {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                      </p>
                    </div>
                    <p className="break-words text-right text-xs font-bold text-slate-200">
                      {formatCurrency(budget.remaining)} left
                    </p>
                  </div>
                  <ProgressBar value={budget.percent} />
                  <RowActions
                    onEdit={() => openBudgetModal(budget)}
                    onDelete={() =>
                      setDeleteTarget({
                        type: "budget",
                        id: budget.id,
                        label: `${budget.category} budget`,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Panel title="Recent Expenses">
            <div className="overflow-x-auto">
              <CompactTable
                headers={["Date", "Category", "Description", "Account", "Amount", "Status", "Actions"]}
              >
                {[...expenses]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 8)
                  .map((expense) => (
                    <tr key={expense.id} className="border-b border-slate-700/30">
                      <Cell>{formatDate(expense.date)}</Cell>
                      <Cell>{expense.category}</Cell>
                      <Cell>{expense.description}</Cell>
                      <Cell>{getAccountName(accounts, expense.accountId)}</Cell>
                      <Cell align="right">{formatCurrency(expense.amount)}</Cell>
                      <Cell>
                        <FinanceStatusBadge status={expense.status} />
                      </Cell>
                      <Cell align="right">
                        <InlineActions
                          onEdit={() => openExpenseModal(expense)}
                          onDelete={() =>
                            setDeleteTarget({
                              type: "expense",
                              id: expense.id,
                              label: expense.description || "this expense",
                            })
                          }
                        />
                      </Cell>
                    </tr>
                  ))}
              </CompactTable>
            </div>
          </Panel>

          <Panel title="Graphs and Charts">
            <div className="space-y-5">
              <MiniBarPair
                title="Monthly Income vs Expenses"
                firstLabel="Income"
                firstValue={currentMonthIncome}
                secondLabel="Expenses"
                secondValue={totalMonthlyExpenses}
              />
              <HorizontalBars
                title="Expenses by Category"
                data={spentByCategory.filter((item) => item.amount > 0)}
                color="theme-chart-2"
              />
              <HorizontalBars
                title="Account Balance Distribution"
                data={accountDistribution.filter((item) => item.amount > 0)}
                color="theme-chart-1"
              />
              <HorizontalBars
                title="Budget Usage"
                data={budgetUsage.map((item) => ({ label: item.category, amount: item.spent }))}
                color="theme-chart-3"
              />
            </div>
          </Panel>
        </section>

        <Panel title="Finance Records">
          <div className="overflow-x-auto">
            <CompactTable
              headers={["Date", "Type", "Category", "Description", "Account", "Amount", "Status", "Actions"]}
            >
              {records.map((record) => (
                <tr key={`${record.type}-${record.id}`} className="border-b border-slate-700/30">
                  <Cell>{formatDate(record.date)}</Cell>
                  <Cell>{record.type}</Cell>
                  <Cell>{record.category}</Cell>
                  <Cell>{record.description}</Cell>
                  <Cell>{record.account}</Cell>
                  <Cell align="right">
                    <span
                      className={
                        record.type === "Income" ? "text-emerald-400" : "text-slate-100"
                      }
                    >
                      {record.type === "Income" ? "+" : "-"}
                      {formatCurrency(record.amount)}
                    </span>
                  </Cell>
                  <Cell>
                    <FinanceStatusBadge status={record.status} />
                  </Cell>
                  <Cell align="right">
                    <InlineActions
                      onEdit={() => {
                        if (record.type === "Income") openIncomeModal(record.source as IncomeEntry);
                        if (record.type === "Expense") openExpenseModal(record.source as FinanceExpense);
                        if (record.type === "Planned Payment") {
                          openPaymentModal(record.source as PlannedPayment);
                        }
                      }}
                      onDelete={() =>
                        setDeleteTarget({
                          type:
                            record.type === "Income"
                              ? "income"
                              : record.type === "Expense"
                                ? "expense"
                                : "payment",
                          id: record.id,
                          label: record.description,
                        })
                      }
                    />
                  </Cell>
                </tr>
              ))}
            </CompactTable>
          </div>
        </Panel>
      </div>

      <FormModal
        isOpen={modalType === "account"}
        title={editingAccount ? "Edit account" : "Add account"}
        onClose={closeModal}
      >
        <form onSubmit={saveAccount} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Account name" value={accountForm.name} onChange={(name) => setAccountForm({ ...accountForm, name })} required />
          <SelectInput label="Account type" value={accountForm.type} options={accountTypes} onChange={(type) => setAccountForm({ ...accountForm, type })} />
          <TextInput label="Current balance" type="number" value={accountForm.balance} onChange={(balance) => setAccountForm({ ...accountForm, balance })} required />
          <TextInput label="Notes" value={accountForm.notes} onChange={(notes) => setAccountForm({ ...accountForm, notes })} />
          <ModalActions submitLabel="Save account" />
        </form>
      </FormModal>

      <FormModal
        isOpen={modalType === "expense"}
        title={editingExpense ? "Edit expense" : "Add expense"}
        onClose={closeModal}
      >
        <form onSubmit={saveExpense} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Date" type="date" value={expenseForm.date} onChange={(date) => setExpenseForm({ ...expenseForm, date })} required />
          <SelectInput label="Category" value={expenseForm.category} options={expenseCategories} onChange={(category) => setExpenseForm({ ...expenseForm, category })} />
          <TextInput label="Description" value={expenseForm.description} onChange={(description) => setExpenseForm({ ...expenseForm, description })} required />
          <TextInput label="Amount" type="number" value={expenseForm.amount} onChange={(amount) => setExpenseForm({ ...expenseForm, amount })} required />
          <AccountSelect label="Paid from account" value={expenseForm.accountId} accounts={accounts} onChange={(accountId) => setExpenseForm({ ...expenseForm, accountId })} />
          <SelectInput label="Payment status" value={expenseForm.status} options={expenseStatuses} onChange={(status) => setExpenseForm({ ...expenseForm, status })} />
          <TextInput label="Notes" value={expenseForm.notes} onChange={(notes) => setExpenseForm({ ...expenseForm, notes })} />
          <ModalActions submitLabel="Save expense" />
        </form>
      </FormModal>

      <FormModal
        isOpen={modalType === "budget"}
        title={editingBudget ? "Edit budget" : "Add budget"}
        onClose={closeModal}
      >
        <form onSubmit={saveBudget} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Category" value={budgetForm.category} options={expenseCategories} onChange={(category) => setBudgetForm({ ...budgetForm, category })} />
          <TextInput label="Monthly budget amount" type="number" value={budgetForm.amount} onChange={(amount) => setBudgetForm({ ...budgetForm, amount })} required />
          <ModalActions submitLabel="Save budget" />
        </form>
      </FormModal>

      <FormModal
        isOpen={modalType === "payment"}
        title={editingPayment ? "Edit planned payment" : "Add planned payment"}
        onClose={closeModal}
      >
        <form onSubmit={savePayment} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput label="Payment name" value={paymentForm.name} onChange={(name) => setPaymentForm({ ...paymentForm, name })} required />
          <TextInput label="Amount" type="number" value={paymentForm.amount} onChange={(amount) => setPaymentForm({ ...paymentForm, amount })} required />
          <TextInput label="Due date" type="date" value={paymentForm.dueDate} onChange={(dueDate) => setPaymentForm({ ...paymentForm, dueDate })} required />
          <SelectInput label="Category" value={paymentForm.category} options={expenseCategories} onChange={(category) => setPaymentForm({ ...paymentForm, category })} />
          <AccountSelect label="Account to be paid from" value={paymentForm.accountId} accounts={accounts} onChange={(accountId) => setPaymentForm({ ...paymentForm, accountId })} />
          <SelectInput label="Status" value={paymentForm.status} options={plannedPaymentStatuses} onChange={(status) => setPaymentForm({ ...paymentForm, status })} />
          <TextInput label="Notes" value={paymentForm.notes} onChange={(notes) => setPaymentForm({ ...paymentForm, notes })} />
          <ModalActions submitLabel="Save payment" />
        </form>
      </FormModal>

      <FormModal isOpen={modalType === "income"} title="Edit income record" onClose={closeModal}>
        <form onSubmit={saveIncome} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectInput label="Source" value={incomeForm.source} options={incomeSources} onChange={(source) => setIncomeForm({ ...incomeForm, source })} />
          <TextInput label="Amount" type="number" value={incomeForm.amount} onChange={(amount) => setIncomeForm({ ...incomeForm, amount })} required />
          <TextInput label="Date" type="date" value={incomeForm.date} onChange={(date) => setIncomeForm({ ...incomeForm, date })} required />
          <TextInput label="Description" value={incomeForm.notes ?? ""} onChange={(notes) => setIncomeForm({ ...incomeForm, notes })} />
          <ModalActions submitLabel="Save income" />
        </form>
      </FormModal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        message={
          deleteTarget ? `Are you sure you want to delete ${deleteTarget.label}?` : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}

function isCurrentMonth(dateString: string, month: number, year: number) {
  const date = new Date(dateString);
  return date.getMonth() === month && date.getFullYear() === year;
}

function getAccountName(accounts: FinanceAccount[], accountId: string) {
  return accounts.find((account) => account.id === accountId)?.name ?? "-";
}

function ActionButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 sm:text-sm"
    >
      {children}
    </button>
  );
}

function OverviewCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "emerald" | "rose" | "amber" | "purple" | "white";
}) {
  const toneClass = {
    blue: "text-blue-300",
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    amber: "text-amber-300",
    purple: "text-fuchsia-300",
    white: "text-white",
  }[tone];

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 break-words text-xl font-bold leading-tight ${toneClass}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
      <h2 className="mb-5 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-700/40 pt-3">
      <button type="button" onClick={onEdit} className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-600">
        Edit
      </button>
      <button type="button" onClick={onDelete} className="rounded-md bg-rose-950 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-900">
        Delete
      </button>
    </div>
  );
}

function InlineActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onEdit} className="rounded-md bg-slate-700 px-2 py-1 font-medium text-slate-100 hover:bg-slate-600">
        Edit
      </button>
      <button type="button" onClick={onDelete} className="rounded-md bg-rose-950 px-2 py-1 font-medium text-rose-200 hover:bg-rose-900">
        Delete
      </button>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-900">
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
    </div>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-slate-700/20 p-3 text-sm text-slate-400">{children}</p>;
}

function CompactTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <table className="w-full min-w-[760px] text-xs">
      <thead>
        <tr className="border-b border-slate-700/50">
          {headers.map((header) => (
            <th key={header} className="px-3 py-2 text-left font-semibold text-slate-300">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Cell({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) {
  return (
    <td
      className={`px-3 py-2.5 text-slate-300 ${align === "right" ? "text-right" : "text-left"}`}
    >
      <div className="max-w-[220px] break-words">{children}</div>
    </td>
  );
}

function FinanceStatusBadge({ status }: { status: string }) {
  return <span className={`crm-badge ${getFinanceStatusClass(status)}`}>{status}</span>;
}

function getFinanceStatusClass(status: string) {
  switch (status) {
    case "Paid":
      return "crm-finance-status-paid";
    case "Planned":
      return "crm-finance-status-planned";
    case "Recurring":
      return "crm-finance-status-recurring";
    case "Upcoming":
      return "crm-finance-status-upcoming";
    case "Missed":
      return "crm-finance-status-missed";
    case "Received":
      return "crm-finance-status-received";
    default:
      return "crm-finance-status-default";
  }
}

function MiniBarPair({
  title,
  firstLabel,
  firstValue,
  secondLabel,
  secondValue,
}: {
  title: string;
  firstLabel: string;
  firstValue: number;
  secondLabel: string;
  secondValue: number;
}) {
  const max = Math.max(firstValue, secondValue, 1);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      <ChartRow label={firstLabel} value={firstValue} max={max} color="theme-chart-4" />
      <ChartRow label={secondLabel} value={secondValue} max={max} color="theme-chart-2" />
    </div>
  );
}

function HorizontalBars({
  title,
  data,
  color,
}: {
  title: string;
  data: Array<{ label?: string; category?: string; amount: number }>;
  color: string;
}) {
  const max = Math.max(...data.map((item) => item.amount), 1);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      <div className="space-y-2">
        {data.length > 0 ? (
          data.slice(0, 6).map((item) => (
            <ChartRow
              key={item.label ?? item.category}
              label={item.label ?? item.category ?? "Other"}
              value={item.amount}
              max={max}
              color={color}
            />
          ))
        ) : (
          <p className="text-xs text-slate-500">No data yet.</p>
        )}
      </div>
    </div>
  );
}

function ChartRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 text-xs">
        <span className="break-words text-slate-300">{label}</span>
        <span className="break-words text-right font-semibold text-slate-200">
          {formatCurrency(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-900">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max((value / max) * 100, value > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function FormModal({
  isOpen,
  title,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 px-4 py-8 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-700/70 bg-slate-900 p-6 shadow-2xl shadow-black/40">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700">
            Cancel
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ submitLabel }: { submitLabel: string }) {
  return (
    <div className="sm:col-span-2">
      <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
        {submitLabel}
      </button>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
      {label}
      <input
        type={type}
        required={required}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? step ?? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      />
    </label>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function AccountSelect({
  label,
  value,
  accounts,
  onChange,
}: {
  label: string;
  value: string;
  accounts: FinanceAccount[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-slate-300">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">No account selected</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </label>
  );
}
