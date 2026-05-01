import { useState } from "react";
import { useExportReport } from "@workspace/api-client-react";
import { useAppState } from "@/hooks/use-app-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContextSelector } from "@/components/context-selector";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ExportReportReportType } from "@workspace/api-client-react";

export default function Reports() {
  const { seasonId, marketId } = useAppState();
  const { toast } = useToast();
  
  const [exporting, setExporting] = useState<string | null>(null);

  const reportTypes = [
    { id: ExportReportReportType.full, title: "Full Market Inventory", desc: "Complete export of all items, quantities, and statuses." },
    { id: ExportReportReportType.damaged_missing, title: "Damaged & Missing Report", desc: "List of all items marked as damaged or missing." },
    { id: ExportReportReportType.reusable, title: "Reusable Branding", desc: "Inventory of all reusable branding assets." },
    { id: ExportReportReportType.load_out, title: "Load-out Checklist", desc: "Checklist for event load-out and packing." },
    { id: ExportReportReportType.storage, title: "Storage List", desc: "Items currently in storage facilities." }
  ];

  // We are using the fetch function directly from the hook generated code, 
  // since we need to trigger it on button click.
  // Actually, useExportReport is a query hook. But we need to trigger it on click.
  // Let's use customFetch directly or a lazy query pattern.
  // The API hook is `useExportReport`. We can use the queryClient to fetch it directly.
  const { refetch: fetchFull } = useExportReport({ seasonId, marketId: marketId === 0 ? undefined : marketId, reportType: ExportReportReportType.full }, { query: { enabled: false, queryKey: ["export", "full", seasonId, marketId] } });
  const { refetch: fetchDamaged } = useExportReport({ seasonId, marketId: marketId === 0 ? undefined : marketId, reportType: ExportReportReportType.damaged_missing }, { query: { enabled: false, queryKey: ["export", "damaged", seasonId, marketId] } });
  const { refetch: fetchReusable } = useExportReport({ seasonId, marketId: marketId === 0 ? undefined : marketId, reportType: ExportReportReportType.reusable }, { query: { enabled: false, queryKey: ["export", "reusable", seasonId, marketId] } });
  const { refetch: fetchLoadOut } = useExportReport({ seasonId, marketId: marketId === 0 ? undefined : marketId, reportType: ExportReportReportType.load_out }, { query: { enabled: false, queryKey: ["export", "loadout", seasonId, marketId] } });
  const { refetch: fetchStorage } = useExportReport({ seasonId, marketId: marketId === 0 ? undefined : marketId, reportType: ExportReportReportType.storage }, { query: { enabled: false, queryKey: ["export", "storage", seasonId, marketId] } });

  const refetchers = {
    [ExportReportReportType.full]: fetchFull,
    [ExportReportReportType.damaged_missing]: fetchDamaged,
    [ExportReportReportType.reusable]: fetchReusable,
    [ExportReportReportType.load_out]: fetchLoadOut,
    [ExportReportReportType.storage]: fetchStorage,
  };

  const handleExport = async (reportType: ExportReportReportType) => {
    try {
      setExporting(reportType);
      const refetch = refetchers[reportType];
      const { data } = await refetch();
      
      if (data) {
        const blob = new Blob([data.csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({ title: "Report exported successfully" });
      }
    } catch (e) {
      toast({ title: "Failed to export report", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <ContextSelector />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="bg-card border-card-border flex flex-col">
            <CardHeader>
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.desc}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-4">
              <Button 
                className="w-full font-bold uppercase tracking-wider" 
                onClick={() => handleExport(report.id as ExportReportReportType)}
                disabled={exporting === report.id || !seasonId}
              >
                {exporting === report.id ? "Exporting..." : (
                  <>
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
