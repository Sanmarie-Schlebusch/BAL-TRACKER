import { useGetDashboardSummary } from "@workspace/api-client-react";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContextSelector } from "@/components/context-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { seasonId, marketId } = useAppState();
  const { data: summary, isLoading } = useGetDashboardSummary({ seasonId, marketId: marketId === 0 ? undefined : marketId });

  if (isLoading || !summary) {
    return (
      <div className="space-y-6">
        <ContextSelector />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full bg-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full bg-card" />
          <Skeleton className="h-64 w-full bg-card" />
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Items", value: summary.totalItems },
    { title: "Missing", value: summary.missingItems, className: "text-red-500" },
    { title: "Damaged", value: summary.damagedItems, className: "text-orange-500" },
    { title: "Reusable", value: summary.reusableItems },
    { title: "On Site", value: summary.onSiteItems },
    { title: "Packed", value: summary.packedItems },
    { title: "In Transit", value: summary.inTransitItems },
    { title: "Needed", value: summary.neededItems, className: "text-red-400" },
    { title: "Stored", value: summary.storedItems },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <ContextSelector />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card border-card-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.className || "text-foreground"}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.statusBreakdown.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status.status} />
                  </div>
                  <span className="font-bold">{status.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-card-border">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {summary.recentActivity.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-bold text-primary">{activity.changedBy || "System"}</span> updated{" "}
                      <span className="font-semibold">{activity.field}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.oldValue ? (
                        <>
                          <span className="line-through opacity-50">{activity.oldValue}</span> &rarr;{" "}
                        </>
                      ) : null}
                      <span className="font-medium text-foreground">{activity.newValue}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(activity.changedAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
              {summary.recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
