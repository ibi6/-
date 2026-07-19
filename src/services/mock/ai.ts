import type { AIApi } from '@/services/api/interfaces';
import type { AIContext, AIResponse, FoodRecognitionResult, WorkoutPlan } from '@/types';
import { AppConfig } from '@/constants';
import { mockDelay } from '@/services/api/types';
import { FOODS, buildWeeklyPlan } from '@/data';
import { generateId, randomBetween, sleep } from '@/utils/date';

const SAFETY_DISCLAIMER =
  '本建议仅供参考，不能替代专业医疗诊断。如有伤病或不适，请咨询医生或专业教练。';

async function think() {
  await sleep(randomBetween(AppConfig.aiThinkingMs.min, AppConfig.aiThinkingMs.max));
}

function baseResponse(partial: Omit<AIResponse, 'id'>): AIResponse {
  return { id: generateId('ai'), ...partial };
}

function matchKeyword(input: string, context: AIContext): AIResponse {
  const text = input.toLowerCase();
  const proteinTarget = context.nutritionSummary?.targets?.protein ?? 120;
  const proteinRemaining = context.nutritionSummary?.remaining?.protein ?? proteinTarget;

  if (/膝盖|膝痛|受伤|疼痛|疼/.test(text)) {
    return baseResponse({
      category: 'safety',
      text: '听到你有不适，我建议立刻降低负荷并停止引起疼痛的动作。可以用靠墙静蹲替代或改做上肢训练，避免深蹲/弓步等加压动作。',
      cards: [
        {
          id: 'card_safety',
          type: 'warning',
          title: '安全优先',
          body: '疼痛不是“坚持就好”。若肿胀、绞锁或夜间痛，请就医评估。',
          primaryActionLabel: '查看恢复建议',
          primaryActionId: 'safety_tips',
        },
      ],
      actions: [{ id: 'adjust', label: '调整今日计划', type: 'apply_plan' }],
      disclaimer: SAFETY_DISCLAIMER,
    });
  }

  if (/火锅/.test(text)) {
    return baseResponse({
      category: 'nutrition',
      text: '火锅可以吃，关键是控制油碟与淀粉主食。建议：多涮菜和瘦肉，少油炸丸子；汤底少喝；正餐后第二天略提高蛋白、控制油脂。',
      cards: [
        {
          id: 'card_hotpot',
          type: 'meal',
          title: '火锅友好吃法',
          subtitle: '约 700–900 kcal / 份估算',
          body: '瘦牛肉/虾 + 蔬菜 + 适量主食，蘸料选蒜泥香醋少麻酱。',
          metrics: [
            { label: '蛋白', value: '35–45g' },
            { label: '策略', value: '记录即可' },
          ],
          primaryActionLabel: '一键添加火锅',
          primaryActionId: 'add_hotpot',
        },
      ],
      actions: [
        {
          id: 'add_hotpot',
          label: '添加到今日晚餐',
          type: 'add_food',
          payload: { foodId: 'food_hotpot', weightG: 400 },
        },
      ],
      disclaimer: '估算值，实际因食材差异较大。',
    });
  }

  if (/晚餐|晚饭|tonight|dinner/.test(text)) {
    return baseResponse({
      category: 'nutrition',
      text: '结合你今日剩余热量，推荐一餐高蛋白、中碳水的晚餐，帮助恢复又不过量。',
      cards: [
        {
          id: 'card_dinner',
          type: 'meal',
          title: '推荐晚餐',
          subtitle: '鸡胸 + 红薯 + 西兰花',
          body: '约 520 kcal · 蛋白 45g · 适合减脂日。',
          metrics: [
            { label: '热量', value: '520' },
            { label: '蛋白', value: '45g' },
          ],
          primaryActionLabel: '添加到饮食',
          primaryActionId: 'add_dinner',
        },
      ],
      actions: [{ id: 'add_dinner', label: '添加推荐晚餐', type: 'add_food' }],
    });
  }

  if (/蛋白|蛋白质|protein/.test(text)) {
    return baseResponse({
      category: 'nutrition',
      text: `你的蛋白目标是 ${proteinTarget}g，今日还差约 ${Math.max(0, Math.round(proteinRemaining))}g。优先整食：鸡胸、虾、希腊酸奶、豆腐；训练后可用一勺蛋白粉补齐。`,
      cards: [
        {
          id: 'card_protein',
          type: 'tip',
          title: '补蛋白小技巧',
          body: '每餐 25–40g 蛋白，分散摄入吸收更稳；加餐可选酸奶+坚果。',
        },
      ],
    });
  }

  if (/没动力|躺平|不想练|懒|坚持不了/.test(text)) {
    return baseResponse({
      category: 'workout',
      text: '状态不佳很正常。把目标改成「只做 20 分钟启动组」——完成热身 + 2 个复合动作就算胜利。动力往往在开始之后出现。',
      cards: [
        {
          id: 'card_motivation',
          type: 'workout',
          title: '微训练启动包',
          body: '俯卧撑 3×10 · 弓步蹲 3×8 · 平板 3×30s，预计 18 分钟。',
          primaryActionLabel: '开始微训练',
          primaryActionId: 'start_micro',
        },
      ],
      actions: [{ id: 'start_micro', label: '开始微训练', type: 'start_workout' }],
    });
  }

  if (/调整计划|换计划|改计划|太难|太累/.test(text)) {
    return baseResponse({
      category: 'workout',
      text: '已为你生成一版降容量方案：保留复合动作，组数 −1，休息日保留。你仍可按原计划训练。',
      cards: [
        {
          id: 'card_adjust',
          type: 'workout',
          title: '本周轻量计划',
          body: '训练日 3 天 · 每课 35–40 分钟 · 强调技术与恢复。',
          primaryActionLabel: '应用调整',
          primaryActionId: 'apply_adjust',
        },
      ],
      actions: [{ id: 'apply_adjust', label: '应用调整计划', type: 'apply_plan' }],
    });
  }

  return baseResponse({
    category: 'general',
    text: '我是你的 FitAI 教练与营养顾问。可以问我：晚餐怎么吃、蛋白质怎么补、膝盖不适怎么办、训练计划怎么调整，或直接说「没动力」。',
    cards: [
      {
        id: 'card_general',
        type: 'tip',
        title: '你可以这样问',
        body: '「推荐一顿减脂晚餐」「今天蛋白不够怎么办」「深蹲膝盖不舒服」',
      },
    ],
    disclaimer: SAFETY_DISCLAIMER,
  });
}

export const mockAIApi: AIApi = {
  async sendMessage(input, context) {
    await think();
    return matchKeyword(input, context);
  },

  async recognizeFood(imageUri) {
    await mockDelay();
    await think();
    const picks = [FOODS[0], FOODS[4], FOODS[15]].filter(Boolean);
    const result: FoodRecognitionResult = {
      imageUri,
      candidates: picks.map((f, i) => ({
        foodId: f.id,
        name: f.name,
        confidence: 0.92 - i * 0.12,
        suggestedWeightG: f.commonServingG,
      })),
    };
    return result;
  },

  async adjustWorkout(request) {
    await mockDelay();
    await think();
    const plan = buildWeeklyPlan();
    const adjusted: WorkoutPlan = {
      ...plan,
      id: generateId('plan_adj'),
      days: plan.days.map((d) => {
        if (d.isRestDay) return d;
        if (request.painArea && /膝|腿/.test(request.painArea) && /腿|下肢/.test(d.title)) {
          return {
            ...d,
            title: d.title + '（已规避下肢冲击）',
            exercises: d.exercises
              .filter((e) => !['ex_squat', 'ex_lunges', 'ex_leg_press'].includes(e.exerciseId))
              .map((e) => ({ ...e, sets: Math.max(2, e.sets - 1) })),
          };
        }
        return {
          ...d,
          estimatedMinutes: Math.max(25, d.estimatedMinutes - 10),
          exercises: d.exercises.map((e) => ({ ...e, sets: Math.max(2, e.sets - 1) })),
        };
      }),
    };
    return adjusted;
  },
};
