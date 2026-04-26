const RTL_LANGUAGES = new Set(["dari", "pashto", "arabic", "tigrinya"]);

const SEVERITY_COLORS = {
  normal: "#689f38",
  watch: "#c5a059",
  act_now: "#ba1a1a",
  pending: "#7f7667"
};

const ALERT_THEME = {
  normal: {
    eyebrow: "Status: Normal",
    title: "Conditions stable",
    subtitle: "No coordinated drought stress detected for this location.",
    banner: "bg-[#eef7e2] border-recovery/40",
    chip: "bg-recovery text-white",
    icon: "check_circle",
    iconBg: "bg-recovery"
  },
  watch: {
    eyebrow: "Status: Watch",
    title: "Stress emerging — monitor closely",
    subtitle: "At least one signal is trending below the seasonal baseline.",
    banner: "bg-primary-fixed border-primary-container",
    chip: "bg-primary-container text-on-primary-container",
    icon: "warning",
    iconBg: "bg-primary-container"
  },
  act_now: {
    eyebrow: "Status: Act Now",
    title: "Severe drought stress — intervene today",
    subtitle: "Multiple signals are far below normal. Trigger field response.",
    banner: "bg-error-container border-error/50",
    chip: "bg-error text-white",
    icon: "emergency_home",
    iconBg: "bg-error"
  }
};

const SIGNAL_DEFS = [
  {
    key: "soil_moisture",
    label: "Soil Moisture",
    icon: "humidity_percentage",
    accent: "text-tertiary",
    track: "bg-tertiary",
    valueFormatter: (signal) => `${signal.value} m³/m³`,
    secondary: (signal) => signal.source || "NASA SMAP"
  },
  {
    key: "rainfall",
    label: "Rainfall (30 days)",
    icon: "rainy",
    accent: "text-primary-container",
    track: "bg-primary-container",
    valueFormatter: (signal) => `${signal.anomaly_pct}% vs normal`,
    secondary: (signal) => `${signal.period_days}-day window · ${signal.source || "NASA GPM IMERG"}`
  },
  {
    key: "ndvi",
    label: "Vegetation (NDVI)",
    icon: "eco",
    accent: "text-recovery",
    track: "bg-recovery",
    valueFormatter: (signal) => `${signal.value} index`,
    secondary: (signal) => `${formatClassification(signal.classification)} · ${signal.source || "NASA MODIS/VIIRS NDVI"}`
  }
];

const HOTSPOTS = [
  { id: "kabul", name: "Hindu Kush belt", country: "Afghanistan", iso_a3: "AFG", latitude: 34.5553, longitude: 69.2075, crop: "wheat" },
  { id: "kandahar", name: "Helmand basin", country: "Afghanistan", iso_a3: "AFG", latitude: 31.6133, longitude: 65.7158, crop: "wheat" },
  { id: "mopti", name: "Inner Niger delta", country: "Mali", iso_a3: "MLI", latitude: 14.4843, longitude: -4.1981, crop: "sorghum" },
  { id: "niamey", name: "Niamey corridor", country: "Niger", iso_a3: "NER", latitude: 13.5128, longitude: 2.1128, crop: "sorghum" },
  { id: "ndjamena", name: "Lake Chad rim", country: "Chad", iso_a3: "TCD", latitude: 12.1348, longitude: 15.0557, crop: "sorghum" },
  { id: "khartoum", name: "Blue Nile junction", country: "Sudan", iso_a3: "SDN", latitude: 15.5007, longitude: 32.5599, crop: "sorghum" },
  { id: "addis", name: "Ethiopian highlands", country: "Ethiopia", iso_a3: "ETH", latitude: 9.1450, longitude: 40.4897, crop: "wheat" },
  { id: "mogadishu", name: "Somali coast", country: "Somalia", iso_a3: "SOM", latitude: 2.0469, longitude: 45.3182, crop: "maize" },
  { id: "turkana", name: "Lake Turkana", country: "Kenya", iso_a3: "KEN", latitude: 3.0500, longitude: 36.0500, crop: "maize" },
  { id: "rajasthan", name: "Thar desert edge", country: "India", iso_a3: "IND", latitude: 26.9124, longitude: 75.7873, crop: "wheat" },
  { id: "sindh", name: "Indus floodplain", country: "Pakistan", iso_a3: "PAK", latitude: 25.3960, longitude: 68.3578, crop: "rice" },
  { id: "atacama", name: "Atacama frontier", country: "Chile", iso_a3: "CHL", latitude: -23.6509, longitude: -70.3975, crop: "maize" },
  { id: "saopaulo", name: "Cerrado heartland", country: "Brazil", iso_a3: "BRA", latitude: -15.7801, longitude: -47.9292, crop: "maize" },
  { id: "california", name: "Central Valley", country: "USA", iso_a3: "USA", latitude: 36.7783, longitude: -119.4179, crop: "cotton" },
  { id: "murray", name: "Murray-Darling", country: "Australia", iso_a3: "AUS", latitude: -34.0522, longitude: 142.6680, crop: "wheat" },
  { id: "capetown", name: "Western Cape", country: "South Africa", iso_a3: "ZAF", latitude: -33.9249, longitude: 18.4241, crop: "wheat" }
];

const elements = {
  form: document.getElementById("alert-form"),
  status: document.getElementById("status"),
  submit: document.getElementById("submit-btn"),
  submitLabel: document.getElementById("submit-label"),
  cropPills: document.getElementById("crop-pills"),
  cropHidden: document.getElementById("crop_type"),
  language: document.getElementById("language"),
  latitude: document.getElementById("latitude"),
  longitude: document.getElementById("longitude"),
  coordDisplay: document.getElementById("coord-display"),
  coordRegion: document.getElementById("coord-region"),
  fetchedAt: document.getElementById("fetched-at"),
  coverageChip: document.getElementById("coverage-chip"),
  banner: document.getElementById("alert-banner"),
  alertEyebrow: document.getElementById("alert-eyebrow"),
  alertTitle: document.getElementById("alert-title"),
  alertSubtitle: document.getElementById("alert-subtitle"),
  alertIconWrap: document.getElementById("alert-icon-wrap"),
  alertIcon: document.getElementById("alert-icon"),
  compositeScore: document.getElementById("composite-score"),
  signalGrid: document.getElementById("signal-grid"),
  advisoryEmpty: document.getElementById("advisory-empty"),
  advisoryBody: document.getElementById("advisory-body"),
  advisorySummary: document.getElementById("advisory-summary"),
  advisoryActions: document.getElementById("advisory-actions"),
  advisoryMeta: document.getElementById("advisory-meta"),
  rawJson: document.getElementById("raw-json"),
  langButtons: document.querySelectorAll(".lang-toggle"),
  quickLocate: document.getElementById("quick-locate"),
  scanBtn: document.getElementById("scan-hotspots"),
  scanLabel: document.getElementById("scan-label"),
  resetMapBtn: document.getElementById("reset-map"),
  mapStatus: document.getElementById("map-status"),
  solutionsBtn: document.getElementById("solutions-btn"),
  solutionsLabel: document.getElementById("solutions-label"),
  solutionsStatus: document.getElementById("solutions-status"),
  solutionsBody: document.getElementById("solutions-body"),
  solutionsEffects: document.getElementById("solutions-effects"),
  solutionsList: document.getElementById("solutions-list"),
  solutionsSummaryEn: document.getElementById("solutions-summary-en"),
  solutionsSummaryLocal: document.getElementById("solutions-summary-local")
};

const state = {
  lastResponse: null,
  lastQuery: null,
  language: "en",
  hotspotResults: new Map(),
  countryResults: new Map(),
  scanInFlight: false,
  solutionsInFlight: false,
  countriesData: null
};

const map = L.map("world-map", {
  center: [15, 20],
  zoom: 2,
  minZoom: 2,
  worldCopyJump: true,
  zoomControl: true,
  scrollWheelZoom: true
});

L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 18
}).addTo(map);

const hotspotMarkers = new Map();
const clickMarker = L.layerGroup().addTo(map);

const COUNTRY_GEOJSON_URL =
  "https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";

let countriesLayer = null;

function severityColorForLevel(level) {
  return SEVERITY_COLORS[level] || SEVERITY_COLORS.pending;
}

function featureIsoA3(feature) {
  const props = feature.properties || {};
  return (
    props.ISO_A3 ||
    props.ADM0_A3 ||
    props.iso_a3 ||
    props.ISO_A3_EH ||
    props.SOV_A3 ||
    null
  );
}

function featureName(feature) {
  const props = feature.properties || {};
  return props.ADMIN || props.NAME || props.NAME_LONG || props.SOVEREIGNT || "Unknown";
}

function styleCountry(feature) {
  const iso = featureIsoA3(feature);
  const result = iso ? state.countryResults.get(iso) : null;
  if (!result) {
    return {
      fillColor: "#ffffff",
      fillOpacity: 0,
      color: "#7f7667",
      weight: 0.4,
      opacity: 0.4,
      className: "country-layer-path"
    };
  }
  return {
    fillColor: severityColorForLevel(result.level),
    fillOpacity: 0.4,
    color: "#1e1b16",
    weight: 0.8,
    opacity: 0.7,
    className: "country-layer-path"
  };
}

function refreshCountryStyles() {
  if (countriesLayer) {
    countriesLayer.setStyle(styleCountry);
  }
}

function pointInRing(point, ring) {
  let inside = false;
  const x = point[0];
  const y = point[1];
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    return pointInRing(point, geometry.coordinates[0]);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((poly) => pointInRing(point, poly[0]));
  }
  return false;
}

function findCountryAt(latitude, longitude) {
  if (!state.countriesData) return null;
  const point = [longitude, latitude];
  for (const feature of state.countriesData.features) {
    if (pointInGeometry(point, feature.geometry)) {
      return feature;
    }
  }
  return null;
}

function recordCountryResult(latitude, longitude, level, isoA3) {
  let iso = isoA3 || null;
  if (!iso) {
    const feature = findCountryAt(latitude, longitude);
    if (feature) iso = featureIsoA3(feature);
  }
  if (!iso) return;
  state.countryResults.set(iso, { level, ts: Date.now() });
  refreshCountryStyles();
}

function getCountryCentroid(feature) {
  const acc = { x: 0, y: 0, n: 0 };
  const accumulate = (ring) => {
    for (const [x, y] of ring) {
      acc.x += x;
      acc.y += y;
      acc.n += 1;
    }
  };
  if (!feature.geometry) return null;
  if (feature.geometry.type === "Polygon") {
    accumulate(feature.geometry.coordinates[0]);
  } else if (feature.geometry.type === "MultiPolygon") {
    for (const poly of feature.geometry.coordinates) accumulate(poly[0]);
  }
  if (acc.n === 0) return null;
  return [acc.y / acc.n, acc.x / acc.n];
}

function handleCountryClick(feature) {
  const centroid = getCountryCentroid(feature);
  if (!centroid) return;
  const [lat, lon] = centroid;
  elements.latitude.value = lat.toFixed(4);
  elements.longitude.value = lon.toFixed(4);
  updateCoordDisplay();
  if (elements.coordRegion) {
    elements.coordRegion.textContent = `${featureName(feature)} · centroid`;
  }
  clickMarker.clearLayers();
  L.circleMarker([lat, lon], {
    radius: 7,
    color: "#1e1b16",
    weight: 1.5,
    fillColor: "#005faf",
    fillOpacity: 0.85
  })
    .bindPopup(
      `<div style="font-family:'Space Grotesk',sans-serif; font-weight:600">${featureName(feature)}</div>
       <div style="font-size:12px; color:#4e4639; margin-top:2px">Centroid loaded into the field query.</div>
       <div style="font-size:12px; color:#4e4639; margin-top:6px">Press Run Field Analysis to scan this country.</div>`
    )
    .addTo(clickMarker)
    .openPopup();
  setStatus(`${featureName(feature)} loaded — press Run Field Analysis.`, "success");
}

async function loadCountries() {
  try {
    const response = await fetch(COUNTRY_GEOJSON_URL);
    if (!response.ok) throw new Error(`countries fetch ${response.status}`);
    const data = await response.json();
    state.countriesData = data;
    countriesLayer = L.geoJSON(data, {
      style: styleCountry,
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(featureName(feature), { sticky: true, className: "country-tooltip", direction: "top" });
        layer.on({
          mouseover: (event) => {
            const target = event.target;
            target.setStyle({ weight: 1.6, color: "#3e2723", fillOpacity: state.countryResults.get(featureIsoA3(feature)) ? 0.55 : 0.08 });
            target.bringToFront();
          },
          mouseout: (event) => {
            countriesLayer.resetStyle(event.target);
          },
          click: (event) => {
            handleCountryClick(feature);
            L.DomEvent.stopPropagation(event);
          }
        });
      }
    }).addTo(map);
    HOTSPOTS.forEach((hotspot) => {
      const marker = hotspotMarkers.get(hotspot.id);
      if (marker) marker.bringToFront();
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("country layer unavailable:", err);
  }
}

loadCountries();

function formatClassification(value) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function setMapStatus(message, tone = "info") {
  if (!message) {
    elements.mapStatus.classList.add("hidden");
    return;
  }
  elements.mapStatus.classList.remove("hidden", "text-error", "text-recovery", "text-on-surface-variant");
  if (tone === "error") elements.mapStatus.classList.add("text-error");
  else if (tone === "success") elements.mapStatus.classList.add("text-recovery");
  else elements.mapStatus.classList.add("text-on-surface-variant");
  elements.mapStatus.textContent = message;
}

function renderHotspotMarker(hotspot) {
  const result = state.hotspotResults.get(hotspot.id);
  const level = result?.alert_level || "pending";
  const color = severityColorForLevel(level);

  const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
    radius: 9,
    color: "#3e2723",
    weight: 1.5,
    fillColor: color,
    fillOpacity: 0.85
  });

  marker.bindTooltip(`${hotspot.name}, ${hotspot.country}`, { direction: "top", offset: [0, -8] });
  marker.bindPopup(buildHotspotPopup(hotspot, result));
  marker.on("click", () => handleHotspotClick(hotspot));
  marker.addTo(map);
  return marker;
}

function buildHotspotPopup(hotspot, result) {
  const level = result?.alert_level;
  const levelLabel = level
    ? level.replace("_", " ").toUpperCase()
    : "NOT YET SCANNED";
  const score = result ? computeCompositeScore(result) : null;

  return `
    <div style="min-width:200px">
      <div style="font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:16px; margin-bottom:2px">${hotspot.name}</div>
      <div style="font-size:12px; color:#4e4639; margin-bottom:8px">${hotspot.country} · ${hotspot.latitude.toFixed(2)}, ${hotspot.longitude.toFixed(2)}</div>
      <div style="display:inline-block; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:700; letter-spacing:0.06em; background:${severityColorForLevel(level || "pending")}; color:#fff">${levelLabel}</div>
      ${score === null ? "" : `<div style="margin-top:8px; font-size:12px; color:#4e4639">Composite stress score: <strong>${score}</strong></div>`}
      <div style="margin-top:10px; font-size:12px; color:#4e4639">Click to load this point into the field query.</div>
    </div>
  `;
}

function refreshHotspotMarker(hotspot) {
  const existing = hotspotMarkers.get(hotspot.id);
  if (existing) {
    map.removeLayer(existing);
  }
  const marker = renderHotspotMarker(hotspot);
  hotspotMarkers.set(hotspot.id, marker);
}

function applyHotspotToForm(hotspot) {
  elements.latitude.value = hotspot.latitude.toFixed(4);
  elements.longitude.value = hotspot.longitude.toFixed(4);
  if (hotspot.crop) {
    selectCropPill(hotspot.crop);
  }
  if (elements.coordRegion) {
    elements.coordRegion.textContent = `${hotspot.name} · ${hotspot.country}`;
  }
  updateCoordDisplay();
}

async function handleHotspotClick(hotspot) {
  applyHotspotToForm(hotspot);
  map.flyTo([hotspot.latitude, hotspot.longitude], Math.max(map.getZoom(), 4), { duration: 0.6 });

  if (state.hotspotResults.has(hotspot.id)) {
    state.lastQuery = {
      latitude: hotspot.latitude,
      longitude: hotspot.longitude,
      crop_type: hotspot.crop || elements.cropHidden.value,
      language: elements.language.value
    };
    renderResponse(state.hotspotResults.get(hotspot.id));
    setStatus(`Loaded cached result for ${hotspot.name}.`, "success");
    return;
  }

  setMapStatus(`Querying ${hotspot.name}…`);
  const result = await runAnalysis({
    latitude: hotspot.latitude,
    longitude: hotspot.longitude,
    crop_type: hotspot.crop || elements.cropHidden.value,
    language: elements.language.value
  });
  if (result) {
    state.hotspotResults.set(hotspot.id, result);
    refreshHotspotMarker(hotspot);
    recordCountryResult(hotspot.latitude, hotspot.longitude, result.alert_level, hotspot.iso_a3);
    setMapStatus(`${hotspot.name}: ${result.alert_level.replace("_", " ")}`, "success");
  } else {
    setMapStatus(`Failed to query ${hotspot.name}.`, "error");
  }
}

HOTSPOTS.forEach((hotspot) => {
  refreshHotspotMarker(hotspot);
});

map.on("click", (event) => {
  const { lat, lng } = event.latlng;
  if (lat < -85 || lat > 85) return;
  const wrappedLng = ((lng + 540) % 360) - 180;

  elements.latitude.value = lat.toFixed(4);
  elements.longitude.value = wrappedLng.toFixed(4);
  updateCoordDisplay();
  if (elements.coordRegion) {
    elements.coordRegion.textContent = "Custom coordinate";
  }

  clickMarker.clearLayers();
  L.circleMarker([lat, wrappedLng], {
    radius: 7,
    color: "#1e1b16",
    weight: 1.5,
    fillColor: "#005faf",
    fillOpacity: 0.85
  })
    .bindPopup(
      `<div style="font-family:'Space Grotesk',sans-serif; font-weight:600">Custom point</div>
       <div style="font-size:12px; color:#4e4639; margin-top:2px">${lat.toFixed(3)}, ${wrappedLng.toFixed(3)}</div>
       <div style="font-size:12px; color:#4e4639; margin-top:6px">Loaded into the field query — submit to analyze.</div>`
    )
    .addTo(clickMarker)
    .openPopup();

  setStatus("Coordinate captured from map. Press Run Field Analysis when ready.", "success");
});

function selectCropPill(crop) {
  elements.cropHidden.value = crop;
  elements.cropPills.querySelectorAll(".crop-pill").forEach((pill) => {
    const isActive = pill.dataset.crop === crop;
    pill.classList.toggle("bg-primary-container", isActive);
    pill.classList.toggle("text-on-primary-container", isActive);
    pill.classList.toggle("border-primary-container", isActive);
    pill.classList.toggle("bg-surface", !isActive);
    pill.classList.toggle("text-on-surface", !isActive);
    pill.classList.toggle("border-outline-variant", !isActive);
  });
}

function setStatus(message, tone = "default") {
  elements.status.textContent = message || "";
  elements.status.classList.remove("text-error", "text-recovery", "text-outline");
  if (tone === "error") {
    elements.status.classList.add("text-error");
  } else if (tone === "success") {
    elements.status.classList.add("text-recovery");
  } else {
    elements.status.classList.add("text-outline");
  }
}

function clampPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function severityForAnomaly(anomalyPct) {
  if (typeof anomalyPct !== "number") return 0;
  if (anomalyPct <= -50) return 100;
  if (anomalyPct <= -30) return 75;
  if (anomalyPct <= -10) return 45;
  if (anomalyPct <= 0) return 20;
  return 5;
}

function severityForNdviClass(classification) {
  switch (classification) {
    case "bare_soil":
      return 100;
    case "severe_stress":
      return 80;
    case "moderate_stress":
      return 50;
    case "healthy":
      return 15;
    default:
      return 0;
  }
}

function buildSignalCard(def, signal) {
  const card = document.createElement("article");
  card.className =
    "bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-5 flex flex-col gap-3";

  if (!signal) {
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-outline">${def.icon}</span>
          <span class="font-display font-semibold text-on-surface">${def.label}</span>
        </div>
        <span class="text-label-bold uppercase tracking-widest text-outline">N/A</span>
      </div>
      <p class="text-body-md text-on-surface-variant">Signal unavailable for this query.</p>
      <div class="signal-bar-track"><div class="h-full bg-outline/40" style="width: 0%"></div></div>
    `;
    return card;
  }

  let severity;
  if (def.key === "ndvi") {
    severity = severityForNdviClass(signal.classification);
  } else {
    severity = severityForAnomaly(signal.anomaly_pct);
  }

  const severityLabel = severity >= 75 ? "Severe" : severity >= 45 ? "Watch" : "Stable";
  const severityChip =
    severity >= 75
      ? "bg-error text-white"
      : severity >= 45
        ? "bg-primary-container text-on-primary-container"
        : "bg-recovery text-white";

  card.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined ${def.accent}">${def.icon}</span>
        <span class="font-display font-semibold text-on-surface">${def.label}</span>
      </div>
      <span class="text-label-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${severityChip}">${severityLabel}</span>
    </div>
    <div>
      <p class="font-display text-2xl font-bold text-on-surface">${def.valueFormatter(signal)}</p>
      <p class="text-label-sm text-on-surface-variant">${def.secondary(signal)}</p>
    </div>
    <div>
      <div class="signal-bar-track">
        <div class="h-full ${def.track}" style="width: ${clampPercent(severity)}%"></div>
      </div>
      <div class="flex justify-between text-label-sm text-outline mt-1">
        <span>Stable</span>
        <span>${typeof signal.anomaly_pct === "number" ? `${signal.anomaly_pct}% anomaly` : ""}</span>
        <span>Severe</span>
      </div>
    </div>
  `;
  return card;
}

function renderBanner(level) {
  const theme = ALERT_THEME[level] || ALERT_THEME.normal;
  elements.banner.className = `rounded-xl border shadow-sm p-6 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${theme.banner}`;
  elements.alertEyebrow.textContent = theme.eyebrow;
  elements.alertTitle.textContent = theme.title;
  elements.alertSubtitle.textContent = theme.subtitle;
  elements.alertIcon.textContent = theme.icon;
  elements.alertIconWrap.className = `relative w-12 h-12 rounded-full flex items-center justify-center ${theme.iconBg}`;
}

function renderCoverageChip(dataPartial) {
  if (dataPartial) {
    elements.coverageChip.textContent = "Partial";
    elements.coverageChip.className =
      "px-3 py-1 rounded-full text-label-bold uppercase tracking-wider bg-primary-fixed text-on-primary-container";
  } else {
    elements.coverageChip.textContent = "Complete";
    elements.coverageChip.className =
      "px-3 py-1 rounded-full text-label-bold uppercase tracking-wider bg-recovery/10 text-recovery";
  }
}

function renderAdvisory(response, language) {
  const alert = response.alert || {};
  const isLocal = language === "local";
  const localLanguage = elements.language.value;

  const summary = isLocal
    ? alert.local_language_guidance || "(No local-language summary returned.)"
    : alert.english_summary || "(No English summary returned.)";

  elements.advisorySummary.textContent = summary;

  if (isLocal && RTL_LANGUAGES.has(localLanguage)) {
    elements.advisorySummary.dir = "rtl";
  } else {
    elements.advisorySummary.dir = "ltr";
  }

  elements.advisoryActions.innerHTML = "";
  const actions = Array.isArray(alert.recommended_actions) ? alert.recommended_actions : [];
  if (actions.length === 0) {
    const li = document.createElement("li");
    li.className = "text-on-surface-variant text-body-md";
    li.textContent = "No recommended actions returned.";
    elements.advisoryActions.appendChild(li);
  } else {
    actions.forEach((action, index) => {
      const li = document.createElement("li");
      li.className =
        "flex gap-3 items-start text-body-md text-on-surface bg-surface border border-outline-variant rounded-lg p-3";
      li.innerHTML = `
        <span class="font-display font-bold text-primary-container">${String(index + 1).padStart(2, "0")}</span>
        <span class="flex-1"></span>
      `;
      li.querySelector("span:last-child").textContent = action;
      elements.advisoryActions.appendChild(li);
    });
  }

  elements.advisoryMeta.textContent = alert.structured_response === false
    ? "Note: advisory returned in unstructured form. Field worker review recommended."
    : "";

  elements.advisoryEmpty.classList.add("hidden");
  elements.advisoryBody.classList.remove("hidden");
}

function setActiveLanguageButton(language) {
  elements.langButtons.forEach((btn) => {
    const isActive = btn.dataset.lang === language;
    btn.classList.toggle("bg-primary-container", isActive);
    btn.classList.toggle("text-on-primary-container", isActive);
    btn.classList.toggle("bg-surface", !isActive);
    btn.classList.toggle("text-on-surface", !isActive);
  });
}

function computeCompositeScore(response) {
  const data = response.data || {};
  const parts = [];
  if (data.soil_moisture) parts.push(severityForAnomaly(data.soil_moisture.anomaly_pct));
  if (data.rainfall) parts.push(severityForAnomaly(data.rainfall.anomaly_pct));
  if (data.ndvi) parts.push(severityForNdviClass(data.ndvi.classification));
  if (parts.length === 0) return null;
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  return Math.round(avg);
}

function renderResponse(response) {
  state.lastResponse = response;

  renderBanner(response.alert_level || "normal");
  renderCoverageChip(Boolean(response.data_partial));

  elements.fetchedAt.textContent = response.fetched_at
    ? new Date(response.fetched_at).toLocaleString()
    : "—";

  const score = computeCompositeScore(response);
  elements.compositeScore.textContent = score === null ? "—" : `${score}`;

  elements.signalGrid.innerHTML = "";
  SIGNAL_DEFS.forEach((def) => {
    elements.signalGrid.appendChild(buildSignalCard(def, response.data?.[def.key] || null));
  });

  renderAdvisory(response, state.language);
  setActiveLanguageButton(state.language);
  elements.rawJson.textContent = JSON.stringify(response, null, 2);

  if (elements.solutionsBody) {
    elements.solutionsBody.classList.add("hidden");
    elements.solutionsStatus.textContent = "";
    if (elements.solutionsBtn) {
      elements.solutionsBtn.disabled = false;
      elements.solutionsLabel.textContent = "Generate Effects & Solutions";
    }
  }
}

function renderSkeleton() {
  elements.signalGrid.innerHTML = "";
  for (let i = 0; i < 3; i += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "skeleton h-44";
    elements.signalGrid.appendChild(skeleton);
  }
  elements.advisoryEmpty.classList.remove("hidden");
  elements.advisoryEmpty.textContent = "Pulling advisory from satellite signals…";
  elements.advisoryBody.classList.add("hidden");
}

async function runAnalysis(payload, { renderUi = true } = {}) {
  if (renderUi) {
    elements.submit.disabled = true;
    elements.submitLabel.textContent = "Running…";
    setStatus("Querying satellite signals (10–20s typical)…");
    renderSkeleton();
  }

  try {
    const response = await fetch("/api/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(result.failures) && result.failures.length > 0
        ? ` (${result.failures.map((f) => `${f.service}: ${f.reason}`).join("; ")})`
        : "";
      throw new Error(`${result.error || `Request failed with ${response.status}`}${detail}`);
    }
    if (renderUi) {
      state.lastQuery = {
        latitude: payload.latitude,
        longitude: payload.longitude,
        crop_type: payload.crop_type,
        language: payload.language
      };
      renderResponse(result);
      setStatus("Analysis complete.", "success");
    }
    return result;
  } catch (error) {
    if (renderUi) {
      setStatus(error.message || "Request failed.", "error");
      elements.advisoryEmpty.classList.remove("hidden");
      elements.advisoryEmpty.textContent = "Could not load advisory. Try again or adjust inputs.";
      elements.advisoryBody.classList.add("hidden");
    }
    return null;
  } finally {
    if (renderUi) {
      elements.submit.disabled = false;
      elements.submitLabel.textContent = "Run Field Analysis";
    }
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scanHotspots() {
  if (state.scanInFlight) return;
  state.scanInFlight = true;
  elements.scanBtn.disabled = true;
  const language = elements.language.value;
  let completed = 0;
  let failed = 0;

  try {
    for (const hotspot of HOTSPOTS) {
      completed += 1;
      elements.scanLabel.textContent = `Scanning ${completed}/${HOTSPOTS.length}…`;
      setMapStatus(`Querying ${hotspot.name}…`);
      const result = await runAnalysis(
        {
          latitude: hotspot.latitude,
          longitude: hotspot.longitude,
          crop_type: hotspot.crop,
          language
        },
        { renderUi: false }
      );
      if (result) {
        state.hotspotResults.set(hotspot.id, result);
        refreshHotspotMarker(hotspot);
        recordCountryResult(hotspot.latitude, hotspot.longitude, result.alert_level, hotspot.iso_a3);
      } else {
        failed += 1;
      }
      await delay(2200);
    }
    setMapStatus(
      failed === 0
        ? `Scan complete — ${HOTSPOTS.length} hotspots analyzed.`
        : `Scan complete — ${HOTSPOTS.length - failed} succeeded, ${failed} failed.`,
      failed === 0 ? "success" : "error"
    );
  } finally {
    state.scanInFlight = false;
    elements.scanBtn.disabled = false;
    elements.scanLabel.textContent = "Scan Global Hotspots";
  }
}

elements.scanBtn.addEventListener("click", scanHotspots);

elements.resetMapBtn.addEventListener("click", () => {
  state.hotspotResults.clear();
  state.countryResults.clear();
  HOTSPOTS.forEach((hotspot) => refreshHotspotMarker(hotspot));
  refreshCountryStyles();
  clickMarker.clearLayers();
  map.flyTo([15, 20], 2, { duration: 0.8 });
  setMapStatus(null);
});

elements.cropPills.addEventListener("click", (event) => {
  const target = event.target.closest(".crop-pill");
  if (!target) return;
  selectCropPill(target.dataset.crop);
});

elements.langButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.language = btn.dataset.lang;
    setActiveLanguageButton(state.language);
    if (state.lastResponse) {
      renderAdvisory(state.lastResponse, state.language);
    }
  });
});

function updateCoordDisplay() {
  const lat = Number(elements.latitude.value);
  const lon = Number(elements.longitude.value);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    elements.coordDisplay.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

elements.latitude.addEventListener("input", updateCoordDisplay);
elements.longitude.addEventListener("input", updateCoordDisplay);

elements.quickLocate.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported by this browser.", "error");
    return;
  }
  setStatus("Locating…");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude.toFixed(4));
      const lon = Number(position.coords.longitude.toFixed(4));
      elements.latitude.value = lat;
      elements.longitude.value = lon;
      updateCoordDisplay();
      map.flyTo([lat, lon], 5, { duration: 0.8 });
      setStatus("Coordinates captured. Run a field analysis when ready.", "success");
    },
    () => {
      setStatus("Unable to access location. Enter coordinates manually.", "error");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    latitude: Number(elements.latitude.value),
    longitude: Number(elements.longitude.value),
    crop_type: elements.cropHidden.value,
    language: elements.language.value
  };
  const result = await runAnalysis(payload);
  if (result) {
    map.flyTo([payload.latitude, payload.longitude], Math.max(map.getZoom(), 4), { duration: 0.6 });
    recordCountryResult(payload.latitude, payload.longitude, result.alert_level);
  }
});

function setSolutionsStatus(message, tone = "default") {
  elements.solutionsStatus.textContent = message || "";
  elements.solutionsStatus.classList.remove("text-error", "text-recovery", "text-outline");
  if (tone === "error") elements.solutionsStatus.classList.add("text-error");
  else if (tone === "success") elements.solutionsStatus.classList.add("text-recovery");
  else elements.solutionsStatus.classList.add("text-outline");
}

function renderSolutions(payload, localLanguage) {
  const solutions = payload.solutions || {};
  elements.solutionsEffects.innerHTML = "";
  const effects = Array.isArray(solutions.effects) ? solutions.effects : [];
  if (effects.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No effects returned.";
    li.className = "text-on-surface-variant";
    elements.solutionsEffects.appendChild(li);
  } else {
    effects.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      elements.solutionsEffects.appendChild(li);
    });
  }

  elements.solutionsList.innerHTML = "";
  const items = Array.isArray(solutions.solutions) ? solutions.solutions : [];
  if (items.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No solutions returned.";
    li.className = "text-on-surface-variant";
    elements.solutionsList.appendChild(li);
  } else {
    items.forEach((entry) => {
      const li = document.createElement("li");
      li.textContent = entry;
      elements.solutionsList.appendChild(li);
    });
  }

  elements.solutionsSummaryEn.textContent =
    solutions.english_summary || "(No English summary returned.)";
  elements.solutionsSummaryEn.dir = "ltr";

  const localText = solutions.local_language_summary || "(No local-language summary returned.)";
  elements.solutionsSummaryLocal.textContent = localText;
  elements.solutionsSummaryLocal.dir = RTL_LANGUAGES.has(localLanguage) ? "rtl" : "ltr";

  elements.solutionsBody.classList.remove("hidden");
}

async function runSolutions() {
  if (state.solutionsInFlight) return;
  if (!state.lastResponse || !state.lastQuery) {
    setSolutionsStatus("Run a field analysis first.", "error");
    return;
  }
  state.solutionsInFlight = true;
  elements.solutionsBtn.disabled = true;
  elements.solutionsLabel.textContent = "Generating…";
  setSolutionsStatus("Asking Gemini for a tailored response plan (10–20s)…");

  const body = {
    latitude: state.lastQuery.latitude,
    longitude: state.lastQuery.longitude,
    crop_type: state.lastQuery.crop_type,
    language: state.lastQuery.language,
    previous: {
      alert_level: state.lastResponse.alert_level,
      data: state.lastResponse.data
    }
  };

  try {
    const response = await fetch("/api/solutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Request failed with ${response.status}`);
    }
    renderSolutions(result, state.lastQuery.language);
    setSolutionsStatus("Solutions ready.", "success");
  } catch (err) {
    setSolutionsStatus(err.message || "Solutions generation failed.", "error");
  } finally {
    state.solutionsInFlight = false;
    elements.solutionsBtn.disabled = false;
    elements.solutionsLabel.textContent = "Regenerate Effects & Solutions";
  }
}

if (elements.solutionsBtn) {
  elements.solutionsBtn.addEventListener("click", runSolutions);
}

selectCropPill("wheat");
updateCoordDisplay();
setActiveLanguageButton(state.language);
