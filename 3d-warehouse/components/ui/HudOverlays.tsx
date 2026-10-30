'use client';

import React from 'react';
import {
  Compass,
  Hand,
  Home,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
} from 'lucide-react';
import { DisplayMode, FacilityMarker, MarkerType } from '@/lib/markers';
import { formatFeetInches } from '@/lib/units';
import { CardinalFacing, getCardinalMapping } from '@/lib/compass';
import { FacilityAnchorsDock } from '@/components/ui/FacilityAnchorsDock';

interface HudOverlaysProps {
  appMode: 'view' | 'edit';
  markers: FacilityMarker[];
  theme: 'daylight' | 'dark';
  activeFilter?: MarkerType | 'all';
  onFilterChange?: (filter: MarkerType | 'all') => void;
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
  hidden?: boolean;
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
  hidden = false,
}: HudOverlaysProps) {
  if (hidden) return null;

  const isDark = theme === 'dark';
  const cardinalMapping = getCardinalMapping(cardinalFacing);

  const cardClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white/95 border-slate-200/80 text-slate-900';

  return (
    <>
      {/* Bottom HUD: Vertical Model Manipulation Tools directly above Facility Anchors Dock */}
      <div className="fixed left-[calc(1.25rem+var(--safe-left))] bottom-[calc(1.25rem+var(--safe-bottom))] z-20 flex flex-col items-start gap-2.5 max-w-[calc(100vw-2.5rem)] pointer-events-none">
        {/* Model Manipulation Column (Vertical format takes up minimal horizontal space) */}
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          {/* Vertical Camera Control Strip */}
          <div
            className={`w-fit flex flex-col items-center p-1 rounded-xl border shadow-lg backdrop-blur-xl gap-0.5 ${cardClass}`}
          >
            <button
              onClick={() => onCameraAction('zoom_in')}
              className="w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9 flex items-center justify-center rounded-lg hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCameraAction('zoom_out')}
              className="w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9 flex items-center justify-center rounded-lg hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-5 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
            <button
              onClick={() => onCameraAction('reset')}
              className="w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9 flex items-center justify-center rounded-lg hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
              title="Reset Isometric View"
              aria-label="Reset Isometric View"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCameraAction('top_down')}
              className="w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9 flex items-center justify-center rounded-lg hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05] transition cursor-pointer"
              title="Top-Down Plan View"
              aria-label="Top-Down Plan View"
            >
              <Compass className="w-4 h-4" />
            </button>
            <div className="w-5 h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
            <button
              onClick={onTogglePanMode}
              className={`w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9 flex items-center justify-center rounded-lg transition cursor-pointer ${
                panMode
                  ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                  : 'hover:bg-[#8DDB05]/15 hover:text-[#65a30d] dark:hover:text-[#8DDB05]'
              }`}
              title="Toggle Pan Mode (or hold Spacebar + Left-Click Drag)"
              aria-label="Toggle Pan Mode"
            >
              <Hand className="w-4 h-4" />
            </button>
          </div>

          {/* Roof / Ceiling Cutaway Slider Card (Vertical format) */}
          <div
            className={`p-2 rounded-xl border shadow-lg backdrop-blur-xl flex flex-col items-center gap-1.5 w-fit ${cardClass}`}
            title="Slice off ceiling / upper walls to see inside the 3D scan"
          >
            <Scissors className="w-3.5 h-3.5 text-[#65a30d] dark:text-[#8DDB05]" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Cutaway
            </span>
            <input
              type="range"
              min={-1.2}
              max={1.7}
              step={0.05}
              value={roofCutoffY}
              onChange={(e) => onRoofCutoffChange(parseFloat(e.target.value))}
              className="w-20 pointer-coarse:w-22 accent-[#8DDB05] cursor-pointer"
            />
            <span className="text-[9px] font-mono text-slate-500">
              {roofCutoffY >= 1.65 ? 'Full' : formatFeetInches(roofCutoffY + 1.55)}
            </span>
          </div>

          {/* Cardinal Compass & Building Orientation Card (Vertical format) */}
          <div
            className={`p-2 rounded-xl border shadow-lg backdrop-blur-xl flex flex-col items-center gap-1 w-fit ${cardClass}`}
            title={`Warehouse Orientation: Main Doors face ${cardinalMapping.mainDoorWall}`}
          >
            {/* Compass Dial */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-inner flex items-center justify-center pointer-events-none will-change-transform"
                style={{
                  transform: `rotate(calc(var(--camera-azimuth-deg, 0deg) + ${cardinalMapping.rotationDegrees}deg))`,
                }}
              >
                <span className="absolute top-0.5 text-[6.5px] font-mono font-extrabold text-red-500">
                  N
                </span>
                <span className="absolute bottom-0.5 text-[6.5px] font-mono font-bold text-slate-400">
                  S
                </span>
                <span className="absolute right-0.5 text-[6.5px] font-mono font-bold text-slate-400">
                  E
                </span>
                <span className="absolute left-0.5 text-[6.5px] font-mono font-bold text-slate-400">
                  W
                </span>
                <div className="w-0.5 h-3 bg-red-500 rounded-t-full shadow-xs -translate-y-1" />
                <div className="w-0.5 h-3 bg-slate-400 dark:bg-slate-600 rounded-b-full translate-y-1" />
                <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white shadow-xs" />
              </div>
            </div>

            <div className="text-center leading-none">
              <span className="text-[7px] font-mono uppercase tracking-wider text-slate-400 block">
                Main Doors
              </span>
              <span className="text-[8.5px] font-mono font-extrabold text-[#8DDB05] block mt-0.5">
                {cardinalMapping.mainDoorWall}
              </span>
            </div>

            {appMode === 'edit' && onRotateOrientation && (
              <div className="flex items-center gap-1 mt-0.5">
                <button
                  type="button"
                  onClick={() => onRotateOrientation('ccw')}
                  className="p-1 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-[#8DDB05]/20 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Rotate CCW 90°"
                  aria-label="Rotate CCW 90°"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onRotateOrientation('cw')}
                  className="p-1 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-[#8DDB05]/20 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  title="Rotate CW 90°"
                  aria-label="Rotate CW 90°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rebuilt Grouped & Collapsible Facility Anchors Dock */}
        <div className="pointer-events-auto w-[19rem] sm:w-[21rem] xl:w-[26rem] max-w-full">
          <FacilityAnchorsDock
            markers={markers}
            selectedMarkerId={selectedMarkerId}
            onSelectMarker={onSelectMarker}
            theme={theme}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
