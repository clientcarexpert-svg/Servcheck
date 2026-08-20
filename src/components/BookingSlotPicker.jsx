import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, addDays, startOfToday, isBefore, parseISO, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarCheck, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TIME_SLOTS = [
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "1:00 PM", value: "13:00" },
  { label: "2:00 PM", value: "14:00" },
  { label: "3:00 PM", value: "15:00" },
  { label: "4:00 PM", value: "16:00" },
  { label: "5:00 PM", value: "17:00" },
];

function buildWeek(startDay) {
  return Array.from({ length: 7 }, (_, i) => addDays(startDay, i));
}

export default function BookingSlotPicker({ profile, quoteRequest, onInsert, onClose }) {
  const today = startOfToday();
  const [weekStart, setWeekStart] = useState(today);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [saving, setSaving] = useState(false);

  const week = buildWeek(weekStart);

  // Load all upcoming bookings for this mechanic
  useEffect(() => {
    if (!profile?.id) return;
    base44.entities.MechanicBooking.filter(
      { mechanic_profile_id: profile.id },
      "-booking_date",
      200
    ).then(data => {
      setBookings(data.filter(b => b.status !== "cancelled"));
    }).finally(() => setLoadingBookings(false));
  }, [profile?.id]);

  // Get booked time values for a given day
  const getBookedTimesForDay = (day) =>
    bookings
      .filter(b => b.booking_date && isSameDay(parseISO(b.booking_date), day))
      .map(b => b.booking_time);

  const bookedTimesForSelected = selectedDate ? getBookedTimesForDay(selectedDate) : [];

  const hasDayBookings = (day) => getBookedTimesForDay(day).length > 0;

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    try {
      const dateISO = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      ).toISOString();

      const slot = TIME_SLOTS.find(t => t.value === selectedTime);
      const dateStr = format(selectedDate, "EEEE d MMMM yyyy");
      const timeStr = slot?.label || selectedTime;

      // Create a real booking record
      await base44.entities.MechanicBooking.create({
        mechanic_profile_id: profile.id,
        mechanic_email: profile.user_email || "",
        booking_date: dateISO,
        booking_time: selectedTime,
        status: "scheduled",
        service_type: quoteRequest?.service_type || "Service",
        customer_name: quoteRequest?.customer_name || "",
        customer_email: quoteRequest?.user_email || "",
        customer_phone: quoteRequest?.customer_phone || "",
        car_make: quoteRequest?.car_make || "",
        car_model: quoteRequest?.car_model || "",
        car_year: quoteRequest?.car_year || "",
        suburb: quoteRequest?.suburb || profile.suburb || "",
        state: quoteRequest?.state || profile.state || "",
        notes: "Proposed via chat — awaiting customer confirmation",
      });

      toast.success("Booking added to your calendar!");
      onInsert(`📅 Proposed booking: ${dateStr} at ${timeStr}. Please confirm if this works for you.`);
    } catch {
      toast.error("Failed to save booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-[#f97316]" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Offer a Booking Slot</p>
        </div>
        <button onClick={onClose} className="h-7 w-7 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
          <X className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {loadingBookings ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Week navigation */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => { setWeekStart(d => addDays(d, -7)); setSelectedDate(null); setSelectedTime(null); }}
                disabled={isBefore(addDays(weekStart, -1), today)}
                className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <p className="text-xs font-bold text-slate-600">
                {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
              </p>
              <button
                onClick={() => { setWeekStart(d => addDays(d, 7)); setSelectedDate(null); setSelectedTime(null); }}
                className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            {/* Day picker */}
            <div className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const isPast = isBefore(day, today);
                const isSelected = selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                const hasBooking = hasDayBookings(day);
                return (
                  <button
                    key={day.toISOString()}
                    disabled={isPast}
                    onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                    className={`flex flex-col items-center py-2 rounded-xl transition-all text-xs font-bold relative
                      ${isPast ? "opacity-30 cursor-not-allowed" : ""}
                      ${isSelected ? "bg-[#1a237e] text-white" : "hover:bg-slate-100 text-slate-700"}
                    `}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-widest mb-1 opacity-70">
                      {format(day, "EEE")}
                    </span>
                    <span className="text-sm">{format(day, "d")}</span>
                    {hasBooking && !isPast && (
                      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time slot picker */}
            {selectedDate && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                  Pick a time — {format(selectedDate, "EEE d MMM")}
                </p>
                {bookedTimesForSelected.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    You have {bookedTimesForSelected.length} booking{bookedTimesForSelected.length > 1 ? "s" : ""} on this day
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1.5">
                  {TIME_SLOTS.map((t) => {
                    const isBooked = bookedTimesForSelected.includes(t.value);
                    const isSelected = selectedTime === t.value;
                    return (
                      <button
                        key={t.value}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(t.value)}
                        className={`h-9 rounded-xl text-xs font-bold border transition-all relative
                          ${isBooked
                            ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-[#f97316] text-white border-[#f97316]"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-[#f97316]/50"
                          }`}
                      >
                        {t.label}
                        {isBooked && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-[6px] text-white font-black">✓</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Confirm button */}
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || saving}
              className="w-full h-11 bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-sm rounded-xl gap-2 disabled:opacity-40"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Booking...</>
              ) : selectedDate && selectedTime ? (
                <><CalendarCheck className="h-4 w-4" /> Book {format(selectedDate, "EEE d MMM")} at {TIME_SLOTS.find(t => t.value === selectedTime)?.label}</>
              ) : (
                "Select a date & time above"
              )}
            </Button>

            <p className="text-[10px] text-center text-slate-400">This adds the slot to your calendar and sends the proposed time to the customer.</p>
          </>
        )}
      </div>
    </div>
  );
}