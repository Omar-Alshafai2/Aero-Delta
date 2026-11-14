import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Eye, Compass, Sun, Globe, MapPin, Target } from "lucide-react";

export interface MoonSpot {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lon: number;
  category: "artemis" | "apollo" | "international" | "csa";
  color: string;
  description: string;
}

export const MOON_SPOTS: MoonSpot[] = [
  // ── Artemis & South Pole Candidate Sites ──
  {
    id: "shackleton",
    name: "SHACKLETON RIM",
    shortName: "SHACKLETON",
    lat: -89.54,
    lon: 0.0,
    category: "artemis",
    color: "#41e6ff",
    description: "Artemis III candidate · Connecting Ridge near-constant solar illumination",
  },
  {
    id: "nobile",
    name: "NOBILE CRATER",
    shortName: "NOBILE",
    lat: -85.1,
    lon: 53.5,
    category: "artemis",
    color: "#41e6ff",
    description: "NASA VIPER rover primary target · Volatiles & water ice prospecting",
  },
  {
    id: "malapert",
    name: "MALAPERT MASSIF",
    shortName: "MALAPERT",
    lat: -85.9,
    lon: 0.9,
    category: "artemis",
    color: "#41e6ff",
    description: "CLPS IM-1 Odysseus landing zone · 5 km high polar massif",
  },
  {
    id: "amundsen",
    name: "AMUNDSEN CRATER",
    shortName: "AMUNDSEN",
    lat: -84.5,
    lon: -83.0,
    category: "artemis",
    color: "#41e6ff",
    description: "Permanently Shadowed Region (PSR) with vast cold-trap ice reserves",
  },
  {
    id: "haworth",
    name: "HAWORTH CRATER",
    shortName: "HAWORTH",
    lat: -87.5,
    lon: -5.0,
    category: "artemis",
    color: "#41e6ff",
    description: "Deep south-polar crater cold trap · Sub-40 Kelvin temperatures",
  },
  {
    id: "leibnitz",
    name: "LEIBNITZ BETA PEAK",
    shortName: "LEIBNITZ β",
    lat: -85.0,
    lon: 30.0,
    category: "artemis",
    color: "#41e6ff",
    description: "Elevated highland ridge with extended solar illumination windows",
  },
  {
    id: "csa-rover",
    name: "CSA CANADIAN LUNAR ROVER",
    shortName: "CSA ROVER",
    lat: -85.0,
    lon: -20.0,
    category: "csa",
    color: "#ff8a4d",
    description: "Canadian Space Agency / NASA polar rover ice prospecting site",
  },
  {
    id: "chandrayaan3",
    name: "STATIO SHIV SHAKTI",
    shortName: "CHANDRAYAAN-3",
    lat: -69.37,
    lon: 32.35,
    category: "international",
    color: "#9dffb0",
    description: "ISRO Chandrayaan-3 Vikram lander & Pragyan rover (Aug 2023)",
  },
  {
    id: "change4",
    name: "CHANG'E 4 (FAR SIDE)",
    shortName: "CHANG'E 4",
    lat: -45.44,
    lon: 177.60,
    category: "international",
    color: "#9dffb0",
    description: "CNSA Yutu-2 rover · First landing on lunar far side (Von Kármán)",
  },
  // ── Apollo Historical Sites ──
  {
    id: "apollo11",
    name: "APOLLO 11 (TRANQUILLITY)",
    shortName: "APOLLO 11",
    lat: 0.674,
    lon: 23.47,
    category: "apollo",
    color: "#ffd15c",
    description: "First human landing · Armstrong & Aldrin (20 Jul 1969)",
  },
  {
    id: "apollo12",
    name: "APOLLO 12 (PROCELLARUM)",
    shortName: "APOLLO 12",
    lat: -3.01,
    lon: -23.42,
    category: "apollo",
    color: "#ffd15c",
    description: "Pinpoint landing at Surveyor 3 probe · Conrad & Bean (1969)",
  },
  {
    id: "apollo14",
    name: "APOLLO 14 (FRA MAURO)",
    shortName: "APOLLO 14",
    lat: -3.65,
    lon: -17.47,
    category: "apollo",
    color: "#ffd15c",
    description: "Cone Crater highland exploration · Shepard & Mitchell (1971)",
  },
  {
    id: "apollo15",
    name: "APOLLO 15 (HADLEY RILLE)",
    shortName: "APOLLO 15",
    lat: 26.13,
    lon: 3.63,
    category: "apollo",
    color: "#ffd15c",
    description: "Hadley gorge canyon & Apennine mountains · First Lunar Rover",
  },
  {
    id: "apollo16",
    name: "APOLLO 16 (DESCARTES)",
    shortName: "APOLLO 16",
    lat: -8.97,
    lon: 15.50,
    category: "apollo",
    color: "#ffd15c",
    description: "Central lunar highlands landing · Young & Duke (1972)",
  },
  {
    id: "apollo17",
    name: "APOLLO 17 (TAURUS-LITTROW)",
    shortName: "APOLLO 17",
    lat: 20.19,
    lon: 30.77,
    category: "apollo",
    color: "#ffd15c",
    description: "Final crewed Apollo landing · Valley of Taurus-Littrow (1972)",
  },
];

interface MoonViewer3DProps {
  lat: number;
  lon: number;
  siteName: string;
  sunElevation: number;
  sunAzimuth: number;
  earthElevation: number;
  earthAzimuth: number;
  sunAboveHorizon: boolean;
  earthAboveHorizon: boolean;
  onSelectSite?: (siteId: string) => void;
}

export default function MoonViewer3D({
  lat,
  lon,
  siteName,
  sunElevation,
  sunAzimuth,
  earthElevation,
  earthAzimuth,
  sunAboveHorizon,
  earthAboveHorizon,
  onSelectSite,
}: MoonViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState<"nasa" | "procedural">("procedural");
  const [viewMode, setViewMode] = useState<"orbit" | "southpole" | "active">("southpole");
  const [hoveredSpot, setHoveredSpot] = useState<MoonSpot | null>(null);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const activeBeaconRef = useRef<THREE.Group | null>(null);
  const allMarkersGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const earthMeshRef = useRef<THREE.Group | null>(null);
  const commLineRef = useRef<THREE.Line | null>(null);

  const MOON_RADIUS = 1.6;

  // Convert lunar lat/lon to 3D Cartesian coordinates on sphere
  const latLonToVector3 = (latDeg: number, lonDeg: number, radius: number): THREE.Vector3 => {
    const phi = (90 - latDeg) * (Math.PI / 180);
    const theta = (lonDeg + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Helper to create high-contrast text badge billboard sprites
  const createLabelSprite = (text: string, color: string): THREE.Sprite => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 64);

    // Pill background
    ctx.fillStyle = "rgba(4, 7, 18, 0.88)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    const r = 10;
    const x = 6, y = 8, w = 244, h = 48;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = color;
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.42, 0.105, 1);
    return sprite;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 500;

    // Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#03050c");

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    // Initial camera angled at Lunar South Pole
    camera.position.set(0, -3.2, 0.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.0;
    controls.maxDistance = 14.0;
    controls.target.set(0, -1.6, 0);
    controlsRef.current = controls;

    // Ambient Starlight
    const ambientLight = new THREE.AmbientLight(0x1a2236, 0.6);
    scene.add(ambientLight);

    // Directional Sun Light
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 3.8);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();

    // Glowing Sun Mesh in space
    const sunTex = textureLoader.load("/textures/sun_diffuse.jpg");
    const sunGeo = new THREE.SphereGeometry(0.42, 24, 24);
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    // Earth in space
    const earthGroup = new THREE.Group();
    const earthDiffTex = textureLoader.load("/textures/earth_diffuse.jpg");
    const earthNormTex = textureLoader.load("/textures/earth_normal.jpg");
    const earthGeo = new THREE.SphereGeometry(0.32, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDiffTex,
      normalMap: earthNormTex,
      roughness: 0.45,
      metalness: 0.1,
    });
    const earthSphere = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthSphere);

    // Earth blue atmosphere glow halo
    const earthHaloGeo = new THREE.SphereGeometry(0.34, 32, 32);
    const earthHaloMat = new THREE.MeshBasicMaterial({
      color: 0x66bbff,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
    });
    earthGroup.add(new THREE.Mesh(earthHaloGeo, earthHaloMat));
    scene.add(earthGroup);
    earthMeshRef.current = earthGroup;

    // Communication Laser Line
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x41e6ff,
      dashSize: 0.15,
      gapSize: 0.08,
      linewidth: 1,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const commLine = new THREE.Line(lineGeo, lineMat);
    commLine.computeLineDistances();
    scene.add(commLine);
    commLineRef.current = commLine;

    // Starfield
    const starCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starCoords = new Float32Array(starCount * 3);
    for (let sIdx = 0; sIdx < starCount; sIdx++) {
      const phi = Math.acos(1 - 2 * (sIdx + 0.5) / starCount);
      const theta = 3.883222 * sIdx;
      const radius = 24 + ((sIdx * 19) % 20);
      starCoords[sIdx * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starCoords[sIdx * 3 + 1] = radius * Math.cos(phi);
      starCoords[sIdx * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xc8ddff, size: 0.14 });
    scene.add(new THREE.Points(starGeo, starMat));

    // ─────────────────────────────────────────────────────────────
    // 🌕 HIGH-DETAIL PROCEDURAL LUNAR GLOBE (Instant, 100% Reliable)
    // ─────────────────────────────────────────────────────────────
    // Generates procedural lunar surface with mare basins and highland craters
    const moonCanvas = document.createElement("canvas");
    moonCanvas.width = 1024;
    moonCanvas.height = 512;
    const mctx = moonCanvas.getContext("2d")!;
    // Base highland regolith
    mctx.fillStyle = "#878e9c";
    mctx.fillRect(0, 0, 1024, 512);

    // Darker lunar maria (basalt seas)
    mctx.fillStyle = "rgba(42, 47, 56, 0.72)";
    // Oceanus Procellarum / Mare Imbrium / Mare Tranquillitatis / Mare Serenitatis
    mctx.beginPath();
    mctx.ellipse(380, 200, 160, 110, 0, 0, Math.PI * 2);
    mctx.fill();
    mctx.beginPath();
    mctx.ellipse(560, 230, 95, 75, 0, 0, Math.PI * 2);
    mctx.fill();
    mctx.beginPath();
    mctx.ellipse(650, 245, 80, 65, 0, 0, Math.PI * 2);
    mctx.fill();

    // South Pole Aitken Basin (vast dark south polar basin)
    mctx.fillStyle = "rgba(40, 44, 52, 0.55)";
    mctx.beginPath();
    mctx.ellipse(512, 475, 220, 35, 0, 0, Math.PI * 2);
    mctx.fill();

    // Crater noise dots
    mctx.fillStyle = "rgba(220, 230, 245, 0.4)";
    for (let c = 0; c < 220; c++) {
      const cx = (c * 179) % 1024;
      const cy = (c * 83) % 512;
      const cr = (c % 5) + 1.2;
      mctx.beginPath();
      mctx.arc(cx, cy, cr, 0, Math.PI * 2);
      mctx.fill();
    }

    const moonTex = new THREE.CanvasTexture(moonCanvas);
    const proceduralGeo = new THREE.SphereGeometry(MOON_RADIUS, 64, 64);
    const proceduralMat = new THREE.MeshStandardMaterial({
      map: moonTex,
      roughness: 0.94,
      metalness: 0.04,
    });
    const moonSphere = new THREE.Mesh(proceduralGeo, proceduralMat);
    scene.add(moonSphere);

    // ─────────────────────────────────────────────────────────────
    // 📍 3D MARKS ON THE MOON FOR EVERY SINGLE LANDING SPOT
    // ─────────────────────────────────────────────────────────────
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    allMarkersGroupRef.current = markersGroup;

    MOON_SPOTS.forEach((spot) => {
      const spotGroup = new THREE.Group();
      spotGroup.name = `spot_${spot.id}`;

      const pos = latLonToVector3(spot.lat, spot.lon, MOON_RADIUS);
      const normal = pos.clone().normalize();

      // 1. Surface marker ring flat against the sphere
      const ringGeo = new THREE.RingGeometry(0.025, 0.048, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(spot.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos.clone().addScaledVector(normal, 0.005));
      ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      spotGroup.add(ring);

      // 2. Pin stem pointing outward from Moon center
      const stemLength = 0.16;
      const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, stemLength, 8);
      const stemMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(spot.color) });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.copy(pos.clone().addScaledVector(normal, stemLength / 2));
      stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      spotGroup.add(stem);

      // 3. Glowing sphere head at tip of pin
      const headGeo = new THREE.SphereGeometry(0.032, 12, 12);
      const headMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(spot.color) });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(pos.clone().addScaledVector(normal, stemLength + 0.025));
      spotGroup.add(head);

      // 4. Floating holographic text billboard label sprite
      const label = createLabelSprite(spot.shortName, spot.color);
      label.position.copy(pos.clone().addScaledVector(normal, stemLength + 0.11));
      spotGroup.add(label);

      // Attach spot data for raycasting
      spotGroup.userData = { spot };
      markersGroup.add(spotGroup);
    });

    // ─────────────────────────────────────────────────────────────
    // 🌟 ACTIVE LANDING SITE HIGHLIGHT BEACON (Large pulse ring & laser)
    // ─────────────────────────────────────────────────────────────
    const activeBeacon = new THREE.Group();
    const activePulseRingGeo = new THREE.RingGeometry(0.05, 0.09, 24);
    const activePulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x41e6ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const activePulseRing = new THREE.Mesh(activePulseRingGeo, activePulseRingMat);
    activePulseRing.name = "pulseRing";
    activeBeacon.add(activePulseRing);

    // Vertical cyan laser beam shooting into space
    const laserMat = new THREE.LineBasicMaterial({ color: 0x41e6ff, transparent: true, opacity: 0.75 });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.7, 0),
    ]);
    const laserBeam = new THREE.Line(laserGeo, laserMat);
    activeBeacon.add(laserBeam);

    scene.add(activeBeacon);
    activeBeaconRef.current = activeBeacon;

    // Load Apollo Lunar Module to sit atop the active beacon
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      "/models/Apollo_Lunar_Module.glb",
      (gltf) => {
        const lm = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(lm);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const s = 0.08 / (maxDim || 1);
        lm.scale.set(s, s, s);
        lm.position.y = 0.03;
        activeBeacon.add(lm);
      },
      undefined,
      (err) => console.log("Lander model note:", err)
    );

    // Optional GLB moon model loader for even higher fidelity if available
    gltfLoader.load(
      "/models/moon_small.glb",
      (gltf) => {
        const mesh = gltf.scene;
        const bbox = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = (MOON_RADIUS * 2) / (maxDim || 1);
        mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        mesh.position.sub(center.multiplyScalar(scaleFactor));
        // Remove procedural sphere and replace with NASA GLB
        scene.remove(moonSphere);
        scene.add(mesh);
        setModelType("nasa");
      },
      undefined,
      (err) => {
        // Procedural moon is already active and beautiful!
        console.log("Using procedural lunar globe with Apollo & Artemis sites:", err);
      }
    );

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Raycaster for interactive spot clicking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (allMarkersGroupRef.current) {
        const intersects = raycaster.intersectObjects(allMarkersGroupRef.current.children, true);
        if (intersects.length > 0) {
          // Find root spot group
          let cur: THREE.Object3D | null = intersects[0].object;
          while (cur && !cur.userData?.spot && cur.parent !== allMarkersGroupRef.current) {
            cur = cur.parent;
          }
          if (cur && cur.userData?.spot) {
            const spot: MoonSpot = cur.userData.spot;
            setHoveredSpot(spot);
            if (onSelectSite) {
              onSelectSite(spot.id);
            }
          }
        }
      }
    };

    container.addEventListener("click", handleClick);

    // Animation Loop
    let animationFrameId: number;
    let beaconPulse = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Pulse active beacon ring
      beaconPulse += 0.055;
      const s = 1.0 + Math.sin(beaconPulse) * 0.35;
      const pulseRing = activeBeacon.getObjectByName("pulseRing");
      if (pulseRing) {
        pulseRing.scale.set(s, s, 1);
      }

      // Rotate Earth slowly
      if (earthMeshRef.current) {
        earthMeshRef.current.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      container.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, []);

  // Update Dynamic Positions of Active Beacon, Sun, Earth & Comms Line
  useEffect(() => {
    const activeBeacon = activeBeaconRef.current;
    const sunLight = sunLightRef.current;
    const sunMesh = sunMeshRef.current;
    const earthMesh = earthMeshRef.current;
    const commLine = commLineRef.current;
    if (!activeBeacon) return;

    // 1. Position Active Landing Site Beacon
    const lzPos = latLonToVector3(lat, lon, MOON_RADIUS);
    activeBeacon.position.copy(lzPos);
    const normal = lzPos.clone().normalize();
    activeBeacon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    // 2. Position the Sun relative to local observer
    const sunDist = 9.0;
    const azRad = (sunAzimuth * Math.PI) / 180;
    const elRad = (sunElevation * Math.PI) / 180;

    const northPole = new THREE.Vector3(0, 1, 0);
    const north = northPole.clone().sub(normal.clone().multiplyScalar(normal.dot(northPole))).normalize();
    const east = new THREE.Vector3().crossVectors(normal, north).normalize();

    const sunLocalDir = new THREE.Vector3()
      .addScaledVector(north, Math.cos(azRad) * Math.cos(elRad))
      .addScaledVector(east, Math.sin(azRad) * Math.cos(elRad))
      .addScaledVector(normal, Math.sin(elRad))
      .normalize();

    const sunPos = sunLocalDir.clone().multiplyScalar(sunDist);
    if (sunLight) sunLight.position.copy(sunPos);
    if (sunMesh) sunMesh.position.copy(sunPos);

    // 3. Position the Earth
    const earthDist = 6.5;
    const eAzRad = (earthAzimuth * Math.PI) / 180;
    const eElRad = (earthElevation * Math.PI) / 180;

    const earthLocalDir = new THREE.Vector3()
      .addScaledVector(north, Math.cos(eAzRad) * Math.cos(eElRad))
      .addScaledVector(east, Math.sin(eAzRad) * Math.cos(eElRad))
      .addScaledVector(normal, Math.sin(eElRad))
      .normalize();

    const earthPos = earthLocalDir.clone().multiplyScalar(earthDist);
    if (earthMesh) earthMesh.position.copy(earthPos);

    // 4. Update the Direct-To-Earth Comm Laser Line
    if (commLine) {
      const linePositions = new Float32Array([
        lzPos.x,
        lzPos.y,
        lzPos.z,
        earthPos.x,
        earthPos.y,
        earthPos.z,
      ]);
      commLine.geometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
      commLine.geometry.attributes.position.needsUpdate = true;
      commLine.computeLineDistances();

      const mat = commLine.material as THREE.LineDashedMaterial;
      mat.color.set(earthAboveHorizon ? 0x41e6ff : 0xff5064);
    }
  }, [lat, lon, sunElevation, sunAzimuth, earthElevation, earthAzimuth, earthAboveHorizon]);

  // Handle Camera Presets
  const resetCamera = (mode: "orbit" | "southpole" | "active") => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setViewMode(mode);
    if (mode === "southpole") {
      // Zoom into Lunar South Pole
      camera.position.set(0, -3.2, 0.4);
      controls.target.set(0, -1.6, 0);
    } else if (mode === "active") {
      // Aim camera directly at currently active landing site
      const pos = latLonToVector3(lat, lon, MOON_RADIUS);
      const camPos = pos.clone().multiplyScalar(2.2);
      camera.position.copy(camPos);
      controls.target.copy(pos);
    } else {
      // Full Orbit View
      camera.position.set(0, -1.8, 4.4);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  };

  const handleSpotClick = (spot: MoonSpot) => {
    setHoveredSpot(spot);
    if (onSelectSite) {
      onSelectSite(spot.id);
    }
    // Zoom to spot
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (camera && controls) {
      const pos = latLonToVector3(spot.lat, spot.lon, MOON_RADIUS);
      camera.position.copy(pos.clone().multiplyScalar(2.15));
      controls.target.copy(pos);
      controls.update();
    }
  };

  return (
    <div className="relative h-full w-full min-h-[460px] overflow-hidden bg-[#03050c]">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Top Left HUD Info */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 z-20">
        <div className="flex items-center gap-2 border border-accent/40 bg-void/80 px-2.5 py-1 text-[9px] tracking-[0.24em] text-accent backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
          3D LUNAR GLOBE // 15 LANDING SPOTS MARKED
        </div>
        <div className="text-[10px] tracking-[0.2em] text-dim">
          ACTIVE: <span className="text-ink font-bold">{siteName}</span> ({lat > 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, {lon}°E)
        </div>
      </div>

      {/* Camera Toolbar */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 z-20">
        <button
          onClick={() => resetCamera("active")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] tracking-[0.18em] transition-all ${
            viewMode === "active"
              ? "border-accent bg-accent/25 text-accent shadow-[0_0_10px_rgba(65,230,255,0.4)]"
              : "border-white/15 bg-void/80 text-dim hover:text-ink"
          }`}
          title="Zoom to active landing site"
        >
          <Target className="h-3 w-3 text-accent" />
          TARGET SITE
        </button>
        <button
          onClick={() => resetCamera("southpole")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] tracking-[0.18em] transition-all ${
            viewMode === "southpole"
              ? "border-accent bg-accent/25 text-accent shadow-[0_0_10px_rgba(65,230,255,0.4)]"
              : "border-white/15 bg-void/80 text-dim hover:text-ink"
          }`}
          title="Focus on Lunar South Pole"
        >
          <Compass className="h-3 w-3 text-accent" />
          SOUTH POLE
        </button>
        <button
          onClick={() => resetCamera("orbit")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] tracking-[0.18em] transition-all ${
            viewMode === "orbit"
              ? "border-accent bg-accent/25 text-accent shadow-[0_0_10px_rgba(65,230,255,0.4)]"
              : "border-white/15 bg-void/80 text-dim hover:text-ink"
          }`}
          title="Full Orbit View"
        >
          <Eye className="h-3 w-3" />
          GLOBAL ORBIT
        </button>
      </div>

      {/* Quick-Select Spots Chips Bar */}
      <div className="absolute bottom-14 left-3 right-3 z-20 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {MOON_SPOTS.map((s) => {
          const isActive = s.id === siteName.toLowerCase().replace(/[^a-z0-9]/g, "") ||
            (Math.abs(s.lat - lat) < 0.2 && Math.abs(s.lon - lon) < 0.2);
          return (
            <button
              key={s.id}
              onClick={() => handleSpotClick(s)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold tracking-[0.15em] border backdrop-blur-md transition-all cursor-pointer ${
                isActive
                  ? "border-accent bg-accent/30 text-ink shadow-[0_0_10px_rgba(65,230,255,0.6)]"
                  : "border-white/10 bg-void/85 text-dim hover:border-white/30 hover:text-ink"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.shortName}
            </button>
          );
        })}
      </div>

      {/* 3D Celestial Legend */}
      <div className="pointer-events-none absolute left-3 bottom-3 flex flex-wrap items-center gap-3 border border-white/10 bg-void/85 p-2 text-[8.5px] tracking-[0.18em] backdrop-blur-sm z-20">
        <div className="flex items-center gap-1.5 text-ember">
          <Sun className="h-3 w-3" />
          <span>SUN: {sunElevation.toFixed(1)}° {sunAboveHorizon ? "(SUNLIT)" : "(ECLIPSED)"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-accent">
          <Globe className="h-3 w-3" />
          <span>EARTH: {earthElevation.toFixed(1)}° {earthAboveHorizon ? "(DIRECT LINK)" : "(BLOCKED)"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-dim">
          <MapPin className="h-3 w-3 text-accent" />
          <span>CLICK ANY MARK TO SELECT SITE</span>
        </div>
      </div>

      {/* Interaction Hint */}
      <div className="pointer-events-none absolute bottom-3 right-3 text-[8px] tracking-[0.22em] text-dim/70 z-20">
        DRAG TO ROTATE GLOBE · SCROLL TO ZOOM
      </div>
    </div>
  );
}
