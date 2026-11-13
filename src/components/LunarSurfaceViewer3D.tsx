import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Sun, Globe, Eye, Compass, Mountain, Radio, Zap } from "lucide-react";

interface LunarSurfaceViewer3DProps {
  lat: number;
  lon: number;
  siteName: string;
  sunElevation: number;
  sunAzimuth: number;
  earthElevation: number;
  earthAzimuth: number;
  sunAboveHorizon: boolean;
  earthAboveHorizon: boolean;
  powerGenPotential: number;
  stlUrl?: string;
}

export default function LunarSurfaceViewer3D({
  lat,
  lon,
  siteName,
  sunElevation,
  sunAzimuth,
  earthElevation,
  earthAzimuth,
  sunAboveHorizon,
  earthAboveHorizon,
  powerGenPotential,
  stlUrl,
}: LunarSurfaceViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<"horizon" | "orbit" | "sol" | "earth">("horizon");
  const [loading, setLoading] = useState(true);

  // References for live updates without scene recreations
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const sunGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const commLaserRef = useRef<THREE.Line | null>(null);
  const terrainRootRef = useRef<THREE.Group | null>(null);

  // Generate site-specific lunar surface topography (South Pole vs Mare vs Massifs)
  const createProceduralTerrain = (name: string, siteLat: number): THREE.BufferGeometry => {
    const size = 32;
    const segments = 90;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const isPolar = Math.abs(siteLat) >= 65 || /shackleton|nobile|malapert|amundsen|haworth|leibnitz|chandrayaan|csa/i.test(name);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      let y = 0;

      if (isPolar) {
        // South Pole steep craters and towering massifs
        if (dist < 7.0) {
          y -= Math.cos((dist / 7.0) * Math.PI * 0.5) * 2.3; // Crater floor depression
        } else if (dist < 11.5) {
          y += Math.sin(((dist - 7.0) / 4.5) * Math.PI) * 1.9; // Elevated rim ridge
        }
        // Highland ridge noise (steep South Pole slopes)
        y += Math.sin(x * 0.45 + 0.9) * Math.cos(z * 0.45 - 0.7) * 0.75;
        y += Math.sin(x * 1.2 + z * 0.9) * 0.28;
      } else {
        // Equatorial / Mare plains
        if (dist < 5.5) {
          y -= Math.cos((dist / 5.5) * Math.PI * 0.5) * 1.1;
        } else if (dist < 8.5) {
          y += Math.sin(((dist - 5.5) / 3.0) * Math.PI) * 0.5;
        }
        y += Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.38;
        y += Math.sin(x * 0.8 - z * 0.6) * 0.16;
      }

      // Regolith micro-roughness
      y += Math.sin(x * 6.5 + z * 9.8) * 0.04 + Math.cos(x * 12.1 - z * 5.4) * 0.02;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#020308");
    sceneRef.current = scene;

    // Camera: Horizon observer view placed at the landing site
    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 60;
    controls.minDistance = 1.0;
    controlsRef.current = controls;

    // Set initial Horizon View (observer standing at the Lander)
    camera.position.set(0, 1.2, 5.5);
    controls.target.set(0, 0.8, 0);
    controls.update();

    // Ambient Starlight
    const ambient = new THREE.AmbientLight(0x182036, 0.65);
    scene.add(ambient);

    // Directional Sun Light (casts dramatic low-angle shadows)
    const sunLight = new THREE.DirectionalLight(0xfffaed, 4.2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    const d = 16;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0008;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Texture Loader for NASA textures
    const textureLoader = new THREE.TextureLoader();

    // ─────────────────────────────────────────────────────────────
    // ☀️ PROMINENT 3D SUN (SOL) IN THE SKY
    // ─────────────────────────────────────────────────────────────
    const sunGroup = new THREE.Group();
    const sunTex = textureLoader.load("/textures/sun_diffuse.jpg");
    // Scaled to radius 2.2 for dramatic prominence on the horizon
    const sunGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      map: sunTex,
      color: 0xffffff,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunGroup.add(sunMesh);

    // Radiant Solar Corona with Additive Blending
    const coronaGeo = new THREE.RingGeometry(2.25, 4.2, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffe28a,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    corona.name = "corona";
    sunGroup.add(corona);

    const outerGlowGeo = new THREE.RingGeometry(4.2, 7.5, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff9933,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    outerGlow.name = "outerGlow";
    sunGroup.add(outerGlow);

    // Radiant Lens Flare Sprite (visible from anywhere in the scene)
    const flareCanvas = document.createElement("canvas");
    flareCanvas.width = 128;
    flareCanvas.height = 128;
    const fctx = flareCanvas.getContext("2d")!;
    const grad = fctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.2, "rgba(255, 230, 150, 0.85)");
    grad.addColorStop(0.5, "rgba(255, 160, 40, 0.45)");
    grad.addColorStop(1, "rgba(255, 100, 0, 0)");
    fctx.fillStyle = grad;
    fctx.fillRect(0, 0, 128, 128);
    const flareTex = new THREE.CanvasTexture(flareCanvas);
    const flareMat = new THREE.SpriteMaterial({
      map: flareTex,
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
    });
    const flareSprite = new THREE.Sprite(flareMat);
    flareSprite.scale.set(16.0, 16.0, 1);
    flareSprite.name = "flare";
    sunGroup.add(flareSprite);

    scene.add(sunGroup);
    sunGroupRef.current = sunGroup;

    // ─────────────────────────────────────────────────────────────
    // 🌍 PROMINENT 3D EARTH IN THE SKY
    // ─────────────────────────────────────────────────────────────
    const earthGroup = new THREE.Group();
    const earthDiffTex = textureLoader.load("/textures/earth_diffuse.jpg");
    const earthNormTex = textureLoader.load("/textures/earth_normal.jpg");
    const earthGeo = new THREE.SphereGeometry(1.25, 32, 32);
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthDiffTex,
      normalMap: earthNormTex,
      roughness: 0.4,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth blue atmosphere glow
    const earthAtmoGeo = new THREE.SphereGeometry(1.35, 32, 32);
    const earthAtmoMat = new THREE.MeshBasicMaterial({
      color: 0x55aaff,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });
    earthGroup.add(new THREE.Mesh(earthAtmoGeo, earthAtmoMat));
    scene.add(earthGroup);
    earthGroupRef.current = earthGroup;

    // ─────────────────────────────────────────────────────────────
    // 📡 DIRECT-TO-EARTH COMMUNICATION LASER SIGHTLINE
    // ─────────────────────────────────────────────────────────────
    const laserMat = new THREE.LineDashedMaterial({
      color: 0x41e6ff,
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 2,
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.0, 0),
      new THREE.Vector3(0, 10, 0),
    ]);
    const commLaser = new THREE.Line(laserGeo, laserMat);
    commLaser.computeLineDistances();
    scene.add(commLaser);
    commLaserRef.current = commLaser;

    // ─────────────────────────────────────────────────────────────
    // 🏔️ 3D LANDED SURFACE TERRAIN & APOLLO LUNAR MODULE
    // ─────────────────────────────────────────────────────────────
    const terrainRoot = new THREE.Group();
    scene.add(terrainRoot);
    terrainRootRef.current = terrainRoot;

    const gltfLoader = new GLTFLoader();
    const stlLoader = new STLLoader();

    // Helper to add the Apollo Astronaut standing on the lunar surface
    const loadAstronaut = (yPosition: number) => {
      gltfLoader.load(
        "/models/Astronaut.glb",
        (gltf) => {
          const astro = gltf.scene;
          const bbox = new THREE.Box3().setFromObject(astro);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const s = 0.55 / (maxDim || 1);
          astro.scale.set(s, s, s);
          astro.position.set(1.4, yPosition, 0.9);
          astro.rotation.y = -Math.PI / 4;
          astro.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          terrainRoot.add(astro);
        },
        undefined,
        (err) => console.log("Astronaut load info:", err)
      );
    };

    // Helper to add the Apollo Lunar Module onto the terrain
    const loadLander = (yPosition: number) => {
      gltfLoader.load(
        "/models/Apollo_Lunar_Module.glb",
        (gltf) => {
          const lm = gltf.scene;
          const bbox = new THREE.Box3().setFromObject(lm);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const s = 1.1 / (maxDim || 1);
          lm.scale.set(s, s, s);
          lm.position.set(0, yPosition, 0);
          lm.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          terrainRoot.add(lm);
          loadAstronaut(yPosition);
        },
        undefined,
        (err) => console.log("Lander load info:", err)
      );
    };

    setLoading(true);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1800);

    if (stlUrl) {
      // Load real NASA STL terrain slice
      stlLoader.load(
        stlUrl,
        (geom) => {
          geom.computeVertexNormals();
          geom.center();
          const mat = new THREE.MeshStandardMaterial({
            color: 0x8e96a4,
            roughness: 0.90,
            metalness: 0.05,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geom, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const bbox = new THREE.Box3().setFromObject(mesh);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const s = 24.0 / (maxDim || 1);
          mesh.scale.set(s, s, s);
          mesh.rotation.x = -Math.PI / 2;
          terrainRoot.add(mesh);

          loadLander(0.2);
          setLoading(false);
          clearTimeout(safetyTimer);
        },
        undefined,
        (err) => {
          console.warn("Failed loading STL, generating procedural lunar topography:", err);
          const geo = createProceduralTerrain(siteName, lat);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x88909e,
            roughness: 0.92,
            metalness: 0.04,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.receiveShadow = true;
          mesh.castShadow = true;
          terrainRoot.add(mesh);
          loadLander(0.0);
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      );
    } else {
      // Procedural South Pole topography with craters and massifs
      const geo = createProceduralTerrain(siteName, lat);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x88909e,
        roughness: 0.92,
        metalness: 0.04,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      terrainRoot.add(mesh);
      loadLander(0.0);
      setLoading(false);
      clearTimeout(safetyTimer);
    }

    // Deep Space Stars (Deterministic celestial dome distribution)
    const starCount = 500;
    const starGeo = new THREE.BufferGeometry();
    const starCoords = new Float32Array(starCount * 3);
    for (let sIdx = 0; sIdx < starCount; sIdx++) {
      // Golden ratio spherical spiral distribution on upper celestial hemisphere
      const phi = Math.acos(1 - (sIdx + 0.5) / starCount * 0.95);
      const theta = 3.883222 * sIdx;
      const radius = 55 + ((sIdx * 37) % 35);
      const sx = radius * Math.sin(phi) * Math.cos(theta);
      const sy = Math.max(3, radius * Math.cos(phi));
      const sz = radius * Math.sin(phi) * Math.sin(theta);
      starCoords[sIdx * 3] = sx;
      starCoords[sIdx * 3 + 1] = sy;
      starCoords[sIdx * 3 + 2] = sz;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xd4e2ff, size: 0.25 });
    scene.add(new THREE.Points(starGeo, starMat));

    // Horizon Cardinal Compass Rings at R=15
    const compassGroup = new THREE.Group();
    const compassRadius = 15.5;
    const cardinals = [
      { label: "N", az: 0 },
      { label: "E", az: 90 },
      { label: "S", az: 180 },
      { label: "W", az: 270 },
    ];
    cardinals.forEach(({ label, az }) => {
      const rad = (az * Math.PI) / 180;
      const x = Math.sin(rad) * compassRadius;
      const z = -Math.cos(rad) * compassRadius;
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8),
        new THREE.MeshBasicMaterial({ color: 0x41e6ff })
      );
      p.position.set(x, 0.6, z);
      compassGroup.add(p);
    });
    scene.add(compassGroup);

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Earth gentle rotation
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.y += 0.003;
      }

      // Corona and outer glow billboard to face camera
      if (sunGroupRef.current) {
        const c1 = sunGroupRef.current.getObjectByName("corona");
        const c2 = sunGroupRef.current.getObjectByName("outerGlow");
        if (c1) c1.quaternion.copy(camera.quaternion);
        if (c2) c2.quaternion.copy(camera.quaternion);
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      clearTimeout(safetyTimer);
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [stlUrl, siteName, lat, lon]);

  // Update Dynamic Positions of Sun, Earth & Comms Line
  useEffect(() => {
    const sunGroup = sunGroupRef.current;
    const sunLight = sunLightRef.current;
    const earthGroup = earthGroupRef.current;
    const commLaser = commLaserRef.current;
    if (!sunGroup || !earthGroup) return;

    // Distance of Sun and Earth in observer horizon space
    const SUN_DISTANCE = 32.0;
    const EARTH_DISTANCE = 24.0;

    // Convert observer (Azimuth, Elevation) to 3D Cartesian coordinates relative to Landing Site (0, 0, 0)
    // Azimuth: 0=N (+Z forward is -Z in Three.js, so Az 0 -> -Z, 90 -> +X, 180 -> +Z, 270 -> -X)
    const azRad = (sunAzimuth * Math.PI) / 180;
    const elRad = (sunElevation * Math.PI) / 180;

    const sunX = Math.sin(azRad) * Math.cos(elRad) * SUN_DISTANCE;
    const sunY = Math.sin(elRad) * SUN_DISTANCE;
    const sunZ = -Math.cos(azRad) * Math.cos(elRad) * SUN_DISTANCE;

    sunGroup.position.set(sunX, sunY, sunZ);

    if (sunLight) {
      sunLight.position.set(sunX, sunY, sunZ);
      // If sun is below horizon, dim the light completely
      sunLight.intensity = sunAboveHorizon ? 4.2 * Math.max(0.15, Math.sin(elRad)) : 0.1;
    }

    // Earth Position
    const eAzRad = (earthAzimuth * Math.PI) / 180;
    const eElRad = (earthElevation * Math.PI) / 180;

    const earthX = Math.sin(eAzRad) * Math.cos(eElRad) * EARTH_DISTANCE;
    const earthY = Math.sin(eElRad) * EARTH_DISTANCE;
    const earthZ = -Math.cos(eAzRad) * Math.cos(eElRad) * EARTH_DISTANCE;

    earthGroup.position.set(earthX, earthY, earthZ);

    // Update Comms Laser Line
    if (commLaser) {
      const positions = new Float32Array([0, 1.1, 0, earthX, earthY, earthZ]);
      commLaser.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      commLaser.geometry.attributes.position.needsUpdate = true;
      commLaser.computeLineDistances();

      const mat = commLaser.material as THREE.LineDashedMaterial;
      mat.color.set(earthAboveHorizon ? 0x41e6ff : 0xff5064);
    }
  }, [sunElevation, sunAzimuth, earthElevation, earthAzimuth, sunAboveHorizon, earthAboveHorizon]);

  // Handle Camera Presets
  const switchCamera = (mode: "horizon" | "orbit" | "sol" | "earth") => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    setCameraMode(mode);
    if (mode === "horizon") {
      // First-person view from the landing site looking across the horizon
      camera.position.set(0, 1.2, 5.5);
      controls.target.set(0, 0.8, 0);
    } else if (mode === "orbit") {
      // Overhead orbital survey view of terrain and horizon
      camera.position.set(0, 14, 22);
      controls.target.set(0, 0, 0);
    } else if (mode === "sol") {
      // Lock onto Sol (Sun)
      const azRad = (sunAzimuth * Math.PI) / 180;
      const elRad = (sunElevation * Math.PI) / 180;
      const SUN_DIST = 32.0;
      const sx = Math.sin(azRad) * Math.cos(elRad) * SUN_DIST;
      const sy = Math.sin(elRad) * SUN_DIST;
      const sz = -Math.cos(azRad) * Math.cos(elRad) * SUN_DIST;

      camera.position.set(-Math.sin(azRad) * 4.2, 1.4, Math.cos(azRad) * 4.2);
      controls.target.set(sx, Math.max(0.2, sy), sz);
    } else if (mode === "earth") {
      // Lock onto Earth
      const eAzRad = (earthAzimuth * Math.PI) / 180;
      const eElRad = (earthElevation * Math.PI) / 180;
      const EARTH_DIST = 24.0;
      const ex = Math.sin(eAzRad) * Math.cos(eElRad) * EARTH_DIST;
      const ey = Math.sin(eElRad) * EARTH_DIST;
      const ez = -Math.cos(eAzRad) * Math.cos(eElRad) * EARTH_DIST;

      camera.position.set(-Math.sin(eAzRad) * 4.2, 1.4, Math.cos(eAzRad) * 4.2);
      controls.target.set(ex, Math.max(0.2, ey), ez);
    }
    controls.update();
  };

  return (
    <div className="relative h-full w-full min-h-[500px] overflow-hidden bg-[#020308]">
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="h-full w-full" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/90 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-3 text-[10px] tracking-[0.28em] text-accent">
            RENDERING 3D LUNAR SURFACE & CELESTIAL HORIZON...
          </p>
        </div>
      )}

      {/* Top Left HUD: Site & Telemetry */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 border border-accent/40 bg-void/80 px-2.5 py-1 text-[9px] tracking-[0.24em] text-accent backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-blink rounded-full bg-accent" />
          3D SURFACE HORIZON VIEW // {siteName}
        </div>
        <div className="text-[10px] tracking-[0.2em] text-dim">
          COORDINATES: <span className="font-bold text-ink">{lat > 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}, {lon}°E</span>
        </div>
      </div>

      {/* Top Right: Camera Presets */}
      <div className="absolute right-3 top-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => switchCamera("sol")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-bold tracking-[0.18em] transition-all ${
            cameraMode === "sol"
              ? "border-ember bg-ember/30 text-ember shadow-[0_0_12px_rgba(255,180,84,0.6)]"
              : "border-white/15 bg-void/80 text-ink hover:border-ember hover:text-ember"
          }`}
          title="Aim camera directly at Sol (Sun) on the horizon"
        >
          <Sun className="h-3.5 w-3.5 text-ember" />
          TRACK SOL
        </button>
        <button
          onClick={() => switchCamera("earth")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-bold tracking-[0.18em] transition-all ${
            cameraMode === "earth"
              ? "border-accent bg-accent/30 text-accent shadow-[0_0_12px_rgba(65,230,255,0.6)]"
              : "border-white/15 bg-void/80 text-ink hover:border-accent hover:text-accent"
          }`}
          title="Aim camera directly at Earth communication vector"
        >
          <Globe className="h-3.5 w-3.5 text-accent" />
          TRACK EARTH
        </button>
        <button
          onClick={() => switchCamera("horizon")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-bold tracking-[0.18em] transition-all ${
            cameraMode === "horizon"
              ? "border-accent bg-accent/25 text-accent shadow-[0_0_12px_rgba(65,230,255,0.4)]"
              : "border-white/15 bg-void/80 text-dim hover:text-ink"
          }`}
          title="Observer eye-level standing at landing site looking at the horizon"
        >
          <Eye className="h-3.5 w-3.5" />
          HORIZON
        </button>
        <button
          onClick={() => switchCamera("orbit")}
          className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[9px] font-bold tracking-[0.18em] transition-all ${
            cameraMode === "orbit"
              ? "border-accent bg-accent/25 text-accent shadow-[0_0_12px_rgba(65,230,255,0.4)]"
              : "border-white/15 bg-void/80 text-dim hover:text-ink"
          }`}
          title="Overhead orbital perspective"
        >
          <Mountain className="h-3.5 w-3.5" />
          SURVEY
        </button>
      </div>

      {/* Floating 3D Telemetry Panels: Sun (Sol) & Earth */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-void/85 p-3 backdrop-blur-md">
        {/* Sun (Sol) Status */}
        <button
          onClick={() => switchCamera("sol")}
          className="flex items-center gap-3 border border-white/10 bg-void/60 p-2 text-left transition-colors hover:border-ember/60 hover:bg-void/90 cursor-pointer"
          title="Click to aim camera directly at Sol (Sun)"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-ember/40 bg-ember/15">
            <Sun className="h-4 w-4 text-ember animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[9px] tracking-[0.25em] text-dim/70 uppercase">
              <span>SOL (SUN) POSITION</span>
              <span className="text-[8px] text-ember/80 font-mono">[CLICK TO AIM]</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
              <span className={sunAboveHorizon ? "text-ember font-mono" : "text-danger font-mono"}>
                ELEV {sunElevation >= 0 ? `+${sunElevation.toFixed(1)}°` : `${sunElevation.toFixed(1)}°`}
              </span>
              <span className="text-dim/60">·</span>
              <span className="text-ink font-mono">AZ {sunAzimuth.toFixed(0)}°</span>
              <span className="text-dim/60">·</span>
              <span className={sunAboveHorizon ? "text-[#9dffb0]" : "text-danger"}>
                {sunAboveHorizon ? "SUNLIT" : "BELOW HORIZON"}
              </span>
            </div>
          </div>
        </button>

        {/* Earth & Direct-To-Earth Comm Status */}
        <button
          onClick={() => switchCamera("earth")}
          className="flex items-center gap-3 border border-white/10 bg-void/60 p-2 text-left transition-colors hover:border-accent/60 hover:bg-void/90 cursor-pointer"
          title="Click to aim camera directly at Earth"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-accent/40 bg-accent/15">
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[9px] tracking-[0.25em] text-dim/70 uppercase">
              <span>EARTH (COMMUNICATION)</span>
              <span className="text-[8px] text-accent/80 font-mono">[CLICK TO AIM]</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
              <span className={earthAboveHorizon ? "text-accent font-mono" : "text-danger font-mono"}>
                ELEV {earthElevation >= 0 ? `+${earthElevation.toFixed(1)}°` : `${earthElevation.toFixed(1)}°`}
              </span>
              <span className="text-dim/60">·</span>
              <span className="text-ink font-mono">AZ {earthAzimuth.toFixed(0)}°</span>
              <span className="text-dim/60">·</span>
              <span className={earthAboveHorizon ? "text-[#9dffb0]" : "text-danger"}>
                {earthAboveHorizon ? "DIRECT LINK ACTIVE" : "SIGNAL OCCULTED"}
              </span>
            </div>
          </div>
        </button>

        {/* Tip */}
        <div className="text-[9px] tracking-[0.22em] text-dim/60">
          DRAG TO LOOK 360° AROUND HORIZON · SCROLL TO ZOOM
        </div>
      </div>
    </div>
  );
}

