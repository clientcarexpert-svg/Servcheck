import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import CheckQuoteModal from "../components/CheckQuoteModal";
import SEOHead, { SERVICE_SCHEMA, HOWTO_SCHEMA, QUOTE_FAQ_SCHEMA } from "../components/SEOHead";

const CHECKQUOTE_SCHEMA = [SERVICE_SCHEMA, HOWTO_SCHEMA, QUOTE_FAQ_SCHEMA];

export default function CheckQuote() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();

  // Mechanics should not access the consumer quote checker
  useEffect(() => {
    if (!isLoadingAuth && user?.role === "mechanic") {
      navigate("/mechanic-portal", { replace: true });
    }
  }, [user, isLoadingAuth]);

  if (!isLoadingAuth && user?.role === "mechanic") return null;

  return (
    <>
      <SEOHead
        title="Check If Your Mechanic Quote Is Fair — Free Tool | ServCheck"
        description="Paste your mechanic quote and get an instant fairness analysis. Free for Australian car owners. No signup needed."
        path="/check-quote"
        schema={CHECKQUOTE_SCHEMA}
      />
      <CheckQuoteModal onClose={() => navigate("/")} />
    </>
  );
}