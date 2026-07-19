export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function todayISO(): string {
  const d = new Date();
  return formatDate(d);
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function parseDate(dateStr: string): Date {
  const [y, m, day] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function startOfWeek(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDate(d);
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}小时${rm}分`;
  }
  return s > 0 ? `${m}分${s}秒` : `${m}分钟`;
}

export function formatWeight(kg: number): string {
  return Number.isInteger(kg) ? `${kg}` : kg.toFixed(1);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function weekdayLabel(dateStr: string): string {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return labels[parseDate(dateStr).getDay()] ?? '';
}

export function goalLabel(goal: string): string {
  const map: Record<string, string> = {
    lose_fat: '减脂',
    build_muscle: '增肌',
    keep_fit: '保持健康',
    improve_endurance: '提升耐力',
  };
  return map[goal] ?? goal;
}

export function experienceLabel(level: string): string {
  const map: Record<string, string> = {
    beginner: '新手',
    intermediate: '中级',
    advanced: '进阶',
  };
  return map[level] ?? level;
}

export function mealTypeLabel(type: string): string {
  const map: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };
  return map[type] ?? type;
}

export function muscleLabel(group: string): string {
  const map: Record<string, string> = {
    chest: '胸',
    back: '背',
    shoulders: '肩',
    biceps: '二头',
    triceps: '三头',
    legs: '腿',
    glutes: '臀',
    core: '核心',
    full_body: '全身',
    cardio: '有氧',
  };
  return map[group] ?? group;
}
