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
function H3({ children }) {
  return <h3 className="text-sm font-heading font-bold text-foreground mt-5 mb-2">{children}</h3>;
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
function Note({ children }) {
  return <p className="text-xs text-muted-foreground italic mt-3 leading-relaxed border-l-2 border-border pl-3">{children}</p>;
}

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Privacy Policy | ServCheck Australia"
        description="How ServCheck collects, uses, stores, and protects your personal information under Australian privacy law."
        path="/privacy"
      />

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-5 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to ServCheck
          </Link>
          <H1>Privacy Policy</H1>
          <p className="text-xs text-muted-foreground mt-1">Last updated: 28 June 2026</p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <P>This Privacy Policy describes how <Strong>ServCheck Pty Ltd (ACN ___ ___ ___)</Strong> ("ServCheck", "we", "us", and "our") collects, uses, and shares your personal information when you use our website and mobile applications (collectively, the "Service"). It applies to all users of the Service, including vehicle owners ("Customers") and mechanics, workshops, and dealers ("Partners").</P>
        <P>Please read this Privacy Policy carefully. By using the Service, you acknowledge that you have read and understood how we handle your personal information as described in this policy.</P>

        <H2>1. About Us and This Policy</H2>
        <P>ServCheck Pty Ltd operates an Australian automotive transparency platform that enables Customers to check mechanic quotes, understand car symptoms, maintain a digital logbook, and connect with verified Partners. It also enables Partners to receive customer leads and manage their business listings. Where our handling of information differs depending on whether you are a Customer or a Partner, we explain that difference clearly.</P>
        <P>We handle personal information in accordance with the <Strong>Privacy Act 1988 (Cth)</Strong> and the 13 Australian Privacy Principles (APPs). We have chosen to comply with the Privacy Act and the APPs in full, regardless of whether any small business exemption would otherwise apply, because our platform involves the disclosure of Customer contact details to Partners. In addition, since 10 June 2025, any individual may bring a claim for a serious invasion of privacy regardless of business turnover, and we handle your information with that framework in mind.</P>

        <H2>2. What Personal Information We Collect</H2>
        <H3>Information We Collect From Everyone</H3>
        <UL>
          <LI><Strong>Account details</Strong>, including your name, email address, suburb, state, account role, password credentials (stored in hashed form; we never see your password in plain text), and any username you choose.</LI>
          <LI><Strong>Acceptance records</Strong>, including the version of this policy or our terms that you accepted, a timestamp, and your IP address at the time of acceptance.</LI>
          <LI><Strong>Technical data</Strong>, including your IP address, device type, browser type, app version, and usage analytics.</LI>
        </UL>
        <H3>Information We Collect From Customers</H3>
        <UL>
          <LI><Strong>Vehicle details</Strong>, including make, model, year, variant, fuel type, transmission, and odometer readings.</LI>
          <LI><Strong>Service and logbook records</Strong>, including logbook entries, service history, quotes and estimates you check, used car checks, predictions and valuations, and your savings history.</LI>
          <LI><Strong>Uploaded documents</Strong>, including photos or PDFs of quotes, invoices, and receipts. These documents may contain personal information such as your name, address, phone number, or registration plate. Please refer to section 5 for a detailed explanation of how we minimise the processing of that information.</LI>
          <LI><Strong>Car symptom enquiries</Strong>, including the vehicle details you provide, the symptoms you select or describe, your contextual answers, and your suburb and state. Please refer to section 6 for more detail.</LI>
          <LI><Strong>Quote and diagnostic requests</Strong>, including the service needed or problem described, vehicle details, suburb, and your chosen contact method, which are shared with matching Partners as described in section 8.</LI>
          <LI><Strong>Community submissions</Strong>, including prices paid, shop names, and service types.</LI>
          <LI><Strong>Payment records</Strong>, including credit purchases and transaction history. Card details are held exclusively by our payment processor and are never stored by us.</LI>
        </UL>
        <H3>Information We Collect From Partners</H3>
        <UL>
          <LI><Strong>Business identity information</Strong>, including business name, ABN, business address, suburb, postcode, state, business phone number, contact person name, bio, and specialties.</LI>
          <LI><Strong>Licence and verification documents</Strong>, including copies of your motor vehicle repairer's or dealer's licence or equivalent, together with your licence type and number. These are sensitive business records and we restrict internal access to them. They are not displayed publicly.</LI>
          <LI><Strong>Verification contact details</Strong>, including the email address used for one-time passcode (OTP) verification.</LI>
          <LI><Strong>Marketplace activity data</Strong>, including lead preferences, leads viewed and claimed, diagnostic offers, bookings, response and performance metrics, and subscription tier and billing status.</LI>
          <LI><Strong>Public profile information</Strong>, including your business name, suburb, specialties, service radius, and rating, which are displayed publicly on the platform. Your ABN and licence documents are not displayed publicly.</LI>
        </UL>
        <H3>Information We Deliberately Do Not Collect</H3>
        <P>We do not collect government identifiers of individuals (such as driver licence numbers, passport numbers, or Medicare numbers), financial account numbers, or sensitive information as defined in the Privacy Act. Please do not upload such material. If we become aware that it has been submitted, we will delete it.</P>

        <H2>3. How We Collect Information</H2>
        <P>We collect information in the following ways:</P>
        <UL>
          <LI>Directly from you when you create an account, upload documents, complete forms, use symptom enquiries, submit community posts, or contact our support team.</LI>
          <LI>Automatically through your use of the Service, including through cookies, local storage, and analytics tools.</LI>
          <LI>From the other side of the marketplace, for example when a Partner responds to a Customer's request or when a Customer submits a quote that involves a Partner's business.</LI>
          <LI>From publicly available sources for our mechanic directory, including business name, address, phone number, and ratings.</LI>
        </UL>

        <H2>4. Why We Collect, Use, and Hold Information</H2>
        <P>We collect and use personal information for the following purposes:</P>
        <UL>
          <LI>To create and operate accounts and to provide the marketplace functionality.</LI>
          <LI>To provide quote analysis, used car checks, the car symptom guide, logbook features, service predictions, and valuations.</LI>
          <LI>To match Customer requests with Partners and deliver leads.</LI>
          <LI>To verify Partner licences and business identities.</LI>
          <LI>To process payments, credits, refunds, and subscriptions.</LI>
          <LI>To generate resale reports and savings summaries.</LI>
          <LI>To send service reminders and in-app notifications.</LI>
          <LI>To moderate community content and prevent fraud.</LI>
          <LI>To enforce our terms and meet our legal obligations.</LI>
          <LI>To improve the Service using aggregated, de-identified data.</LI>
        </UL>
        <P><Strong>We do not sell your personal information. We do not use your personal information to train artificial intelligence models. We do not use your information for third-party direct marketing.</Strong></P>

        <H2>5. AI Features and How We Protect Your Documents</H2>
        <P>The Service uses AI language models for quote analysis, used car valuations, service predictions, the car symptom guide, community content moderation, and feedback analysis. We apply the following data minimisation practices:</P>
        <UL>
          <LI>When you scan a quote or receipt, an extraction step pulls out only the structured fields required and is instructed to exclude personal names, addresses, phone numbers, and registration plates.</LI>
          <LI>Pricing analysis is then performed on those structured fields only. Your original document is not used in the analysis step.</LI>
          <LI>Receipt images used for community post verification are analysed once and the file reference is discarded immediately after processing.</LI>
          <LI>When you upload a receipt through the Upload to Earn feature in the logbook, the image is uploaded temporarily for extraction only. The original file reference is permanently discarded after processing. Only the extracted structured fields (service type, date, odometer reading, cost, parts, and workshop name) are saved. Our extraction prompt explicitly instructs the AI to exclude all personal identifiers, including customer name, address, phone number, email address, registration plate, VIN, and payment details. A client-side scrub also runs over the output before any data is saved.</LI>
          <LI>AI moderation of community posts reviews only the shop name and service type fields.</LI>
        </UL>

        <H2>6. The Car Symptom Guide</H2>
        <P>When you use the Car Symptom Guide, we collect the vehicle details you provide, the symptoms you select or describe, your contextual answers, and your suburb and state. This information (without your personal contact details) is sent to our AI provider to generate a guidance report. The report may include a ranked list of possible causes, a priority and urgency indicator, an indicative repair cost range, and suggested questions to ask a mechanic. We store the report so that you can view it again at any time.</P>
        <P><Strong>The Car Symptom Guide produces general information only. It is not a professional mechanical diagnosis and it does not determine whether your vehicle is safe to drive.</Strong> Its legal status, limitations, and the conditions that apply to your use of it are set out in our Customer Terms of Service.</P>

        <H2>7. How We Use Automated Processing</H2>
        <P>Several features on ServCheck use automated processing to generate results from the information you provide. From 10 December 2026, the Privacy Act will require businesses to be transparent about this. We are making this disclosure now, ahead of that date.</P>
        <P>The table below sets out each automated feature, the information it uses, and what it does. None of these processes makes a binding decision about you. Every result is an estimate or a guide that you are free to act on or disregard.</P>

        <div className="overflow-x-auto my-4 rounded-xl border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Feature</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">Information Used</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-xs uppercase tracking-wide">What It Does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                [
                  "Quote fairness analysis",
                  "Your vehicle, service type, suburb, and the prices on your quote",
                  "Returns a fairness estimate. It is a guide to help you make an informed decision, not a binding determination."
                ],
                [
                  "Car symptom guide",
                  "Your vehicle, the symptoms you select, and any context you provide",
                  "Produces a list of possible causes and an indicative cost range. You should always confirm the output with a qualified mechanic before acting on it."
                ],
                [
                  "Used car check and valuation",
                  "Vehicle details and odometer reading",
                  "Returns an estimated market value. It is a starting point for your own research, not a formal or certified valuation."
                ],
                [
                  "Document scanning",
                  "The structured fields extracted from your uploaded quote or receipt",
                  "Pre-fills your logbook or community form. You may edit or discard the pre-filled information before saving."
                ],
                [
                  "Service predictions",
                  "Your vehicle, odometer reading, and service history",
                  "Forecasts when maintenance may be due. It is a helpful reminder tool, not a professional mechanical assessment."
                ],
                [
                  "Lead matching",
                  "Your suburb, vehicle details, and the service or problem you describe",
                  "Determines which mechanics or dealers receive your request. Submitting a request does not commit you to engaging any particular Partner."
                ],
                [
                  "Community post moderation",
                  "The shop name and service type fields in your community submission",
                  "Flags posts for human review before they are published. No post is deleted without a person reviewing it first."
                ],
              ].map(([feature, info, effect]) => (
                <tr key={feature} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground align-top">{feature}</td>
                  <td className="px-4 py-3 text-muted-foreground align-top">{info}</td>
                  <td className="px-4 py-3 text-muted-foreground align-top">{effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <P>If you have questions about how any of these features work or would like a human to review an automated output, please contact us at <a href="mailto:allenquiries@servcheck.com.au" className="text-accent underline underline-offset-2">allenquiries@servcheck.com.au</a>.</P>

        <H2>8. Who We Disclose Personal Information To</H2>
        <P><Strong>Marketplace participants.</Strong> When a Customer submits a quote, diagnostic, or symptom-related request, matching Partners receive the vehicle details, the service or problem description, the Customer's suburb (not street address), and the contact details the Customer has chosen to share. When a Partner responds to or claims a lead, the Customer receives the Partner's business name, contact details, and profile information. Partners are required to use Customer information only for the purpose of responding to that specific request and must not use it for marketing lists or resale. This obligation is set out in the Partner Terms of Service.</P>
        <P><Strong>Service providers.</Strong> We share information with the following third-party service providers:</P>
        <UL>
          <LI><Strong>Base44</Strong>, our application platform, which processes and stores the data described in this policy on our behalf.</LI>
          <LI><Strong>AI sub-processors</Strong>, which Base44 routes AI requests through to perform the functions described in sections 5 and 6. Current sub-processors include Anthropic, OpenAI, and Google.</LI>
          <LI><Strong>Stripe</Strong>, which processes payments on our behalf. We never receive or store your full card number.</LI>
          <LI><Strong>Apple and Google</Strong>, which receive standard installation and purchase data when you install the app from their respective platforms, governed by their own privacy policies.</LI>
        </UL>
        <P><Strong>Legal and regulatory disclosures.</Strong> We may disclose personal information to courts, regulators, or law enforcement where required by Australian law, and to professional advisers under obligations of confidentiality.</P>
        <P><Strong>Business transfers.</Strong> If ServCheck is sold, merged, or restructured, personal information may be transferred to the successor entity. We will provide notice to affected users before any such transfer occurs.</P>

        <H2>9. Overseas Disclosure</H2>
        <P>Our infrastructure provider (Base44), its AI sub-processors (Anthropic, OpenAI, and Google), and Stripe store and process data on servers located in the <Strong>United States</Strong> and other overseas jurisdictions. By using the Service, particularly AI-powered features and document uploads, your personal information may be transmitted to and processed by these overseas providers.</P>
        <P>Several features also send non-identifying information overseas, including vehicle make, model, year, fuel type, transmission, and odometer reading; the symptoms you select; and your suburb and state. This data is not linked to your name or contact details when it is transmitted.</P>
        <P>We take reasonable steps to ensure that overseas recipients handle your information in a manner consistent with the Australian Privacy Principles. If you do not wish your information to be processed overseas, please do not use the AI-powered features of the Service. Core directory browsing does not require overseas data processing.</P>
        <Note>We plan to progressively move document and AI processing to infrastructure under our direct control, which will reduce overseas data flows. This policy will be updated when that transition occurs.</Note>

        <H2>10. Security, Storage, and Retention</H2>
        <UL>
          <LI>We take reasonable technical and organisational measures to protect personal information, including encryption in transit (TLS), access controls, and role-based permissions.</LI>
          <LI>Payment credentials are held exclusively by Stripe, which is PCI-DSS compliant.</LI>
          <LI>Partner licence documents are retained while the account is active and for 12 months after closure, after which they are deleted.</LI>
          <LI>Transaction and tax records are kept for seven years as required by law.</LI>
          <LI>Symptom guide reports, logbook entries, and other account content are retained while your account remains active or until you delete them.</LI>
        </UL>
        <P><Strong>Account deletion.</Strong> You can permanently delete your account at any time through the in-app settings (Profile then Settings). Deletion removes your personal information, logbook entries, uploads, listings, and symptom reports, except for records we are legally required to retain and de-identified aggregate data.</P>
        <P><Strong>Data breaches.</Strong> We maintain a data breach response plan. If we identify or suspect an eligible data breach, we will assess it promptly and, where the breach is likely to result in serious harm, we will notify affected individuals and the Office of the Australian Information Commissioner (OAIC) in accordance with the Notifiable Data Breaches scheme under Part IIIC of the Privacy Act.</P>

        <H2>11. Cookies, Local Storage, and Analytics</H2>
        <P>We use essential cookies and local storage for sign-in sessions and user preferences, and analytics tools to understand how features are used. We do not use third-party advertising trackers. Clearing your browser storage may sign you out of your account.</P>

        <H2>12. Your Rights</H2>
        <P>Under the Australian Privacy Principles, you have the right, free of charge, to do the following:</P>
        <UL>
          <LI><Strong>Access</Strong> the personal information we hold about you.</LI>
          <LI><Strong>Correct</Strong> information that is inaccurate, out of date, incomplete, or misleading.</LI>
          <LI><Strong>Delete</Strong> your account and associated personal data.</LI>
          <LI><Strong>Opt out</Strong> of notifications and service reminders.</LI>
          <LI><Strong>Complain</Strong> about our handling of your personal information.</LI>
        </UL>
        <P>If we decline a request for access or correction, we will provide written reasons and explain how you can escalate the matter.</P>
        <P><Strong>How to make a complaint.</Strong> Email us at <a href="mailto:allenquiries@servcheck.com.au" className="text-accent underline underline-offset-2">allenquiries@servcheck.com.au</a>. We will acknowledge your complaint within 7 days and provide a substantive response within 30 days. If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at oaic.gov.au, by phone on 1300 363 992, or by post to GPO Box 5288, Sydney NSW 2001.</P>

        <H2>13. Directory Listings of Businesses</H2>
        <P>Our mechanic directory includes publicly available business information sourced from public records. If your business is listed and you would like the information corrected or removed, please email <a href="mailto:allenquiries@servcheck.com.au" className="text-accent underline underline-offset-2">allenquiries@servcheck.com.au</a> and we will action your request within 14 days.</P>

        <H2>14. Children</H2>
        <P>The Service is intended for individuals who are 18 years of age or older. We do not knowingly collect personal information from anyone under the age of 18. If you believe that a minor has provided us with personal information, please contact us at <a href="mailto:allenquiries@servcheck.com.au" className="text-accent underline underline-offset-2">allenquiries@servcheck.com.au</a> and we will take steps to delete it.</P>

        <H2>15. Third-Party Links and Changes to This Policy</H2>
        <P>The Service may contain links to third-party websites. Those websites are governed by their own privacy policies and we are not responsible for their content or practices.</P>
        <P>We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We will notify you of material changes through the app or by email. Where a change expands how we use your personal information, we will seek your fresh acceptance before applying that change to your account.</P>

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
          <Link to="/partner-terms" className="text-accent underline underline-offset-2 hover:text-accent/80">Partner Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}