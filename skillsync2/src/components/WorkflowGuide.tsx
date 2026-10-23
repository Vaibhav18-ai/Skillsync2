import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  UserCheck,
  Briefcase,
  Sliders,
  Settings,
  Compass,
  Heart,
  Cpu,
  Trophy,
  Users,
  CheckCheck,
  FolderGit2,
  Flag,
} from 'lucide-react';

interface WorkflowGuideProps {
  currentRole: 'student' | 'coordinator';
  onNavigateToTab?: (tab: string) => void;
}

export const WORKFLOW_PHASES = [
  {
    phase: 'Phase 1 · Student & System',
    title: 'Registration, Portfolio & Competency Profiling',
    steps: [
      {
        num: 1,
        title: 'Student registers & builds profile',
        desc: 'Account setup, email verification, interests, availability (hrs/week), and preferred track.',
        icon: UserCheck,
      },
      {
        num: 2,
        title: 'Student builds portfolio',
        desc: 'Enters technical skills, ratings, GitHub repos, certifications, and project links.',
        icon: Briefcase,
      },
      {
        num: 3,
        title: 'System calculates general competency scores',
        desc: 'Scoring engine computes transparent general fitness: 0.5×(Proficiency×2) + 0.3×Experience + 0.2×Assessment.',
        icon: Sliders,
      },
    ],
  },
  {
    phase: 'Phase 2 · Coordinator',
    title: 'Competition Configuration & Rules',
    steps: [
      {
        num: 4,
        title: 'Configure and publish a competition',
        desc: 'Set skill weights (0-10), team sizes, registration deadline, and score fairness tolerance (e.g. 0.8).',
        icon: Settings,
      },
    ],
  },
  {
    phase: 'Phase 3 · Student',
    title: 'Discovery, Application & Teammate Preferences',
    steps: [
      {
        num: 5,
        title: 'Discover and apply to competitions',
        desc: 'Browse open events, verify prerequisite skill eligibility, and confirm voluntary participation.',
        icon: Compass,
      },
      {
        num: 6,
        title: 'Submit teammate preferences',
        desc: 'Nominate preferred peers (up to 3), submit private separation requests (avoid), and volunteer to lead.',
        icon: Heart,
      },
    ],
  },
  {
    phase: 'Phase 4 · Algorithmic Engine',
    title: 'Fitness Calculation & Balancer Optimization',
    steps: [
      {
        num: 7,
        title: 'Calculate competition-specific fit',
        desc: 'Recalculates weighted student fit out of 10 based on specific event skill requirements.',
        icon: Cpu,
      },
      {
        num: 8,
        title: 'Recommend and confirm leaders',
        desc: 'Ranks volunteers using leadership suitability (experience + assessment + availability).',
        icon: Trophy,
      },
      {
        num: 9,
        title: 'Generate candidate balanced teams',
        desc: 'Greedy allocation + 2,500 iterative swap search restarts balancing spreads, leaders, and preferences.',
        icon: Users,
      },
    ],
  },
  {
    phase: 'Phase 5 · Coordinator & Review',
    title: 'Fairness Validation & Finalization',
    steps: [
      {
        num: 10,
        title: 'Review proposed options & metrics',
        desc: 'Audit spread vs tolerance limit, wishes met, separation checks, and bar charts across Option 1, 2, 3.',
        icon: Sliders,
      },
      {
        num: 11,
        title: 'Validate and finalize teams',
        desc: 'Coordinator approves team roster; students receive instant access to their assigned team workspace.',
        icon: CheckCheck,
      },
    ],
  },
  {
    phase: 'Phase 6 · Team Workspace',
    title: 'Collaborative Sprint & Task Management',
    steps: [
      {
        num: 12,
        title: 'Open private team workspace',
        desc: 'Members coordinate via 3-column Kanban (To do, In progress, Done), milestone tracker, and planned hours.',
        icon: FolderGit2,
      },
    ],
  },
  {
    phase: 'Phase 7 · Team & Coordinator',
    title: 'Project Submission, CSV Export & Event Closure',
    steps: [
      {
        num: 13,
        title: 'Complete and close event',
        desc: 'Teams submit deliverables; coordinator benchmarks fairness against 300 random trials and exports official CSV.',
        icon: Flag,
      },
    ],
  },
];

export const WorkflowGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>SkillSync End-to-End System Blueprint</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Complete 7-Phase / 13-Step Workflow
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Built on React 18, TypeScript, Tailwind CSS, Chart.js, and an in-memory optimization engine.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold text-xl px-2 py-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {WORKFLOW_PHASES.map((p, idx) => (
            <div key={idx} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {p.phase}
                </span>
                <span className="text-xs font-semibold text-slate-800">{p.title}</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 mt-3">
                {p.steps.map((st) => {
                  const Icon = st.icon;
                  return (
                    <div
                      key={st.num}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex items-start gap-3 shadow-xs hover:border-teal-300 transition"
                    >
                      <div className="w-7 h-7 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {st.num}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-teal-600" />
                          <h4 className="font-bold text-xs text-slate-900">{st.title}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Tip: Use the account switcher in the top right to test both student and coordinator roles.
          </span>
          <button type="button" onClick={onClose} className="btn text-xs py-2 px-5">
            Got it, Let's Explore
          </button>
        </div>
      </div>
    </div>
  );
};
