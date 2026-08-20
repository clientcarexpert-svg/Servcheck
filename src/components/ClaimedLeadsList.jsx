import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, ChevronDown, ChevronUp, Trash2, CheckCircle, Loader2, Clock, DollarSign, Mail } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ClaimedLeadThread from "./ClaimedLeadThread";

function ClaimedLeadCard({ lead, profile, onHide, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState(lead.agreed_price?.toString() || "");
  const [saving, setSaving] = useState(false);

  const claimedAt = lead.updated_date || lead.created_date;

  const handleMarkComplete = async () => {
    if (!agreedPrice) { toast.error("Please enter the agreed price."); return; }
    setSaving(true);
    try {
      const updated = {
        job_completed: true,
        agreed_price: parseFloat(agreedPrice),
        completed_at: new Date().toISOString(),
      };
      await base44.entities.MechanicLead.update(lead.id, updated);
      onUpdate({ ...lead, ...updated });
      setShowCompleteForm(false);
      toast.success("Job marked as completed!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-200 shadow-sm ${
      lead.job_completed
        ? "border-2 border-emerald-200"
        : "border border-slate-200"
    }`}>
      {/* ── Card header gradient ── */}
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
        <div className={`px-5 py-4 ${lead.job_completed ? "bg-gradient-to-r from-emerald-600 to-emerald-500" : "bg-gradient-to-r from-[#1a237e] to-[#283593]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Status badge */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {lead.job_completed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                    <CheckCircle className="h-3 w-3" /> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 text-white px-2.5 py-1 rounded-full font-bold">
                    Active Lead
                  </span>
                )}
                {lead.quoted_price > 0 && (
                  <span className="text-[11px] font-bold text-white/80 bg-white/10 border border-white/20 px-2.5 py-1 rounded-full">
                    ${lead.quoted_price?.toLocaleString()} quoted
                  </span>
                )}
              </div>

              <p className="font-heading font-extrabold text-lg text-white leading-tight">
                {lead.car_year} {lead.car_make} {lead.car_model}
                {lead.car_variant && <span className="font-normal text-white/60 text-sm"> · {lead.car_variant}</span>}
              </p>
              <p className="text-sm text-white/70 mt-0.5 font-medium">
                {lead.service_type}{lead.suburb ? ` · ${lead.suburb},` : ''} {lead.state}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-1">
              {expanded
                ? <ChevronUp className="h-4 w-4 text-white" />
                : <ChevronDown className="h-4 w-4 text-white" />
              }
            </div>
          </div>
        </div>

        {/* ── Sub-row: timestamp + agreed price ── */}
        <div className="bg-white px-5 py-2.5 flex items-center gap-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-400" />
            <p className="text-[11px] text-slate-500 font-medium">
              Unlocked {claimedAt ? format(new Date(claimedAt), "d MMM yyyy, h:mm a") : ""}
            </p>
          </div>
          {lead.job_completed && lead.agreed_price && (
            <div className="flex items-center gap-1 ml-auto">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              <p className="text-[11px] font-extrabold text-emerald-600">${lead.agreed_price.toLocaleString()} agreed</p>
            </div>
          )}
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="bg-white px-5 pb-5">
          {/* Customer row */}
          {(lead.user_email || lead.user_full_name) && (
            <div className="flex items-center gap-3 mt-4 bg-gradient-to-r from-[#1a237e]/5 to-[#283593]/5 border border-[#1a237e]/10 rounded-2xl px-4 py-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#1a237e] to-[#283593] flex items-center justify-center flex-shrink-0 text-white font-black text-base shadow-sm">
                {(lead.user_full_name || lead.user_email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                {lead.user_full_name && (
                  <p className="font-heading font-extrabold text-sm text-slate-900 truncate">{lead.user_full_name}</p>
                )}
                {lead.user_email && (
                  <a href={`mailto:${lead.user_email}`} className="flex items-center gap-1 text-xs text-[#1a237e] hover:underline font-semibold mt-0.5">
                    <Mail className="h-3 w-3" /> {lead.user_email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Thread component */}
          <ClaimedLeadThread lead={lead} profile={profile} />

          {/* ── Mark complete section ── */}
          {!lead.job_completed && (
            <div className="mt-4">
              {showCompleteForm ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div>
                    <p className="font-heading font-extrabold text-sm text-slate-800">What was the final price?</p>
                    <p className="text-xs text-slate-500 mt-0.5">This helps us track your earnings.</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        placeholder="Agreed amount"
                        value={agreedPrice}
                        onChange={e => setAgreedPrice(e.target.value)}
                        className="w-full h-12 pl-9 pr-3 rounded-xl bg-white border border-emerald-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm"
                      />
                    </div>
                    <button
                      onClick={handleMarkComplete}
                      disabled={saving}
                      className="h-12 px-5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-60 shadow-sm"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" /> Done</>}
                    </button>
                    <button
                      onClick={() => setShowCompleteForm(false)}
                      className="h-12 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCompleteForm(true)}
                  className="w-full py-3.5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 border-2 border-dashed border-emerald-300 text-emerald-700 text-sm font-bold hover:bg-emerald-100 active:scale-[0.99] transition-all"
                >
                  <CheckCircle className="h-4 w-4" /> Mark Job as Completed
                </button>
              )}
            </div>
          )}

          {/* Remove */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => onHide(lead)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors py-1"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClaimedLeadsList({ leads, profile, onHide, onUpdate }) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-inner">
          <CheckCircle2 className="h-8 w-8 text-slate-300" />
        </div>
        <p className="font-heading font-extrabold text-base text-slate-700">No claimed leads yet</p>
        <p className="text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">Once you unlock a lead, your conversations with customers will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {leads.map(lead => (
        <ClaimedLeadCard key={lead.id} lead={lead} profile={profile} onHide={onHide} onUpdate={onUpdate} />
      ))}
    </div>
  );
}