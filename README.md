<div align="center">

# 🚀 AERO-DELTA
### Lunar South Pole Mission Planning & Horizon Analytics Engine

[![NASA Space Apps Challenge 2026](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%202026-blue.svg)](https://www.spaceappschallenge.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-000000?logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

**An intuitive, ephemeris-grade mission planning platform engineered for rapid landing site comparison, high-precision solar illumination modeling, and Direct-to-Earth (DTE) communication window assessment at the Moon's South Pole.**

[🌐 Live Web Platform](https://rushing-cygnus-ijt5wua-omar-alshafai.vercel.app/?access=aerodelta2026) • [📑 Technical Whitepaper](docs/AERO_DELTA_TECHNICAL_REPORT.md) • [📊 Presentation Deck](docs/AERO_DELTA_PRESENTATION_DECK.md)

</div>

---

## 📌 Executive Summary

Missions targeting the lunar south pole—such as NASA's Artemis III and Commercial Lunar Payload Services (CLPS) landers—face extreme environmental constraints. Grazing solar angles (elevation < 2°), permanently shadowed regions (PSRs), and periodic loss of line-of-sight to Earth require precise temporal and spatial coordination.

**AERO-DELTA** bridges the gap between raw ephemeris systems (e.g., JPL Horizons, LOLA DEM data) and operational mission planning by providing:
1. **Interactive 3D Moon Globe & Terrain Visualizer:** High-fidelity 3D visualization of landing sites with interactive coordinate picking, topographic contours, and 3D lander models.
2. **Deterministic Astronomical Ephemeris Engine:** Real-time computation of Sub-Solar and Sub-Earth coordinates, optical libration, topocentric solar/Earth elevation, and azimuth angles with zero mock data.
3. **Power & Communication Feasibility Scoring:** Automated calculation of continuous illumination windows, battery discharge margins, and Direct-to-Earth (DTE) line-of-sight availability.
4. **Multi-Site Scenario Comparison:** Side-by-side trade-off matrix across 15 curated lunar exploration sites (Artemis candidates, Apollo historical baselines, and CLPS targets).

---

## 🔬 Core Capabilities

### 1. Astronomical Ephemeris & Horizon Physics
- **JPL Horizons-Calibrated Math:** Closed-form planetary ephemeris modeling lunar orbital eccentricity, obliquity to the ecliptic (1.543°), and terrestrial libration cycles.
- **Topocentric Coordinates:** Transformation from Selenographic (Mean Earth/Polar Axis) frame to local Topocentric Horizon Frame:
  $$\sin(h) = \sin(\phi)\sin(\delta) + \cos(\phi)\cos(\delta)\cos(H)$$
- **Terrain Obstruction & Horizon Masking:** Evaluates local horizon elevation profiles to detect terrain-induced shadowing and occultation of Earth.

### 2. Candidate Landing Sites Curated Database
AERO-DELTA includes 15 benchmark sites across scientific, historical, and commercial lunar exploration:
- **Artemis III / Polar Targets:** Shackleton Crater Rim, Malapert Mountain Peak, Connecting Ridge, Peak of Eternal Light, Faustini Rim, Haworth Crater Margin, de Gerlache Rim.
- **CLPS & Commercial Targets:** Nobile Crater Ridge (VIPER), Cabeus Crater (LCROSS water-ice discovery site).
- **Apollo Historical Baselines:** Apollo 11 (Mare Tranquillitatis), Apollo 14 (Fra Mauro), Apollo 15 (Hadley Rille), Apollo 16 (Descartes Highlands), Apollo 17 (Taurus-Littrow).

### 3. Integrated Presentation & Technical Documentation
- **Embedded Motion Presentation Deck:** Built-in 10-slide animated presentation deck covering architecture, orbital mechanics, UX workflows, and competitive benchmarks.
- **Academic Technical Report:** Comprehensive research whitepaper detailing coordinate transformations, solar array cos-loss efficiency, and optical link budget estimations.

---

## 🛠️ Technology Stack

- **Frontend Core:** React 18, TypeScript, Tailwind CSS, Lucide Icons
- **3D Graphics Engine:** Three.js, WebGL, GLTFLoader, STLLoader
- **Build System:** Vite 5, vite-plugin-singlefile
- **Hosting & Shielding:** Vercel Edge Network, Passcode Security Gate (`AERODELTA2026`)

---

## ⚡ Quick Start & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [npm](https://www.npmjs.com/) v9.0.0 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Omar-Alshafai2/Aero-Delta.git

# 2. Navigate to project directory
cd Aero-Delta

# 3. Install dependencies
npm install

# 4. Start local development server
npm run dev
```

Open your browser at `http://localhost:5173` to interact with the platform.

### Production Build

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔐 Security & Access Gate

To protect the deployment for evaluators while maintaining unlisted privacy:
- **Default Clearance Code:** `AERODELTA2026`
- **Instant Access via URL Parameter:** `https://<deployed-url>/?access=aerodelta2026`

---

## 👥 NASA Space Apps Challenge 2026

- **Challenge:** Lunar South Pole Landing Site Evaluation & Horizon Visibility
- **Team:** Aero-Delta
- **Repository:** [https://github.com/Omar-Alshafai2/Aero-Delta](https://github.com/Omar-Alshafai2/Aero-Delta)

---

<div align="center">
<i>Engineered with precision for lunar exploration and the Artemis generation.</i>
</div>

