import { useState, useRef, useEffect } from "react";
import { deductCredit, refundCredit } from "@/lib/credits";
import { scheduleServiceFollowUp } from "@/lib/notifications";
import SubscriptionModal from "@/components/SubscriptionModal";
import GuestGate from "@/components/GuestGate";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Camera, Upload, X, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { SUBURBS_BY_STATE } from '@/lib/suburbs';
import { useAuth } from "@/lib/AuthContext";
import { registerPricingQueueItem } from "@/lib/notifications";
import { CAR_MAKES_MODELS, CAR_MAKES, CAR_VARIANTS, getRawVariantsForYear, getVariants, getAvailableFuelTypes, getAvailableTransmissions, MAKE_FIRST_YEAR } from "@/lib/carData";
import { isCappedServiceMake, hasHighVarianceWarning, getRegionalMultiplier, PREMIUM_BRANDS } from "@/lib/pricingUtils";

// Car data is imported from lib/carData.js (single source of truth)

const _deadData = {
  "Hyundai-i30": [],
  "Hyundai-i30N": ["2.0L Turbo G4KH (2018-2025)"],
  "Hyundai-Elantra": ["2.0L G4GC (2001-2006)","1.6L G4FC (2007-2010)","2.0L G4KD MPI (2011-2015)","2.0L G4KD GDI (2016-2020)","1.6L G4FG GDI (2016-2020)","1.5L Turbo G4LJ (2021-2025)","2.0L G4NC (2021-2025)"],
  "Hyundai-Sonata": ["2.0L G4KA (2001-2010)","2.4L G4KE (2005-2019)","2.0L Turbo G4NC (2015-2019)","1.6L Turbo G4FJ (2020-2025)","2.0L G4NC (2020-2025)","2.0L Hybrid G4FQ (2020-2025)"],
  "Hyundai-Tucson": ["2.0L G4GC (2004-2015)","2.7L G6BA V6 (2004-2009)","1.6L Turbo G4FJ (2015-2021)","2.0L Diesel D4HA (2015-2020)","1.6L Turbo G4FJ (2021-2025)","1.6L Hybrid G4FN (2021-2025)","1.6L PHEV G4FN (2021-2025)"],
  "Hyundai-Santa Fe": ["2.4L G4JS (2001-2006)","2.7L G6BA V6 (2001-2006)","2.2L Diesel D4EB (2006-2012)","2.0L Turbo G4NC (2012-2018)","2.2L Diesel D4HB (2012-2025)","3.3L V6 G6DC (2012-2018)","2.4L G4KE (2018-2025)","1.6L Hybrid T-GDI (2020-2025)","1.6L PHEV T-GDI (2021-2025)"],
  "Hyundai-Kona": ["2.0L G4NK MPI (2017-2023)","1.6L G4FJ Turbo (2017-2023)","1.0L T-GDI (2017-2023)","64 kWh Electric (2018-2025)","1.6L Hybrid G4FN (2023-2025)"],
  "Hyundai-Venue": ["1.6L G4FM (2019-2025)","1.0L T-GDI G3LE (2019-2025)"],
  "Hyundai-Staria": ["3.5L G6DC V6 (2021-2025)","2.2L Diesel D4HB (2021-2025)"],
  "Hyundai-iLoad": ["2.5L G6BV V6 (2008-2015)","2.4L G4KG (2015-2022)"],
  "Kia-Picanto": ["1.0L G4HE (2004-2011)","1.1L G4HG (2004-2011)","1.0L G4HC (2011-2017)","1.2L G4LA (2011-2017)","1.0L 3-cyl G3LD (2017-2025)","1.2L 4-cyl G4LA (2017-2025)"],
  "Kia-Rio": ["1.5L A5D (2000-2011)","1.4L G4FA (2011-2021)","1.6L G4FC (2011-2021)","1.0L T-GDI G3LD (2021-2025)","1.4L G4LC (2021-2025)"],
  "Kia-Cerato": ["1.6L G4ED (2004-2009)","2.0L G4KD (2004-2013)","1.6L G4FG GDI (2013-2021)","2.0L G4NC GDI (2013-2021)"],
  "Kia-Stinger": ["2.0L Turbo G4KH (2017-2023)","3.3L V6 Twin Turbo G6DP (2017-2023)"],
  "Kia-Sportage": ["2.0L G4GC (2005-2010)","2.0L G4KD (2010-2021)","2.0L Diesel D4HA (2010-2021)","1.6L Turbo G4FJ (2016-2021)","1.6L Turbo G4FN (2021-2025)","1.6L Hybrid T-GDI (2022-2025)","1.6L PHEV T-GDI (2022-2025)"],
  "Kia-Sorento": ["3.5L V6 G6CU (2002-2009)","2.5L Diesel D4CB (2002-2009)","2.4L G4KE (2009-2020)","3.3L V6 (2009-2020)","2.2L Diesel D4HB (2009-2025)","2.5L MPI G4KH (2020-2025)","1.6L Hybrid T-GDI (2021-2025)","1.6L PHEV T-GDI (2021-2025)"],
  "Kia-Carnival": ["2.9L CRDI Diesel (2006-2014)","3.5L V6 G6CU (2006-2020)","2.2L Diesel D4HB (2015-2020)","3.5L V6 G6DK (2021-2025)","1.6L Hybrid T-GDI (2021-2025)"],
  "Kia-Seltos": ["2.0L G4NC MPI (2019-2025)","1.6L G4FJ Turbo (2019-2025)"],
  "Kia-EV6": ["58 kWh Standard Range (2021-2025)","77.4 kWh Long Range RWD (2021-2025)","77.4 kWh Long Range AWD (2021-2025)","77.4 kWh GT (2022-2025)"],
  "Ford-Fiesta": ["1.3L Duratec (2002-2008)","1.6L Duratec (2002-2008)","1.0L EcoBoost (2013-2019)","1.5L TDCi Diesel (2013-2019)"],
  "Ford-Focus": ["2.0L Duratec (1999-2011)","2.5L Turbo ST (2005-2011)","1.6L EcoBoost (2011-2018)","2.0L Duratec (2011-2018)","1.5L EcoBoost (2018-2022)"],
  "Ford-Mustang": ["4.6L V8 (2005-2014)","5.0L V8 Coyote (2015-2025)","2.3L EcoBoost (2015-2025)"],
  "Ford-Ranger": ["2.5L Duratec Petrol (2006-2011)","3.0L Diesel (2006-2011)","2.2L TDCi (2011-2022)","3.2L TDCi (2011-2022)","2.0L EcoBlue TDCi (2019-2025)","3.0L V6 EcoBoost (2022-2025)"],
  "Ford-Everest": ["2.5L TDCi (2004-2015)","2.2L TDCi (2015-2022)","3.2L TDCi (2015-2022)","2.0L EcoBlue Diesel (2019-2025)","3.0L V6 EcoBoost (2022-2025)"],
  "Ford-Escape": ["2.3L Duratec (2001-2012)","3.0L V6 (2001-2012)","1.6L EcoBoost (2013-2019)","2.0L EcoBoost (2013-2025)","1.5L EcoBoost (2020-2025)"],
  "Ford-Transit": ["2.0L TDCi (2000-2014)","2.2L TDCi (2006-2014)","2.0L EcoBlue TDCi (2014-2025)"],
  "Ford-Bronco": ["2.3L EcoBoost (2021-2025)","2.7L V6 EcoBoost (2021-2025)"],
  "Ford-Explorer": ["4.0L V6 (2002-2010)","3.5L V6 (2011-2019)","2.0L EcoBoost (2011-2019)","3.0L EcoBoost (2020-2025)","2.3L EcoBoost (2020-2025)"],
  "Ford-F-150": ["4.6L V8 Triton (1997-2010)","5.4L V8 Triton (1997-2010)","5.0L V8 Coyote (2011-2025)","3.5L V6 EcoBoost (2011-2025)","2.7L V6 EcoBoost (2015-2025)"],
  "Holden-Commodore": ["3.8L Ecotec V6 (1997-2006)","5.7L LS1 V8 (1999-2006)","6.0L LS2 V8 (2006-2010)","3.6L V6 (2006-2017)","6.0L LS3 V8 (2010-2013)","6.2L LSA V8 (2012-2017)","1.5L Turbo Imported (2018-2020)","2.0L Turbo Imported (2018-2020)"],
  "Holden-Astra": ["1.8L Z18XE (1999-2004)","2.2L Z22SE (1999-2004)","1.8L Z18XER (2004-2009)","2.0T Z20LET (2004-2009)","1.4L A14NET Turbo (2010-2015)","1.6L A16XER (2010-2015)","1.4L LV7 Turbo (2016-2021)"],
  "Holden-Colorado": ["2.4L 4JH1 (2008-2012)","3.0L 4JJ1 Diesel (2008-2012)","2.8L 4JJ1-TC Diesel (2012-2020)","2.5L LPH Petrol (2012-2020)"],
  "Holden-Trax": ["1.4L Turbo (2013-2017)","1.8L (2013-2017)","1.4L Turbo LV7 (2017-2022)"],
  "Holden-Equinox": ["1.5L Turbo LYX (2018-2021)","2.0L Turbo LTG (2018-2021)"],
  "Holden-Captiva": ["2.4L LE9 (2006-2018)","3.2L V6 LY7 (2006-2013)","2.0L Diesel Z20DMH (2006-2017)","2.2L Diesel Z22D1 (2013-2018)"],
  "Holden-Cruze": ["1.8L 2H0 (2009-2016)","1.6L LXT Turbo (2011-2016)","1.6L LVL Diesel (2011-2016)"],
  "Holden-Barina": ["1.6L Z16XE (2001-2005)","1.4L A14NEL (2011-2018)","1.6L A16XHT (2011-2018)"],
  "Holden-Spark": ["1.0L LMT (2010-2015)","1.4L LDD (2015-2021)"],
  "Mitsubishi-Mirage": ["1.3L G13B (1991-2003)","1.5L G15B (1991-2003)","1.2L 3A92 (2012-2025)"],
  "Mitsubishi-Lancer": ["1.5L 4A91 (2007-2017)","2.0L 4B11 (2007-2017)","2.0L 4B11 Turbo Evo (2006-2016)"],
  "Mitsubishi-Eclipse Cross": ["1.5L 4B40 Turbo (2017-2025)","2.4L PHEV 4N14 (2021-2025)"],
  "Mitsubishi-Outlander": ["2.4L 4G64 (2003-2012)","3.0L 6B31 V6 (2007-2020)","2.0L 4J11 (2012-2021)","2.4L 4B12 (2012-2021)","2.4L PHEV 4N14 (2014-2025)","2.5L 4N15 (2021-2025)"],
  "Mitsubishi-ASX": ["1.8L 4B10 (2010-2016)","2.0L 4B11 (2010-2022)","1.6L 4A92 Diesel (2010-2022)"],
  "Mitsubishi-Triton": ["2.5L 4D56 Diesel (2005-2015)","3.2L 4M41 Diesel (2006-2015)","2.4L 4N15 Diesel (2015-2025)","2.4L 4N15 Petrol (2015-2025)"],
  "Mitsubishi-Pajero": ["3.5L 6G74 V6 (1994-2021)","3.8L 6G75 V6 (2006-2021)","3.2L 4M41 Diesel (2000-2021)"],
  "Mitsubishi-Pajero Sport": ["3.0L 6G72 V6 (1999-2008)","2.5L 4D56 Diesel (1999-2015)","3.2L 4M41 Diesel (2008-2015)","2.4L 4N15 Diesel (2015-2025)","3.0L 6B31 V6 (2015-2025)"],
  "Mitsubishi-Express": ["2.4L 4G64 (1999-2013)","2.4L 4B12 (2013-2022)"],
  "Nissan-Micra": ["1.3L CG13DE (1992-2003)","1.0L CG10DE (2003-2010)","1.2L HR12DE (2010-2017)","0.9L IG-T (2017-2023)"],
  "Nissan-Pulsar": ["1.6L SR20DE (1995-2006)","2.0L SR20DE (1995-2006)","1.6L HR16 (2012-2018)","1.8L MR18 (2012-2018)"],
  "Nissan-Altima": ["2.4L KA24DE (1993-2001)","2.5L QR25DE (2001-2018)","3.5L VQ35DE V6 (2001-2018)"],
  "Nissan-Maxima": ["3.0L VQ30DE V6 (1995-2003)","3.5L VQ35DE V6 (2003-2023)"],
  "Nissan-X-Trail": ["2.0L QR20DE (2001-2007)","2.5L QR25DE (2001-2014)","2.0L MR20DE (2007-2022)","1.6L R9M Diesel (2014-2022)","1.5L e-Power Hybrid (2022-2025)"],
  "Nissan-Qashqai": ["1.5L K9K dCi Diesel (2007-2021)","2.0L MR20DE (2007-2014)","1.2L HRA2DDT (2014-2021)","1.3L DIG-T (2021-2025)","1.5L e-Power Hybrid (2022-2025)"],
  "Nissan-Juke": ["1.5L K9K Diesel (2010-2020)","1.6L HR16DE (2010-2019)","1.6L MR16DDT Turbo (2010-2019)","1.0L IG-T Turbo (2019-2025)","1.6L Hybrid (2022-2025)"],
  "Nissan-Navara": ["2.4L KA24E (1997-2005)","3.3L VG33E V6 (1997-2005)","2.5L YD25DDTi Diesel (2005-2015)","4.0L VQ40DE V6 (2005-2015)","2.3L dCi Diesel (2015-2025)","2.5L QR25DE Petrol (2015-2021)"],
  "Nissan-Patrol": ["4.5L TB45E (1997-2000)","4.8L TB48DE (2001-2012)","3.0L ZD30DD Diesel (1997-2012)","5.6L VK56VD V8 (2010-2025)","4.0L VQ40DE V6 (2010-2025)"],
  "Nissan-Pathfinder": ["3.3L VQ33 V6 (1996-2004)","4.0L VQ40DE V6 (2005-2013)","2.5L YD25 Diesel (2005-2013)","3.5L VQ35DD V6 (2013-2025)"],
  "Nissan-Leaf": ["24 kWh EV (2010-2016)","30 kWh EV (2016-2018)","40 kWh EV (2018-2024)","62 kWh EV Plus (2019-2025)"],
  "Subaru-Impreza": ["1.6L EJ16E (1993-2000)","2.0L EJ20 (1993-2011)","1.5L EJ15 (2000-2007)","2.0L FB20B (2011-2023)","2.0L e-Boxer Hybrid (2020-2023)"],
  "Subaru-WRX": ["2.0L EJ20 Turbo (1994-2014)","2.5L EJ257 Turbo STi (2004-2021)","2.0L FA20DIT Turbo (2014-2021)","2.4L FA24 Turbo (2022-2025)"],
  "Subaru-BRZ": ["2.0L FA20D (2012-2021)","2.4L FA24D (2021-2025)"],
  "Subaru-Outback": ["2.2L EJ22E (1994-1999)","2.5L EJ25 (2000-2020)","3.0L EZ30 H6 (1999-2009)","3.6L EZ36 H6 (2009-2020)","2.5L FB25D (2020-2025)","2.5L e-Boxer Hybrid (2021-2025)"],
  "Subaru-Forester": ["2.0L EJ20 (1997-2012)","2.5L EJ25 (2002-2018)","2.0L FB20 (2012-2022)","2.5L FB25D (2022-2025)","2.0L e-Boxer Hybrid (2019-2025)"],
  "Subaru-XV": ["2.0L FB20B (2012-2017)","2.0L FB20D (2017-2023)","2.0L e-Boxer Hybrid (2019-2023)"],
  "Subaru-Liberty": ["2.5L EJ25 (1998-2014)","3.0L EZ30 H6 (2000-2009)","3.6L EZ36 H6 (2009-2014)"],
  "Subaru-Levorg": ["1.6L FA16 Turbo (2014-2020)","2.0L FA20 Turbo (2014-2020)","1.8L CB18 Turbo (2020-2025)"],
  "Honda-Jazz": ["1.3L L13A (2001-2008)","1.5L L15A (2001-2008)","1.2L L12B (2008-2015)","1.5L L15B (2008-2020)","1.3L L13Z Hybrid (2011-2020)","1.5L L15C Hybrid (2020-2025)"],
  "Honda-City": ["1.3L L13Z (2008-2014)","1.5L L15Z (2008-2020)","1.5L DOHC Vtec (2020-2025)","1.5L Hybrid (2020-2025)"],
  "Honda-Civic": ["1.5L D15B (1995-2001)","1.7L D17A (2001-2006)","2.0L K20A3 (2001-2006)","1.8L R18A (2006-2015)","2.0L K20Z3 Si (2006-2015)","1.5L L15B Turbo (2015-2022)","2.0L K24 (2015-2022)","2.0L Type R K20C1 (2017-2025)","1.5L L15CA Turbo (2022-2025)","2.0L e:HEV Hybrid (2022-2025)"],
  "Honda-Accord": ["2.2L F22B (1993-1997)","2.3L F23A (1998-2002)","2.4L K24A (2003-2017)","3.5L J35Z V6 (2003-2017)","1.5L Turbo (2018-2025)","2.0L Turbo (2018-2025)","2.0L Hybrid (2018-2025)"],
  "Honda-HR-V": ["1.5L L15B (2014-2021)","1.8L R18A (2014-2021)","1.5L L15CA Turbo (2021-2025)","1.5L e:HEV Hybrid (2021-2025)"],
  "Honda-CR-V": ["2.0L B20B (1997-2001)","2.0L K20A (2001-2006)","2.4L K24A (2007-2017)","1.5L L15 Turbo (2017-2025)","2.0L Hybrid (2018-2025)"],
  "Honda-Odyssey": ["2.2L F22B (1995-1999)","2.3L F23A (1999-2004)","3.5L J35A V6 (2004-2010)","2.4L K24Z (2011-2021)","3.5L J35Y V6 (2011-2021)"],
  "Volkswagen-Polo": ["1.4L AUA (2000-2009)","1.6L BSE (2000-2009)","1.2L CBZB TSI (2009-2014)","1.2L EA211 TSI (2014-2022)","1.0L TSI (2017-2025)","1.5L TSI (2020-2025)"],
  "Volkswagen-Golf": ["1.8L Turbo (1998-2013)","2.0L (1998-2013)","1.6L TDI (2009-2019)","2.0L TDI (2004-2019)","1.4L EA211 TSI (2013-2019)","1.5L eTSI (2019-2025)","2.0L TDI (2019-2025)","1.4L eHybrid PHEV (2020-2025)"],
  "Volkswagen-Golf GTI": ["2.0L TFSI EA113 (2004-2013)","2.0L TFSI EA888 (2013-2025)"],
  "Volkswagen-Golf R": ["2.0L TFSI (2010-2025)"],
  "Volkswagen-Passat": ["1.8L Turbo (1997-2015)","2.8L V6 (1997-2005)","2.0L TFSI (2005-2022)","2.0L TDI (2005-2022)"],
  "Volkswagen-Tiguan": ["1.4L TSI (2008-2024)","2.0L TSI (2016-2024)","2.0L TDI (2008-2024)","1.4L eHybrid PHEV (2021-2025)"],
  "Volkswagen-Touareg": ["3.2L V6 (2002-2010)","5.0L V10 TDI (2002-2010)","3.0L V6 TDI (2010-2025)","4.2L V8 TDI (2010-2018)","3.0L eHybrid PHEV (2019-2025)"],
  "Volkswagen-Amarok": ["2.0L TDI BiTurbo (2010-2016)","3.0L V6 TDI (2016-2023)","2.0L TDI (2023-2025)","3.0L V6 TDI (2023-2025)"],
  "Volkswagen-T-Roc": ["1.5L TSI (2017-2025)","2.0L TDI (2017-2025)","2.0L TSI R (2020-2025)"],
  "Volkswagen-ID.4": ["52 kWh RWD (2021-2025)","77 kWh RWD (2021-2025)","77 kWh AWD (2021-2025)"],
  "BMW-1 Series": ["2.0L N45B20 (2004-2011)","3.0L N52B30 (2004-2011)","1.5L B38B15 (2015-2025)","2.0L B48B20 (2015-2025)","2.0L B47D20 Diesel (2015-2025)"],
  "BMW-2 Series": ["1.5L B38B15 (2014-2021)","2.0L B48B20 (2014-2025)","3.0L B58B30 (2014-2025)","2.0L B47D20 Diesel (2014-2025)"],
  "BMW-3 Series": ["2.0L M52B20 (1995-2005)","3.0L M54B30 (2000-2012)","2.0L N20B20 (2012-2019)","3.0L N55B30 (2012-2019)","2.0L B48B20 (2019-2025)","3.0L B58B30 (2019-2025)","2.0L B47D20 Diesel (2012-2025)"],
  "BMW-4 Series": ["2.0L N20B20 (2013-2020)","3.0L N55B30 (2013-2020)","2.0L B48B20 (2020-2025)","3.0L B58B30 (2020-2025)","2.0L B47D20 Diesel (2013-2025)"],
  "BMW-5 Series": ["3.0L N52B30 (2004-2013)","3.0L N55B30 (2010-2016)","2.0L N20B20 (2010-2016)","3.0L B58B30 (2017-2025)","2.0L B48B20 (2017-2025)","2.0L B47D20 Diesel (2010-2025)"],
  "BMW-7 Series": ["3.0L N52B30 (2004-2012)","4.4L N63B44 V8 (2008-2025)","3.0L B58B30 (2015-2025)","3.0L B57D30 Diesel (2015-2025)"],
  "BMW-X1": ["2.0L N20B20 (2009-2015)","1.5L B38B15 (2015-2025)","2.0L B48B20 (2015-2025)","2.0L B47D20 Diesel (2009-2025)"],
  "BMW-X3": ["2.5L M54B25 (2003-2010)","3.0L M54B30 (2003-2010)","2.0L N20B20 (2010-2017)","3.0L N55B30 (2010-2017)","2.0L B48B20 (2017-2025)","3.0L B58B30 (2017-2025)","2.0L B47D20 Diesel (2010-2025)"],
  "BMW-X5": ["3.0L M54B30 (1999-2006)","3.0L N52B30 (2006-2013)","3.0L N55B30 (2013-2018)","4.4L N63B44 V8 (1999-2025)","3.0L B58B30 (2018-2025)","3.0L B57D30 Diesel (2013-2025)"],
  "BMW-X7": ["3.0L B58B30 (2019-2025)","4.4L N63B44 V8 (2019-2025)","3.0L B57D30 Diesel (2019-2025)"],
  "BMW-M3": ["3.2L S50B32 (1992-1999)","3.2L S54B32 (2001-2006)","4.0L S65B40 V8 (2007-2013)","3.0L S55B30 (2014-2020)","3.0L S58B30 (2021-2025)"],
  "BMW-M5": ["4.9L S62B50 V8 (1998-2003)","5.0L S85B50 V10 (2004-2010)","4.4L S63B44 V8 (2011-2025)"],
  "Mercedes-A-Class": ["1.6L M166 (1997-2004)","2.0L M266 (2004-2012)","1.5L M270 (2012-2018)","2.0L M270 AMG35 (2013-2018)","1.3L M282 (2018-2025)","2.0L M260 A45 AMG (2019-2025)"],
  "Mercedes-B-Class": ["1.5L M266 (2005-2011)","2.0L M266 (2005-2011)","1.6L M270 (2011-2018)","2.0L M270 (2011-2018)","1.3L M282 (2018-2025)","70 kWh Electric (2019-2025)"],
  "Mercedes-C-Class": ["1.8L M111 (1993-2001)","2.3L M111 (1993-2001)","1.8L M271 (2000-2014)","3.0L M272 V6 (2004-2014)","2.0L M274 (2014-2021)","3.0L M276 V6 (2014-2021)","2.0L M264 (2021-2025)","2.0L PHEV C300e (2021-2025)","4.0L M177 AMG C63 (2014-2025)"],
  "Mercedes-E-Class": ["2.8L M104 (1993-2002)","3.2L M112 V6 (1996-2009)","1.8L M271 (2002-2016)","3.5L M276 V6 (2009-2016)","2.0L M274 (2016-2023)","3.0L M276 V6 (2016-2023)","2.0L PHEV E300e (2018-2023)","4.0L AMG E63 (2017-2023)"],
  "Mercedes-S-Class": ["3.2L M104 (1992-1999)","3.7L M112 V6 (2000-2006)","5.0L M113 V8 (2000-2006)","3.5L M276 V6 (2005-2020)","4.7L M278 V8 (2005-2020)","3.0L M256 (2020-2025)","4.0L M177 V8 (2020-2025)","3.0L PHEV (2020-2025)"],
  "Mercedes-GLA": ["1.6L M270 (2013-2020)","2.0L M270 (2013-2020)","1.6L M282 (2020-2025)","2.0L M260 (2020-2025)"],
  "Mercedes-GLC": ["2.0L M274 (2015-2023)","2.1L OM651 Diesel (2015-2020)","2.0L M254 (2023-2025)","2.0L PHEV GLC300e (2023-2025)"],
  "Mercedes-GLE": ["3.5L M276 V6 (2015-2019)","2.0L M260 (2019-2025)","3.0L M256 V6 (2019-2025)","3.0L PHEV GLE350e (2020-2025)"],
  "Mercedes-GLS": ["4.7L M278 V8 (2013-2019)","3.0L OM642 Diesel (2013-2019)","3.0L M256 (2019-2025)","4.0L M177 V8 (2019-2025)"],
  "Mercedes-AMG GT": ["4.0L M178 BiTurbo (2014-2025)"],
  "Audi-A1": ["1.2L CBZB TFSI (2010-2014)","1.4L CAXC TFSI (2010-2018)","1.6L TDI (2010-2018)","1.0L CHZA TFSI (2014-2022)","1.5L DADA TFSI (2018-2025)"],
  "Audi-A3": ["1.6L AGN (1996-2003)","1.8L AUM Turbo (1996-2013)","1.4L TFSI (2003-2020)","1.8L EA888 TFSI (2008-2020)","2.0L TDI (2003-2020)","1.5L TFSI (2020-2025)","2.0L TFSI (2020-2025)","2.0L PHEV e-tron (2020-2025)"],
  "Audi-A4": ["1.8L ADR Turbo (1994-2001)","2.8L ALG V6 (1994-2001)","1.8L TFSI (2000-2016)","2.0L TFSI (2000-2025)","3.0L TFSI V6 (2000-2016)","2.0L TDI (2000-2025)","2.0L PHEV 45 TFSI e (2019-2025)"],
  "Audi-A5": ["1.8L TFSI (2007-2016)","2.0L TFSI (2007-2025)","3.0L TFSI V6 (2007-2016)","2.0L TDI (2007-2025)"],
  "Audi-A6": ["1.8L Turbo (1997-2004)","2.8L V6 (1997-2004)","2.0L TFSI (2004-2025)","3.0L TFSI V6 (2004-2025)","2.0L TDI (2004-2025)","2.0L PHEV 50 TFSI e (2020-2025)"],
  "Audi-Q2": ["1.0L TFSI (2016-2025)","1.4L TFSI (2016-2020)","1.5L TFSI (2020-2025)","2.0L TDI (2016-2025)"],
  "Audi-Q3": ["1.4L TFSI (2011-2018)","2.0L TFSI (2011-2025)","2.0L TDI (2011-2025)","1.5L TFSI (2018-2025)","1.4L PHEV (2020-2025)"],
  "Audi-Q5": ["2.0L TFSI (2008-2025)","3.0L TFSI V6 (2008-2017)","2.0L TDI (2008-2025)","2.0L PHEV 55 TFSI e (2019-2025)"],
  "Audi-Q7": ["4.2L V8 FSI (2005-2015)","3.0L V6 TDI (2005-2025)","2.0L TFSI (2015-2025)","3.0L TFSI V6 (2015-2025)","2.0L PHEV (2019-2025)"],
  "Audi-TT": ["1.8L AUM Turbo (1998-2006)","3.2L BHE V6 (2003-2006)","2.0L TFSI (2006-2025)","3.2L V6 (2007-2014)"],
  "Audi-R8": ["4.2L V8 FSI (2006-2012)","5.2L V10 FSI (2008-2025)"],
  "Audi-e-tron": ["55 kWh Quattro (2018-2025)","50 kWh (2019-2025)","GT 85 kWh (2021-2025)"],
  "Lexus-IS": ["3.0L 2JZ-GE (1999-2005)","2.5L 4GR-FSE (2005-2013)","3.5L 2GR-FSE V6 (2005-2013)","2.5L 4GR-FSE (2013-2020)","3.5L 2GR-FSE V6 (2013-2020)","2.0L 8AR-FTS Turbo (2017-2020)","2.5L A25A-FXS Hybrid (2021-2025)","3.5L 2GR-FKS V6 (2021-2025)"],
  "Lexus-ES": ["3.5L 2GR-FE V6 (2007-2012)","3.5L 2GR-FSE V6 (2012-2018)","2.5L 2AR-FSE (2012-2018)","2.5L A25A-FXS Hybrid (2018-2025)","3.5L 2GR-FKS V6 (2018-2025)"],
  "Lexus-GS": ["3.0L 2JZ-GE (1997-2005)","4.3L 3UZ-FE V8 (2000-2011)","3.0L 3GR-FSE V6 (2005-2020)","3.5L 2GR-FSE Hybrid (2013-2020)"],
  "Lexus-LS": ["4.0L 1UZ-FE V8 (1990-2000)","4.3L 3UZ-FE V8 (2001-2006)","4.6L 1UR-FSE V8 (2006-2017)","3.5L 2GR-FKS V6 (2017-2025)","3.5L Hybrid (2017-2025)"],
  "Lexus-UX": ["2.0L M20A-FKS (2018-2025)","2.0L M20A-FXS Hybrid (2018-2025)","54.3 kWh EV (2022-2025)"],
  "Lexus-NX": ["2.0L 8AR-FTS Turbo (2014-2021)","2.5L 2AR-FXE Hybrid (2014-2021)","2.4L T24A-FTS Turbo (2021-2025)","2.5L A25A-FXS Hybrid (2021-2025)","2.5L PHEV (2021-2025)"],
  "Lexus-RX": ["3.0L 1MZ-FE V6 (1998-2003)","3.3L 3MZ-FE V6 (2004-2015)","3.3L Hybrid (2005-2015)","2.0L 8AR-FTS Turbo (2015-2022)","3.5L 2GR-FXS Hybrid (2016-2022)","2.4L T24A-FTS (2022-2025)","2.5L A25A-FXS Hybrid (2022-2025)"],
  "Lexus-GX": ["4.7L 2UZ-FE V8 (2002-2009)","4.6L 1UR-FE V8 (2009-2025)","3.4L F33A-FTV (2024-2025)"],
  "Lexus-LX": ["4.7L 2UZ-FE V8 (1998-2008)","5.7L 3UR-FE V8 (2008-2022)","3.3L F33A-FTV Twin Turbo V6 (2022-2025)"],
  "Lexus-LC": ["5.0L 2UR-GSE V8 (2017-2025)","3.5L 8GR-FXS Hybrid (2017-2025)"],
  "Isuzu-D-Max": ["2.5L 4JA1 (1998-2005)","3.0L 4JH1 (1998-2005)","2.5L 4JK1 Diesel (2006-2016)","3.0L 4JJ1 Diesel (2006-2016)","1.9L 4JJ3 Diesel (2017-2025)","3.0L 4JJ1 Diesel (2017-2025)"],
  "Isuzu-MU-X": ["2.5L 4JK1 Diesel (2013-2016)","3.0L 4JJ1 Diesel (2013-2016)","1.9L 4JJ3 Diesel (2017-2025)","3.0L 4JJ1 Diesel (2017-2025)"],
  "Jeep-Wrangler": ["4.0L AMC 242 (1987-2006)","3.8L ERH V6 (2007-2011)","3.6L Pentastar V6 (2012-2025)","2.0L Turbo Hurricane (2018-2025)","2.0L 4xe PHEV (2021-2025)"],
  "Jeep-Cherokee": ["2.4L (2001-2023)","3.7L V6 (2001-2013)","3.2L Pentastar V6 (2013-2023)","2.0L Turbo (2019-2023)"],
  "Jeep-Grand Cherokee": ["4.0L AMC 242 (1993-2004)","4.7L V8 (1999-2010)","5.7L Hemi V8 (2005-2025)","3.6L Pentastar V6 (2011-2025)","3.0L EcoDiesel V6 (2014-2020)","6.4L SRT8 V8 (2012-2025)"],
  "Jeep-Compass": ["2.4L (2006-2025)","2.0L (2006-2025)","1.3L GSE Turbo (2017-2025)","4xe PHEV 1.3L (2021-2025)"],
  "Jeep-Renegade": ["1.4L MultiAir Turbo (2014-2025)","2.4L Tiger Shark (2014-2025)","4xe PHEV 1.3L (2020-2025)"],
  "Suzuki-Swift": ["1.0L G10A (1983-1995)","1.3L G13B (1990-2010)","1.5L M15A (2003-2010)","1.2L K12B (2010-2017)","1.4L K14B Turbo (2017-2022)","1.2L Z12E Hybrid (2022-2025)"],
  "Suzuki-Baleno": ["1.3L G13BB (1995-2002)","1.6L G16B (1995-2002)","1.2L K12B (2015-2022)","1.4L K14B Turbo (2015-2022)","1.2L Z12E Hybrid (2022-2025)"],
  "Suzuki-Vitara": ["1.6L G16B (1995-2005)","2.0L J20A (1998-2005)","2.7L H27A V6 (2001-2005)","1.6L M16A (2005-2022)","1.4L K14 BoosterJet Turbo (2015-2022)","1.5L Z15E Hybrid (2022-2025)"],
  "Suzuki-Jimny": ["0.8L F8B (1981-1998)","1.3L G13BB (1998-2018)","1.5L K15B (2018-2025)"],
  "Suzuki-S-Cross": ["1.6L M16A (2013-2020)","1.0L K10C Turbo (2016-2020)","1.4L K14D BoosterJet (2020-2025)","1.4L Hybrid (2020-2025)","1.5L Strong Hybrid (2022-2025)"],
  "Volvo-S60": ["2.0T B4204T (1998-2009)","2.5T B5244T (2000-2009)","2.0L D5 Diesel (2000-2010)","2.0L T4 Drive-E (2010-2025)","2.0L T5 Drive-E (2010-2025)","2.0L T8 PHEV (2017-2025)"],
  "Volvo-S90": ["2.0L T4 Drive-E (2016-2025)","2.0L T5 Drive-E (2016-2025)","2.0L T6 Drive-E (2016-2025)","2.0L T8 PHEV (2017-2025)","2.0L D5 Diesel (2016-2025)"],
  "Volvo-XC40": ["2.0L T3 (2017-2025)","2.0L T4 Drive-E (2017-2025)","2.0L T5 Drive-E (2017-2025)","2.0L T5 PHEV (2020-2025)","78 kWh EV (2020-2025)"],
  "Volvo-XC60": ["2.4L D5 Diesel (2008-2017)","2.0L T5 (2010-2025)","3.2L JE (2008-2014)","2.0L T4 Drive-E (2017-2025)","2.0L T8 PHEV (2017-2025)","2.0L D4 Diesel (2017-2025)"],
  "Volvo-XC90": ["2.9L B6294S Turbo (2002-2014)","4.4L V8 (2006-2014)","2.0L T5 Drive-E (2014-2025)","2.0L T8 PHEV (2015-2025)","2.0L D5 Diesel (2015-2025)","100 kWh EV Recharge (2022-2025)"],
  "Peugeot-208": ["1.0L EB0 (2012-2019)","1.2L PureTech (2012-2025)","1.6L THP (2012-2019)","50 kWh EV e-208 (2019-2025)"],
  "Peugeot-308": ["1.6L THP (2007-2013)","1.6L HDi Diesel (2007-2021)","2.0L HDi Diesel (2007-2021)","1.2L PureTech (2013-2025)","1.6L PureTech PHEV (2021-2025)","54 kWh EV e-308 (2023-2025)"],
  "Peugeot-3008": ["1.6L THP (2009-2016)","2.0L HDi Diesel (2009-2025)","1.2L PureTech (2016-2025)","1.6L PHEV (2019-2025)","73 kWh EV e-3008 (2024-2025)"],
  "Peugeot-2008": ["1.2L PureTech (2013-2025)","1.5L BlueHDi Diesel (2017-2025)","50 kWh EV e-2008 (2019-2025)"],
  "Renault-Clio": ["1.2L D7F (1998-2012)","1.4L K4J (1998-2012)","1.6L K4M (1998-2012)","1.5L K9K dCi Diesel (2001-2019)","0.9L H4Bt TCe (2012-2019)","1.0L H4D (2019-2025)","1.3L H5Ht TCe (2019-2025)","1.6L E-Tech Hybrid (2020-2025)"],
  "Renault-Megane": ["1.4L K4J (1995-2002)","2.0L F4R (1995-2002)","1.5L K9K dCi Diesel (2002-2020)","1.6L K4M (2002-2016)","1.2L H4Jt TCe (2016-2020)","1.3L H5Ht TCe (2020-2025)","1.6L E-Tech Hybrid (2020-2025)","60 kWh EV (2017-2025)"],
  "Renault-Koleos": ["2.5L QR25DE (2007-2016)","2.0L M9R dCi Diesel (2007-2016)","2.0L X4M (2017-2025)","1.6L dCi Diesel (2017-2025)"],
  "Tesla-Model 3": ["Standard Range RWD (2017-2021)","Long Range AWD (2017-2025)","Performance AWD (2017-2025)","Standard Range Plus RWD (2021-2023)","Long Range 82 kWh AWD (2022-2025)","RWD (2023-2025)"],
  "Tesla-Model Y": ["Standard Range RWD (2020-2022)","Long Range AWD (2020-2025)","Performance AWD (2020-2025)","Long Range 82 kWh AWD (2022-2025)","RWD (2022-2025)"],
  "Tesla-Model S": ["85 kWh (2012-2016)","100D 100 kWh AWD (2016-2021)","Long Range AWD (2019-2025)","Plaid AWD (2021-2025)"],
  "Tesla-Model X": ["75D (2016-2018)","100D AWD (2016-2021)","Long Range AWD (2019-2025)","Plaid AWD (2021-2025)"],
  "Tesla-Cybertruck": ["Rear Wheel Drive (2023-2025)","All Wheel Drive (2023-2025)","Cyberbeast (2023-2025)"],
  "GWM-Ute": ["2.0L Diesel (2020-2025)","2.0L Petrol Turbo (2020-2025)"],
  "GWM-Haval H6": ["1.5L Turbo (2021-2025)","2.0L PHEV (2023-2025)"],
  "GWM-Haval Jolion": ["1.5L Turbo (2021-2025)","1.5L Hybrid (2023-2025)"],
  "GWM-Tank 300": ["2.0L Turbo (2022-2025)","2.0L PHEV (2024-2025)"],
  "MG-ZS": ["1.0L Turbo (2017-2021)","1.5L (2017-2021)","1.0L Turbo (2021-2025)","44.5 kWh EV (2019-2025)","72.6 kWh EV (2021-2025)"],
  "MG-HS": ["1.5L Turbo (2019-2025)","2.0L Turbo (2019-2025)","1.5L PHEV (2021-2025)"],
  "MG-MG4": ["51 kWh EV (2022-2025)","64 kWh EV (2022-2025)","77 kWh EV XPOWER (2023-2025)"],
  "BYD-Atto 3": ["50.1 kWh EV (2022-2025)","60.5 kWh EV (2022-2025)"],
  "BYD-Seal": ["61.4 kWh RWD EV (2023-2025)","82.6 kWh AWD EV (2023-2025)"],
  "BYD-Dolphin": ["44.9 kWh EV (2022-2025)","60.5 kWh EV (2022-2025)"],
  "Porsche-911": ["3.4L M64 (1993-1998)","3.4L 9A1 (2012-2019)","3.0L 9A2 Turbo (2016-2025)","3.0L 9A2 (2019-2025)","3.7L 9A2 Turbo S (2019-2025)"],
  "Porsche-Cayenne": ["3.2L V6 (2002-2010)","4.5L V8 (2002-2010)","3.6L V6 (2010-2025)","4.8L V8 (2010-2018)","3.0L E-Hybrid V6 PHEV (2017-2025)"],
  "Porsche-Macan": ["2.0L Turbo (2014-2025)","3.0L V6 (2014-2025)","2.9L V6 BiTurbo GTS (2018-2025)","100 kWh EV (2024-2025)"],
  "Porsche-Taycan": ["79.2 kWh RWD (2019-2025)","93.4 kWh 4S (2019-2025)","93.4 kWh Turbo (2019-2025)","93.4 kWh Turbo S (2019-2025)"],
  "Land Rover-Defender": ["2.5L 300Tdi Diesel (1994-2007)","2.4L TDCi Diesel (2007-2016)","2.0L P200 Ingenium (2020-2025)","2.0L P300 Ingenium (2020-2025)","3.0L P400 Mild Hybrid (2020-2025)","3.0L D300 Diesel (2020-2025)","5.0L V8 (2021-2025)","2.0L P400e PHEV (2020-2025)"],
  "Land Rover-Discovery": ["4.0L V8 (1989-2004)","2.5L Diesel (1994-2009)","4.4L V8 (2003-2009)","3.0L Si6 V6 (2017-2025)","3.0L SD6 Diesel (2017-2025)","2.0L Si4 Ingenium (2017-2025)","3.0L D300 Diesel MHEV (2020-2025)"],
  "Land Rover-Range Rover": ["3.9L V8 Petrol (1994-2002)","4.4L V8 (2002-2012)","5.0L V8 (2009-2022)","3.0L Si6 V6 (2012-2022)","3.0L TDV6 Diesel (2012-2022)","3.0L P360 MHEV (2022-2025)","4.4L P530 V8 (2022-2025)","3.0L P510e PHEV (2022-2025)"],
};
const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];

const SERVICE_CATEGORIES = [
  {
    label: "Routine Servicing",
    services: ["Basic Service","Log Book Service","Oil & Filter Change","Spark Plugs","Air Filter","Cabin Air Filter","Fuel Filter","Coolant Flush"],
    more: ["Minor Service","Major Service","Capped Price Service","Engine Oil Top-Up","Glow Plugs Replacement","Brake Fluid Flush","Power Steering Fluid Flush","Wiper Blade Replacement","Headlight Globe Replacement"],
  },
  {
    label: "Brakes",
    services: ["Brake Pads (Front)","Brake Pads (Rear)","Brake Rotors","Brake Fluid Flush","Brake Caliper Service","Handbrake / Park Brake"],
    more: ["Brake Pads (Front & Rear)","Brake Rotors (Front)","Brake Rotors (Rear)","Brake Rotor Machining","Brake Caliper Replacement","Brake Hose Replacement","Brake Master Cylinder","Brake Booster","ABS Sensor Replacement","ABS Module Repair","Handbrake Cable Replacement","Brake Squeal Diagnosis"],
  },
  {
    label: "Tyres & Wheels",
    services: ["Tyre Replacement (x1)","Tyre Replacement (x2)","Tyre Replacement (x4)","Tyre Rotation","Wheel Alignment","Wheel Balancing","Puncture Repair"],
    more: ["Wheel Alignment (4-Wheel)","Wheel Bearing Replacement","TPMS Sensor Replacement / Repair","Nitrogen Tyre Fill","Rim Repair","Tyre Valve Replacement","Tyre Pressure Check"],
  },
  {
    label: "Transmission & Drivetrain",
    services: ["Transmission Service","Gearbox Repair","Clutch Replacement","Differential Service","Transfer Case Service","CV Joint / Boot"],
    more: ["Automatic Transmission Service","Manual Transmission Service","CVT Transmission Service","DSG / DCT Service","Transmission Fluid Flush","Transmission Rebuild","Transmission Replacement","Gearbox Rebuild","Gearbox Replacement","Clutch Master Cylinder","Clutch Slave Cylinder","Flywheel Replacement","Dual Mass Flywheel Replacement","Differential Repair","Driveshaft Repair","Tailshaft / Uni Joint"],
  },
  {
    label: "Engine & Timing",
    services: ["Timing Belt","Timing Chain","Head Gasket","Engine Tune-Up","Valve Clearance Check"],
    more: ["Timing Belt Kit (Belt + Water Pump)","Timing Chain Tensioner","Engine Mount Replacement","Carbon Clean / Walnut Blast","Fuel Injector Clean","Fuel Injector Replacement","Throttle Body Clean","Throttle Body Replacement","EGR Valve Clean","EGR Valve Replacement","Turbocharger Repair","Turbocharger Replacement","PCV Valve Replacement","Oil Leak Diagnosis & Repair","Rocker Cover Gasket","Sump Gasket Replacement","Engine Rebuild","Engine Replacement / Swap"],
  },
  {
    label: "Suspension & Steering",
    services: ["Shock Absorbers","Struts","Suspension Repair","Power Steering Service","Control Arms","Ball Joints","Tie Rods","Wheel Bearings"],
    more: ["Shock Absorbers (Front Pair)","Shock Absorbers (Rear Pair)","Coil Spring Replacement","Sway Bar Links","Suspension Bush Replacement","Power Steering Pump","Power Steering Rack","Electric Power Steering Repair","Inner Tie Rod Replacement","Steering Column Repair","Suspension Knock / Diagnosis"],
  },
  {
    label: "Cooling & Exhaust",
    services: ["Radiator","Radiator Hoses","Thermostat","Water Pump","Exhaust Repair","Catalytic Converter","DPF Clean / Replacement"],
    more: ["Radiator Repair","Cooling Fan Replacement","Heater Hose Replacement","Muffler Replacement","Oxygen (O2) Sensor Replacement","Exhaust Manifold Gasket","AdBlue / SCR System Repair"],
  },
  {
    label: "Electrical & AC",
    services: ["Battery Replacement","Alternator","Starter Motor","Air Con Regas","Air Con Repair","Heater Core"],
    more: ["Battery Test","Auxiliary / AGM Battery Replacement","Alternator Repair","Starter Motor Repair","Fuse / Relay Replacement","Wiring Repair","ECU Diagnosis","ECU Replacement / Reprogram","Power Window Motor / Regulator","Central Locking Repair","Key / Remote Programming","Air Con Leak Test","Air Con Compressor Replacement","Air Con Condenser Replacement","Air Con Evaporator Replacement","Heater Fan / Blower Motor","Headlight Restoration","Headlight Assembly Replacement"],
  },
  {
    label: "Lights & Wipers",
    services: ["Headlight Globe Replacement","Tail Light Globe","Indicator / Blinker Globe","Brake Light Globe","Wiper Blades (Front)","Wiper Blades (Rear)","Number Plate Light"],
    more: ["Headlight Assembly Replacement","Headlight Restoration / Polish","High Beam Globe","Fog Light Globe / Replacement","Daytime Running Light (DRL)","Side Marker / Side Light","Reverse Light Globe","Interior Cabin Light","Wiper Motor Replacement","Wiper Arm / Linkage","Washer Pump Replacement","Washer Nozzle / Jet Repair","Rain Sensor Replacement","Cracked Headlight Lens Repair"],
  },
  {
    label: "Inspections & Compliance",
    services: ["Pink Slip (NSW Safety Check)","Roadworthy Certificate","Pre-purchase Inspection","Logbook Inspection","Registration Renewal Inspection","Emission Test","Blue Slip (NSW Unregistered)"],
    more: ["Roadworthy Certificate (VIC RWC)","Safety Certificate (QLD)","Roadworthy Inspection (SA / WA / TAS)","Pre-Purchase Inspection (with Report)","Diagnostic Scan (Fault Codes)","Compliance / Mod Plate Inspection","Insurance Damage Report"],
  },
  { label: "Other", services: ["Other"] },
];

const EV_EXCLUDED_SERVICES = new Set([
  // Engine / ICE-only — not on EVs
  "Oil & Filter Change","Timing Belt","Timing Chain","Clutch Replacement","Spark Plugs",
  "Air Filter","Fuel Filter","Coolant Flush","Exhaust Repair","Radiator","Radiator Hoses",
  "Thermostat","Water Pump","Head Gasket","Engine Tune-Up","Valve Clearance Check",
  "Catalytic Converter","DPF Clean / Replacement","Alternator","Starter Motor",
  // Routine "more" list ICE items
  "Minor Service","Major Service","Engine Oil Top-Up","Glow Plugs Replacement",
  "Capped Price Service",
  // Engine & Timing "more" list — entirely ICE
  "Timing Belt Kit (Belt + Water Pump)","Timing Chain Tensioner","Engine Mount Replacement",
  "Carbon Clean / Walnut Blast","Fuel Injector Clean","Fuel Injector Replacement",
  "Throttle Body Clean","Throttle Body Replacement","EGR Valve Clean","EGR Valve Replacement",
  "Turbocharger Repair","Turbocharger Replacement","PCV Valve Replacement",
  "Oil Leak Diagnosis & Repair","Rocker Cover Gasket","Sump Gasket Replacement",
  "Engine Rebuild","Engine Replacement / Swap",
  // Transmission ICE-only
  "Automatic Transmission Service","Manual Transmission Service","CVT Transmission Service",
  "DSG / DCT Service","Transmission Fluid Flush","Transmission Rebuild","Transmission Replacement",
  "Gearbox Rebuild","Gearbox Replacement","Clutch Master Cylinder","Clutch Slave Cylinder",
  "Flywheel Replacement","Dual Mass Flywheel Replacement","Transmission Service","Gearbox Repair",
  // Cooling/Exhaust ICE
  "Radiator Repair","Heater Hose Replacement","Muffler Replacement",
  "Oxygen (O2) Sensor Replacement","Exhaust Manifold Gasket","AdBlue / SCR System Repair",
]);

// EV-specific service categories — only shown for electric vehicles
const EV_SERVICE_CATEGORIES = [
  {
    label: "EV Servicing",
    services: ["EV Annual Service / Inspection","Cabin Air Filter","Brake Fluid Flush","Coolant (Battery/Inverter) Service","Reduction Gearbox Oil","Software Update"],
    more: ["Capped Price EV Service","Multi-Point Safety Check","12V Auxiliary Battery Test","High Voltage System Inspection","Tyre Rotation"],
  },
  {
    label: "High Voltage Battery & Charging",
    services: ["HV Battery Health Check","HV Battery Diagnostics","12V Auxiliary Battery Replacement","Charge Port Repair","Onboard Charger Repair","Home Charger Fault Diagnosis"],
    more: ["HV Battery Cell / Module Replacement","HV Battery Coolant Flush","DC Fast Charge Diagnostic","BMS (Battery Management) Reset","Charging Cable Replacement","Range Loss Diagnosis"],
  },
  {
    label: "Electric Motor & Drivetrain",
    services: ["Electric Motor Diagnostics","Reduction Gearbox Service","Inverter Diagnostics","Drive Unit Inspection","CV Joint / Boot","Driveshaft Repair"],
    more: ["Electric Motor Replacement","Inverter Replacement","Reduction Gearbox Repair","Differential Service","Driveshaft Replacement"],
  },
  {
    label: "Regenerative Brakes",
    services: ["Brake Pads (Front)","Brake Pads (Rear)","Brake Rotors","Brake Fluid Flush","Brake Caliper Service","Handbrake / Park Brake"],
    more: ["Brake Pads (Front & Rear)","Brake Rotors (Front)","Brake Rotors (Rear)","Brake Rotor Machining","Brake Caliper Replacement","Brake Hose Replacement","Brake Master Cylinder","ABS Sensor Replacement","ABS Module Repair","Handbrake Cable Replacement","Regen Braking Diagnosis"],
  },
  {
    label: "Tyres & Wheels",
    services: ["Tyre Replacement (x1)","Tyre Replacement (x2)","Tyre Replacement (x4)","Tyre Rotation","Wheel Alignment","Wheel Balancing","Puncture Repair"],
    more: ["EV-Rated Tyre Replacement","Wheel Alignment (4-Wheel)","Wheel Bearing Replacement","TPMS Sensor Replacement / Repair","Rim Repair","Tyre Valve Replacement","Tyre Pressure Check"],
  },
  {
    label: "Suspension & Steering",
    services: ["Shock Absorbers","Struts","Suspension Repair","Control Arms","Ball Joints","Tie Rods","Wheel Bearings"],
    more: ["Shock Absorbers (Front Pair)","Shock Absorbers (Rear Pair)","Air Suspension Repair","Coil Spring Replacement","Sway Bar Links","Suspension Bush Replacement","Electric Power Steering Repair","Inner Tie Rod Replacement","Steering Column Repair","Suspension Knock / Diagnosis"],
  },
  {
    label: "Thermal Management & AC",
    services: ["Battery Coolant Service","Heat Pump Diagnostics","Air Con Regas","Air Con Repair","Cabin Heater Repair"],
    more: ["Heat Pump Replacement","Battery Coolant Pump Replacement","Air Con Leak Test","Air Con Compressor Replacement","Air Con Condenser Replacement","Air Con Evaporator Replacement","PTC Heater Replacement","Coolant Hose Replacement"],
  },
  {
    label: "Electrical & Electronics",
    services: ["12V Battery Replacement","ECU Diagnosis","Fuse / Relay Replacement","Software Update","Touchscreen / Infotainment Repair","Charge Port Light / Lock Repair"],
    more: ["12V Battery Test","Wiring Repair","ECU Replacement / Reprogram","Power Window Motor / Regulator","Central Locking Repair","Key / Remote Programming","Sentry Mode / Camera Repair","Over-the-Air Update Issue"],
  },
  {
    label: "Lights & Wipers",
    services: ["Headlight Globe Replacement","Tail Light Globe","Indicator / Blinker Globe","Brake Light Globe","Wiper Blades (Front)","Wiper Blades (Rear)","Number Plate Light"],
    more: ["Headlight Assembly Replacement","Headlight Restoration / Polish","High Beam Globe","Fog Light Globe / Replacement","Daytime Running Light (DRL)","Reverse Light Globe","Interior Cabin Light","Wiper Motor Replacement","Wiper Arm / Linkage","Washer Pump Replacement","Washer Nozzle / Jet Repair","Rain Sensor Replacement"],
  },
  {
    label: "Inspections & Compliance",
    services: ["Pink Slip (NSW Safety Check)","Roadworthy Certificate","Pre-purchase Inspection","Registration Renewal Inspection","Blue Slip (NSW Unregistered)"],
    more: ["Roadworthy Certificate (VIC RWC)","Safety Certificate (QLD)","Roadworthy Inspection (SA / WA / TAS)","Pre-Purchase EV Inspection (with Battery Health Report)","Diagnostic Scan (Fault Codes)","Compliance / Mod Plate Inspection","Insurance Damage Report"],
  },
  { label: "Other", services: ["Other"] },
];

const PURE_EV_MAKES_LOCAL = new Set(["Tesla", "Polestar", "Zeekr"]);
const PURE_EV_MODELS_LOCAL = new Set([
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
  "GWM-Ora", "Renault-Zoe",
  "Cupra-Born", "Cupra-Tavascan",
  "Volvo-EX30", "Volvo-EX40", "Volvo-EX90",
  "Genesis-GV60", "Chery-Omoda E5",
  "LDV-Mifa 9", "LDV-eDeliver 9",
  "Porsche-Taycan",
]);

const getServicesForCar = (make, model, fuelType) => {
  const isElectric = fuelType === "Electric"
    || PURE_EV_MAKES_LOCAL.has(make)
    || PURE_EV_MODELS_LOCAL.has(`${make}-${model}`);
  if (isElectric) {
    // Use the dedicated EV catalogue — relevant categories like HV battery, motor, charging, regen brakes
    return EV_SERVICE_CATEGORIES;
  }
  return SERVICE_CATEGORIES;
};

// Privacy helper — maps suburb to metro/regional without exposing suburb to LLM
function getAreaType(suburb, state) {
  if (!suburb || !state) return 'metro';
  const METRO_SUBURBS = {
    NSW: ['sydney','parramatta','newcastle','wollongong','penrith','blacktown','liverpool','campbelltown','sutherland','hornsby','chatswood','north sydney','bondi','manly','cronulla','hurstville','bankstown','auburn','fairfield','ryde','gosford','wyong','maitland'],
    VIC: ['melbourne','geelong','ballarat','bendigo','frankston','dandenong','ringwood','box hill','footscray','st kilda','richmond','brunswick','sunshine','werribee','cranbourne','pakenham','berwick','springvale','clayton','glen waverley','mornington'],
    QLD: ['brisbane','gold coast','sunshine coast','townsville','cairns','ipswich','toowoomba','logan','redcliffe','caboolture','springfield','robina','southport','maroochydore','noosa','strathpine','chermside','indooroopilly','eight mile plains','wynnum'],
    WA:  ['perth','fremantle','mandurah','joondalup','rockingham','armadale','midland','canning vale','baldivis','ellenbrook','morley','bentley','subiaco','cottesloe','victoria park','cannington','osborne park','stirling'],
    SA:  ['adelaide','gawler','salisbury','elizabeth','morphett vale','noarlunga','modbury','campbelltown','burnside','unley','norwood','prospect','tea tree gully','parafield gardens'],
    TAS: ['hobart','launceston','glenorchy','clarence','kingston'],
    ACT: ['canberra','belconnen','tuggeranong','woden','gungahlin','weston creek','molonglo valley','bruce','charnwood'],
    NT:  ['darwin','palmerston'],
  };
  const s = suburb.toLowerCase();
  const metroList = METRO_SUBURBS[state] || [];
  return metroList.some(m => s.includes(m) || m.includes(s)) ? 'metro' : 'regional';
}

const STORAGE_KEY = "servcheck_quote_form";

const DEFAULT_FORM = {
  car_make: "", car_model: "", car_year: "", car_variant: "",
  fuel_type: "", transmission_type: "",
  selected_services: [], custom_service: "",
  dealership_price: "", mechanic_price: "", estimate_only: false,
  state: "", suburb: "",
  odometer: "", last_service_km: "", last_service_months: "", quote_notes: "",
};

const STEPS = ["Your Ride", "Engine & Variant", "Services", "The Quote"];

const LOADING_MESSAGES = [
  "Checking Australian market rates...",
  "Comparing against verified service providers in your area...",
  "Analysing pricing for your specific vehicle...",
  "Checking Sparesbox & Repco...",
  "Comparing labour rates...",
  "Almost there...",
];

const selectClass = "w-full h-12 rounded-xl bg-slate-50 border border-slate-200 px-3 font-medium text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer";

import QuoteScanner from "./QuoteScanner";
import SuburbSearch from "./SuburbSearch";
import Step2Services from "./Step2Services";
import EstimateLoader from "./EstimateLoader";

export default function QuoteForm({ prefillData, onSetPrefill, onStepChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGuestGate, setShowGuestGate] = useState(false);
  const [step, setStep] = useState(0);
  const [showVehicleForm, setShowVehicleForm] = useState(true);
  
  useEffect(() => {
    if (onStepChange) onStepChange(step);
  }, [step, onStepChange]);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [photos, setPhotos] = useState([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        toast("Welcome back! We've saved your progress so you can finish your check.", { icon: "👋" });
        return { ...DEFAULT_FORM, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_FORM;
  });

  // Prefill state/suburb from user profile once user is loaded
  useEffect(() => {
    if (user?.state || user?.suburb) {
      setForm(f => ({
        ...f,
        state: f.state || user.state || "",
        suburb: f.suburb || user.suburb || "",
      }));
    }
  }, [user]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); }, [form]);

  // Apply prefill data from QuoteScanner when quote photo is partial
  useEffect(() => {
    if (!prefillData) return;
    setForm(f => ({ ...f, ...prefillData }));
    // Jump to step 0 so user can verify/complete vehicle details
    setStep(0);
    setDirection(1);
  }, [prefillData]);

  useEffect(() => {
    if (!loading) return;
    let idx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[idx]);
    }, 2200);
    return () => clearInterval(interval);
  }, [loading]);

  const update = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === "car_make") { updated.car_model = ""; updated.car_variant = ""; updated.fuel_type = ""; updated.transmission_type = ""; updated.selected_services = []; }
      if (field === "car_model") { updated.car_variant = ""; updated.fuel_type = ""; updated.transmission_type = ""; updated.selected_services = []; }
      if (field === "car_year") { updated.car_variant = ""; updated.fuel_type = ""; updated.transmission_type = ""; }
      if (field === "fuel_type") { updated.transmission_type = ""; updated.selected_services = []; }
      if (field === "last_service_date") {
        const months = calculateMonthsSinceService(value);
        updated.last_service_months = months !== null ? months : "";
      }
      return updated;
    });
  };

  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };
  const toggleService = (svc) => {
    update("selected_services", form.selected_services.includes(svc)
      ? form.selected_services.filter(s => s !== svc)
      : [...form.selected_services, svc]);
  };
  const handleFileAdd = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotos(prev => [...prev, { file, preview: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  };

  const calculateMonthsSinceService = (dateStr) => {
    if (!dateStr) return null;
    const serviceDate = new Date(dateStr);
    const today = new Date();
    const months = (today.getFullYear() - serviceDate.getFullYear()) * 12 + (today.getMonth() - serviceDate.getMonth());
    return Math.max(0, months);
  };
  const clearForm = () => { setForm(DEFAULT_FORM); setPhotos([]); setStep(0); localStorage.removeItem(STORAGE_KEY); };

  // Year validation: if model has known variants but none match selected year, it's invalid
  const modelHasVariants = form.car_make && form.car_model && !!CAR_VARIANTS[`${form.car_make}-${form.car_model}`];
  const yearVariants = modelHasVariants ? getRawVariantsForYear(form.car_make, form.car_model, form.car_year) : null;
  const yearInvalid = form.car_year && modelHasVariants && yearVariants !== null && yearVariants.length === 0;
  const step0Valid = form.car_make && form.car_model && form.car_year && !yearInvalid;
  const step1Valid = true;
  const step2Valid = form.selected_services.length > 0 || !!form.custom_service;
  const step3Valid = (form.dealership_price || form.mechanic_price || form.estimate_only) && form.state && form.suburb && form.suburb.trim().length > 0;
  const stepValid = [step0Valid, step1Valid, step2Valid, step3Valid];
  const progress = ((step + (stepValid[step] ? 1 : 0)) / STEPS.length) * 100;

  const availableModels = form.car_make ? (CAR_MAKES_MODELS[form.car_make] || []) : [];
  const filteredServiceCategories = getServicesForCar(form.car_make, form.car_model, form.fuel_type);
  const variantOptions = getVariants(form.car_make, form.car_model, form.car_year);
  const fuelTypeOptions = getAvailableFuelTypes(form.car_make, form.car_model, form.car_year);
  const transmissionOptions = getAvailableTransmissions(form.car_make, form.car_model, form.car_year, form.fuel_type);

  const availableSuburbs = form.state ? [...(SUBURBS_BY_STATE[form.state] || [])].sort() : [];

  // Look up pre-computed cache via backend (also enqueues suburb if missing)
  const checkCache = async (make, model, year, service, state, suburb) => {
    if (!make || !model || !service || !state) return null;
    try {
      let res;
      try {
        res = await base44.functions.invoke('checkPricingCache', {
          car_make: make, car_model: model, car_year: year || '',
          service_type: service, state, suburb: suburb || '',
        });
      } catch (_) {
        // Cache check failed (rate limit, etc.) — fall through to AI analysis
        return null;
      }
      const d = res.data;
      if (d?.status === 'hit' && d?.data) {
        return d.data;
      }
      if (d?.status === 'queued') {
        // Register for polling + push notification when ready
        const params = { car_make: make, car_model: model, car_year: year || '', service_type: service, state, suburb: suburb || '' };
        registerPricingQueueItem(params, d.queue_position || 1, d.eta_minutes || 15);

        if (d.is_high_volume) {
          toast(`🔥 High demand — you're ~#${d.queue_position} in queue. We'll send you a notification in ~${d.eta_minutes} min when suburb pricing is ready.`, { duration: 8000 });
        } else {
          toast(`⏳ Fetching suburb pricing for ${suburb}. We'll notify you in ~${d.eta_minutes} min when it's ready.`, { duration: 6000 });
        }

        // Return stale state-level data as fallback if available
        return d.data || null;
      }
    } catch (_) {}
    return null;
  };

  const handleSubmit = async () => {
    // Guest gate — show login prompt before any analysis
    if (!user) { setShowGuestGate(true); return; }
    setLoading(true);
    // Server-side credit check & deduction BEFORE the analysis runs.
    // localStorage credits are display-only — the backend is the source of truth.
    const deducted = await deductCredit();
    if (!deducted) { setShowPaywall(true); setLoading(false); return; }
    try {
      let uploadedUrls = [];
      for (const photo of photos) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: photo.file });
        uploadedUrls.push(file_url);
      }

      const serviceList = [
        ...form.selected_services.filter(s => s !== "Other"),
        ...(form.custom_service ? [form.custom_service] : []),
      ].filter(Boolean);
      const service = serviceList.join(", ");
      const dealershipPrice = form.dealership_price ? parseFloat(form.dealership_price) : null;
      const mechanicPrice = form.mechanic_price ? parseFloat(form.mechanic_price) : null;
      const primaryPrice = form.estimate_only ? null : (mechanicPrice || dealershipPrice);

      // --- CACHE CHECK: pricing data from DB — then AI writes the personalised analysis ---
      if (form.selected_services.length === 1 && form.state && !uploadedUrls.length) {
        const cached = await checkCache(form.car_make, form.car_model, form.car_year, service, form.state, form.suburb);
        if (cached) {
          const carDesc = [
            `${form.car_year} ${form.car_make} ${form.car_model}`,
            form.car_variant ? `(${form.car_variant})` : "",
            form.fuel_type ? `- ${form.fuel_type}` : "",
            form.transmission_type ? `/ ${form.transmission_type}` : "",
          ].filter(Boolean).join(" ");

          // Enforce spread cap on cached data before using it
          const cachedPriceLow = cached.price_low;
          const cachedPriceHigh = Math.min(cached.price_high, Math.round(cached.price_low * 1.40));
          const cachedPriceAvg = cached.price_average > cachedPriceHigh
            ? Math.round((cachedPriceLow + cachedPriceHigh) / 2)
            : cached.price_average;

          const cachedAnalysis = await base44.integrations.Core.InvokeLLM({
            prompt: `You are an expert Australian automotive mechanic pricing analyst.

CAR: ${carDesc}
SERVICE: ${service}
LOCATION: ${form.state}, Australia (${getAreaType(form.suburb, form.state)} area)
${form.odometer ? `ODOMETER: ${parseInt(form.odometer).toLocaleString()} km` : ''}
${primaryPrice ? `MECHANIC QUOTED: $${primaryPrice} AUD` : 'No quote — user wants a market estimate only.'}

MARKET DATA FROM OUR DATABASE (use these exact prices — do NOT change them):
- Price Low: $${cachedPriceLow}
- Price Average: $${cachedPriceAvg}
- Price High: $${cachedPriceHigh}

IMPORTANT: The price range above is already calibrated. Do NOT widen it or suggest a broader range.

Using ONLY the above market data, write a personalised analysis:
1. Determine verdict: ${primaryPrice ? `compare $${primaryPrice} to the range above` : 'set verdict to "fair" (estimate only)'}
   - "too_cheap" = quoted 15%+ below price_low
   - "fair" = at or below price_average
   - "market_rate" = above average but ≤ price_high
   - "high" = 15–24% above price_high
   - "ripoff" = 25%+ above price_high
2. Write a personalised 2-sentence summary in plain, professional Australian English mentioning their car and location. Tone must be neutral and factual — avoid loaded words like "predatory", "rip-off", "astronomical", "go-away price", "exploit", "scam", "bullshit". Use phrases like "well above market rate", "appears inflated", "significantly higher than typical".
3. Calculate counter_offer = price_low + 10%, and write counter_offer_reasoning in a polite, professional tone.
4. Write bs_meter (1–10, fairness score) and bs_meter_reasoning based on how the quoted price compares — keep reasoning objective and professional.
5. Write 3 mechanic_questions specific to this car and service.
6. Determine service_necessary (boolean) and write service_necessary_reasoning.
7. List whats_included (what should be done for this service on this car).
${form.quote_notes && (form.quote_notes.includes('no refund') || form.quote_notes.includes('cash only')) ? '8. Set acl_warning=true and write acl_warning_text.' : ''}

Do NOT fetch any external data. Use only the market prices provided above.`,
            add_context_from_internet: false,
            response_json_schema: {
              type: "object",
              properties: {
                verdict: { type: "string", enum: ["fair", "high", "ripoff", "too_cheap", "great_deal", "market_rate"] },
                summary: { type: "string" },
                counter_offer: { type: "number" },
                counter_offer_reasoning: { type: "string" },
                bs_meter: { type: "number" },
                bs_meter_reasoning: { type: "string" },
                mechanic_questions: { type: "array", items: { type: "string" } },
                service_necessary: { type: "boolean" },
                service_necessary_reasoning: { type: "string" },
                whats_included: { type: "array", items: { type: "object", properties: { item: { type: "string" }, description: { type: "string" } } } },
                acl_warning: { type: "boolean" },
                acl_warning_text: { type: "string" },
                high_variance_caveat: { type: "string" },
              },
            },
          });

          const record = await base44.entities.QuoteCheck.create({
            car_make: form.car_make, car_model: form.car_model, car_year: form.car_year,
            car_variant: form.car_variant || undefined,
            fuel_type: form.fuel_type || undefined,
            transmission_type: form.transmission_type || undefined,
            service_type: service, quoted_price: primaryPrice,
            dealership_price: dealershipPrice || undefined,
            mechanic_price: mechanicPrice || undefined,
            state: form.state, suburb: form.suburb,
            odometer: form.odometer ? parseInt(form.odometer) : undefined,
            last_service_km: form.last_service_km ? parseInt(form.last_service_km) : undefined,
            last_service_months: form.last_service_months ? parseInt(form.last_service_months) : undefined,
            quote_notes: form.quote_notes || undefined,
            price_low: cached.price_low,
            price_high: cached.price_high,
            price_average: cached.price_average,
            ...cachedAnalysis,
          });

          // Calculate and update savings if verdict is high or ripoff
          if ((cachedAnalysis.verdict === "high" || cachedAnalysis.verdict === "ripoff") && primaryPrice) {
            const savingsAmount = Math.max(0, primaryPrice - cached.price_average);
            if (savingsAmount > 0) {
              const currentUser = await base44.auth.me();
              const currentSavings = currentUser.savings_total || 0;
              await base44.auth.updateMe({ savings_total: currentSavings + savingsAmount });
            }
          }

          scheduleServiceFollowUp(record);
          navigate(form.estimate_only ? `/estimate-result?id=${record.id}` : `/results?id=${record.id}`);
          clearForm();
          return;
        }
      }

      const priceContext = form.estimate_only
         ? `No quote provided. The user just wants a market price estimate. Set verdict to "fair" and provide realistic price_low, price_average, price_high based on Australian market rates. Do not judge any quote — just give a range.`
         : `- Independent mechanic quoted price: $${mechanicPrice} AUD\nAssess if this is fair vs market rates.`;

       const odometer = form.odometer ? parseInt(form.odometer) : null;
       const lastServiceKm = form.last_service_km ? parseInt(form.last_service_km) : null;
       const lastServiceMonths = form.last_service_months ? parseInt(form.last_service_months) : null;
       const kmSinceService = odometer && lastServiceKm ? odometer - lastServiceKm : null;

       const carDesc = [
         `${form.car_year} ${form.car_make} ${form.car_model}`,
         form.car_variant ? `(${form.car_variant})` : "",
         form.fuel_type ? `- ${form.fuel_type}` : "",
         form.transmission_type ? `/ ${form.transmission_type}` : "",
       ].filter(Boolean).join(" ");

       // Pre-compute AU market adjustments
       const isCappedProgram = isCappedServiceMake(form.car_make);
       const isPremiumBrand = PREMIUM_BRANDS.has(form.car_make);
       const highVarianceWarning = hasHighVarianceWarning(form.car_make, form.car_model, form.car_variant);
       const regionalMultiplier = getRegionalMultiplier(form.state, form.suburb);
       const cappedProgramNote = isCappedProgram ? `\nThis ${form.car_make} likely qualifies for capped servicing. Search for "${form.car_make} capped service Australia ${new Date().getFullYear()}" to get exact pricing.` : "";
       const premiumBrandNote = isPremiumBrand ? `\nDealership labour rates are typically 50-60% higher than independent mechanics for this brand.` : "";
       const highVarianceNote = highVarianceWarning ? `\n${highVarianceWarning}` : "";

      const vehicleAgeYears = form.car_year ? (new Date().getFullYear() - parseInt(form.car_year)) : null;
      const isServiceType = service.toLowerCase().includes("service") || service.toLowerCase().includes("logbook");

      const prompt = `You are an expert Australian automotive mechanic pricing analyst. Follow these steps precisely.

      CAR: ${carDesc}
      USER-SELECTED SERVICE: ${service}
      LOCATION: ${form.state}, Australia (${getAreaType(form.suburb, form.state)} area)
      ${odometer ? `CURRENT ODOMETER: ${odometer.toLocaleString()} km` : ''}
      ${kmSinceService ? `KM SINCE LAST SERVICE: ${kmSinceService.toLocaleString()} km` : ''}
      ${lastServiceMonths ? `MONTHS SINCE LAST SERVICE: ${lastServiceMonths}` : ''}
      ${vehicleAgeYears !== null ? `VEHICLE AGE: ${vehicleAgeYears} years` : ''}
      ${uploadedUrls.length > 0 ? `USER UPLOADED ${uploadedUrls.length} PHOTO(S) (not analysed): assume possible wear consistent with the vehicle's age and odometer.` : ''}
      ${priceContext}

STEP 1 — SERVICE TYPE
Use the user-selected service type as-is: "${service}". Do NOT reclassify or upgrade it to a different service type.
Use the area type (metro/regional) for pricing calibration only. Do NOT use or reference any specific suburb or street address.
If the vehicle age or odometer suggests a more comprehensive service may be needed, mention it briefly in the summary field only — do NOT change the service type or pricing to reflect a different service.

STEP 2 — SEARCH FOR CAPPED PRICING FIRST (for logbook/service types only)
${cappedProgramNote}
Search: "${form.car_make} ${form.car_model} capped price servicing Australia ${new Date().getFullYear()}"
- If an active manufacturer capped program exists for this vehicle's age, extract the exact cost
- If no capped program exists or has expired, set cappedPricing.applicable = false

STEP 3 — SEARCH FOR REAL MARKET PRICING
Run these searches and use only prices from real invoices, AutoGuru, ServiceMyCar, or dealer websites. Reject generic articles or Airtasker estimates. Reject any data older than 18 months.
1. "${form.car_make} ${form.car_model} [corrected service type] cost ${getAreaType(form.suburb, form.state)} ${form.state} ${new Date().getFullYear()}"
2. "${form.car_make} ${form.car_model} logbook service price independent mechanic ${form.state} ${new Date().getFullYear()}"  
3. "${form.car_make} ${form.car_model} dealer service cost Australia ${new Date().getFullYear()}"
Extract: lowest real indie price, most common mid-range price, highest dealership price.
Never blend prices across different vehicle makes or models.

STEP 4 — CHECK SERVICE SCHEDULE
Search: "${form.car_make} ${form.car_model} ${form.car_year} service schedule inclusions"
Check if any of these are due at this interval based on odometer/age:
- Spark plugs, Timing belt, Transmission fluid
Search and add each due item's real cost separately to additionalItems.

STEP 5 — APPLY LOCATION ADJUSTMENT
${form.state}: Use this regional multiplier: ${regionalMultiplier}x
- Apply to ALL prices: price_low, price_high, price_average (e.g. if indie is $300 in Sydney, it's $${Math.round(300 * regionalMultiplier)} in this ${getAreaType(form.suburb, form.state)} area of ${form.state})

STEP 5B — DEALERSHIP PRICING
${isPremiumBrand ? `This is a PREMIUM BRAND (${form.car_make}). Dealerships charge 50-60% MORE than independents.` : `Standard brand. Dealerships charge 25-35% more than independents.`}
- price_high should reflect dealership upper bound, not just premium indie.

STEP 6 — PRICE RANGE RULES (CRITICAL):
- price_low = realistic budget indie mechanic (NOT the theoretical floor)
- price_high = dealership OR premium indie — MAX 35–40% above price_low. NEVER more.
- price_average = most common real-world price, must sit between low and high.
- A $300 average service does NOT have a $900 high. Keep ranges tight and realistic.
- Real Australian quotes for the same service vary by at most 30–40%.

STEP 7 — VERDICT RULES:
- "great_deal" = quoted is 1–14% BELOW price_low
- "fair" = quoted is at or below price_average
- "market_rate" = quoted is above price_average but at or below price_high
- "high" = quoted is 15–24% ABOVE price_high
- "ripoff" = quoted is 25%+ ABOVE price_high
- "too_cheap" = quoted is 15%+ BELOW price_low — set bs_meter to exactly 5
${form.estimate_only ? 'No quote provided — set verdict to "fair", provide market range only.' : ''}

ADDITIONAL RULES:
- HIGH-VARIANCE CHECK: ${highVarianceNote || "Check if premium sub-variants exist for this car (e.g. air suspension, run-flat tyres, M-sport, AMG). If so, set high_variance_caveat. Otherwise leave it empty."}
${premiumBrandNote || ""}
- Dealerships charge 25–40% more than independents on standard brands, but 50-60% more on premium brands (BMW, Mercedes, Audi, Porsche, etc.). Parts markup above 50% is excessive.
- For counter_offer: use Sparesbox/Repco parts cost + fair local labour rate.
- ACL check: if quote_notes mention "no refund", "cash only", "no warranty" → acl_warning = true.
- Fairness score 1–10: 1–3 fair quote, 4–6 some concerns, 7–10 significant concerns. Be objective and professional. Avoid loaded language like "predatory", "rip-off", "astronomical", "go-away price", "exploit", "bullshit", "scam". Use neutral, factual phrases like "well above market rate", "significantly higher than typical", "unusually high for this work", "appears inflated", "out of line with comparable quotes".
- price_low and price_high must represent the CONSERVATIVE bottom 25–50% of real market prices.
- Every price must come from a search result. If no usable price found, return null for that field.
- Plain Australian English only — no jargon, no US spelling.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            verdict: { type: "string", enum: ["fair", "high", "ripoff", "too_cheap", "great_deal", "market_rate"] },
            high_variance_caveat: { type: "string" },
            price_low: { type: "number" },
            price_high: { type: "number" },
            price_average: { type: "number" },
            whats_included: { type: "array", items: { type: "object", properties: { item: { type: "string" }, description: { type: "string" } } } },
            counter_offer: { type: "number" },
            counter_offer_reasoning: { type: "string" },
            summary: { type: "string" },
            bs_meter: { type: "number" },
            bs_meter_reasoning: { type: "string" },
            mechanic_questions: { type: "array", items: { type: "string" } },
            acl_warning: { type: "boolean" },
            acl_warning_text: { type: "string" },
            service_necessary: { type: "boolean" },
            service_necessary_reasoning: { type: "string" },
          },
        },
      });

      const record = await base44.entities.QuoteCheck.create({
        car_make: form.car_make, car_model: form.car_model, car_year: form.car_year,
        car_variant: form.car_variant || undefined,
        fuel_type: form.fuel_type || undefined,
        transmission_type: form.transmission_type || undefined,
        service_type: service, quoted_price: primaryPrice,
        dealership_price: dealershipPrice || undefined,
        mechanic_price: mechanicPrice || undefined,
        state: form.state, suburb: form.suburb,
        odometer: form.odometer ? parseInt(form.odometer) : undefined,
        last_service_km: form.last_service_km ? parseInt(form.last_service_km) : undefined,
        last_service_months: form.last_service_months ? parseInt(form.last_service_months) : undefined,
        quote_notes: form.quote_notes || undefined,
        ...result,
      });

      // Calculate and update savings if verdict is high or ripoff
      if ((result.verdict === "high" || result.verdict === "ripoff") && primaryPrice) {
        const savingsAmount = Math.max(0, primaryPrice - result.price_average);
        if (savingsAmount > 0) {
          const currentUser = await base44.auth.me();
          const currentSavings = currentUser.savings_total || 0;
          await base44.auth.updateMe({ savings_total: currentSavings + savingsAmount });
        }
      }

      scheduleServiceFollowUp(record);
      navigate(form.estimate_only ? `/estimate-result?id=${record.id}` : `/results?id=${record.id}`);
      clearForm();
    } catch (err) {
      // Credits were deducted up-front — refund server-side on failure
      await refundCredit();
      toast.error("Analysis failed. Your credits have been refunded. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  if (loading) {
    return <EstimateLoader />;
  }

  return (
    <>
      {showGuestGate && <GuestGate onClose={() => setShowGuestGate(false)} />}

      {showPaywall && (
        <SubscriptionModal
          onClose={() => setShowPaywall(false)}
          onSuccess={(c) => { setShowPaywall(false); toast.success(`${c} credits added!`); }}
        />
      )}

      {/* Instant Quote Analyser — only on step 0 */}
      {step === 0 && (
        <div className="mb-5">
          <QuoteScanner onPartialData={(data) => {
            if (onSetPrefill) onSetPrefill(data);
            setForm(f => ({ ...f, ...data }));
            setStep(0);
            setDirection(1);
            setShowVehicleForm(true);
          }} />
          {!showVehicleForm && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowVehicleForm(true)}
                className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                or enter manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Vehicle form reveal */}
      {step === 0 && !showVehicleForm && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Snap or upload your quote above for instant market analysis.</p>
        </div>
      )}

      {/* Progress Bar — only when form is visible */}
      {(showVehicleForm || step > 0) && (
      <div className="mb-6">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div className="h-full bg-accent rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
        </div>
      </div>
      )}

      <div className="overflow-hidden relative" style={{ display: (showVehicleForm || step > 0) ? 'block' : 'none' }}>
        <AnimatePresence mode="wait" custom={direction}>

          {/* STEP 0: Your Ride */}
          {step === 0 && (
            <motion.div key="step0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
              <div className="mb-4">
                <p className="text-2xl font-heading font-black text-[#1a237e] mb-1.5 leading-tight">Your Vehicle</p>
                <p className="text-sm text-slate-500">Tell us about your car to tailor the analysis.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Make</label>
                <select value={form.car_make} onChange={e => update("car_make", e.target.value)} className={selectClass}>
                  <option value="">Select make...</option>
                  {CAR_MAKES.map(make => <option key={make} value={make}>{make}</option>)}
                </select>
              </div>

              {form.car_make && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Model</label>
                  <select value={form.car_model} onChange={e => update("car_model", e.target.value)} className={selectClass}>
                    <option value="">Select model...</option>
                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                    <option value="Other">Other</option>
                  </select>
                  {form.car_model === "Other" && (
                    <Input placeholder="Enter model..." value={form.custom_model || ""}
                      onChange={e => update("custom_model", e.target.value)}
                      className="h-12 bg-secondary/50 border-0 font-medium" />
                  )}
                </div>
              )}

              {form.car_model && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Year</label>
                  <select value={form.car_year} onChange={e => update("car_year", e.target.value)}
                    className={`${selectClass} ${yearInvalid ? 'ring-2 ring-destructive' : ''}`}>
                    <option value="">Select year...</option>
                    {(() => {
                      const firstYear = MAKE_FIRST_YEAR[form.car_make] || 2000;
                      const currentYear = new Date().getFullYear();
                      const years = [];
                      for (let y = currentYear; y >= firstYear; y--) {
                        years.push(String(y));
                      }
                      return years.map(yr => <option key={yr} value={yr}>{yr}</option>);
                    })()}
                  </select>
                  {yearInvalid && (
                    <p className="text-xs text-destructive font-semibold">
                      ⚠️ {form.car_make} {form.car_model} was not available in {form.car_year}. Please select a valid year.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 1: Engine & Variant */}
          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
              <div className="mb-4">
                <p className="text-2xl font-heading font-black text-[#1a237e] mb-1.5 leading-tight">Engine & Variant</p>
                <p className="text-sm text-slate-500">Helps us calculate the exact parts cost for your {form.car_year} {form.car_make} {form.car_model}.</p>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Engine / Variant <span className="normal-case font-normal text-muted-foreground">(optional)</span>
                  </label>
                  {variantOptions.length > 0 ? (
                    <select value={form.car_variant || ""} onChange={e => update("car_variant", e.target.value)} className={selectClass}>
                      <option value="">Select engine/variant...</option>
                      {variantOptions.map(v => <option key={v} value={v}>{v}</option>)}
                      <option value="__other__">Other / Not Listed</option>
                    </select>
                  ) : null}
                  {(variantOptions.length === 0 || form.car_variant === "__other__") && (
                    <Input
                      placeholder="e.g. 2.0L Turbo, V6, Hybrid..."
                      value={form.car_variant === "__other__" ? (form._customVariant || "") : (form.car_variant || "")}
                      onChange={e => {
                        if (variantOptions.length > 0) {
                          setForm(f => ({ ...f, _customVariant: e.target.value, car_variant: e.target.value }));
                        } else {
                          update("car_variant", e.target.value);
                        }
                      }}
                      className="h-12 bg-secondary/50 border-0 font-medium"
                    />
                  )}
                </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Fuel Type <span className="normal-case font-normal text-muted-foreground">(optional)</span>
                </label>
                <select value={form.fuel_type || ""} onChange={e => update("fuel_type", e.target.value)} className={selectClass}>
                  <option value="">Select fuel type...</option>
                  {fuelTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Transmission <span className="normal-case font-normal text-muted-foreground">(optional)</span>
                </label>
                <select value={form.transmission_type || ""} onChange={e => update("transmission_type", e.target.value)} className={selectClass}>
                  <option value="">Select transmission...</option>
                  {transmissionOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <p className="text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                Diesel and hybrid vehicles often have different service costs. Selecting accurately improves the verdict.
              </p>
            </motion.div>
          )}

          {/* STEP 2: Services */}
          {step === 2 && (
            <Step2Services
              form={form}
              photos={photos}
              setPhotos={setPhotos}
              cameraInputRef={cameraInputRef}
              fileInputRef={fileInputRef}
              handleFileAdd={handleFileAdd}
              filteredServiceCategories={filteredServiceCategories}
              toggleService={toggleService}
              update={update}
            />
          )}

          {/* STEP 3: The Quote */}
          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }} className="space-y-5">
              <div className="mb-4">
                <p className="text-2xl font-heading font-black text-[#1a237e] mb-1.5 leading-tight">Quote & Location</p>
                <p className="text-sm text-slate-500">Enter the quoted price and your location — we'll do the rest.</p>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quoted Price</p>

                {/* Toggle: have a quote vs just want estimate */}
                <div className="flex rounded-xl overflow-hidden border border-border">
                  <button type="button"
                    onClick={() => update("estimate_only", false)}
                    className={`flex-1 py-2.5 text-xs font-bold transition-colors ${!form.estimate_only ? "bg-[#0A0F2C] text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>
                    I have a quote
                  </button>
                  <button type="button"
                    onClick={() => update("estimate_only", true)}
                    className={`flex-1 py-2.5 text-xs font-bold transition-colors ${form.estimate_only ? "bg-[#0A0F2C] text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`}>
                    Just get an estimate
                  </button>
                </div>

                {!form.estimate_only && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Mechanic's quoted price ($)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">$</span>
                      <Input type="text" inputMode="decimal" placeholder="0" value={form.mechanic_price}
                        onChange={e => update("mechanic_price", e.target.value)}
                        className="h-12 bg-background border border-border font-medium pl-7" />
                    </div>
                  </div>
                )}

                {form.estimate_only && (
                  <p className="text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    We'll calculate the typical market range for this service — no quote needed.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">State</label>
                <select value={form.state} onChange={e => update("state", e.target.value)} className={selectClass}>
                  <option value="">Select state...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {form.state && (
                <SuburbSearch
                  state={form.state}
                  value={form.suburb}
                  onChange={val => update("suburb", val)}
                />
               )}

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Additional Details <span className="normal-case font-normal">(optional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Odometer (km)</label>
                    <Input type="number" placeholder="85000" value={form.odometer} onChange={e => update("odometer", e.target.value)} className="h-10 bg-secondary/50 border-0 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Last Service Date</label>
                    <Input type="date" value={form.last_service_date || ""} onChange={e => update("last_service_date", e.target.value)} className="h-10 bg-secondary/50 border-0 text-sm" />
                    {form.last_service_date && form.last_service_months !== "" && (
                      <p className="text-xs text-muted-foreground mt-1">~{form.last_service_months} months ago</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Last service (km)</label>
                    <Input type="number" placeholder="75000" value={form.last_service_km} onChange={e => update("last_service_km", e.target.value)} className="h-10 bg-secondary/50 border-0 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Months since service</label>
                    <Input type="number" placeholder="12" value={form.last_service_months} onChange={e => update("last_service_months", e.target.value)} className="h-10 bg-secondary/50 border-0 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Input placeholder="Paste quote notes or extra details..." value={form.quote_notes} onChange={e => update("quote_notes", e.target.value)} className="h-11 bg-secondary/50 border-0" />
                  <p className="text-[10px] text-muted-foreground px-1">⚠️ Do not include personal details (names, addresses, phone numbers) — notes are used to improve your analysis only.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={goBack} className="h-14 px-5 rounded-2xl flex items-center gap-1 font-semibold border-slate-200">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext} disabled={!stepValid[step]}
            className="flex-1 h-14 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none transition-all">
            Continue <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit} disabled={!step3Valid || loading}
            className="flex-1 h-14 rounded-2xl bg-[#f97316] hover:bg-[#ea6c0a] text-white font-heading font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-200 disabled:opacity-50 disabled:shadow-none transition-all">
            <>Analyse Quote <Zap className="h-5 w-5" /></>
          </Button>
        )}
      </div>

      {step === 0 && (
        <button type="button" onClick={clearForm} className="w-full mt-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1">
          Clear & start over
        </button>
      )}
    </>
  );
}