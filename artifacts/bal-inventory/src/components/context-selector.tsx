import { useEffect } from "react";
import { useListSeasons, useListMarkets } from "@workspace/api-client-react";
import { useAppState } from "@/hooks/use-app-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function ContextSelector() {
  const { seasonId, setSeasonId, marketId, setMarketId } = useAppState();
  
  const { data: seasons, isLoading: loadingSeasons } = useListSeasons();
  const { data: markets, isLoading: loadingMarkets } = useListMarkets();

  const seasonsData = Array.isArray(seasons) ? seasons : [];
  const marketsData = Array.isArray(markets) ? markets : [];

  useEffect(() => {
    if (seasonsData.length > 0 && !seasonId) {
      const activeSeason = seasonsData.find(s => s.isActive) || seasonsData[0];
      setSeasonId(activeSeason.id);
    }
  }, [seasonsData, seasonId, setSeasonId]);

  useEffect(() => {
    if (marketsData.length > 0 && !marketId) {
      setMarketId(marketsData[0].id);
    }
  }, [marketsData, marketId, setMarketId]);

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
              {seasonsData.map(season => (
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
              {marketsData.map(market => (
                <SelectItem key={market.id} value={market.id.toString()}>{market.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
