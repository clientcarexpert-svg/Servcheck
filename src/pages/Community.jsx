import { useState, useEffect } from "react";
import SEOHead from "../components/SEOHead";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Search, Info } from "lucide-react";
import CommunityPostForm from "@/components/community/CommunityPostForm";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import CommunityStats from "@/components/community/CommunityStats";

const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const emptyForm = {
  state: "NSW",
  suburb: "",
  service_type: "",
  mechanic_name: "",
  price_paid: "",
  car_make: "",
  car_model: "",
  car_year: "",
};

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("NSW");
  const [suburbFilter, setSuburbFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadPosts();
  }, [selectedState]);

  // Prefill form from share link (e.g. from Logbook)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("share") === "1") {
      const state = STATES.includes(params.get("state")) ? params.get("state") : "NSW";
      setForm({
        ...emptyForm,
        state,
        car_make: params.get("make") || "",
        car_model: params.get("model") || "",
        car_year: params.get("year") || "",
        service_type: params.get("service") || "",
        price_paid: params.get("price") || "",
      });
      setSelectedState(state);
      setShowForm(true);
    }
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const data = await base44.entities.CommunityPost.filter(
      { state: selectedState, status: "approved" },
      "-created_date",
      100
    );
    setPosts(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Receipt goes to private storage — analysed server-side, never public
      let receipt_file_uri = null;
      if (receiptFile) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: receiptFile });
        receipt_file_uri = file_uri;
      }

      // Moderation + verification run securely on the server
      const res = await base44.functions.invoke("submitCommunityPost", {
        ...form,
        receipt_file_uri,
      });

      setForm({ ...emptyForm, state: selectedState });
      setReceiptFile(null);
      setShowForm(false);

      if (res.data?.status === "held_for_review") {
        alert("Your submission is under review and will appear once approved.");
      } else {
        loadPosts();
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Could not submit your post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const filteredPosts = suburbFilter
    ? posts.filter((p) => p.suburb?.toLowerCase().includes(suburbFilter.toLowerCase()))
    : posts;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <SEOHead
        title="Car Owner Community — Share Mechanic Experiences & Pricing | ServCheck"
        description="Read and share real mechanic experiences from Australian car owners. Help others find fair pricing and avoid dodgy workshops."
        path="/community"
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Community
          </p>
          <h1 className="font-heading text-3xl font-black leading-tight text-primary sm:text-4xl">
            Real service prices
          </h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Transparent pricing shared by Australian car owners — verified against receipts wherever possible.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="h-11 shrink-0 gap-2 bg-accent px-5 text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          Share a price
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="mt-8">
        <CommunityStats posts={posts} state={selectedState} />
      </div>

      {/* Form */}
      <div className="mt-8">
        {showForm && (
          <CommunityPostForm
            form={form}
            update={update}
            onSubmit={handleSubmit}
            submitting={submitting}
            receiptFile={receiptFile}
            setReceiptFile={setReceiptFile}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/90 px-4 py-4 backdrop-blur">
        <div className="flex flex-wrap gap-1.5">
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => { setSelectedState(s); setSuburbFilter(""); }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                selectedState === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by suburb..."
            value={suburbFilter}
            onChange={(e) => setSuburbFilter(e.target.value)}
            className="h-11 border-border bg-card pl-10"
          />
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[116px] animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <MessageSquare className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
          <p className="font-semibold text-foreground">
            No prices for {selectedState}{suburbFilter ? ` · ${suburbFilter}` : ""} yet
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-sm font-semibold text-accent hover:underline"
          >
            Be the first to share →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, i) => (
            <CommunityPostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}

      {/* Disclosure */}
      <p className="mt-8 flex items-start gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        This feed shows car make and model, service type, and price paid only. No subjective reviews are displayed.
      </p>
    </div>
  );
}