'use client';

import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type WidgetConfig, type WidgetId } from '@/lib/dashboard-preferences';
import { useEnterpriseTheme } from '@/components/enterprise-theme-provider';

const widgetMeta: Record<WidgetId, { icon: string; description: string; color: string }> = {
  minVerkefni: {
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    description: 'Verkefni sem þú átt eða stofnaðir',
    color: '#8b5cf6',
  },
  verkefniDagsins: {
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    description: 'Verkefni sem þarf að klára í dag',
    color: '#3b82f6',
  },
  verkefniFramundan: {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    description: 'Verkefni með deadline næstu 3 daga',
    color: '#f59e0b',
  },
  samningarRennaUt: {
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Samningar sem eru að renna út bráðlega',
    color: '#f59e0b',
  },
  thjonustur: {
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    description: 'Væntanlegar þjónustur og viðhald á bílum',
    color: '#8b5cf6',
  },
  solutaekifaeri: {
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    description: 'Virk sölutækifæri og mögulegir samningar',
    color: '#22c55e',
  },
  malIVinnslu: {
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    description: 'Opin mál og kvartanir í vinnslu',
    color: '#ef4444',
  },
  aminningar: {
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    description: 'Áminningar og tilkynningar',
    color: '#f59e0b',
  },
};

interface DashboardCustomizerProps {
  open: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
  onReorder: (from: number, to: number) => void;
}

function SortableItem({ widget, onToggle, light }: { widget: WidgetConfig; onToggle: (id: WidgetId) => void; light: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });
  const meta = widgetMeta[widget.id];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        light
          ? widget.visible
            ? 'bg-gray-50 border-gray-200'
            : 'bg-gray-50/50 border-gray-100 opacity-60'
          : widget.visible
            ? 'bg-white/[0.06] border-white/10'
            : 'bg-white/[0.02] border-white/5 opacity-60'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className={`cursor-grab active:cursor-grabbing shrink-0 touch-none ${light ? 'text-gray-300 hover:text-gray-500' : 'text-white/30 hover:text-white/60'}`}
        aria-label="Draga til að raða"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </button>
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: meta.color + '18' }}
      >
        <svg className="w-4 h-4" style={{ color: meta.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${light ? (widget.visible ? 'text-gray-900' : 'text-gray-400') : (widget.visible ? 'text-white' : 'text-white/40')}`}>
          {widget.label}
        </div>
        <div className={`text-[11px] leading-tight mt-0.5 truncate ${light ? 'text-gray-500' : 'text-white/40'}`}>
          {meta.description}
        </div>
      </div>
      <button
        onClick={() => onToggle(widget.id)}
        className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${
          widget.visible ? 'bg-blue-600' : light ? 'bg-gray-200' : 'bg-white/10'
        }`}
        aria-label={widget.visible ? 'Fela' : 'Sýna'}
      >
        <span
          className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full shadow-sm transition-transform ${
            light ? 'bg-white' : 'bg-white'
          } ${widget.visible ? 'translate-x-[18px]' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

export default function DashboardCustomizer({ open, onClose, widgets, onToggle, onReorder }: DashboardCustomizerProps) {
  const { theme } = useEnterpriseTheme();
  const light = theme === 'light';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex(w => w.id === active.id);
    const newIndex = widgets.findIndex(w => w.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(oldIndex, newIndex);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className={`absolute inset-0 backdrop-blur-sm ${light ? 'bg-black/30' : 'bg-black/60'}`} onClick={onClose} />
      <div className={`relative rounded-2xl w-full max-w-md mx-4 shadow-2xl border ${
        light
          ? 'bg-white border-gray-200'
          : 'bg-[#13141f] border-white/10'
      }`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${light ? 'border-gray-100' : 'border-white/5'}`}>
          <h3 className={`text-base font-semibold ${light ? 'text-gray-900' : 'text-white'}`}>Sérsnið stjórnborð</h3>
          <button
            onClick={onClose}
            className={`transition-colors ${light ? 'text-gray-400 hover:text-gray-700' : 'text-white/40 hover:text-white'}`}
            aria-label="Loka"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          <p className={`text-xs mb-3 ${light ? 'text-gray-500' : 'text-white/50'}`}>Dragðu til að raða. Slökktu á hlutum sem þú vilt fela.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
              {widgets.map(widget => (
                <SortableItem key={widget.id} widget={widget} onToggle={onToggle} light={light} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div className={`px-5 py-3 border-t flex justify-end ${light ? 'border-gray-100' : 'border-white/5'}`}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Lokið
          </button>
        </div>
      </div>
    </div>
  );
}
