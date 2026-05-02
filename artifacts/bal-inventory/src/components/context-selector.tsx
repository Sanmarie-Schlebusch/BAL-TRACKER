import { useEffect } from "react";
import { useListSeasons, useListMarkets } from "@workspace/api-client-react";
import { useAppState } from "@/hooks/use-app-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function ContextSelector() {
  const { seasonId, setSeasonId, marketId, setMarketId } = useAppState();
  
  const { data: seasons, isLoading: loadingSeasons } = useListSeasons();
  const { data: markets, isLoading: loadingMarkets } = useListMarkets();

  useEffect(() => {
    if (seasons && seasons.length > 0 && !seasonId) {
      const activeSeason = seasons.find(s => s.isActive) || seasons[0];
      setSeasonId(activeSeason.id);
    }
  }, [seasons, seasonId, setSeasonId]);

  useEffect(() => {
    if (markets && markets.length > 0 && !marketId) {
      setMarketId(markets[0].id);
    }
  }, [markets, marketId, setMarketId]);

  return (
    <div className="flex gap-4 items-center flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Season</span>
        {loadingSeasons ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <Select 
            value={seasonId ? seasonId.toString() : ""} 
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
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Market</span>
        {loadingMarkets ? (
          <Skeleton className="h-10 w-32" />
        ) : (
          <Select 
            value={marketId ? marketId.toString() : ""} 
            onValueChange={(v) => setMarketId(parseInt(v))}
          >
            <SelectTrigger className="w-48 bg-card border-card-border font-bold">
              <SelectValue placeholder="Select Market" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Markets</SelectItem>
              {markets?.map(market => (
                <SelectItem key={market.id} value={market.id.toString()}>{market.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
