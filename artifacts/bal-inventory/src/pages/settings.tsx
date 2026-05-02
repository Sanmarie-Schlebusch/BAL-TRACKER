import { useState } from "react";
import {
  useListMarkets,
  useCreateMarket,
  useUpdateMarket,
  useDeleteMarket,
  getListMarketsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Globe, MapPin } from "lucide-react";

interface MarketFormState {
  name: string;
  country: string;
  region: string;
}

const emptyForm: MarketFormState = { name: "", country: "", region: "" };

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: markets, isLoading } = useListMarkets();
  const createMarket = useCreateMarket();
  const updateMarket = useUpdateMarket();
  const deleteMarket = useDeleteMarket();

  const [addOpen, setAddOpen] = useState(false);
  const [editMarket, setEditMarket] = useState<{ id: number } & MarketFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [form, setForm] = useState<MarketFormState>(emptyForm);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListMarketsQueryKey() });

  const handleOpenAdd = () => {
    setForm(emptyForm);
    setAddOpen(true);
  };

  const handleOpenEdit = (m: { id: number; name: string; country: string; region?: string }) => {
    setEditMarket({ id: m.id, name: m.name, country: m.country, region: m.region ?? "" });
    setForm({ name: m.name, country: m.country, region: m.region ?? "" });
  };

  const handleCreate = () => {
    if (!form.name.trim() || !form.country.trim()) {
      toast({ title: "Name and country are required", variant: "destructive" });
      return;
    }
    createMarket.mutate(
      { data: { name: form.name.trim(), country: form.country.trim(), region: form.region.trim() || undefined } },
      {
        onSuccess: () => {
          invalidate();
          setAddOpen(false);
          setForm(emptyForm);
          toast({ title: `Market "${form.name}" created` });
        },
        onError: () => toast({ title: "Failed to create market", variant: "destructive" }),
      }
    );
  };

  const handleUpdate = () => {
    if (!editMarket) return;
    if (!form.name.trim() || !form.country.trim()) {
      toast({ title: "Name and country are required", variant: "destructive" });
      return;
    }
    updateMarket.mutate(
      { id: editMarket.id, data: { name: form.name.trim(), country: form.country.trim(), region: form.region.trim() || undefined } },
      {
        onSuccess: () => {
          invalidate();
          setEditMarket(null);
          toast({ title: `Market "${form.name}" updated` });
        },
        onError: () => toast({ title: "Failed to update market", variant: "destructive" }),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMarket.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          invalidate();
          setDeleteTarget(null);
          toast({ title: `Market "${deleteTarget.name}" deleted` });
        },
        onError: () => toast({ title: "Failed to delete market", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-20 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage markets and other configuration</p>
      </div>

      {/* Markets Card */}
      <Card className="bg-card border-card-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Markets
            </CardTitle>
            <CardDescription className="mt-1">
              Add or remove the markets your team operates in
            </CardDescription>
          </div>
          <Button size="sm" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Market
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : markets && markets.length > 0 ? (
            <ul className="space-y-3">
              {markets.map(market => (
                <li
                  key={market.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{market.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {market.country}{market.region ? ` · ${market.region}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(market)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget({ id: market.id, name: market.name })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No markets yet</p>
              <p className="text-xs mt-1 opacity-60">Click "Add Market" to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setForm(emptyForm); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Add New Market</DialogTitle>
          </DialogHeader>
          <MarketForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMarket.isPending}>
              {createMarket.isPending ? "Creating…" : "Create Market"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMarket} onOpenChange={(o) => { if (!o) setEditMarket(null); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Edit Market</DialogTitle>
          </DialogHeader>
          <MarketForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditMarket(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMarket.isPending}>
              {updateMarket.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Delete Market</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget?.name}</span>?
            Any inventory items linked to this market will lose their market association.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMarket.isPending}>
              {deleteMarket.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarketForm({
  form,
  onChange,
}: {
  form: MarketFormState;
  onChange: (f: MarketFormState) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Market Name <span className="text-destructive">*</span></Label>
        <Input
          value={form.name}
          onChange={e => onChange({ ...form, name: e.target.value })}
          placeholder="e.g. Egypt"
        />
      </div>
      <div className="space-y-2">
        <Label>Country <span className="text-destructive">*</span></Label>
        <Input
          value={form.country}
          onChange={e => onChange({ ...form, country: e.target.value })}
          placeholder="e.g. Egypt"
        />
      </div>
      <div className="space-y-2">
        <Label>Region <span className="text-muted-foreground text-xs">(optional)</span></Label>
        <Input
          value={form.region}
          onChange={e => onChange({ ...form, region: e.target.value })}
          placeholder="e.g. North Africa"
        />
      </div>
    </div>
  );
}
