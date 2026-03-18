/**
 * ═══════════════════════════════════════════════════════════════
 * IP-NEXUS SILK DESIGN SYSTEM — SilkTabs
 * Neumorphic tabs with inset container and accent line
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';

interface Tab {
  label: string;
  value?: string;
}

interface SilkTabsProps {
  tabs: Tab[];
  activeTab: number;
  onChange: (index: number) => void;
  className?: string;
}

export const SilkTabs: React.FC<SilkTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex gap-1 p-1 ${className}`}
      style={{
        borderRadius: '11px',
        background: '#f1f4f9',
        boxShadow: 'inset 2px 2px 5px #cdd1dc, inset -2px -2px 5px #ffffff',
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === index;

        return (
          <button
            key={index}
            onClick={() => onChange(index)}
            className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap"
            style={{
              background: isActive ? '#f1f4f9' : 'transparent',
              boxShadow: isActive
                ? '3px 3px 7px #cdd1dc, -3px -3px 7px #ffffff'
                : 'none',
              color: isActive ? '#0a2540' : '#94a3b8',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            {tab.label}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: '30%',
                  right: '30%',
                  height: 2,
                  background: '#00b4d8',
                  borderRadius: 2,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SilkTabs;