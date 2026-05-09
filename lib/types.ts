export type Agency = "Domya" | "Krijo" | "Freelance" | "Personal";

export type LeadStatus =
  | "New Lead"
  | "Contacted"
  | "Meeting"
  | "Proposal Sent"
  | "Follow-up"
  | "Closed"
  | "Lost";

export interface Lead {
  id: string;
  clientName: string;
  niche: string;
  sourceAgency: Agency;
  status: LeadStatus;
  dealValue: number;
  expectedCommission: number;
  nextFollowUpDate: string; // ISO date string
  notes: string;
  createdAt: string; // ISO date string
}

export interface IncomeEntry {
  id: string;
  source: string;
  amount: number;
  date: string; // ISO date string
  leadId?: string; // Link to lead if commission-based
  notes?: string;
}

export interface DashboardStats {
  totalMonthlyIncome: number;
  totalClosedDeals: number;
  totalActiveLeads: number;
  totalPendingFollowUps: number;
  estimatedCommissions: number;
}
