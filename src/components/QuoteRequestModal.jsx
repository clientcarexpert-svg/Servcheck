import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Send, Loader2, ChevronRight, ChevronLeft, Car, Wrench, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CAR_MAKES = ["Toyota","Mazda","Honda","Hyundai","Kia","Ford","Mitsubishi","Subaru","Nissan","Volkswagen","BMW","Mercedes-Benz","Audi","Holden","Jeep","Isuzu","Suzuki","Lexus","Volvo","Peugeot","Renault","Fiat","Land Rover","Porsche","Tesla","Other"];
const YEARS = Array.from({ length: 35 }, (_, i) => String(new Date().getFullYear() - i));
const SERVICES = [
  "Minor Logbook Service","Major Logbook Service","Oil & Filter Change","Brake Pads (Front)","Brake Pads (Rear)","Brake Rotors","Tyre Rotation","Wheel Alignment","Battery Replacement","Timing Belt / Chain","Clutch Replacement","Air Conditioning Service","Transmission Service","Coolant Flush","Spark Plugs","Suspension Check","Pre-Purchase Inspection","General Inspection & Repair","Other",
];

export default function QuoteRequestModal({ preselectedMechanic, onClose }) {
  const [step, setStep] = useState(1); // 1 = car info, 2 = message
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carYear, setCarYear] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const step1Valid = carMake && carModel.trim() && carYear && serviceType;
  const step2Valid = message.trim().length >= 10;

  const handleSend = async () => {
    if (!step2Valid) return;
    setSending(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        toast.error("Please log in to send a request.");
        setSending(false);
        return;
      }

      const m = preselectedMechanic;

      await base44.functions.invoke("sendQuoteRequest", {
        mechanic_profile_id: m.id,
        mechanic_business_name: m.business_name,
        car_make: carMake,
        car_model: carModel,
        car_year: carYear,
        service_type: serviceType,
        state: m.state,
        suburb: m.suburb,
        notes: message,
      });

      setSent(true);
      toast.success(`Message sent to ${m.business_name}!`);
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base">Ask {preselectedMechanic.business_name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {preselectedMechanic.suburb}, {preselectedMechanic.state} · {preselectedMechanic.mechanic_type === "mobile_mechanic" ? "Mobile Mechanic" : "Workshop"}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-5 pt-4 gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`flex items-center gap-2 flex-1 ${s < 2 ? "" : ""}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${step >= s ? "bg-accent text-white" : "bg-secondary text-muted-foreground"}`}>
                {s === 1 ? <Car className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-xs font-semibold ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Your Car" : "Your Message"}
              </span>
              {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? "bg-accent" : "bg-secondary"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              {step === 1 && (
                <div className="px-5 py-5 space-y-3">
                  <p className="text-xs text-muted-foreground mb-1">Tell the mechanic about your vehicle</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Make *</p>
                      <Select value={carMake} onValueChange={setCarMake}>
                        <SelectTrigger className="h-11 bg-secondary/50 border-0">
                          <SelectValue placeholder="Toyota" />
                        </SelectTrigger>
                        <SelectContent className="z-[400]">
                          {CAR_MAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">Year *</p>
                      <Select value={carYear} onValueChange={setCarYear}>
                        <SelectTrigger className="h-11 bg-secondary/50 border-0">
                          <SelectValue placeholder="2020" />
                        </SelectTrigger>
                        <SelectContent className="z-[400]">
                          {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Model *</p>
                    <Input
                      value={carModel}
                      onChange={e => setCarModel(e.target.value)}
                      placeholder="e.g. Corolla, Ranger, Civic"
                      className="h-11 bg-secondary/50 border-0"
                    />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Service needed *</p>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger className="h-11 bg-secondary/50 border-0">
                        <SelectValue placeholder="Select service…" />
                      </SelectTrigger>
                      <SelectContent className="z-[400]">
                        {SERVICES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!step1Valid}
                    className="w-full h-11 bg-accent text-white hover:bg-accent/90 gap-2 mt-2"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="px-5 py-5 space-y-3">
                  <div className="rounded-xl bg-secondary/50 px-4 py-3 flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold">{carYear} {carMake} {carModel}</span>
                    <span className="text-muted-foreground">· {serviceType}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Describe what you need *</p>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="e.g. My brakes are making a grinding noise, can you give me a price? I'm in Parramatta and need it done this week."
                      rows={5}
                      className="w-full rounded-xl bg-secondary/50 border-0 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {message.trim().length > 0 && message.trim().length < 10 && (
                      <p className="text-[11px] text-right text-muted-foreground">
                        {10 - message.trim().length} more characters needed
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="h-11 px-4 gap-1">
                      <ChevronLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={!step2Valid || sending}
                      className="flex-1 h-11 bg-accent text-white hover:bg-accent/90 gap-2"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Message</>}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 py-10 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <Send className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="font-heading font-bold text-lg">Message Sent!</p>
              <p className="text-sm text-muted-foreground">
                {preselectedMechanic.business_name} will see your message and reply in the <strong>Messages</strong> tab.
              </p>
              <Button onClick={onClose} className="w-full h-11 bg-accent text-white hover:bg-accent/90 mt-2">
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}