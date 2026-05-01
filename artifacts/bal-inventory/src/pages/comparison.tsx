import { useGetMarketComparison, useListSeasons } from "@workspace/api-client-react";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default function Comparison() {
  const { seasonId, setSeasonId } = useAppState();
  const { data: seasons } = useListSeasons();

  const activeSeasonId = seasonId || (seasons && seasons.length > 0 ? seasons[0].id : 0);

  const { data: comparison, isLoading } = useGetMarketComparison({ seasonId: activeSeasonId || 0 }, { query: { enabled: !!activeSeasonId, queryKey: ["market-comparison", activeSeasonId] } });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Market Comparison</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Season</span>
          <Select 
            value={activeSeasonId ? activeSeasonId.toString() : ""} 
            onValueChange={(v) => setSeasonId(parseInt(v))}
          >
            <SelectTrigger className="w-32 bg-card border-card-border font-bold">
              <SelectValue placeholder="Select Season" />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map(season => (
                <SelectItem key={season.id} value={season.id.toString()}>{season.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-card border-card-border">
        <CardHeader>
          <CardTitle>Cross-Market Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
              <Skeleton className="h-16 w-full bg-muted" />
            </div>
          ) : !comparison || comparison.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No comparison data available for this season.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Reusable</TableHead>
                    {/* Assuming max 3 markets for BAL usually, we'll collect distinct market names from first row */}
                    {comparison[0]?.markets.map(m => (
                      <TableHead key={m.marketId} className="text-center">{m.marketName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparison.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.itemName}</TableCell>
                      <TableCell>{row.departmentName}</TableCell>
                      <TableCell>{row.reusable ? "Yes" : "No"}</TableCell>
                      {row.markets.map(m => (
                        <TableCell key={m.marketId} className={`text-center ${m.status === 'Missing' || m.actualQuantity < m.plannedQuantity ? 'bg-red-950/20' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-lg">
                              {m.actualQuantity} <span className="text-xs text-muted-foreground font-normal">/ {m.plannedQuantity}</span>
                            </span>
                            <StatusBadge status={m.status} />
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
