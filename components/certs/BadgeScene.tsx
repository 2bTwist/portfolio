"use client";

/* The R3F cert badge — lazy, client-only (loaded by BadgeLazy via dynamic
   ssr:false). A procedural RoundedBox body with the shared SVG face rasterized
   to a CanvasTexture on a flat plane just proud of the front face. One
   directional + ambient light (no Environment/Stage — those pull HDRIs and
   bloat the chunk). frameloop="demand" keeps the GPU idle when nothing's
   moving; dpr is capped so hi-DPI screens don't render 4x pixels. */

import { Canvas, invalidate } from "@react-three/fiber";
import { PresentationControls, RoundedBox } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import type { Cert } from "@/data/certs";

function Badge({ cert, faceSvg, onReady }: { cert: Cert; faceSvg: string; onReady?: () => void }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let disposed = false;
    let tex: THREE.CanvasTexture | null = null;
    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      const c = document.createElement("canvas");
      c.width = 600;
      c.height = 800;
      c.getContext("2d")!.drawImage(img, 0, 0, 600, 800);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      setTexture(tex);
      onReady?.();
      invalidate(); // demand frameloop: render the textured face
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(faceSvg);
    return () => {
      disposed = true;
      tex?.dispose();
    };
  }, [faceSvg, onReady]);

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
      {texture ? (
        <mesh position={[0, 0, 0.151]}>
          <planeGeometry args={[2.82, 3.82]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      ) : null}
    </PresentationControls>
  );
}

export default function BadgeScene({
  cert,
  faceSvg,
  onReady,
}: {
  cert: Cert;
  faceSvg: string;
  onReady?: () => void;
}) {
  return (
    <Canvas
      className="badge-canvas"
      style={{ position: "absolute", inset: 0 }}
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} />
      <Badge cert={cert} faceSvg={faceSvg} onReady={onReady} />
    </Canvas>
  );
}
