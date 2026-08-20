/**
 * State-by-state mechanic licence / verification configuration for Australia.
 * Sources:
 *  NSW  — Fair Trading NSW (Motor Vehicle Repairer's Licence)
 *  VIC  — Consumer Affairs VIC (no repairer licence — Cert III AUR trade qual)
 *  QLD  — No dedicated repairer licence — trade qualification required
 *  WA   — Consumer Protection WA (Motor Vehicle Repairer's Certificate, 23 classes)
 *  SA   — Consumer & Business Services SA (Motor Vehicle Repairer Registration, from Dec 2023)
 *  TAS  — Consumer Building & Occupational Services (mutual recognition)
 *  ACT  — Access Canberra (similar to NSW system)
 *  NT   — No licence required for mechanics in NT
 */

export const STATE_LICENCE_CONFIG = {
  NSW: {
    requiresLicence: true,
    licenceName: "Motor Vehicle Repairer's Licence / Certificate",
    licenceLabel: "Licence / Certificate Number",
    licencePlaceholder: "e.g. MVRL-12345",
    licenceHint: "Found on your Fair Trading NSW licence card or certificate of registration.",
    verifyUrl: "https://verify.licence.nsw.gov.au",
    verifyLabel: "NSW Fair Trading licence register",
    licenceTypes: [
      "Motor Vehicle Repairer's Licence",
      "Motor Vehicle Tradesperson's Certificate",
      "Motor Vehicle Recycler's Licence",
      "Motor Dealer's Licence",
      "Other",
    ],
    numberFormat: "MVRL-XXXXX or numeric certificate number",
  },

  VIC: {
    requiresLicence: false,
    hasTradeQual: true,
    licenceName: "Trade Qualification",
    licenceLabel: "Trade Certificate / Qualification",
    licencePlaceholder: "e.g. AUR30620 Certificate III or tafe certificate number",
    licenceHint: "Victoria does not licence individual repairers. Instead, provide your trade qualification (Certificate III in Light Vehicle Mechanical Technology or equivalent) from your training provider.",
    verifyUrl: "https://www.consumer.vic.gov.au/licensing-and-registration/motor-car-traders",
    verifyLabel: "Consumer Affairs VIC register",
    licenceTypes: [
      "Certificate III in Light Vehicle Mechanical Technology (AUR30620)",
      "Certificate III in Heavy Commercial Vehicle Mechanical Technology (AUR30320)",
      "Certificate III in Automotive Body Repair Technology (AUR32120)",
      "Certificate III in Automotive Electrical Technology (AUR30820)",
      "Other Trade Qualification",
    ],
    numberFormat: "Certificate number from your training provider or RTO",
    infoBox: "VIC does not require individual repairers to hold a government licence. We accept your trade qualification certificate instead.",
  },

  QLD: {
    requiresLicence: false,
    hasTradeQual: true,
    licenceName: "Trade Qualification / Certificate",
    licenceLabel: "Trade Certificate Number",
    licencePlaceholder: "e.g. Certificate III number from your RTO",
    licenceHint: "Queensland does not have a dedicated motor vehicle repairer's licence. Provide your trade qualification certificate number from your RTO or TAFE.",
    verifyUrl: "https://www.qld.gov.au/transport/safety/vehicles",
    verifyLabel: "QLD Transport and Main Roads",
    licenceTypes: [
      "Certificate III in Light Vehicle Mechanical Technology (AUR30620)",
      "Certificate III in Heavy Commercial Vehicle Mechanical Technology (AUR30320)",
      "Certificate III in Automotive Body Repair Technology (AUR32120)",
      "Certificate III in Automotive Electrical Technology (AUR30820)",
      "Other Trade Qualification",
    ],
    numberFormat: "Certificate number from your RTO/TAFE",
    infoBox: "QLD does not require a state repairer licence. We use your trade qualification to verify your credentials.",
  },

  WA: {
    requiresLicence: true,
    licenceName: "Motor Vehicle Repairer's Certificate (WA)",
    licenceLabel: "Repairer's Certificate Number",
    licencePlaceholder: "e.g. MVC-XXXXXX",
    licenceHint: "Issued by Consumer Protection WA under the Motor Vehicle Repairers Act 2003. Find it on your certificate card.",
    verifyUrl: "https://www.consumerprotection.wa.gov.au/motor-vehicle-repairers-licensing",
    verifyLabel: "Consumer Protection WA register",
    licenceTypes: [
      "Light Vehicle Work (LVW)",
      "Heavy Vehicle Work (HVW)",
      "Brake Work (BRW)",
      "Air Conditioning Work (ACW)",
      "Auto Electrical Work (AEW)",
      "Body Building Work (BBW)",
      "Panel Beating Work (PBW)",
      "Spray Painting Work (SPW)",
      "Diesel Work (DSW)",
      "Cooling System Work (CSW)",
      "Motor Vehicle Business Licence",
      "Other / Multiple Classes",
    ],
    numberFormat: "Certificate number from Consumer Protection WA",
  },

  SA: {
    requiresLicence: true,
    licenceName: "Motor Vehicle Repairer Registration (SA)",
    licenceLabel: "Registration Number",
    licencePlaceholder: "e.g. MVR-XXXXX",
    licenceHint: "Issued by Consumer and Business Services SA. Required for repairers from 1 December 2023 under the Motor Vehicle Repair Industry Act.",
    verifyUrl: "https://www.sa.gov.au/topics/business-and-trade/licensing/vehicles",
    verifyLabel: "CBS SA licence register",
    licenceTypes: [
      "Motor Vehicle Repairer Registration",
      "Motor Vehicle Repair Business Licence",
      "Second-hand Vehicle Dealer Licence",
      "Other",
    ],
    numberFormat: "Registration number from Consumer & Business Services SA",
  },

  TAS: {
    requiresLicence: true,
    licenceName: "Occupational Licence (TAS)",
    licenceLabel: "Licence Number",
    licencePlaceholder: "e.g. TAS licence number",
    licenceHint: "Tasmania uses mutual recognition with other states. Provide your occupational licence number from Consumer, Building and Occupational Services (CBOS TAS).",
    verifyUrl: "https://www.cbos.tas.gov.au/topics/licensing-and-registration",
    verifyLabel: "CBOS TAS licence register",
    licenceTypes: [
      "Motor Vehicle Repairer Licence",
      "Mutual Recognition Licence (interstate)",
      "Trade Certificate",
      "Other",
    ],
    numberFormat: "Licence number from CBOS Tasmania",
  },

  ACT: {
    requiresLicence: true,
    licenceName: "Motor Vehicle Repairer's Licence (ACT)",
    licenceLabel: "Licence Number",
    licencePlaceholder: "e.g. ACT licence number",
    licenceHint: "Issued by Access Canberra. ACT uses a similar system to NSW. Find your licence number on your Access Canberra licence card.",
    verifyUrl: "https://www.accesscanberra.act.gov.au/licensing-and-regulation",
    verifyLabel: "Access Canberra licence register",
    licenceTypes: [
      "Motor Vehicle Repairer's Licence",
      "Motor Vehicle Tradesperson's Certificate",
      "Other",
    ],
    numberFormat: "Licence number from Access Canberra",
  },

  NT: {
    requiresLicence: false,
    hasTradeQual: true,
    licenceName: "Trade Qualification",
    licenceLabel: "Trade Certificate / ABN Reference",
    licencePlaceholder: "e.g. Certificate III number or trade cert",
    licenceHint: "The Northern Territory does not require mechanics to hold a government repairer's licence. Provide your trade qualification certificate or business ABN as proof of legitimacy.",
    verifyUrl: "https://nt.gov.au/law/rights/repair-and-service-a-vehicle",
    verifyLabel: "NT Consumer Affairs",
    licenceTypes: [
      "Certificate III in Light Vehicle Mechanical Technology",
      "Certificate III in Heavy Commercial Vehicle Mechanical Technology",
      "Other Trade Qualification / ABN Evidence",
    ],
    numberFormat: "Certificate number from your RTO or trade qualification body",
    infoBox: "The NT does not require a repairer's licence. Your trade qualification and ABN are used for verification.",
  },
};

export function getStateConfig(state) {
  return STATE_LICENCE_CONFIG[state] || null;
}