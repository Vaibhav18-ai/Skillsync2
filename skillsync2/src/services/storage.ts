import {
  User,
  Skill,
  StudentSkill,
  StudentProfile,
  Competition,
  CompetitionApplication,
  TeammatePreference,
  RecommendationRun,
  Team,
  TeamMember,
  Task,
  Milestone,
} from '../types';
import { skillScore, generalScore, competitionFit, leadershipScore } from './scoring';
import { generateOptions, runFairnessReport } from './balancer';

const STORAGE_KEY = 'skillsync_state_v1';

export const INITIAL_SKILLS: Skill[] = [
  { id: 1, name: 'Python', category: 'programming' },
  { id: 2, name: 'Java', category: 'programming' },
  { id: 3, name: 'C++', category: 'programming' },
  { id: 4, name: 'DSA', category: 'problem solving' },
  { id: 5, name: 'SQL', category: 'database' },
  { id: 6, name: 'HTML/CSS', category: 'web' },
  { id: 7, name: 'JavaScript', category: 'web' },
  { id: 8, name: 'React', category: 'web' },
  { id: 9, name: 'FastAPI', category: 'web' },
  { id: 10, name: 'Machine Learning', category: 'ai' },
  { id: 11, name: 'Data Analysis', category: 'ai' },
  { id: 12, name: 'Deep Learning', category: 'ai' },
  { id: 13, name: 'Electronics', category: 'hardware' },
  { id: 14, name: 'Embedded C', category: 'hardware' },
  { id: 15, name: 'IoT Sensors', category: 'hardware' },
];

const STUDENT_NAMES = [
  'Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Isha', 'Arjun', 'Sana', 'Vivaan', 'Anaya',
  'Dev', 'Tara', 'Ishaan', 'Riya', 'Neil', 'Kiara', 'Yash', 'Zoya', 'Ayaan', 'Pooja',
  'Kunal', 'Naina', 'Rahul', 'Mira', 'Samar', 'Tanvi', 'Veer', 'Alia', 'Om', 'Pari',
];

interface AppState {
  users: User[];
  skills: Skill[];
  studentProfiles: Record<number, StudentProfile>;
  studentSkills: StudentSkill[];
  competitions: Competition[];
  applications: CompetitionApplication[];
  preferences: TeammatePreference[];
  recommendationRuns: Record<number, RecommendationRun>;
  teams: Team[];
  teamMembers: TeamMember[];
  tasks: Task[];
  milestones: Milestone[];
}

// Pseudo-random for deterministic seed data
function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function initializeDefaultState(): AppState {
  const users: User[] = [
    {
      id: 100,
      name: 'Prof. Sharma',
      email: 'coordinator@skillsync.test',
      role: 'coordinator',
    },
  ];

  const studentProfiles: Record<number, StudentProfile> = {};
  const studentSkills: StudentSkill[] = [];
  const rand = pseudoRandom(42);

  const preferredRoles = ['backend', 'frontend', 'ml', 'hardware', 'coordinator'];
  const allSkillIds = INITIAL_SKILLS.map((s) => s.id);

  STUDENT_NAMES.forEach((name, idx) => {
    const userId = idx + 1;
    users.push({
      id: userId,
      name,
      email: `student${userId}@skillsync.test`,
      role: 'student',
    });

    const role = preferredRoles[Math.floor(rand() * preferredRoles.length)];
    studentProfiles[userId] = {
      userId,
      availabilityHours: Math.floor(rand() * 16) + 5, // 5 to 20
      preferredRole: role,
      interests: 'Passionate about building scalable systems, ML pipelines, and collaborating with peers.',
      githubUrl: `https://github.com/${name.toLowerCase()}`,
      bio: `Computer Science senior specializing in ${role} engineering, algorithm design, and agile hackathons.`,
      portfolioProjects: [
        {
          id: `proj-${userId}-1`,
          title: `${name}'s Streamlined Data Pipeline`,
          repoUrl: `https://github.com/${name.toLowerCase()}/data-pipeline`,
          demoUrl: `https://${name.toLowerCase()}-pipeline.demo.app`,
          description: 'High-throughput stream processing service with automated validation and analytics.',
          techStack: ['Python', 'FastAPI', 'SQL'],
        },
        {
          id: `proj-${userId}-2`,
          title: `Intelligent Edge Classifier`,
          repoUrl: `https://github.com/${name.toLowerCase()}/edge-ai`,
          description: 'Optimized neural network classification model deploying lightweight inference.',
          techStack: ['Machine Learning', 'Python'],
        },
      ],
      certifications: [
        'AWS Certified Cloud Practitioner',
        'DeepLearning.AI TensorFlow Developer',
      ],
      achievements: [
        'Top 10% Campus Hackathon 2025',
        'Dean’s Academic Excellence Award in Computer Science',
      ],
    };

    // Pick 5 to 8 skills for each student
    const count = Math.floor(rand() * 4) + 5;
    const shuffledSkills = [...allSkillIds].sort(() => rand() - 0.5);
    const chosenSkillIds = shuffledSkills.slice(0, count);

    for (const sid of chosenSkillIds) {
      studentSkills.push({
        userId,
        skillId: sid,
        proficiency: Math.floor(rand() * 5) + 1, // 1 to 5
        experienceScore: Number((rand() * 7 + 2).toFixed(1)), // 2 to 9
        assessmentScore: Number((rand() * 7 + 2).toFixed(1)), // 2 to 9
      });
    }
  });

  const competitions: Competition[] = [
    {
      id: 1,
      coordinatorId: 100,
      name: 'Campus AI & Cloud Hackathon',
      description: '48-hour competitive machine learning, web services, and data engineering challenge for university students.',
      compType: 'ml',
      compTypes: ['ml', 'web'],
      teamSize: 6,
      minTeamSize: 4,
      maxTeamSize: 6,
      numTeams: 5,
      scaleTier: 'classroom',
      fairnessTolerance: 0.8,
      formationMode: 'preference',
      status: 'registration_open',
      deadline: '2026-11-20',
      joinCode: 'AI942F',
      requirements: [
        { skillId: 10, skill: 'Machine Learning', weight: 4, minLevel: 2, mandatory: true },
        { skillId: 1, skill: 'Python', weight: 3, minLevel: 1, mandatory: false },
        { skillId: 11, skill: 'Data Analysis', weight: 3, minLevel: 1, mandatory: false },
        { skillId: 4, skill: 'DSA', weight: 2, minLevel: 0, mandatory: false },
      ],
    },
    {
      id: 2,
      coordinatorId: 100,
      name: 'National Full-Stack & Cyber Innovation Derby',
      description: 'Build robust, highly secure web applications and data platforms across regional colleges.',
      compType: 'web',
      compTypes: ['web', 'cybersecurity', 'dsa'],
      teamSize: 5,
      minTeamSize: 4,
      maxTeamSize: 8,
      numTeams: 20,
      scaleTier: 'school',
      fairnessTolerance: 0.9,
      formationMode: 'preference',
      status: 'draft',
      deadline: '2026-12-05',
      joinCode: 'WEB77B',
      requirements: [
        { skillId: 8, skill: 'React', weight: 4, minLevel: 1, mandatory: true },
        { skillId: 7, skill: 'JavaScript', weight: 3, minLevel: 1, mandatory: false },
        { skillId: 9, skill: 'FastAPI', weight: 3, minLevel: 1, mandatory: false },
        { skillId: 5, skill: 'SQL', weight: 2, minLevel: 0, mandatory: false },
      ],
    },
  ];

  // Seed applications for Competition 1: all 30 students applied, 8 volunteers, preferences
  const applications: CompetitionApplication[] = [];
  const preferences: TeammatePreference[] = [];

  const randApp = pseudoRandom(7);
  // Pick 8 random volunteers
  const studentIds = Array.from({ length: 30 }, (_, i) => i + 1);
  const shuffledStudentIds = [...studentIds].sort(() => randApp() - 0.5);
  const volunteerSet = new Set(shuffledStudentIds.slice(0, 8));

  for (const uid of studentIds) {
    applications.push({
      competitionId: 1,
      userId: uid,
      status: 'confirmed',
      wantsToLead: volunteerSet.has(uid),
      createdAt: new Date().toISOString(),
    });
  }

  // 13 pairs: 10 prefer, 3 avoid
  const pairsSet = new Set<string>();
  const pairs: [number, number][] = [];
  while (pairs.length < 13) {
    const a = studentIds[Math.floor(randApp() * studentIds.length)];
    const b = studentIds[Math.floor(randApp() * studentIds.length)];
    if (a !== b && !pairsSet.has(`${a}-${b}`) && !pairsSet.has(`${b}-${a}`)) {
      pairsSet.add(`${a}-${b}`);
      pairs.push([a, b]);
    }
  }

  pairs.forEach(([a, b], idx) => {
    preferences.push({
      competitionId: 1,
      userId: a,
      otherUserId: b,
      kind: idx < 10 ? 'prefer' : 'avoid',
    });
  });

  return {
    users,
    skills: INITIAL_SKILLS,
    studentProfiles,
    studentSkills,
    competitions,
    applications,
    preferences,
    recommendationRuns: {},
    teams: [],
    teamMembers: [],
    tasks: [],
    milestones: [],
  };
}

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    const fresh = initializeDefaultState();
    this.saveState(fresh);
    return fresh;
  }

  private saveState(state: AppState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be full or disabled
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveState(this.state);
    this.listeners.forEach((l) => l());
  }

  getState(): AppState {
    return this.state;
  }

  resetToDefault() {
    this.state = initializeDefaultState();
    this.notify();
  }

  // Auth & User methods
  getUserByEmail(email: string): User | undefined {
    return this.state.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );
  }

  getUserById(id: number): User | undefined {
    return this.state.users.find((u) => u.id === id);
  }

  registerStudent(name: string, email: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) {
      throw new Error('This email is already registered.');
    }
    const newId = Math.max(...this.state.users.map((u) => u.id), 0) + 1;
    const newUser: User = {
      id: newId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: 'student',
    };
    this.state.users.push(newUser);
    this.state.studentProfiles[newId] = {
      userId: newId,
      availabilityHours: 10,
      preferredRole: 'fullstack',
      interests: '',
    };
    this.notify();
    return newUser;
  }

  // Student Profile & Skills
  getStudentSkills(userId: number) {
    return this.state.studentSkills.filter((ss) => ss.userId === userId);
  }

  getStudentProfile(userId: number) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('Student not found');
    const profile = this.state.studentProfiles[userId] || {
      userId,
      availabilityHours: 0,
    };
    const sSkills = this.getStudentSkills(userId);
    const skillsWithNames = sSkills.map((ss) => {
      const sk = this.state.skills.find((s) => s.id === ss.skillId);
      const score = skillScore(ss.proficiency, ss.experienceScore, ss.assessmentScore);
      return {
        skillId: ss.skillId,
        name: sk?.name || `Skill ${ss.skillId}`,
        category: sk?.category || 'other',
        proficiency: ss.proficiency,
        experienceScore: ss.experienceScore,
        assessmentScore: ss.assessmentScore,
        score,
      };
    });

    return {
      user: { id: user.id, name: user.name, email: user.email },
      profile,
      skills: skillsWithNames.sort((a, b) => b.score - a.score),
      generalScore: generalScore(sSkills),
    };
  }

  updateProfile(userId: number, data: Partial<StudentProfile>) {
    this.state.studentProfiles[userId] = {
      ...this.state.studentProfiles[userId],
      ...data,
      userId,
    };
    this.notify();
  }

  addPortfolioProject(
    userId: number,
    project: { title: string; repoUrl: string; demoUrl?: string; description: string; techStack: string[] }
  ) {
    if (!this.state.studentProfiles[userId]) {
      this.state.studentProfiles[userId] = { userId, availabilityHours: 10 };
    }
    const prof = this.state.studentProfiles[userId];
    if (!prof.portfolioProjects) {
      prof.portfolioProjects = [];
    }
    const newProj = {
      ...project,
      id: `proj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    prof.portfolioProjects.unshift(newProj);
    this.notify();
    return newProj;
  }

  deletePortfolioProject(userId: number, projectId: string) {
    const prof = this.state.studentProfiles[userId];
    if (prof && prof.portfolioProjects) {
      prof.portfolioProjects = prof.portfolioProjects.filter((p) => p.id !== projectId);
      this.notify();
    }
  }

  saveStudentSkills(
    userId: number,
    skills: Array<{ skillId: number; proficiency: number; experienceScore: number }>
  ) {
    // update or add
    for (const item of skills) {
      const existing = this.state.studentSkills.find(
        (ss) => ss.userId === userId && ss.skillId === item.skillId
      );
      if (existing) {
        existing.proficiency = item.proficiency;
        existing.experienceScore = item.experienceScore;
      } else {
        this.state.studentSkills.push({
          userId,
          skillId: item.skillId,
          proficiency: item.proficiency,
          experienceScore: item.experienceScore,
          assessmentScore: 5.0,
        });
      }
    }
    this.notify();
  }

  // Competitions
  getCompetitions(userId?: number, role?: string): Competition[] {
    const { competitions, applications, studentSkills } = this.state;
    let list = [...competitions];

    if (role === 'coordinator') {
      list = list.filter((c) => c.coordinatorId === userId);
    } else {
      list = list.filter((c) => c.status !== 'draft');
    }

    if (role === 'student' && userId) {
      const userSkillRows = new Map(
        studentSkills.filter((ss) => ss.userId === userId).map((ss) => [ss.skillId, ss])
      );

      list = list.map((c) => {
        const fitItems = c.requirements.map((r) => {
          const ss = userSkillRows.get(r.skillId);
          const score = ss
            ? skillScore(ss.proficiency, ss.experienceScore, ss.assessmentScore)
            : 0;
          return {
            skill: r.skill,
            weight: r.weight,
            score,
            proficiency: ss ? ss.proficiency : 0,
            minLevel: r.minLevel,
            mandatory: r.mandatory,
          };
        });

        const fit = competitionFit(fitItems);
        const app = applications.find(
          (a) => a.competitionId === c.id && a.userId === userId
        );

        return {
          ...c,
          myFit: fit.score,
          eligible: fit.eligible,
          missing: fit.missing,
          myStatus: app ? app.status : null,
          myApplication: app
            ? { status: app.status, wantsToLead: app.wantsToLead }
            : null,
        };
      });

      list.sort((a, b) => (b.myFit || 0) - (a.myFit || 0));
    }

    return list;
  }

  getCompetitionById(id: number, userId?: number, role?: string): Competition | undefined {
    const list = this.getCompetitions(userId, role);
    return list.find((c) => c.id === id);
  }

  createCompetition(
    coordinatorId: number,
    data: Omit<Competition, 'id' | 'coordinatorId' | 'status' | 'joinCode'>
  ): Competition {
    const newId = Math.max(...this.state.competitions.map((c) => c.id), 0) + 1;
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const compTypes = data.compTypes && data.compTypes.length > 0
      ? data.compTypes
      : [data.compType || 'ml'];
    const newComp: Competition = {
      ...data,
      compTypes,
      compType: compTypes[0],
      minTeamSize: data.minTeamSize || Math.max(2, data.teamSize - 1),
      maxTeamSize: data.maxTeamSize || data.teamSize + 2,
      scaleTier: data.scaleTier || (data.numTeams >= 50 ? 'national' : data.numTeams >= 15 ? 'school' : 'classroom'),
      id: newId,
      coordinatorId,
      status: 'draft',
      joinCode,
    };
    this.state.competitions.unshift(newComp);
    this.notify();
    return newComp;
  }

  publishCompetition(id: number) {
    const c = this.state.competitions.find((x) => x.id === id);
    if (!c) throw new Error('Competition not found');
    if (c.status !== 'draft') throw new Error('Only draft competitions can be published');
    c.status = 'registration_open';
    this.notify();
  }

  closeRegistration(id: number) {
    const c = this.state.competitions.find((x) => x.id === id);
    if (!c) throw new Error('Competition not found');
    if (c.status !== 'registration_open') throw new Error('Registration is not open');
    c.status = 'registration_closed';
    this.notify();
  }

  applyToCompetition(competitionId: number, userId: number, wantsToLead: boolean) {
    const c = this.state.competitions.find((x) => x.id === competitionId);
    if (!c) throw new Error('Competition not found');
    if (c.status !== 'registration_open') {
      throw new Error('Registration is not open for this competition.');
    }
    const app = this.state.applications.find(
      (a) => a.competitionId === competitionId && a.userId === userId
    );
    if (app) {
      app.status = 'confirmed';
      app.wantsToLead = wantsToLead;
    } else {
      this.state.applications.push({
        competitionId,
        userId,
        status: 'confirmed',
        wantsToLead,
        createdAt: new Date().toISOString(),
      });
    }
    this.notify();
  }

  withdrawApplication(competitionId: number, userId: number) {
    const app = this.state.applications.find(
      (a) => a.competitionId === competitionId && a.userId === userId
    );
    if (!app) throw new Error('You have not applied');
    app.status = 'withdrawn';
    this.notify();
  }

  getApplicants(competitionId: number) {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const confirmedApps = this.state.applications.filter(
      (a) => a.competitionId === competitionId && a.status === 'confirmed'
    );

    const applicants = confirmedApps.map((app) => {
      const user = this.getUserById(app.userId)!;
      const fitItems = comp.requirements.map((r) => {
        const ss = this.state.studentSkills.find(
          (s) => s.userId === app.userId && s.skillId === r.skillId
        );
        const score = ss
          ? skillScore(ss.proficiency, ss.experienceScore, ss.assessmentScore)
          : 0;
        return {
          skill: r.skill,
          weight: r.weight,
          score,
          proficiency: ss ? ss.proficiency : 0,
          minLevel: r.minLevel,
          mandatory: r.mandatory,
        };
      });
      const fit = competitionFit(fitItems);
      return {
        userId: user.id,
        name: user.name,
        score: fit.score,
        wantsToLead: app.wantsToLead,
        eligible: fit.eligible,
      };
    });

    applicants.sort((a, b) => b.score - a.score);
    return {
      competition: comp.name,
      count: applicants.length,
      applicants,
    };
  }

  // Teammate preferences
  addPreference(competitionId: number, userId: number, otherUserId: number, kind: 'prefer' | 'avoid') {
    if (userId === otherUserId) throw new Error('You cannot choose yourself.');
    const userApp = this.state.applications.find(
      (a) => a.competitionId === competitionId && a.userId === userId && a.status === 'confirmed'
    );
    const otherApp = this.state.applications.find(
      (a) => a.competitionId === competitionId && a.userId === otherUserId && a.status === 'confirmed'
    );
    if (!userApp) throw new Error('Join the competition first.');
    if (!otherApp) throw new Error('That student has not joined this competition.');

    const existing = this.state.preferences.filter(
      (p) => p.competitionId === competitionId && p.userId === userId && p.kind === kind
    );
    if (existing.some((p) => p.otherUserId === otherUserId)) {
      throw new Error('You have already added this student.');
    }
    if (existing.length >= 3) {
      throw new Error('You can add up to 3 students for each type.');
    }

    this.state.preferences.push({
      competitionId,
      userId,
      otherUserId,
      kind,
    });
    this.notify();
  }

  getPreferences(competitionId: number, userId: number) {
    return this.state.preferences.filter(
      (p) => p.competitionId === competitionId && p.userId === userId
    );
  }

  // Balancer Run & Teams
  seedScaleApplicants(competitionId: number, targetCount: number): number {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const firstNames = [
      'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Sam', 'Jamie', 'Robin', 'Riley', 'Cameron',
      'Dakota', 'Jesse', 'Kai', 'Skyler', 'Quinn', 'Harper', 'Avery', 'Rowan', 'Reese', 'Finley',
      'Shiloh', 'Sage', 'Emerson', 'Phoenix', 'Hayden', 'Eden', 'River', 'Sloan', 'Dallas', 'Milan',
    ];
    const lastNames = [
      'Smith', 'Chen', 'Patel', 'Kumar', 'Garcia', 'Kim', 'Miller', 'Wang', 'Johnson', 'Müller',
      'Takahashi', 'Singh', 'Ali', 'Gomez', 'Tanaka', 'Wong', 'Lee', 'Gupta', 'Nguyen', 'Santos',
    ];

    let nextUserId = Math.max(...this.state.users.map((u) => u.id), 100) + 1;
    const existingApps = this.state.applications.filter(
      (a) => a.competitionId === competitionId && a.status === 'confirmed'
    );
    const existingCount = existingApps.length;
    const toAdd = Math.max(0, targetCount - existingCount);

    const allSkillIds = this.state.skills.map((s) => s.id);

    for (let i = 0; i < toAdd; i++) {
      const uid = nextUserId++;
      const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
      const newUser: User = {
        id: uid,
        name,
        email: `student.${uid}@skillsync.net`,
        role: 'student',
      };
      this.state.users.push(newUser);

      this.state.studentProfiles[uid] = {
        userId: uid,
        availabilityHours: Math.floor(Math.random() * 15) + 5,
        preferredRole: ['backend', 'frontend', 'ml', 'hardware', 'coordinator'][i % 5],
        interests: 'High-scale collaborative participant',
      };

      const skillCount = Math.floor(Math.random() * 4) + 4;
      const shuffled = [...allSkillIds].sort(() => Math.random() - 0.5).slice(0, skillCount);
      for (const sid of shuffled) {
        this.state.studentSkills.push({
          userId: uid,
          skillId: sid,
          proficiency: Math.floor(Math.random() * 5) + 1,
          experienceScore: Number((Math.random() * 6 + 3).toFixed(1)),
          assessmentScore: Number((Math.random() * 6 + 3).toFixed(1)),
        });
      }

      this.state.applications.push({
        competitionId,
        userId: uid,
        status: 'confirmed',
        wantsToLead: Math.random() < 0.25,
        createdAt: new Date().toISOString(),
      });
    }

    this.notify();
    return this.state.applications.filter(
      (a) => a.competitionId === competitionId && a.status === 'confirmed'
    ).length;
  }

  generateTeams(competitionId: number): RecommendationRun {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const confirmedApps = this.state.applications.filter(
      (a) => a.competitionId === competitionId && a.status === 'confirmed'
    );

    const totalW = comp.requirements.reduce((sum, r) => sum + r.weight, 0) || 1;
    const reqW: Record<string, number> = {};
    comp.requirements.forEach((r) => {
      reqW[r.skill] = r.weight / totalW;
    });

    const S: Record<number, { name: string; score: number; skills: Record<string, number> }> = {};
    const volunteers: Array<{ score: number; userId: number }> = [];

    confirmedApps.forEach((app) => {
      const user = this.getUserById(app.userId)!;
      const fitItems = comp.requirements.map((r) => {
        const ss = this.state.studentSkills.find(
          (s) => s.userId === app.userId && s.skillId === r.skillId
        );
        const score = ss
          ? skillScore(ss.proficiency, ss.experienceScore, ss.assessmentScore)
          : 0;
        return {
          skill: r.skill,
          weight: r.weight,
          score,
          proficiency: ss ? ss.proficiency : 0,
          minLevel: r.minLevel,
          mandatory: r.mandatory,
        };
      });
      const fit = competitionFit(fitItems);
      const skillsMap: Record<string, number> = {};
      fit.breakdown.forEach((b) => {
        skillsMap[b.skill] = b.score;
      });
      S[user.id] = { name: user.name, score: fit.score, skills: skillsMap };

      if (app.wantsToLead && fit.eligible) {
        const sSkills = this.getStudentSkills(user.id);
        const prof = this.state.studentProfiles[user.id];
        volunteers.push({
          score: leadershipScore(sSkills, prof?.availabilityHours || 0),
          userId: user.id,
        });
      }
    });

    volunteers.sort((a, b) => b.score - a.score);
    const leaders = volunteers.map((v) => v.userId);

    const prefs = this.state.preferences.filter((p) => p.competitionId === comp.id);
    const prefer: [number, number][] = prefs
      .filter((p) => p.kind === 'prefer' && S[p.userId] && S[p.otherUserId])
      .map((p) => [p.userId, p.otherUserId]);
    const avoid: [number, number][] = prefs
      .filter((p) => p.kind === 'avoid' && S[p.userId] && S[p.otherUserId])
      .map((p) => [p.userId, p.otherUserId]);

    const studentCount = Object.keys(S).length;
    if (studentCount < 2) {
      throw new Error('Need at least 2 confirmed students to form teams.');
    }

    let K = comp.numTeams;
    const warnings: string[] = [];

    // Variable team sizing logic:
    // If the confirmed pool is smaller than K * 2, dynamically adjust K to fit the pool
    if (studentCount < K * 2) {
      const targetSize = Math.max(2, comp.teamSize || 4);
      const adjustedK = Math.max(2, Math.floor(studentCount / targetSize));
      warnings.push(
        `Configured for ${K} teams, but ${studentCount} students are currently confirmed. Balanced into ${adjustedK} teams (${Math.floor(studentCount / adjustedK)}–${Math.ceil(studentCount / adjustedK)} members each).`
      );
      K = adjustedK;
    }

    if (studentCount / K > (comp.maxTeamSize || comp.teamSize)) {
      warnings.push(
        `Teams will have about ${Math.floor(studentCount / K)} members, above configured size of ${comp.teamSize}.`
      );
    }
    if (leaders.length < K) {
      warnings.push(
        `Only ${leaders.length} volunteer leaders for ${K} teams. Teams without a leader can elect one in their workspace.`
      );
    }

    const options = generateOptions(S, K, leaders, prefer, avoid, reqW, comp.fairnessTolerance);
    const runId = Date.now();

    const run: RecommendationRun = {
      runId,
      competitionId,
      options,
      warnings,
      students: studentCount,
      tol: comp.fairnessTolerance,
    };

    this.state.recommendationRuns[competitionId] = run;
    comp.status = 'teams_proposed';
    this.notify();
    return run;
  }

  getRecommendationRun(competitionId: number): RecommendationRun | undefined {
    return this.state.recommendationRuns[competitionId];
  }

  finalizeTeams(competitionId: number, runId: number, optionIndex: number) {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const run = this.state.recommendationRuns[competitionId];
    if (!run || run.runId !== runId) {
      throw new Error('Run not found or expired.');
    }

    const option = run.options[optionIndex];
    if (!option) throw new Error('That option does not exist.');

    // Clear any previous teams for this competition
    const oldTeams = this.state.teams.filter((t) => t.competitionId === competitionId);
    const oldTeamIds = new Set(oldTeams.map((t) => t.id));
    this.state.teams = this.state.teams.filter((t) => t.competitionId !== competitionId);
    this.state.teamMembers = this.state.teamMembers.filter(
      (tm) => !oldTeamIds.has(tm.teamId)
    );

    let nextTeamId = Math.max(...this.state.teams.map((t) => t.id), 0) + 1;

    option.teams.forEach((t) => {
      const currentTeamId = nextTeamId++;
      const leader = t.members.find((m) => m.isLeader);
      const newTeam: Team = {
        id: currentTeamId,
        competitionId,
        teamNo: t.teamNo,
        leaderId: leader ? leader.userId : null,
        avgScore: t.avg,
      };
      this.state.teams.push(newTeam);

      t.members.forEach((m) => {
        this.state.teamMembers.push({
          id: Math.random() * 1000000 | 0,
          teamId: currentTeamId,
          competitionId,
          userId: m.userId,
          isLeader: m.isLeader,
          score: m.score,
        });
      });

      // Seed initial tasks and milestone for demonstration if none exist
      this.state.tasks.push(
        {
          id: Math.random() * 1000000 | 0,
          teamId: currentTeamId,
          title: 'Architecture & System Design',
          description: 'Establish repository structure and API contracts.',
          assigneeId: leader ? leader.userId : t.members[0].userId,
          estimatedHours: 4,
          deadline: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
          status: 'doing',
          createdAt: new Date().toISOString(),
        },
        {
          id: Math.random() * 1000000 | 0,
          teamId: currentTeamId,
          title: 'Data Ingestion & Cleaning Pipeline',
          description: 'Format raw training data and remove outliers.',
          assigneeId: t.members[1]?.userId || null,
          estimatedHours: 6,
          deadline: new Date(Date.now() + 86400000 * 8).toISOString().slice(0, 10),
          status: 'todo',
          createdAt: new Date().toISOString(),
        }
      );

      this.state.milestones.push({
        id: Math.random() * 1000000 | 0,
        teamId: currentTeamId,
        title: 'Prototype Demo Ready',
        dueDate: new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10),
        done: false,
      });
    });

    comp.status = 'finalized';
    this.notify();
  }

  getTeamsForCompetition(competitionId: number, currentUserId?: number, role?: string) {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const teams = this.state.teams
      .filter((t) => t.competitionId === competitionId)
      .sort((a, b) => a.teamNo - b.teamNo);

    if (teams.length === 0) {
      throw new Error('Teams have not been published yet.');
    }

    if (role === 'student' && currentUserId) {
      const myMember = this.state.teamMembers.find(
        (tm) => tm.competitionId === competitionId && tm.userId === currentUserId
      );
      if (!myMember) {
        throw new Error('You are not in a team for this competition.');
      }
      const myTeam = teams.find((t) => t.id === myMember.teamId);
      if (!myTeam) return [];
      return [this.enrichTeam(myTeam)];
    }

    return teams.map((t) => this.enrichTeam(t));
  }

  private enrichTeam(team: Team) {
    const members = this.state.teamMembers
      .filter((tm) => tm.teamId === team.id)
      .map((tm) => {
        const u = this.getUserById(tm.userId)!;
        return {
          userId: u.id,
          name: u.name,
          isLeader: tm.isLeader,
          score: tm.score,
        };
      });

    return {
      teamId: team.id,
      teamNo: team.teamNo,
      avgScore: team.avgScore,
      leaderId: team.leaderId,
      projectTitle: team.projectTitle,
      projectRepoUrl: team.projectRepoUrl,
      isSubmitted: team.isSubmitted || false,
      evaluationScore: team.evaluationScore,
      feedback: team.feedback,
      members,
    };
  }

  getMyTeams(userId: number) {
    const memberships = this.state.teamMembers.filter((tm) => tm.userId === userId);
    return memberships.map((m) => {
      const t = this.state.teams.find((x) => x.id === m.teamId);
      const c = this.state.competitions.find((x) => x.id === m.competitionId);
      return {
        teamId: m.teamId,
        teamNo: t ? t.teamNo : 1,
        competition: c ? c.name : 'Competition',
        avgScore: t ? t.avgScore : 0,
        leaderId: t ? t.leaderId : null,
      };
    });
  }

  // Team Workspace Dashboard
  getTeamWorkspace(teamId: number, currentUserId: number, userRole: string) {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const comp = this.state.competitions.find((c) => c.id === team.competitionId);
    const member = this.state.teamMembers.find(
      (tm) => tm.teamId === team.id && tm.userId === currentUserId
    );

    if (!member && !(userRole === 'coordinator' && comp?.coordinatorId === currentUserId)) {
      throw new Error('Access denied to this team workspace.');
    }

    const members = this.state.teamMembers
      .filter((tm) => tm.teamId === team.id)
      .map((tm) => {
        const u = this.getUserById(tm.userId)!;
        return {
          userId: u.id,
          name: u.name,
          isLeader: tm.isLeader,
          score: tm.score,
        };
      });

    const tasks = this.state.tasks
      .filter((t) => t.teamId === team.id)
      .sort((a, b) => a.id - b.id);

    const milestones = this.state.milestones
      .filter((m) => m.teamId === team.id)
      .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    const canManage =
      member !== undefined &&
      (team.leaderId === null || team.leaderId === currentUserId);

    const hoursMap: Record<number, number> = {};
    tasks.forEach((t) => {
      if (t.assigneeId) {
        hoursMap[t.assigneeId] = (hoursMap[t.assigneeId] || 0) + (t.estimatedHours || 0);
      }
    });

    const doneCount = tasks.filter((t) => t.status === 'done').length;
    const progressPercent = tasks.length > 0 ? Math.round((100 * doneCount) / tasks.length) : 0;

    const namesMap = new Map(members.map((m) => [m.userId, m.name]));

    return {
      team: {
        id: team.id,
        teamNo: team.teamNo,
        competition: comp?.name || 'Competition',
        competitionId: team.competitionId,
        leaderId: team.leaderId,
        projectTitle: team.projectTitle,
        projectDescription: team.projectDescription,
        projectRepoUrl: team.projectRepoUrl,
        submissionNotes: team.submissionNotes,
        isSubmitted: team.isSubmitted || false,
        evaluationScore: team.evaluationScore,
        feedback: team.feedback,
      },
      me: {
        userId: currentUserId,
        isMember: !!member,
        canManage,
      },
      members: members.map((m) => ({
        ...m,
        hours: hoursMap[m.userId] || 0,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        assigneeId: t.assigneeId,
        assignee: t.assigneeId ? namesMap.get(t.assigneeId) || 'Unknown' : 'Unassigned',
        estimatedHours: t.estimatedHours,
        deadline: t.deadline,
        canEdit: canManage || (!!member && t.assigneeId === currentUserId),
      })),
      milestones,
      progress: {
        done: doneCount,
        total: tasks.length,
        percent: progressPercent,
      },
    };
  }

  createTask(
    teamId: number,
    userId: number,
    title: string,
    description: string,
    assigneeId: number | null,
    estimatedHours: number,
    deadline: string | null
  ) {
    const newTask: Task = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      teamId,
      title: title.trim(),
      description,
      assigneeId,
      estimatedHours,
      deadline,
      status: 'todo',
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };
    this.state.tasks.push(newTask);
    this.notify();
    return newTask;
  }

  updateTaskStatus(taskId: number, status: 'todo' | 'doing' | 'done') {
    const t = this.state.tasks.find((x) => x.id === taskId);
    if (!t) throw new Error('Task not found');
    t.status = status;
    this.notify();
    return t;
  }

  createMilestone(teamId: number, title: string, dueDate: string | null) {
    const newM: Milestone = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      teamId,
      title: title.trim(),
      dueDate,
      done: false,
    };
    this.state.milestones.push(newM);
    this.notify();
    return newM;
  }

  toggleMilestone(milestoneId: number) {
    const m = this.state.milestones.find((x) => x.id === milestoneId);
    if (!m) throw new Error('Milestone not found');
    m.done = !m.done;
    this.notify();
    return m;
  }

  submitTeamProject(
    teamId: number,
    data: {
      projectTitle: string;
      projectDescription: string;
      projectRepoUrl: string;
      submissionNotes: string;
    }
  ) {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    team.projectTitle = data.projectTitle.trim();
    team.projectDescription = data.projectDescription.trim();
    team.projectRepoUrl = data.projectRepoUrl.trim();
    team.submissionNotes = data.submissionNotes.trim();
    team.isSubmitted = true;
    this.notify();
    return team;
  }

  gradeTeamProject(teamId: number, evaluationScore: number, feedback: string) {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');
    team.evaluationScore = evaluationScore;
    team.feedback = feedback.trim();
    this.notify();
    return team;
  }

  completeCompetition(competitionId: number) {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');
    comp.status = 'completed';
    this.notify();
    return comp;
  }

  // Fairness Report
  getFairnessReport(competitionId: number) {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const teams = this.state.teams.filter((t) => t.competitionId === competitionId);
    if (teams.length === 0) throw new Error('Finalize teams first.');

    const confirmedApps = this.state.applications.filter(
      (a) => a.competitionId === competitionId && a.status === 'confirmed'
    );

    const totalW = comp.requirements.reduce((sum, r) => sum + r.weight, 0) || 1;
    const reqW: Record<string, number> = {};
    comp.requirements.forEach((r) => {
      reqW[r.skill] = r.weight / totalW;
    });

    const S: Record<number, { name: string; score: number; skills: Record<string, number> }> = {};
    confirmedApps.forEach((app) => {
      const user = this.getUserById(app.userId)!;
      const fitItems = comp.requirements.map((r) => {
        const ss = this.state.studentSkills.find(
          (s) => s.userId === app.userId && s.skillId === r.skillId
        );
        const score = ss
          ? skillScore(ss.proficiency, ss.experienceScore, ss.assessmentScore)
          : 0;
        return {
          skill: r.skill,
          weight: r.weight,
          score,
          proficiency: ss ? ss.proficiency : 0,
          minLevel: r.minLevel,
          mandatory: r.mandatory,
        };
      });
      const fit = competitionFit(fitItems);
      const skillsMap: Record<string, number> = {};
      fit.breakdown.forEach((b) => {
        skillsMap[b.skill] = b.score;
      });
      S[user.id] = { name: user.name, score: fit.score, skills: skillsMap };
    });

    const actualTeamUserIds: number[][] = [];
    teams.forEach((t) => {
      const ids = this.state.teamMembers
        .filter((tm) => tm.teamId === t.id && S[tm.userId])
        .map((tm) => tm.userId);
      if (ids.length > 0) {
        actualTeamUserIds.push(ids);
      }
    });

    const prefs = this.state.preferences.filter((p) => p.competitionId === competitionId);
    const prefer: [number, number][] = prefs
      .filter((p) => p.kind === 'prefer')
      .map((p) => [p.userId, p.otherUserId]);
    const avoid: [number, number][] = prefs
      .filter((p) => p.kind === 'avoid')
      .map((p) => [p.userId, p.otherUserId]);

    return runFairnessReport(
      actualTeamUserIds,
      S,
      prefer,
      avoid,
      reqW,
      comp.fairnessTolerance,
      comp.name,
      300
    );
  }

  // Export CSV representation
  exportTeamsCsv(competitionId: number): string {
    const comp = this.state.competitions.find((c) => c.id === competitionId);
    if (!comp) throw new Error('Competition not found');

    const teams = this.state.teams
      .filter((t) => t.competitionId === competitionId)
      .sort((a, b) => a.teamNo - b.teamNo);

    if (teams.length === 0) throw new Error('Finalize teams first.');

    const headers = [
      'team_no',
      'student_id',
      'name',
      'email',
      'role',
      'competition_score',
      'team_average',
    ];

    const rows: string[] = [headers.join(',')];

    teams.forEach((t) => {
      const members = this.state.teamMembers
        .filter((tm) => tm.teamId === t.id)
        .sort((a, b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));

      members.forEach((m) => {
        const u = this.getUserById(m.userId);
        if (!u) return;
        const safeName = `"${u.name.replace(/"/g, '""')}"`;
        const safeEmail = `"${u.email.replace(/"/g, '""')}"`;
        const role = m.isLeader ? 'leader' : 'member';
        rows.push(
          [t.teamNo, u.id, safeName, safeEmail, role, m.score, t.avgScore].join(',')
        );
      });
    });

    return rows.join('\n');
  }
}

export const store = new Store();
