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
- **Challenge:** Lunar obliquity of just 1.543° causes sunlight to graze the south pole at low elevation angles (< 2°), casting elongated 50km shadows across crater rims and into cold-trap Permanently Shadowed Regions (PSRs).
- **Libration Wobble:** The Moon oscillates ±6.7° relative to Earth over a 27.3-day cycle, creating unpredictable occultation behind ridgelines.
- **The Gap:** Existing tools like NASA Quickmap, Moon Trek, and JPL Horizons CLI are geared toward static science queries and require manual calculation to evaluate delay scenarios.
- **AERO-DELTA Solution:** An intuitive, ephemeris-grade tool that delivers immediate solar power availability and DTE communication window assessments for rapid launch date and site alternatives.

---

### Slide 2: Interactive 3D Moon Globe & Polar Site Telemetry
- **Interactive Visualization:** High-resolution 3D Moon globe with 15 candidate landing site pins, coordinate crosshairs, and live telemetry cards.
- **Key Site Profiles:**
  - *Shackleton Crater Rim (-89.9°S):* 86.4% illumination, high DTE, steep 28° crater rim slopes.
  - *Malapert Mountain (-84.9°S):* 5,000m elevated plateau, 94% continuous DTE visibility, prime telecom hub.
  - *Connecting Ridge (-89.4°S):* 74% illumination, gentle 8° slope, Artemis III crew corridor.
  - *Apollo 11 Baseline (0.67°N):* Equatorial comparison site with 14-day constant sun and zenith Earth.

---

### Slide 3: Deterministic Ephemeris & Topocentric Horizon Engine
- **Zero Mock Data Math Engine:**
  - Subsolar and Sub-Earth vector generation calibrated to NASA JPL Horizons.
  - Topocentric Horizon Frame transformation:
    $$\sin(h) = \sin(\phi)\sin(\delta) + \cos(\phi)\cos(\delta)\cos(H)$$
    $$\tan(A) = \frac{\sin(H)}{\cos(H)\sin(\phi) - \tan(\delta)\cos(\phi)}$$
  - Atmosphere-free horizon profile computation without refractive error ($\mu = 0.00^\circ$).
- **Benchmark Accuracy:** Error vs JPL Horizons ephemeris < 0.03° across solar and Earth elevations.

---

### Slide 4: Solar Power Generation & Sunset Countdown
- **Vertical Solar Array Modeling:** Incorporates cosine-loss calculations for vertical mast-mounted solar arrays tracking the azimuth vector:
  $$P_{gen} = P_{max} \cdot \cos(\theta_{inc}) \cdot \eta_{temp} \cdot [h_\odot > \theta_{obs}]$$
- **Operational Safety Features:**
  - Real-time countdown timer to the next shadow pass/sunset.
  - 72-hour diurnal power generation curve.
  - Battery discharge estimator to prevent cryogenic equipment freezing (-233°C in shadows).

---

### Slide 5: Direct-to-Earth (DTE) Comms Windows & Libration
- **Communication Physics at the Pole:** Evaluates line-of-sight clearance above local crater rim obstacle masks.
- **Economic Value:** Direct communication with the Deep Space Network (DSN) saves tens of millions of dollars by eliminating the need for dedicated commercial lunar relay satellites.
- **AOS/LOS Prediction:** Predicts exact Acquisition-of-Signal (AOS) and Loss-of-Signal (LOS) timestamps over 30-day mission spans.

---

### Slide 6: Candidate Landing Sites Trade-off Matrix
- **Comparative Multi-Site Evaluation:**
  - Side-by-side trade-off matrix analyzing 15 sites across illumination %, communication continuity, terrain slope, and scientific value.
  - Highlights trade-offs between high-illumination steep rims (Shackleton) versus smooth landing corridors (Connecting Ridge) and communications massifs (Malapert).

---

### Slide 7: Modular Architecture, GitHub Codebase & Live Evaluator Platform
- **Modern Open-Source Stack:** React 18, Three.js WebGL, TypeScript, Vite, Tailwind CSS.
- **Repository:** `https://github.com/Omar-Alshafai2/Aero-Delta`
- **Live Platform Direct Link (Bypasses Passcode Gate):**  
  `https://sonic-sycamore-mjt9d3p.tmp.now/?access=aerodelta2026`
- **Clearance Code for Evaluators:** `AERODELTA2026`
