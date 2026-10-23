import React, { useState, useEffect, useCallback } from 'react';
import { User, Competition, RecommendationRun, TeamOption, SCALE_TIERS, AVAILABLE_TRACKS, ScaleTier } from '../types';
import { store } from '../services/storage';
import { BarChart } from '../components/BarChart';
import {
  PlusCircle,
  Play,
  CheckCircle2,
  FileText,
  Download,
  Users,
  ArrowUpRight,
  BarChart2,
  Zap,
  Globe,
  Sliders,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CoordinatorDashboardProps {
  user: User;
  onOpenTeamWorkspace: (teamId: number) => void;
  onToast: (msg: string) => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  user,
  onOpenTeamWorkspace,
  onToast,
}) => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [skills, setSkills] = useState(store.getState().skills);
  const [activePanel, setActivePanel] = useState<'none' | 'applicants' | 'proposed' | 'finalized'>('none');
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null);

  // Form state for creating competition
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState('Campus AI Hackathon');
  const [cDesc, setCDesc] = useState('48-hour competitive machine learning challenge.');
  
  // Multi-type track selection (1 or more)
  const [cTypes, setCTypes] = useState<string[]>(['ml']);
  
  // Scale tier & variable team size
  const [cScaleTier, setCScaleTier] = useState<ScaleTier>('school');
  const [cTeams, setCTeams] = useState(20);
  const [minTeamSize, setMinTeamSize] = useState(4);
  const [cSize, setCSize] = useState(5); // target team size
  const [maxTeamSize, setMaxTeamSize] = useState(7);
  const [cTol, setCTol] = useState(0.8);
  const [cDead, setCDead] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [skillWeights, setSkillWeights] = useState<Record<number, number>>({
    10: 4, // Machine Learning
    1: 3,  // Python
    11: 3, // Data Analysis
    4: 2,  // DSA
  });

  // Participant simulation / scale seeder modal state
  const [simCompId, setSimCompId] = useState<number | null>(null);
  const [simCount, setSimCount] = useState<number>(60);

  // Applicants state
  const [applicantsData, setApplicantsData] = useState<{
    competition: string;
    count: number;
    applicants: Array<{
      userId: number;
      name: string;
      score: number;
      wantsToLead: boolean;
      eligible: boolean;
    }>;
  } | null>(null);

  // Recommendation run state
  const [currentRun, setCurrentRun] = useState<RecommendationRun | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);

  // Finalized teams state
  const [finalTeams, setFinalTeams] = useState<
    Array<{
      teamId: number;
      teamNo: number;
      avgScore: number;
      leaderId: number | null;
      projectTitle?: string;
      projectRepoUrl?: string;
      isSubmitted?: boolean;
      evaluationScore?: number;
      feedback?: string;
      members: Array<{ userId: number; name: string; isLeader: boolean }>;
    }>
  >([]);

  // Fairness report modal/panel
  const [fairnessReport, setFairnessReport] = useState<ReturnType<typeof store.getFairnessReport> | null>(null);

  // Grade dialog state
  const [gradingTeamId, setGradingTeamId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState(90);
  const [gradeFeedback, setGradeFeedback] = useState('Excellent algorithmic efficiency and well-balanced code structure.');

  const loadData = useCallback(() => {
    const comps = store.getCompetitions(user.id, 'coordinator');
    setCompetitions(comps);
    setSkills(store.getState().skills);
  }, [user.id]);

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(loadData);
    return unsub;
  }, [loadData]);

  const handleToggleTrack = (trackId: string) => {
    if (cTypes.includes(trackId)) {
      if (cTypes.length === 1) {
        onToast('Competition must have at least one track/type.');
        return;
      }
      setCTypes(cTypes.filter((t) => t !== trackId));
    } else {
      setCTypes([...cTypes, trackId]);
    }
  };

  const handleSelectScaleTier = (tier: ScaleTier) => {
    const preset = SCALE_TIERS.find((t) => t.id === tier);
    if (!preset) return;
    setCScaleTier(tier);
    setCTeams(preset.defaultTeams);
    setMinTeamSize(preset.minSize);
    setCSize(preset.targetSize);
    setMaxTeamSize(preset.maxSize);
  };

  const handleSeedParticipants = (compId: number, targetCount: number) => {
    try {
      const totalNow = store.seedScaleApplicants(compId, targetCount);
      onToast(`Successfully seeded participants! Competition now has ${totalNow} confirmed applicants.`);
      setSimCompId(null);
      loadData();
      if (activePanel === 'applicants' && selectedCompId === compId) {
        const data = store.getApplicants(compId);
        setApplicantsData(data);
      }
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Failed to seed participants');
    }
  };

  const handleCreateComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (cTypes.length === 0) {
      onToast('Select at least one competition track/type.');
      return;
    }

    if (minTeamSize > cSize || cSize > maxTeamSize) {
      onToast('Team sizes must satisfy: Min Size <= Target Size <= Max Size.');
      return;
    }

    const reqs = Object.entries(skillWeights)
      .filter(([_, w]) => w > 0)
      .map(([idStr, w]) => {
        const sid = Number(idStr);
        const sk = skills.find((s) => s.id === sid);
        return {
          skillId: sid,
          skill: sk ? sk.name : `Skill ${sid}`,
          weight: w,
          minLevel: 1,
          mandatory: false,
        };
      });

    if (reqs.length === 0) {
      onToast('Give at least one skill a weight above 0.');
      return;
    }

    try {
      const created = store.createCompetition(user.id, {
        name: cName.trim(),
        description: cDesc,
        compType: cTypes[0] || 'ml',
        compTypes: cTypes,
        teamSize: cSize,
        minTeamSize,
        maxTeamSize,
        numTeams: cTeams,
        scaleTier: cScaleTier,
        fairnessTolerance: cTol,
        formationMode: 'preference',
        deadline: cDead,
        requirements: reqs,
      });

      onToast(`Created "${created.name}" (ID #${created.id}) with ${cTypes.length} track(s). Publish when ready.`);
      setCreateOpen(false);
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Failed to create competition');
    }
  };

  const handlePublish = (compId: number) => {
    try {
      store.publishCompetition(compId);
      onToast('Competition published for student registrations.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error publishing');
    }
  };

  const handleCloseRegistration = (compId: number) => {
    try {
      store.closeRegistration(compId);
      onToast('Registration closed. You can now generate balanced teams.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error closing registration');
    }
  };

  const handleViewApplicants = (compId: number) => {
    try {
      const data = store.getApplicants(compId);
      setApplicantsData(data);
      setSelectedCompId(compId);
      setActivePanel('applicants');
      setFairnessReport(null);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error loading applicants');
    }
  };

  const handleGenerateTeams = (compId: number) => {
    try {
      onToast('Generating mathematically balanced teams...');
      const run = store.generateTeams(compId);
      setCurrentRun(run);
      setSelectedOptionIndex(0);
      setSelectedCompId(compId);
      setActivePanel('proposed');
      setFairnessReport(null);
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error generating teams');
    }
  };

  const handleFinalizeOption = (compId: number, optionIdx: number) => {
    if (!currentRun) return;
    if (
      !window.confirm(
        `Finalize Option ${optionIdx + 1}? Students will see their teams and workspace immediately.`
      )
    ) {
      return;
    }

    try {
      store.finalizeTeams(compId, currentRun.runId, optionIdx);
      onToast('Teams successfully finalized and workspaces initialized!');
      handleViewTeams(compId);
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error finalizing teams');
    }
  };

  const handleViewTeams = (compId: number) => {
    try {
      const teams = store.getTeamsForCompetition(compId);
      setFinalTeams(teams);
      setSelectedCompId(compId);
      setActivePanel('finalized');
      setFairnessReport(null);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error retrieving teams');
    }
  };

  const handleFairnessReport = (compId: number) => {
    try {
      const report = store.getFairnessReport(compId);
      setFairnessReport(report);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error generating fairness benchmark report');
    }
  };

  const handleDownloadCsv = (compId: number) => {
    try {
      const csv = store.exportTeamsCsv(compId);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teams_competition_${compId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onToast('CSV exported successfully.');
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error downloading CSV');
    }
  };

  const currentOption = currentRun?.options[selectedOptionIndex];

  return (
    <div className="max-w-[1040px] mx-auto px-4 pb-16">
      {/* Create Competition Card */}
      <div className="card mb-6">
        <div
          onClick={() => setCreateOpen(!createOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 font-bold text-slate-800 text-base">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <span>Create a competition</span>
          </div>
          <span className="text-xs font-semibold text-teal-700">
            {createOpen ? 'Hide form' : 'Open form'}
          </span>
        </div>

        {createOpen && (
          <form onSubmit={handleCreateComp} className="mt-5 pt-4 border-t border-[#e5eaf3]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  required
                  className="w-full text-sm mb-3"
                />

                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  className="w-full text-sm mb-3"
                />

                {/* Multi-Track Selection (Collection of 1 or more types) */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Tracks & Specializations (1 or more)
                    </label>
                    <span className="text-[11px] text-teal-700 font-bold">
                      {cTypes.length} selected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Select one or more tracks (e.g. AI/ML + Web + Cybersecurity). The balancer forms multidisciplinary teams covering all chosen areas.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {AVAILABLE_TRACKS.map((t) => {
                      const isSelected = cTypes.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTrack(t.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer border ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                          {isSelected && <span className="text-teal-600 text-xs font-black">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] bg-teal-50/60 px-2.5 py-1.5 rounded-lg border border-teal-100">
                    <span className="text-teal-800">
                      Active collection:{' '}
                      <b>
                        {cTypes
                          .map((tid) => AVAILABLE_TRACKS.find((x) => x.id === tid)?.name || tid)
                          .join(' · ')}
                      </b>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCTypes(
                          cTypes.length === AVAILABLE_TRACKS.length
                            ? ['ml']
                            : AVAILABLE_TRACKS.map((x) => x.id)
                        )
                      }
                      className="text-teal-700 hover:underline font-bold text-[10px] ml-2 cursor-pointer"
                    >
                      {cTypes.length === AVAILABLE_TRACKS.length ? 'Reset to AI/ML' : 'Select all tracks'}
                    </button>
                  </div>
                </div>

                {/* Scale Tier Presets */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Scale Preset & Environment
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Auto-configures recommended team counts and variable sizes for your cohort size:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SCALE_TIERS.map((tier) => {
                      const isActive = cScaleTier === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => handleSelectScaleTier(tier.id)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            isActive
                              ? 'bg-teal-50/90 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm">{tier.icon}</span>
                            {isActive && (
                              <span className="text-[9px] font-extrabold uppercase bg-teal-600 text-white px-1.5 py-0.2 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs text-slate-800 leading-tight">
                            {tier.label}
                          </div>
                          <div className="text-[10px] text-slate-500">{tier.range}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Variable Team Sizing & Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      Number of teams
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10000"
                      value={cTeams}
                      onChange={(e) => setCTeams(Math.max(2, Number(e.target.value)))}
                      className="w-full text-sm font-bold text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">e.g. 5, 20, 30, 100+</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      Min Team Size
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={minTeamSize}
                      onChange={(e) => setMinTeamSize(Math.max(2, Number(e.target.value)))}
                      className="w-full text-sm font-semibold"
                    />
                    <span className="text-[10px] text-slate-400">Minimum cap</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      Target Team Size
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={cSize}
                      onChange={(e) => setCSize(Math.max(2, Number(e.target.value)))}
                      className="w-full text-sm font-bold text-teal-800"
                    />
                    <span className="text-[10px] text-slate-400">Ideal team size</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      Max Team Size
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={maxTeamSize}
                      onChange={(e) => setMaxTeamSize(Math.max(2, Number(e.target.value)))}
                      className="w-full text-sm font-semibold"
                    />
                    <span className="text-[10px] text-slate-400">Maximum cap</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      Allowed gap (tol)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3.0"
                      value={cTol}
                      onChange={(e) => setCTol(Number(e.target.value))}
                      className="w-full text-sm"
                    />
                    <span className="text-[10px] text-slate-400">Score spread tol</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-0.5">
                      Registration deadline
                    </label>
                    <input
                      type="date"
                      value={cDead}
                      onChange={(e) => setCDead(e.target.value)}
                      className="w-full text-sm"
                    />
                    <span className="text-[10px] text-slate-400">Cut-off date</span>
                  </div>
                </div>

                {/* Live Capacity Indicator */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      <b>Estimated Capacity:</b> {cTeams * minTeamSize} – {cTeams * maxTeamSize} students (~{cTeams * cSize} target across {cTeams} teams).
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
                    {cScaleTier}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Skill weights (0 = not required)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Higher weight means the skill counts more toward each student’s competition fitness score.
                </p>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {skills.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200"
                    >
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Weight (0-10):</span>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={skillWeights[s.id] || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(10, Number(e.target.value)));
                            setSkillWeights({ ...skillWeights, [s.id]: val });
                          }}
                          className="w-16 py-1 px-2 text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#e5eaf3]">
              <button type="submit" className="btn text-sm py-2 px-5">
                Create competition
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Competitions Section */}
      <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
        <span>Your competitions</span>
        <span className="text-xs font-normal text-slate-400">({competitions.length})</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {competitions.map((c) => {
          const s = c.status;
          const tracks = c.compTypes && c.compTypes.length > 0 ? c.compTypes : [c.compType || 'ml'];
          return (
            <div key={c.id} className="card flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    #{c.id} {c.name}
                  </h3>
                  <span
                    className={`badge text-xs capitalize ${
                      s === 'draft' ? 'warn' : s === 'finalized' ? 'bg-emerald-50 text-emerald-700' : ''
                    }`}
                  >
                    {s.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Tracks / Specializations Collection */}
                <div className="flex flex-wrap gap-1 my-2">
                  {tracks.map((tid) => {
                    const track = AVAILABLE_TRACKS.find((t) => t.id === tid);
                    return (
                      <span
                        key={tid}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          track?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{track?.icon || '🏷️'}</span>
                        <span>{track?.name || tid}</span>
                      </span>
                    );
                  })}
                </div>

                {/* Scale Tier & Variable Team Size Parameters */}
                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 mb-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">
                      {c.numTeams} Teams · {c.minTeamSize ? `${c.minTeamSize}–${c.maxTeamSize} (target ${c.teamSize})` : c.teamSize} size
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200">
                      {c.scaleTier || 'school'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Join code: <span className="font-mono font-bold text-slate-800">{c.joinCode}</span> · Spread tol: ±{c.fairnessTolerance}
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-2 truncate">
                  Skills: {c.requirements.map((r) => r.skill).join(', ')}
                </p>
              </div>

              <div className="pt-3 border-t border-[#e5eaf3] flex flex-wrap gap-2">
                {s === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handlePublish(c.id)}
                    className="btn text-xs py-1.5 px-3"
                  >
                    Publish
                  </button>
                )}

                {s === 'registration_open' && (
                  <button
                    type="button"
                    onClick={() => handleCloseRegistration(c.id)}
                    className="btn text-xs py-1.5 px-3"
                  >
                    Close registration
                  </button>
                )}

                {['registration_closed', 'teams_proposed', 'under_review'].includes(s) && (
                  <button
                    type="button"
                    onClick={() => handleGenerateTeams(c.id)}
                    className="btn text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Generate teams</span>
                  </button>
                )}

                {['finalized', 'ongoing', 'completed'].includes(s) && (
                  <button
                    type="button"
                    onClick={() => handleViewTeams(c.id)}
                    className="btn text-xs py-1.5 px-3"
                  >
                    View teams
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleViewApplicants(c.id)}
                  className="btn ghost text-xs py-1.5 px-3"
                >
                  Applicants
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimCompId(c.id);
                    const needed = (c.numTeams || 5) * (c.teamSize || 5);
                    setSimCount(needed);
                  }}
                  className="btn ghost text-xs py-1.5 px-2.5 flex items-center gap-1 text-teal-800 hover:border-teal-400 hover:bg-teal-50"
                  title="Simulate realistic participant pool for high-scale testing"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Seed Pool</span>
                </button>
              </div>
            </div>
          );
        })}

        {competitions.length === 0 && (
          <div className="col-span-full card text-center py-8 text-slate-400 text-sm">
            You have not created any competitions yet. Click "Create a competition" above!
          </div>
        )}
      </div>

      {/* Dynamic Sub-Panels */}
      {/* 1. Applicants Panel */}
      {activePanel === 'applicants' && applicantsData && (
        <div className="card mb-8 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <span>
                Applicants for {applicantsData.competition} ({applicantsData.count})
              </span>
            </h2>
            <button
              type="button"
              onClick={() => setActivePanel('none')}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {applicantsData.count > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e5eaf3] text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Skill Score</th>
                    <th className="py-2.5 px-3">Wants to Lead</th>
                    <th className="py-2.5 px-3">Eligible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applicantsData.applicants.map((a) => (
                    <tr key={a.userId} className="hover:bg-teal-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{a.name}</td>
                      <td className="py-2.5 px-3 font-bold text-teal-700">{a.score.toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        {a.wantsToLead ? (
                          <span className="badge text-[10px] font-bold">Yes (Volunteer)</span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {a.eligible ? (
                          <span className="text-emerald-600 font-medium">✓ Qualified</span>
                        ) : (
                          <span className="text-amber-600 font-medium">Needs prerequisites</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">No confirmed applicants registered yet.</p>
          )}
        </div>
      )}

      {/* 2. Proposed Teams Panel */}
      {activePanel === 'proposed' && currentRun && currentOption && (
        <div className="card mb-8 border-teal-200 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Play className="w-5 h-5 text-teal-600" />
              <span>Proposed Teams (Run #{currentRun.runId})</span>
            </h2>
            <button
              type="button"
              onClick={() => setActivePanel('none')}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          {currentRun.warnings.map((w, idx) => (
            <div key={idx} className="badge warn mb-3 text-xs block py-1.5 px-3">
              ⚠️ {w}
            </div>
          ))}

          {/* Option Tabs */}
          <div className="flex gap-2 border-b border-[#e5eaf3] pb-3 mb-4">
            {currentRun.options.map((_, k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSelectedOptionIndex(k)}
                className={`btn text-xs py-1.5 px-4 cursor-pointer ${
                  selectedOptionIndex === k ? '' : 'ghost'
                }`}
              >
                Option {k + 1}
              </button>
            ))}
          </div>

          {/* Metrics & Fairness Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-800 text-sm">Fairness Check</h3>
                <span className={`badge text-xs ${currentOption.metrics.withinTolerance ? '' : 'warn'}`}>
                  {currentOption.metrics.withinTolerance ? 'Within the limit' : 'Over the limit'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4">
                Highest team average minus lowest is{' '}
                <b className="text-teal-700 text-sm">{currentOption.metrics.spread.toFixed(2)}</b>.
                Your fairness limit is <b>{currentRun.tol}</b>.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <div className="stat text-xl font-bold">
                    {currentOption.metrics.preferMet} / {currentOption.metrics.preferTotal}
                  </div>
                  <div className="text-[11px] text-slate-400">teammate wishes met</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center">
                  <div className="stat text-xl font-bold text-amber-600">
                    {currentOption.metrics.avoidViolations}
                  </div>
                  <div className="text-[11px] text-slate-400">separation requests broken</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleFinalizeOption(currentRun.competitionId, selectedOptionIndex)}
                className="btn w-full text-xs py-2.5 font-bold shadow-md cursor-pointer"
              >
                Finalize Option {selectedOptionIndex + 1}
              </button>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                Students will only see their team and workspace after you finalize.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                <span>Team Averages</span>
              </h3>
              <div className="flex-1 min-h-[200px]">
                <BarChart
                  labels={currentOption.teams.map((t) => `Team ${t.teamNo}`)}
                  data={currentOption.teams.map((t) => t.avg)}
                  labelName="Team Average"
                  minY={Math.max(0, Math.min(...currentOption.teams.map((t) => t.avg)) - 1.5)}
                  maxY={10}
                />
              </div>
            </div>
          </div>

          {/* Teams Grid for current option */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentOption.teams.map((t) => (
              <div key={t.teamNo} className="bg-white p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-bold text-sm text-slate-800">Team {t.teamNo}</h4>
                  <b className="text-teal-700 text-sm">{t.avg.toFixed(2)}</b>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{t.members.length} members</p>
                <div className="flex flex-wrap gap-1">
                  {t.members.map((m) => (
                    <span
                      key={m.userId}
                      className={`chip text-[11px] ${m.isLeader ? 'lead font-semibold' : ''}`}
                    >
                      {m.name}
                      {m.isLeader ? ' (leader)' : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Final Teams Panel */}
      {activePanel === 'finalized' && selectedCompId && (
        <div className="card mb-8 animate-in fade-in duration-200">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Finalized Teams for Competition #{selectedCompId}</span>
              </h2>
              <p className="text-xs text-slate-500">
                These teams are live. Students can access their team workspaces to manage tasks and milestones.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Mark this competition as Completed (Phase 7)? This finalizes tournament results and closes active sprint cycles.')) {
                    store.completeCompetition(selectedCompId);
                    onToast('Competition marked as Completed!');
                    loadData();
                  }
                }}
                className="btn text-xs py-1.5 px-3 bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-xs"
              >
                <span>Complete Event (Phase 7)</span>
              </button>
              <button
                type="button"
                onClick={() => handleFairnessReport(selectedCompId)}
                className="btn text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Fairness report vs random</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadCsv(selectedCompId)}
                className="btn ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Fairness Benchmark Table */}
          {fairnessReport && (
            <div className="card mb-6 bg-slate-50 border-teal-200 animate-in fade-in duration-150">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-slate-800">
                  SkillSync vs Random Assignment ({fairnessReport.trials} random trials)
                </h3>
                <span className="text-xs text-slate-400">Monte Carlo Simulation</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e5eaf3] text-slate-400 uppercase text-[10px]">
                      <th className="py-2 px-3">Measure</th>
                      <th className="py-2 px-3">SkillSync</th>
                      <th className="py-2 px-3">Random Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-700">
                        Gap between highest and lowest team average
                      </td>
                      <td className="py-2 px-3 font-bold text-teal-700">
                        {fairnessReport.ours.spread.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {fairnessReport.random.avgSpread.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-700">
                        Within your {fairnessReport.tolerance} limit
                      </td>
                      <td className="py-2 px-3 font-bold text-teal-700">
                        {fairnessReport.ours.withinTolerance ? 'Yes' : 'No'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {fairnessReport.random.pctWithinTolerance}% of trials
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-700">
                        Teammate wishes met (out of {fairnessReport.ours.preferTotal})
                      </td>
                      <td className="py-2 px-3 font-bold text-teal-700">
                        {fairnessReport.ours.preferMet}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {fairnessReport.random.avgPreferMet}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-700">
                        Separation requests broken
                      </td>
                      <td className="py-2 px-3 font-bold text-emerald-700">
                        {fairnessReport.ours.avoidViolations}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {fairnessReport.random.avgAvoidViolations}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-medium text-slate-700">
                        Skill imbalance across teams (lower is better)
                      </td>
                      <td className="py-2 px-3 font-bold text-teal-700">
                        {fairnessReport.ours.skillGap}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {fairnessReport.random.avgSkillGap}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Final Teams List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {finalTeams.map((t) => (
              <div key={t.teamId} className="card bg-white p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-slate-900">Team {t.teamNo}</h4>
                    <b className="text-teal-700 text-sm">{t.avgScore.toFixed(2)}</b>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{t.members.length} members</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.members.map((m) => (
                      <span
                        key={m.userId}
                        className={`chip text-[11px] ${m.isLeader ? 'lead font-semibold' : ''}`}
                      >
                        {m.name}
                        {m.isLeader ? ' (leader)' : ''}
                      </span>
                    ))}
                  </div>

                  {/* Deliverable submission status */}
                  {t.isSubmitted ? (
                    <div className="mb-3 p-2 bg-teal-50/70 rounded-lg border border-teal-200 text-xs">
                      <div className="font-bold text-slate-900 truncate">📦 {t.projectTitle || 'Deliverable'}</div>
                      {t.projectRepoUrl && (
                        <a
                          href={t.projectRepoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-teal-700 underline truncate block mt-0.5"
                        >
                          Repo Link
                        </a>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-teal-200/60">
                        <span className="text-[10px] font-semibold text-slate-600">
                          {t.evaluationScore !== undefined ? `Score: ${t.evaluationScore}/100` : 'Ungraded'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setGradingTeamId(t.teamId);
                            setGradeScore(t.evaluationScore || 90);
                            setGradeFeedback(t.feedback || '');
                          }}
                          className="text-[10px] font-bold text-teal-800 hover:underline cursor-pointer"
                        >
                          Grade / Feedback
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 mb-2 italic">No deliverable submitted yet.</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenTeamWorkspace(t.teamId)}
                  className="btn ghost text-[11px] py-1 px-2.5 flex items-center justify-center gap-1 w-full cursor-pointer"
                >
                  <span>Open workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Grade Team Deliverable Modal */}
          {gradingTeamId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  store.gradeTeamProject(gradingTeamId, gradeScore, gradeFeedback);
                  onToast('Team project evaluated and score saved.');
                  setGradingTeamId(null);
                  if (selectedCompId) handleViewTeams(selectedCompId);
                }}
                className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-slate-900">Grade Team Deliverable</h3>
                  <button
                    type="button"
                    onClick={() => setGradingTeamId(null)}
                    className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 mb-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Score (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(Number(e.target.value))}
                      className="w-full text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Coordinator Feedback</label>
                    <textarea
                      rows={3}
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      placeholder="Feedback on system design, innovation, and teamwork..."
                      className="w-full text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGradingTeamId(null)}
                    className="btn ghost text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn text-xs py-1.5 px-4">
                    Save Grade
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
