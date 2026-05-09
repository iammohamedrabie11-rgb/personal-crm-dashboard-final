"use client";

import { DashboardCard } from "@/components/DashboardCard";
import { LeadsTable } from "@/components/LeadsTable";
import { useCrmData } from "@/lib/crmStorage";
import { useGoalSettings } from "@/lib/goalSettings";
import { calculateDashboardStats, formatCurrency, getDaysUntil } from "@/lib/utils";

function GoalProgressFooter({
  income,
  goal,
}: {
  income: number;
  goal: number;
}) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate();
  const percent = goal > 0 ? Math.min((income / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - income, 0);
  const reached = income >= goal;

  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-700">
        <div
          className={`h-full rounded-full transition-all ${reached ? "bg-emerald-400" : "bg-blue-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>
          {formatCurrency(income)} / {formatCurrency(goal)}
        </span>
        <span className={reached ? "font-semibold text-emerald-400" : ""}>
          {reached ? "Goal reached!" : `${formatCurrency(remaining)} left`}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        {Math.round(percent)}% complete · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left in month
      </p>
    </div>
  );
}

export default function Home() {
  const { leads, incomeEntries } = useCrmData();
  const { goal } = useGoalSettings();
  const stats = calculateDashboardStats(leads, incomeEntries);

  const urgentFollowUps = leads
    .filter((lead) => lead.status === "Follow-up" || lead.status === "Proposal Sent")
    .sort((a, b) => getDaysUntil(a.nextFollowUpDate) - getDaysUntil(b.nextFollowUpDate))
    .slice(0, 5);

  const goalFooter =
    goal.monthlyIncomeGoal > 0 ? (
      <GoalProgressFooter income={stats.totalMonthlyIncome} goal={goal.monthlyIncomeGoal} />
    ) : undefined;

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-semibold text-white">Welcome back</h1>
          <p className="text-sm text-slate-400">Here is your business overview today</p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Monthly Income"
            value={formatCurrency(stats.totalMonthlyIncome)}
            trend="up"
            footer={goalFooter}
          />
          <DashboardCard
            title="Closed Deals"
            value={stats.totalClosedDeals}
            trend={stats.totalClosedDeals > 2 ? "up" : "neutral"}
          />
          <DashboardCard title="Active Leads" value={stats.totalActiveLeads} trend="up" />
          <DashboardCard
            title="Follow-ups Pending"
            value={stats.totalPendingFollowUps}
            trend={stats.totalPendingFollowUps > 0 ? "down" : "neutral"}
          />
          <DashboardCard
            title="Est. Commissions"
            value={formatCurrency(stats.estimatedCommissions)}
            trend="up"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 text-lg font-semibold text-white">Recent Leads</h2>
              <LeadsTable leads={leads.slice(0, 5)} />
              <div className="mt-5 text-center">
                <a
                  href="/leads"
                  className="text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
                >
                  View all leads
                </a>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 backdrop-blur-sm">
              <h2 className="mb-6 text-lg font-semibold text-white">Next Follow-ups</h2>
              <div className="space-y-3">
                {urgentFollowUps.length > 0 ? (
                  urgentFollowUps.map((lead) => {
                    const daysUntil = getDaysUntil(lead.nextFollowUpDate);
                    const isOverdue = daysUntil < 0;

                    return (
                      <div
                        key={lead.id}
                        className={`rounded-lg border p-3 text-sm ${
                          isOverdue
                            ? "border-rose-700/50 bg-rose-900/20"
                            : daysUntil <= 2
                              ? "border-amber-700/50 bg-amber-900/20"
                              : "border-slate-700/50 bg-slate-700/20"
                        }`}
                      >
                        <p className="truncate font-medium text-white">{lead.clientName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{lead.niche}</p>
                        <p
                          className={`mt-2 text-xs font-semibold ${
                            isOverdue
                              ? "text-rose-300"
                              : daysUntil <= 2
                                ? "text-amber-300"
                                : "text-slate-300"
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntil)} days overdue`
                            : daysUntil === 0
                              ? "Today"
                              : `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-6 text-center text-sm text-slate-400">
                    No pending follow-ups
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
