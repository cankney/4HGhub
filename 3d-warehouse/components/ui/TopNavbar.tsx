'use client';

import React from 'react';
import Link from 'next/link';
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
  Maximize2,
  Minimize2,
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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
  isFullscreen = false,
  onToggleFullscreen,
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
    <header className="fixed top-[calc(0.875rem+var(--safe-top))] left-[calc(1.25rem+var(--safe-left))] right-[calc(1.25rem+var(--safe-right))] z-30 pointer-events-none flex items-center justify-between gap-2 sm:gap-3 max-w-full">
      {/* Left Brand + Search Bar */}
      <div
        className={`pointer-events-auto shrink-0 flex items-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border shadow-lg backdrop-blur-xl transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white/95 border-slate-200/80 text-slate-900'
        }`}
      >
        {/* Hub Back Navigation Button */}
        <a
          href="https://4hghub.com/"
          onClick={(e) => {
            e.preventDefault();
            window.location.assign('https://4hghub.com/');
          }}
          title="Back to 4HG Hub"
          aria-label="Back to 4HG Hub"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05]/15 hover:bg-[#8DDB05]/25 text-[#72b104] dark:text-[#8DDB05] border border-[#8DDB05]/40 transition-all shadow-sm active:scale-95 touch-target cursor-pointer"
        >
          <span className="text-sm font-black leading-none">&larr;</span>
          <span className="hidden sm:inline">Hub</span>
        </a>

        <div className="flex items-center gap-2.5 pr-2 border-r border-slate-200/60 dark:border-slate-700/60">
          <div className="w-8 h-8 rounded-xl bg-[#8DDB05] flex items-center justify-center text-slate-950 shadow-sm shrink-0">
            <Box className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight leading-none hidden md:block">
              WareTrack <span className="text-[#8DDB05] font-bold">3D</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5 hidden 2xl:block">
              4HG Shop • Odoo Digital Twin
            </div>
          </div>
        </div>

        {/* Search Input with Autocomplete Results */}
        <div className="relative w-32 sm:w-40 md:w-44 lg:w-48 xl:w-52 2xl:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search SKU, location..."
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
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer border shadow-xs touch-target ${
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
            aria-label="Sync Odoo"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncingOdoo
                  ? 'animate-spin text-[#8DDB05]'
                  : 'text-[#8DDB05]'
              }`}
            />
            <span className="hidden 2xl:inline">
              {isSyncingOdoo ? 'Syncing...' : 'Sync Odoo'}
            </span>
          </button>
        )}
      </div>

      {/* Center View Mode Status & Overlay Toggles (View Mode) */}
      {appMode === 'view' && (
        <div
          className={`pointer-events-auto shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 rounded-2xl border shadow-lg backdrop-blur-xl text-xs font-semibold ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white/95 border-slate-200/80 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 pr-1">
            <span className="w-2 h-2 rounded-full bg-[#8DDB05]" />
            <span className="hidden sm:inline">Clean Blueprint Model</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#8DDB05]/15 text-[#65a30d] dark:text-[#8DDB05]">
              VIEW MODE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <button
            onClick={() => onToggleCameraFeeds3D?.()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer touch-target ${
              showCameraFeeds3D
                ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Show live 3D Video Billboard Frustums"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D Camera Feeds</span>
          </button>
          <button
            onClick={() => onToggleSpatialVision3D?.()}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer touch-target ${
              showSpatialVision3D
                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Toggle AI Spatial Vision & Ground Projection"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">3D FSD Vision</span>
          </button>
          {showSpatialVision3D && onToggleFsdSettings && (
            <button
              onClick={onToggleFsdSettings}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
              title="Camera Vision Calibration Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Center 3D Model Render Styles Switcher (Edit Mode) */}
      {appMode === 'edit' && (
        <div
          className={`pointer-events-auto shrink-0 flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl border shadow-lg backdrop-blur-xl ${
            isDark
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-white/95 border-slate-200/80'
          }`}
        >
          {modeOptions.map((opt) => {
            const isSelected = displayMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onDisplayModeChange(opt.id)}
                className={`group flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer touch-target ${
                  isSelected
                    ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                }`}
                title={opt.label}
                aria-label={opt.label}
              >
                {opt.icon}
                <span className="hidden xl:inline whitespace-nowrap">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Right Action Pills: View Mode / Edit Mode Switch, Edit Tools, Fullscreen, Theme */}
      <div
        className={`pointer-events-auto shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 rounded-2xl border shadow-lg backdrop-blur-xl ${
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
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer touch-target ${
              appMode === 'view'
                ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="View Mode: Locked to Clean Blueprint view with Odoo Location lookup"
            aria-label="View Mode"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">View Mode</span>
          </button>
          <button
            onClick={() => onAppModeChange('edit')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-1 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer touch-target ${
              appMode === 'edit'
                ? 'bg-[#8DDB05] text-slate-950 shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Edit Mode: Move shelves, edit dimensions, assign locations & switch scan modes"
            aria-label="Edit Mode"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">Edit Mode</span>
          </button>
        </div>

        {/* Model & Scan Tools only shown in Edit Mode */}
        {appMode === 'edit' && (
          <>
            <button
              onClick={onToggleEditModel}
              className={`p-2 flex items-center justify-center rounded-xl border transition-all cursor-pointer touch-target ${
                editModelMode
                  ? 'bg-[#8DDB05] border-[#8DDB05] text-slate-950 shadow-sm ring-2 ring-[#8DDB05]/40'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title={`Edit 3D Scan Segments (${visibleMeshCount}/${totalMeshCount})`}
              aria-label="Scan Edit Mode"
            >
              <Wrench className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleCalibration}
              className={`p-2 flex items-center justify-center rounded-xl border transition-all cursor-pointer touch-target ${
                calibrationMode
                  ? 'bg-[#8DDB05] border-[#8DDB05] text-slate-950 shadow-sm ring-2 ring-[#8DDB05]/50'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Dev Mode Coordinate Helper: Click anywhere to log [x, y, z]"
              aria-label="Calibrate"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Full Screen Mode Toggle Button */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
            className={`p-2 touch-target flex items-center justify-center rounded-xl border transition cursor-pointer ${
              isFullscreen
                ? 'bg-[#8DDB05] border-[#8DDB05] text-slate-950 shadow-md ring-2 ring-[#8DDB05]/50'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className={`p-2 touch-target flex items-center justify-center rounded-xl border transition cursor-pointer ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-[#8DDB05] hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
          title="Switch Daylight / Dark Industrial Theme"
          aria-label="Switch Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings Menu Button */}
        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            className={`p-2 touch-target flex items-center justify-center rounded-xl border transition cursor-pointer ${
              isSettingsOpen
                ? 'bg-[#8DDB05] border-[#8DDB05] text-slate-950 shadow-md ring-2 ring-[#8DDB05]/50'
                : isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="App Settings & Odoo ERP API Config"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
