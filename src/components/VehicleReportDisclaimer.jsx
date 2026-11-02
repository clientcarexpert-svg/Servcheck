import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

// Show this at the top of every shared vehicle history report, and on the page where a seller creates one.
export default function VehicleReportDisclaimer({ className = "" }) {
  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 leading-relaxed ${className}`}>
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1.5">
          <p className="font-bold">This is a ServCheck report only. It is not a verified history.</p>
          <p>
            It is based on information that users uploaded, which ServCheck then scanned. ServCheck cannot verify that the
            records are authentic, complete or accurate, and the health score is not a condition, safety or value rating.
          </p>
          <p>
            Before you buy, do a PPSR check at{" "}
            <a href="https://www.ppsr.gov.au" target="_blank" rel="noopener noreferrer" className="underline font-semibold">ppsr.gov.au</a>{" "}
            (stolen, written off, money owing) and get an independent pre-purchase inspection.
          </p>
          <p>
            <Link to="/terms#vehicle-history-reports" className="underline font-semibold">Read the full terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
