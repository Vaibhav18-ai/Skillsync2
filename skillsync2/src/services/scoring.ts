import { StudentSkill } from '../types';

export function skillScore(proficiency: number, experience: number, assessment: number): number {
  return Number((0.5 * (proficiency * 2) + 0.3 * experience + 0.2 * assessment).toFixed(2));
}

export function generalScore(rows: StudentSkill[]): number {
  if (!rows || rows.length === 0) {
    return 0.0;
  }
  const total = rows.reduce(
    (sum, r) => sum + skillScore(r.proficiency, r.experienceScore, r.assessmentScore),
    0
  );
  return Number((total / rows.length).toFixed(2));
}

export interface CompetitionFitItem {
  skill: string;
  weight: number;
  score: number;
  proficiency: number;
  minLevel: number;
  mandatory: boolean;
}

export interface CompetitionFitResult {
  score: number;
  eligible: boolean;
  missing: string[];
  breakdown: Array<{
    skill: string;
    weight: number;
    score: number;
  }>;
}

export function competitionFit(items: CompetitionFitItem[]): CompetitionFitResult {
  const totalW = items.reduce((sum, i) => sum + i.weight, 0);
  if (!totalW) {
    return { score: 0.0, eligible: false, missing: [], breakdown: [] };
  }
  const score = items.reduce((sum, i) => sum + i.weight * i.score, 0) / totalW;
  const missing = items
    .filter((i) => i.mandatory && i.proficiency < i.minLevel)
    .map((i) => i.skill);

  return {
    score: Number(score.toFixed(2)),
    eligible: missing.length === 0,
    missing,
    breakdown: items.map((i) => ({
      skill: i.skill,
      weight: i.weight,
      score: i.score,
    })),
  };
}

export function leadershipScore(rows: StudentSkill[], availabilityHours: number): number {
  if (!rows || rows.length === 0) {
    return 0.0;
  }
  const exp = rows.reduce((sum, r) => sum + r.experienceScore, 0) / rows.length;
  const ass = rows.reduce((sum, r) => sum + r.assessmentScore, 0) / rows.length;
  const avail = Math.min(10.0, (availabilityHours || 0) / 2); // 20 hours/week = 10
  return Number((0.4 * exp + 0.3 * ass + 0.3 * avail).toFixed(2));
}
