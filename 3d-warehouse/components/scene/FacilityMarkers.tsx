'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Edges, Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { FacilityMarker } from '@/lib/markers';
import { UnifiSettingsConfig } from '@/components/ui/SettingsDrawer';
import {
  Camera,
  Wifi,
  Package,
  Truck,
  RefreshCw,
  Router,
  Network,
  BatteryCharging,
  Cpu,
  Radio,
  HardDrive,
  Activity,
  ArrowDownUp,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Tablet,
  Laptop,
  Scan,
} from 'lucide-react';

interface FacilityMarkersProps {
  markers: FacilityMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (marker: FacilityMarker) => void;
  showCameraFeeds3D?: boolean;
  unifiConfig?: UnifiSettingsConfig;
  appMode?: 'view' | 'edit';
  onUpdateMarker?: (updated: FacilityMarker) => void;
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

function NetworkDevice3DPopupCard({
  marker,
  isSelected,
  isHovered,
}: {
  marker: FacilityMarker;
  isSelected: boolean;
  isHovered: boolean;
}) {
  const stats = marker.metadata.networkStats;
  const isAp = marker.type === 'network_ap';
  const isSwitch = marker.type === 'network_switch';
  const isGateway = marker.type === 'network_gateway';
  const isUps = marker.type === 'network_ups';
  const isCloudKey = marker.type === 'network_cloudkey';
  const isSuperLink = marker.type === 'network_superlink';
  const isNas = marker.type === 'network_nas';

  const clientCount = marker.metadata.connectedClients ?? stats?.clients?.length ?? 0;
  const rx = stats?.throughputRxMbps ?? 0;
  const tx = stats?.throughputTxMbps ?? 0;

  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-2xl bg-slate-950/95 text-white shadow-2xl border-2 backdrop-blur-xl overflow-hidden transition-all duration-200 pointer-events-auto select-none ${
        isSelected
          ? 'border-[#8DDB05] ring-4 ring-[#8DDB05]/30'
          : isHovered
          ? 'border-emerald-400 ring-2 ring-emerald-400/30'
          : 'border-emerald-500/60'
      }`}
    >
      {/* Top Header */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold text-slate-100 truncate">
            {marker.name}
          </span>
        </div>
        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0">
          {marker.metadata.unifiModel || marker.type.replace('network_', '').toUpperCase()}
        </span>
      </div>

      {/* Body Stats */}
      <div className="p-2.5 space-y-2 text-xs">
        {/* Throughput Bar */}
        {(rx > 0 || tx > 0 || isAp || isSwitch || isGateway) && (
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
              <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Throughput</span>
            </div>
            <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
              <span className="text-emerald-400">↓ {rx} <span className="text-[9px] font-normal text-slate-400">Mbps</span></span>
              <span className="text-cyan-400">↑ {tx} <span className="text-[9px] font-normal text-slate-400">Mbps</span></span>
            </div>
          </div>
        )}

        {/* AP Clients / Link */}
        {isAp && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[9px] text-slate-400">Active Clients</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{clientCount} Connected</div>
            </div>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
              <div className="text-[9px] text-slate-400">Link Speed</div>
              <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5 truncate">{marker.metadata.linkSpeed || '2.5 Gbps'}</div>
            </div>
          </div>
        )}

        {/* Switch PoE / Ports */}
        {isSwitch && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-[9px] text-slate-400">PoE Power</div>
              <div className="text-xs font-bold text-blue-400 font-mono mt-0.5">{stats?.poeTotalWatts ?? 54.2}W / {stats?.poeBudgetWatts ?? 180}W</div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[9px] text-slate-400">Active Ports</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{stats?.ports?.filter(p => p.up).length ?? 11} / 16 Ports</div>
            </div>
          </div>
        )}

        {/* Gateway WAN */}
        {isGateway && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[9px] text-slate-400">WAN State</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">● Online (8.4ms)</div>
            </div>
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
              <div className="text-[9px] text-slate-400">Protection</div>
              <div className="text-xs font-bold text-purple-400 font-mono mt-0.5">DPI Active</div>
            </div>
          </div>
        )}

        {/* UPS Battery */}
        {isUps && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[9px] text-slate-400">Battery Level</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">{stats?.batteryPct ?? 100}% (185m)</div>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-[9px] text-slate-400">Load Output</div>
              <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">{stats?.batteryLoadWatts ?? 142} Watts</div>
            </div>
          </div>
        )}

        {/* CloudKey Apps */}
        {isCloudKey && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-center">
              <div className="text-[9px] text-slate-400">UniFi Apps</div>
              <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">2 Running</div>
            </div>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-[9px] text-slate-400">Protect Storage</div>
              <div className="text-xs font-bold text-blue-400 font-mono mt-0.5">1.3 / 2.0 TB</div>
            </div>
          </div>
        )}

        {/* SuperLink RF */}
        {isSuperLink && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-center">
              <div className="text-[9px] text-slate-400">Sub-GHz RF</div>
              <div className="text-xs font-bold text-pink-400 font-mono mt-0.5">915 MHz</div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[9px] text-slate-400">Protect Nodes</div>
              <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">12 Paired</div>
            </div>
          </div>
        )}

        {/* Synology NAS */}
        {isNas && (
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10.5px] text-slate-300 font-semibold">Synology DiskStation DS923+</div>
            <div className="text-[9px] text-slate-400 mt-0.5">4-Bay RAID-5 Storage • Telemetry Pending</div>
          </div>
        )}

        {/* Footer info & CTA */}
        <div className="pt-1 flex items-center justify-between text-[9.5px] font-mono text-slate-400 border-t border-slate-800/80">
          <span>{marker.metadata.ip || '10.24.20.x'}</span>
          <span className="text-[#8DDB05] font-semibold flex items-center gap-0.5">
            Tap for telemetry →
          </span>
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

/** Authentic procedural 3D model of UniFi U7 Pro / U7 Pro XG Access Point */
function UniFiApMesh3D({ isSelected, isHovered, isXg }: { isSelected: boolean; isHovered: boolean; isXg?: boolean }) {
  const ledColor = isXg ? '#38bdf8' : '#22d3ee';
  return (
    <group rotation={[-Math.PI, 0, 0]}>
      {/* Upper Mounting Bracket Ring */}
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.015, 32]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Main Curved Matte-White Dome Disc */}
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.235, 0.032, 36]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.005, 0]}>
        <sphereGeometry args={[0.225, 36, 16, 0, Math.PI * 2, 0, Math.PI * 0.25]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>

      {/* Signature Circular Glowing UniFi Status Ring */}
      <mesh position={[0, -0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.075, 0.085, 40]} />
        <meshStandardMaterial
          color={ledColor}
          emissive={ledColor}
          emissiveIntensity={isSelected || isHovered ? 2.5 : 1.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center Metallic UniFi Logo Medallion */}
      <mesh position={[0, -0.022, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.004, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Pulsing RF Wave Rings */}
      <group position={[0, -0.025, 0]}>
        <PulseRing color={isSelected ? '#8DDB05' : ledColor} />
      </group>
    </group>
  );
}

/** Procedural 3D model of UniFi Switch 16 Port PoE (USW-16-PoE) */
function UniFiSwitch16Mesh3D({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      {/* 1U Rack Chassis */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.044, 0.22]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.35} metalness={0.65} />
        <Edges threshold={20} color="#64748b" />
      </mesh>

      {/* Front Brushed Aluminum Faceplate */}
      <mesh position={[0, 0, 0.111]}>
        <boxGeometry args={[0.436, 0.04, 0.004]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.5} />
      </mesh>

      {/* 1.3" Touchscreen LCM Status Display on Left */}
      <mesh position={[-0.17, 0, 0.114]}>
        <boxGeometry args={[0.045, 0.028, 0.003]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#0ea5e9"
          emissiveIntensity={isSelected || isHovered ? 1.8 : 1.1}
          roughness={0.15}
        />
      </mesh>

      {/* 16 RJ45 Ports in 2 Rows of 8 in Center */}
      {Array.from({ length: 8 }).map((_, col) => {
        const posX = -0.09 + col * 0.022;
        return (
          <group key={col} position={[posX, 0, 0.113]}>
            {/* Top Port */}
            <mesh position={[0, 0.007, 0]}>
              <boxGeometry args={[0.016, 0.011, 0.004]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Top Port LED */}
            <mesh position={[0, 0.015, 0.002]}>
              <boxGeometry args={[0.004, 0.0025, 0.001]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
            {/* Bottom Port */}
            <mesh position={[0, -0.007, 0]}>
              <boxGeometry args={[0.016, 0.011, 0.004]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Bottom Port LED */}
            <mesh position={[0, -0.015, 0.002]}>
              <boxGeometry args={[0.004, 0.0025, 0.001]} />
              <meshBasicMaterial color={col < 3 ? '#10b981' : '#f59e0b'} />
            </mesh>
          </group>
        );
      })}

      {/* Dual SFP Optical Ports on Right */}
      <mesh position={[0.13, 0, 0.113]}>
        <boxGeometry args={[0.034, 0.02, 0.005]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.13, 0.012, 0.015]}>
        <boxGeometry args={[0.006, 0.003, 0.001]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}

/** Procedural 3D model of UniFi Gateway Max (UXG-Max) */
function UniFiGatewayMaxMesh3D({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      {/* Compact Silver Desktop/Rack Case */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.03, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.5} />
        <Edges threshold={20} color="#94a3b8" />
      </mesh>
      {/* Front Glowing Cyan Status Bar */}
      <mesh position={[0, -0.01, 0.071]}>
        <boxGeometry args={[0.05, 0.004, 0.002]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#22d3ee"
          emissiveIntensity={isSelected || isHovered ? 2.2 : 1.4}
        />
      </mesh>
      {/* Front Multi-Gig Ethernet Ports */}
      {[-0.04, -0.015, 0.015, 0.04].map((x, i) => (
        <mesh key={i} position={[x, 0.003, 0.071]}>
          <boxGeometry args={[0.016, 0.012, 0.002]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Procedural 3D model of UniFi UPS Tower (SmartPower UPS Tower) */
function UniFiUpsTowerMesh3D({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      {/* Vertical Tower Chassis */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.32, 0.22]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
        <Edges threshold={20} color="#94a3b8" />
      </mesh>
      {/* Front Dark Bezel / Status Panel */}
      <mesh position={[0, 0.16, 0.111]}>
        <boxGeometry args={[0.09, 0.28, 0.004]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.4} />
      </mesh>
      {/* Multi-segment Battery Level Gauge */}
      {Array.from({ length: 6 }).map((_, idx) => (
        <mesh key={idx} position={[0, 0.23 - idx * 0.016, 0.114]}>
          <boxGeometry args={[0.038, 0.008, 0.002]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#34d399"
            emissiveIntensity={isSelected || isHovered ? 2.0 : 1.2}
          />
        </mesh>
      ))}
      {/* AC Power Line Status LED */}
      <mesh position={[0, 0.11, 0.114]}>
        <cylinderGeometry args={[0.008, 0.008, 0.003, 16]} />
        <meshStandardMaterial color="#06b6d4" emissive="#22d3ee" emissiveIntensity={1.8} />
      </mesh>
    </group>
  );
}

/** Procedural 3D model of UniFi CloudKey+ Gen2 */
function UniFiCloudKeyMesh3D({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      {/* Anodized Aluminum Enclosure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.13, 0.027, 0.1]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.65} />
        <Edges threshold={20} color="#94a3b8" />
      </mesh>
      {/* Front Mini OLED Screen */}
      <mesh position={[0, 0, 0.051]}>
        <boxGeometry args={[0.065, 0.016, 0.002]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#38bdf8"
          emissiveIntensity={isSelected || isHovered ? 2.0 : 1.3}
          roughness={0.1}
        />
      </mesh>
      {/* HDD Drive Activity Light */}
      <mesh position={[-0.045, 0, 0.051]}>
        <sphereGeometry args={[0.0025, 12, 12]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
}

/** Procedural 3D model of UniFi SuperLink Bridge */
function UniFiSuperLinkMesh3D({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      {/* Base Casing */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.09, 0.035]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.15} />
        <Edges threshold={20} color="#cbd5e1" />
      </mesh>
      {/* External Sub-GHz Vertical Antenna */}
      <mesh position={[0.03, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.004, 0.006, 0.14, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Front RF Status LEDs */}
      {[-0.015, 0, 0.015].map((x, i) => (
        <mesh key={i} position={[x, -0.02, 0.018]}>
          <cylinderGeometry args={[0.003, 0.003, 0.002, 12]} />
          <meshBasicMaterial color={i === 2 ? '#ec4899' : '#10b981'} />
        </mesh>
      ))}
    </group>
  );
}

/** Procedural 3D model of Synology DiskStation 4-Bay NAS (DS923+) */
function SynologyNasMesh3D({ isSelected, isHovered }: { isSelected: boolean; isHovered: boolean }) {
  return (
    <group>
      {/* Main NAS Tower Enclosure */}
      <mesh position={[0, 0.085, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.17, 0.23]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
        <Edges threshold={20} color="#0f172a" />
      </mesh>
      {/* 4 Drive Caddies on Front Face */}
      {[-0.06, -0.02, 0.02, 0.06].map((x, idx) => (
        <group key={idx} position={[x, 0.08, 0.116]}>
          {/* Drive Sled Face */}
          <mesh>
            <boxGeometry args={[0.034, 0.13, 0.004]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Latch Handle Lever */}
          <mesh position={[0, -0.04, 0.003]}>
            <boxGeometry args={[0.026, 0.015, 0.003]} />
            <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Drive Activity LED */}
          <mesh position={[0, 0.05, 0.003]}>
            <sphereGeometry args={[0.002, 10, 10]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
        </group>
      ))}
      {/* Power Button & Status LED Strip on Right */}
      <mesh position={[0.085, 0.04, 0.117]}>
        <cylinderGeometry args={[0.005, 0.005, 0.003, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={isSelected || isHovered ? 1.8 : 1.0}
        />
      </mesh>
    </group>
  );
}

/** Open-frame IT Server Equipment Rack Frame */
function ServerRackCabinetMesh3D() {
  return (
    <group position={[0, -0.4, 0]}>
      {/* 4 Vertical Steel Extrusion Posts */}
      {[
        [-0.26, -0.15],
        [0.26, -0.15],
        [-0.26, 0.15],
        [0.26, 0.15],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.45, z]} castShadow>
          <boxGeometry args={[0.025, 0.95, 0.025]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
        </mesh>
      ))}
      {/* Top and Bottom Horizontal Braces */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.55, 0.025, 0.33]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <boxGeometry args={[0.55, 0.025, 0.33]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  );
}

interface FacilityMarkerItemProps {
  marker: FacilityMarker;
  isSelected: boolean;
  appMode: 'view' | 'edit';
  showCameraFeeds3D?: boolean;
  unifiConfig?: UnifiSettingsConfig;
  onSelectMarker: (marker: FacilityMarker) => void;
  onUpdateMarker?: (updated: FacilityMarker) => void;
  idx: number;
}

function FacilityMarkerItem({
  marker,
  isSelected,
  appMode,
  showCameraFeeds3D,
  unifiConfig,
  onSelectMarker,
  onUpdateMarker,
  idx,
}: FacilityMarkerItemProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const [isHovered, setIsHovered] = useState(false);

  const variant = marker.modelVariant || 'pin';
  const show3DFeed = appMode === 'view' && marker.type === 'camera' && Boolean(showCameraFeeds3D);

  const colorMap: Record<string, string> = {
    camera: '#06b6d4',
    network_ap: '#10b981',
    network_switch: '#3b82f6',
    network_gateway: '#8b5cf6',
    network_ups: '#f59e0b',
    network_cloudkey: '#06b6d4',
    network_superlink: '#ec4899',
    network_nas: '#64748b',
    inventory_bin: '#f59e0b',
  };
  const accentColor = colorMap[marker.type] || '#10b981';

  const badgeHeight =
    variant === 'rack'
      ? 2.15
      : variant === 'forklift'
      ? 1.55
      : variant === 'pallet_stack'
      ? 1.25
      : marker.type === 'network_ups'
      ? 0.55
      : marker.type === 'network_ap'
      ? 0.45
      : 0.7;

  const isNetworkDevice = marker.type.startsWith('network_');

  return (
    <>
      <group
        ref={groupRef}
        position={marker.position}
        rotation={marker.rotation || [0, 0, 0]}
        scale={marker.scale || [1, 1, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectMarker(marker);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setIsHovered(false);
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
            <mesh castShadow>
              <cylinderGeometry args={[0.24, 0.24, 0.09, 28]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#059669"
                emissiveIntensity={isSelected || isHovered ? 1.5 : 0.85}
                roughness={0.25}
              />
            </mesh>
            <PulseRing color="#10b981" />
          </group>
        )}

        {marker.type === 'network_switch' && (
          <UniFiSwitch16Mesh3D
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

        {marker.type === 'network_gateway' && (
          <UniFiGatewayMaxMesh3D
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

        {marker.type === 'network_ups' && (
          <UniFiUpsTowerMesh3D
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

        {marker.type === 'network_cloudkey' && (
          <UniFiCloudKeyMesh3D
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

        {marker.type === 'network_superlink' && (
          <UniFiSuperLinkMesh3D
            isSelected={isSelected}
            isHovered={isHovered}
          />
        )}

        {marker.type === 'network_nas' && (
          <SynologyNasMesh3D
            isSelected={isSelected}
            isHovered={isHovered}
          />
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

        {/* In Edit mode when selected: NO HTML overlay at all, so TransformControls gizmo & 3D model are 100% clean with zero DOM interference */}
        {!(appMode === 'edit' && isSelected) && (
          <Html
            position={[0, badgeHeight, 0]}
            center
            distanceFactor={15}
            zIndexRange={[20, 0]}
            style={{
              pointerEvents: 'auto',
            }}
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
              {/* View Mode Only: 3D Live Camera Feed */}
              {appMode === 'view' && show3DFeed && (
                <Camera3DPopupCard
                  marker={marker}
                  unifiConfig={unifiConfig}
                  isSelected={isSelected}
                  isHovered={isHovered}
                  staggerMs={idx * 750}
                />
              )}

              {/* View Mode Only: 3D Live Network Equipment Telemetry Popup Card */}
              {appMode === 'view' && isNetworkDevice && isSelected && (
                <NetworkDevice3DPopupCard
                  marker={marker}
                  isSelected={isSelected}
                  isHovered={isHovered}
                />
              )}

              {/* View Mode Only: Hover or Selected Detail Pill */}
              {appMode === 'view' && !show3DFeed && !(isNetworkDevice && isSelected) && (isHovered || isSelected) && (
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

              {/* Pin Badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 transition-all ${
                  isSelected
                    ? 'bg-[#8DDB05] border-white text-slate-950 ring-4 ring-[#8DDB05]/40'
                    : marker.type === 'camera'
                    ? 'bg-cyan-500 border-white text-white'
                    : marker.type === 'network_ap'
                    ? 'bg-emerald-500 border-white text-white'
                    : marker.type === 'network_switch'
                    ? 'bg-blue-500 border-white text-white'
                    : marker.type === 'network_gateway'
                    ? 'bg-purple-500 border-white text-white'
                    : marker.type === 'network_ups'
                    ? 'bg-amber-500 border-white text-slate-950'
                    : marker.type === 'network_cloudkey'
                    ? 'bg-cyan-600 border-white text-white'
                    : marker.type === 'network_superlink'
                    ? 'bg-pink-500 border-white text-white'
                    : marker.type === 'network_nas'
                    ? 'bg-slate-700 border-white text-white'
                    : 'bg-[#8DDB05] border-white text-slate-950'
                }`}
              >
                {marker.type === 'camera' ? (
                  <Camera className="w-4 h-4" />
                ) : marker.type === 'network_ap' ? (
                  <Wifi className="w-4 h-4" />
                ) : marker.type === 'network_switch' ? (
                  <Network className="w-4 h-4" />
                ) : marker.type === 'network_gateway' ? (
                  <Router className="w-4 h-4" />
                ) : marker.type === 'network_ups' ? (
                  <BatteryCharging className="w-4 h-4" />
                ) : marker.type === 'network_cloudkey' ? (
                  <Cpu className="w-4 h-4" />
                ) : marker.type === 'network_superlink' ? (
                  <Radio className="w-4 h-4" />
                ) : marker.type === 'network_nas' ? (
                  <HardDrive className="w-4 h-4" />
                ) : variant === 'forklift' ? (
                  <Truck className="w-4 h-4" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
              </div>
              <div
                className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] -mt-0.5 ${
                  isSelected
                    ? 'border-t-[#8DDB05]'
                    : marker.type === 'camera'
                    ? 'border-t-cyan-500'
                    : marker.type === 'network_ap'
                    ? 'border-t-emerald-500'
                    : marker.type === 'network_switch'
                    ? 'border-t-blue-500'
                    : marker.type === 'network_gateway'
                    ? 'border-t-purple-500'
                    : marker.type === 'network_ups'
                    ? 'border-t-amber-500'
                    : marker.type === 'network_cloudkey'
                    ? 'border-t-cyan-600'
                    : marker.type === 'network_superlink'
                    ? 'border-t-pink-500'
                    : marker.type === 'network_nas'
                    ? 'border-t-slate-700'
                    : 'border-t-[#8DDB05]'
                }`}
              />
            </div>
          </Html>
        )}
      </group>

      {/* 3D Translation Gizmo: ONLY in Edit Mode when selected */}
      {appMode === 'edit' && isSelected && Boolean(onUpdateMarker) && (
        <TransformControls
          object={groupRef}
          mode="translate"
          onMouseUp={() => {
            if (groupRef.current && onUpdateMarker) {
              const p = groupRef.current.position;
              onUpdateMarker({
                ...marker,
                position: [
                  Number(p.x.toFixed(3)),
                  Number(p.y.toFixed(3)),
                  Number(p.z.toFixed(3)),
                ],
              });
            }
          }}
        />
      )}
    </>
  );
}

export function FacilityMarkers({
  markers,
  selectedMarkerId,
  onSelectMarker,
  showCameraFeeds3D,
  unifiConfig,
  appMode = 'view',
  onUpdateMarker,
}: FacilityMarkersProps) {
  return (
    <group>
      {markers.map((marker, idx) => (
        <FacilityMarkerItem
          key={marker.id}
          marker={marker}
          isSelected={selectedMarkerId === marker.id}
          appMode={appMode}
          showCameraFeeds3D={showCameraFeeds3D}
          unifiConfig={unifiConfig}
          onSelectMarker={onSelectMarker}
          onUpdateMarker={onUpdateMarker}
          idx={idx}
        />
      ))}
    </group>
  );
}
