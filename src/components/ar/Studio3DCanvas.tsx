"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Camera, RotateCw, Download, Sparkles, Eye, ShieldCheck } from "lucide-react";
import { MetricBodyDimensions } from "@/lib/ar/fitMLModel";

interface Studio3DCanvasProps {
  metrics: MetricBodyDimensions;
  garmentColor?: string;
  garmentType?: "top" | "bottom" | "dress";
  garmentName?: string;
  onSnapshot4Angles?: () => void;
}

export default function Studio3DCanvas({
  metrics,
  garmentColor = "#2563EB",
  garmentType = "top",
  garmentName = "Tailored Garment",
}: Studio3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Mannequin meshes
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  const garmentMeshRef = useRef<THREE.Mesh | null>(null);

  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [activeAngle, setActiveAngle] = useState<string>("front");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // ─── 1. Build Parametric Mannequin & Studio Environment ──────────────────
  useEffect(() => {
    if (!mountRef.current || !canvasRef.current) return;

    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#090D16");
    sceneRef.current = scene;

    // 2. Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 1.1, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // 5. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    
    // Directional Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;

    // Gold Rim Light (#f2c230)
    const rimLight = new THREE.DirectionalLight(0xf2c230, 2.2);
    rimLight.position.set(-3, 2.5, -2);

    // Soft fill light
    const fillLight = new THREE.DirectionalLight(0x90b0ff, 0.5);
    fillLight.position.set(-2, 1, 2);

    scene.add(ambientLight, keyLight, rimLight, fillLight);

    // 6. Golden Pedestal Pod & Ambient Particles
    const pedestalGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.15, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1E293B"),
      roughness: 0.3,
      metalness: 0.8,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -0.075, 0);
    pedestal.receiveShadow = true;

    // Gold trim ring
    const ringGeo = new THREE.TorusGeometry(0.88, 0.015, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#f2c230") });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0, 0);
    scene.add(pedestal, ring);

    // Floating Golden Particles
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 3;
      particlePos[i + 1] = Math.random() * 2.2;
      particlePos[i + 2] = (Math.random() - 0.5) * 3;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: new THREE.Color("#f2c230"),
      size: 0.025,
      transparent: true,
      opacity: 0.65,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 7. Build Mannequin Group
    const mannequinGroup = new THREE.Group();
    mannequinGroup.name = "MannequinGroup";
    mannequinGroupRef.current = mannequinGroup;
    scene.add(mannequinGroup);

    // Initial Mesh Build
    rebuildMannequin(mannequinGroup, metrics, garmentColor, garmentType);

    // Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotate;
        controlsRef.current.update();
      }

      // Particle float animation
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 1; i < particleCount * 3; i += 3) {
        posAttr.array[i] += 0.0015;
        if (posAttr.array[i] > 2.5) posAttr.array[i] = 0;
      }
      posAttr.needsUpdate = true;

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // ─── 2. Rebuild Mannequin & Garment Geometry on Prop Change ───────────────
  const rebuildMannequin = (
    group: THREE.Group,
    m: MetricBodyDimensions,
    gColor: string,
    gType: "top" | "bottom" | "dress"
  ) => {
    group.clear();

    const scaleHeight = m.userHeightCm / 172.0; // Baseline height 172cm
    const shoulderWidthMeter = (m.shoulderCm / 100) * 0.9;
    const hipWidthMeter = (m.hipCm / 100) * 0.85;
    const torsoHeightMeter = (m.torsoCm / 100) * 0.95;

    // Mannequin Material
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#334155"),
      roughness: 0.6,
      metalness: 0.2,
    });

    // Head & Neck
    const headGeo = new THREE.SphereGeometry(0.12 * scaleHeight, 32, 32);
    headGeo.scale(1, 1.25, 0.95);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 1.75 * scaleHeight, 0);

    const neckGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.1, 16);
    const neckMesh = new THREE.Mesh(neckGeo, bodyMat);
    neckMesh.position.set(0, 1.58 * scaleHeight, 0);

    // Torso Base
    const torsoPoints: THREE.Vector2[] = [];
    const pointsCount = 12;
    for (let i = 0; i <= pointsCount; i++) {
      const t = i / pointsCount; // 0 (hips) -> 1 (shoulders)
      const radius = hipWidthMeter * (1 - t) + shoulderWidthMeter * t * 0.55;
      const y = t * torsoHeightMeter;
      torsoPoints.push(new THREE.Vector2(radius, y));
    }
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 32);
    torsoGeo.scale(1, 1, 0.75); // Z-volume scaling for chest volume
    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
    torsoMesh.position.set(0, 0.85 * scaleHeight, 0);

    // Legs
    const legGeoL = new THREE.CylinderGeometry(0.08, 0.06, 0.85 * scaleHeight, 16);
    const legMeshL = new THREE.Mesh(legGeoL, bodyMat);
    legMeshL.position.set(-hipWidthMeter * 0.6, 0.42 * scaleHeight, 0);

    const legMeshR = legMeshL.clone();
    legMeshR.position.x = hipWidthMeter * 0.6;

    group.add(headMesh, neckMesh, torsoMesh, legMeshL, legMeshR);

    // ─── Garment Geometry overlay (Lathe / Mesh) ───────────────────────────
    const fabricMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(gColor),
      roughness: 0.75,
      metalness: 0.05,
      clearcoat: 0.2,
      side: THREE.DoubleSide,
    });

    if (gType === "top" || gType === "dress") {
      const garmentPoints: THREE.Vector2[] = [];
      const garmentH = gType === "dress" ? torsoHeightMeter * 1.6 : torsoHeightMeter * 1.1;
      for (let i = 0; i <= pointsCount; i++) {
        const t = i / pointsCount;
        const radius = (hipWidthMeter * (1 - t) + shoulderWidthMeter * t * 0.58) * 1.04;
        garmentPoints.push(new THREE.Vector2(radius, t * garmentH));
      }
      const gGeo = new THREE.LatheGeometry(garmentPoints, 32);
      gGeo.scale(1.03, 1.0, 0.78);
      const garmentMesh = new THREE.Mesh(gGeo, fabricMat);
      garmentMesh.position.set(0, 0.83 * scaleHeight, 0);
      garmentMesh.castShadow = true;
      garmentMeshRef.current = garmentMesh;

      // Add Sleeves
      const sleeveGeoL = new THREE.CylinderGeometry(0.07, 0.06, 0.35, 16);
      sleeveGeoL.rotateZ(-Math.PI / 4);
      sleeveGeoL.translate(-shoulderWidthMeter * 0.8, 1.45 * scaleHeight, 0);
      const sleeveMeshL = new THREE.Mesh(sleeveGeoL, fabricMat);

      const sleeveGeoR = new THREE.CylinderGeometry(0.07, 0.06, 0.35, 16);
      sleeveGeoR.rotateZ(Math.PI / 4);
      sleeveGeoR.translate(shoulderWidthMeter * 0.8, 1.45 * scaleHeight, 0);
      const sleeveMeshR = new THREE.Mesh(sleeveGeoR, fabricMat);

      group.add(garmentMesh, sleeveMeshL, sleeveMeshR);
    } else {
      // Bottoms / Pants
      const pantsGeoL = new THREE.CylinderGeometry(0.09, 0.07, 0.86 * scaleHeight, 16);
      const pantsMeshL = new THREE.Mesh(pantsGeoL, fabricMat);
      pantsMeshL.position.set(-hipWidthMeter * 0.6, 0.42 * scaleHeight, 0);

      const pantsMeshR = pantsMeshL.clone();
      pantsMeshR.position.x = hipWidthMeter * 0.6;
      group.add(pantsMeshL, pantsMeshR);
    }
  };

  useEffect(() => {
    if (mannequinGroupRef.current) {
      rebuildMannequin(mannequinGroupRef.current, metrics, garmentColor, garmentType);
    }
  }, [metrics, garmentColor, garmentType]);

  // Preset Angle Switches
  const setPresetAngle = (angle: "front" | "right" | "back" | "left" | "tilt") => {
    if (!cameraRef.current || !controlsRef.current) return;
    setActiveAngle(angle);
    setIsAutoRotate(false);

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (angle) {
      case "front":
        camera.position.set(0, 1.2, 3.2);
        break;
      case "right":
        camera.position.set(3.2, 1.2, 0);
        break;
      case "back":
        camera.position.set(0, 1.2, -3.2);
        break;
      case "left":
        camera.position.set(-3.2, 1.2, 0);
        break;
      case "tilt":
        camera.position.set(1.8, 2.4, 2.2);
        break;
    }
    controls.target.set(0, 1.1, 0);
    controls.update();
  };

  // ─── 3. Multi-Angle 4-Cutout Snapshot Downloader ─────────────────────────
  const capture4Angles = async () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;
    setIsExporting(true);

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const angles: { name: string; pos: [number, number, number] }[] = [
      { name: "Front", pos: [0, 1.2, 3.2] },
      { name: "Right", pos: [3.2, 1.2, 0] },
      { name: "Back", pos: [0, 1.2, -3.2] },
      { name: "Left", pos: [-3.2, 1.2, 0] },
    ];

    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = 1200;
    compositeCanvas.height = 360;
    const ctx = compositeCanvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#090D16";
    ctx.fillRect(0, 0, 1200, 360);

    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      camera.position.set(...a.pos);
      controls.target.set(0, 1.1, 0);
      controls.update();
      renderer.render(scene, camera);

      // Draw cutout to composite grid (300x360 per angle)
      ctx.drawImage(renderer.domElement, i * 300, 0, 300, 360);

      // Add Label
      ctx.fillStyle = "#F2C230";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(`${a.name.toUpperCase()} 90°`, i * 300 + 15, 340);
    }

    // Title overlay
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(`FITVISION 3D FIT STUDIO • ${garmentName.toUpperCase()}`, 15, 28);

    const dataUrl = compositeCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `FitStudio_4Angles_${garmentName.toLowerCase().replace(/\s+/g, "-")}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    setIsExporting(false);
  };

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full min-h-[480px] bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-slate-800"
    >
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Controls & Telemetry */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            3D Studio Mannequin
          </span>
          <span className="text-xs text-amber-400 font-bold border-l border-slate-700 pl-2">
            {metrics.shoulderCm}cm Shoulder
          </span>
        </div>

        {/* Preset Angle Selector */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-slate-800 shadow-md">
          {(["front", "right", "back", "left", "tilt"] as const).map((ang) => (
            <button
              key={ang}
              onClick={() => setPresetAngle(ang)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                activeAngle === ang
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {ang}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold backdrop-blur-md border transition-all ${
            isAutoRotate
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
              : "bg-slate-900/80 text-slate-300 border-slate-700"
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isAutoRotate ? "animate-spin" : ""}`} />
          <span>{isAutoRotate ? "360° Rotating" : "Paused Orbit"}</span>
        </button>

        <button
          onClick={capture4Angles}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          <Camera className="w-4 h-4" />
          <span>{isExporting ? "Exporting..." : "📸 Capture 4 Angles"}</span>
        </button>
      </div>
    </div>
  );
}
