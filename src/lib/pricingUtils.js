// Australian market pricing calibration utilities

// Makes with manufacturer capped service programs
export const CAPPED_SERVICE_MAKES = new Set([
  "Toyota", "Lexus", "Honda", "Acura",
  "Hyundai", "Kia", "Genesis",
  "Mazda", "Subaru", "Mitsubishi",
  "Suzuki", "Daihatsu"
]);

// Premium brands with higher dealer markup (50-60% vs indie)
export const PREMIUM_BRANDS = new Set([
  "BMW", "Mercedes", "Audi", "Porsche",
  "Jaguar", "Land Rover", "Range Rover",
  "Tesla", "Maserati", "Lamborghini"
]);

// Regional pricing multipliers (metro NSW baseline = 1.0)
export const REGIONAL_MULTIPLIERS = {
  // NSW
  NSW: { "Sydney": 1.0, "Newcastle": 0.95, "Wollongong": 0.94, "regional": 0.90 },
  // VIC
  VIC: { "Melbourne": 1.02, "Geelong": 0.96, "regional": 0.91 },
  // QLD
  QLD: { "Brisbane": 1.0, "Gold Coast": 0.98, "Cairns": 0.92, "regional": 0.87 },
  // WA
  WA: { "Perth": 0.98, "regional": 0.85 },
  // SA
  SA: { "Adelaide": 0.96, "regional": 0.88 },
  // TAS
  TAS: { "Hobart": 0.94, "regional": 0.90 },
  // ACT
  ACT: { "Canberra": 0.99, "regional": 0.95 },
  // NT
  NT: { "Darwin": 0.92, "regional": 0.85 }
};

// High-variance premium variants that significantly affect pricing
export const HIGH_VARIANCE_VARIANTS = {
  "BMW-7 Series": ["M760", "750i", "M850"],
  "Mercedes-S-Class": ["AMG", "S65", "S580"],
  "Audi-A8": ["W12", "S8"],
  "Porsche-911": ["Turbo", "GT3", "RS"],
  "BMW-X5": ["M50d", "M60i"],
  "Mercedes-GLE": ["AMG", "GLE63"],
  "Range Rover": ["Vogue", "SVR", "P400e"]
};

export function getRegionalMultiplier(state, suburb) {
  if (!state) return 1.0;
  const stateMultipliers = REGIONAL_MULTIPLIERS[state];
  if (!stateMultipliers) return 1.0;
  
  // Check if suburb is listed explicitly
  if (suburb && stateMultipliers[suburb]) {
    return stateMultipliers[suburb];
  }
  
  // Default to regional if suburb not found
  return stateMultipliers["regional"] || 1.0;
}

export function getPremiumDealerMarkup(make) {
  // Premium brands: 50-60% markup over indie
  // Regular brands: 25-35% markup over indie
  if (PREMIUM_BRANDS.has(make)) {
    return { min: 1.50, max: 1.60, type: "premium" };
  }
  return { min: 1.25, max: 1.35, type: "standard" };
}

export function isCappedServiceMake(make) {
  return CAPPED_SERVICE_MAKES.has(make);
}

export function hasHighVarianceWarning(make, model, variant) {
  const key = `${make}-${model}`;
  if (!HIGH_VARIANCE_VARIANTS[key]) return null;
  if (!variant) return null;
  
  const variants = HIGH_VARIANCE_VARIANTS[key];
  const matches = variants.some(v => variant.toUpperCase().includes(v.toUpperCase()));
  
  if (matches) {
    return `This ${variant} is a premium variant with significantly higher service costs than base models.`;
  }
  return null;
}

export function applyRegionalAndDealerAdjustment(priceIndie, state, suburb, make, dealerPrice = null) {
  const regional = getRegionalMultiplier(state, suburb);
  const adjustedIndie = priceIndie * regional;
  
  const markup = getPremiumDealerMarkup(make);
  const dealerLow = adjustedIndie * markup.min;
  const dealerHigh = adjustedIndie * markup.max;
  
  return {
    indie_adjusted: Math.round(adjustedIndie),
    dealer_low: Math.round(dealerLow),
    dealer_high: Math.round(dealerHigh),
    regional_multiplier: regional
  };
}