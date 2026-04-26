import {
  AlertInterpretation,
  AlertLevel,
  NdviData,
  RainfallData,
  SoilMoistureData,
  SolutionsInterpretation
} from "../types";

const LOCAL_LANGUAGE_NOTES: Record<string, string> = {
  english: "",
  dari: "خلاصه مشاوره فعلاً تنها به انگلیسی موجود است. لطفاً بعداً دوباره امتحان کنید یا با تیم میدانی هماهنگ کنید.",
  pashto: "د لارښوونې لنډیز اوس مهال یوازې په انګلیسي کې شته. وروسته بیا هڅه وکړئ یا د ساحې له ډلې سره اړیکه ونیسئ.",
  arabic: "ملخص الإرشاد متاح حالياً بالإنجليزية فقط. يرجى المحاولة لاحقاً أو التنسيق مع الفريق الميداني.",
  french:
    "Le résumé du conseil n'est disponible qu'en anglais pour le moment. Réessayez plus tard ou coordonnez-vous avec l'équipe de terrain.",
  amharic: "ማጠቃለያ ምክር በአሁኑ ጊዜ በእንግሊዝኛ ብቻ ይገኛል። እባክዎ ቆይተው ይሞክሩ።",
  somali:
    "Soo koobida talooyinka waxaa hadda lagu heli karaa Ingiriis kaliya. Fadlan dib u isku day mar dambe ama la xiriir kooxda goobta.",
  hausa: "Takaitaccen shawarwari yanzu yana cikin Turanci kawai. Da fatan za a sake gwadawa daga baya.",
  tigrinya: "መጠቓለሊ ምኽሪ ሕጂ ብእንግሊዝኛ ጥራይ ኣሎ። በጃኹም ደሓር ፈትኑ።"
};

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSummary(
  alertLevel: AlertLevel,
  crop: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null
): string {
  const sentences: string[] = [];
  const cropTitle = capitalize(crop);

  switch (alertLevel) {
    case "act_now":
      sentences.push(`Severe drought stress is currently affecting ${crop} at this location.`);
      break;
    case "watch":
      sentences.push(
        `Early drought stress is emerging for ${crop} at this location — act before conditions deepen.`
      );
      break;
    default:
      sentences.push(`${cropTitle} growing conditions are near seasonal norms at this location.`);
  }

  const concerns: string[] = [];
  if (sm && sm.anomaly_pct <= -25) {
    concerns.push(`soil moisture is roughly ${Math.abs(sm.anomaly_pct)}% below the seasonal baseline`);
  }
  if (rf && rf.anomaly_pct <= -10) {
    concerns.push(`rainfall over the past 30 days is about ${Math.abs(rf.anomaly_pct)}% below normal`);
  }
  if (ndvi && (ndvi.classification === "severe_stress" || ndvi.classification === "bare_soil")) {
    concerns.push("vegetation is showing severe stress");
  } else if (ndvi && ndvi.classification === "moderate_stress") {
    concerns.push("vegetation is showing moderate stress");
  }
  if (concerns.length > 0) {
    sentences.push(`Specifically, ${concerns.join("; ")}.`);
  }

  if (alertLevel === "act_now") {
    sentences.push(
      "Trigger field response measures today to protect yields, livestock, and household food security."
    );
  } else if (alertLevel === "watch") {
    sentences.push("Increase monitoring frequency and conserve water inputs in advance of further decline.");
  } else {
    sentences.push("Maintain routine monitoring and standard management practices.");
  }

  return sentences.join(" ");
}

function buildActions(alertLevel: AlertLevel, crop: string): string[] {
  const cropLower = crop.toLowerCase();
  const actions: string[] = [];

  if (alertLevel === "act_now") {
    actions.push(
      `Prioritize irrigation for the highest-value ${crop} plots; defer non-critical applications until conditions stabilize.`
    );
    actions.push(
      `Mulch ${crop} beds with crop residue, straw, or leaves (5–10 cm thick) to cut surface evaporation by 20–40%.`
    );
    if (cropLower === "wheat") {
      actions.push(
        "If wheat is at booting or grain-fill, deliver one critical irrigation now — it protects most of the harvest yield."
      );
    } else if (cropLower === "rice") {
      actions.push(
        "Switch rice plots to alternate wetting-and-drying (AWD) irrigation to save 25–30% of water with minimal yield loss."
      );
    } else if (cropLower === "maize") {
      actions.push(
        "Time any remaining irrigation around silking on maize — a single well-placed irrigation can salvage substantial yield."
      );
    } else if (cropLower === "sorghum") {
      actions.push(
        "Sorghum tolerates dry spells well — concentrate scarce water on flowering plots and let mature plots finish on residual moisture."
      );
    } else if (cropLower === "cotton") {
      actions.push(
        "Skip irrigation on marginal cotton land; concentrate water and labor on plots that are already at peak squaring or flowering."
      );
    }
    actions.push(
      "Coordinate with local NGOs and government extension for emergency water-truck deliveries and livestock feed support."
    );
    actions.push(
      "Destock surplus livestock now while market prices are still reasonable — better than losing animals to thirst or starvation."
    );
    actions.push(
      "Plan a staggered, drought-tolerant variety mix for the next planting season to spread risk."
    );
  } else if (alertLevel === "watch") {
    actions.push(
      `Increase soil-moisture monitoring on key ${crop} plots to at least twice weekly using simple tensiometers or feel tests.`
    );
    actions.push(
      "Defer non-critical irrigation and reserve stored water for upcoming critical growth stages."
    );
    actions.push(
      `Inspect ${crop} for early stress signs — wilting at midday, leaf curl, premature yellowing — and act on small problems before they compound.`
    );
    actions.push(
      "Repair or build small water-harvesting structures: tied ridges, contour bunds, rooftop collection into drums."
    );
    actions.push(
      "Mulch high-value plots now, while it is easier to apply, before crops are heat-stressed."
    );
    if (["wheat", "rice", "maize"].includes(cropLower)) {
      actions.push(
        `Plan staggered irrigation timed to ${crop}'s critical growth windows so scarce water is applied where it has highest impact.`
      );
    }
  } else {
    actions.push(`Continue routine weekly monitoring of ${crop} plots and surrounding pasture or fallow land.`);
    actions.push("Maintain standard irrigation schedules; no special drought interventions required at this time.");
    actions.push(
      "Build resilience while conditions are stable: increase soil organic matter via compost, cover crops, and residue retention."
    );
    actions.push(
      "Construct or repair small water-harvesting works during this low-stress window — they pay off in the next dry spell."
    );
    actions.push(
      "Keep a small contingency stock of drought-tolerant seed varieties on hand for rapid substitution if next season turns dry."
    );
  }

  return actions;
}

function buildEffectsList(
  alertLevel: AlertLevel,
  crop: string
): string[] {
  const cropTitle = capitalize(crop);
  const effects: string[] = [];

  if (alertLevel === "act_now") {
    effects.push(
      `${cropTitle} yields can drop 30–60% if these conditions persist another 2–4 weeks without intervention.`
    );
    effects.push(
      "Pasture and surface-water sources are degrading; livestock body condition, milk yields, and calving rates will decline."
    );
    effects.push(
      "Household food reserves face pressure as planting and harvest cycles slip out of alignment with the seasonal calendar."
    );
    effects.push(
      "Tensions over shared irrigation, wells, and grazing rights typically rise during severe drought."
    );
    effects.push(
      "Seasonal labor migration may accelerate, especially among youth, as on-farm work and informal income disappear."
    );
    effects.push(
      "Soil structure deteriorates from prolonged drying, increasing erosion risk when rains finally arrive."
    );
  } else if (alertLevel === "watch") {
    effects.push(
      `Yield reduction of 10–20% is plausible if dry conditions persist into ${crop}'s critical growth stage.`
    );
    effects.push(
      "Irrigation cycles may need to lengthen, increasing pumping costs for groundwater users and wearing on equipment."
    );
    effects.push(
      "Localized pasture degradation can affect smallholder herds before larger pastures show stress."
    );
    effects.push(
      "Surface ponds and small reservoirs draw down faster than the seasonal average, shrinking reserves for late-season use."
    );
    effects.push(
      "Pest and disease pressure on stressed plants may rise — aphids, mites, and fungal flare-ups after dew events."
    );
  } else {
    effects.push("Conditions remain within tolerable ranges; standard agronomic risks apply.");
    effects.push("Routine pest and disease pressure expected — nothing acute driven by drought.");
    effects.push("Water resources are tracking near seasonal averages.");
    effects.push("Pasture growth and livestock condition should hold near-normal trajectories.");
  }

  return effects;
}

function buildSolutionsList(alertLevel: AlertLevel, crop: string): string[] {
  const cropLower = crop.toLowerCase();
  const items: string[] = [];

  if (alertLevel === "act_now") {
    items.push(
      `Triage irrigation: prioritize ${crop} plots in late vegetative or reproductive stages — they have the most yield to protect.`
    );
    items.push(
      "Apply 5–10 cm of mulch (crop residue, straw, leaves) on critical plots to cut surface evaporation by 20–40%."
    );
    if (cropLower === "wheat") {
      items.push(
        "Deliver one critical wheat irrigation at booting or heading — this single application protects most of the grain yield."
      );
    } else if (cropLower === "rice") {
      items.push(
        "Switch rice to alternate wetting and drying (AWD) irrigation; saves 25–30% of water with minimal yield loss."
      );
    } else if (cropLower === "maize") {
      items.push(
        "For maize, prioritize irrigation around silking — even one well-timed application can salvage substantial yield."
      );
    } else if (cropLower === "sorghum") {
      items.push(
        "Sorghum is drought-tolerant — concentrate scarce water on flowering plots and let mature ones finish on residual soil moisture."
      );
    } else if (cropLower === "cotton") {
      items.push(
        "Skip irrigation on marginal cotton; focus inputs on plots already at peak squaring or flowering."
      );
    }
    items.push(
      "Coordinate with NGOs (FAO, WFP, regional partners) and government extension for emergency water trucking and livestock feed."
    );
    items.push(
      "Destock surplus livestock now while market prices remain reasonable — better than losing animals to thirst."
    );
    items.push("Activate community grain banks or contingency food reserves where they exist.");
    items.push(
      "For next season, order drought-tolerant, early-maturing varieties and plan staggered planting to spread risk."
    );
  } else if (alertLevel === "watch") {
    items.push(
      "Increase soil-moisture monitoring (visual inspection, simple tensiometers) to twice weekly on key plots."
    );
    items.push(
      "Defer non-critical irrigation and reserve stored water for upcoming critical growth stages."
    );
    items.push(
      "Repair or build small water-harvesting structures: tied ridges, contour bunds, rooftop collection feeding into drums."
    );
    items.push(
      "Mulch high-value plots now while water stress is moderate — easier to apply before crops are heat-stressed."
    );
    items.push(
      "Plan staggered planting for next season to spread risk across multiple weather windows."
    );
    items.push(
      "Engage local NGOs and government extension to verify whether early-warning mechanisms or weather-index insurance are available."
    );
    items.push(`Inspect ${crop} for early stress and pest flare-ups; act on small problems before they compound.`);
  } else {
    items.push("Maintain baseline soil-moisture and pasture monitoring on a weekly cycle.");
    items.push(
      "Build resilience while conditions are stable: increase soil organic matter via compost, cover crops, and residue retention."
    );
    items.push(
      "Construct small water-harvesting works during this low-pressure period — they pay off in the next dry spell."
    );
    items.push(
      "Keep contingency seed of drought-tolerant varieties on hand for rapid switching if next season turns dry."
    );
    items.push("Document field conditions weekly to build a local baseline for future comparison.");
    items.push("Engage with local NGO and government training opportunities on climate-smart agriculture.");
  }

  return items;
}

function fallbackNote(reason?: string): string {
  if (!reason) return "";
  return ` (Note: AI advisor temporarily unavailable — ${reason}; rule-based summary shown.)`;
}

export function buildFallbackAdvisory(
  alertLevel: AlertLevel,
  cropType: string,
  language: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null,
  reason?: string
): AlertInterpretation {
  return {
    english_summary: buildSummary(alertLevel, cropType, sm, rf, ndvi) + fallbackNote(reason),
    local_language_guidance: LOCAL_LANGUAGE_NOTES[language.toLowerCase()] ?? "",
    recommended_actions: buildActions(alertLevel, cropType),
    structured_response: true
  };
}

export function buildFallbackSolutions(
  alertLevel: AlertLevel,
  cropType: string,
  language: string,
  sm: SoilMoistureData | null,
  rf: RainfallData | null,
  ndvi: NdviData | null,
  reason?: string
): SolutionsInterpretation {
  return {
    effects: buildEffectsList(alertLevel, cropType),
    solutions: buildSolutionsList(alertLevel, cropType),
    english_summary: buildSummary(alertLevel, cropType, sm, rf, ndvi) + fallbackNote(reason),
    local_language_summary: LOCAL_LANGUAGE_NOTES[language.toLowerCase()] ?? "",
    structured_response: true
  };
}
