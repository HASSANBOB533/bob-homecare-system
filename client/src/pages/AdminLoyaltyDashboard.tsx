import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Chart from "chart.js/auto";
import { Users, TrendingUp, TrendingDown, Percent } from "lucide-react";

export default function AdminLoyaltyDashboard() {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = trpc.loyalty.getAnalytics.useQuery();

  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const lineChartInstance = useRef<Chart | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);

  // Create charts when data is loaded
  useEffect(() => {
    if (!analytics || !lineChartRef.current || !pieChartRef.current) return;

    // Destroy existing charts
    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
    }
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }

    // Prepare monthly trend data
    const monthlyData = analytics.monthlyTrend.reduce((acc: any, item: any) => {
      if (!acc[item.month]) {
        acc[item.month] = { earned: 0, redeemed: 0 };
      }
      if (item.type === "earned") {
        acc[item.month].earned = item.total;
      } else if (item.type === "redeemed") {
        acc[item.month].redeemed = item.total;
      }
      return acc;
    }, {});

    const months = Object.keys(monthlyData).sort();
    const earnedData = months.map(m => monthlyData[m].earned);
    const redeemedData = months.map(m => monthlyData[m].redeemed);

    // Line chart: Points issued vs redeemed over time
    lineChartInstance.current = new Chart(lineChartRef.current, {
      type: "line",
      data: {
        labels: months.map(m => {
          const [year, month] = m.split("-");
          return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        }),
        datasets: [
          {
            label: t("admin.loyalty.pointsIssued") || "Points Issued",
            data: earnedData,
            borderColor: "rgb(34, 197, 94)",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            tension: 0.4,
            fill: true,
          },
          {
            label: t("admin.loyalty.pointsRedeemed") || "Points Redeemed",
            data: redeemedData,
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: t("admin.loyalty.monthlyTrend") || "Monthly Trend (Last 6 Months)",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    // Pie chart: Redemption rate
    const totalIssued = analytics.summary.totalPointsIssued;
    const totalRedeemed = analytics.summary.totalPointsRedeemed;
    const unredeemed = totalIssued - totalRedeemed;

    pieChartInstance.current = new Chart(pieChartRef.current, {
      type: "pie",
      data: {
        labels: [
          t("admin.loyalty.redeemed") || "Redeemed",
          t("admin.loyalty.unredeemed") || "Unredeemed",
        ],
        datasets: [
          {
            data: [totalRedeemed, unredeemed],
            backgroundColor: ["rgb(239, 68, 68)", "rgb(34, 197, 94)"],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: t("admin.loyalty.redemptionRate") || "Redemption Rate",
          },
        },
      },
    });

    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
    };
  }, [analytics, t]);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container py-8">
        <p className="text-center text-muted-foreground">
          {t("admin.loyalty.noData") || "No analytics data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.loyalty.title") || "Loyalty Program Analytics"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("admin.loyalty.subtitle") || "Track points issued, redeemed, and program performance"}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.loyalty.totalIssued") || "Total Points Issued"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalPointsIssued.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.loyalty.allTime") || "All-time total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.loyalty.totalRedeemed") || "Total Points Redeemed"}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalPointsRedeemed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.loyalty.allTime") || "All-time total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.loyalty.redemptionRate") || "Redemption Rate"}
            </CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.redemptionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.loyalty.ofTotalIssued") || "Of total issued"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("admin.loyalty.activeMembers") || "Active Members"}
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalActiveMembers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.loyalty.avgPoints") || "Avg"}: {analytics.summary.averagePointsPerUser} {t("admin.loyalty.points") || "pts"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.loyalty.monthlyTrend") || "Monthly Trend"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <canvas ref={lineChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.loyalty.redemptionRate") || "Redemption Rate"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: "300px" }}>
              <canvas ref={pieChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Earners Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.loyalty.topEarners") || "Top Earners"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">{t("admin.loyalty.rank") || "Rank"}</th>
                  <th className="text-left py-3 px-4">{t("admin.loyalty.name") || "Name"}</th>
                  <th className="text-left py-3 px-4">{t("admin.loyalty.email") || "Email"}</th>
                  <th className="text-right py-3 px-4">{t("admin.loyalty.points") || "Points"}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topEarners.map((user: any, index: number) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="font-semibold">#{index + 1}</span>
                    </td>
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4 text-right font-semibold">{user.loyaltyPoints.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.loyalty.recentTransactions") || "Recent Transactions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">{t("admin.loyalty.user") || "User"}</th>
                  <th className="text-left py-3 px-4">{t("admin.loyalty.type") || "Type"}</th>
                  <th className="text-right py-3 px-4">{t("admin.loyalty.points") || "Points"}</th>
                  <th className="text-left py-3 px-4">{t("admin.loyalty.description") || "Description"}</th>
                  <th className="text-right py-3 px-4">{t("admin.loyalty.date") || "Date"}</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{tx.userName}</div>
                        <div className="text-xs text-muted-foreground">{tx.userEmail}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === "earned"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          tx.points > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {tx.points > 0 ? "+" : ""}{tx.points}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{tx.description}</td>
                    <td className="py-3 px-4 text-right text-sm">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
