"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createId,
  getHistorySnapshot,
  subscribeHistory,
  updateHistory,
} from "./appHistory";

export const accountTypes = [
  "Cash",
  "Bank account",
  "Wallet",
  "Savings",
  "Emergency fund",
  "Other",
] as const;

export const expenseCategories = [
  "Food",
  "Transport",
  "Clothes",
  "Medical",
  "Gym/Fitness",
  "Subscriptions",
  "Family",
  "Entertainment",
  "Car",
  "Education",
  "Business/Work",
  "Other",
] as const;

export const expenseStatuses = ["Paid", "Planned", "Recurring"] as const;
export const plannedPaymentStatuses = ["Upcoming", "Paid", "Missed"] as const;

export type AccountType = (typeof accountTypes)[number];
export type ExpenseCategory = (typeof expenseCategories)[number];
export type ExpenseStatus = (typeof expenseStatuses)[number];
export type PlannedPaymentStatus = (typeof plannedPaymentStatuses)[number];

export interface FinanceAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  notes: string;
}

export interface FinanceExpense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  accountId: string;
  status: ExpenseStatus;
  notes: string;
}

export interface FinanceBudget {
  id: string;
  category: ExpenseCategory;
  amount: number;
}

export interface PlannedPayment {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: ExpenseCategory;
  accountId: string;
  status: PlannedPaymentStatus;
  notes: string;
}

export interface FinanceData {
  accounts: FinanceAccount[];
  expenses: FinanceExpense[];
  budgets: FinanceBudget[];
  plannedPayments: PlannedPayment[];
}

export function useFinanceData() {
  const [data, setData] = useState(() => getHistorySnapshot().finance);

  useEffect(() => {
    return subscribeHistory(() => setData(getHistorySnapshot().finance));
  }, []);

  return useMemo(
    () => ({
      accounts: data.accounts,
      expenses: data.expenses,
      budgets: data.budgets,
      plannedPayments: data.plannedPayments,
      addAccount: (account: Omit<FinanceAccount, "id">) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            accounts: [{ ...account, id: createId("account") }, ...snapshot.finance.accounts],
          },
        }));
      },
      updateAccount: (account: FinanceAccount) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            accounts: snapshot.finance.accounts.map((item) =>
              item.id === account.id ? account : item
            ),
          },
        }));
      },
      deleteAccount: (accountId: string) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            accounts: snapshot.finance.accounts.filter((account) => account.id !== accountId),
            expenses: snapshot.finance.expenses.map((expense) =>
              expense.accountId === accountId ? { ...expense, accountId: "" } : expense
            ),
            plannedPayments: snapshot.finance.plannedPayments.map((payment) =>
              payment.accountId === accountId ? { ...payment, accountId: "" } : payment
            ),
          },
        }));
      },
      addExpense: (expense: Omit<FinanceExpense, "id">) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            expenses: [{ ...expense, id: createId("expense") }, ...snapshot.finance.expenses],
          },
        }));
      },
      updateExpense: (expense: FinanceExpense) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            expenses: snapshot.finance.expenses.map((item) =>
              item.id === expense.id ? expense : item
            ),
          },
        }));
      },
      deleteExpense: (expenseId: string) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            expenses: snapshot.finance.expenses.filter((expense) => expense.id !== expenseId),
          },
        }));
      },
      addBudget: (budget: Omit<FinanceBudget, "id">) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            budgets: [{ ...budget, id: createId("budget") }, ...snapshot.finance.budgets],
          },
        }));
      },
      updateBudget: (budget: FinanceBudget) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            budgets: snapshot.finance.budgets.map((item) =>
              item.id === budget.id ? budget : item
            ),
          },
        }));
      },
      deleteBudget: (budgetId: string) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            budgets: snapshot.finance.budgets.filter((budget) => budget.id !== budgetId),
          },
        }));
      },
      addPlannedPayment: (payment: Omit<PlannedPayment, "id">) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            plannedPayments: [
              { ...payment, id: createId("payment") },
              ...snapshot.finance.plannedPayments,
            ],
          },
        }));
      },
      updatePlannedPayment: (payment: PlannedPayment) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            plannedPayments: snapshot.finance.plannedPayments.map((item) =>
              item.id === payment.id ? payment : item
            ),
          },
        }));
      },
      deletePlannedPayment: (paymentId: string) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          finance: {
            ...snapshot.finance,
            plannedPayments: snapshot.finance.plannedPayments.filter(
              (payment) => payment.id !== paymentId
            ),
          },
        }));
      },
    }),
    [data]
  );
}
