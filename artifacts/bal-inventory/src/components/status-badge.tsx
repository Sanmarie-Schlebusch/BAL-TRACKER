import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  let bgColor = "";
  let textColor = "text-white";

  switch (status) {
    case "Needed":
      bgColor = "bg-[#ef4444]"; // red
      break;
    case "Packed":
      bgColor = "bg-[#f97316]"; // orange
      break;
    case "In Transit":
      bgColor = "bg-[#3b82f6]"; // blue
      break;
    case "On Site":
      bgColor = "bg-[#a855f7]"; // purple
      break;
    case "Installed":
      bgColor = "bg-[#22c55e]"; // green
      break;
    case "Returned":
      bgColor = "bg-[#6b7280]"; // grey
      break;
    case "Damaged":
      bgColor = "bg-[#991b1b]"; // dark red
      break;
    case "Missing":
      bgColor = "bg-[#1f2937]"; // near-black
      break;
    case "Stored":
      bgColor = "bg-[#14b8a6]"; // teal
      break;
    default:
      bgColor = "bg-gray-500";
  }

  return (
    <Badge className={`${bgColor} ${textColor} hover:${bgColor} border-none font-bold shadow-sm uppercase text-[10px] tracking-wider px-2 py-0.5`}>
      {status}
    </Badge>
  );
}
