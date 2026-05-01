import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetItem, 
  useCreateItem, 
  useUpdateItem,
  useListDepartments,
  useListSeasons,
  useListMarkets,
  useListSuppliers,
  useListStorageLocations
} from "@workspace/api-client-react";
import { getGetItemQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  departmentId: z.coerce.number().min(1, "Department is required"),
  seasonId: z.coerce.number().min(1, "Season is required"),
  marketId: z.coerce.number().min(1, "Market is required"),
  plannedQuantity: z.coerce.number().min(0, "Must be >= 0"),
  actualQuantity: z.coerce.number().min(0, "Must be >= 0"),
  unitType: z.string().min(1, "Unit type is required"),
  status: z.string().min(1, "Status is required"),
  condition: z.string().min(1, "Condition is required"),
  reusable: z.boolean().default(false),
  isGeneric: z.boolean().default(false),
  supplierId: z.coerce.number().optional().nullable(),
  storageLocationId: z.coerce.number().optional().nullable(),
  notes: z.string().optional(),
});

export default function ItemForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isNew = !params.id || params.id === "new";
  const itemId = isNew ? 0 : parseInt(params.id as string);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, isLoading: isLoadingItem } = useGetItem(itemId, { 
    query: { enabled: !isNew && !!itemId, queryKey: getGetItemQueryKey(itemId) } 
  });

  const { data: departments } = useListDepartments();
  const { data: seasons } = useListSeasons();
  const { data: markets } = useListMarkets();
  const { data: suppliers } = useListSuppliers();
  const { data: storageLocations } = useListStorageLocations();

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      departmentId: 0,
      seasonId: 0,
      marketId: 0,
      plannedQuantity: 0,
      actualQuantity: 0,
      unitType: "units",
      status: "Needed",
      condition: "New",
      reusable: false,
      isGeneric: false,
      supplierId: null,
      storageLocationId: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (item && !isNew) {
      form.reset({
        name: item.name,
        departmentId: item.departmentId,
        seasonId: item.seasonId,
        marketId: item.marketId,
        plannedQuantity: item.plannedQuantity,
        actualQuantity: item.actualQuantity,
        unitType: item.unitType,
        status: item.status,
        condition: item.condition,
        reusable: item.reusable,
        isGeneric: item.isGeneric,
        supplierId: item.supplierId || null,
        storageLocationId: item.storageLocationId || null,
        notes: item.notes || "",
      });
    }
  }, [item, isNew, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      supplierId: values.supplierId || undefined,
      storageLocationId: values.storageLocationId || undefined,
    };

    if (isNew) {
      createItem.mutate({ data: payload as any }, {
        onSuccess: (res) => {
          toast({ title: "Item created successfully" });
          setLocation(`/inventory/${res.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create item", variant: "destructive" });
        }
      });
    } else {
      updateItem.mutate({ id: itemId, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(itemId) });
          toast({ title: "Item updated successfully" });
          setLocation(`/inventory/${itemId}`);
        },
        onError: () => {
          toast({ title: "Failed to update item", variant: "destructive" });
        }
      });
    }
  };

  if (!isNew && isLoadingItem) {
    return <div className="space-y-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isNew ? "/inventory" : `/inventory/${itemId}`)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? "Add New Item" : "Edit Item"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Scorer's Table LED Display" className="bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select value={field.value ? field.value.toString() : ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seasonId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Season</FormLabel>
                      <Select value={field.value ? field.value.toString() : ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select season" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {seasons?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market</FormLabel>
                      <Select value={field.value ? field.value.toString() : ""} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select market" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {markets?.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>Quantities & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="plannedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Qty</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-background font-bold text-lg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="actualQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Qty</FormLabel>
                      <FormControl>
                        <Input type="number" className="bg-background font-bold text-lg text-primary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Type</FormLabel>
                      <FormControl>
                        <Input placeholder="units, meters, boxes..." className="bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["Needed", "Packed", "In Transit", "On Site", "Installed", "Returned", "Damaged", "Missing", "Stored"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["New", "Good", "Used", "Damaged", "Needs Repair"].map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-4 mt-6">
                <FormField
                  control={form.control}
                  name="reusable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Reusable Asset</FormLabel>
                        <FormDescription>
                          Can this item be packed up and used again at future events?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isGeneric"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Generic Item</FormLabel>
                        <FormDescription>
                          Is this a generic unbranded item? (e.g. extension cords)
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>Logistics & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier (Optional)</FormLabel>
                      <Select value={field.value ? field.value.toString() : ""} onValueChange={(v) => field.onChange(parseInt(v))}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          {suppliers?.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location (Optional)</FormLabel>
                      <Select value={field.value ? field.value.toString() : ""} onValueChange={(v) => field.onChange(parseInt(v))}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">None</SelectItem>
                          {storageLocations?.map(l => (
                            <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional details..." className="min-h-[100px] bg-background" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full font-bold uppercase tracking-wider h-14 text-lg" disabled={createItem.isPending || updateItem.isPending}>
            {isNew ? "Create Item" : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
