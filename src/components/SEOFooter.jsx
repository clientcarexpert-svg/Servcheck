import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

const PUBLIC_LINKS = [
  { to: "/", label: "Home" },
  { to: "/check-quote", label: "Check Quote" },
  { to: "/directory", label: "Mechanic Directory" },
  { to: "/community", label: "Community" },
  { to: "/logbook", label: "Logbook" },
  { to: "/buy-car", label: "Buy a Car" },
  { to: "/local-alternatives", label: "Local Alternatives" },
  // HIDDEN: { to: "/marketplace", label: "Marketplace" },
  { to: "/partner-signup", label: "Partner Signup" },
  { to: "/faq", label: "FAQ" },
];

export default function SEOFooter() {
  const { user } = useAuth();
  const isMechanic = user?.role === "mechanic" || user?.role === "mobile_mechanic";
  const tosLink = isMechanic
    ? { to: "/partner-terms", label: "Partner Terms of Service" }
    : { to: "/terms", label: "Terms of Service" };

  return (
    <footer className="border-t border-slate-100 bg-white mt-12 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">Explore ServCheck</p>
        <nav aria-label="Site footer navigation">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {PUBLIC_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-xs text-slate-500 hover:text-[#f97316] transition-colors font-medium">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-4">
          <Link to="/privacy" className="text-xs text-slate-400 hover:text-[#f97316] transition-colors font-medium">Privacy Policy</Link>
          <Link to={tosLink.to} className="text-xs text-slate-400 hover:text-[#f97316] transition-colors font-medium">{tosLink.label}</Link>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          © {new Date().getFullYear()} ServCheck Australia · Australia's car service transparency platform
        </p>
      </div>
    </footer>
  );
}