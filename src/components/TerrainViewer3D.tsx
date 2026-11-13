import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface TerrainViewer3DProps {
  stlUrl?: string;
  siteName: string;
  lat?: number;
  lon?: number;
}

export default function TerrainViewer3D({ stlUrl, siteName, lat, lon }: TerrainViewer3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Generate site-specific realistic lunar surface topography
  const createSiteTerrain = (name: string, siteLat?: number): THREE.BufferGeometry => {
    const size = 30;
    const segments = 90;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;

    const isPolar = (siteLat !== undefined && Math.abs(siteLat) >= 65) ||
      /shackleton|nobile|malapert|amundsen|haworth|leibnitz|chandrayaan|csa|south pole/i.test(name);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      let y = 0;

      if (isPolar) {
        // South Pole steep craters and towering massifs
        if (dist < 7.0) {
          // Central crater basin
          y -= Math.cos((dist / 7.0) * Math.PI * 0.5) * 2.4;
        } else if (dist < 11.5) {
          // Elevated rim ridge
          y += Math.sin(((dist - 7.0) / 4.5) * Math.PI) * 2.1;
        }
        // Rugged massif ridges
        y += Math.sin(x * 0.42 + 1.2) * Math.cos(z * 0.42 - 0.8) * 0.85;
        y += Math.sin(x * 1.1 + z * 0.8) * 0.35;
      } else {
        // Equatorial / Mare plains with impact craterlets and gentle rolling regolith
        if (dist < 5.0) {
          y -= Math.cos((dist / 5.0) * Math.PI * 0.5) * 1.2;
        } else if (dist < 8.0) {
          y += Math.sin(((dist - 5.0) / 3.0) * Math.PI) * 0.6;
        }
        // Rolling mare regolith waves
        y += Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.4;
        y += Math.sin(x * 0.8 - z * 0.6) * 0.18;
      }

      // Micro-roughness
      y += Math.sin(x * 5.2 + z * 7.1) * 0.05 + Math.cos(x * 11.3 - z * 4.9) * 0.025;
      pos.setY(i, y);
    }

    geo.computeVertexNormals();
    return geo;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 700;
    let height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050814");

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 5.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.minDistance = 1.6;
    controls.maxDistance = 14;
    controls.target.set(0, 0, 0);

    // Dynamic Grazing Solar Light (accentuates crater topography)
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 3.8);
    sunLight.position.set(7, 3.4, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x41e6ff, 0.5);
    fillLight.position.set(-7, 3.5, -6);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x1a2236, 0.75);
    scene.add(ambientLight);

    // Subtle coordinate reference grid below terrain
    const gridHelper = new THREE.GridHelper(12, 24, 0x41e6ff, 0x16243b);
    gridHelper.position.y = -0.65;
    scene.add(gridHelper);

    setLoading(true);

    const stlLoader = new STLLoader();
    const gltfLoader = new GLTFLoader();

    // Helper to load Apollo Lunar Module
    const loadLander = (yPos = 0.15) => {
      gltfLoader.load(
        "/models/Apollo_Lunar_Module.glb",
        (gltf) => {
          const lm = gltf.scene;
          const lmBox = new THREE.Box3().setFromObject(lm);
          const lmSize = new THREE.Vector3();
          lmBox.getSize(lmSize);
          const lmMax = Math.max(lmSize.x, lmSize.y, lmSize.z);
          const lmScale = 0.38 / (lmMax || 1);
          lm.scale.set(lmScale, lmScale, lmScale);
          lm.position.set(0, yPos, 0);
          lm.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          scene.add(lm);
        },
        undefined,
        (err) => console.log("Terrain LM load info:", err)
      );
    };

    // Failsafe timer to guarantee loading screen always finishes
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1800);

    if (stlUrl) {
      stlLoader.load(
        stlUrl,
        (geometry) => {
          geometry.computeVertexNormals();
          geometry.center();

          const material = new THREE.MeshStandardMaterial({
            color: 0x8e96a4,
            roughness: 0.90,
            metalness: 0.06,
            side: THREE.DoubleSide,
          });

          const terrainMesh = new THREE.Mesh(geometry, material);
          terrainMesh.castShadow = true;
          terrainMesh.receiveShadow = true;

          const bbox = new THREE.Box3().setFromObject(terrainMesh);
          const size = new THREE.Vector3();
          bbox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 4.2 / (maxDim || 1);
          terrainMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
          terrainMesh.rotation.x = -Math.PI / 2;
          scene.add(terrainMesh);

          loadLander(0.22);
          setLoading(false);
          clearTimeout(safetyTimer);
        },
        undefined,
        (err) => {
          console.warn("Could not load STL, using high-detail procedural lunar surface:", err);
          const geo = createSiteTerrain(siteName, lat);
          const mat = new THREE.MeshStandardMaterial({
            color: 0x88909e,
            roughness: 0.92,
            metalness: 0.05,
            side: THREE.DoubleSide,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.receiveShadow = true;
          mesh.castShadow = true;
          scene.add(mesh);
          loadLander(0.0);
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      );
    } else {
      const geo = createSiteTerrain(siteName, lat);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x88909e,
        roughness: 0.92,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      scene.add(mesh);
      loadLander(0.0);
      setLoading(false);
      clearTimeout(safetyTimer);
    }

    // Resize observer
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

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      clearTimeout(safetyTimer);
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [stlUrl, siteName, lat, lon]);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#050814]">
      <div ref={mountRef} className="h-full w-full" />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/85 backdrop-blur-sm z-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-2 text-[9px] tracking-[0.25em] text-accent font-mono">
            RENDERING 3D TOPOGRAPHY TERRAIN...
          </p>
        </div>
      )}

      {/* Top overlay badge */}
      <div className="pointer-events-none absolute left-3 top-3 border border-accent/40 bg-void/75 px-2.5 py-1 text-[9px] tracking-[0.2em] text-accent backdrop-blur-sm z-20">
        {stlUrl ? "NASA 3D STL TOPOGRAPHY" : "LUNAR ELEVATION TERRAIN"} // {siteName}
      </div>

      {/* Bottom overlay tip */}
      <div className="pointer-events-none absolute bottom-3 right-3 text-[8px] tracking-[0.22em] text-dim/70 z-20">
        DRAG TO ORBIT CRATER RELIEF · SCROLL TO ZOOM
      </div>
    </div>
  );
}
