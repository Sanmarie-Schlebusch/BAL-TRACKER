import { useState } from "react";
import { Link } from "wouter";
import { 
  useListItems, 
  useListDepartments, 
  useUpdateItem 
} from "@workspace/api-client-react";
import { useAppState } from "@/hooks/use-app-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Plus, Search, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListItemsQueryKey } from "@workspace/api-client-react";

export default function Inventory() {
  const { seasonId, marketId } = useAppState();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [condition, setCondition] = useState<string | undefined>();

  const { data: items, isLoading } = useListItems({
    seasonId,
    marketId: marketId === 0 ? undefined : marketId,
    departmentId,
    status,
    condition,
    search: search || undefined
  });

  const { data: departments } = useListDepartments();
  const updateItem = useUpdateItem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpdateStatus = (id: number, newStatus: string) => {
    updateItem.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        toast({ title: "Status updated" });
      }
    });
  };

  const handleUpdateQty = (id: number, newQty: number) => {
    updateItem.mutate({ id, data: { actualQuantity: newQty } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
        toast({ title: "Quantity updated" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <Link href="/inventory/new">
          <Button className="w-full md:w-auto font-bold uppercase tracking-wider">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </Link>
      </div>

      <div className="bg-card border-card-border p-4 rounded-xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search items..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background font-medium"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={departmentId?.toString() || "all"} onValueChange={(v) => setDepartmentId(v === "all" ? undefined : parseInt(v))}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              {departments?.map(d => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["Needed", "Packed", "In Transit", "On Site", "Installed", "Returned", "Damaged", "Missing", "Stored"].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border-card-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading inventory...</div>
        ) : !items || items.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or add a new item.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Dept</TableHead>
                  <TableHead>Qty (Act / Plan)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.thumbnailUrl ? (
                        <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                          <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/inventory/${item.id}`}>
                        <div className="font-bold text-primary hover:underline cursor-pointer">
                          {item.name}
                        </div>
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.condition} • {item.reusable ? "Reusable" : "Consumable"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{item.departmentName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          className="w-16 h-8 text-center font-bold" 
                          defaultValue={item.actualQuantity}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val !== item.actualQuantity) {
                              handleUpdateQty(item.id, val);
                            }
                          }}
                        />
                        <span className="text-muted-foreground text-sm">/ {item.plannedQuantity} {item.unitType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={item.status} 
                        onValueChange={(v) => handleUpdateStatus(item.id, v)}
                      >
                        <SelectTrigger className="h-8 border-none bg-transparent p-0 w-auto min-w-[100px] focus:ring-0">
                          <StatusBadge status={item.status} />
                        </SelectTrigger>
                        <SelectContent>
                          {["Needed", "Packed", "In Transit", "On Site", "Installed", "Returned", "Damaged", "Missing", "Stored"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Link href={`/inventory/${item.id}`}>
                        <Button variant="ghost" size="sm" className="font-medium text-xs uppercase tracking-wider">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
// For empty state icon
import { Package } from "lucide-react";
