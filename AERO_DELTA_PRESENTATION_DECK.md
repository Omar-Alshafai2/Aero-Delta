# 🚀 AERO-DELTA // Flight Presentation Deck
### Lunar South Pole Mission Planning & Horizon Analytics Engine
**NASA Space Apps Challenge 2026**

---

## 📋 Slide Overview (7-Slide Executive Flight Deck)

- **Slide 1:** The South Pole Horizon Dilemma: Lighting & DTE Constraints
- **Slide 2:** Interactive 3D Moon Globe & Polar Site Telemetry
- **Slide 3:** Deterministic Ephemeris & Topocentric Horizon Engine
- **Slide 4:** Solar Power Generation & Sunset Countdown Analysis
- **Slide 5:** Direct-to-Earth (DTE) Comms Windows & Libration Tracking
- **Slide 6:** Candidate Landing Sites Trade-off Matrix (15 Sites)
- **Slide 7:** Modular Architecture, GitHub Codebase & Live Evaluator Platform

---

### Slide 1: The South Pole Horizon Dilemma
- **Challenge:** Lunar obliquity of 1.543° causes sunlight to graze the south pole at low elevation angles (< 2°), casting elongated shadows across crater rims and into cryogenic Permanently Shadowed Regions (PSRs) as low as -248 °C (25 K, per LRO Diviner).
- **Libration Wobble:** The Moon oscillates ±6.68° in latitude and ±7.9° in longitude relative to Earth over a 27.3-day cycle, creating occultation behind ridgelines.
- **The Gap:** Existing tools like NASA Quickmap, Moon Trek, and JPL Horizons CLI are geared toward static science queries and require manual calculation to evaluate delay scenarios.
- **AERO-DELTA Solution:** An ephemeris-grade tool delivering solar illumination availability and DTE communication window assessments for rapid launch date and site alternatives.

---

### Slide 2: Interactive 3D Moon Globe & Polar Site Telemetry
- **Interactive Visualization:** High-resolution 3D Moon globe with 15 candidate landing site pins, coordinate crosshairs, and live telemetry cards.
- **Key Site Profiles:**
  - *Peak near Shackleton (-89.9°S, 0.0°E):* ~86.4% illumination, partial DTE (~64% lunar month due to libration), steep 28° crater rim slopes.
  - *Malapert Massif (-85.99°S, 357.07°E):* ~5,000m elevated plateau, ~94% near-continuous DTE visibility, prime telecom hub.
  - *Connecting Ridge (-89.4°S, 222.0°E):* 74% illumination, gentle 8° slope, candidate crew landing corridor (2022 candidate; not in refined 2024 9-region list).
  - *Apollo 11 Baseline (0.67°N, 23.47°E):* Equatorial comparison site with 14-day constant sun and zenith Earth.
- **Mission Context:** Artemis missions select elevated polar topography (first crewed landing planned for Artemis IV, 2028).

---

### Slide 3: Deterministic Ephemeris & Topocentric Horizon Engine
- **Mathematical Formulations:**
  - Subsolar and Sub-Earth vector generation calibrated to NASA JPL Horizons.
  - Topocentric Horizon Frame transformations:
    $$\sin(h) = \sin(\phi)\sin(\delta) + \cos(\phi)\cos(\delta)\cos(H)$$
    $$A = \text{atan2}(\sin H, \cos H \sin\phi - \tan\delta \cos\phi) + 180^\circ$$
  - Atmosphere-free horizon profile computation without refractive error ($\mu = 0.00^\circ$).
  - Horizon penumbral clearance accounts for solar disk angular semi-diameter ($R_\odot \approx 0.27^\circ$).
- **Benchmark Accuracy:** Single-epoch test delta < 0.03° vs JPL Horizons ephemeris at Peak near Shackleton (2026-OCT-12 14:00 UTC).

---

### Slide 4: Solar Power Generation & Sunset Countdown Analysis
- **Vertical Solar Array Modeling:** Models azimuth-tracking vertical mast solar arrays capturing grazing sunlight:
  $$P_{gen} = P_{max} \cdot \cos(\theta_{inc}) \cdot \eta_{temp} \cdot [h_\odot + R_\odot > \theta_{obs}]$$
  Vertical mast yields ~99.9% efficiency ($\cos(1.5^\circ\text{–}2.0^\circ) \approx 0.999$), whereas horizontal arrays capture $\sin(2.0^\circ) \approx 3.5\%$.
- **Operational Safety Features:**
  - Real-time countdown timer to the next shadow pass/sunset.
  - Diurnal power profile reflecting continuous illumination during polar operational windows.
  - Battery discharge estimator to prevent cryogenic equipment freezing (as low as -248 °C in PSR cold traps).

---

### Slide 5: Direct-to-Earth (DTE) Comms Windows & Libration Tracking
- **Communication Physics at the Pole:** Evaluates line-of-sight clearance above local crater rim obstacle masks.
- **Relay Architecture:** Direct communication with the Deep Space Network (DSN) during positive elevation passes minimizes dependence on commercial lunar relay orbiters.
- **AOS/LOS Prediction:** Predicts exact Acquisition-of-Signal (AOS) and Loss-of-Signal (LOS) timestamps across the 27.3-day libration cycle.

---

### Slide 6: Candidate Landing Sites Trade-off Matrix
- **Comparative Multi-Site Evaluation:**
  - Side-by-side trade-off matrix analyzing 15 sites across illumination %, communication continuity, terrain slope, and scientific value.
  - *Power Winner:* Shackleton–de Gerlache Ridge reaches up to 88.0% annual sunlight at 2m mast elevation (Gläser et al., NASA NTRS 20170007365). Peak near Shackleton achieves ~86.4%.
  - *Comms Winner:* Malapert Massif commands ~94% near-continuous DTE view.
  - *Safety Corridor:* Connecting Ridge offers wide, low-slope landing zones (< 8°).
  - *VIPER Prospecting:* Mons Mouton / Nobile Region (CLPS CS-7 delivery targeted for late 2027).

---

### Slide 7: Modular Architecture, GitHub Codebase & Live Evaluator Platform
- **Open-Source Stack:** React 18, Three.js WebGL, TypeScript, Vite, Tailwind CSS.
- **Repository:** `https://github.com/Omar-Alshafai2/Aero-Delta`
- **Live Platform Direct Link (Public Access):**  
  `https://rushing-cygnus-ijt5wua-omar-alshafai.vercel.app/`
- **Access Status:** Public deployment with zero gate restrictions.
