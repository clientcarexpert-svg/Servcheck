import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";

function H1({ children }) {
  return <h1 className="text-2xl sm:text-3xl font-heading font-black text-foreground mb-2">{children}</h1>;
}
function H2({ children }) {
  return <h2 className="text-base sm:text-lg font-heading font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border">{children}</h2>;
}
function P({ children }) {
  return <p className="text-sm text-foreground leading-relaxed mb-3">{children}</p>;
}
function UL({ children }) {
  return <ul className="list-disc list-outside ml-5 space-y-1.5 mb-3 text-sm text-foreground leading-relaxed">{children}</ul>;
}
function LI({ children }) {
  return <li>{children}</li>;
}
function Strong({ children }) {
  return <strong className="font-semibold">{children}</strong>;
}
function Callout({ children }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 leading-relaxed mb-4">
      {children}
    </div>
  );
}

export default function PartnerTerms() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Partner Terms of Service | ServCheck Australia"
        description="ServCheck's Partner Terms of Service for mechanics, workshops, mobile mechanics and dealers."
        path="/partner-terms"
      />

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to ServCheck
          </Link>
          <H1>Partner Terms of Service</H1>
          <p className="text-xs text-muted-foreground mt-1">Last updated: 11 June 2026</p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <P>These Partner Terms of Service ("Terms") are an agreement between you and <Strong>ServCheck Pty Ltd (ACN ___ ___ ___)</Strong> ("ServCheck", "we", "us", "our") and govern your use of ServCheck's lead marketplace, directory, booking and dealer tools as a mechanic, workshop, mobile mechanic or dealer ("Partner", "you"). Customers are covered by our separate Terms of Service. Our Privacy Policy applies to everyone. By creating a Partner account, you accept these Terms.</P>

        <H2>0. Fairness and your rights</H2>
        <Callout>
          These Terms are a standard-form contract. Australian law (the unfair contract terms provisions of the Australian Consumer Law) protects small businesses from unfair terms in standard-form contracts, and nothing in these Terms is intended to operate as an unfair contract term. Nothing in these Terms excludes, restricts or modifies any consumer guarantee, right or remedy available to you under the Australian Consumer Law that cannot lawfully be excluded.
        </Callout>

        <H2>1. Agreement and eligibility</H2>
        <P>By creating a Partner account you agree to these Terms and the Privacy Policy on behalf of the business you represent, and you warrant you have authority to bind it. You must:</P>
        <UL>
          <LI>Hold an ABN and operate a genuine automotive business in Australia.</LI>
          <LI>Hold and <Strong>maintain</Strong> every licence required for your work in your state — in NSW, the applicable licence under the Motor Dealers and Repairers Act 2014 (NSW) — and equivalents elsewhere.</LI>
          <LI>Provide truthful verification documents and notify us within 14 days if your licence is suspended, cancelled or lapses.</LI>
        </UL>

        <H2>2. Verification</H2>
        <P>We review the documents you submit and verify a one-time passcode sent to your business email before activating marketplace features. Verification confirms only that you provided apparently valid documentation at that time. It is <Strong>not</Strong> a licence-check service, an endorsement, or a continuing warranty by us to anyone. We may re-verify periodically and suspend marketplace access if documentation cannot be confirmed. Submitting falsified documents is grounds for immediate termination and may be reported to NSW Fair Trading or the relevant regulator.</P>

        <H2>3. The marketplace — what we provide</H2>
        <P>ServCheck forwards Customer service requests, diagnostic requests and symptom-related enquiries (together, "Leads") to Partners matching the request's location, service type and your stated preferences. Depending on your subscription tier, you may receive, view and claim Leads, respond to diagnostic requests with offers, message Customers, take bookings, appear in the public directory, and (for workshops) purchase featured directory placement. Featured placement is clearly distinguishable from organic results and does not alter Customer ratings.</P>
        <Callout>
          <Strong>We are a lead-introduction service only.</Strong> We are not your agent, employer, partner or representative; you contract directly with Customers; we make no guarantee of Lead volume, Lead quality, Customer accuracy, response, conversion or revenue. Lead details reflect what the Customer told us — verify everything before quoting firm prices.
        </Callout>

        <H2>4. Subscriptions, credits and billing</H2>
        <UL>
          <LI>Partner subscriptions are billed in advance (via Stripe) at the prices shown at sign-up, plus GST where applicable, and renew automatically until cancelled. Cancel anytime; access continues to the end of the paid period.</LI>
          <LI>Lead unlocks and featured purchases are consumed on use and are non-refundable once the Lead is claimed or the feature delivered — except where required by the ACL or where we fail to deliver what you paid for.</LI>
          <LI>We may change subscription pricing with at least 30 days' notice; changes take effect at your next renewal, and you may cancel before then.</LI>
          <LI>If payment fails we will retry and notify you; marketplace access may be paused until payment resolves.</LI>
        </UL>

        <H2>5. Your obligations to Customers</H2>
        <P>You must: respond to claimed Leads professionally and within a reasonable time; quote honestly and comply with the ACL; honour the substance of pricing you communicate through the platform, or clearly explain changes before doing work; carry the insurance required for your trade; and not solicit Customers to transact off-platform for the purpose of evading platform rules during an active Lead (you are free to build ongoing direct relationships with Customers after a completed job).</P>

        <H2>6. Reviews, ratings and performance data</H2>
        <P>Customers may rate and review you. We display ratings and performance metrics fairly and won't edit reviews except to remove content that breaches our content rules (defamatory, discriminatory, fake, or off-topic). You may respond to reviews. We don't remove negative reviews merely because they are negative. If you believe a review is fake or defamatory, report it and we will review within 14 days.</P>

        <H2>7. Customer data — strict use limits</H2>
        <Callout>
          Lead and Customer information (names, contact details, vehicle details, messages) is disclosed to you <Strong>solely to respond to and perform that Customer's request</Strong>. You must not: add Customers to marketing lists without their separate, express consent; sell, share, or disclose Customer information to anyone else; or retain Customer personal information longer than needed for the job and your legal record-keeping obligations. A breach of this clause is a material breach justifying termination, and may expose you to liability under the Privacy Act directly.
        </Callout>

        <H2>8. Your content and profile</H2>
        <P>You grant us a non-exclusive, royalty-free licence to display your business name, logo, profile, specialties, service area, ratings and responses in the Service and in promoting it. Profile content must be accurate and not misleading — an inaccurate "specialties" list that wins Leads is misleading conduct under the ACL.</P>

        <H2>9. Acceptable use</H2>
        <P>You must not: create fake Customer accounts, fake community posts, or fake reviews (including of competitors); scrape Leads or Customer data; share one Partner account across multiple unrelated businesses; manipulate ratings; claim Leads with no intention or capacity to perform the work; or interfere with other Partners' use of the Service.</P>

        <H2>10. Liability between us</H2>
        <P>Both parties remain fully liable as the law requires, and nothing in these Terms excludes rights under the ACL that cannot be excluded. Subject to that:</P>
        <UL>
          <LI>You are solely responsible for your services to Customers, your quotes, your workmanship, your compliance with trade licensing, and any claim by a Customer about your work — and you will indemnify us against third-party claims arising from your services or your breach of clause 7, except to the extent we caused the loss.</LI>
          <LI>We are not liable for Lead accuracy, Customer conduct or non-payment by Customers.</LI>
          <LI>We exclude indirect and consequential loss for both parties.</LI>
          <LI>Where our liability is not the subject of a consumer guarantee, our total aggregate liability to you is limited to the subscription and lead fees you paid us in the 12 months before the claim.</LI>
          <LI>Where liability can't be excluded but can be limited, it is limited to re-supply or the cost of re-supply.</LI>
        </UL>

        <H2>11. Suspension and termination</H2>
        <P>You may cancel your subscription and close your account at any time. We may suspend marketplace access immediately where required to protect Customers (e.g. licence lapse, credible misconduct reports, suspected fraud) and will tell you why and how to resolve it. We may terminate for material breach with 14 days' notice and an opportunity to remedy where the breach is remediable. If we terminate without your breach, we will refund unused subscription fees pro-rata. Clauses 7, 10 and 12 survive termination.</P>

        <H2>12. General</H2>
        <P>These Terms are governed by the laws of New South Wales, with the non-exclusive jurisdiction of its courts. Neither party may assign without the other's consent (not unreasonably withheld), except we may assign on a sale of the business with notice. We may update these Terms with at least 30 days' notice for material changes; if you don't accept a change, you may cancel and receive a pro-rata refund of prepaid fees for the cancelled period. If a clause is unenforceable it is severed; the rest stands.</P>

        {/* Footer block */}
        <div className="mt-10 pt-6 border-t border-border rounded-xl bg-muted/40 px-4 py-4 space-y-1 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground text-xs uppercase tracking-widest mb-2">ServCheck Pty Ltd</p>
          <p>ACN: ___ ___ ___</p>
          <p>ABN: ___ ___ ___ ___</p>
          <p>Registered address: ____________________</p>
          <p>Contact: <a href="mailto:allenquiries@servcheck.com.au" className="text-accent underline underline-offset-2">allenquiries@servcheck.com.au</a></p>
        </div>

        <div className="mt-6 flex gap-4 text-sm">
          <Link to="/terms" className="text-accent underline underline-offset-2 hover:text-accent/80">Customer Terms of Service</Link>
          <Link to="/privacy" className="text-accent underline underline-offset-2 hover:text-accent/80">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}