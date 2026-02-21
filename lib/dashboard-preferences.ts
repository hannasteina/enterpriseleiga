export type WidgetId =
  | 'minVerkefni'
  | 'verkefniDagsins'
  | 'verkefniFramundan'
  | 'samningarRennaUt'
  | 'thjonustur'
  | 'solutaekifaeri'
  | 'malIVinnslu'
  | 'aminningar';

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  visible: boolean;
}

const STORAGE_KEY = 'dashboard-widget-prefs';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'minVerkefni', label: 'Mín verkefni', visible: true },
  { id: 'verkefniDagsins', label: 'Verkefni dagsins', visible: true },
  { id: 'verkefniFramundan', label: 'Verkefni framundan', visible: true },
  { id: 'samningarRennaUt', label: 'Samningar sem renna út', visible: true },
  { id: 'thjonustur', label: 'Þjónustur', visible: true },
  { id: 'solutaekifaeri', label: 'Sölutækifæri', visible: true },
  { id: 'malIVinnslu', label: 'Mál í vinnslu', visible: true },
  { id: 'aminningar', label: 'Áminningar', visible: true },
];

export function loadWidgetPrefs(): WidgetConfig[] {
  if (typeof window === 'undefined') return DEFAULT_WIDGETS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const saved: WidgetConfig[] = JSON.parse(raw);
    // Ensure all widget IDs exist (handles new widgets added later)
    const savedIds = new Set(saved.map(w => w.id));
    const merged = [
      ...saved,
      ...DEFAULT_WIDGETS.filter(d => !savedIds.has(d.id)),
    ];
    return merged;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function saveWidgetPrefs(widgets: WidgetConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch {
    // localStorage full or unavailable
  }
}

export function toggleWidget(widgets: WidgetConfig[], id: WidgetId): WidgetConfig[] {
  return widgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
}

export function reorderWidgets(widgets: WidgetConfig[], fromIndex: number, toIndex: number): WidgetConfig[] {
  const result = [...widgets];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}
