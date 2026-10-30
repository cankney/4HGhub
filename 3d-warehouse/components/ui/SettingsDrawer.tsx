'use client';

import React, { useState } from 'react';
import {
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
}

export const DEFAULT_ODOO_CONFIG: OdooSettingsConfig = {
  baseUrl: 'https://4hg.odoo.com',
  database: '4hg-live',
  username: 'admin@4hg.com',
  apiKey: '',
  stockLocationPrefix: 'WH/Stock',
};

export interface UnifiSettingsConfig {
  baseUrl: string;
  apiKey: string;
  username?: string;
  password?: string;
  allowSelfSigned: boolean;
}

export const DEFAULT_UNIFI_CONFIG: UnifiSettingsConfig = {
  baseUrl: 'https://192.168.1.1',
  apiKey: '',
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
  lastCloudSyncTime?: string | null;
  isCollapsed?: boolean;
  onPullCloud?: () => void;
  onPushCloud?: () => void;
  isSyncingCloud?: boolean;
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
  lastCloudSyncTime,
  isCollapsed = false,
  onPullCloud,
  onPushCloud,
  isSyncingCloud = false,
}: SettingsDrawerProps) {
  const isDark = theme === 'dark';

  const [form, setForm] = useState<OdooSettingsConfig>(odooConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // UniFi State
  const [unifiForm, setUnifiForm] = useState<UnifiSettingsConfig>(unifiConfig);
  const [showUnifiApiKey, setShowUnifiApiKey] = useState(false);
  const [showUnifiPassword, setShowUnifiPassword] = useState(false);
  const [showUnifiHelp, setShowUnifiHelp] = useState(false);
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);
  const [unifiTestStatus, setUnifiTestStatus] = useState<
    'idle' | 'testing' | 'success' | 'error'
  >('idle');
  const [unifiTestMessage, setUnifiTestMessage] = useState<string | null>(null);
  const [unifiSaveSuccess, setUnifiSaveSuccess] = useState(false);

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
      const res = await fetch('/api/odoo/sync', {
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
      const res = await fetch('/api/unifi/sync', {
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

  const handleSaveUnifi = () => {
    onSaveUnifiConfig(unifiForm);
    setUnifiSaveSuccess(true);
    setTimeout(() => setUnifiSaveSuccess(false), 2000);
  };

  const handleSave = () => {
    onSaveOdooConfig(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
            Connect to Odoo to map warehouse rack coordinates to Odoo Stock Locations. Saved credentials automatically sync across all your devices and can also be defined via Vercel Environment Variables.
          </p>

          <div className="space-y-2.5">
            <div>
              <label
                className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
              >
                Odoo Instance URL
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="url"
                  value={form.baseUrl}
                  placeholder="https://my-company.odoo.com"
                  onChange={(e) =>
                    setForm({ ...form, baseUrl: e.target.value })
                  }
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border ${inputClass}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
                >
                  Database
                </label>
                <input
                  type="text"
                  value={form.database}
                  placeholder="e.g. production"
                  onChange={(e) =>
                    setForm({ ...form, database: e.target.value })
                  }
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border ${inputClass}`}
                />
              </div>
              <div>
                <label
                  className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
                >
                  Root Stock Prefix
                </label>
                <input
                  type="text"
                  value={form.stockLocationPrefix}
                  placeholder="WH/Stock"
                  onChange={(e) =>
                    setForm({ ...form, stockLocationPrefix: e.target.value })
                  }
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <label
                className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
              >
                Username / Email
              </label>
              <input
                type="text"
                value={form.username}
                placeholder="warehouse-admin@domain.com"
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium border ${inputClass}`}
              />
            </div>

            <div>
              <label
                className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
              >
                API Key / Access Token
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={form.apiKey}
                  placeholder="Enter Odoo API key or personal access token"
                  onChange={(e) =>
                    setForm({ ...form, apiKey: e.target.value })
                  }
                  className={`w-full pl-8 pr-8 py-1.5 rounded-xl text-xs font-mono font-medium border ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Test Connection & Save Action */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {testStatus === 'testing'
                  ? 'Testing...'
                  : testStatus === 'success'
                  ? '✓ Connected'
                  : testStatus === 'error'
                  ? '⚠ Failed'
                  : 'Test Endpoint'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-[#8DDB05] text-slate-950 hover:opacity-90 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save API Key
                  </>
                )}
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
            Connect your UniFi Console (UDM-Pro/SE/NVR) to automatically import security cameras, stream live feeds, and map camera positions.
          </p>

          {/* Collapsible Quick Help Accordion */}
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowUnifiHelp(!showUnifiHelp)}
              className="w-full px-3 py-2 text-left flex items-center justify-between text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" /> How to find your UniFi info
              </span>
              {showUnifiHelp ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            {showUnifiHelp && (
              <div className="p-3 border-t border-cyan-500/20 space-y-2 text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">1. Console Host:</strong> Enter your local UniFi gateway IP (e.g.{' '}
                  <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">https://192.168.1.1</code>).
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">2. API Key:</strong> In UniFi OS, click <strong>System Settings (gear icon)</strong> &gt; <strong>Admins & Users</strong> &gt; <strong>API Keys</strong> tab &gt; <strong>Create API Key</strong> with <em>UniFi Protect</em> permissions.
                </p>
                <p>
                  <strong className="text-slate-900 dark:text-slate-100">3. RTSP Streams:</strong> In UniFi Protect, navigate to <strong>UniFi Devices</strong> &gt; Select Camera &gt; <strong>Settings</strong> &gt; <strong>Advanced</strong> &gt; Toggle on <strong>RTSP Stream</strong> (High / Medium / Low).
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <div>
              <label
                className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
              >
                UniFi Console Host / URL
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="url"
                  value={unifiForm.baseUrl}
                  placeholder="https://192.168.1.1"
                  onChange={(e) =>
                    setUnifiForm({ ...unifiForm, baseUrl: e.target.value })
                  }
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border ${inputClass}`}
                />
              </div>
            </div>

            <div>
              <label
                className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}
              >
                UniFi OS API Key
              </label>
              <div className="relative">
                <Key className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type={showUnifiApiKey ? 'text' : 'password'}
                  value={unifiForm.apiKey}
                  placeholder="Paste UniFi OS API Key"
                  onChange={(e) =>
                    setUnifiForm({ ...unifiForm, apiKey: e.target.value })
                  }
                  className={`w-full pl-8 pr-8 py-1.5 rounded-xl text-xs font-mono font-medium border ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => setShowUnifiApiKey(!showUnifiApiKey)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showUnifiApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showUnifiApiKey ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Self-Signed SSL Option */}
            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={unifiForm.allowSelfSigned}
                onChange={(e) =>
                  setUnifiForm({
                    ...unifiForm,
                    allowSelfSigned: e.target.checked,
                  })
                }
                className="w-3.5 h-3.5 accent-[#8DDB05] rounded"
              />
              <span className="text-[11px] text-slate-500 font-medium">
                Allow self-signed SSL certificate (local gateway)
              </span>
            </label>

            {/* Advanced fallback: Local username/password */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                className="text-[10.5px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer pt-1"
              >
                {showAdvancedAuth ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>Legacy local admin login fallback</span>
              </button>
              {showAdvancedAuth && (
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={unifiForm.username || ''}
                      placeholder="admin"
                      onChange={(e) =>
                        setUnifiForm({ ...unifiForm, username: e.target.value })
                      }
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium border ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${labelClass}`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showUnifiPassword ? 'text' : 'password'}
                        value={unifiForm.password || ''}
                        placeholder="••••••••"
                        onChange={(e) =>
                          setUnifiForm({ ...unifiForm, password: e.target.value })
                        }
                        className={`w-full px-2.5 pr-7 py-1.5 rounded-xl text-xs font-medium border ${inputClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowUnifiPassword(!showUnifiPassword)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        {showUnifiPassword ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Test Connection & Save Action */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestUnifiConnection}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 shadow-xs'
                }`}
              >
                {unifiTestStatus === 'testing'
                  ? 'Testing...'
                  : unifiTestStatus === 'success'
                  ? '✓ Connected'
                  : unifiTestStatus === 'error'
                  ? '⚠ Failed'
                  : 'Test Endpoint'}
              </button>

              <button
                type="button"
                onClick={handleSaveUnifi}
                className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:opacity-90 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {unifiSaveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save API Key
                  </>
                )}
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
                      ? 'Mapping Cameras from UniFi...'
                      : 'Map Camera Feeds from UniFi'}
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

          {/* 4HG Cloud Sync Status & Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce text-sky-400' : 'text-sky-400'}`} />
                4HG Cloud Sync
              </span>
              <span className="text-[10.5px] font-mono text-slate-400">
                {lastCloudSyncTime ? `Synced: ${lastCloudSyncTime}` : 'Shared across all users'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onPullCloud && (
                <button
                  type="button"
                  onClick={onPullCloud}
                  disabled={isSyncingCloud}
                  className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                  Pull from Cloud
                </button>
              )}
              {onPushCloud && (
                <button
                  type="button"
                  onClick={onPushCloud}
                  disabled={isSyncingCloud}
                  className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Cloud className="w-3 h-3" />
                  Push to Cloud
                </button>
              )}
            </div>
          </div>

          {/* Export Offline JSON Backup */}
          {onExportJson && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                {lastCloudSyncTime ? `Cloud: ${lastCloudSyncTime}` : 'All devices synchronized'}
              </span>
              <button
                type="button"
                onClick={onExportJson}
                className="text-[#8DDB05] hover:underline font-semibold cursor-pointer text-xs"
              >
                Export JSON Backup
              </button>
            </div>
          )}

          {/* Reset to Factory Defaults */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {confirmReset ? (
              <div className="space-y-2">
                <p className="text-[11px] text-red-500 font-semibold">
                  Reset all warehouse doors, racks, and locations to default?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetToDefaults();
                      setConfirmReset(false);
                    }}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition cursor-pointer"
                  >
                    Yes, Reset All
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
                className="w-full py-1.5 rounded-xl text-xs font-semibold text-red-500 hover:text-red-600 border border-red-500/30 hover:border-red-500/60 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Reset Warehouse to Factory Defaults
              </button>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
