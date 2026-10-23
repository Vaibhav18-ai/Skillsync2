export type Role = 'student' | 'coordinator' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface StudentSkill {
  userId: number;
  skillId: number;
  proficiency: number; // 1-5
  experienceScore: number; // 0-10
  assessmentScore: number; // 0-10
}

export interface PortfolioProject {
  id: string;
  title: string;
  repoUrl: string;
  demoUrl?: string;
  description: string;
  techStack: string[];
}

export interface StudentProfile {
  userId: number;
  interests?: string;
  availabilityHours: number;
  preferredRole?: string;
  githubUrl?: string;
  bio?: string;
  portfolioProjects?: PortfolioProject[];
  certifications?: string[];
  achievements?: string[];
}

export type CompetitionStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'teams_proposed'
  | 'under_review'
  | 'finalized'
  | 'ongoing'
  | 'completed';

export interface CompetitionRequirement {
  skillId: number;
  skill: string;
  weight: number;
  minLevel: number;
  mandatory: boolean;
}

export interface Competition {
  id: number;
  coordinatorId: number;
  name: string;
  description?: string;
  compType?: string;
  compTypes: string[]; // collection of 1 or more competition tracks
  teamSize: number; // target team size
  minTeamSize?: number; // variable team size minimum
  maxTeamSize?: number; // variable team size maximum
  numTeams: number;
  scaleTier?: 'classroom' | 'school' | 'national' | 'international';
  fairnessTolerance: number;
  formationMode: 'balanced' | 'preference' | 'self';
  status: CompetitionStatus;
  deadline?: string;
  joinCode: string;
  requirements: CompetitionRequirement[];
  // Student computed properties
  myFit?: number;
  eligible?: boolean;
  missing?: string[];
  myStatus?: 'applied' | 'confirmed' | 'withdrawn' | null;
  myApplication?: {
    status: 'applied' | 'confirmed' | 'withdrawn';
    wantsToLead: boolean;
  } | null;
}

export interface CompetitionApplication {
  competitionId: number;
  userId: number;
  status: 'applied' | 'confirmed' | 'withdrawn';
  wantsToLead: boolean;
  createdAt: string;
}

export interface TeammatePreference {
  competitionId: number;
  userId: number;
  otherUserId: number;
  kind: 'prefer' | 'avoid';
}

export interface TeamMemberInfo {
  userId: number;
  name: string;
  score: number;
  isLeader: boolean;
  hours?: number;
}

export interface TeamOption {
  teamNo: number;
  avg: number;
  members: TeamMemberInfo[];
}

export interface BalancingMetrics {
  spread: number;
  withinTolerance: boolean;
  avgs: number[];
  preferMet: number;
  preferTotal: number;
  avoidViolations: number;
  skillGaps: Record<string, number>;
}

export interface RecommendationRun {
  runId: number;
  competitionId: number;
  options: Array<{
    teams: TeamOption[];
    metrics: BalancingMetrics;
  }>;
  warnings: string[];
  students: number;
  tol: number;
}

export interface Team {
  id: number;
  competitionId: number;
  teamNo: number;
  leaderId: number | null;
  avgScore: number;
  competitionName?: string;
  projectTitle?: string;
  projectDescription?: string;
  projectRepoUrl?: string;
  submissionNotes?: string;
  isSubmitted?: boolean;
  evaluationScore?: number;
  feedback?: string;
}

export interface TeamMember {
  id: number;
  teamId: number;
  competitionId: number;
  userId: number;
  isLeader: boolean;
  score: number;
}

export interface Task {
  id: number;
  teamId: number;
  title: string;
  description?: string;
  assigneeId: number | null;
  estimatedHours: number;
  deadline: string | null;
  status: 'todo' | 'doing' | 'done';
  createdBy?: number;
  createdAt: string;
}

export interface Milestone {
  id: number;
  teamId: number;
  title: string;
  dueDate: string | null;
  done: boolean;
}

export interface FairnessReport {
  competition: string;
  tolerance: number;
  trials: number;
  ours: {
    spread: number;
    withinTolerance: boolean;
    preferMet: number;
    preferTotal: number;
    avoidViolations: number;
    skillGap: number;
  };
  random: {
    avgSpread: number;
    pctWithinTolerance: number;
    avgPreferMet: number;
    avgAvoidViolations: number;
    avgSkillGap: number;
  };
}

export type ScaleTier = 'classroom' | 'school' | 'national' | 'international';

export interface ScaleTierOption {
  id: ScaleTier;
  label: string;
  range: string;
  icon: string;
  defaultTeams: number;
  minSize: number;
  targetSize: number;
  maxSize: number;
  description: string;
}

export const SCALE_TIERS: ScaleTierOption[] = [
  {
    id: 'classroom',
    label: 'Classroom / Lab',
    range: '10 – 50 students',
    icon: '🏫',
    defaultTeams: 5,
    minSize: 3,
    targetSize: 4,
    maxSize: 5,
    description: 'Course sections, lab groups, or recitation workshops (10–50 students).',
  },
  {
    id: 'school',
    label: 'School / College',
    range: '50 – 250 students',
    icon: '🎓',
    defaultTeams: 15,
    minSize: 3,
    targetSize: 5,
    maxSize: 6,
    description: 'Departmental challenges, university hackathons, campus clubs (50–250 students).',
  },
  {
    id: 'national',
    label: 'National Hackathon',
    range: '250 – 1,000+ students',
    icon: '🇮🇳',
    defaultTeams: 30,
    minSize: 4,
    targetSize: 5,
    maxSize: 8,
    description: 'Regional stages, nationwide collegiate challenges (250–1,000+ students).',
  },
  {
    id: 'international',
    label: 'International Challenge',
    range: '1,000 – 10,000+ students',
    icon: '🌍',
    defaultTeams: 100,
    minSize: 4,
    targetSize: 6,
    maxSize: 10,
    description: 'Worldwide global coding sprints, international developer challenges (1,000–10,000+ students).',
  },
];

export interface TrackOption {
  id: string;
  name: string;
  icon: string;
  badgeClass: string;
}

export const AVAILABLE_TRACKS: TrackOption[] = [
  { id: 'ml', name: 'AI / Machine Learning', icon: '🤖', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'web', name: 'Web Development', icon: '🌐', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'dsa', name: 'DSA / Coding', icon: '⚡', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  { id: 'hardware', name: 'Hardware / IoT', icon: '🔌', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'cyber', name: 'Cybersecurity', icon: '🛡️', badgeClass: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'fintech', name: 'FinTech & Blockchain', icon: '💳', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'open', name: 'Open Innovation', icon: '🚀', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' },
];
