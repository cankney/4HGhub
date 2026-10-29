'use client';

import React from 'react';
import {
  Box,
  Crosshair,
  Eye,
  Layers,
  Moon,
  Pencil,
  Search,
  Sparkles,
  Sun,
  Wrench,
  Settings,
  RefreshCw,
  Video,
  SlidersHorizontal,
} from 'lucide-react';
import { DisplayMode } from '@/lib/markers';

export interface SearchResultItem {
  type: 'product' | 'location' | 'rack' | 'marker';
  title: string;
  subtitle: string;
  badge: string;
  rackId: string;
  slotKey?: string;
  shortCode?: string;
  position: [number, number, number];
}

interface TopNavbarProps {
  appMode: 'view' | 'edit';
  onAppModeChange: (mode: 'view' | 'edit') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults?: SearchResultItem[];
  onSelectSearchResult?: (result: SearchResultItem) => void;
  isSyncingOdoo?: boolean;
  onSyncOdoo?: () => void;
  lastSyncTime?: string | null;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  theme: 'daylight' | 'dark';
  onToggleTheme: () => void;
  editModelMode: boolean;
  onToggleEditModel: () => void;
  calibrationMode: boolean;
  onToggleCalibration: () => void;
  visibleMeshCount: number;
  totalMeshCount: number;
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
  showCameraFeeds3D?: boolean;
  onToggleCameraFeeds3D?: () => void;
  showSpatialVision3D?: boolean;
  onToggleSpatialVision3D?: () => void;
  isFsdSettingsOpen?: boolean;
  onToggleFsdSettings?: () => void;
}

export function TopNavbar({
  appMode,
  onAppModeChange,
  searchQuery,
  onSearchChange,
  searchResults,
  onSelectSearchResult,
  isSyncingOdoo,
  onSyncOdoo,
  lastSyncTime,
  displayMode,
  onDisplayModeChange,
  theme,
  onToggleTheme,
  editModelMode,
  onToggleEditModel,
  calibrationMode,
  onToggleCalibration,
  visibleMeshCount,
  totalMeshCount,
  isSettingsOpen,
  onToggleSettings,
  showCameraFeeds3D,
  onToggleCameraFeeds3D,
  showSpatialVision3D,
  onToggleSpatialVision3D,
  isFsdSettingsOpen,
  onToggleFsdSettings,
}: TopNavbarProps) {
  const isDark = theme === 'dark';

  const modeOptions: { id: DisplayMode; label: string; icon: React.ReactNode }[] = [
    {
      id: 'stylized',
      label: 'Stylized Clay',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: 'clean_shell',
      label: 'Clean Blueprint',
      icon: <Box className="w-3.5 h-3.5" />,
    },
    {
      id: 'realistic',
      label: 'Realistic Scan',
      icon: <Eye className="w-3.5 h-3.5" />,
    },
    {
      id: 'ghost',
      label: 'Ghost (0.35)',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="fixed top-3 left-4 right-4 z-30 pointer-events-none flex items-center justify-between gap-3">
      {/* Left Brand + Search Bar */}
      <div
        className={`pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl border shadow-lg backdrop-blur-xl transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white/95 border-slate-200/80 text-slate-900'
        }`}
      >
        {/* Hub Back Navigation Button */}
        <a
          href="/"
          title="Back to 4HG Hub"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05]/15 hover:bg-[#8DDB05]/25 text-[#72b104] dark:text-[#8DDB05] border border-[#8DDB05]/40 transition-all shadow-sm active:scale-95"
        >
          <span className="text-sm font-black leading-none">&larr;</span>
          <span>Hub</span>
        </a>

        <div className="flex items-center gap-2.5 pr-2 border-r border-slate-200/60 dark:border-slate-700/60">
          <div className="w-8 h-8 rounded-xl bg-[#8DDB05] flex items-center justify-center text-slate-950 shadow-sm">
            <Box className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none">
              WareTrack <span className="text-[#8DDB05] font-bold">3D</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              4HG Shop • Odoo Digital Twin
            </div>
          </div>
        </div>

        {/* Search Input with Autocomplete Results */}
        <div className="relative w-64 sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search part #, SKU, shelf location..."
            className={`w-full pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl border outline-none transition shadow-sm ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-[#8DDB05]'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-[#8DDB05]'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}

          {/* Autocomplete / Search Matches Dropdown */}
          {searchQuery.trim().length >= 2 &&
            searchResults &&
            searchResults.length > 0 && (
              <div
                className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden z-50 max-h-80 overflow-y-auto ${
                  isDark
                    ? 'bg-slate-900/95 border-slate-700 text-slate-100'
                    : 'bg-white/95 border-slate-200 text-slate-900'
                }`}
              >
                <div className="p-2 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Matched Items ({searchResults.length})</span>
                  <span className="text-[#8DDB05]">Click to focus 3D</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {searchResults.map((res, idx) => (
                    <button
                      key={`sr-${idx}`}
                      type="button"
                      onClick={() => {
                        if (onSelectSearchResult) onSelectSearchResult(res);
                      }}
                      className={`w-full p-2.5 text-left transition cursor-pointer flex items-center justify-between gap-2.5 ${
                        isDark
                          ? 'hover:bg-slate-800/80'
                          : 'hover:bg-slate-100/90'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                          <span className="text-sm leading-none">
                            {res.type === 'product' ? '📦' : '📍'}
                          </span>
                          <span className="text-[#8DDB05] font-mono">
                            {res.title}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {res.subtitle}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#8DDB05]/20 text-[#65a30d] dark:text-[#8DDB05] shrink-0 border border-[#8DDB05]/40">
                        {res.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Sync with Odoo ERP Button */}
        {onSyncOdoo && (
          <button
            type="button"
            onClick={onSyncOdoo}
            disabled={isSyncingOdoo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs ${
              isSyncingOdoo
                ? 'bg-[#8DDB05]/20 text-[#8DDB05] border-[#8DDB05]/40 opacity-75 cursor-wait'
                : isDark
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:border-[#8DDB05]'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:border-[#8DDB05]'
            }`}
            title={
              lastSyncTime
                ? `Last synced with Odoo at ${lastSyncTime}. Click to re-sync.`
                : 'Sync on-hand inventory directly from Odoo ERP'
            }
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncingOdoo
                  ? 'animate-spin text-[#8DDB05]'
                  : 'text-[#8DDB05]'
              }`}
            />
            <span className="hidden sm:inline">
              {isSyncingOdoo ? 'Syncing...' : 'Sync Odoo'}
            </span>
          </button>
        )}
      </div>

      {/* Center Display Mode Switcher (Only shown in Edit Mode; View Mode is locked to Clean Blueprint) */}
      {appMode === 'edit' ? (
        <div
          className={`pointer-events-auto hidden xl:flex items-center gap-1 p-1.5 rounded-2xl border shadow-lg backdrop-blur-xl ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white/95 border-slate-200/80'
          }`}
        >
          {modeOptions.map((m) => {
            const active = displayMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onDisplayModeChange(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div
          className={`pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 rounded-2xl border shadow-lg backdrop-blur-xl text-xs font-semibold ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white/95 border-slate-200/80 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 pr-1">
            <span className="w-2 h-2 rounded-full bg-[#8DDB05]" />
            <span className="hidden md:inline">Clean Blueprint Model</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#8DDB05]/15 text-[#65a30d] dark:text-[#8DDB05]">
              VIEW MODE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* View Mode Overlay Toggles right alongside the Clean Blueprint Model pill */}
          <div className="flex items-center gap-1.5">
            {onToggleCameraFeeds3D && (
              <button
                type="button"
                onClick={onToggleCameraFeeds3D}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  showCameraFeeds3D
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm ring-2 ring-cyan-500/30'
                    : isDark
                    ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-cyan-500/50'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80 hover:border-cyan-500/50'
                }`}
                title="Toggle live 3D camera feed popups floating above cameras on the warehouse model"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    showCameraFeeds3D ? 'bg-white animate-pulse' : 'bg-cyan-400'
                  }`}
                />
                <Video className="w-3.5 h-3.5" />
                <span>3D Camera Feeds</span>
              </button>
            )}

            {onToggleSpatialVision3D && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleSpatialVision3D}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    showSpatialVision3D
                      ? 'bg-sky-500 text-white border-sky-400 shadow-sm ring-2 ring-sky-400/40'
                      : isDark
                      ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-sky-400/50'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80 hover:border-sky-400/50'
                  }`}
                  title="Tesla FSD-style 3D Spatial Vision: Renders holographic 3D ghost models of forklifts, vehicles, and people outside the warehouse from camera feeds"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      showSpatialVision3D ? 'bg-white animate-ping' : 'bg-sky-400'
                    }`}
                  />
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3D FSD Vision</span>
                </button>

                {onToggleFsdSettings && (
                  <button
                    type="button"
                    onClick={onToggleFsdSettings}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isFsdSettingsOpen
                        ? 'bg-sky-500 text-white border-sky-400 shadow-sm ring-2 ring-sky-400/40'
                        : isDark
                        ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-sky-300'
                        : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                    title="Calibrate FSD Vision: Adjust confidence threshold, filter false positives, and align 3D exterior camera mapping zones"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Action Pills: View Mode / Edit Mode Switch, Edit Tools, Theme */}
      <div
        className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-lg backdrop-blur-xl ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white/95 border-slate-200/80 text-slate-900'
        }`}
      >
        {/* View Mode vs Edit Mode Switch */}
        <div
          className={`flex items-center p-1 rounded-xl border ${
            isDark
              ? 'bg-slate-950/80 border-slate-800'
              : 'bg-slate-100 border-slate-200/80'
          }`}
        >
          <button
            onClick={() => onAppModeChange('view')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              appMode === 'view'
                ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="View Mode: Locked to Clean Blueprint view with Odoo Location lookup"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Mode</span>
          </button>
          <button
            onClick={() => onAppModeChange('edit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              appMode === 'edit'
                ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Edit Mode: Move shelves, edit dimensions, assign locations & switch scan modes"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Mode</span>
          </button>
        </div>

        {/* Model & Scan Tools only shown in Edit Mode */}
        {appMode === 'edit' && (
          <>
            <button
              onClick={onToggleEditModel}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                editModelMode
                  ? 'bg-[#8DDB05] text-slate-950 shadow-sm ring-2 ring-[#8DDB05]/40'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
              title="Edit 3D Scan Segments, Remove Clutter & Add Objects"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                Scan ({visibleMeshCount}/{totalMeshCount})
              </span>
            </button>

            <button
              onClick={onToggleCalibration}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                calibrationMode
                  ? 'bg-[#8DDB05] text-slate-950 shadow-sm ring-2 ring-[#8DDB05]/50'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
              title="Dev Mode Coordinate Helper: Click anywhere to log [x, y, z]"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calibrate</span>
            </button>
          </>
        )}

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-[#8DDB05] hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title="Switch Daylight / Dark Industrial Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings Menu Button */}
        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isSettingsOpen
                ? 'bg-[#8DDB05] border-[#8DDB05] text-slate-950 shadow-md ring-2 ring-[#8DDB05]/50'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="App Settings & Odoo ERP API Config"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
