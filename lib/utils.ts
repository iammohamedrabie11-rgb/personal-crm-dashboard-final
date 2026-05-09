import { Lead, IncomeEntry, DashboardStats } from "./types";

export function calculateDashboardStats(
  leads: Lead[],
  income: IncomeEntry[]
): DashboardStats {
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  // Total monthly income
  const totalMonthlyIncome = income
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear;
    })
    .reduce((sum, entry) => sum + entry.amount, 0);

  // Total closed deals
  const totalClosedDeals = leads.filter((lead) => lead.status === "Closed").length;

  // Total active leads (not Lost or Closed)
  const totalActiveLeads = leads.filter(
    (lead) => lead.status !== "Closed" && lead.status !== "Lost"
  ).length;

  // Total pending follow-ups
  const totalPendingFollowUps = leads.filter(
    (lead) => lead.status === "Follow-up" || lead.status === "Proposal Sent"
  ).length;

  // Estimated commissions (from closed deals and pending commission-based leads)
  const estimatedCommissions = leads
    .filter((lead) => lead.status === "Closed" || (lead.expectedCommission > 0 && lead.status !== "Lost"))
    .reduce((sum, lead) => sum + lead.expectedCommission, 0);

  return {
    totalMonthlyIncome,
    totalClosedDeals,
    totalActiveLeads,
    totalPendingFollowUps,
    estimatedCommissions,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function makeWhatsAppUrl(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  return digits ? `https://wa.me/${digits}` : null;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function getDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "Closed":
      return "crm-badge crm-status-closed";
    case "Lost":
      return "crm-badge crm-status-lost";
    case "Meeting":
      return "crm-badge crm-status-meeting";
    case "Proposal Sent":
      return "crm-badge crm-status-proposal";
    case "Follow-up":
      return "crm-badge crm-status-follow-up";
    case "Contacted":
      return "crm-badge crm-status-contacted";
    case "New Lead":
      return "crm-badge crm-status-new";
    default:
      return "crm-badge crm-status-new";
  }
}

export function getAgencyColor(agency: string): string {
  switch (agency) {
    case "Domya":
      return "crm-badge crm-agency-domya";
    case "Krijo":
      return "crm-badge crm-agency-krijo";
    case "Freelance":
      return "crm-badge crm-agency-freelance";
    case "Personal":
      return "crm-badge crm-agency-personal";
    default:
      return "crm-badge crm-agency-default";
  }
}
