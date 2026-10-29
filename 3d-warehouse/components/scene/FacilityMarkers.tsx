'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FacilityMarker } from '@/lib/markers';
import { UnifiSettingsConfig } from '@/components/ui/SettingsDrawer';
import { Camera, Wifi, Package, Truck, RefreshCw } from 'lucide-react';

interface FacilityMarkersProps {
  markers: FacilityMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (marker: FacilityMarker) => void;
  showCameraFeeds3D?: boolean;
  unifiConfig?: UnifiSettingsConfig;
}

function Camera3DPopupCard({
  marker,
  unifiConfig,
  isSelected,
  isHovered,
  staggerMs = 0,
}: {
  marker: FacilityMarker;
  unifiConfig?: UnifiSettingsConfig;
  isSelected: boolean;
  isHovered: boolean;
  staggerMs?: number;
}) {
  const [nonce, setNonce] = useState<number>(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const unifiId = marker.metadata.unifiId;
  const apiKey = unifiConfig?.apiKey;

  useEffect(() => {
    if (!unifiId || !apiKey) {
      setCurrentSrc(null);
      setIsPreloading(false);
      setHasError(false);
      return;
    }

    const targetUrl = `/api/unifi/snapshot?id=${encodeURIComponent(
      unifiId
    )}&host=${encodeURIComponent(
      unifiConfig?.baseUrl || ''
    )}&apiKey=${encodeURIComponent(apiKey)}&consoleId=${encodeURIComponent(
      marker.metadata.unifiConsoleId || ''
    )}&allowSelfSigned=${
      unifiConfig?.allowSelfSigned !== false
    }&t=${nonce}`;

    if (!currentSrc) {
      setIsPreloading(true);
    }

    const img = new Image();
    img.src = targetUrl;
    img.onload = () => {
      setCurrentSrc(targetUrl);
      setIsPreloading(false);
      setHasError(false);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    img.onerror = () => {
      setIsPreloading(false);
      if (!currentSrc) {
        setHasError(true);
      }
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [
    unifiId,
    apiKey,
    unifiConfig?.baseUrl,
    unifiConfig?.allowSelfSigned,
    marker.metadata.unifiConsoleId,
    nonce,
  ]);

  // Staggered live refresh every ~5 seconds
  useEffect(() => {
    if (!unifiId || !apiKey) return;
    const interval = setInterval(() => {
      setNonce(Date.now());
    }, 5000 + staggerMs);
    return () => clearInterval(interval);
  }, [unifiId, apiKey, staggerMs]);

  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-2xl bg-slate-950/95 text-white shadow-2xl border-2 backdrop-blur-xl overflow-hidden transition-all duration-200 ${
        isSelected
          ? 'border-[#8DDB05] ring-4 ring-[#8DDB05]/30'
          : isHovered
          ? 'border-cyan-400 ring-2 ring-cyan-400/30'
          : 'border-cyan-500/60'
      }`}
    >
      {/* Card Top Header */}
      <div className="px-2.5 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-slate-100 truncate">
            {marker.name}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPreloading && currentSrc && (
            <RefreshCw className="w-2.5 h-2.5 text-cyan-400 animate-spin" />
          )}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            LIVE
          </span>
        </div>
      </div>

      {/* Live Snapshot Viewport */}
      <div className="relative w-full h-32 bg-slate-950 flex flex-col justify-between p-2 overflow-hidden">
        {currentSrc && !hasError ? (
          <>
            <img
              src={currentSrc}
              alt={marker.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/30 pointer-events-none" />
          </>
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />
            <div className="relative z-10 my-auto text-center px-2">
              <Camera
                className={`w-5 h-5 mx-auto mb-1 ${
                  !hasError && apiKey
                    ? 'text-cyan-400 animate-pulse'
                    : 'text-slate-500'
                }`}
              />
              <div className="text-[10px] font-semibold text-slate-300 leading-tight">
                {!apiKey
                  ? 'Set UniFi API Key in Settings'
                  : !hasError
                  ? 'Loading camera feed...'
                  : 'Feed unavailable'}
              </div>
            </div>
          </>
        )}

        {/* Bottom Overlay Metadata */}
        <div className="relative z-10 mt-auto flex items-center justify-between text-[9px] font-mono text-slate-300 pointer-events-none">
          <span className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/80 text-cyan-300">
            {marker.id} • {marker.metadata.unifiModel || 'G6 Bullet'}
          </span>
          {lastUpdated && (
            <span className="bg-slate-950/80 px-1.5 py-0.5 rounded text-emerald-400">
              {lastUpdated}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PulseRing({ color }: { color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const s1 = 1 + ((t * 1.1) % 1.8);
      ringRef.current.scale.set(s1, s1, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.75 - ((t * 1.1) % 1.8) * 0.42);
    }
    if (ring2Ref.current) {
      const s2 = 1 + (((t * 1.1 + 0.9) % 1.8));
      ring2Ref.current.scale.set(s2, s2, 1);
      const mat2 = ring2Ref.current.material as THREE.MeshBasicMaterial;
      mat2.opacity = Math.max(0, 0.75 - (((t * 1.1 + 0.9) % 1.8)) * 0.42);
    }
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringRef}>
        <ringGeometry args={[0.22, 0.3, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Clean low-poly Cardboard Pallet Stack matching WareTrack reference image */
function PalletStackMesh({ isSelected }: { isSelected: boolean }) {
  return (
    <group>
      {/* Wooden Pallet Base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.12, 1.15]} />
        <meshStandardMaterial color="#b4834e" roughness={0.85} />
        <Edges threshold={15} color="#8c6239" />
      </mesh>
      {/* Layer 1 Boxes */}
      <mesh position={[-0.25, 0.32, -0.25]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <meshStandardMaterial color="#d9a773" roughness={0.75} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      <mesh position={[0.26, 0.32, -0.25]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.4, 0.5]} />
        <meshStandardMaterial color="#e2b485" roughness={0.75} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      <mesh position={[-0.25, 0.32, 0.26]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.4, 0.48]} />
        <meshStandardMaterial color="#cfa06e" roughness={0.75} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      <mesh position={[0.26, 0.32, 0.26]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.4, 0.48]} />
        <meshStandardMaterial color="#d9a773" roughness={0.75} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      {/* Layer 2 Boxes */}
      <mesh position={[-0.22, 0.68, -0.18]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.32, 0.52]} />
        <meshStandardMaterial color="#e6ba8c" roughness={0.75} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      <mesh position={[0.25, 0.66, 0.12]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.28, 0.58]} />
        <meshStandardMaterial color="#d4a26f" roughness={0.75} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[1.3, 0.95, 1.3]} />
          <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

/** Clean low-poly Shelving Rack matching WareTrack reference image */
function StorageRackMesh({ isSelected }: { isSelected: boolean }) {
  return (
    <group>
      {/* 4 Uprights */}
      {[
        [-0.7, -0.45],
        [0.7, -0.45],
        [-0.7, 0.45],
        [0.7, 0.45],
      ].map(([x, z], idx) => (
        <mesh key={idx} position={[x, 0.9, z]} castShadow>
          <boxGeometry args={[0.07, 1.8, 0.07]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.4} />
        </mesh>
      ))}
      {/* 3 Horizontal Shelf Levels */}
      {[0.2, 0.85, 1.5].map((y, idx) => (
        <mesh key={idx} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.48, 0.05, 0.96]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.5} />
        </mesh>
      ))}
      {/* Cartons / Totes on Shelves */}
      <mesh position={[-0.35, 0.42, 0]} castShadow>
        <boxGeometry args={[0.5, 0.36, 0.7]} />
        <meshStandardMaterial color="#2563eb" roughness={0.5} />
        <Edges threshold={15} color="#1d4ed8" />
      </mesh>
      <mesh position={[0.35, 0.42, 0]} castShadow>
        <boxGeometry args={[0.5, 0.36, 0.7]} />
        <meshStandardMaterial color="#d9a773" roughness={0.7} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      <mesh position={[-0.3, 1.07, 0]} castShadow>
        <boxGeometry args={[0.55, 0.36, 0.72]} />
        <meshStandardMaterial color="#e2b485" roughness={0.7} />
        <Edges threshold={15} color="#b58350" />
      </mesh>
      <mesh position={[0.35, 1.05, 0]} castShadow>
        <boxGeometry args={[0.48, 0.32, 0.68]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.5} />
        <Edges threshold={15} color="#1d4ed8" />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[1.62, 1.9, 1.1]} />
          <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
}

/** Clean low-poly Forklift matching WareTrack reference image */
function ForkliftMesh({ isSelected }: { isSelected: boolean }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.48, 1.25]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.45} />
        <Edges threshold={15} color="#d97706" />
      </mesh>
      {/* Cab Roll Cage */}
      <mesh position={[0, 0.78, -0.1]} castShadow>
        <boxGeometry args={[0.76, 0.55, 0.75]} />
        <meshStandardMaterial color="#1e293b" wireframe />
      </mesh>
      {/* Cab Roof */}
      <mesh position={[0, 1.06, -0.1]} castShadow>
        <boxGeometry args={[0.78, 0.05, 0.78]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      {/* Mast */}
      <mesh position={[0, 0.68, 0.68]} castShadow>
        <boxGeometry args={[0.55, 1.2, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Forks */}
      <mesh position={[-0.2, 0.1, 1.05]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.75]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      <mesh position={[0.2, 0.1, 1.05]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.75]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>
      {isSelected && (
        <mesh position={[0, 0.6, 0.2]}>
          <boxGeometry args={[1.1, 1.25, 1.9]} />
          <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Detailed 3D Ubiquiti UniFi G6 Bullet Camera Model
 * Features the circular wall-mount base, articulated ball-joint neck, matte-white cylindrical
 * aluminum housing, recessed black IR sensor bezel, sapphire optical lens, and signature UniFi cyan LED ring.
 */
function UniFiG6BulletCamera3D({
  isSelected,
  isHovered,
}: {
  isSelected: boolean;
  isHovered: boolean;
}) {
  const bodyWhite = isSelected
    ? '#e0f2fe'
    : isHovered
    ? '#ffffff'
    : '#f8fafc';

  return (
    <group>
      {/* Wall / Corner Mounting Plate Disc */}
      <mesh position={[0, 0.08, -0.14]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.03, 24]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.3} />
      </mesh>

      {/* Articulating Arm Collar & Ball-Joint Stem */}
      <mesh position={[0, 0.06, -0.08]} rotation={[Math.PI / 2.3, 0, 0]} castShadow>
        <cylinderGeometry args={[0.042, 0.052, 0.14, 20]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.03, -0.02]}>
        <sphereGeometry args={[0.048, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Tilted G6 Bullet Camera Barrel Assembly (Aimed slightly downward into the shop) */}
      <group position={[0, 0, 0.06]} rotation={[0.32, 0, 0]}>
        {/* Rear Tapered Housing Cap */}
        <mesh position={[0, 0, -0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.082, 0.064, 0.07, 28]} />
          <meshStandardMaterial color={bodyWhite} roughness={0.28} metalness={0.15} />
        </mesh>

        {/* Main Cylindrical Matte-White Aluminum G6 Bullet Body */}
        <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.086, 0.082, 0.18, 28]} />
          <meshStandardMaterial color={bodyWhite} roughness={0.25} metalness={0.15} />
        </mesh>

        {/* Upper Integrated Sunshield Lip Hood */}
        <mesh position={[0, 0.018, 0.11]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry
            args={[0.089, 0.089, 0.05, 28, 1, false, -Math.PI * 0.6, Math.PI * 1.2]}
          />
          <meshStandardMaterial
            color={bodyWhite}
            roughness={0.25}
            metalness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Front Recessed Glossy Black IR Array & Sensor Faceplate */}
        <mesh position={[0, 0, 0.112]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.078, 0.078, 0.012, 28]} />
          <meshStandardMaterial color="#090d16" roughness={0.15} metalness={0.6} />
        </mesh>

        {/* Signature Ubiquiti Glowing Cyan / Blue Status Ring */}
        <mesh position={[0, 0, 0.119]}>
          <ringGeometry args={[0.056, 0.066, 32]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#22d3ee"
            emissiveIntensity={isSelected || isHovered ? 2.4 : 1.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Center Optical Glass Camera Lens Dome */}
        <mesh position={[0, 0, 0.116]}>
          <sphereGeometry args={[0.034, 20, 20]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.05}
            metalness={0.9}
          />
        </mesh>

        {/* Subtle FOV Frustum Cone projecting forward from the G6 Bullet lens */}
        <mesh position={[0, 0, 0.56]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.38, 0.85, 4]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={isSelected || isHovered ? 0.28 : 0.11}
          />
        </mesh>
      </group>
    </group>
  );
}

export function FacilityMarkers({
  markers,
  selectedMarkerId,
  onSelectMarker,
  showCameraFeeds3D,
  unifiConfig,
}: FacilityMarkersProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleMarkerClick = (e: ThreeEvent<MouseEvent>, marker: FacilityMarker) => {
    e.stopPropagation();
    onSelectMarker(marker);
  };

  return (
    <group>
      {markers.map((marker, idx) => {
        const isSelected = selectedMarkerId === marker.id;
        const isHovered = hoveredId === marker.id;
        const variant = marker.modelVariant || 'pin';
        const show3DFeed = marker.type === 'camera' && Boolean(showCameraFeeds3D);

        // Pin color palette per specification + WareTrack royal blue pin accent
        const colorMap = {
          camera: '#06b6d4', // Cyan glowing pin
          network_ap: '#10b981', // Emerald green glowing pin
          inventory_bin: '#f59e0b', // Amber/Orange beacon or WareTrack pin
        };
        const accentColor = colorMap[marker.type];

        // Height offset for HTML floating badge
        const badgeHeight =
          variant === 'rack'
            ? 2.15
            : variant === 'forklift'
            ? 1.55
            : variant === 'pallet_stack'
            ? 1.25
            : 0.7;

        return (
          <group
            key={marker.id}
            position={marker.position}
            rotation={marker.rotation || [0, 0, 0]}
            scale={marker.scale || [1, 1, 1]}
            onClick={(e) => handleMarkerClick(e, marker)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(marker.id);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = 'auto';
            }}
          >
            {/* Render 3D Geometry according to MarkerType & ModelVariant */}
            {marker.type === 'camera' && (
              <UniFiG6BulletCamera3D
                isSelected={isSelected}
                isHovered={isHovered}
              />
            )}

            {marker.type === 'network_ap' && (
              <group>
                {/* Glowing Emerald AP Disc */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.24, 0.24, 0.09, 28]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive="#059669"
                    emissiveIntensity={isSelected || isHovered ? 1.5 : 0.85}
                    roughness={0.25}
                  />
                </mesh>
                {/* Animated Radiating Pulse Rings */}
                <PulseRing color="#10b981" />
              </group>
            )}

            {marker.type === 'inventory_bin' && (
              <group>
                {variant === 'pallet_stack' ? (
                  <PalletStackMesh isSelected={isSelected} />
                ) : variant === 'rack' ? (
                  <StorageRackMesh isSelected={isSelected} />
                ) : variant === 'forklift' ? (
                  <ForkliftMesh isSelected={isSelected} />
                ) : (
                  /* Amber/Orange Bounding Box + Floating Beacon */
                  <group>
                    <mesh position={[0, 0.35, 0]} castShadow>
                      <boxGeometry args={[0.85, 0.7, 0.85]} />
                      <meshStandardMaterial
                        color="#f59e0b"
                        emissive="#d97706"
                        emissiveIntensity={isSelected ? 0.6 : 0.25}
                        transparent
                        opacity={0.75}
                        roughness={0.3}
                      />
                      <Edges threshold={15} color="#fbbf24" />
                    </mesh>
                  </group>
                )}
              </group>
            )}

            {/* Always-crisp floating pin / hover label (WareTrack teardrop & pill aesthetic) */}
            <Html
              key={`marker-html-${marker.id}`}
              position={[0, badgeHeight, 0]}
              center
              distanceFactor={15}
              zIndexRange={[20, 0]}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMarker(marker);
                }}
                className={`group relative flex flex-col items-center select-none cursor-pointer transition-transform duration-200 ${
                  isSelected || isHovered ? 'scale-110 z-30' : 'scale-100'
                }`}
              >
                {/* 3D Live Camera Feed Popup above the camera pin (View Mode toggle) */}
                {show3DFeed && (
                  <Camera3DPopupCard
                    marker={marker}
                    unifiConfig={unifiConfig}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    staggerMs={idx * 750}
                  />
                )}

                {/* Hover or Selected Detail Pill (hidden when 3D Camera Feed is already shown) */}
                {!show3DFeed && (isHovered || isSelected) && (
                  <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 text-white shadow-xl border border-white/15 backdrop-blur-md whitespace-nowrap flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold leading-tight">
                        {marker.name}
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        {marker.type === 'inventory_bin' &&
                        marker.metadata.qty !== undefined
                          ? `${marker.metadata.qty.toLocaleString()} units • ${
                              marker.metadata.sku || marker.id
                            }`
                          : marker.metadata.ip || marker.id}
                      </div>
                    </div>
                  </div>
                )}

                {/* WareTrack-style Pin Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                    isSelected
                      ? 'bg-[#8DDB05] border-white text-slate-950 ring-4 ring-[#8DDB05]/40'
                      : marker.type === 'camera'
                      ? 'bg-cyan-500 border-white text-white'
                      : marker.type === 'network_ap'
                      ? 'bg-emerald-500 border-white text-white'
                      : 'bg-[#8DDB05] border-white text-slate-950'
                  }`}
                >
                  {marker.type === 'camera' ? (
                    <Camera className="w-4 h-4" />
                  ) : marker.type === 'network_ap' ? (
                    <Wifi className="w-4 h-4" />
                  ) : variant === 'forklift' ? (
                    <Truck className="w-4 h-4" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                </div>
                {/* Pin stem triangle */}
                <div
                  className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] -mt-0.5 ${
                    isSelected
                      ? 'border-t-[#8DDB05]'
                      : marker.type === 'camera'
                      ? 'border-t-cyan-500'
                      : marker.type === 'network_ap'
                      ? 'border-t-emerald-500'
                      : 'border-t-[#8DDB05]'
                  }`}
                />
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
