"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createId,
  getHistorySnapshot,
  subscribeHistory,
  updateHistory,
} from "./appHistory";
import { Agency, IncomeEntry, Lead, LeadStatus } from "./types";

export const agencies: Agency[] = ["Domya", "Krijo", "Freelance", "Personal"];

export const leadStatuses: LeadStatus[] = [
  "New Lead",
  "Contacted",
  "Meeting",
  "Proposal Sent",
  "Follow-up",
  "Closed",
  "Lost",
];

export const incomeSources = [
  "Freelance",
  "Pocket money",
  "Sales Agent - Domya (Basic)",
  "Sales Agent - Krijo (Basic)",
  "Commission - Domya",
  "Commission - Krijo",
  "Other",
] as const;

export function useCrmData() {
  const [data, setData] = useState(() => getHistorySnapshot().crm);

  useEffect(() => {
    return subscribeHistory(() => setData(getHistorySnapshot().crm));
  }, []);

  return useMemo(
    () => ({
      leads: data.leads,
      incomeEntries: data.incomeEntries,
      addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          crm: {
            ...snapshot.crm,
            leads: [
              {
                ...lead,
                id: createId(),
                createdAt: new Date().toISOString().split("T")[0],
              },
              ...snapshot.crm.leads,
            ],
          },
        }));
      },
      updateLead: (lead: Lead) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          crm: {
            ...snapshot.crm,
            leads: snapshot.crm.leads.map((item) =>
              item.id === lead.id ? lead : item
            ),
          },
        }));
      },
      deleteLead: (leadId: string) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          crm: {
            ...snapshot.crm,
            leads: snapshot.crm.leads.filter((lead) => lead.id !== leadId),
            incomeEntries: snapshot.crm.incomeEntries.map((entry) =>
              entry.leadId === leadId ? { ...entry, leadId: undefined } : entry
            ),
          },
        }));
      },
      addIncomeEntry: (entry: Omit<IncomeEntry, "id">) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          crm: {
            ...snapshot.crm,
            incomeEntries: [
              { ...entry, id: createId() },
              ...snapshot.crm.incomeEntries,
            ],
          },
        }));
      },
      updateIncomeEntry: (entry: IncomeEntry) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          crm: {
            ...snapshot.crm,
            incomeEntries: snapshot.crm.incomeEntries.map((item) =>
              item.id === entry.id ? entry : item
            ),
          },
        }));
      },
      deleteIncomeEntry: (entryId: string) => {
        updateHistory((snapshot) => ({
          ...snapshot,
          crm: {
            ...snapshot.crm,
            incomeEntries: snapshot.crm.incomeEntries.filter(
              (entry) => entry.id !== entryId
            ),
          },
        }));
      },
    }),
    [data]
  );
}
