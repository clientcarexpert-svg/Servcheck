import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Plus, X, Car, Wrench, Phone, Mail,
  Calendar, Clock, DollarSign, MapPin, CheckCircle2, Loader2, Edit2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO, addMonths, subMonths } from "date-fns";
import AddToCalendarButton from "./AddToCalendarButton";

const STATUS_CONFIG = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "In Progress", color: "bg-amber-100 text-amber-800 border-amber-200" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 border-red-200" },
  no_show: { label: "No Show", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function BookingCalendar({ profile }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimedLeads, setClaimedLeads] = useState([]);

  const fetchBookings = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const data = await base44.entities.MechanicBooking.filter({ mechanic_profile_id: profile.id }, "-booking_date", 200);
      setBookings(data);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchClaimedLeads = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const leads = await base44.entities.MechanicLead.filter({ claimed_by_profile_id: profile.id }, "-created_date", 50);
      setClaimedLeads(leads.filter(l => l.user_full_name || l.user_email));
    } catch {}
  }, [profile?.id]);

  useEffect(() => {
    fetchBookings();
    fetchClaimedLeads();
  }, [fetchBookings, fetchClaimedLeads]);

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = (startOfMonth(currentMonth).getDay() + 6) % 7; // Mon-start

  const bookingsOnDay = (day) => bookings.filter(b => b.booking_date && isSameDay(parseISO(b.booking_date), day));
  const selectedDayBookings = bookingsOnDay(selectedDay);

  const handleDelete = async (booking) => {
    if (!confirm("Remove this booking?")) return;
    await base44.entities.MechanicBooking.delete(booking.id);
    setBookings(prev => prev.filter(b => b.id !== booking.id));
    toast.success("Booking removed.");
  };

  const handleStatusChange = async (booking, status) => {
    const updates = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await base44.entities.MechanicBooking.update(booking.id, updates);
    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, ...updates } : b));
    toast.success("Status updated.");
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h3 className="font-heading font-bold text-sm">{format(currentMonth, "MMMM yyyy")}</h3>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <div key={d} className="text-[10px] font-bold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {monthDays.map(day => {
          const dayBookings = bookingsOnDay(day);
          const isSelected = isSameDay(day, selectedDay);
          const todayDate = isToday(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 transition-all text-xs font-semibold border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : todayDate
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-card border-transparent hover:border-border"
              }`}
            >
              <span className="text-[11px] font-bold leading-none">{format(day, "d")}</span>
              {dayBookings.length > 0 && (
                <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                  {dayBookings.slice(0, 3).map((b, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : b.status === "completed" ? "bg-emerald-500" : b.status === "cancelled" ? "bg-red-400" : "bg-blue-500"}`} />
                  ))}
                  {dayBookings.length > 3 && <span className={`text-[8px] font-bold ${isSelected ? "text-white" : "text-muted-foreground"}`}>+{dayBookings.length - 3}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day section */}
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-heading font-bold text-sm">{format(selectedDay, "EEEE, d MMMM")}</p>
          <Button
            size="sm"
            onClick={() => { setEditingBooking(null); setShowForm(true); }}
            className="h-8 px-3 text-xs bg-accent text-white hover:bg-accent/90 gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> New Booking
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : selectedDayBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No bookings on this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedDayBookings.sort((a, b) => (a.booking_time || "").localeCompare(b.booking_time || "")).map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onEdit={() => { setEditingBooking(booking); setShowForm(true); }}
                onDelete={() => handleDelete(booking)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <BookingFormModal
          profile={profile}
          booking={editingBooking}
          selectedDate={selectedDay}
          claimedLeads={claimedLeads}
          onClose={() => { setShowForm(false); setEditingBooking(null); }}
          onSaved={(saved) => {
            if (editingBooking) {
              setBookings(prev => prev.map(b => b.id === saved.id ? saved : b));
            } else {
              setBookings(prev => [...prev, saved]);
            }
            setShowForm(false);
            setEditingBooking(null);
          }}
        />
      )}
    </div>
  );
}

function BookingCard({ booking, onEdit, onDelete, onStatusChange }) {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.scheduled;
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header: Time, Status, Actions */}
      <div className="bg-secondary/30 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {booking.booking_time && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-lg px-2.5 py-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-bold">{booking.booking_time}</span>
            </div>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${status.color}`}>{status.label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Body: Customer & Vehicle Details */}
      <div className="px-4 py-3 space-y-2.5 border-b border-border">
        <p className="font-heading font-bold text-base text-foreground">{booking.customer_name || "Customer"}</p>
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-primary/60" /> <span className="font-medium">{[booking.car_year, booking.car_make, booking.car_model].filter(Boolean).join(" ") || "Vehicle TBC"}</span>
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary/60" /> <span className="font-medium">{booking.service_type}</span>
          </p>
          {booking.odometer > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="h-4 w-4" /> Odometer: <span className="font-medium">{booking.odometer.toLocaleString()} km</span>
            </p>
          )}
        </div>
      </div>

      {/* Pricing Section */}
      {(booking.agreed_price > 0 || booking.estimated_duration_hours > 0) && (
        <div className="px-4 py-3 bg-emerald-50/50 border-b border-border space-y-1.5">
          {booking.agreed_price > 0 && (
            <p className="text-sm text-emerald-800 font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> ${booking.agreed_price.toLocaleString()}
            </p>
          )}
          {booking.estimated_duration_hours > 0 && (
            <p className="text-xs text-emerald-700 flex items-center gap-2">
              Est. duration: <span className="font-medium">{booking.estimated_duration_hours} hrs</span>
            </p>
          )}
        </div>
      )}

      {/* Contact Info */}
      {(booking.customer_phone || booking.customer_email) && (
        <div className="px-4 py-3 border-b border-border space-y-1.5">
          {booking.customer_phone && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary/60" /> <span className="font-medium">{booking.customer_phone}</span>
            </p>
          )}
          {booking.customer_email && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary/60" /> <span className="font-medium break-all">{booking.customer_email}</span>
            </p>
          )}
        </div>
      )}

      {/* Notes */}
      {booking.notes && (
        <div className="px-4 py-3 border-b border-border bg-slate-50/30">
          <p className="text-xs text-muted-foreground italic line-clamp-2">"{booking.notes}"</p>
        </div>
      )}

      {/* Add to calendar */}
      {(booking.status === "scheduled" || booking.status === "in_progress") && (
        <div className="px-4 py-3 border-b border-border">
          <AddToCalendarButton booking={booking} />
        </div>
      )}

      {/* Status actions */}
      <div className="px-4 py-3 space-y-2">
        {booking.status === "scheduled" && (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onStatusChange(booking, "in_progress")}
              className="h-9 rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200 transition-colors"
            >
              Start Job
            </button>
            <button
              onClick={() => onStatusChange(booking, "completed")}
              className="h-9 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </button>
            <button
              onClick={() => onStatusChange(booking, "cancelled")}
              className="h-9 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {booking.status === "in_progress" && (
          <button
            onClick={() => onStatusChange(booking, "completed")}
            className="w-full h-9 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Completed
          </button>
        )}
      </div>
    </div>
  );
}

function BookingFormModal({ profile, booking, selectedDate, claimedLeads, onClose, onSaved }) {
  const isEdit = !!booking;
  const [form, setForm] = useState({
    mechanic_profile_id: profile.id,
    mechanic_email: profile.user_email || "",
    lead_id: booking?.lead_id || "",
    customer_name: booking?.customer_name || "",
    customer_email: booking?.customer_email || "",
    customer_phone: booking?.customer_phone || "",
    car_make: booking?.car_make || "",
    car_model: booking?.car_model || "",
    car_year: booking?.car_year || "",
    car_variant: booking?.car_variant || "",
    fuel_type: booking?.fuel_type || "",
    odometer: booking?.odometer || "",
    service_type: booking?.service_type || "",
    booking_date: booking?.booking_date ? booking.booking_date.split("T")[0] : format(selectedDate, "yyyy-MM-dd"),
    booking_time: booking?.booking_time || "09:00",
    estimated_duration_hours: booking?.estimated_duration_hours || 1,
    agreed_price: booking?.agreed_price || "",
    notes: booking?.notes || "",
    suburb: booking?.suburb || profile.suburb || "",
    state: booking?.state || profile.state || "",
    status: booking?.status || "scheduled",
  });
  const [saving, setSaving] = useState(false);
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLeadPrefill = (leadId) => {
    const lead = claimedLeads.find(l => l.id === leadId);
    if (!lead) return;
    setForm(p => ({
      ...p,
      lead_id: leadId,
      customer_name: lead.user_full_name || "",
      customer_email: lead.user_email || "",
      customer_phone: lead.user_phone || "",
      car_make: lead.car_make || "",
      car_model: lead.car_model || "",
      car_year: lead.car_year || "",
      car_variant: lead.car_variant || "",
      fuel_type: lead.fuel_type || "",
      odometer: lead.odometer || "",
      service_type: lead.service_type || "",
      agreed_price: lead.mechanic_offer_price || lead.app_fair_price_average || "",
    }));
  };

  const handleSave = async () => {
    if (!form.service_type || !form.booking_date) { toast.error("Service type and date are required."); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        booking_date: new Date(form.booking_date).toISOString(),
        odometer: form.odometer ? Number(form.odometer) : undefined,
        agreed_price: form.agreed_price ? Number(form.agreed_price) : undefined,
        estimated_duration_hours: Number(form.estimated_duration_hours),
      };
      let saved;
      if (isEdit) {
        await base44.entities.MechanicBooking.update(booking.id, payload);
        saved = { ...booking, ...payload };
      } else {
        saved = await base44.entities.MechanicBooking.create(payload);
      }
      toast.success(isEdit ? "Booking updated!" : "Booking created!");
      onSaved(saved);
    } catch {
      toast.error("Failed to save booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card w-full max-w-lg rounded-t-2xl flex flex-col" style={{ height: "calc(100dvh - 72px)", maxHeight: "calc(100dvh - 72px)" }}>
        <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm">{isEdit ? "Edit Booking" : "New Booking"}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6">
          {/* Prefill from lead */}
          {!isEdit && claimedLeads.length > 0 && (
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-3 space-y-2">
              <p className="text-xs font-bold text-accent">⚡ Prefill from a claimed lead</p>
              <select
                value={form.lead_id}
                onChange={e => handleLeadPrefill(e.target.value)}
                className="w-full h-9 rounded-lg bg-secondary border border-border px-3 text-xs focus:outline-none"
              >
                <option value="">— Select a lead to prefill —</option>
                {claimedLeads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.car_year} {l.car_make} {l.car_model} — {l.service_type} ({l.user_full_name || l.user_email || "Customer"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Date *</label>
              <input type="date" value={form.booking_date} onChange={e => update("booking_date", e.target.value)}
                className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Time</label>
              <input type="time" value={form.booking_time} onChange={e => update("booking_time", e.target.value)}
                className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Customer Name</label>
            <input value={form.customer_name} onChange={e => update("customer_name", e.target.value)} placeholder="Full name"
              className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Phone</label>
              <input value={form.customer_phone} onChange={e => update("customer_phone", e.target.value)} placeholder="0400 000 000"
                className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <input value={form.customer_email} onChange={e => update("customer_email", e.target.value)} placeholder="email@example.com"
                className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          {/* Vehicle */}
          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-accent" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Vehicle Details</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Make</label>
                <input value={form.car_make} onChange={e => update("car_make", e.target.value)} placeholder="Toyota"
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Model</label>
                <input value={form.car_model} onChange={e => update("car_model", e.target.value)} placeholder="Corolla"
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Year</label>
                <input value={form.car_year} onChange={e => update("car_year", e.target.value)} placeholder="2019"
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Odometer (km)</label>
                <input type="number" value={form.odometer} onChange={e => update("odometer", e.target.value)} placeholder="85000"
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Fuel Type</label>
                <select value={form.fuel_type} onChange={e => update("fuel_type", e.target.value)}
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select...</option>
                  {["Petrol","Diesel","Electric","Hybrid","PHEV","LPG"].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Job */}
          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-accent" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Job Details</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Service Type *</label>
              <input value={form.service_type} onChange={e => update("service_type", e.target.value)} placeholder="e.g. Logbook Service, Brake Replacement"
                className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Agreed Price (AUD)</label>
                <input type="number" value={form.agreed_price} onChange={e => update("agreed_price", e.target.value)} placeholder="350"
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Est. Duration (hrs)</label>
                <input type="number" min="0.5" max="24" step="0.5" value={form.estimated_duration_hours} onChange={e => update("estimated_duration_hours", e.target.value)}
                  className="w-full h-10 rounded-lg bg-secondary/50 border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Notes / Instructions</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} placeholder="Any special instructions or notes..."
                className="w-full rounded-lg bg-secondary/50 border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 font-heading font-bold bg-accent text-white hover:bg-accent/90 mt-2">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : isEdit ? "Update Booking" : "Create Booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}