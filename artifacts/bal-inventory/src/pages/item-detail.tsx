import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetItem, 
  useDeleteItem,
  useDuplicateItem,
  useAddItemPhoto,
  useDeleteItemPhoto,
  getGetItemQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Edit, Trash2, Copy, Plus, X, Image as ImageIcon, History } from "lucide-react";
import { format } from "date-fns";
import { useListMarkets, useListSeasons } from "@workspace/api-client-react";

export default function ItemDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const itemId = parseInt(params.id as string);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useGetItem(itemId, { 
    query: { enabled: !!itemId, queryKey: getGetItemQueryKey(itemId) } 
  });

  const deleteItem = useDeleteItem();
  const duplicateItem = useDuplicateItem();
  const addPhoto = useAddItemPhoto();
  const deletePhoto = useDeleteItemPhoto();

  const { data: markets } = useListMarkets();
  const { data: seasons } = useListSeasons();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [dupTargetSeason, setDupTargetSeason] = useState<string>("");
  const [dupTargetMarket, setDupTargetMarket] = useState<string>("");

  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  if (isLoading || !item) {
    return <div className="p-8 text-center text-muted-foreground">Loading item...</div>;
  }

  const handleDelete = () => {
    deleteItem.mutate({ id: itemId }, {
      onSuccess: () => {
        toast({ title: "Item deleted" });
        setLocation("/inventory");
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" })
    });
  };

  const handleDuplicate = () => {
    if (!dupTargetSeason || !dupTargetMarket) {
      toast({ title: "Please select target season and market", variant: "destructive" });
      return;
    }
    duplicateItem.mutate({ 
      id: itemId, 
      data: { targetSeasonId: parseInt(dupTargetSeason), targetMarketId: parseInt(dupTargetMarket) } 
    }, {
      onSuccess: (res) => {
        toast({ title: "Item duplicated successfully" });
        setDuplicateOpen(false);
        setLocation(`/inventory/${res.id}`);
      },
      onError: () => toast({ title: "Failed to duplicate", variant: "destructive" })
    });
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl) {
      toast({ title: "Please enter a photo URL", variant: "destructive" });
      return;
    }
    addPhoto.mutate({ id: itemId, data: { url: newPhotoUrl, caption: newPhotoCaption } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
        setAddPhotoOpen(false);
        setNewPhotoUrl("");
        setNewPhotoCaption("");
        toast({ title: "Photo added" });
      }
    });
  };

  const handleDeletePhoto = (photoId: number) => {
    deletePhoto.mutate({ id: itemId, photoId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
        toast({ title: "Photo deleted" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/inventory")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{item.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">{item.departmentName}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{item.seasonLabel} - {item.marketName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation(`/inventory/${itemId}/edit`)}>
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Button>

          <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Copy className="w-4 h-4 mr-2" /> Duplicate
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Duplicate Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Target Season</Label>
                  <Select value={dupTargetSeason} onValueChange={setDupTargetSeason}>
                    <SelectTrigger><SelectValue placeholder="Select Season" /></SelectTrigger>
                    <SelectContent>
                      {seasons?.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Market</Label>
                  <Select value={dupTargetMarket} onValueChange={setDupTargetMarket}>
                    <SelectTrigger><SelectValue placeholder="Select Market" /></SelectTrigger>
                    <SelectContent>
                      {markets?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDuplicateOpen(false)}>Cancel</Button>
                <Button onClick={handleDuplicate} disabled={duplicateItem.isPending}>Confirm Duplicate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Delete Item</DialogTitle>
                <CardDescription>Are you sure you want to delete {item.name}? This cannot be undone.</CardDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Status</dt>
                  <dd><StatusBadge status={item.status} /></dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Condition</dt>
                  <dd className="font-medium">{item.condition}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Actual Quantity</dt>
                  <dd className="font-bold text-xl text-primary">{item.actualQuantity} <span className="text-sm font-normal text-muted-foreground">{item.unitType}</span></dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Planned Quantity</dt>
                  <dd className="font-bold text-xl">{item.plannedQuantity} <span className="text-sm font-normal text-muted-foreground">{item.unitType}</span></dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Type</dt>
                  <dd className="font-medium">{item.reusable ? "Reusable Asset" : "Consumable"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Supplier</dt>
                  <dd className="font-medium">{item.supplierName || "N/A"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Storage Location</dt>
                  <dd className="font-medium">{item.storageLocationName || "N/A"}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Notes</dt>
                  <dd className="font-medium whitespace-pre-wrap">{item.notes || "No notes provided."}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Photos</CardTitle>
              <Dialog open={addPhotoOpen} onOpenChange={setAddPhotoOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card">
                  <DialogHeader>
                    <DialogTitle>Add Photo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Caption (Optional)</Label>
                      <Input value={newPhotoCaption} onChange={e => setNewPhotoCaption(e.target.value)} placeholder="Description..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setAddPhotoOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddPhoto} disabled={addPhoto.isPending}>Add Photo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {item.photos && item.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {item.photos.map(photo => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                      <img src={photo.url} alt={photo.caption || "Item photo"} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeletePhoto(photo.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {photo.caption && <p className="text-white text-xs text-center font-medium bg-black/50 p-1 rounded">{photo.caption}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No photos attached</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> History Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {item.history && item.history.length > 0 ? (
                  item.history.map((hist, i) => (
                    <div key={hist.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-primary bg-card text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] pl-4 md:pl-0 md:group-odd:pr-4 md:group-even:pl-4">
                        <div className="flex flex-col bg-muted/50 p-3 rounded-lg border border-border">
                          <span className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{hist.field}</span>
                          <span className="text-sm font-medium">
                            {hist.oldValue && <span className="line-through opacity-60 mr-2">{hist.oldValue}</span>}
                            {hist.newValue}
                          </span>
                          <span className="text-xs text-muted-foreground mt-2 flex justify-between">
                            <span>{hist.changedBy || "System"}</span>
                            <span>{format(new Date(hist.changedAt), "MMM d, HH:mm")}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">No history recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
