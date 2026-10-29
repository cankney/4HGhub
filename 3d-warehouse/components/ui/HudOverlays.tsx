'use client';

import React from 'react';
import {
  Camera,
  Compass,
  Hand,
  Home,
  Layers,
  Minus,
  Package,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
  Wifi,
} from 'lucide-react';
import { DisplayMode, FacilityMarker, MarkerType } from '@/lib/markers';
import { formatFeetInches } from '@/lib/units';
import { CardinalFacing, getCardinalMapping } from '@/lib/compass';

interface HudOverlaysProps {
  appMode: 'view' | 'edit';
  markers: FacilityMarker[];
  theme: 'daylight' | 'dark';
  activeFilter: MarkerType | 'all';
  onFilterChange: (filter: MarkerType | 'all') => void;
  roofCutoffY: number;
  onRoofCutoffChange: (y: number) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  panMode: boolean;
  onTogglePanMode: () => void;
  cardinalFacing?: CardinalFacing;
  onRotateOrientation?: (dir: 'cw' | 'ccw') => void;
  onCameraAction: (action: 'reset' | 'zoom_in' | 'zoom_out' | 'top_down') => void;
  onSelectMarker: (marker: FacilityMarker) => void;
  selectedMarkerId: string | null;
}

export function HudOverlays({
  appMode,
  markers,
  theme,
  activeFilter,
  onFilterChange,
  roofCutoffY,
  onRoofCutoffChange,
  displayMode,
  onDisplayModeChange,
  panMode,
  onTogglePanMode,
  cardinalFacing = 'north',
  onRotateOrientation,
  onCameraAction,
  onSelectMarker,
  selectedMarkerId,
}: HudOverlaysProps) {
  const isDark = theme === 'dark';
  const cardinalMapping = getCardinalMapping(cardinalFacing);

  const bins = markers.filter((m) => m.type === 'inventory_bin');
  const cameras = markers.filter((m) => m.type === 'camera');
  const aps = markers.filter((m) => m.type === 'network_ap');

  const totalUnits = bins.reduce((sum, b) => sum + (b.metadata.qty || 0), 0);
  const totalClients = aps.reduce(
    (sum, a) => sum + (a.metadata.connectedClients || 0),
    0
  );
  const onlineCams = cameras.filter((c) => c.metadata.status === 'online').length;

  const cardClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white/95 border-slate-200/80 text-slate-900';

  return (
    <>
      {/* Top-Left KPI Row (Matches WareTrack Screenshot) */}
      <div className="fixed top-20 left-4 z-20 pointer-events-none flex flex-wrap items-center gap-3">
        {/* Card 1: Stock on Hand */}
        <button
          onClick={() =>
            onFilterChange(
              activeFilter === 'inventory_bin' ? 'all' : 'inventory_bin'
            )
          }
          className={`pointer-events-auto text-left px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-xl transition-all cursor-pointer flex items-center gap-3.5 ${cardClass} ${
            activeFilter === 'inventory_bin' ? 'ring-2 ring-[#8DDB05]' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-[#8DDB05]/15 border border-[#8DDB05]/30 flex items-center justify-center text-[#65a30d] dark:text-[#8DDB05]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              Stock on hand
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">
                {totalUnits.toLocaleString()}
              </span>
              <span className="text-[11px] font-semibold text-[#65a30d] dark:text-[#8DDB05]">
                ↑ +18 today
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {bins.length} active zones • 4HG-01
            </div>
          </div>
        </button>

        {/* Card 2: Security Cameras */}
        <button
          onClick={() =>
            onFilterChange(activeFilter === 'camera' ? 'all' : 'camera')
          }
          className={`pointer-events-auto text-left px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-xl transition-all cursor-pointer flex items-center gap-3.5 ${cardClass} ${
            activeFilter === 'camera' ? 'ring-2 ring-cyan-500' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              Vision Feeds
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">
                {onlineCams}/{cameras.length}
              </span>
              <span className="text-[11px] font-semibold text-cyan-500">
                RTSP 4K
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              AI perimeter active • 4HG-01
            </div>
          </div>
        </button>

        {/* Card 3: Network AP Mesh */}
        <button
          onClick={() =>
            onFilterChange(activeFilter === 'network_ap' ? 'all' : 'network_ap')
          }
          className={`pointer-events-auto text-left px-4 py-3 rounded-2xl border shadow-lg backdrop-blur-xl transition-all cursor-pointer flex items-center gap-3.5 ${cardClass} ${
            activeFilter === 'network_ap' ? 'ring-2 ring-emerald-500' : ''
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500">
              Mesh Telemetry
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">99.8%</span>
              <span className="text-[11px] font-semibold text-emerald-500">
                {totalClients} devices
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {aps.length} UniFi 6GHz APs • 4HG-01
            </div>
          </div>
        </button>
      </div>

      {/* Left-Side Vertical Camera & Roof Cutaway Control Strip */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-start gap-2">
        <div
          className={`w-fit flex flex-col items-center p-1 rounded-2xl border shadow-lg backdrop-blur-xl gap-1 ${cardClass}`}
        >
          <button
            onClick={() => onCameraAction('zoom_in')}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCameraAction('zoom_out')}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-5 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
          <button
            onClick={() => onCameraAction('reset')}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
            title="Reset Isometric View"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => onCameraAction('top_down')}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
            title="Top-Down Plan View"
          >
            <Compass className="w-4 h-4" />
          </button>
          <div className="w-5 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
          <button
            onClick={onTogglePanMode}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition cursor-pointer ${
              panMode
                ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                : 'hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05]'
            }`}
            title="Toggle Pan Mode (or hold Spacebar + Left-Click Drag)"
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>

        {/* Roof / Ceiling Cutaway Slider Card */}
        <div
          className={`p-3 rounded-2xl border shadow-lg backdrop-blur-xl flex flex-col items-center gap-2 ${cardClass}`}
          title="Slice off ceiling / upper walls to see inside the 3D scan"
        >
          <Scissors className="w-4 h-4 text-[#65a30d] dark:text-[#8DDB05]" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Cutaway
          </span>
          <input
            type="range"
            min={-1.2}
            max={1.7}
            step={0.05}
            value={roofCutoffY}
            onChange={(e) => onRoofCutoffChange( parseFloat(e.target.value) )}
            className="w-20 accent-[#8DDB05] cursor-pointer"
          />
          <span className="text-[10px] font-mono text-slate-500">
            {roofCutoffY >= 1.65 ? 'Full' : formatFeetInches(roofCutoffY + 1.55)}
          </span>
        </div>

        {/* Cardinal Compass & Building Orientation Card */}
        <div
          className={`p-2.5 rounded-2xl border shadow-lg backdrop-blur-xl flex flex-col items-center gap-1.5 ${cardClass}`}
          title={`Warehouse Orientation: Main Doors face ${cardinalMapping.mainDoorWall}`}
        >
          {/* Compass Dial */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-inner flex items-center justify-center">
              <span className="absolute top-0.5 text-[7.5px] font-mono font-extrabold text-red-500">
                N
              </span>
              <span className="absolute bottom-0.5 text-[7.5px] font-mono font-bold text-slate-400">
                S
              </span>
              <span className="absolute right-1 text-[7.5px] font-mono font-bold text-slate-400">
                E
              </span>
              <span className="absolute left-1 text-[7.5px] font-mono font-bold text-slate-400">
                W
              </span>
            </div>
            {/* Rotating Needle */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-300 pointer-events-none"
              style={{
                transform: `rotate(${cardinalMapping.rotationDegrees}deg)`,
              }}
            >
              <div className="w-1 h-4 bg-red-500 rounded-t-full shadow-xs -translate-y-2" />
              <div className="w-1 h-4 bg-slate-400 dark:bg-slate-600 rounded-b-full translate-y-2" />
              <div className="absolute w-2 h-2 rounded-full bg-slate-900 dark:bg-white shadow-xs" />
            </div>
          </div>

          <div className="text-center leading-none">
            <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400 block">
              Main Doors
            </span>
            <span className="text-[10px] font-mono font-extrabold text-[#8DDB05] block mt-0.5">
              {cardinalMapping.mainDoorWall}
            </span>
          </div>

          {/* Rotate / Change Building Compass Direction (Available in View & Edit Mode) */}
          {onRotateOrientation && (
            <div className="flex items-center gap-1 mt-0.5">
              <button
                type="button"
                onClick={() => onRotateOrientation('ccw')}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-[#8DDB05]/20 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Rotate Cardinal Orientation 90° CCW (Updates N/S/E/W wall labels)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => onRotateOrientation('cw')}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-[#8DDB05]/20 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Rotate Cardinal Orientation 90° CW (Updates N/S/E/W wall labels)"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile/Compact Display Mode Cycling Button (Only in Edit Mode) */}
        {appMode === 'edit' && (
          <button
            onClick={() => {
              const order: DisplayMode[] = [
                'stylized',
                'clean_shell',
                'realistic',
                'ghost',
              ];
              const next =
                order[(order.indexOf(displayMode) + 1) % order.length];
              onDisplayModeChange(next);
            }}
            className={`xl:hidden p-2.5 rounded-2xl border shadow-lg backdrop-blur-xl flex items-center justify-center ${cardClass}`}
            title="Switch 3D Render Style"
          >
            <Layers className="w-4 h-4 text-[#8DDB05]" />
          </button>
        )}
      </div>

      {/* Bottom-Left Quick Facility Dock & Bay Status Bar */}
      <div
        className={`fixed bottom-4 left-4 z-20 max-w-xl px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl hidden md:flex items-center gap-4 ${cardClass}`}
      >
        <div className="pr-3 border-r border-slate-200 dark:border-slate-800">
          <div className="text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8DDB05]" />
            <span>Facility Anchors</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Click any pin to focus camera
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-md">
          {markers.map((m) => {
            const isSel = selectedMarkerId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectMarker(m)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? 'bg-[#8DDB05] text-slate-950 font-bold border-[#8DDB05] shadow-sm'
                    : isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    m.type === 'camera'
                      ? 'bg-cyan-400'
                      : m.type === 'network_ap'
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
                <span>{m.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
