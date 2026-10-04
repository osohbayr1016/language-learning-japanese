export type JlptSelfLevel = 'none' | 'n5' | 'n4' | 'n3' | 'n2' | 'n1';

export type LearningReason = 'university' | 'career' | 'travel' | 'culture' | 'fun';

export type SetupAnswers = {
  level: JlptSelfLevel | null;
  placementLevel: Exclude<JlptSelfLevel, 'none'> | null;
  reason: LearningReason | null;
  name: string;
  email: string;
  password: string;
};

export const TOTAL_STEPS = 5;

/** @deprecated */
export type ChineseLevel = JlptSelfLevel;
