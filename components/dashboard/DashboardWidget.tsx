'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEnterpriseTheme } from '@/components/enterprise-theme-provider';

interface DashboardWidgetProps {
  id: string;
  title: string;
  badge?: number;
  badgeColor?: string;
  accentColor?: string;
  link?: string;
  linkLabel?: string;
  children: React.ReactNode;
  maxItems?: number;
  totalItems?: number;
  isDragging?: boolean;
  isCustomizing?: boolean;
}

export default function DashboardWidget({
  id,
  title,
  badge,
  badgeColor = '#3b82f6',
  accentColor,
  link,
  linkLabel = 'Sjá allt →',
  children,
}: DashboardWidgetProps) {
  const { theme } = useEnterpriseTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const accent = accentColor || badgeColor;
  const isLight = theme === 'light';
  const baseColor = isLight ? '#f9faf6' : '#161822';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border overflow-hidden transition-shadow ${
        isDragging
          ? 'border-blue-500/30 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/20'
          : 'border-white/[0.08] shadow-sm shadow-black/20 hover:border-white/[0.15]'
      }`}
    >
      {/* Accent top stripe */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }} />

      <div style={{ backgroundColor: `color-mix(in srgb, ${accent} 3%, ${baseColor})` }}>
        <div
          className="px-4 py-3 border-b flex items-center justify-between gap-2"
          style={{ borderColor: `color-mix(in srgb, ${accent} 8%, transparent)` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing shrink-0 touch-none rounded p-0.5 hover:bg-white/5 transition-colors"
              style={{ color: `color-mix(in srgb, ${accent} 40%, ${isLight ? '#00000030' : '#ffffff30'})` }}
              aria-label="Draga til að raða"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </button>
            {badge !== undefined && badge > 0 && (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                style={{ backgroundColor: accent + '20', color: accent }}
              >
                {badge}
              </span>
            )}
            <h2 className="text-sm font-semibold text-white truncate">{title}</h2>
          </div>
          {link && (
            <Link href={link} className="text-xs hover:brightness-125 shrink-0 transition-all" style={{ color: accent }}>
              {linkLabel}
            </Link>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
