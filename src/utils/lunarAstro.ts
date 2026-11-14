/**
 * lunarAstro.ts
 * Self-contained astronomical calculation engine for lunar surface observers.
 * No external dependencies — pure TypeScript math.
 *
 * Calculates Sun/Earth positions, horizon events, power and comms viability
 * from any point on the lunar surface at any Earth date/time.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Julian Date of J2000.0 epoch (Jan 1.5 2000, i.e. Jan 1 2000 12:00 UTC) */
const J2000 = 2451545.0;

/** Julian Date of a well-known new moon (Jan 6 2000 18:14 UTC) */
const NEW_MOON_REF_JD = 2451549.76;

/** Synodic period of the Moon (days) — time for sub-solar point to lap the Moon */
const SYNODIC_PERIOD = 29.530589;

/** Draconic period (node-to-node, days) — used for libration latitude */
const DRACONIC_PERIOD = 27.2122;

/** Maximum solar elevation anywhere on the Moon (degrees) — set by axial tilt + orbital inclination */
const MAX_SOLAR_LAT = 6.7;

/** Physical libration amplitude in longitude (degrees) */
const LIB_LON_AMP = 8.1;

/** Physical libration amplitude in latitude (degrees) */
const LIB_LAT_AMP = 6.9;

/** Optical libration contribution added to each axis (degrees) */
const OPT_LIB = 1.5;

/** Hours per day */
const HOURS_PER_DAY = 24;

/** Step size (hours) for horizon-crossing search */
const STEP_HOURS = 0.5;

/** Sample interval (hours) for timeline */
const TIMELINE_STEP_HOURS = 6;

// ─── Earth Link Visibility Configuration ─────────────────────────────────────

/**
 * Earth link visibility elevation thresholds (degrees).
 * Elevation is the angle of Earth's center above the local horizon.
 * Boundary values belong to the higher level (2° is MEDIUM, 5° is HIGH).
 * Planning assumptions, not official NASA values.
 */
export const EARTH_LINK_THRESHOLDS = {
  NONE_MAX: 0,    // below 0° -> NONE
  LOW_MAX: 2,     // 0° to below 2° -> LOW
  MEDIUM_MAX: 5,  // 2° to below 5° -> MEDIUM
                  // 5° or above -> HIGH
} as const;

export type EarthLinkVisibilityLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH";

export interface EarthLinkLevelConfig {
  label: EarthLinkVisibilityLevel;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  barPercent: number;
  horizonModel: "ideal" | "terrain-adjusted";
}

export const EARTH_LINK_LEVELS: Record<EarthLinkVisibilityLevel, EarthLinkLevelConfig> = {
  NONE: {
    label: "NONE",
    color: "#ff5064",
    bgColor: "rgba(255, 80, 100, 0.1)",
    borderColor: "rgba(255, 80, 100, 0.4)",
    description: "Earth is below horizon (<0°): no direct line of sight",
    barPercent: 0,
    horizonModel: "ideal",
  },
  LOW: {
    label: "LOW",
    color: "#ffb454",
    bgColor: "rgba(255, 180, 84, 0.1)",
    borderColor: "rgba(255, 180, 84, 0.4)",
    description: "Grazing geometry (0° to <2° above horizon)",
    barPercent: 33,
    horizonModel: "ideal",
  },
  MEDIUM: {
    label: "MEDIUM",
    color: "#41e6ff",
    bgColor: "rgba(65, 230, 255, 0.1)",
    borderColor: "rgba(65, 230, 255, 0.4)",
    description: "Moderate elevation (2° to <5° above horizon)",
    barPercent: 66,
    horizonModel: "ideal",
  },
  HIGH: {
    label: "HIGH",
    color: "#9dffb0",
    bgColor: "rgba(157, 255, 176, 0.1)",
    borderColor: "rgba(157, 255, 176, 0.4)",
    description: "Clear line-of-sight elevation (≥5° above horizon)",
    barPercent: 100,
    horizonModel: "ideal",
  },
};

/**
 * Determine Earth link visibility level from Earth's elevation angle.
 * Evaluated against the ideal spherical lunar horizon (0° geometric datum).
 */
export function getEarthLinkVisibility(earthElevation: number): EarthLinkLevelConfig {
  if (earthElevation < EARTH_LINK_THRESHOLDS.NONE_MAX) {
    return EARTH_LINK_LEVELS.NONE;
  }
  if (earthElevation < EARTH_LINK_THRESHOLDS.LOW_MAX) {
    return EARTH_LINK_LEVELS.LOW;
  }
  if (earthElevation < EARTH_LINK_THRESHOLDS.MEDIUM_MAX) {
    return EARTH_LINK_LEVELS.MEDIUM;
  }
  return EARTH_LINK_LEVELS.HIGH;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AstroResult {
  /** Sun azimuth at observer (degrees, 0=N, 90=E, 180=S, 270=W) */
  sunAzimuth: number;
  /** Sun elevation above/below observer's horizon (degrees) */
  sunElevation: number;
  /** Earth azimuth at observer (degrees) */
  earthAzimuth: number;
  /** Earth elevation above/below observer's horizon (degrees) */
  earthElevation: number;
  /** Is the Sun above the horizon? */
  sunAboveHorizon: boolean;
  /** Is the Earth above the horizon? */
  earthAboveHorizon: boolean;
  /** Fraction through the current lunar day (0 = new moon / midnight equivalent, 1 = next new moon) */
  lunarDayFraction: number;
  /** Hours until next sunset (null if currently night and no sunset in next synodic period) */
  hoursToSunset: number | null;
  /** Hours until next sunrise (null if currently day and no sunrise in next synodic period) */
  hoursToSunrise: number | null;
  /** Hours until next earthset (null if Earth never sets from this location or no event found) */
  hoursToEarthset: number | null;
  /** Hours until next earthrise (null if Earth never rises from this location or no event found) */
  hoursToEarthrise: number | null;
  /** Solar elevation angle (same as sunElevation, alias for clarity) */
  solarElevationAngle: number;
  /**
   * Power generation potential [0–1].
   * 0 when Sun is below horizon; scales with sin(elevation) when above.
   */
  powerGenPotential: number;
  /**
   * Communication viability [0–1].
   * 0 when Earth is below horizon; scales with sin(elevation) when above.
   */
  communicationViability: number;
}

export interface WindowEvent {
  /** Event type */
  type: 'sunrise' | 'sunset' | 'earthrise' | 'earthset';
  /** UTC date of the event */
  date: Date;
  /** Hours from the query start date to this event */
  hoursFromNow: number;
}

export interface TimelinePoint {
  /** UTC date of this sample */
  date: Date;
  /** Sun elevation (degrees) */
  sunElevation: number;
  /** Earth elevation (degrees) */
  earthElevation: number;
  /** Is the Sun above horizon? */
  sunAboveHorizon: boolean;
  /** Is the Earth above horizon? */
  earthAboveHorizon: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Convert a JS Date to Julian Date */
function dateToJD(date: Date): number {
  // JD = Unix timestamp (ms) / ms-per-day + JD of Unix epoch
  // Unix epoch (Jan 1 1970 00:00 UTC) = JD 2440587.5
  return date.getTime() / 86400000 + 2440587.5;
}

/** Normalize an angle to [−180, 180) degrees */
function normLon(deg: number): number {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Normalize an angle to [0, 360) degrees */
function norm360(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Compute sub-solar point on the Moon for a given Julian Date.
 * Returns { lat, lon } in degrees (selenographic, Moon-fixed frame).
 *
 * The sub-solar point is the spot on the Moon's surface directly facing the Sun.
 * Its longitude advances ~360° per synodic month.
 * Its latitude oscillates because of the Moon's orbital inclination + axial tilt
 * (combined ≈ 6.7° maximum).
 */
function subSolarPoint(jd: number): { lat: number; lon: number } {
  // Days since the new-moon reference
  const daysSinceNewMoon = jd - NEW_MOON_REF_JD;

  // Sub-solar longitude: advances 360° per synodic period
  const rawLon = (daysSinceNewMoon / SYNODIC_PERIOD) * 360;
  const lon = normLon(rawLon);

  // Sub-solar latitude: simplified harmonic driven by annual solar cycle
  // (actual formula involves lunar node argument; this approximation captures
  //  the ±6.7° swing adequately for the hackathon.)
  const annualPhase = (2 * Math.PI * (jd - J2000)) / 365.25;
  const lat = MAX_SOLAR_LAT * Math.sin(annualPhase);

  return { lat, lon };
}

/**
 * Compute sub-Earth point on the Moon for a given Julian Date.
 * Returns { lat, lon } in degrees (selenographic).
 *
 * The nominal sub-Earth point is (0°, 0°) but libration shifts it:
 *   Physical libration in lon: ±8.1° with synodic period
 *   Physical libration in lat: ±6.9° with draconic period
 *   Optical libration adds a small extra kick (±1.5° modeled here).
 */
function subEarthPoint(jd: number): { lat: number; lon: number } {
  const synodicPhase = (2 * Math.PI * (jd - NEW_MOON_REF_JD)) / SYNODIC_PERIOD;
  const draconicPhase = (2 * Math.PI * (jd - J2000)) / DRACONIC_PERIOD;
  const annualPhase = (2 * Math.PI * (jd - J2000)) / 365.25;

  // Physical libration
  const physLon = -LIB_LON_AMP * Math.sin(synodicPhase);
  const physLat = LIB_LAT_AMP * Math.sin(draconicPhase);

  // Optical libration (small correction)
  const optLon = OPT_LIB * Math.sin(synodicPhase + Math.PI / 4);
  const optLat = OPT_LIB * Math.sin(annualPhase);

  return {
    lat: physLat + optLat,
    lon: physLon + optLon,
  };
}

/**
 * Given an observer position on the Moon and a sub-body point,
 * compute the azimuth and elevation of that body as seen by the observer.
 *
 * Uses the spherical-surface great-circle formulas described in the brief.
 *
 * @param obsLat  Observer latitude  (degrees, selenographic)
 * @param obsLon  Observer longitude (degrees, selenographic)
 * @param bodyLat Sub-body latitude  (degrees)
 * @param bodyLon Sub-body longitude (degrees)
 * @returns { azimuth: degrees 0-360, elevation: degrees −90..90 }
 */
function azimuthElevation(
  obsLat: number,
  obsLon: number,
  bodyLat: number,
  bodyLon: number
): { azimuth: number; elevation: number } {
  const oLat = obsLat * DEG2RAD;
  const oLon = obsLon * DEG2RAD;
  const bLat = bodyLat * DEG2RAD;
  const bLon = bodyLon * DEG2RAD;

  const dLon = bLon - oLon;

  // Angular distance (great circle)
  const cosD =
    Math.sin(oLat) * Math.sin(bLat) +
    Math.cos(oLat) * Math.cos(bLat) * Math.cos(dLon);

  // Clamp for numerical safety
  const cosD_clamped = Math.max(-1, Math.min(1, cosD));
  const d = Math.acos(cosD_clamped); // radians
  const elevation = 90 - d * RAD2DEG;  // degrees

  // Bearing (azimuth from North, clockwise)
  const y = Math.sin(dLon) * Math.cos(bLat);
  const x =
    Math.cos(oLat) * Math.sin(bLat) -
    Math.sin(oLat) * Math.cos(bLat) * Math.cos(dLon);
  const azRad = Math.atan2(y, x);
  const azimuth = norm360(azRad * RAD2DEG);

  return { azimuth, elevation };
}

/**
 * Compute Sun elevation at observer for a given JD (internal utility).
 */
function sunElevationAt(obsLat: number, obsLon: number, jd: number): number {
  const sp = subSolarPoint(jd);
  return azimuthElevation(obsLat, obsLon, sp.lat, sp.lon).elevation;
}

/**
 * Compute Earth elevation at observer for a given JD (internal utility).
 */
function earthElevationAt(obsLat: number, obsLon: number, jd: number): number {
  const ep = subEarthPoint(jd);
  return azimuthElevation(obsLat, obsLon, ep.lat, ep.lon).elevation;
}

/**
 * Find the next horizon crossing of a body, starting from startJD.
 *
 * Steps forward by stepDays, looking for a sign change in elevation.
 * When found, bisects for a more accurate crossing time.
 *
 * @param elevFn       Function returning elevation (degrees) at a given JD
 * @param startJD      Start JD
 * @param maxDays      Maximum search window (days)
 * @param stepDays     Coarse step size (days)
 * @param lookingForRise  true → find next rise (elev crosses 0 upward); false → next set
 * @returns JD of crossing, or null if none found within window
 */
function findNextCrossing(
  elevFn: (jd: number) => number,
  startJD: number,
  maxDays: number,
  stepDays: number,
  lookingForRise: boolean
): number | null {
  let jd = startJD;
  let prevElev = elevFn(jd);
  const endJD = startJD + maxDays;

  while (jd < endJD) {
    jd = Math.min(jd + stepDays, endJD);
    const elev = elevFn(jd);

    const crossed = lookingForRise
      ? prevElev <= 0 && elev > 0
      : prevElev >= 0 && elev < 0;

    if (crossed) {
      // Bisect to refine
      let lo = jd - stepDays;
      let hi = jd;
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const midElev = elevFn(mid);
        if (lookingForRise ? midElev <= 0 : midElev >= 0) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return (lo + hi) / 2;
    }

    prevElev = elev;
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate all astronomical quantities for a lunar surface observer.
 *
 * @param lat   Observer latitude  (degrees, selenographic, −90 to +90)
 * @param lon   Observer longitude (degrees, selenographic, −180 to +180)
 * @param date  Earth UTC date/time
 */
export function calculateAstro(lat: number, lon: number, date: Date): AstroResult {
  const jd = dateToJD(date);

  // ── Sub-body positions ──────────────────────────────────────────────────────
  const solar = subSolarPoint(jd);
  const earth = subEarthPoint(jd);

  // ── Azimuth / Elevation ─────────────────────────────────────────────────────
  const sunPos = azimuthElevation(lat, lon, solar.lat, solar.lon);
  const earthPos = azimuthElevation(lat, lon, earth.lat, earth.lon);

  // ── Horizon flags ───────────────────────────────────────────────────────────
  const sunAboveHorizon = sunPos.elevation > 0;
  // Far-side constraint: if |observer lon| > 90°, Earth is never above horizon
  // (the Earth's sub-point librates at most ~9.6° from center, so |lon| > ~90° is safe)
  const earthAboveHorizon = Math.abs(lon) <= 90 && earthPos.elevation > 0;

  // ── Lunar day fraction ──────────────────────────────────────────────────────
  // Fraction of synodic cycle elapsed since the reference new moon
  const daysSinceNewMoon = jd - NEW_MOON_REF_JD;
  const lunarDayFraction = ((daysSinceNewMoon % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD / SYNODIC_PERIOD;

  // ── Horizon event search ────────────────────────────────────────────────────
  const stepDays = STEP_HOURS / HOURS_PER_DAY;
  const maxSearchDays = SYNODIC_PERIOD + 1; // search up to one full lunar cycle ahead

  const sunElevFn = (j: number) => sunElevationAt(lat, lon, j);
  const earthElevFn = (j: number) => {
    // On far side Earth never rises, keep elevation always negative
    if (Math.abs(lon) > 90) return -90;
    return earthElevationAt(lat, lon, j);
  };

  let hoursToSunset: number | null = null;
  let hoursToSunrise: number | null = null;
  let hoursToEarthset: number | null = null;
  let hoursToEarthrise: number | null = null;

  if (sunAboveHorizon) {
    // Currently daytime — look for the next sunset, then sunrise after that
    const setJD = findNextCrossing(sunElevFn, jd, maxSearchDays, stepDays, false);
    if (setJD !== null) {
      hoursToSunset = (setJD - jd) * HOURS_PER_DAY;
      // Look for sunrise after the sunset
      const riseJD = findNextCrossing(sunElevFn, setJD, maxSearchDays, stepDays, true);
      if (riseJD !== null) hoursToSunrise = (riseJD - jd) * HOURS_PER_DAY;
    }
  } else {
    // Currently nighttime — look for the next sunrise, then sunset after that
    const riseJD = findNextCrossing(sunElevFn, jd, maxSearchDays, stepDays, true);
    if (riseJD !== null) {
      hoursToSunrise = (riseJD - jd) * HOURS_PER_DAY;
      const setJD = findNextCrossing(sunElevFn, riseJD, maxSearchDays, stepDays, false);
      if (setJD !== null) hoursToSunset = (setJD - jd) * HOURS_PER_DAY;
    }
  }

  if (Math.abs(lon) <= 90) {
    if (earthAboveHorizon) {
      const setJD = findNextCrossing(earthElevFn, jd, maxSearchDays, stepDays, false);
      if (setJD !== null) {
        hoursToEarthset = (setJD - jd) * HOURS_PER_DAY;
        const riseJD = findNextCrossing(earthElevFn, setJD, maxSearchDays, stepDays, true);
        if (riseJD !== null) hoursToEarthrise = (riseJD - jd) * HOURS_PER_DAY;
      }
    } else {
      const riseJD = findNextCrossing(earthElevFn, jd, maxSearchDays, stepDays, true);
      if (riseJD !== null) {
        hoursToEarthrise = (riseJD - jd) * HOURS_PER_DAY;
        const setJD = findNextCrossing(earthElevFn, riseJD, maxSearchDays, stepDays, false);
        if (setJD !== null) hoursToEarthset = (setJD - jd) * HOURS_PER_DAY;
      }
    }
  }

  // ── Derived quantities ──────────────────────────────────────────────────────

  // Power generation potential: 0 when below horizon; sin-based scaling above.
  // sin(elevation) gives cosine-of-incidence-angle correction to solar irradiance.
  const powerGenPotential = sunAboveHorizon
    ? Math.max(0, Math.sin(sunPos.elevation * DEG2RAD))
    : 0;

  // Communication viability: same approach for Earth signal strength.
  const communicationViability =
    earthAboveHorizon && Math.abs(lon) <= 90
      ? Math.max(0, Math.sin(earthPos.elevation * DEG2RAD))
      : 0;

  return {
    sunAzimuth: sunPos.azimuth,
    sunElevation: sunPos.elevation,
    earthAzimuth: earthPos.azimuth,
    earthElevation: earthAboveHorizon ? earthPos.elevation : earthPos.elevation,
    sunAboveHorizon,
    earthAboveHorizon,
    lunarDayFraction,
    hoursToSunset,
    hoursToSunrise,
    hoursToEarthset,
    hoursToEarthrise,
    solarElevationAngle: sunPos.elevation,
    powerGenPotential,
    communicationViability,
  };
}

/**
 * Generate a timeline of Sun/Earth positions sampled every 6 hours.
 *
 * @param lat       Observer latitude  (degrees)
 * @param lon       Observer longitude (degrees)
 * @param startDate Start date (UTC)
 * @param numDays   Number of days to cover (default: one full synodic month)
 * @returns Array of TimelinePoint, one per 6-hour interval
 */
export function getTimeline(
  lat: number,
  lon: number,
  startDate: Date,
  numDays: number = SYNODIC_PERIOD
): TimelinePoint[] {
  const startJD = dateToJD(startDate);
  const totalPoints = Math.ceil((numDays * HOURS_PER_DAY) / TIMELINE_STEP_HOURS) + 1;
  const stepDays = TIMELINE_STEP_HOURS / HOURS_PER_DAY;
  const farSide = Math.abs(lon) > 90;

  const timeline: TimelinePoint[] = [];

  for (let i = 0; i < totalPoints; i++) {
    const jd = startJD + i * stepDays;
    const pointDate = new Date((jd - 2440587.5) * 86400000);

    const solar = subSolarPoint(jd);
    const earth = subEarthPoint(jd);

    const sunPos = azimuthElevation(lat, lon, solar.lat, solar.lon);
    const earthPos = azimuthElevation(lat, lon, earth.lat, earth.lon);

    timeline.push({
      date: pointDate,
      sunElevation: sunPos.elevation,
      earthElevation: earthPos.elevation,
      sunAboveHorizon: sunPos.elevation > 0,
      earthAboveHorizon: !farSide && earthPos.elevation > 0,
    });
  }

  return timeline;
}

/**
 * Find all Sun/Earth horizon crossing events within a window.
 *
 * @param lat       Observer latitude  (degrees)
 * @param lon       Observer longitude (degrees)
 * @param startDate Window start (UTC)
 * @param numDays   Window length in days (default: one full synodic month)
 * @returns Sorted list of WindowEvent objects
 */
export function getWindowEvents(
  lat: number,
  lon: number,
  startDate: Date,
  numDays: number = SYNODIC_PERIOD
): WindowEvent[] {
  const startJD = dateToJD(startDate);
  const stepDays = STEP_HOURS / HOURS_PER_DAY;
  const farSide = Math.abs(lon) > 90;

  const events: WindowEvent[] = [];

  // Helper: scan for all crossings of a given type within the window
  function scanCrossings(
    elevFn: (jd: number) => number,
    riseType: 'sunrise' | 'earthrise',
    setType: 'sunset' | 'earthset'
  ): void {
    let scanJD = startJD;
    let prevElev = elevFn(scanJD);
    const endJD = startJD + numDays;

    while (scanJD < endJD) {
      const nextJD = Math.min(scanJD + stepDays, endJD);
      const elev = elevFn(nextJD);

      if (prevElev <= 0 && elev > 0) {
        // Rise crossing — bisect
        let lo = scanJD;
        let hi = nextJD;
        for (let i = 0; i < 20; i++) {
          const mid = (lo + hi) / 2;
          elevFn(mid) <= 0 ? (lo = mid) : (hi = mid);
        }
        const crossJD = (lo + hi) / 2;
        const crossDate = new Date((crossJD - 2440587.5) * 86400000);
        events.push({
          type: riseType,
          date: crossDate,
          hoursFromNow: (crossJD - startJD) * HOURS_PER_DAY,
        });
      } else if (prevElev >= 0 && elev < 0) {
        // Set crossing — bisect
        let lo = scanJD;
        let hi = nextJD;
        for (let i = 0; i < 20; i++) {
          const mid = (lo + hi) / 2;
          elevFn(mid) >= 0 ? (lo = mid) : (hi = mid);
        }
        const crossJD = (lo + hi) / 2;
        const crossDate = new Date((crossJD - 2440587.5) * 86400000);
        events.push({
          type: setType,
          date: crossDate,
          hoursFromNow: (crossJD - startJD) * HOURS_PER_DAY,
        });
      }

      prevElev = elev;
      scanJD = nextJD;
    }
  }

  // Sun events
  scanCrossings(
    (jd) => sunElevationAt(lat, lon, jd),
    'sunrise',
    'sunset'
  );

  // Earth events (only if on near side)
  if (!farSide) {
    scanCrossings(
      (jd) => earthElevationAt(lat, lon, jd),
      'earthrise',
      'earthset'
    );
  }

  // Sort by time
  events.sort((a, b) => a.hoursFromNow - b.hoursFromNow);

  return events;
}

/**
 * Calculate total sunlit hours over one full lunar cycle (29.53 days)
 * starting from the given date.
 *
 * @param lat  Observer latitude  (degrees)
 * @param lon  Observer longitude (degrees)
 * @param date Reference start date (UTC)
 * @returns Total hours of sunlight in the upcoming lunar cycle
 */
export function getSunlightHours(lat: number, lon: number, date: Date): number {
  const startJD = dateToJD(date);
  const stepHours = 0.25; // sample every 15 min for accuracy
  const stepDays = stepHours / HOURS_PER_DAY;
  const totalSteps = Math.round(SYNODIC_PERIOD / stepDays);

  let litHours = 0;
  for (let i = 0; i < totalSteps; i++) {
    const jd = startJD + i * stepDays;
    if (sunElevationAt(lat, lon, jd) > 0) {
      litHours += stepHours;
    }
  }
  return litHours;
}

/**
 * Calculate total hours of Earth visibility over one full lunar cycle (29.53 days)
 * starting from the given date.
 *
 * Returns 0 for far-side locations (|lon| > 90°).
 *
 * @param lat  Observer latitude  (degrees)
 * @param lon  Observer longitude (degrees)
 * @param date Reference start date (UTC)
 * @returns Total hours of Earth visibility in the upcoming lunar cycle
 */
export function getEarthVisibilityHours(lat: number, lon: number, date: Date): number {
  if (Math.abs(lon) > 90) return 0;

  const startJD = dateToJD(date);
  const stepHours = 0.25;
  const stepDays = stepHours / HOURS_PER_DAY;
  const totalSteps = Math.round(SYNODIC_PERIOD / stepDays);

  let visHours = 0;
  for (let i = 0; i < totalSteps; i++) {
    const jd = startJD + i * stepDays;
    if (earthElevationAt(lat, lon, jd) > 0) {
      visHours += stepHours;
    }
  }
  return visHours;
}

// ─── Official NASA & International Data Resource Link Generators ───────────────

export const LROC_QUICKMAP_BASE_URL =
  "https://quickmap.lroc.im-ldi.com/?prjExtent=-3604618.1818776%2C-1784076.8361152%2C4260663.8247585%2C1699661.4160202&earthShadowEnabled=true&proj=10&stack=3314&defs=N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg";

export const NASA_MOON_TREK_URL = "https://trek.nasa.gov/moon/";

export const JPL_HORIZONS_URL = "https://ssd.jpl.nasa.gov/horizons/";

export const CSA_MOON_EXPLORATION_URL =
  "https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/";

/**
 * Generate deep link to Arizona State University / NASA LROC QuickMap
 * targeting specific coordinates with accurate projection and layers.
 * Polar sites use South Pole Stereographic projection (proj=10) with Earth Shadow enabled (stack=3314).
 * Equatorial sites use standard lunar projection.
 */
export function getLROCQuickMapUrl(lat: number, lon: number): string {
  if (lat <= -60) {
    // South Pole Polar Stereographic with LOLA shaded relief & Earth Shadow enabled
    return `https://quickmap.lroc.im-ldi.com/?prjExtent=-3604618.1818776%2C-1784076.8361152%2C4260663.8247585%2C1699661.4160202&earthShadowEnabled=true&proj=10&stack=3314&defs=N4IgzGCMAsIFygPYAcCGBjAlgFwJ70gF9Cg&center=${lon.toFixed(4)}%2C${lat.toFixed(4)}`;
  }
  // Equatorial / mid-latitude sites
  return `https://quickmap.lroc.im-ldi.com/?proj=2&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&zoom=8`;
}

/**
 * Generate deep link to NASA Solar System Treks (Moon Trek) GIS portal
 * targeting specific coordinates with LOLA elevation layer.
 */
export function getMoonTrekUrl(lat: number, lon: number): string {
  if (lat <= -60) {
    // Polar stereographic CRS EPSG:3032
    return `https://trek.nasa.gov/moon/#v=0.1&x=${lon.toFixed(4)}&y=${lat.toFixed(4)}&z=6&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A3032&d=&ocv=0`;
  }
  // Standard equirectangular CRS EPSG:104903
  return `https://trek.nasa.gov/moon/#v=0.1&x=${lon.toFixed(4)}&y=${lat.toFixed(4)}&z=6&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104903&d=&ocv=0`;
}

/**
 * Generate real NASA JPL Horizons REST API endpoint for observer ephemeris
 * COMMAND='10' (Sun) or '399' (Earth), CENTER='coord@301' (Moon surface topocentric site)
 */
export function getJPLHorizonsApiUrl(
  lat: number,
  lon: number,
  date: Date,
  targetBody: '10' | '399' = '10'
): string {
  const startStr = date.toISOString().split("T")[0];
  const nextDay = new Date(date.getTime() + 86400000);
  const stopStr = nextDay.toISOString().split("T")[0];

  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${targetBody}'`,
    CENTER: "'coord@301'",
    COORD_TYPE: "'GEODETIC'",
    SITE_COORD: `'${lon.toFixed(4)},${lat.toFixed(4)},0'`,
    START_TIME: `'${startStr}'`,
    STOP_TIME: `'${stopStr}'`,
    STEP_SIZE: "'1h'",
    QUANTITIES: "'4'",
  });

  return `https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
}

/**
 * Generate formatted JPL Horizons batch script file contents for verification
 */
export function getJPLHorizonsBatchScript(
  lat: number,
  lon: number,
  date: Date
): string {
  const startStr = date.toISOString().split("T")[0] + " 00:00";
  const stopStr =
    new Date(date.getTime() + 86400000).toISOString().split("T")[0] + " 00:00";

  return `!$$SOF
! NASA JPL Horizons System Topocentric Lunar Observer Ephemeris
! Challenge: Lunar Landing Site Selection - Sun & Earth Positioning
! Center: Moon (Body 301) Topocentric Surface Coordinate
MAKE_EPHEM = 'YES'
COMMAND    = '10'                ! Target: 10 = Sun (Sol) [or 399 = Earth]
EPHEM_TYPE = 'OBSERVER'
CENTER     = 'coord@301'         ! Topocentric Moon Surface
COORD_TYPE = 'GEODETIC'
SITE_COORD = '${lon.toFixed(4)}, ${lat.toFixed(4)}, 0'
START_TIME = '${startStr}'
STOP_TIME  = '${stopStr}'
STEP_SIZE  = '1 h'
QUANTITIES = '4'                 ! 4 = Apparent Azimuth & Elevation
REF_SYSTEM = 'ICRF'
CAL_FORMAT = 'CAL'
TIME_DIGITS= 'MINUTES'
ANG_FORMAT = 'DEG'
APPARENT   = 'AIRLESS'           ! Lunar surface vacuum (no atmospheric refraction)
!$$EOF`;
}

