'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Compass,
  Database,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Key,
  Layers,
  Lock,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Package,
  Save,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { CardinalFacing, getCardinalMapping } from '@/lib/compass';

export interface OdooSettingsConfig {
  baseUrl: string;
  database: string;
  username: string;
  apiKey: string;
  stockLocationPrefix: string;
  parentLocations?: string[];
}

export const DEFAULT_ODOO_CONFIG: OdooSettingsConfig = {
  baseUrl: process.env.NEXT_PUBLIC_ODOO_BASE_URL || 'https://4hg.odoo.com',
  database: process.env.NEXT_PUBLIC_ODOO_DB || '4hg-live',
  username:
    process.env.NEXT_PUBLIC_ODOO_USERNAME ||
    process.env.NEXT_PUBLIC_ODOO_LOGIN ||
    'admin@4hg.com',
  apiKey: process.env.NEXT_PUBLIC_ODOO_API_KEY || '',
  stockLocationPrefix: 'WH/Stock, WH/Packing Zone',
  parentLocations: ['WH/Stock', 'WH/Packing Zone'],
};

export interface UnifiSettingsConfig {
  baseUrl: string;
  apiKey: string;
  username?: string;
  password?: string;
  allowSelfSigned: boolean;
}

export const DEFAULT_UNIFI_CONFIG: UnifiSettingsConfig = {
  baseUrl:
    process.env.NEXT_PUBLIC_UNIFI_BASE_URL ||
    process.env.NEXT_PUBLIC_UNIFI_IP ||
    'https://192.168.1.1',
  apiKey: process.env.NEXT_PUBLIC_UNIFI_API_KEY || '',
  username: '',
  password: '',
  allowSelfSigned: true,
};

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'daylight' | 'dark';
  onToggleTheme: () => void;
  odooConfig: OdooSettingsConfig;
  onSaveOdooConfig: (config: OdooSettingsConfig) => void;
  unifiConfig: UnifiSettingsConfig;
  onSaveUnifiConfig: (config: UnifiSettingsConfig) => void;
  cardinalFacing: CardinalFacing;
  onSelectCardinalFacing: (facing: CardinalFacing) => void;
  showShelfTags: boolean;
  onToggleShelfTags: () => void;
  onResetToDefaults: () => void;
  isSyncingOdoo?: boolean;
  onSyncOdoo?: () => void;
  lastSyncTime?: string | null;
  syncStatusMsg?: { type: 'success' | 'error'; text: string } | null;
  isSyncingUnifi?: boolean;
  onSyncUnifi?: () => void;
  lastUnifiSyncTime?: string | null;
  unifiSyncStatusMsg?: { type: 'success' | 'error'; text: string } | null;
  onExportJson?: () => void;
  onImportJson?: (file: File) => void;
  onSaveBaselineDefaults?: () => void;
  isSavingBaseline?: boolean;
  baselineSaveMsg?: { type: 'success' | 'error'; text: string } | null;
  lastCloudSyncTime?: string | null;
  isCollapsed?: boolean;
  envConfigured?: { odoo?: boolean; unifi?: boolean };
}

export function SettingsDrawer({
  isOpen,
  onClose,
  theme,
  onToggleTheme,
  odooConfig,
  onSaveOdooConfig,
  cardinalFacing,
  onSelectCardinalFacing,
  showShelfTags,
  onToggleShelfTags,
  onResetToDefaults,
  isSyncingOdoo,
  onSyncOdoo,
  lastSyncTime,
  syncStatusMsg,
  unifiConfig,
  onSaveUnifiConfig,
  isSyncingUnifi,
  onSyncUnifi,
  lastUnifiSyncTime,
  unifiSyncStatusMsg,
  onExportJson,
  onImportJson,
  onSaveBaselineDefaults,
  isSavingBaseline = false,
  baselineSaveMsg = null,
  lastCloudSyncTime,
  isCollapsed = false,
  envConfigured,
}: SettingsDrawerProps) {
  const isDark = theme === 'dark';

  const [form, setForm] = useState<OdooSettingsConfig>(odooConfig);
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLockBaseline, setConfirmLockBaseline] = useState(false);

  // UniFi State
  const [unifiForm, setUnifiForm] = useState<UnifiSettingsConfig>(unifiConfig);
  const [unifiTestStatus, setUnifiTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [unifiTestMessage, setUnifiTestMessage] = useState<string | null>(null);

  const odooAutoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const unifiAutoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateOdooForm = (nextForm: OdooSettingsConfig) => {
    setForm(nextForm);
    if (odooAutoSaveTimerRef.current) clearTimeout(odooAutoSaveTimerRef.current);
    odooAutoSaveTimerRef.current = setTimeout(() => {
      onSaveOdooConfig(nextForm);
    }, 500);
  };

  const updateUnifiForm = (nextUnifiForm: UnifiSettingsConfig) => {
    setUnifiForm(nextUnifiForm);
    if (unifiAutoSaveTimerRef.current) clearTimeout(unifiAutoSaveTimerRef.current);
    unifiAutoSaveTimerRef.current = setTimeout(() => {
      onSaveUnifiConfig(nextUnifiForm);
    }, 500);
  };

  // Sync internal state if prop updates
  React.useEffect(() => {
    setForm(odooConfig);
  }, [odooConfig]);

  React.useEffect(() => {
    setUnifiForm(unifiConfig);
  }, [unifiConfig]);

  if (!isOpen) return null;

  const cardinalMapping = getCardinalMapping(cardinalFacing);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage(null);
    try {
      const res = await fetch('/3d-warehouse/api/odoo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, testOnly: true }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestMessage(data.message || 'Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Connection failed.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Failed to contact Odoo proxy endpoint.');
    }
  };

  const handleTestUnifiConnection = async () => {
    setUnifiTestStatus('testing');
    setUnifiTestMessage(null);
    try {
      const res = await fetch('/3d-warehouse/api/unifi/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...unifiForm, testOnly: true }),
      });
      const data = await res.json();
      if (data.success) {
        setUnifiTestStatus('success');
        setUnifiTestMessage(data.message || 'Connected to UniFi Protect successfully!');
      } else {
        setUnifiTestStatus('error');
        setUnifiTestMessage(data.error || 'Connection failed.');
      }
    } catch (err: any) {
      setUnifiTestStatus('error');
      setUnifiTestMessage(err.message || 'Failed to reach UniFi proxy endpoint.');
    }
  };



  const panelBg = isDark
    ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-2xl'
    : 'bg-white/95 border-slate-200 text-slate-900 shadow-2xl';

  const cardBg = isDark
    ? 'border-slate-800 bg-slate-950/40'
    : 'border-slate-200 bg-slate-50/80';

  const inputClass = isDark
    ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-[#8DDB05] focus:ring-1 focus:ring-[#8DDB05]'
    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#8DDB05] focus:ring-1 focus:ring-[#8DDB05] shadow-xs';

  const labelClass = isDark ? 'text-slate-400' : 'text-slate-600 font-semibold';

  return (
    <aside
      data-collapsed={isCollapsed}
      inert={isCollapsed ? true : undefined}
      className={`sidebar-panel z-40 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden ${panelBg}`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex items-center justify-between gap-2 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#8DDB05] flex items-center justify-center text-slate-950 shadow-md">
            <Settings className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">Settings</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              ERP & UniFi APIs • Warehouse Twin
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 touch-target flex items-center justify-center rounded-xl transition cursor-pointer ${
            isDark
              ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* SECTION 1: ODOO API INTEGRATION */}
        <section className={`p-3.5 rounded-2xl border space-y-3.5 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
              }`}
            >
              <Database className="w-4 h-4" /> Odoo ERP Integration
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-[#8DDB05]/20 text-[#8DDB05]">
              AUTO-SYNC
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Connects to Odoo to map warehouse rack coordinates to Odoo Stock Locations. Environment variables in Vercel securely supply credentials.
          </p>

          <div className="space-y-2.5">
            {/* Read-Only Vercel Environment Configuration Summary */}
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Managed via Vercel Environment
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  ACTIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Instance URL</span>
                  <span className="truncate block font-semibold text-slate-200">{form.baseUrl || 'https://4hg.odoo.com'}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Database</span>
                  <span className="truncate block font-semibold text-slate-200">{form.database || '4hg-live'}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Username</span>
                  <span className="truncate block font-semibold text-slate-200">{form.username || 'admin@4hg.com'}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">API Key</span>
                  <span className="truncate block font-semibold text-emerald-400">•••••••• (Secured)</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label
                className={`text-[10px] font-bold uppercase tracking-wider block ${labelClass}`}
              >
                Stock Location Filter
              </label>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {['WH/Stock', 'WH/Packing Zone', 'WH/Pre-Production'].map((loc) => {
                  const currentParts = (form.stockLocationPrefix || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const isSelected = currentParts.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        let nextParts: string[];
                        if (isSelected) {
                          nextParts = currentParts.filter((p) => p !== loc);
                          if (nextParts.length === 0) nextParts = [loc];
                        } else {
                          nextParts = [...currentParts, loc];
                        }
                        const combined = nextParts.join(', ');
                        updateOdooForm({
                          ...form,
                          stockLocationPrefix: combined,
                          parentLocations: nextParts,
                        });
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#8DDB05] text-slate-950 border-transparent shadow-xs'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
                      }`}
                    >
                      {isSelected ? `✓ ${loc}` : `+ ${loc}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Connection Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {testStatus === 'testing'
                  ? 'Testing Odoo Connection...'
                  : testStatus === 'success'
                  ? '✓ Odoo Connected'
                  : testStatus === 'error'
                  ? '⚠ Connection Failed'
                  : 'Test Odoo Connection'}
              </button>
            </div>

            {testMessage && (
              <div
                className={`text-[10.5px] p-2 rounded-lg font-medium leading-relaxed ${
                  testStatus === 'success'
                    ? 'bg-[#8DDB05]/15 text-[#3f6212] dark:text-[#8DDB05] border border-[#8DDB05]/30'
                    : 'bg-red-500/10 text-red-500 border border-red-500/30'
                }`}
              >
                {testMessage}
              </div>
            )}

            {/* Sync Inventory from Odoo Action */}
            {onSyncOdoo && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <button
                  type="button"
                  onClick={onSyncOdoo}
                  disabled={isSyncingOdoo}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isSyncingOdoo ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isSyncingOdoo
                      ? 'Syncing Inventory with Odoo...'
                      : 'Sync All Inventory from Odoo'}
                  </span>
                </button>
                {lastSyncTime && (
                  <div className="text-[10px] text-center text-slate-400">
                    Last synchronized: {lastSyncTime}
                  </div>
                )}
                {syncStatusMsg && (
                  <div
                    className={`text-[10.5px] p-2 rounded-lg font-medium ${
                      syncStatusMsg.type === 'success'
                        ? 'bg-[#8DDB05]/15 text-[#3f6212] dark:text-[#8DDB05] border border-[#8DDB05]/30'
                        : 'bg-red-500/10 text-red-500 border border-red-500/30'
                    }`}
                  >
                    {syncStatusMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: UNIFI PROTECT API INTEGRATION */}
        <section className={`p-3.5 rounded-2xl border space-y-3.5 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}
            >
              <Camera className="w-4 h-4" /> UniFi Protect Camera Feeds
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-cyan-500/20 text-cyan-500">
              REST / RTSP
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Connects to your UniFi Console (UDM-Pro/SE/NVR) to automatically import security cameras and map camera streams. Credentials are provided securely via Vercel Environment Variables.
          </p>

          <div className="space-y-2.5">
            {/* Read-Only Vercel Environment Configuration Summary */}
            <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Managed via Vercel Environment
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                  ACTIVE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">Console Host</span>
                  <span className="truncate block font-semibold text-slate-200">{unifiForm.baseUrl || 'https://192.168.1.1'}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">API Key</span>
                  <span className="truncate block font-semibold text-cyan-400">•••••••• (Secured)</span>
                </div>
              </div>
            </div>

            {/* Self-Signed SSL Option */}
            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={unifiForm.allowSelfSigned}
                onChange={(e) =>
                  updateUnifiForm({
                    ...unifiForm,
                    allowSelfSigned: e.target.checked,
                  })
                }
                className="w-3.5 h-3.5 accent-cyan-500 rounded"
              />
              <span className="text-[11px] text-slate-400 font-medium">
                Allow self-signed SSL certificate (local gateway)
              </span>
            </label>

            {/* Test Connection Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleTestUnifiConnection}
                className={`w-full py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {unifiTestStatus === 'testing'
                  ? 'Testing UniFi Connection...'
                  : unifiTestStatus === 'success'
                  ? '✓ UniFi Connected'
                  : unifiTestStatus === 'error'
                  ? '⚠ UniFi Connection Failed'
                  : 'Test UniFi Connection'}
              </button>
            </div>

            {unifiTestMessage && (
              <div
                className={`text-[10.5px] p-2 rounded-lg font-medium leading-relaxed ${
                  unifiTestStatus === 'success'
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                    : 'bg-red-500/10 text-red-500 border border-red-500/30'
                }`}
              >
                {unifiTestMessage}
              </div>
            )}

            {/* Sync & Map Cameras Action */}
            {onSyncUnifi && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <button
                  type="button"
                  onClick={onSyncUnifi}
                  disabled={isSyncingUnifi}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:opacity-90 transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isSyncingUnifi ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isSyncingUnifi
                      ? 'Syncing Network & Cameras from UniFi...'
                      : 'Sync Network & Cameras from UniFi'}
                  </span>
                </button>
                {lastUnifiSyncTime && (
                  <div className="text-[10px] text-center text-slate-400">
                    Last synchronized: {lastUnifiSyncTime}
                  </div>
                )}
                {unifiSyncStatusMsg && (
                  <div
                    className={`text-[10.5px] p-2 rounded-lg font-medium ${
                      unifiSyncStatusMsg.type === 'success'
                        ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        : 'bg-red-500/10 text-red-500 border border-red-500/30'
                    }`}
                  >
                    {unifiSyncStatusMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: WAREHOUSE CARDINAL ORIENTATION & COMPASS */}
        <section className={`p-3.5 rounded-2xl border space-y-3.5 ${cardBg}`}>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold flex items-center gap-1.5 ${
                isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
              }`}
            >
              <Compass className="w-4 h-4" /> Warehouse Cardinal Orientation
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-[#8DDB05]/20 text-[#8DDB05]">
              {cardinalMapping.mainDoorWall} Facing
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Determine the true real-world compass directions for the warehouse.
            Changing this dynamically updates all door, rack, and endcap names.
          </p>

          {/* Quick Facing Selector */}
          <div className="space-y-1.5">
            <label
              className={`text-[10px] font-bold uppercase tracking-wider block ${labelClass}`}
            >
              Main Overhead Doors (Back Wall) face:
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['north', 'east', 'south', 'west'] as CardinalFacing[]).map(
                (f) => {
                  const isSel = cardinalFacing === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onSelectCardinalFacing(f)}
                      className={`py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer border ${
                        isSel
                          ? 'bg-[#8DDB05] text-slate-950 border-slate-950 shadow-sm ring-1 ring-[#8DDB05]'
                          : isDark
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 shadow-xs'
                      }`}
                    >
                      {f}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Live Dynamic Wall Breakdown Card */}
          <div
            className={`p-2.5 rounded-xl border text-[11px] space-y-1.5 ${
              isDark
                ? 'bg-slate-900 border-slate-800'
                : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-400">
              Resolved Building Walls:
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Main Overhead & Service Doors:</span>
              <span className="font-mono font-bold text-[#8DDB05]">
                {cardinalMapping.mainDoorWall} Wall
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Opposite Overhead Door:</span>
              <span className="font-mono font-bold text-[#8DDB05]">
                {cardinalMapping.oppositeDoorWall} Wall
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Zone A Parallel Racks:</span>
              <span className="font-mono font-bold text-[#8DDB05]">
                {cardinalMapping.zoneARacksWall} Wall
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Office & Entry Corridor:</span>
              <span className="font-mono font-bold text-[#8DDB05]">
                {cardinalMapping.officeWall} Wall
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 3: 3D VIEW & APP PREFERENCES */}
        <section className={`p-3.5 rounded-2xl border space-y-3 ${cardBg}`}>
          <span
            className={`text-xs font-bold flex items-center gap-1.5 ${
              isDark ? 'text-[#8DDB05]' : 'text-[#3f6212]'
            }`}
          >
            <Sparkles className="w-4 h-4" /> 3D Digital Twin Preferences
          </span>

          {/* Theme Switcher in Settings */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Theme Mode
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                isDark
                  ? 'bg-slate-800 text-[#8DDB05] border-slate-700'
                  : 'bg-white text-slate-800 border-slate-300 shadow-xs'
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5" /> Daylight Mode
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" /> Dark Industrial
                </>
              )}
            </button>
          </div>

          {/* Show Shelf Tags */}
          <div className="flex items-center justify-between">
            <span className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Floating 3D Shelf Tags
            </span>
            <button
              type="button"
              onClick={onToggleShelfTags}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                showShelfTags
                  ? 'bg-[#8DDB05] text-slate-950 border-[#8DDB05] shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-white text-slate-500 border-slate-300'
              }`}
            >
              {showShelfTags ? 'Visible' : 'Hidden'}
            </button>
          </div>

          {/* 4HG Cloud Live Sync Status Banner */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Cloud className="w-3.5 h-3.5 text-sky-400" />
                4HG Cloud Multi-Device Sync
              </span>
              <span className="text-[10.5px] font-mono text-[#8DDB05] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8DDB05] animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All 3D objects, layouts, FSD vision placements, and synced inventory are automatically saved and synchronized across all devices in real time.
            </p>
            <div className="text-[10.5px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
              <span>Cloud Status:</span>
              <span className="text-slate-300">{lastCloudSyncTime ? `Saved at ${lastCloudSyncTime}` : 'Synchronized'}</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: MASTER BASELINE & FACTORY DEFAULTS */}
        <section className={`p-3.5 rounded-2xl border space-y-3 ${
          isDark ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-emerald-500/40 bg-emerald-50/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Master Baseline & Factory Defaults
            </span>
          </div>

          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Lock your custom shelves, synced Odoo quants, deleted models, 3D positions, and markers as the permanent factory baseline default. Future code updates, rebuilds, and resets will preserve this exact setup.
          </p>

          {baselineSaveMsg && (
            <div className={`p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
              baselineSaveMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {baselineSaveMsg.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{baselineSaveMsg.text}</span>
            </div>
          )}

          {/* Confirm lock baseline dialog */}
          {confirmLockBaseline ? (
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-2">
              <p className="text-xs font-semibold text-emerald-400">
                Lock current warehouse configuration as the master factory default?
              </p>
              <p className="text-[10.5px] text-slate-400">
                This writes your active shelves, Odoo stock locations, deleted models, and markers directly into the persistent codebase baseline and cloud defaults.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSavingBaseline}
                  onClick={async () => {
                    if (onSaveBaselineDefaults) {
                      await onSaveBaselineDefaults();
                    }
                    setConfirmLockBaseline(false);
                  }}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:bg-[#a3e635] transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSavingBaseline ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{isSavingBaseline ? 'Locking...' : 'Yes, Lock as Default'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLockBaseline(false)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 transition cursor-pointer text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmLockBaseline(true)}
              disabled={isSavingBaseline}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:bg-[#a3e635] shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Set Current Setup as Baseline Default</span>
            </button>
          )}

          {/* Backup Import & Export */}
          <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between gap-2">
            {onExportJson && (
              <button
                type="button"
                onClick={onExportJson}
                className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export JSON</span>
              </button>
            )}

            {onImportJson && (
              <label className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold border border-slate-700 hover:bg-slate-800 text-slate-300 transition cursor-pointer flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onImportJson) {
                      onImportJson(file);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Reset to Baseline Default */}
          <div className="pt-2 border-t border-emerald-500/20">
            {confirmReset ? (
              <div className="space-y-2">
                <p className="text-[11px] text-amber-500 font-semibold">
                  Reset current session back to the saved baseline default?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetToDefaults();
                      setConfirmReset(false);
                    }}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition cursor-pointer"
                  >
                    Yes, Reset to Baseline
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Baseline Default
              </button>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
