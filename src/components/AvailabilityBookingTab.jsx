import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";
import { toast } from "sonner";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AvailabilityBookingTab({ profile, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [acceptingBookings, setAcceptingBookings] = useState(profile?.accepting_bookings !== false);
  const [unavailableUntil, setUnavailableUntil] = useState(profile?.unavailable_until ? new Date(profile.unavailable_until).toISOString().split('T')[0] : '');
  const [turnaroundDays, setTurnaroundDays] = useState(profile?.estimated_turnaround_days || 0);
  const [timeSlots, setTimeSlots] = useState(profile?.available_time_slots || []);

  // Sync state only when profile ID changes (initial load)
  useEffect(() => {
    if (profile?.id) {
      setAcceptingBookings(profile?.accepting_bookings !== false);
      setUnavailableUntil(profile?.unavailable_until ? new Date(profile.unavailable_until).toISOString().split('T')[0] : '');
      setTurnaroundDays(profile?.estimated_turnaround_days || 0);
      setTimeSlots(profile?.available_time_slots || []);
    }
  }, [profile?.id]);

  const updateSlot = (day, field, value) => {
    const existing = timeSlots.find(s => s.day === day);
    if (existing) {
      setTimeSlots(timeSlots.map(s => s.day === day ? { ...s, [field]: value } : s));
    } else {
      // Create new slot with both times set
      const newSlot = { day, start_time: '08:00', end_time: '17:00' };
      newSlot[field] = value;
      setTimeSlots([...timeSlots, newSlot]);
    }
  };

  const removeSlot = (day) => {
    setTimeSlots(timeSlots.filter(s => s.day !== day));
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('updateMechanicAvailability', {
        profileId: profile.id,
        acceptingBookings,
        unavailableUntil,
        turnaroundDays,
        timeSlots,
      });

      if (response.data?.success) {
        setTimeSlots(response.data.timeSlots || timeSlots);
        setSaved(true);
        toast.success("Availability saved.");
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(response.data?.error || "Failed to save.");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Save failed: ${err?.response?.data?.error || err?.message || 'unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = 
    acceptingBookings !== (profile?.accepting_bookings !== false) ||
    unavailableUntil !== (profile?.unavailable_until ? new Date(profile.unavailable_until).toISOString().split('T')[0] : '') ||
    turnaroundDays !== (profile?.estimated_turnaround_days || 0) ||
    JSON.stringify(timeSlots) !== JSON.stringify(profile?.available_time_slots || []);

  return (
    <div className="space-y-6 pb-8">
      {/* Booked out — pause leads toggle */}
      <div className={`rounded-xl border-2 p-4 ${acceptingBookings ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {acceptingBookings ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <PauseCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${acceptingBookings ? 'text-emerald-900' : 'text-amber-900'}`}>
                {acceptingBookings ? 'Accepting Leads' : 'Booked Out — Leads Paused'}
              </p>
              <p className={`text-xs mt-0.5 ${acceptingBookings ? 'text-emerald-700' : 'text-amber-700'}`}>
                {acceptingBookings
                  ? "You're visible to customers and will receive new leads"
                  : 'New leads are hidden until you resume — your subscription, profile and stats stay active'}
              </p>
            </div>
          </div>
          <Switch
            checked={acceptingBookings}
            onCheckedChange={setAcceptingBookings}
            aria-label="Accepting bookings"
          />
        </div>
        {!acceptingBookings && (
          <p className="text-xs text-amber-700 mt-3 pt-3 border-t border-amber-200">
            💡 Set a <strong>Fully Booked Until</strong> date below and we'll automatically resume your leads on that day.
          </p>
        )}
      </div>

      {/* Fully booked until */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-bold text-base">Fully Booked Until</h3>
        </div>
        <p className="text-xs text-muted-foreground">Set a date when you're fully booked. If leads are paused, they automatically resume on this date.</p>
        <input
          type="date"
          value={unavailableUntil}
          onChange={e => setUnavailableUntil(e.target.value)}
          className="w-full h-12 rounded-lg bg-secondary/50 border-2 border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {unavailableUntil && (
          <p className="text-xs text-muted-foreground">
            Available again: <strong>{new Date(unavailableUntil).toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </p>
        )}
      </div>

      {/* Turnaround days */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-bold text-base">Estimated Turnaround (days)</h3>
        </div>
        <p className="text-xs text-muted-foreground">How many days typically pass before you can start a new job?</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="60"
            value={turnaroundDays}
            onChange={e => setTurnaroundDays(Number(e.target.value))}
            className="flex-1 h-12 rounded-lg bg-secondary/50 border-2 border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-sm font-semibold text-muted-foreground min-w-fit">{turnaroundDays} day{turnaroundDays !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Weekly time slots */}
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-base">Weekly Operating Hours</h3>
        <p className="text-xs text-muted-foreground">Set your working hours for each day. Leave a day empty to mark it as closed.</p>
        
        <div className="grid grid-cols-1 gap-3">
          {DAYS.map(day => {
            const slot = timeSlots.find(s => s.day === day);
            return (
              <div key={day} className="rounded-xl border-2 border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-sm">{day}</p>
                  {slot && (
                    <button
                      onClick={() => removeSlot(day)}
                      className="text-xs px-3 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={slot?.start_time || '08:00'}
                    onChange={e => updateSlot(day, 'start_time', e.target.value)}
                    className="flex-1 h-10 rounded-lg bg-secondary/50 border-2 border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-sm font-semibold text-muted-foreground">—</span>
                  <input
                    type="time"
                    value={slot?.end_time || '17:00'}
                    onChange={e => updateSlot(day, 'end_time', e.target.value)}
                    className="flex-1 h-10 rounded-lg bg-secondary/50 border-2 border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {!slot && (
                  <p className="text-xs text-muted-foreground mt-2">Closed</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setAcceptingBookings(profile?.accepting_bookings !== false);
            setUnavailableUntil(profile?.unavailable_until ? new Date(profile.unavailable_until).toISOString().split('T')[0] : '');
            setTurnaroundDays(profile?.estimated_turnaround_days || 0);
            setTimeSlots(profile?.available_time_slots || []);
          }}
          disabled={!hasChanges || loading}
          className="flex-1 h-12 text-sm font-bold"
        >
          Discard Changes
        </Button>
        <Button
          onClick={saveChanges}
          disabled={!hasChanges || loading}
          className="flex-1 h-12 text-sm font-bold bg-primary text-white hover:bg-primary/90"
        >
          {loading ? 'Saving...' : saved ? 'Saved ✓' : 'Save Availability'}
        </Button>
      </div>
    </div>
  );
}