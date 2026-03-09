import type { AttributeKey } from '../types/attributes';

export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  speed: 'السرعة',
  passing: 'التمرير',
  shooting: 'التسديد',
  dribbling: 'المراوغة',
  defense: 'الدفاع',
  stamina: 'التحمل',
  heading: 'الكرة الرأسية',
  overall: 'التقييم العام',
  leftFoot: 'القدم اليسرى',
  rightFoot: 'القدم اليمنى',
};

export const ATTRIBUTE_COLORS: Record<AttributeKey, string> = {
  speed: '#f97316',
  passing: '#3b82f6',
  shooting: '#ef4444',
  dribbling: '#8b5cf6',
  defense: '#22c55e',
  stamina: '#f59e0b',
  heading: '#06b6d4',
  overall: '#ec4899',
  leftFoot: '#14b8a6',
  rightFoot: '#6366f1',
};
