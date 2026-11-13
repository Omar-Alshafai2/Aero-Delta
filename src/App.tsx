import { useState } from "react";
import Starfield from "./components/Starfield";
import Cursor from "./components/Cursor";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Briefing from "./components/Briefing";
import MissionPlanner from "./components/MissionPlanner";
import Simulator from "./components/Simulator";
import FlightDynamics from "./components/FlightDynamics";
import LandingSites from "./components/LandingSites";
import Footer from "./components/Footer";
import PresentationModal from "./components/PresentationModal";
import AccessGate from "./components/AccessGate";

export default function App() {
  const [presentationOpen, setPresentationOpen] = useState(false);

  return (
    <AccessGate>
      <div className="relative min-h-screen bg-void text-ink">
        <Starfield />
        <Cursor />
        <Nav onOpenPresentation={() => setPresentationOpen(true)} />

        <main className="relative z-10">
          <Hero onOpenPresentation={() => setPresentationOpen(true)} />
          <Briefing />
          <MissionPlanner />
          <Simulator />
          <FlightDynamics />
          <LandingSites />
          <Footer />
        </main>

        <PresentationModal
          isOpen={presentationOpen}
          onClose={() => setPresentationOpen(false)}
        />

        <div className="grain" aria-hidden="true" />
      </div>
    </AccessGate>
  );
}
