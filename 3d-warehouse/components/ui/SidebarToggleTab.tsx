'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarToggleTabProps {
  collapsed: boolean;
  hasSelection: boolean;
  theme: 'daylight' | 'dark';
  onToggle: () => void;
}

export function SidebarToggleTab({
  collapsed,
  hasSelection,
  theme,
  onToggle,
}: SidebarToggleTabProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
      aria-expanded={!collapsed}
      className={`fixed top-1/2 -translate-y-1/2 z-40 h-16 w-6 pointer-coarse:w-9 pointer-coarse:h-20 rounded-l-2xl border border-r-0 shadow-lg backdrop-blur-xl flex items-center justify-center transition-[right] duration-300 cursor-pointer ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          : 'bg-white/95 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
      style={{
        right: collapsed
          ? 0
          : 'calc(var(--sidebar-w) + var(--hud-gap) + var(--safe-right))',
      }}
      title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
    >
      {collapsed ? (
        <ChevronLeft className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
      {collapsed && hasSelection && (
        <span
          className="absolute top-2 left-1.5 w-2 h-2 rounded-full bg-[#8DDB05] shadow-xs"
          title="Item selected in 3D scene"
        />
      )}
    </button>
  );
}
