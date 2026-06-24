"use client";

/* The R3F cert badge — lazy, client-only (loaded by BadgeLazy via dynamic
   ssr:false). A procedural RoundedBox body with a canvas-drawn face decal (no
   artwork asset needed), spun with PresentationControls. One directional +
   ambient light (no Environment/Stage — those pull HDRIs and bloat the chunk).
   frameloop="demand" keeps the GPU idle when nothing's moving; dpr is capped so
   hi-DPI screens don't render 4x pixels. */

import { Canvas } from "@react-three/fiber";
import { PresentationControls, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Cert } from "@/data/certs";

/* Draw the badge face onto a 2D canvas → CanvasTexture. Mirrors the CSS
   fallback's look (ribbon, name, issuer, year) so the upgrade is seamless. */
function makeFaceTexture(cert: Cert): THREE.CanvasTexture {
  const W = 512;
  const H = 683; // 3:4
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const accent = cert.accent ?? "#c9a23a";

  // surface gradient
  const g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H);
  g.addColorStop(0, accent + "3a");
  g.addColorStop(0.5, "#fbf6ea");
  g.addColorStop(1, "#fbf6ea");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // ribbon medallion
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.3, 52, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = accent + "40";
  ctx.stroke();

  ctx.textAlign = "center";
  // name (wrap to 2 lines max)
  ctx.fillStyle = "#463f33";
  ctx.font = "600 40px ui-sans-serif, system-ui, sans-serif";
  const words = cert.name.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W - 80 && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((ln, i) => ctx.fillText(ln, W / 2, H * 0.5 + i * 48));

  // issuer
  ctx.fillStyle = "#726552";
  ctx.font = "26px ui-monospace, Menlo, monospace";
  ctx.fillText(cert.issuer, W / 2, H * 0.5 + lines.length * 48 + 28);

  // year pill
  if (cert.year) {
    ctx.fillStyle = "#463f33";
    ctx.font = "24px ui-monospace, Menlo, monospace";
    ctx.fillText(cert.year, W / 2, H * 0.78);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Badge({ cert }: { cert: Cert }) {
  const texture = useMemo(() => makeFaceTexture(cert), [cert]);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <PresentationControls
      global
      snap
      speed={1.4}
      damping={0.3}
      polar={[-0.35, 0.35]}
      azimuth={[-0.9, 0.9]}
    >
      <RoundedBox args={[3, 4, 0.28]} radius={0.16} smoothness={4}>
        <meshStandardMaterial color={cert.accent ?? "#c9a23a"} roughness={0.5} metalness={0.15} />
      </RoundedBox>
      {/* Flat textured plane just proud of the front face — predictable, crisp,
          unlit text (Decal projection came out mirrored/flipped). */}
      <mesh position={[0, 0, 0.151]}>
        <planeGeometry args={[2.74, 3.74]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </PresentationControls>
  );
}

export default function BadgeScene({ cert, onReady }: { cert: Cert; onReady?: () => void }) {
  return (
    <Canvas
      className="badge-canvas"
      style={{ position: "absolute", inset: 0 }}
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={() => onReady?.()}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 6]} intensity={1.3} />
      <Badge cert={cert} />
    </Canvas>
  );
}
