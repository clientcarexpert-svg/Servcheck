// Australia-specific car data — only models officially sold in Australia

export const CAR_MAKES_MODELS = {
  Toyota: ["86", "Alphard", "Aurion", "Avalon", "C-HR", "Camry", "Coaster", "Corolla", "Echo", "Fortuner", "GR86", "GR Corolla", "GR Yaris", "HiAce", "HiAce Commuter", "HiLux", "Kluger", "LandCruiser", "LandCruiser 200 Series", "LandCruiser 70 Series", "MR2", "Paseo", "Prado", "Prius", "Prius C", "Prius V", "RAV4", "Rukus", "Supra", "Tarago", "Vellfire", "Yaris", "Yaris Cross"],
  Mazda: ["BT-50", "CX-3", "CX-30", "CX-5", "CX-60", "CX-7", "CX-8", "CX-9", "Mazda2", "Mazda3", "Mazda6", "MPV", "MX-5", "Premacy", "RX-8", "Tribute", "323", "626"],
  Hyundai: ["Accent", "Elantra", "Getz", "i20", "i30", "i30 N", "i40", "i45", "iLoad", "Ioniq 5", "Ioniq 6", "ix35", "Kona", "Kona Electric", "Santa Fe", "Sonata", "Staria", "Terracan", "Tucson", "Venue"],
  Kia: ["Carnival", "Cerato", "EV6", "EV9", "Magentis", "Mentor", "Niro", "Optima", "Picanto", "Rio", "Seltos", "Sorento", "Sportage", "Stinger"],
  Ford: ["Bronco", "Courier", "Escape", "Everest", "Explorer", "F-250", "Falcon", "Fiesta", "Focus", "Mondeo", "Mustang", "Puma", "Ranger", "Territory", "Territory (BA-SZ)", "Transit"],
  Holden: ["Astra", "Barina", "Caprice", "Captiva", "Colorado", "Commodore", "Cruze", "Equinox", "Frontera", "Jackaroo", "Monaro", "Rodeo", "Spark", "Statesman", "Trax", "Vectra", "Zafira"],
  Mitsubishi: ["380", "ASX", "Carisma", "Colt", "Delica", "Eclipse Cross", "Express", "Galant", "Grandis", "i-MiEV", "Lancer", "Magna", "Mirage", "Outlander", "Pajero", "Pajero Sport", "Sigma", "Space Star", "Starwagon", "Triton", "Verada"],
  Nissan: ["370Z", "Cube", "Dualis", "Elgrand", "Juke", "Lafesta", "Leaf", "Maxima", "Micra", "Murano", "Navara", "Note", "Pathfinder", "Patrol", "Pulsar", "Qashqai", "Serena", "Skyline", "Stagea", "Tiida", "X-Trail"],
  Subaru: ["BRZ", "Crosstrek", "Exiga", "Forester", "Impreza", "Legacy", "Levorg", "Liberty", "Outback", "SVX", "Tribeca", "WRX", "XV"],
  Honda: ["Accord", "City", "Civic", "CR-V", "CR-Z", "Crossroad", "Elysion", "FRV", "Freed", "HR-V", "Integra", "Jazz", "Legend", "NSX", "Odyssey", "Prelude", "Stream", "ZR-V"],
  Volkswagen: ["Amarok", "Caddy", "Crafter", "Golf", "Golf GTI", "Golf R", "ID.4", "ID.5", "Multivan", "Passat", "Polo", "T-Roc", "Tiguan", "Touareg", "Transporter"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "M2", "M3", "M4", "M5", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "iX", "i4", "i5", "i7"],

  Mercedes: ["A-Class", "C-Class", "CLA", "E-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "S-Class", "AMG GT", "EQA", "EQB", "EQC", "EQE", "EQS"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "e-tron GT", "Q2", "Q3", "Q5", "Q7", "Q8", "RS3", "RS6", "TT"],
  Lexus: ["CT", "ES", "GS", "GX", "HS", "IS", "LC", "LS", "LX", "NX", "RC", "RX", "SC", "UX"],
  Isuzu: ["D-Max", "F-Series", "MU-X", "N-Series"],
  Jeep: ["Cherokee", "Compass", "Grand Cherokee", "Renegade", "Wrangler"],
  Suzuki: ["Baleno", "Grand Vitara", "Ignis", "Jimny", "Kizashi", "S-Cross", "Swift", "Vitara"],
  Volvo: ["EX30", "EX40", "EX90", "S60", "S90", "V60", "XC40", "XC60", "XC90"],
  Peugeot: ["2008", "208", "3008", "308", "408", "5008", "508"],
  Renault: ["Arkana", "Captur", "Koleos", "Master", "Megane", "Zoe"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  GWM: ["Haval H6", "Haval Jolion", "Ora", "Tank 300", "Ute"],
  MG: ["HS", "MG4", "MG5", "ZS", "ZST"],
  BYD: ["Atto 3", "Dolphin", "Seal", "Seal U", "Shark"],
  Porsche: ["718 Boxster", "718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  Skoda: ["Karoq", "Kodiaq", "Octavia", "Superb"],
  Cupra: ["Born", "Formentor", "Leon", "Tavascan"],
  "Mercedes-AMG": ["A45", "C63", "E63", "GLC63", "GT"],
  Genesis: ["G70", "G80", "GV60", "GV70", "GV80"],
  Alfa: ["Giulia", "Stelvio", "Tonale"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF"],
  Chery: ["Omoda 5", "Omoda E5", "Tiggo 4 Pro", "Tiggo 7 Pro", "Tiggo 8 Pro"],
  LDV: ["D90", "eDeliver 9", "Mifa 9", "T60", "T60 Max", "Trailrider", "Deliver 9", "G10"],
  RAM: ["1500", "1500 Classic", "1500 TRX", "2500"],
  Dodge: ["Challenger", "Charger", "RAM 1500"],
  Chrysler: ["300C", "Grand Voyager", "Voyager"],
  Fiat: ["500", "500X", "Bravo", "Panda", "Punto", "Tipo"],
  Daihatsu: ["Charade", "Copen", "Move", "Rocky", "Sirion", "Terios", "YRV"],
  SsangYong: ["Actyon", "Korando", "Musso", "Rexton", "Stavic", "Tivoli"],
  "Great Wall": ["Steed", "X200", "X240"],
  SEAT: ["Arona", "Ateca", "Ibiza", "Leon"],
  Polestar: ["2", "3", "4"],
  MINI: ["Clubman", "Convertible", "Cooper", "Cooper S", "Countryman", "Paceman"],
  Haval: ["H2", "H6", "Jolion"],
  Jaecoo: ["J7", "J8"],
  KGM: ["Actyon", "Korando", "Musso", "Rexton", "Tivoli"],
  Mahindra: ["Pik Up", "Scorpio", "XUV300", "XUV700"],
  INEOS: ["Grenadier"],
  Alpine: ["A110"],
  Zeekr: ["001", "009", "X"],
  Foton: ["Tunland G7"],
  Proton: ["X50", "X70"],
  Other: ["Other"],
};

export const CAR_MAKES = Object.keys(CAR_MAKES_MODELS).sort();

// CAR_VARIANTS lives in its own file to stay under line limits
export { CAR_VARIANTS } from './carVariants.js';
import { CAR_VARIANTS as _CV } from './carVariants.js';

// Body styles per model
export const MODEL_BODY_STYLES = {
  "Toyota-86": ["Coupe"], "Toyota-GR86": ["Coupe"], "Toyota-GR Corolla": ["Hatchback"],
  "Toyota-GR Yaris": ["Hatchback"], "Toyota-Aurion": ["Sedan"], "Toyota-C-HR": ["SUV / Crossover"],
  "Toyota-Camry": ["Sedan"], "Toyota-Corolla": ["Sedan", "Hatchback", "Wagon"],
  "Toyota-Fortuner": ["SUV / Crossover"], "Toyota-HiAce": ["Van / People Mover"],
  "Toyota-HiLux": ["Ute / Pickup"], "Toyota-Kluger": ["SUV / Crossover"],
  "Toyota-LandCruiser": ["SUV / Crossover"], "Toyota-LandCruiser 70 Series": ["Ute / Pickup", "SUV / Crossover"],
  "Toyota-Prado": ["SUV / Crossover"], "Toyota-RAV4": ["SUV / Crossover"],
  "Toyota-Tarago": ["Van / People Mover"], "Toyota-Yaris": ["Hatchback"],
  "Toyota-Yaris Cross": ["SUV / Crossover"],
  "Mazda-BT-50": ["Ute / Pickup"], "Mazda-CX-3": ["SUV / Crossover"],
  "Mazda-CX-30": ["SUV / Crossover"], "Mazda-CX-5": ["SUV / Crossover"],
  "Mazda-CX-60": ["SUV / Crossover"], "Mazda-CX-8": ["SUV / Crossover"],
  "Mazda-CX-9": ["SUV / Crossover"], "Mazda-Mazda2": ["Hatchback", "Sedan"],
  "Mazda-Mazda3": ["Hatchback", "Sedan"], "Mazda-Mazda6": ["Sedan", "Wagon"],
  "Mazda-MX-5": ["Convertible"],
  "Hyundai-Accent": ["Sedan"], "Hyundai-Elantra": ["Sedan"],
  "Hyundai-i20": ["Hatchback"], "Hyundai-i30": ["Hatchback", "Sedan", "Wagon"],
  "Hyundai-i30 N": ["Hatchback", "Sedan"], "Hyundai-iLoad": ["Van / People Mover"],
  "Hyundai-Ioniq 5": ["SUV / Crossover"], "Hyundai-Ioniq 6": ["Sedan"],
  "Hyundai-Kona": ["SUV / Crossover"], "Hyundai-Kona Electric": ["SUV / Crossover"],
  "Hyundai-Santa Fe": ["SUV / Crossover"], "Hyundai-Sonata": ["Sedan"],
  "Hyundai-Staria": ["Van / People Mover"], "Hyundai-Tucson": ["SUV / Crossover"],
  "Hyundai-Venue": ["SUV / Crossover"],
  "Kia-Carnival": ["Van / People Mover"], "Kia-Cerato": ["Hatchback", "Sedan"],
  "Kia-EV6": ["SUV / Crossover"], "Kia-Niro": ["SUV / Crossover"],
  "Kia-Picanto": ["Hatchback"], "Kia-Seltos": ["SUV / Crossover"],
  "Kia-Sorento": ["SUV / Crossover"], "Kia-Sportage": ["SUV / Crossover"],
  "Kia-Stinger": ["Sedan"],
  "Ford-Bronco": ["SUV / Crossover"], "Ford-Escape": ["SUV / Crossover"],
  "Ford-Everest": ["SUV / Crossover"], "Ford-Explorer": ["SUV / Crossover"],
  "Ford-Mustang": ["Coupe", "Convertible"], "Ford-Ranger": ["Ute / Pickup"],
  "Ford-Territory": ["SUV / Crossover"], "Ford-Transit": ["Van / People Mover"],
  "Holden-Astra": ["Hatchback", "Sedan"], "Holden-Barina": ["Hatchback"],
  "Holden-Captiva": ["SUV / Crossover"], "Holden-Colorado": ["Ute / Pickup"],
  "Holden-Commodore": ["Sedan", "Wagon", "Ute / Pickup"], "Holden-Cruze": ["Sedan", "Hatchback"],
  "Holden-Equinox": ["SUV / Crossover"], "Holden-Spark": ["Hatchback"],
  "Holden-Trax": ["SUV / Crossover"],
  "Mitsubishi-ASX": ["SUV / Crossover"], "Mitsubishi-Eclipse Cross": ["SUV / Crossover"],
  "Mitsubishi-Express": ["Van / People Mover"], "Mitsubishi-Lancer": ["Sedan", "Hatchback"],
  "Mitsubishi-Mirage": ["Hatchback"], "Mitsubishi-Outlander": ["SUV / Crossover"],
  "Mitsubishi-Pajero": ["SUV / Crossover"], "Mitsubishi-Pajero Sport": ["SUV / Crossover"],
  "Mitsubishi-Triton": ["Ute / Pickup"],
  "Nissan-Juke": ["SUV / Crossover"], "Nissan-Leaf": ["Hatchback"],
  "Nissan-Navara": ["Ute / Pickup"], "Nissan-Pathfinder": ["SUV / Crossover"],
  "Nissan-Patrol": ["SUV / Crossover"], "Nissan-Pulsar": ["Sedan", "Hatchback"],
  "Nissan-Qashqai": ["SUV / Crossover"], "Nissan-X-Trail": ["SUV / Crossover"],
  "Subaru-BRZ": ["Coupe"], "Subaru-Crosstrek": ["SUV / Crossover"],
  "Subaru-Forester": ["SUV / Crossover"], "Subaru-Impreza": ["Hatchback", "Sedan"],
  "Subaru-Levorg": ["Wagon"], "Subaru-Outback": ["SUV / Crossover", "Wagon"],
  "Subaru-WRX": ["Sedan"],
  "Honda-Accord": ["Sedan"], "Honda-City": ["Sedan"],
  "Honda-Civic": ["Sedan", "Hatchback"], "Honda-CR-V": ["SUV / Crossover"],
  "Honda-HR-V": ["SUV / Crossover"], "Honda-Jazz": ["Hatchback"],
  "Honda-Odyssey": ["Van / People Mover"], "Honda-ZR-V": ["SUV / Crossover"],
  "Volkswagen-Amarok": ["Ute / Pickup"], "Volkswagen-Golf": ["Hatchback", "Wagon"],
  "Volkswagen-Golf GTI": ["Hatchback"], "Volkswagen-Golf R": ["Hatchback", "Wagon"],
  "Volkswagen-ID.4": ["SUV / Crossover"], "Volkswagen-ID.5": ["SUV / Crossover"],
  "Volkswagen-Passat": ["Sedan", "Wagon"], "Volkswagen-Polo": ["Hatchback"],
  "Volkswagen-T-Roc": ["SUV / Crossover"], "Volkswagen-Tiguan": ["SUV / Crossover"],
  "Volkswagen-Touareg": ["SUV / Crossover"],
  "BMW-1 Series": ["Hatchback"], "BMW-2 Series": ["Coupe", "Convertible"],
  "BMW-3 Series": ["Sedan", "Wagon"], "BMW-4 Series": ["Coupe", "Convertible"],
  "BMW-5 Series": ["Sedan", "Wagon"], "BMW-7 Series": ["Sedan"],
  "BMW-8 Series": ["Coupe", "Convertible"], "BMW-M2": ["Coupe"],
  "BMW-M3": ["Sedan"], "BMW-M4": ["Coupe", "Convertible"], "BMW-M5": ["Sedan"],
  "BMW-X1": ["SUV / Crossover"], "BMW-X2": ["SUV / Crossover"],
  "BMW-X3": ["SUV / Crossover"], "BMW-X4": ["SUV / Crossover"],
  "BMW-X5": ["SUV / Crossover"], "BMW-X6": ["SUV / Crossover"],
  "BMW-X7": ["SUV / Crossover"], "BMW-iX": ["SUV / Crossover"], "BMW-i4": ["Sedan"],
  "Mercedes-A-Class": ["Hatchback", "Sedan"], "Mercedes-C-Class": ["Sedan", "Wagon"],
  "Mercedes-CLA": ["Sedan"], "Mercedes-E-Class": ["Sedan", "Wagon"],
  "Mercedes-GLA": ["SUV / Crossover"], "Mercedes-GLB": ["SUV / Crossover"],
  "Mercedes-GLC": ["SUV / Crossover"], "Mercedes-GLE": ["SUV / Crossover"],
  "Mercedes-GLS": ["SUV / Crossover"], "Mercedes-S-Class": ["Sedan"],
  "Mercedes-AMG GT": ["Coupe", "Convertible"], "Mercedes-EQA": ["SUV / Crossover"],
  "Mercedes-EQB": ["SUV / Crossover"], "Mercedes-EQC": ["SUV / Crossover"],
  "Mercedes-EQE": ["Sedan"], "Mercedes-EQS": ["Sedan"],
  "Audi-A1": ["Hatchback"], "Audi-A3": ["Hatchback", "Sedan"],
  "Audi-A4": ["Sedan", "Wagon"], "Audi-A5": ["Coupe", "Convertible"],
  "Audi-A6": ["Sedan", "Wagon"], "Audi-A7": ["Sedan"],
  "Audi-A8": ["Sedan"], "Audi-e-tron": ["SUV / Crossover"],
  "Audi-e-tron GT": ["Sedan"], "Audi-Q2": ["SUV / Crossover"],
  "Audi-Q3": ["SUV / Crossover"], "Audi-Q5": ["SUV / Crossover"],
  "Audi-Q7": ["SUV / Crossover"], "Audi-Q8": ["SUV / Crossover"],
  "Audi-RS3": ["Sedan", "Hatchback"], "Audi-RS6": ["Wagon"], "Audi-TT": ["Coupe", "Convertible"],
  "Lexus-ES": ["Sedan"], "Lexus-GX": ["SUV / Crossover"],
  "Lexus-IS": ["Sedan"], "Lexus-LC": ["Coupe", "Convertible"],
  "Lexus-LS": ["Sedan"], "Lexus-LX": ["SUV / Crossover"],
  "Lexus-NX": ["SUV / Crossover"], "Lexus-RC": ["Coupe"],
  "Lexus-RX": ["SUV / Crossover"], "Lexus-UX": ["SUV / Crossover"],
  "Isuzu-D-Max": ["Ute / Pickup"], "Isuzu-MU-X": ["SUV / Crossover"],
  "Jeep-Cherokee": ["SUV / Crossover"], "Jeep-Compass": ["SUV / Crossover"],
  "Jeep-Grand Cherokee": ["SUV / Crossover"], "Jeep-Renegade": ["SUV / Crossover"],
  "Jeep-Wrangler": ["SUV / Crossover"],
  "Suzuki-Ignis": ["SUV / Crossover", "Hatchback"], "Suzuki-Jimny": ["SUV / Crossover"],
  "Suzuki-S-Cross": ["SUV / Crossover"], "Suzuki-Swift": ["Hatchback"],
  "Suzuki-Vitara": ["SUV / Crossover"],
  "Volvo-S60": ["Sedan"], "Volvo-S90": ["Sedan"],
  "Volvo-V60": ["Wagon"], "Volvo-XC40": ["SUV / Crossover"],
  "Volvo-XC60": ["SUV / Crossover"], "Volvo-XC90": ["SUV / Crossover"],
  "Peugeot-2008": ["SUV / Crossover"], "Peugeot-208": ["Hatchback"],
  "Peugeot-3008": ["SUV / Crossover"], "Peugeot-308": ["Hatchback", "Wagon"],
  "Peugeot-408": ["SUV / Crossover"], "Peugeot-5008": ["SUV / Crossover"],
  "Peugeot-508": ["Sedan", "Wagon"],
  "Renault-Arkana": ["SUV / Crossover"], "Renault-Captur": ["SUV / Crossover"],
  "Renault-Koleos": ["SUV / Crossover"], "Renault-Master": ["Van / People Mover"],
  "Renault-Megane": ["Hatchback", "Sedan"], "Renault-Zoe": ["Hatchback"],
  "Tesla-Model 3": ["Sedan"], "Tesla-Model Y": ["SUV / Crossover"],
  "Tesla-Model S": ["Sedan"], "Tesla-Model X": ["SUV / Crossover"],
  "GWM-Haval H6": ["SUV / Crossover"], "GWM-Haval Jolion": ["SUV / Crossover"],
  "GWM-Ora": ["Hatchback"], "GWM-Tank 300": ["SUV / Crossover"], "GWM-Ute": ["Ute / Pickup"],
  "MG-HS": ["SUV / Crossover"], "MG-MG4": ["Hatchback"],
  "MG-ZS": ["SUV / Crossover"], "MG-ZST": ["SUV / Crossover"],
  "BYD-Atto 3": ["SUV / Crossover"], "BYD-Dolphin": ["Hatchback"],
  "BYD-Seal": ["Sedan"], "BYD-Seal U": ["SUV / Crossover"],
  "Porsche-718 Boxster": ["Convertible"], "Porsche-718 Cayman": ["Coupe"],
  "Porsche-911": ["Coupe", "Convertible"], "Porsche-Cayenne": ["SUV / Crossover"],
  "Porsche-Macan": ["SUV / Crossover"], "Porsche-Panamera": ["Sedan"],
  "Porsche-Taycan": ["Sedan", "Wagon"],
  "Land Rover-Defender": ["SUV / Crossover"], "Land Rover-Discovery": ["SUV / Crossover"],
  "Land Rover-Discovery Sport": ["SUV / Crossover"], "Land Rover-Freelander": ["SUV / Crossover"],
  "Land Rover-Range Rover": ["SUV / Crossover"], "Land Rover-Range Rover Evoque": ["SUV / Crossover"],
  "Land Rover-Range Rover Sport": ["SUV / Crossover"], "Land Rover-Range Rover Velar": ["SUV / Crossover"],
  "Skoda-Karoq": ["SUV / Crossover"], "Skoda-Kodiaq": ["SUV / Crossover"],
  "Skoda-Octavia": ["Sedan", "Wagon"], "Skoda-Superb": ["Sedan", "Wagon"],
  "Cupra-Born": ["Hatchback"], "Cupra-Formentor": ["SUV / Crossover"], "Cupra-Leon": ["Hatchback"],
  "Genesis-G70": ["Sedan"], "Genesis-G80": ["Sedan"],
  "Genesis-GV70": ["SUV / Crossover"], "Genesis-GV80": ["SUV / Crossover"],
  "Alfa-Giulia": ["Sedan"], "Alfa-Stelvio": ["SUV / Crossover"], "Alfa-Tonale": ["SUV / Crossover"],
  "Jaguar-E-Pace": ["SUV / Crossover"], "Jaguar-F-Pace": ["SUV / Crossover"],
  "Jaguar-F-Type": ["Coupe", "Convertible"], "Jaguar-I-Pace": ["SUV / Crossover"],
  "Jaguar-XE": ["Sedan"], "Jaguar-XF": ["Sedan", "Wagon"],
  "Chery-Omoda 5": ["SUV / Crossover"], "Chery-Omoda E5": ["SUV / Crossover"],
  "Chery-Tiggo 4 Pro": ["SUV / Crossover"], "Chery-Tiggo 7 Pro": ["SUV / Crossover"], "Chery-Tiggo 8 Pro": ["SUV / Crossover"],
  "LDV-T60": ["Ute / Pickup"], "LDV-T60 Max": ["Ute / Pickup"], "LDV-Trailrider": ["Ute / Pickup"],
  "LDV-D90": ["SUV / Crossover"], "LDV-G10": ["Van / People Mover"],
  "LDV-Deliver 9": ["Van / People Mover"], "LDV-Mifa 9": ["Van / People Mover"], "LDV-eDeliver 9": ["Van / People Mover"],
  "RAM-1500": ["Ute / Pickup"], "RAM-1500 Classic": ["Ute / Pickup"], "RAM-1500 TRX": ["Ute / Pickup"], "RAM-2500": ["Ute / Pickup"],
  "Polestar-2": ["Sedan"], "Polestar-3": ["SUV / Crossover"], "Polestar-4": ["SUV / Crossover"],
  "MINI-Cooper": ["Hatchback"], "MINI-Cooper S": ["Hatchback"], "MINI-Countryman": ["SUV / Crossover"],
  "MINI-Clubman": ["Wagon"], "MINI-Convertible": ["Convertible"], "MINI-Paceman": ["SUV / Crossover"],
  "Haval-H2": ["SUV / Crossover"], "Haval-H6": ["SUV / Crossover"], "Haval-Jolion": ["SUV / Crossover"],
  "Jaecoo-J7": ["SUV / Crossover"], "Jaecoo-J8": ["SUV / Crossover"],
  "KGM-Musso": ["Ute / Pickup"], "KGM-Rexton": ["SUV / Crossover"], "KGM-Tivoli": ["SUV / Crossover"],
  "KGM-Korando": ["SUV / Crossover"], "KGM-Actyon": ["SUV / Crossover"],
  "Mahindra-Pik Up": ["Ute / Pickup"], "Mahindra-Scorpio": ["SUV / Crossover"],
  "Mahindra-XUV300": ["SUV / Crossover"], "Mahindra-XUV700": ["SUV / Crossover"],
  "INEOS-Grenadier": ["SUV / Crossover"],
  "Alpine-A110": ["Coupe"],
  "Zeekr-001": ["Sedan"], "Zeekr-009": ["Van / People Mover"], "Zeekr-X": ["SUV / Crossover"],
  "Foton-Tunland G7": ["Ute / Pickup"],
  "Proton-X50": ["SUV / Crossover"], "Proton-X70": ["SUV / Crossover"],
  "Kia-EV9": ["SUV / Crossover"],
  "Volvo-EX30": ["SUV / Crossover"], "Volvo-EX40": ["SUV / Crossover"], "Volvo-EX90": ["SUV / Crossover"],
  "MG-MG5": ["Sedan"],
  "Genesis-GV60": ["SUV / Crossover"],
  "Cupra-Tavascan": ["SUV / Crossover"],
  "BYD-Shark": ["Ute / Pickup"],
  // Toyota additions
  "Toyota-Prius": ["Hatchback", "Sedan"], "Toyota-Prius C": ["Hatchback"], "Toyota-Prius V": ["Wagon"],
  "Toyota-Supra": ["Coupe"], "Toyota-Alphard": ["Van / People Mover"], "Toyota-Vellfire": ["Van / People Mover"],
  "Toyota-HiAce Commuter": ["Van / People Mover"], "Toyota-Coaster": ["Van / People Mover"],
  "Toyota-LandCruiser 200 Series": ["SUV / Crossover"],
  // Mazda additions
  "Mazda-RX-8": ["Coupe"], "Mazda-323": ["Hatchback", "Sedan"], "Mazda-626": ["Sedan"],
  "Mazda-Premacy": ["Van / People Mover"],
  // Honda additions
  "Honda-NSX": ["Coupe"], "Honda-Prelude": ["Coupe"], "Honda-FRV": ["SUV / Crossover"],
  "Honda-Elysion": ["Van / People Mover"], "Honda-Freed": ["Van / People Mover"],
  // Holden additions
  "Holden-Jackaroo": ["SUV / Crossover"], "Holden-Rodeo": ["Ute / Pickup"],
  "Holden-Frontera": ["SUV / Crossover"], "Holden-Monaro": ["Coupe"],
  "Holden-Statesman": ["Sedan"], "Holden-Caprice": ["Sedan"],
  // Mitsubishi additions
  "Mitsubishi-Starwagon": ["Van / People Mover"], "Mitsubishi-Delica": ["Van / People Mover"],
  "Mitsubishi-Space Star": ["Hatchback"], "Mitsubishi-Grandis": ["Van / People Mover"],
  "Mitsubishi-i-MiEV": ["Hatchback"],
  // Nissan additions
  "Nissan-Skyline": ["Sedan", "Coupe"], "Nissan-Stagea": ["Wagon"],
  "Nissan-Note": ["Hatchback"], "Nissan-Cube": ["Van / People Mover"],
  "Nissan-Elgrand": ["Van / People Mover"], "Nissan-Serena": ["Van / People Mover"],
  // Subaru additions
  "Subaru-Exiga": ["Wagon"], "Subaru-SVX": ["Coupe"],
  // Ford additions
  "Ford-Territory (BA-SZ)": ["SUV / Crossover"], "Ford-Courier": ["Ute / Pickup"],
  "Ford-F-250": ["Ute / Pickup"], "Ford-Puma": ["SUV / Crossover"],
  // Dodge
  "Dodge-Challenger": ["Coupe"], "Dodge-Charger": ["Sedan"], "Dodge-RAM 1500": ["Ute / Pickup"],
  // Chrysler
  "Chrysler-300C": ["Sedan"], "Chrysler-Voyager": ["Van / People Mover"], "Chrysler-Grand Voyager": ["Van / People Mover"],
  // Fiat
  "Fiat-500": ["Hatchback"], "Fiat-500X": ["SUV / Crossover"], "Fiat-Panda": ["Hatchback"],
  "Fiat-Punto": ["Hatchback"], "Fiat-Tipo": ["Hatchback", "Sedan"], "Fiat-Bravo": ["Hatchback"],
  // Daihatsu
  "Daihatsu-Charade": ["Hatchback"], "Daihatsu-Terios": ["SUV / Crossover"],
  "Daihatsu-Sirion": ["Hatchback"], "Daihatsu-Move": ["Hatchback"],
  "Daihatsu-YRV": ["Hatchback"], "Daihatsu-Rocky": ["SUV / Crossover"], "Daihatsu-Copen": ["Convertible"],
  // SsangYong
  "SsangYong-Actyon": ["SUV / Crossover"], "SsangYong-Musso": ["Ute / Pickup"],
  "SsangYong-Rexton": ["SUV / Crossover"], "SsangYong-Tivoli": ["SUV / Crossover"],
  "SsangYong-Korando": ["SUV / Crossover"], "SsangYong-Stavic": ["Van / People Mover"],
  // Great Wall
  "Great Wall-Steed": ["Ute / Pickup"], "Great Wall-X200": ["Ute / Pickup"], "Great Wall-X240": ["SUV / Crossover"],
  // Volkswagen additions
  "Volkswagen-Caddy": ["Van / People Mover"], "Volkswagen-Transporter": ["Van / People Mover"],
  "Volkswagen-Multivan": ["Van / People Mover"], "Volkswagen-Crafter": ["Van / People Mover"],
  // Mercedes additions
  "Mercedes-Vito": ["Van / People Mover"], "Mercedes-Sprinter": ["Van / People Mover"],
  // BMW additions
  "BMW-i5": ["Sedan"], "BMW-i7": ["Sedan"],
  // Lexus additions
  "Lexus-CT": ["Hatchback"], "Lexus-GS": ["Sedan"], "Lexus-HS": ["Sedan"], "Lexus-SC": ["Convertible"],
  // SEAT
  "SEAT-Ateca": ["SUV / Crossover"], "SEAT-Arona": ["SUV / Crossover"],
  "SEAT-Ibiza": ["Hatchback"], "SEAT-Leon": ["Hatchback", "Sedan"],
  // Isuzu additions
  "Isuzu-N-Series": ["Van / People Mover"], "Isuzu-F-Series": ["Van / People Mover"],
};

// Earliest year each make was available in Australia
export const MAKE_FIRST_YEAR = {
  Toyota: 1958, Mazda: 1970, Hyundai: 1986, Kia: 1994, Ford: 1925, Holden: 1948,
  Mitsubishi: 1980, Nissan: 1960, Subaru: 1972, Honda: 1969, Volkswagen: 1953,
  BMW: 1955, Mercedes: 1954, Audi: 1974, Lexus: 1990, Isuzu: 1981,
  Jeep: 1965, Suzuki: 1977, Volvo: 1968, Peugeot: 1971, Renault: 1959,
  Tesla: 2012, GWM: 2021, MG: 2018, BYD: 2022, Porsche: 1987,
  "Land Rover": 1948, Skoda: 2015, Cupra: 2021, "Mercedes-AMG": 2019,
  Genesis: 2021, Alfa: 2017, Jaguar: 2003,
  Chery: 2022, LDV: 2014, RAM: 2019, Polestar: 2021, MINI: 2004,
  Haval: 2015, Jaecoo: 2024, KGM: 2007, Mahindra: 2014,
  INEOS: 2023, Alpine: 2019, Zeekr: 2024, Foton: 2023, Proton: 2022,
  Dodge: 2010, Chrysler: 2004, Fiat: 2008, Daihatsu: 1983, SsangYong: 2004,
  "Great Wall": 2012, SEAT: 2016,
  Other: 1950,
};

// Returns raw variant strings WITH year ranges intact
export const getRawVariantsForYear = (make, model, year) => {
  if (!make || !model) return [];
  const raw = _CV[`${make}-${model}`];
  if (!raw || raw.length === 0) return [];
  const yr = parseInt(year) || 0;
  if (!yr) return raw;
  return raw.filter(v => {
    const match = v.match(/(\d{4})-(\d{4})/);
    if (!match) return true;
    return yr >= parseInt(match[1]) && yr <= parseInt(match[2]);
  });
};

export const getVariants = (make, model, year) => {
  const raw = getRawVariantsForYear(make, model, year);
  if (raw.length === 0) return [];
  return raw.map(v => v.replace(/\s*\(\d{4}-\d{4}\)/g, "").trim());
};

// Makes where ALL models are purely electric
const PURE_EV_MAKES = new Set(["Tesla", "Polestar", "Zeekr"]);

// Specific models that are purely electric (no petrol/diesel variant)
const PURE_EV_MODELS = new Set([
  "Nissan-Leaf",
  "Kia-EV6", "Kia-EV9",
  "Hyundai-Ioniq 5", "Hyundai-Ioniq 6", "Hyundai-Kona Electric",
  "Volkswagen-ID.4", "Volkswagen-ID.5",
  "BMW-iX", "BMW-i4", "BMW-i5", "BMW-i7",
  "Mercedes-EQA", "Mercedes-EQB", "Mercedes-EQC", "Mercedes-EQE", "Mercedes-EQS",
  "Audi-e-tron", "Audi-e-tron GT",
  "Jaguar-I-Pace",
  "MG-MG4", "MG-MG5",
  "BYD-Atto 3", "BYD-Dolphin", "BYD-Seal",
  "GWM-Ora",
  "Renault-Zoe",
  "Cupra-Born", "Cupra-Tavascan",
  "Volvo-EX30", "Volvo-EX40", "Volvo-EX90",
  "Genesis-GV60",
  "Chery-Omoda E5",
  "LDV-Mifa 9", "LDV-eDeliver 9",
  "Porsche-Taycan",
]);

// Derive fuel types STRICTLY from the filtered variant strings
export const getAvailableFuelTypes = (make, model, year) => {
  if (PURE_EV_MAKES.has(make) || PURE_EV_MODELS.has(`${make}-${model}`)) {
    return ["Electric", "Other / Not Listed"];
  }

  const variants = getRawVariantsForYear(make, model, year);
  if (variants.length === 0) return ["Petrol", "Diesel", "Hybrid", "Plug-in Hybrid (PHEV)", "Electric", "Other / Not Listed"];

  const fuels = new Set();

  variants.forEach(v => {
    const u = v.toUpperCase();

    const isElectric = /\d+(\.\d+)?\s*KWH|\bBEV\b|\bELECTRIC\b|\bRECHARGE\b|\bEV\b/.test(u) && !/PHEV|PLUG.IN|E-HYBRID/.test(u);
    const isPHEV = /PHEV|PLUG.IN|E-HYBRID|4XE/.test(u);
    const isFullHybrid = /\bHYBRID\b|E-BOXER|E-POWER|E-TECH|E:HEV|STRONG HYBRID|E-SKYACTIV/.test(u) && !isPHEV && !/\bMHEV\b/.test(u);
    const isDiesel = /DIESEL|\bTDI\b|\bTDCI\b|\bDCI\b|\bCRDI\b|\bHDI\b|BLUEHDI|\bSDV\b|\bTDV\b|DPTS|SH-V|4JJ|4JK|4JH|YD25|ZD30|1KD|2KD|1GD|2GD|4M41|D4HB|D4HA|4N15\sDIESEL|D200|D165|D300|D350|ECODIESEL|4JJ3|D4FB|D4FE|M9R|R9M|YD22/.test(u);

    if (isElectric) { fuels.add("Electric"); return; }
    if (isPHEV) { fuels.add("Plug-in Hybrid (PHEV)"); return; }
    if (isFullHybrid) { fuels.add("Hybrid"); return; }
    if (isDiesel) { fuels.add("Diesel"); return; }
    fuels.add("Petrol");
  });

  const order = ["Petrol", "Diesel", "Hybrid", "Plug-in Hybrid (PHEV)", "Electric"];
  const result = order.filter(f => fuels.has(f));
  return result.length > 0 ? [...result, "Other / Not Listed"] : ["Petrol", "Other / Not Listed"];
};

const MAKE_TRANS_LABELS = {
  Audi:           { auto: "S tronic / Tiptronic (Auto)", dct: "S tronic (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  BMW:            { auto: "Steptronic (Automatic)", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Mercedes:       { auto: "9G-Tronic (Automatic)", dct: null, manual: "Manual", cvt: null, ecvt: null },
  "Mercedes-AMG": { auto: "Automatic", dct: "Speedshift MCT", manual: "Manual", cvt: null, ecvt: null },
  Porsche:        { auto: "PDK (Dual-Clutch)", dct: "PDK (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Volkswagen:     { auto: "DSG Automatic", dct: "DSG (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Skoda:          { auto: "DSG Automatic", dct: "DSG (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Cupra:          { auto: "DSG Automatic", dct: "DSG (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Volvo:          { auto: "Geartronic (Automatic)", dct: null, manual: "Manual", cvt: null, ecvt: null },
  "Land Rover":   { auto: "ZF 8-Speed Auto", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Toyota:         { auto: "Automatic", dct: null, manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
  Lexus:          { auto: "Automatic", dct: null, manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
  Honda:          { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
  Mazda:          { auto: "Automatic", dct: null, manual: "Manual", cvt: "CVT", ecvt: null },
  Subaru:         { auto: "Automatic", dct: null, manual: "Manual", cvt: "Lineartronic CVT", ecvt: "e-CVT (Hybrid)" },
  Nissan:         { auto: "Automatic", dct: null, manual: "Manual", cvt: "Xtronic CVT", ecvt: "e-Power CVT" },
  Mitsubishi:     { auto: "Automatic", dct: null, manual: "Manual", cvt: "CVT", ecvt: null },
  Hyundai:        { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
  Kia:            { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
  Suzuki:         { auto: "Automatic", dct: null, manual: "Manual", cvt: "CVT", ecvt: "MHEV Auto" },
  Ford:           { auto: "Automatic", dct: "PowerShift (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Holden:         { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Isuzu:          { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Jeep:           { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Renault:        { auto: "EDC Automatic", dct: "EDC (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
  Peugeot:        { auto: "EAT8 Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Tesla:          { auto: "Single Speed (EV)", dct: null, manual: null, cvt: null, ecvt: null },
  GWM:            { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: null },
  MG:             { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: null },
  BYD:            { auto: "Single Speed (EV)", dct: "DM-i eCVT (PHEV)", manual: null, cvt: null, ecvt: null },
  Genesis:        { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: null },
  Alfa:           { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Jaguar:         { auto: "ZF 8-Speed Auto", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Chery:          { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: null },
  LDV:            { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  RAM:            { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Polestar:       { auto: "Single Speed (EV)", dct: null, manual: null, cvt: null, ecvt: null },
  MINI:           { auto: "Automatic", dct: "Steptronic Sport (DCT)", manual: "Manual", cvt: null, ecvt: null },
  Haval:          { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: "CVT", ecvt: null },
  Jaecoo:         { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  KGM:            { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Mahindra:       { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  INEOS:          { auto: "ZF 8-Speed Auto", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Alpine:         { auto: "PDK (Dual-Clutch)", dct: "PDK (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Zeekr:          { auto: "Single Speed (EV)", dct: null, manual: null, cvt: null, ecvt: null },
  Foton:          { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Proton:         { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Dodge:          { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Chrysler:       { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  Fiat:           { auto: "Automatic", dct: "DCT (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  Daihatsu:       { auto: "Automatic", dct: null, manual: "Manual", cvt: "CVT", ecvt: null },
  SsangYong:      { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  "Great Wall":   { auto: "Automatic", dct: null, manual: "Manual", cvt: null, ecvt: null },
  SEAT:           { auto: "DSG Automatic", dct: "DSG (Dual-Clutch)", manual: "Manual", cvt: null, ecvt: null },
  _default:       { auto: "Automatic", dct: "Dual-Clutch (DCT)", manual: "Manual", cvt: "CVT", ecvt: "e-CVT (Hybrid)" },
};

const NO_MANUAL_MODELS = {
  "BMW-7 Series": 0, "BMW-X5": 0, "BMW-X6": 0, "BMW-X7": 0, "BMW-X3": 2018, "BMW-X4": 0,
  "BMW-5 Series": 2018, "BMW-iX": 0, "BMW-i4": 0, "BMW-8 Series": 0,
  "Mercedes-S-Class": 0, "Mercedes-E-Class": 2016, "Mercedes-GLE": 0, "Mercedes-GLS": 0,
  "Mercedes-GLC": 0, "Mercedes-EQA": 0, "Mercedes-EQB": 0, "Mercedes-EQC": 0, "Mercedes-EQE": 0, "Mercedes-EQS": 0,
  "Audi-A6": 0, "Audi-A7": 0, "Audi-A8": 0, "Audi-Q5": 0, "Audi-Q7": 0, "Audi-Q8": 0,
  "Audi-e-tron": 0, "Audi-e-tron GT": 0, "Audi-RS6": 0,
  "Lexus-IS": 0, "Lexus-ES": 0, "Lexus-GS": 0, "Lexus-LS": 0, "Lexus-NX": 0,
  "Lexus-RX": 0, "Lexus-GX": 0, "Lexus-LX": 0, "Lexus-LC": 0, "Lexus-UX": 0, "Lexus-RC": 0,
  "Land Rover-Range Rover": 0, "Land Rover-Range Rover Sport": 0, "Land Rover-Discovery": 0,
  "Land Rover-Range Rover Velar": 0, "Land Rover-Range Rover Evoque": 0,
  "Volvo-S90": 0, "Volvo-XC90": 0, "Volvo-XC60": 0, "Volvo-XC40": 0,
  "Porsche-Cayenne": 0, "Porsche-Taycan": 0, "Porsche-Panamera": 0,
  "Jeep-Grand Cherokee": 0, "Jeep-Cherokee": 0,
  "Toyota-LandCruiser": 0, "Toyota-LandCruiser 70 Series": 0, "Toyota-Kluger": 0, "Toyota-Tarago": 0,
  "Toyota-HiAce": 2019, "Toyota-RAV4": 2013, "Toyota-C-HR": 0, "Toyota-Yaris Cross": 0,
  "Nissan-Patrol": 2013, "Nissan-Pathfinder": 0, "Nissan-Qashqai": 2021, "Nissan-Leaf": 0,
  "Hyundai-Santa Fe": 0, "Hyundai-Staria": 0, "Hyundai-Ioniq 5": 0, "Hyundai-Ioniq 6": 0,
  "Hyundai-Kona Electric": 0,
  "Kia-Sorento": 0, "Kia-Carnival": 0, "Kia-EV6": 0, "Kia-Niro": 0,
  "Mitsubishi-Pajero": 2010, "Mitsubishi-Pajero Sport": 0, "Mitsubishi-Outlander": 2013,
  "Mitsubishi-Eclipse Cross": 0, "Mitsubishi-ASX": 2013,
  "Isuzu-MU-X": 0,
  "Ford-Escape": 0, "Ford-Everest": 2022, "Ford-Explorer": 0, "Ford-Territory": 0,
  "Tesla-Model 3": 0, "Tesla-Model Y": 0, "Tesla-Model S": 0, "Tesla-Model X": 0,
  "BYD-Atto 3": 0, "BYD-Dolphin": 0, "BYD-Seal": 0, "BYD-Seal U": 0,
  "GWM-Ora": 0, "Genesis-GV80": 0, "Genesis-G80": 0,
  "Jaguar-I-Pace": 0, "Alfa-Tonale": 0,
  "Polestar-2": 0, "Polestar-3": 0, "Polestar-4": 0,
  "Zeekr-001": 0, "Zeekr-009": 0, "Zeekr-X": 0,
  "LDV-Mifa 9": 0, "LDV-eDeliver 9": 0,
  "Chery-Omoda E5": 0,
  "Kia-EV9": 0,
  "Volvo-EX30": 0, "Volvo-EX40": 0, "Volvo-EX90": 0,
  "MG-MG5": 0,
  "Genesis-GV60": 0,
  "Cupra-Tavascan": 0,
};

export const getAvailableTransmissions = (make, model, year, fuelType) => {
  if (fuelType === "Electric") return ["Single Speed (EV)", "Other / Not Listed"];
  const labels = MAKE_TRANS_LABELS[make] || MAKE_TRANS_LABELS._default;

  if (PURE_EV_MAKES.has(make) || PURE_EV_MODELS.has(`${make}-${model}`)) {
    return ["Single Speed (EV)", "Other / Not Listed"];
  }

  const isHybrid = fuelType === "Hybrid";
  const isPHEV = fuelType === "Plug-in Hybrid (PHEV)";
  const yr = parseInt(year) || 2015;

  if (isHybrid) {
    const result = labels.ecvt ? [labels.ecvt] : [labels.auto];
    if (labels.auto && !result.includes(labels.auto)) result.push(labels.auto);
    result.push("Other / Not Listed");
    return [...new Set(result)];
  }

  if (isPHEV) {
    const result = [labels.auto];
    if (labels.ecvt) result.push(labels.ecvt);
    result.push("Other / Not Listed");
    return [...new Set(result)];
  }

  const modelKey = `${make}-${model}`;
  const noManualSince = NO_MANUAL_MODELS[modelKey];
  const modelNeverHadManual = noManualSince !== undefined && (noManualSince === 0 || yr >= noManualSince);

  const variants = getRawVariantsForYear(make, model, year);
  const trans = new Set();

  if (labels.auto) trans.add(labels.auto);

  if (variants.length > 0) {
    variants.forEach(v => {
      const u = v.toUpperCase();
      if (/\bCVT\b|LINEARTRONIC|XTRONIC/.test(u) && labels.cvt) trans.add(labels.cvt);
      if (/\bDCT\b|\bDSG\b|S.TRONIC|PDK|POWERSHIFT|EDC\b|DUAL.CLUTCH/.test(u) && labels.dct) trans.add(labels.dct);
    });
  } else {
    if (labels.dct) trans.add(labels.dct);
    if (labels.cvt) trans.add(labels.cvt);
  }

  if (!modelNeverHadManual && labels.manual) {
    trans.add(labels.manual);
  }

  trans.add("Other / Not Listed");
  return [...trans];
};