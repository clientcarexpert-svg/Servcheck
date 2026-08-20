import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Car, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAR_MAKES } from "@/lib/carData";

export const SYMPTOM_CATEGORIES = [
  { id: "wont_start", label: "🔑 Car won't start", icon: "🔑" },
  { id: "warning_lights", label: "🚨 Warning lights on", icon: "🚨" },
  { id: "strange_noises", label: "🔊 Strange noises", icon: "🔊" },
  { id: "slow_weak", label: "⚡ Feels slow or weak", icon: "⚡" },
  { id: "vibrating", label: "〰️ Vibrating or shaking", icon: "〰️" },
  { id: "brakes", label: "🛑 Brakes not working properly", icon: "🛑" },
  { id: "smell_leak", label: "💧 Smell or leak", icon: "💧" },
  { id: "electrical", label: "🔌 Electrical issue", icon: "🔌" },
  { id: "something_else", label: "❓ Something else", icon: "❓" },
];

// ── Adaptive question tree ───────────────────────────────────────────────────
// Each question can have a `showIf: (answers) => boolean` to gate visibility.
// Questions are shown one at a time in order, filtered by showIf.

const SYMPTOM_QUESTIONS = {

  // ── Car won't start ──────────────────────────────────────────────────────
  wont_start: [
    {
      id: "what_happens",
      label: "When you turn the key / press start, what happens?",
      type: "radio",
      options: ["Completely silent — nothing", "Just a click (one or repeated)", "Cranks slowly but won't fire", "Cranks fine but won't start", "Sometimes starts, sometimes not"],
    },
    // Branch A: Silent / Click → likely battery or starter
    {
      id: "battery_signs",
      label: "Before this happened, did you notice any of these signs?",
      type: "checkbox",
      options: ["Lights were dim or flickering", "Battery light was on", "Needed a jump start recently", "Radio or clock reset itself", "None of these"],
      showIf: a => ["Completely silent — nothing", "Just a click (one or repeated)"].includes(a.what_happens),
    },
    {
      id: "jump_start_result",
      label: "Did it start with a jump start?",
      type: "radio",
      options: ["Yes, started straight away", "Started briefly then died again", "No, still nothing", "Haven't tried"],
      showIf: a => ["Completely silent — nothing", "Just a click (one or repeated)"].includes(a.what_happens),
    },
    {
      id: "battery_age",
      label: "How old is the battery?",
      type: "radio",
      options: ["Less than 1 year", "1–3 years", "3–5 years", "Over 5 years", "Not sure"],
      showIf: a => ["Yes, started straight away", "Started briefly then died again"].includes(a.jump_start_result),
    },
    // Branch B: Cranks but won't fire → fuel / ignition
    {
      id: "fuel_level",
      label: "Is there enough fuel in the tank?",
      type: "radio",
      options: ["Yes, plenty", "Low but should be enough", "Almost empty", "Not sure"],
      showIf: a => ["Cranks slowly but won't fire", "Cranks fine but won't start"].includes(a.what_happens),
    },
    {
      id: "smell_fuel",
      label: "Do you smell fuel strongly when you try to start it?",
      type: "radio",
      options: ["Yes, strong fuel smell", "No smell", "Not sure"],
      showIf: a => ["Cranks slowly but won't fire", "Cranks fine but won't start"].includes(a.what_happens),
    },
    {
      id: "recent_fuel",
      label: "Did you just refuel before this happened?",
      type: "radio",
      options: ["Yes, just filled up", "No, was fine after last fill", "Not sure"],
      showIf: a => ["Cranks slowly but won't fire", "Cranks fine but won't start"].includes(a.what_happens),
    },
    // Branch C: Intermittent
    {
      id: "intermittent_trigger",
      label: "When is it most likely to not start?",
      type: "radio",
      options: ["First thing in the morning", "After it's been sitting a long time", "When it's been running already (hot)", "In cold or wet weather", "Random, no pattern"],
      showIf: a => a.what_happens === "Sometimes starts, sometimes not",
    },
    // Shared
    {
      id: "warning_lights_shown",
      label: "Are any warning lights on the dashboard?",
      type: "checkbox",
      options: ["Engine light", "Battery light", "Oil light", "No lights on", "Not sure"],
    },
    {
      id: "recent_work",
      label: "Was any work done on the car recently?",
      type: "radio",
      options: ["Yes, serviced or repaired recently", "No, nothing recent", "Not sure"],
    },
    {
      id: "notes", label: "Anything else to add?", type: "text",
    },
  ],

  // ── Warning lights ───────────────────────────────────────────────────────
  warning_lights: [
    {
      id: "which_lights",
      label: "Which warning lights are on? (select all)",
      type: "checkbox",
      options: ["Engine / Check Engine", "Oil pressure", "Battery", "Brake / ABS", "Tyre pressure (TPMS)", "Temperature (overheating)", "Airbag / SRS", "Transmission", "Not sure"],
    },
    // Engine light branch
    {
      id: "engine_light_state",
      label: "Is the engine light blinking/flashing or just on solid?",
      type: "radio",
      options: ["Flashing / blinking", "On solid", "Comes and goes", "Not sure"],
      showIf: a => (a.which_lights || []).includes("Engine / Check Engine"),
    },
    {
      id: "engine_driving_change",
      label: "Has the car's behaviour changed since the engine light came on?",
      type: "radio",
      options: ["Yes — feels rough or different", "A little — hard to tell", "No — drives the same as usual"],
      showIf: a => (a.which_lights || []).includes("Engine / Check Engine"),
    },
    // Oil pressure branch
    {
      id: "oil_level",
      label: "When did you last check the oil level?",
      type: "radio",
      options: ["Recently — it was fine", "Recently — it was low", "A long time ago", "Never checked"],
      showIf: a => (a.which_lights || []).includes("Oil pressure"),
    },
    {
      id: "oil_consumption",
      label: "Does the car seem to use more oil than usual?",
      type: "radio",
      options: ["Yes, noticeably", "No", "Not sure"],
      showIf: a => (a.which_lights || []).includes("Oil pressure"),
    },
    // Temperature / overheating
    {
      id: "temp_gauge",
      label: "Where is the temperature gauge sitting?",
      type: "radio",
      options: ["In the red / very high", "Higher than normal", "Normal", "Not sure"],
      showIf: a => (a.which_lights || []).includes("Temperature (overheating)"),
    },
    {
      id: "coolant_level",
      label: "Have you checked the coolant / water level?",
      type: "radio",
      options: ["Yes — it's low", "Yes — it looks fine", "No, haven't checked", "Not sure"],
      showIf: a => (a.which_lights || []).includes("Temperature (overheating)"),
    },
    // Brake / ABS
    {
      id: "brake_pedal_feel",
      label: "How does the brake pedal feel?",
      type: "radio",
      options: ["Normal", "Soft or spongy", "Goes to the floor", "Vibrates when braking", "Not sure"],
      showIf: a => (a.which_lights || []).includes("Brake / ABS"),
    },
    // Shared
    {
      id: "when_lights",
      label: "When do the lights appear?",
      type: "radio",
      options: ["Only when I start the car (then go off)", "While driving", "All the time", "Randomly"],
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Strange noises ───────────────────────────────────────────────────────
  strange_noises: [
    {
      id: "noise_type",
      label: "What type of noise is it?",
      type: "radio",
      options: ["Grinding", "Knocking / thumping", "Squealing / screeching", "Clicking", "Whining / humming", "Rattling"],
    },
    {
      id: "noise_location",
      label: "Where does the noise seem to come from?",
      type: "radio",
      options: ["Front of car", "Back of car", "Underneath in the middle", "Engine bay", "One specific wheel / corner", "Not sure"],
    },
    // Grinding — likely brakes or wheel bearing
    {
      id: "grinding_when",
      label: "When does the grinding happen?",
      type: "checkbox",
      options: ["When braking", "When driving at speed", "When turning", "Even when just rolling slowly", "All the time"],
      showIf: a => a.noise_type === "Grinding",
    },
    {
      id: "grinding_turning",
      label: "Does it get louder or worse when you turn the steering wheel?",
      type: "radio",
      options: ["Yes, worse turning left", "Yes, worse turning right", "Yes, both directions", "No, same regardless"],
      showIf: a => a.noise_type === "Grinding",
    },
    // Knocking — likely engine or suspension
    {
      id: "knocking_when",
      label: "When does the knocking occur?",
      type: "radio",
      options: ["Mainly at idle (car stationary)", "When accelerating", "Over bumps only", "Constantly while driving", "When starting cold"],
      showIf: a => a.noise_type === "Knocking / thumping",
    },
    {
      id: "knocking_engine_speed",
      label: "Does it get faster as you rev the engine?",
      type: "radio",
      options: ["Yes, keeps up with engine revs", "No, stays the same", "Not sure"],
      showIf: a => a.noise_type === "Knocking / thumping",
    },
    // Squealing — brakes or belt
    {
      id: "squeal_when",
      label: "When does the squealing happen?",
      type: "radio",
      options: ["When I apply the brakes", "When I release the brakes", "When starting cold (then fades)", "Constantly while driving", "When turning"],
      showIf: a => a.noise_type === "Squealing / screeching",
    },
    // Clicking — CV joint or lifters
    {
      id: "click_when",
      label: "When does the clicking happen?",
      type: "radio",
      options: ["Mainly when turning (especially sharply)", "When accelerating from a stop", "At idle only", "Constantly while driving"],
      showIf: a => a.noise_type === "Clicking",
    },
    // Whining
    {
      id: "whine_when",
      label: "When does the whining / humming occur?",
      type: "radio",
      options: ["Gets louder as I speed up", "Only at certain speeds (then fades)", "When turning", "When in gear but not moving", "Constantly"],
      showIf: a => a.noise_type === "Whining / humming",
    },
    // Shared
    {
      id: "noise_duration",
      label: "How long has this noise been happening?",
      type: "radio",
      options: ["Just started today", "A few days", "A couple of weeks", "More than a month", "On and off for a while"],
    },
    {
      id: "noise_trend",
      label: "Is it getting worse over time?",
      type: "radio",
      options: ["Yes, noticeably worse", "Slightly worse", "About the same", "Comes and goes"],
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Slow / weak ──────────────────────────────────────────────────────────
  slow_weak: [
    {
      id: "when_slow",
      label: "When do you notice the lack of power?",
      type: "checkbox",
      options: ["Pulling away from a stop", "Accelerating at highway speed", "Going uphill", "All the time", "Randomly"],
    },
    {
      id: "how_severe",
      label: "How bad is it?",
      type: "radio",
      options: ["Slightly sluggish — noticeable but manageable", "Clearly underpowered compared to normal", "Barely moves — serious power loss"],
    },
    {
      id: "jerky",
      label: "Does the engine feel rough, jerky, or misfire (stuttering)?",
      type: "radio",
      options: ["Yes, it judders or misfires", "No, it's smooth just slow", "Not sure"],
    },
    {
      id: "misfire_rpm",
      label: "Does the misfiring/juddering happen at a particular point?",
      type: "radio",
      options: ["Mainly at idle", "When accelerating lightly", "Under hard acceleration", "Throughout all RPMs"],
      showIf: a => a.jerky === "Yes, it judders or misfires",
    },
    {
      id: "smoke",
      label: "Have you noticed any unusual smoke from the exhaust?",
      type: "radio",
      options: ["Black smoke", "White smoke", "Blue / grey smoke", "No smoke", "Not sure"],
    },
    {
      id: "warm_up",
      label: "Is it worse when the engine is cold and better once warmed up?",
      type: "radio",
      options: ["Yes, much better when warm", "Slightly better when warm", "No difference", "Actually worse when warm"],
    },
    {
      id: "fuel_economy",
      label: "Have you noticed worse fuel economy recently?",
      type: "radio",
      options: ["Yes, noticeably more fuel use", "About the same", "Not sure"],
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Vibrating ────────────────────────────────────────────────────────────
  vibrating: [
    {
      id: "when_vibrate",
      label: "When does it vibrate or shake?",
      type: "checkbox",
      options: ["While parked / idling", "At low speed (under 60 km/h)", "At highway speed (60–100+ km/h)", "When braking", "When accelerating", "Through the whole drive"],
    },
    {
      id: "speed_range",
      label: "Is there a specific speed where it's worst?",
      type: "radio",
      options: ["Under 40 km/h", "Around 60–80 km/h", "80–100 km/h", "Over 100 km/h", "No particular speed — all the time"],
      showIf: a => (a.when_vibrate || []).some(w => ["At low speed (under 60 km/h)", "At highway speed (60–100+ km/h)"].includes(w)),
    },
    {
      id: "where_feel",
      label: "Where do you feel the vibration most?",
      type: "radio",
      options: ["Steering wheel", "Seat / backside", "Pedals / floor", "Whole car", "Not sure"],
    },
    // Steering wheel vibration → likely wheel balance or front suspension
    {
      id: "steering_pull",
      label: "Does the car pull to one side while driving?",
      type: "radio",
      options: ["Yes, pulls left", "Yes, pulls right", "No, drives straight"],
      showIf: a => a.where_feel === "Steering wheel",
    },
    // Brake vibration branch
    {
      id: "brake_vibrate_detail",
      label: "Does the vibration happen only when you press the brake pedal?",
      type: "radio",
      options: ["Yes, mostly when braking", "No, it's there even without braking", "Both"],
      showIf: a => (a.when_vibrate || []).includes("When braking"),
    },
    {
      id: "idle_vibrate_detail",
      label: "Is the idle vibration worse when you turn on the air conditioning?",
      type: "radio",
      options: ["Yes, noticeably worse with AC", "No difference", "Don't use AC / not sure"],
      showIf: a => (a.when_vibrate || []).includes("While parked / idling"),
    },
    {
      id: "tyre_history",
      label: "When were your tyres last rotated or balanced?",
      type: "radio",
      options: ["Recently (last 6 months)", "Over a year ago", "Never / not sure"],
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Brakes ───────────────────────────────────────────────────────────────
  brakes: [
    {
      id: "brake_main_issue",
      label: "What's the main issue with the brakes?",
      type: "radio",
      options: ["Takes longer to stop than normal", "Pedal feels soft or spongy", "Pedal goes almost to the floor", "Car pulls to one side when braking", "Grinding or squealing noise", "Shuddering / vibrating when braking"],
    },
    // Soft pedal → fluid / master cylinder
    {
      id: "fluid_leak_signs",
      label: "Have you noticed any fluid under the car near the wheels?",
      type: "radio",
      options: ["Yes, clear / light brown fluid", "No fluid seen", "Not sure"],
      showIf: a => ["Pedal feels soft or spongy", "Pedal goes almost to the floor"].includes(a.brake_main_issue),
    },
    {
      id: "brake_fluid_level",
      label: "Have you checked the brake fluid reservoir?",
      type: "radio",
      options: ["Yes — it's low", "Yes — looks fine", "No, haven't checked"],
      showIf: a => ["Pedal feels soft or spongy", "Pedal goes almost to the floor"].includes(a.brake_main_issue),
    },
    // Pulling → stuck caliper or pad wear
    {
      id: "pull_direction",
      label: "Which side does it pull to when you brake?",
      type: "radio",
      options: ["Pulls left", "Pulls right", "Varies"],
      showIf: a => a.brake_main_issue === "Car pulls to one side when braking",
    },
    {
      id: "pull_smell",
      label: "Do you notice a burning smell or see smoke from one wheel?",
      type: "radio",
      options: ["Yes", "No", "Not sure"],
      showIf: a => a.brake_main_issue === "Car pulls to one side when braking",
    },
    // Grinding → pads worn through
    {
      id: "grinding_when_braking",
      label: "When exactly does the grinding occur?",
      type: "radio",
      options: ["Only when I press the brake", "Even when rolling without braking", "Both"],
      showIf: a => a.brake_main_issue === "Grinding or squealing noise",
    },
    {
      id: "pad_history",
      label: "When were the brake pads last replaced?",
      type: "radio",
      options: ["Within the last year", "1–2 years ago", "More than 2 years ago", "Never replaced / not sure"],
    },
    {
      id: "brake_light",
      label: "Is a brake warning light showing on the dashboard?",
      type: "radio",
      options: ["Yes", "No", "Not sure"],
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Smell / leak ─────────────────────────────────────────────────────────
  smell_leak: [
    {
      id: "primary_issue",
      label: "What have you noticed first?",
      type: "radio",
      options: ["A strange smell", "A visible fluid leak", "Both smell and leak"],
    },
    {
      id: "smell_type",
      label: "What does the smell remind you of?",
      type: "radio",
      options: ["Sweet / syrupy", "Burning rubber", "Burning oil / hot metal", "Petrol / fuel", "Rotten eggs / sulphur", "Exhaust fumes inside the cabin", "No smell"],
      showIf: a => ["A strange smell", "Both smell and leak"].includes(a.primary_issue),
    },
    // Sweet smell → coolant
    {
      id: "temp_gauge_smell",
      label: "Is the temperature gauge higher than normal?",
      type: "radio",
      options: ["Yes, running hotter", "No, looks normal", "Not sure"],
      showIf: a => a.smell_type === "Sweet / syrupy",
    },
    // Burning oil → oil leak onto exhaust
    {
      id: "oil_on_ground",
      label: "Do you see dark oily spots where you park?",
      type: "radio",
      options: ["Yes, regular dark spots", "Occasionally", "No"],
      showIf: a => a.smell_type === "Burning oil / hot metal",
    },
    // Fuel smell → injector / fuel line
    {
      id: "fuel_smell_when",
      label: "When is the fuel smell strongest?",
      type: "radio",
      options: ["Right when I start the car", "While driving", "After I turn it off", "All the time"],
      showIf: a => a.smell_type === "Petrol / fuel",
    },
    // Exhaust inside cabin → CO risk
    {
      id: "headache",
      label: "Do you or passengers feel headaches, dizziness, or drowsiness while driving?",
      type: "radio",
      options: ["Yes", "No", "Not sure"],
      showIf: a => a.smell_type === "Exhaust fumes inside the cabin",
    },
    // Leak details
    {
      id: "fluid_colour",
      label: "What colour is the leaked fluid?",
      type: "radio",
      options: ["Clear / water-like", "Dark brown / black (oily)", "Red or pink", "Green, yellow or orange", "Blue", "Not sure"],
      showIf: a => ["A visible fluid leak", "Both smell and leak"].includes(a.primary_issue),
    },
    {
      id: "leak_location",
      label: "Where does the leak appear under the car?",
      type: "radio",
      options: ["Front of car (engine area)", "Middle of car", "Near a rear wheel", "Hard to tell exactly"],
      showIf: a => ["A visible fluid leak", "Both smell and leak"].includes(a.primary_issue),
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Electrical ───────────────────────────────────────────────────────────
  electrical: [
    {
      id: "what_broken",
      label: "What electrical issues are you experiencing? (select all)",
      type: "checkbox",
      options: ["Battery drains overnight or quickly", "Lights flicker or are dim", "Windows / sunroof don't work", "Central locking issues", "Infotainment / radio resets or won't work", "Air conditioning not working", "Car won't start (electrical)", "Other"],
    },
    // Battery drain → alternator or parasitic draw
    {
      id: "battery_drain_pattern",
      label: "How quickly does the battery go flat?",
      type: "radio",
      options: ["Overnight", "After a few days of not driving", "Within hours of starting", "Randomly"],
      showIf: a => (a.what_broken || []).includes("Battery drains overnight or quickly"),
    },
    {
      id: "alternator_signs",
      label: "When the car is running, do the lights dim when you rev or use electronics?",
      type: "radio",
      options: ["Yes, everything dims at idle", "Slightly", "No, all looks normal"],
      showIf: a => (a.what_broken || []).includes("Battery drains overnight or quickly"),
    },
    // Multiple gremlins → BCM or wiring
    {
      id: "multiple_issues",
      label: "Are multiple different systems failing at the same time?",
      type: "radio",
      options: ["Yes, multiple things acting up", "Just one thing", "Comes and goes"],
    },
    {
      id: "after_event",
      label: "Did anything happen before the electrical issues started?",
      type: "radio",
      options: ["After getting wet / flood / rain", "After a recent repair", "After jump starting another car", "After a fuse blew", "Nothing specific I can think of"],
    },
    {
      id: "battery_age",
      label: "How old is your car battery?",
      type: "radio",
      options: ["Less than 1 year", "1–3 years", "3–5 years", "Over 5 years", "Not sure"],
    },
    { id: "notes", label: "Anything else to add?", type: "text" },
  ],

  // ── Something else ───────────────────────────────────────────────────────
  something_else: [
    {
      id: "describe",
      label: "Describe the issue in your own words",
      type: "text",
    },
    {
      id: "when_occurs",
      label: "When does it happen?",
      type: "checkbox",
      options: ["When starting", "While driving normally", "When accelerating", "When braking / slowing down", "When turning", "Randomly with no clear pattern", "All the time"],
    },
    {
      id: "affects_driving",
      label: "Does it affect your ability to drive safely?",
      type: "radio",
      options: ["Yes — it feels unsafe", "Not yet, but I'm concerned", "No — just an annoyance"],
    },
    {
      id: "getting_worse",
      label: "Is it getting worse over time?",
      type: "radio",
      options: ["Yes, getting worse", "About the same", "Comes and goes", "Not sure"],
    },
    { id: "notes", label: "Any other details that might help?", type: "text" },
  ],
};

const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "Not sure"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "Not sure"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => String(CURRENT_YEAR - i));

// ── Evaluate which questions to show based on current answers ───────────────
function getVisibleQuestions(symptomId, answers) {
  const all = SYMPTOM_QUESTIONS[symptomId] || [];
  return all.filter(q => !q.showIf || q.showIf(answers));
}

// ── Small reusable field components ────────────────────────────────────────
function RadioGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt === value ? "" : opt)}
          className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all text-left ${
            value === opt
              ? "bg-[#0B1120] border-[#0B1120] text-white"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, value = [], onChange }) {
  const toggle = (opt) => {
    const next = value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all text-left ${
            value.includes(opt)
              ? "bg-[#f97316] border-[#f97316] text-white"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Main Wizard ─────────────────────────────────────────────────────────────
export default function SymptomWizard({ onSubmit, loading }) {
  const [step, setStep] = useState(0); // 0=car, 1=symptoms, 2=symptom Qs, 3=final
  const [carDetails, setCarDetails] = useState({ car_make: "", car_model: "", car_year: "", fuel_type: "", transmission: "", odometer: "", state: "" });
  const [symptomsSelected, setSymptomsSelected] = useState([]);
  const [symptomAnswers, setSymptomAnswers] = useState({});
  const [currentSymptomIdx, setCurrentSymptomIdx] = useState(0);
  const [finalDetails, setFinalDetails] = useState({ recent_repairs: "", still_driving: "" });

  const updateCar = (k, v) => setCarDetails(p => ({ ...p, [k]: v }));
  const updateSymptomAnswer = (symptomId, qId, val) => {
    setSymptomAnswers(p => ({ ...p, [symptomId]: { ...(p[symptomId] || {}), [qId]: val } }));
  };

  const canProceedCar = carDetails.car_make && carDetails.car_model && carDetails.car_year;
  const canProceedSymptoms = symptomsSelected.length > 0;

  const progressPct = step === 0 ? 10 : step === 1 ? 25 : step === 2
    ? Math.round(25 + ((currentSymptomIdx + 1) / Math.max(symptomsSelected.length, 1)) * 55)
    : 92;

  const goNext = () => {
    if (step === 0) { setStep(1); return; }
    if (step === 1) { setStep(2); setCurrentSymptomIdx(0); return; }
    if (step === 2) {
      if (currentSymptomIdx < symptomsSelected.length - 1) {
        setCurrentSymptomIdx(i => i + 1);
      } else {
        setStep(3);
      }
      return;
    }
    if (step === 3) {
      // Prune answers to questions still visible — drops stale answers from
      // branches the user backed out of (e.g. changed a gating answer)
      const prunedAnswers = {};
      symptomsSelected.forEach(sid => {
        const answers = symptomAnswers[sid] || {};
        const visibleIds = getVisibleQuestions(sid, answers).map(q => q.id);
        prunedAnswers[sid] = Object.fromEntries(
          Object.entries(answers).filter(([qId]) => visibleIds.includes(qId))
        );
      });
      onSubmit({ carDetails, symptomsSelected, symptomAnswers: prunedAnswers, finalDetails });
    }
  };

  const goBack = () => {
    if (step === 3) { setStep(2); setCurrentSymptomIdx(symptomsSelected.length - 1); return; }
    if (step === 2) {
      if (currentSymptomIdx > 0) { setCurrentSymptomIdx(i => i - 1); return; }
      setStep(1); return;
    }
    if (step === 1) { setStep(0); return; }
  };

  const currentSymptomId = symptomsSelected[currentSymptomIdx];
  const currentAnswers = symptomAnswers[currentSymptomId] || {};
  const visibleQuestions = currentSymptomId ? getVisibleQuestions(currentSymptomId, currentAnswers) : [];

  return (
    <div className="max-w-lg mx-auto px-4 pb-10">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-[#f97316] rounded-full"
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 0: Car details ── */}
        {step === 0 && (
          <motion.div key="car" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex items-center gap-2 mb-1">
              <Car className="h-5 w-5 text-[#f97316]" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step 1</p>
            </div>
            <h2 className="font-heading font-black text-2xl text-[#0B1120] mb-1">About your car</h2>
            <p className="text-sm text-slate-500 mb-6">Helps tailor repair cost estimates to your specific vehicle.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Make <span className="text-[#f97316]">*</span></label>
                <select value={carDetails.car_make} onChange={e => updateCar("car_make", e.target.value)} className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]">
                  <option value="">Select make...</option>
                  {CAR_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Model <span className="text-[#f97316]">*</span></label>
                <input value={carDetails.car_model} onChange={e => updateCar("car_model", e.target.value)} placeholder="e.g. Corolla" className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]" />
              </div>
              <div>
                <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Year <span className="text-[#f97316]">*</span></label>
                <select value={carDetails.car_year} onChange={e => updateCar("car_year", e.target.value)} className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]">
                  <option value="">Select year...</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Fuel Type</label>
                  <select value={carDetails.fuel_type} onChange={e => updateCar("fuel_type", e.target.value)} className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]">
                    <option value="">Select...</option>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Transmission</label>
                  <select value={carDetails.transmission} onChange={e => updateCar("transmission", e.target.value)} className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]">
                    <option value="">Select...</option>
                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Odometer (km)</label>
                  <input type="number" value={carDetails.odometer} onChange={e => updateCar("odometer", e.target.value)} placeholder="e.g. 85000" className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]" />
                </div>
                <div>
                  <label className="text-sm font-bold text-[#0B1120] block mb-1.5">State</label>
                  <select value={carDetails.state} onChange={e => updateCar("state", e.target.value)} className="w-full h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-semibold focus:outline-none focus:border-[#f97316]">
                    <option value="">Select...</option>
                    {["NSW","VIC","QLD","WA","SA","TAS","ACT","NT"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 1: Symptom selection ── */}
        {step === 1 && (
          <motion.div key="symptoms" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Step 2</p>
            <h2 className="font-heading font-black text-2xl text-[#0B1120] mb-1">What's the problem?</h2>
            <p className="text-sm text-slate-500 mb-6">Select all that apply — you'll be asked follow-up questions for each.</p>
            <div className="space-y-2">
              {SYMPTOM_CATEGORIES.map(({ id, label }) => {
                const selected = symptomsSelected.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSymptomsSelected(prev =>
                      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
                    )}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? "bg-[#0B1120] border-[#0B1120] text-white"
                        : "bg-white border-slate-200 text-slate-800 hover:border-slate-400"
                    }`}
                  >
                    <span className="text-lg">{label.split(" ")[0]}</span>
                    <span className="text-sm font-semibold">{label.slice(label.indexOf(" ") + 1)}</span>
                    {selected && <span className="ml-auto text-[#f97316] font-extrabold">✓</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Adaptive symptom questions ── */}
        {step === 2 && currentSymptomId && (
          <motion.div key={`sq-${currentSymptomIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
              {symptomsSelected.length > 1 ? `Symptom ${currentSymptomIdx + 1} of ${symptomsSelected.length}` : "Follow-up questions"}
            </p>
            <h2 className="font-heading font-black text-2xl text-[#0B1120] mb-1">
              {SYMPTOM_CATEGORIES.find(s => s.id === currentSymptomId)?.label}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {visibleQuestions.length} question{visibleQuestions.length !== 1 ? "s" : ""} — answers unlock more specific follow-ups.
            </p>
            <div className="space-y-7">
              {visibleQuestions.map((q, idx) => (
                <AnimatePresence key={q.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 h-5 w-5 rounded-full bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <label className="text-sm font-bold text-[#0B1120]">{q.label}</label>
                    </div>
                    <div className="ml-7">
                      {q.type === "radio" && (
                        <RadioGroup
                          options={q.options}
                          value={currentAnswers[q.id] || ""}
                          onChange={val => updateSymptomAnswer(currentSymptomId, q.id, val)}
                        />
                      )}
                      {q.type === "checkbox" && (
                        <CheckboxGroup
                          options={q.options}
                          value={currentAnswers[q.id] || []}
                          onChange={val => updateSymptomAnswer(currentSymptomId, q.id, val)}
                        />
                      )}
                      {q.type === "text" && (
                        <textarea
                          value={currentAnswers[q.id] || ""}
                          onChange={e => updateSymptomAnswer(currentSymptomId, q.id, e.target.value)}
                          placeholder="Optional — add any extra details..."
                          rows={2}
                          className="w-full mt-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#f97316] resize-none"
                        />
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Final details ── */}
        {step === 3 && (
          <motion.div key="final" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Almost done</p>
            <h2 className="font-heading font-black text-2xl text-[#0B1120] mb-1">A few final details</h2>
            <p className="text-sm text-slate-500 mb-6">These help narrow down the likely causes further.</p>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-[#0B1120] block mb-1.5">Has your car had any recent repairs or servicing?</label>
                <textarea
                  value={finalDetails.recent_repairs}
                  onChange={e => setFinalDetails(p => ({ ...p, recent_repairs: e.target.value }))}
                  placeholder="e.g. Oil change 2 months ago, new tyres last year..."
                  rows={2}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#f97316] resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-[#0B1120] block mb-2">Have you driven the car since the problem started?</label>
                <RadioGroup
                  options={["Yes, I'm still using it", "Only short trips", "No, I've stopped using it"]}
                  value={finalDetails.still_driving}
                  onChange={val => setFinalDetails(p => ({ ...p, still_driving: val }))}
                />
              </div>
              {/* Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Your Symptom Summary</p>
                <p className="text-sm font-bold text-[#0B1120]">{carDetails.car_year} {carDetails.car_make} {carDetails.car_model}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {symptomsSelected.map(id => (
                    <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                      {SYMPTOM_CATEGORIES.find(s => s.id === id)?.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium">This report provides general information only, not a mechanical diagnosis. Always consult a qualified mechanic for safety-critical issues.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex justify-between items-center mt-8 gap-3">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 0}
          className="flex items-center gap-2 h-12 px-5 rounded-xl border-2 border-slate-200 font-bold"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={goNext}
          disabled={
            loading ||
            (step === 0 && !canProceedCar) ||
            (step === 1 && !canProceedSymptoms)
          }
          className="flex-1 h-12 rounded-xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-bold text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analysing...</>
          ) : step === 3 ? (
            <>Get My Report <ChevronRight className="h-4 w-4" /></>
          ) : (
            <>Next <ChevronRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </div>
  );
}