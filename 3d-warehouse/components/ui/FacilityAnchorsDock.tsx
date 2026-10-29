'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FacilityMarker, MarkerType } from '@/lib/markers';

interface FacilityAnchorsDockProps {
  markers: FacilityMarker[];
  selectedMarkerId: string | null;
  onSelectMarker: (marker: FacilityMarker) => void;
  theme: 'daylight' | 'dark';
}

const GROUPS: { type: MarkerType; label: string; dotColor: string }[] = [
  { type: 'camera', label: 'Cameras', dotColor: 'bg-cyan-400' },
  { type: 'network_ap', label: 'Access Points', dotColor: 'bg-emerald-400' },
  { type: 'inventory_bin', label: 'Storage Bins', dotColor: 'bg-amber-400' },
];

export function FacilityAnchorsDock({
  markers,
  selectedMarkerId,
  onSelectMarker,
  theme,
}: FacilityAnchorsDockProps) {
  const isDark = theme === 'dark';
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('waretrack_anchors_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth < 1024;
    } catch {
      return false;
    }
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('waretrack_anchors_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const cardClass = isDark
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white/95 border-slate-200/80 text-slate-900';

  return (
    <div
      className={`fixed left-[calc(1rem+var(--safe-left))] bottom-[calc(1rem+var(--safe-bottom))] z-20 w-[22rem] lg:w-[28rem] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-xl backdrop-blur-xl flex flex-col overflow-hidden transition-all duration-300 ${cardClass}`}
    >
      {/* Header bar / Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand Facility Anchors' : 'Collapse Facility Anchors'}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-500/5 transition select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#8DDB05] shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight">Facility Anchors</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#8DDB05]/20 text-[#65a30d] dark:text-[#8DDB05] border border-[#8DDB05]/30">
                {markers.length}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Tap or click any pin to focus 3D view
            </div>
          </div>
        </div>

        <div className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition shrink-0">
          {collapsed ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Grouped pin grid body */}
      {!collapsed && (
        <div className="border-t border-slate-200/60 dark:border-slate-800/60 max-h-[38dvh] overflow-y-auto overscroll-contain p-3 space-y-3">
          {markers.length === 0 ? (
            <div className="text-center py-2 text-xs text-slate-400">
              No facility anchors found
            </div>
          ) : (
            GROUPS.map((group) => {
              const groupMarkers = markers.filter((m) => m.type === group.type);
              if (groupMarkers.length === 0) return null;

              return (
                <div key={group.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${group.dotColor}`} />
                      <span>{group.label}</span>
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">
                      {groupMarkers.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {groupMarkers.map((m) => {
                      const isSel = selectedMarkerId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onSelectMarker(m)}
                          title={m.name}
                          className={`h-8 pointer-coarse:h-11 rounded-xl px-2 text-xs font-medium border transition flex items-center gap-1.5 min-w-0 cursor-pointer ${
                            isSel
                              ? 'bg-[#8DDB05] text-slate-950 font-bold border-[#8DDB05] shadow-sm'
                              : isDark
                              ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:bg-slate-200/70'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${group.dotColor}`}
                          />
                          <span className="truncate">{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
