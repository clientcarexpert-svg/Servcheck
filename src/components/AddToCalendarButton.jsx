import { CalendarPlus } from "lucide-react";

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export default function AddToCalendarButton({ booking }) {
  if (!booking?.booking_date) return null;

  const handleAdd = () => {
    const datePart = booking.booking_date.split("T")[0];
    const time = booking.booking_time || "09:00";
    const start = new Date(`${datePart}T${time}:00`);
    const durationHrs = Number(booking.estimated_duration_hours) || 1;
    const end = new Date(start.getTime() + durationHrs * 60 * 60 * 1000);

    const car = [booking.car_year, booking.car_make, booking.car_model].filter(Boolean).join(" ");
    const title = `${booking.service_type || "Job"}${car ? ` — ${car}` : ""}`;
    const descLines = [
      booking.customer_name && `Customer: ${booking.customer_name}`,
      booking.customer_phone && `Phone: ${booking.customer_phone}`,
      booking.customer_email && `Email: ${booking.customer_email}`,
      booking.agreed_price > 0 && `Agreed price: $${booking.agreed_price}`,
      booking.notes && `Notes: ${booking.notes}`,
      "Booked via ServCheck",
    ].filter(Boolean);
    const location = [booking.suburb, booking.state].filter(Boolean).join(", ");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//ServCheck//Booking//EN",
      "BEGIN:VEVENT",
      `UID:servcheck-booking-${booking.id}`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${title.replace(/[,;]/g, " ")}`,
      `DESCRIPTION:${descLines.join("\\n").replace(/[,;]/g, " ")}`,
      location ? `LOCATION:${location.replace(/[,;]/g, " ")}` : null,
      "END:VEVENT",
      "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "servcheck-booking.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleAdd}
      className="w-full h-8 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/70 transition-colors flex items-center justify-center gap-1.5"
    >
      <CalendarPlus className="h-3.5 w-3.5" /> Add to Calendar
    </button>
  );
}