'use client';

import React, { useState } from 'react';
import { Check, Copy, Crosshair, Plus, X } from 'lucide-react';
import { FacilityMarker, MarkerType } from '@/lib/markers';
import { formatFeetInches } from '@/lib/units';

interface CalibrationOverlayProps {
  calibrationMode: boolean;
  calibratedPoint: [number, number, number] | null;
  calibratedMeshIndex: number | null;
  onClose: () => void;
  onCreateMarkerAtPoint: (type: MarkerType, point: [number, number, number]) => void;
  onHideClickedMesh: (meshIndex: number) => void;
}

export function CalibrationOverlay({
  calibrationMode,
  calibratedPoint,
  calibratedMeshIndex,
  onClose,
  onCreateMarkerAtPoint,
  onHideClickedMesh,
}: CalibrationOverlayProps) {
  const [copied, setCopied] = useState(false);

  if (!calibrationMode) return null;

  const coordString = calibratedPoint
    ? `X: ${formatFeetInches(calibratedPoint[0])}, Y: ${formatFeetInches(
        calibratedPoint[1]
      )}, Z: ${formatFeetInches(calibratedPoint[2])}  ([${calibratedPoint[0]}, ${
        calibratedPoint[1]
      }, ${calibratedPoint[2]}])`
    : 'Click anywhere on the 3D warehouse floor or shelves...';

  const handleCopy = () => {
    if (!calibratedPoint) return;
    navigator.clipboard.writeText(coordString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed bottom-[calc(1rem+var(--safe-bottom))] left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-2xl w-[92vw] p-3.5 rounded-2xl bg-slate-950/95 text-white border border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
          <Crosshair className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <div>
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>Anchor Calibration Mode</span>
            {calibratedMeshIndex !== null && calibratedMeshIndex >= 0 && (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                Segment #{calibratedMeshIndex + 1}
              </span>
            )}
          </div>
          <div className="text-xs font-mono text-slate-200 mt-0.5">
            {coordString}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {calibratedPoint && (
          <>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 touch-target rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy [X,Y,Z]'}</span>
            </button>
            <button
              onClick={() => onCreateMarkerAtPoint('inventory_bin', calibratedPoint)}
              className="px-2.5 py-1.5 touch-target rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Bin Here
            </button>
            <button
              onClick={() => onCreateMarkerAtPoint('camera', calibratedPoint)}
              className="px-2.5 py-1.5 touch-target rounded-xl text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Cam Here
            </button>
            <button
              onClick={() => onCreateMarkerAtPoint('network_ap', calibratedPoint)}
              className="px-2.5 py-1.5 touch-target rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> AP Here
            </button>
          </>
        )}

        {calibratedMeshIndex !== null && calibratedMeshIndex >= 0 && (
          <button
            onClick={() => onHideClickedMesh(calibratedMeshIndex)}
            className="px-2.5 py-1.5 touch-target rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white flex items-center justify-center cursor-pointer"
          >
            Hide Segment #{calibratedMeshIndex + 1}
          </button>
        )}

        <button
          onClick={onClose}
          className="p-1.5 touch-target flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
