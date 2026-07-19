import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  {
    id: 'ex_barbell_bench',
    name: '杠铃卧推',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    difficulty: 3,
    description: '上肢推举经典动作，主要刺激胸大肌，兼顾三头与前束。',
    cues: ['肩胛骨后缩下沉', '肘部约 45°', '杠铃路径轻微弧线', '底部轻触胸'],
    commonMistakes: ['塌腰过度', '弹胸', '握距过宽导致肩痛'],
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSec: 120,
    isCompound: true,
  },
  {
    id: 'ex_db_bench',
    name: '哑铃卧推',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'dumbbell',
    difficulty: 2,
    description: '更大活动范围，利于纠正两侧不平衡。',
    cues: ['手腕中立', '顶部轻触不撞击', '下放有控制'],
    commonMistakes: ['下放过深压肩', '借力甩哑铃'],
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_incline_db',
    name: '上斜哑铃卧推',
    muscleGroup: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    difficulty: 3,
    description: '上斜角度强化上胸，建议 15–30°。',
    cues: ['凳面 15–30°', '肩胛稳定', '推起时略向内收'],
    commonMistakes: ['角度过大变成肩推', '底部弹震'],
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_pushup',
    name: '俯卧撑',
    muscleGroup: 'chest',
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'bodyweight',
    difficulty: 1,
    description: '无器械胸肌与核心训练，可做跪姿退阶。',
    cues: ['身体一条直线', '肘约 45°', '核心收紧'],
    commonMistakes: ['塌腰', '脖子前探'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    isCompound: true,
  },
  {
    id: 'ex_squat',
    name: '杠铃深蹲',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes', 'core'],
    equipment: 'barbell',
    difficulty: 4,
    description: '下肢力量基础动作，发展股四、臀与核心稳定。',
    cues: ['膝盖与脚尖同向', '髋膝协同', '核心绷紧', '深度适中'],
    commonMistakes: ['膝盖内扣', '腰圆', '脚跟离地'],
    defaultSets: 4,
    defaultReps: 6,
    defaultRestSec: 150,
    isCompound: true,
  },
  {
    id: 'ex_rdl',
    name: '罗马尼亚硬拉',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    difficulty: 3,
    description: '强调腘绳肌与臀链离心控制。',
    cues: ['髋铰链', '杠贴近腿', '背部平直', '膝微屈'],
    commonMistakes: ['变成深蹲', '圆背硬拉'],
    defaultSets: 3,
    defaultReps: 8,
    defaultRestSec: 120,
    isCompound: true,
  },
  {
    id: 'ex_deadlift',
    name: '传统硬拉',
    muscleGroup: 'back',
    secondaryMuscles: ['legs', 'glutes', 'core'],
    equipment: 'barbell',
    difficulty: 5,
    description: '全身力量与后链发展王牌动作，注意技术优先。',
    cues: ['杠过脚中线', '背平锁死', '髋膝同时伸展', '顶部髋锁不后仰'],
    commonMistakes: ['圆背起杠', '杠离身体过远', '借力甩腰'],
    defaultSets: 3,
    defaultReps: 5,
    defaultRestSec: 180,
    isCompound: true,
  },
  {
    id: 'ex_leg_press',
    name: '腿举',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
    difficulty: 2,
    description: '器械下肢训练，便于大重量且相对安全。',
    cues: ['腰贴靠背', '膝盖不锁死', '脚距适中'],
    commonMistakes: ['下放过深圆腰', '膝盖内扣'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_leg_ext',
    name: '腿屈伸',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 1,
    description: '股四头肌孤立动作，适合力竭或预疲劳。',
    cues: ['靠背贴紧', '顶端稍停', '离心慢放'],
    commonMistakes: ['借惯性甩腿', '重量过大导致膝不适'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    isCompound: false,
  },
  {
    id: 'ex_leg_curl',
    name: '腿弯举',
    muscleGroup: 'legs',
    equipment: 'machine',
    difficulty: 1,
    description: '腘绳肌孤立训练。',
    cues: ['髋不离开垫', '顶端收缩', '控制下放'],
    commonMistakes: ['借力抬髋', '重量过大'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    isCompound: false,
  },
  {
    id: 'ex_pullup',
    name: '引体向上',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'bodyweight',
    difficulty: 4,
    description: '背部垂直拉经典动作，可做弹力带辅助。',
    cues: ['肩下沉启动', '胸向杠', '下巴过杠', '下放充分'],
    commonMistakes: ['耸肩', '过度甩腿'],
    defaultSets: 3,
    defaultReps: 6,
    defaultRestSec: 120,
    isCompound: true,
  },
  {
    id: 'ex_lat_pulldown',
    name: '高位下拉',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    difficulty: 2,
    description: '引体替代/辅助，侧重背阔肌。',
    cues: ['挺胸下拉', '肘向髋', '控制回放'],
    commonMistakes: ['后仰过多', '用手臂硬拉'],
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_bb_row',
    name: '杠铃划船',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps', 'core'],
    equipment: 'barbell',
    difficulty: 3,
    description: '水平拉，增厚中背部。',
    cues: ['髋铰链稳定', '肘贴身', '肩胛后缩'],
    commonMistakes: ['借力起身', '圆背'],
    defaultSets: 4,
    defaultReps: 8,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_seated_row',
    name: '坐姿划船',
    muscleGroup: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    difficulty: 2,
    description: '器械水平拉，易于控制轨迹。',
    cues: ['挺胸', '肩胛后缩', '不要过度后仰'],
    commonMistakes: ['甩腰借力', '耸肩'],
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 75,
    isCompound: true,
  },
  {
    id: 'ex_ohp',
    name: '哑铃肩推',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    difficulty: 3,
    description: '发展三角肌前中束与推举力量。',
    cues: ['核心收紧', '不耸肩', '轨迹贴近耳侧'],
    commonMistakes: ['过度后仰', '半程推举'],
    defaultSets: 3,
    defaultReps: 8,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_lateral_raise',
    name: '侧平举',
    muscleGroup: 'shoulders',
    equipment: 'dumbbell',
    difficulty: 2,
    description: '三角肌中束孤立动作。',
    cues: ['微屈肘', '倒水姿势', '顶端不超肩过多'],
    commonMistakes: ['借力甩', '耸肩'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    isCompound: false,
  },
  {
    id: 'ex_face_pull',
    name: '面拉',
    muscleGroup: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'cable',
    difficulty: 2,
    description: '后束与肩袖健康友好动作。',
    cues: ['绳拉向面部', '外旋', '肘高位'],
    commonMistakes: ['重量过大变划船', '耸肩'],
    defaultSets: 3,
    defaultReps: 15,
    defaultRestSec: 60,
    isCompound: false,
  },
  {
    id: 'ex_curl',
    name: '二头弯举',
    muscleGroup: 'biceps',
    equipment: 'dumbbell',
    difficulty: 1,
    description: '肱二头肌孤立训练。',
    cues: ['肘固定', '顶端挤压', '慢放'],
    commonMistakes: ['前后晃身', '完全借力'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    isCompound: false,
  },
  {
    id: 'ex_pushdown',
    name: '绳索下压',
    muscleGroup: 'triceps',
    equipment: 'cable',
    difficulty: 1,
    description: '肱三头肌下压，可用直杆或绳。',
    cues: ['肘贴身', '伸直不锁死暴力', '控制回位'],
    commonMistakes: ['肘外撇过多', '借肩下压'],
    defaultSets: 3,
    defaultReps: 12,
    defaultRestSec: 60,
    isCompound: false,
  },
  {
    id: 'ex_plank',
    name: '平板支撑',
    muscleGroup: 'core',
    equipment: 'bodyweight',
    difficulty: 1,
    description: '核心抗伸展基础动作，以时间计组。',
    cues: ['身体一条直线', '臀不撅不高', '均匀呼吸'],
    commonMistakes: ['塌腰', '耸肩', '憋气'],
    defaultSets: 3,
    defaultReps: 45,
    defaultRestSec: 45,
    isCompound: false,
  },
  {
    id: 'ex_hip_thrust',
    name: '臀推',
    muscleGroup: 'glutes',
    secondaryMuscles: ['legs'],
    equipment: 'barbell',
    difficulty: 2,
    description: '强化臀大肌，对髋伸力量与体态有帮助。',
    cues: ['下巴微收', '顶端挤压臀', '肋骨下压'],
    commonMistakes: ['过度挺腰', '行程过短'],
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 90,
    isCompound: true,
  },
  {
    id: 'ex_lunges',
    name: '弓步蹲',
    muscleGroup: 'legs',
    secondaryMuscles: ['glutes'],
    equipment: 'dumbbell',
    difficulty: 2,
    description: '单侧下肢训练，改善平衡与稳定性。',
    cues: ['前膝不内扣', '躯干直立', '步距适中'],
    commonMistakes: ['前膝过尖', '后膝砸地'],
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 75,
    isCompound: true,
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export type ExerciseDetailViewModel = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string;
  equipment: string;
  difficulty: string;
  description: string;
  defaults: {
    sets: string;
    reps: string;
    rest: string;
  };
  cues: string[];
  commonMistakes: string[];
  primaryAction: {
    label: string;
    route: '/workout/session' | '/(tabs)/workout';
  };
};

const MUSCLE_LABELS: Record<string, string> = {
  chest: '胸部',
  back: '背部',
  shoulders: '肩部',
  biceps: '肱二头肌',
  triceps: '肱三头肌',
  legs: '腿部',
  glutes: '臀部',
  core: '核心',
  full_body: '全身',
  cardio: '心肺',
};

const EQUIPMENT_LABELS: Record<string, string> = {
  none: '无需器械',
  dumbbells: '哑铃',
  full_gym: '健身房器械',
  home_basic: '居家基础器械',
  barbell: '杠铃',
  cable: '绳索器械',
  machine: '固定器械',
  bodyweight: '徒手',
  dumbbell: '哑铃',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '入门',
  2: '简单',
  3: '中等',
  4: '较难',
  5: '高难',
};

export function normalizeExerciseRouteId(routeId: unknown): string | null {
  const candidate = Array.isArray(routeId) ? routeId[0] : routeId;
  if (typeof candidate !== 'string') return null;
  const normalized = candidate.trim();
  return normalized.length > 0 ? normalized : null;
}

function formatRestDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} 秒`;
  if (remainingSeconds === 0) return `${minutes} 分钟`;
  return `${minutes} 分 ${remainingSeconds} 秒`;
}

export function createExerciseDetailViewModel(
  routeId: unknown,
  hasActiveSession: boolean,
): ExerciseDetailViewModel | null {
  const id = normalizeExerciseRouteId(routeId);
  const exercise = id ? getExerciseById(id) : undefined;
  if (!exercise) return null;

  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscle: MUSCLE_LABELS[exercise.muscleGroup] ?? '其他',
    secondaryMuscles:
      exercise.secondaryMuscles?.map((muscle) => MUSCLE_LABELS[muscle] ?? '其他').join('、') ??
      '无',
    equipment: EQUIPMENT_LABELS[exercise.equipment] ?? '其他器械',
    difficulty: `${DIFFICULTY_LABELS[exercise.difficulty] ?? '未知'} · ${exercise.difficulty}/5`,
    description: exercise.description,
    defaults: {
      sets: `${exercise.defaultSets} 组`,
      reps: `${exercise.defaultReps} 次`,
      rest: formatRestDuration(exercise.defaultRestSec),
    },
    cues: exercise.cues,
    commonMistakes: exercise.commonMistakes,
    primaryAction: hasActiveSession
      ? { label: '进入当前训练', route: '/workout/session' }
      : { label: '返回训练计划', route: '/(tabs)/workout' },
  };
}
