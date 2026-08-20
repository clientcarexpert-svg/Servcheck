import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const BASE_URL = "https://servcheck.com.au";
const DEFAULT_IMAGE = "https://media.base44.com/images/public/69c3e608178c08315713aa79/cddf3b441_generated_image.png";
const BRAND_COLOR = "#1a237e";

// Global Organisation schema — injected on every page
const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ServCheck",
  "url": BASE_URL,
  "logo": `${BASE_URL}/logo.png`,
  "description": "Australia's car service transparency platform. Check mechanic quotes, find trusted workshops, and track your car's service history.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "areaServed": "AU",
    "availableLanguage": "English"
  },
  "areaServed": { "@type": "Country", "name": "Australia" },
  "sameAs": [
    "https://www.facebook.com/servcheck",
    "https://www.instagram.com/servcheck",
    "https://www.linkedin.com/company/servcheck"
  ]
};

// Breadcrumb label map
const PATH_LABELS = {
  "/": "Home",
  "/check-quote": "Check Quote",
  "/directory": "Mechanic Directory",
  "/mechanics": "Find a Mechanic",
  "/community": "Community",
  "/logbook": "Digital Logbook",
  "/buy-car": "Buy a Car",
  "/local-alternatives": "Local Alternatives",
  "/marketplace": "Marketplace",
  "/partner-signup": "Partner Signup",
  "/mechanic-signup": "List Your Business",
  "/faq": "FAQ",
  "/history": "Quote History",
  "/profile": "My Profile",
  "/results": "Quote Results",
  "/estimate-result": "Estimate Result",
  "/admin": "Admin",
  "/terms": "Terms of Service",
  "/privacy": "Privacy Policy",
};

function buildBreadcrumb(path) {
  if (path === "/") return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": PATH_LABELS[path] || "Page", "item": `${BASE_URL}${path}` },
    ],
  };
}

const setMeta = (name, content, isProperty = false) => {
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const setLink = (rel, href) => {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const injectSchema = (id, data) => {
  let el = document.querySelector(`script[data-schema="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-schema", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
};

const removeSchema = (id) => {
  const el = document.querySelector(`script[data-schema="${id}"]`);
  if (el) el.remove();
};

export default function SEOHead({ title, description, path, noindex = false, schema = null }) {
  const location = useLocation();
  const currentPath = path || location.pathname;
  const fullUrl = `${BASE_URL}${currentPath}`;

  useEffect(() => {
    // ── Title & lang ──
    document.title = title;
    document.documentElement.lang = "en-AU";

    // ── Standard meta ──
    setMeta("description", description);
    setMeta("keywords", "mechanic quote check, fair car service price Australia, car service cost, logbook service price, mechanic near me, car repair quote comparison, overcharged by mechanic, used car buyer check, car symptom checker, digital service logbook, trusted mechanics Australia");
    setMeta("robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("author", "ServCheck");
    setMeta("copyright", "ServCheck Australia");
    setMeta("language", "en-AU");
    setMeta("geo.region", "AU");
    setMeta("geo.country", "AU");
    setMeta("theme-color", BRAND_COLOR);
    setMeta("mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-title", "ServCheck");

    // ── Canonical ──
    setLink("canonical", fullUrl);

    // ── Open Graph ──
    setMeta("og:type", "website", true);
    setMeta("og:site_name", "ServCheck", true);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", fullUrl, true);
    setMeta("og:image", DEFAULT_IMAGE, true);
    setMeta("og:locale", "en_AU", true);

    // ── Twitter/X Card ──
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", DEFAULT_IMAGE);

    // ── Global Organisation schema (every page) ──
    injectSchema("org", ORG_SCHEMA);

    // ── Breadcrumb (all pages except home) ──
    const breadcrumb = buildBreadcrumb(currentPath);
    if (breadcrumb) {
      injectSchema("breadcrumb", breadcrumb);
    } else {
      removeSchema("breadcrumb");
    }

    // ── Page-specific schema (supports single object or array) ──
    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      schemas.forEach((s, i) => injectSchema(`page-${i}`, s));
      // Clean up any old extra slots
      for (let i = schemas.length; i < 10; i++) removeSchema(`page-${i}`);
    } else {
      for (let i = 0; i < 10; i++) removeSchema(`page-${i}`);
    }
  }, [title, description, currentPath, noindex, schema]);

  return null;
}

// ── Exported schema builders for use in pages ──

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ServCheck",
  "url": BASE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BASE_URL}/directory?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export const SOFTWARE_APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "ServCheck",
  "operatingSystem": "Web, iOS, Android",
  "applicationCategory": "AutomotiveApplication",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "AUD" },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "124"
  },
  "description": "Check if your mechanic quote is fair. Australia's only car service transparency platform.",
  "url": BASE_URL,
  "inLanguage": "en-AU",
  "availableOnDevice": "Desktop, Mobile"
};

export const SERVICE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Mechanic Quote Checker",
  "serviceType": "Automotive Quote Analysis",
  "provider": { "@type": "Organization", "name": "ServCheck" },
  "areaServed": { "@type": "Country", "name": "Australia" },
  "description": "Submit your mechanic quote and get an instant fairness verdict based on real Australian pricing data.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "AUD" }
};

export const HOWTO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Check If Your Mechanic Quote Is Fair",
  "description": "Use ServCheck to instantly verify if your mechanic is charging a fair price.",
  "step": [
    { "@type": "HowToStep", "position": "1", "name": "Enter Your Quote", "text": "Type in the services and prices from your mechanic's quote." },
    { "@type": "HowToStep", "position": "2", "name": "Add Your Car Details", "text": "Enter your car's make, model, year, and your suburb or postcode." },
    { "@type": "HowToStep", "position": "3", "name": "Get Your Verdict", "text": "ServCheck compares your quote against real Australian pricing data and tells you if it's fair, high, or a rip-off." }
  ]
};

export const QUOTE_FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I know if my mechanic is overcharging me?",
      "acceptedAnswer": { "@type": "Answer", "text": "ServCheck compares your quote against real pricing data from Australian mechanics. If your quote is higher than the local average for your car type and service, we flag it instantly." }
    },
    {
      "@type": "Question",
      "name": "What is a fair price for a logbook service in Australia?",
      "acceptedAnswer": { "@type": "Answer", "text": "A minor service typically costs $220–$245. A logbook or major service ranges from $370–$385. Prices vary by city, car make, and workshop. Sydney and Melbourne tend to be 10–30% higher than regional areas." }
    },
    {
      "@type": "Question",
      "name": "Will an independent mechanic void my car warranty in Australia?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. Under ACCC guidelines, any certified mechanic can service your car without voiding your manufacturer's warranty, as long as the work meets manufacturer standards." }
    },
    {
      "@type": "Question",
      "name": "How do I find a trusted mechanic near me in Australia?",
      "acceptedAnswer": { "@type": "Answer", "text": "Use ServCheck's mechanic directory to search by suburb or postcode. All listed mechanics are verified and reviewed by real Australian car owners." }
    },
    {
      "@type": "Question",
      "name": "Is ServCheck free to use?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes. Checking your mechanic quote, browsing the directory, and using the digital logbook are all free for Australian car owners." }
    }
  ]
};

export function buildLocalBusinessSchema(mechanic) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "name": mechanic.business_name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": mechanic.address || "",
      "addressLocality": mechanic.suburb || "",
      "addressRegion": mechanic.state || "",
      "addressCountry": "AU"
    },
    "telephone": mechanic.phone || mechanic.phone_number || "",
    "priceRange": "$$",
    "areaServed": mechanic.state || "AU",
    ...(mechanic.google_rating ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": mechanic.google_rating,
        "reviewCount": mechanic.review_count || 1
      }
    } : {}),
    ...(mechanic.maps_url ? { "url": mechanic.maps_url } : {}),
  };
}