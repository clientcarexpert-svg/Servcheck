import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { SUBURBS_BY_STATE as FALLBACK } from "@/lib/suburbs";
import { base44 } from "@/api/base44Client";

// Module-level cache — fetched once per session
let _allSuburbs = null;
let _fetchPromise = null;

function loadSuburbs() {
  if (_allSuburbs) return Promise.resolve(_allSuburbs);
  if (_fetchPromise) return _fetchPromise;

  // Try sessionStorage first
  try {
    const cached = sessionStorage.getItem("au_suburbs_v2");
    if (cached) {
      _allSuburbs = JSON.parse(cached);
      return Promise.resolve(_allSuburbs);
    }
  } catch (_) {}

  _fetchPromise = base44.functions.invoke("getAustralianSuburbs", {})
    .then(res => {
      const data = res.data;
      if (data && data.NSW) {
        _allSuburbs = data;
        try { sessionStorage.setItem("au_suburbs_v2", JSON.stringify(data)); } catch (_) {}
        return data;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => { _fetchPromise = null; });

  return _fetchPromise;
}

export default function SuburbSearch({ state, value, onChange }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [allSuburbs, setAllSuburbs] = useState(_allSuburbs);
  const [loading, setLoading] = useState(!_allSuburbs);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (_allSuburbs) return;
    setLoading(true);
    loadSuburbs().then(data => {
      if (data) setAllSuburbs(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { setQuery(value || ""); }, [value]);

  const suburbs = state
    ? (allSuburbs ? allSuburbs[state] : FALLBACK[state]) || []
    : [];

  const filtered = query.length < 1
    ? suburbs.slice(0, 100)
    : suburbs.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 100);

  const handleSelect = (s) => {
    setQuery(s);
    onChange(s);
    setOpen(false);
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setOpen(true);
    setHighlighted(0);
  };

  const handleFocus = () => {
    setOpen(true);
    setHighlighted(0);
  };

  const handleToggle = () => {
    if (open) { setOpen(false); }
    else { setOpen(true); setHighlighted(0); inputRef.current?.focus(); }
  };

  const handleKeyDown = (e) => {
    if (!open) { if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[highlighted]) handleSelect(filtered[highlighted]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  useEffect(() => {
    if (listRef.current && open) {
      const item = listRef.current.children[highlighted];
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Suburb</label>
      <div className="relative">
        <div className="relative flex items-center">
          {loading
            ? <Loader2 className="absolute left-3 h-4 w-4 text-muted-foreground animate-spin pointer-events-none" />
            : <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={!state ? "Select a state first..." : loading ? "Loading suburbs..." : `Search ${suburbs.length.toLocaleString()} suburbs...`}
            disabled={!state}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-10 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={handleToggle}
            disabled={!state}
            className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        </div>

        {open && state && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">No suburbs found</div>
            ) : (
              <>
                <div className="px-4 py-2 text-[11px] font-semibold text-muted-foreground bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                  {query.length > 0
                    ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`
                    : `${suburbs.length.toLocaleString()} suburbs — type to filter`}
                </div>
                <ul ref={listRef} className="max-h-56 overflow-y-auto">
                  {filtered.map((s, i) => (
                    <li
                      key={s}
                      onMouseDown={() => handleSelect(s)}
                      className={`px-4 py-2.5 text-sm cursor-pointer font-medium transition-colors flex items-center justify-between ${
                        i === highlighted ? "bg-accent text-white" : "hover:bg-slate-50 text-foreground"
                      }`}
                    >
                      <span>{s}</span>
                      {value === s && i !== highlighted && (
                        <span className="text-accent text-xs font-bold">✓</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}