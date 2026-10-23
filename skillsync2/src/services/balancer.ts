import { BalancingMetrics, TeamOption } from '../types';

export interface StudentBalancingData {
  name: string;
  score: number;
  skills: Record<string, number>;
}

export interface InternalEvaluation extends BalancingMetrics {
  objective: number;
}

// Pseudo-random number generator for reproducible balancer runs
class PseudoRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  uniform(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  sample<T>(arr: T[], count: number): T[] {
    const copy = [...arr];
    this.shuffle(copy);
    return copy.slice(0, count);
  }
}

function avg(v: number[]): number {
  return v.length > 0 ? v.reduce((sum, x) => sum + x, 0) / v.length : 0.0;
}

export function evaluate(
  teams: number[][],
  S: Record<number, StudentBalancingData>,
  prefer: [number, number][],
  avoid: [number, number][],
  reqW: Record<string, number>,
  tol: number
): InternalEvaluation {
  const where: Record<number, number> = {};
  teams.forEach((team, k) => {
    team.forEach((userId) => {
      where[userId] = k;
    });
  });

  const avgs = teams.map((team) => avg(team.map((id) => S[id]?.score || 0)));
  const spread = Math.max(...avgs) - Math.min(...avgs);

  let unmet = 0;
  for (const [a, b] of prefer) {
    if (where[a] !== undefined && where[b] !== undefined && where[a] !== where[b]) {
      unmet++;
    }
  }

  let viol = 0;
  for (const [a, b] of avoid) {
    if (where[a] !== undefined && where[b] !== undefined && where[a] === where[b]) {
      viol++;
    }
  }

  const gaps: Record<string, number> = {};
  for (const skillName of Object.keys(reqW)) {
    const skillAverages = teams.map((team) =>
      avg(team.map((id) => S[id]?.skills?.[skillName] || 0))
    );
    gaps[skillName] = Number(
      (Math.max(...skillAverages) - Math.min(...skillAverages)).toFixed(2)
    );
  }

  let cov = 0;
  for (const [name, g] of Object.entries(gaps)) {
    cov += (reqW[name] || 0) * g;
  }

  const objective =
    10 * Math.max(0.0, spread - tol) + spread + 0.05 * unmet + 0.4 * viol + 0.1 * cov;

  return {
    objective,
    spread: Number(spread.toFixed(3)),
    withinTolerance: spread <= tol,
    avgs: avgs.map((a) => Number(a.toFixed(2))),
    preferMet: prefer.length - unmet,
    preferTotal: prefer.length,
    avoidViolations: viol,
    skillGaps: gaps,
  };
}

function buildCandidate(
  S: Record<number, StudentBalancingData>,
  K: number,
  leaders: number[],
  prefer: [number, number][],
  avoid: [number, number][],
  reqW: Record<string, number>,
  tol: number,
  rng: PseudoRandom,
  iters: number
): number[][] {
  const ids = Object.keys(S)
    .map(Number)
    .sort((a, b) => S[b].score - S[a].score);

  const base = Math.floor(ids.length / K);
  const extra = ids.length % K;
  const cap = Array.from({ length: K }, (_, k) => base + (k < extra ? 1 : 0));

  const teams: number[][] = Array.from({ length: K }, () => []);
  const order = Array.from({ length: K }, (_, k) => k);
  rng.shuffle(order);

  const lead = leaders.slice(0, K);
  lead.forEach((uid, pos) => {
    teams[order[pos]].push(uid);
  });

  const locked = new Set(lead);
  const rest = ids.filter((id) => !locked.has(id));
  rest.sort((a, b) => -(S[a].score + rng.uniform(-0.15, 0.15) - (S[b].score + rng.uniform(-0.15, 0.15))));

  for (const uid of rest) {
    const openTeams = Array.from({ length: K }, (_, k) => k).filter(
      (k) => teams[k].length < cap[k]
    );

    let bestK = openTeams[0];
    let minScore = Infinity;
    for (const k of openTeams) {
      const currentTeamScore = teams[k].reduce((sum, id) => sum + S[id].score, 0);
      const scoreWithNoise = currentTeamScore + rng.next() * 0.001;
      if (scoreWithNoise < minScore) {
        minScore = scoreWithNoise;
        bestK = k;
      }
    }
    teams[bestK].push(uid);
  }

  let cur = evaluate(teams, S, prefer, avoid, reqW, tol).objective;

  for (let it = 0; it < iters; it++) {
    const [a, b] = rng.sample(
      Array.from({ length: K }, (_, k) => k),
      2
    );
    const xa = teams[a]
      .map((uid, idx) => ({ uid, idx }))
      .filter((item) => !locked.has(item.uid))
      .map((item) => item.idx);
    const xb = teams[b]
      .map((uid, idx) => ({ uid, idx }))
      .filter((item) => !locked.has(item.uid))
      .map((item) => item.idx);

    if (xa.length === 0 || xb.length === 0) continue;

    const x = rng.choice(xa);
    const y = rng.choice(xb);

    const temp = teams[a][x];
    teams[a][x] = teams[b][y];
    teams[b][y] = temp;

    const nextObjective = evaluate(teams, S, prefer, avoid, reqW, tol).objective;
    if (nextObjective <= cur) {
      cur = nextObjective;
    } else {
      // Revert swap
      const revert = teams[a][x];
      teams[a][x] = teams[b][y];
      teams[b][y] = revert;
    }
  }

  return teams;
}

export function generateOptions(
  S: Record<number, StudentBalancingData>,
  K: number,
  leaders: number[],
  prefer: [number, number][],
  avoid: [number, number][],
  reqW: Record<string, number>,
  tol: number,
  restarts: number = 8,
  iters: number = 2500,
  seed: number = 42
): Array<{ teams: TeamOption[]; metrics: BalancingMetrics }> {
  const rng = new PseudoRandom(seed);
  const foundMap = new Map<string, number[][]>();

  for (let r = 0; r < restarts; r++) {
    const teams = buildCandidate(S, K, leaders, prefer, avoid, reqW, tol, rng, iters);
    // Key by normalized set representation
    const key = teams
      .map((t) => [...t].sort((a, b) => a - b).join(','))
      .sort()
      .join('|');
    if (!foundMap.has(key)) {
      foundMap.set(key, teams);
    }
  }

  const ranked: Array<{
    objective: number;
    teams: number[][];
    metrics: InternalEvaluation;
  }> = [];

  for (const candidateTeams of foundMap.values()) {
    const m = evaluate(candidateTeams, S, prefer, avoid, reqW, tol);
    ranked.push({ objective: m.objective, teams: candidateTeams, metrics: m });
  }

  ranked.sort((a, b) => a.objective - b.objective);

  const leaderSet = new Set(leaders.slice(0, K));
  const options: Array<{ teams: TeamOption[]; metrics: BalancingMetrics }> = [];

  for (const { teams, metrics } of ranked.slice(0, 3)) {
    const built: TeamOption[] = [];
    teams.forEach((teamList, idx) => {
      const teamNo = idx + 1;
      const members = [...teamList].sort((a, b) => {
        const aLead = leaderSet.has(a) ? 1 : 0;
        const bLead = leaderSet.has(b) ? 1 : 0;
        if (aLead !== bLead) return bLead - aLead;
        return S[b].score - S[a].score;
      });

      built.push({
        teamNo,
        avg: Number(avg(teamList.map((id) => S[id].score)).toFixed(2)),
        members: members.map((id) => ({
          userId: id,
          name: S[id].name,
          score: S[id].score,
          isLeader: leaderSet.has(id),
        })),
      });
    });

    const { objective, ...cleanMetrics } = metrics;
    options.push({
      teams: built,
      metrics: {
        ...cleanMetrics,
        withinTolerance: cleanMetrics.spread <= tol,
      },
    });
  }

  return options;
}

export function runFairnessReport(
  actualTeamUserIds: number[][],
  S: Record<number, StudentBalancingData>,
  prefer: [number, number][],
  avoid: [number, number][],
  reqW: Record<string, number>,
  tol: number,
  competitionName: string,
  trials: number = 300
) {
  const placed = new Set<number>();
  actualTeamUserIds.forEach((t) => t.forEach((id) => placed.add(id)));

  const filteredPrefer = prefer.filter(([a, b]) => placed.has(a) && placed.has(b));
  const filteredAvoid = avoid.filter(([a, b]) => placed.has(a) && placed.has(b));

  const ours = evaluate(actualTeamUserIds, S, filteredPrefer, filteredAvoid, reqW, tol);
  const sizes = actualTeamUserIds.map((t) => t.length);

  const rng = new PseudoRandom(1);
  const ids = Array.from(placed);

  const spreads: number[] = [];
  const met: number[] = [];
  const broken: number[] = [];
  const gaps: number[] = [];

  for (let t = 0; t < trials; t++) {
    rng.shuffle(ids);
    let pos = 0;
    const randomTeams: number[][] = [];
    for (const size of sizes) {
      randomTeams.push(ids.slice(pos, pos + size));
      pos += size;
    }

    const m = evaluate(randomTeams, S, filteredPrefer, filteredAvoid, reqW, tol);
    spreads.push(m.spread);
    met.push(m.preferMet);
    broken.push(m.avoidViolations);
    gaps.push(Object.values(m.skillGaps).reduce((sum, g) => sum + g, 0));
  }

  const avgValue = (arr: number[]) =>
    Number((arr.reduce((sum, v) => sum + v, 0) / arr.length).toFixed(2));

  return {
    competition: competitionName,
    tolerance: tol,
    trials,
    ours: {
      spread: ours.spread,
      withinTolerance: ours.spread <= tol,
      preferMet: ours.preferMet,
      preferTotal: ours.preferTotal,
      avoidViolations: ours.avoidViolations,
      skillGap: Number(
        Object.values(ours.skillGaps)
          .reduce((sum, g) => sum + g, 0)
          .toFixed(2)
      ),
    },
    random: {
      avgSpread: avgValue(spreads),
      pctWithinTolerance: Math.round(
        (100 * spreads.filter((s) => s <= tol).length) / trials
      ),
      avgPreferMet: avgValue(met),
      avgAvoidViolations: avgValue(broken),
      avgSkillGap: avgValue(gaps),
    },
  };
}
