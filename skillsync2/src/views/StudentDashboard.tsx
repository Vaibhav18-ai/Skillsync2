import React, { useState, useEffect, useCallback } from 'react';
import { User, Competition, PortfolioProject } from '../types';
import { store } from '../services/storage';
import { RadarChart } from '../components/RadarChart';
import {
  Award,
  UserCheck,
  Shield,
  ChevronRight,
  Edit3,
  Heart,
  Briefcase,
  Code2,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  user: User;
  onOpenTeam: (teamId: number) => void;
  onToast: (msg: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onOpenTeam,
  onToast,
}) => {
  const [profileData, setProfileData] = useState(() => store.getStudentProfile(user.id));
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myTeams, setMyTeams] = useState<ReturnType<typeof store.getMyTeams>>([]);
  const [activeTab, setActiveTab] = useState<'competitions' | 'portfolio'>('competitions');
  const [showPreferenceModal, setShowPreferenceModal] = useState<number | null>(null);

  // Preference form states
  const [prefTargetStudentId, setPrefTargetStudentId] = useState<number | ''>('');
  const [prefKind, setPrefKind] = useState<'prefer' | 'avoid'>('prefer');

  // Portfolio Project modal/form
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projTitle, setProjTitle] = useState('');
  const [projRepo, setProjRepo] = useState('');
  const [projDemo, setProjDemo] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projTech, setProjTech] = useState('Python, FastAPI, SQL');

  // Edit general profile
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editBio, setEditBio] = useState(profileData.profile.bio || '');
  const [editGithub, setEditGithub] = useState(profileData.profile.githubUrl || '');
  const [editAvailability, setEditAvailability] = useState(profileData.profile.availabilityHours || 10);
  const [editPreferredRole, setEditPreferredRole] = useState(profileData.profile.preferredRole || 'backend');

  // Skills sliders
  const [skillsRatingState, setSkillsRatingState] = useState<
    Array<{ skillId: number; name: string; proficiency: number; experienceScore: number }>
  >([]);

  const loadData = useCallback(() => {
    try {
      const p = store.getStudentProfile(user.id);
      setProfileData(p);
      const comps = store.getCompetitions(user.id, 'student');
      setCompetitions(comps);
      const teams = store.getMyTeams(user.id);
      setMyTeams(teams);
      setSkillsRatingState(
        p.skills.map((s) => ({
          skillId: s.skillId,
          name: s.name,
          proficiency: s.proficiency,
          experienceScore: s.experienceScore,
        }))
      );
    } catch (err: unknown) {
      if (err instanceof Error) onToast(err.message);
    }
  }, [user.id, onToast]);

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(loadData);
    return unsub;
  }, [loadData]);

  const handleApply = (compId: number, wantsToLead: boolean) => {
    try {
      store.applyToCompetition(compId, user.id, wantsToLead);
      onToast('Application submitted! Your participation is confirmed.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Could not join competition');
    }
  };

  const handleAddPreference = (e: React.FormEvent, compId: number) => {
    e.preventDefault();
    if (!prefTargetStudentId) return;
    try {
      store.addPreference(compId, user.id, Number(prefTargetStudentId), prefKind);
      onToast(`Saved teammate preference: ${prefKind.toUpperCase()} peer.`);
      setPrefTargetStudentId('');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Could not save preference');
    }
  };

  const handleSaveSkillSliders = () => {
    try {
      store.saveStudentSkills(user.id, skillsRatingState);
      onToast('Technical skill proficiencies and experience scores updated.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Failed to update skills');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      store.updateProfile(user.id, {
        bio: editBio,
        githubUrl: editGithub,
        availabilityHours: editAvailability,
        preferredRole: editPreferredRole,
      });
      setShowEditProfileModal(false);
      onToast('Profile bio & availability updated.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    try {
      const techList = projTech.split(',').map((t) => t.trim()).filter(Boolean);
      store.addPortfolioProject(user.id, {
        title: projTitle,
        repoUrl: projRepo || `https://github.com/${user.name.toLowerCase()}/${projTitle.toLowerCase().replace(/\s+/g, '-')}`,
        demoUrl: projDemo || undefined,
        description: projDesc || 'End-to-end software module built for production stability.',
        techStack: techList.length > 0 ? techList : ['TypeScript', 'React'],
      });
      setProjTitle('');
      setProjRepo('');
      setProjDemo('');
      setProjDesc('');
      setShowAddProjectModal(false);
      onToast('Project added to your portfolio.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error adding project');
    }
  };

  const handleDeleteProject = (projId: string) => {
    try {
      store.deletePortfolioProject(user.id, projId);
      onToast('Project removed.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error removing project');
    }
  };

  const topSkills = profileData.skills.slice(0, 6);
  const radarLabels = topSkills.map((s) => s.name);
  const radarData = topSkills.map((s) => s.score);

  const allStudents = store.getState().users.filter((u) => u.role === 'student' && u.id !== user.id);
  const portfolioProjects = profileData.profile.portfolioProjects || [];

  return (
    <div className="max-w-[1040px] mx-auto px-4 pb-16">
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b border-[#e5eaf3] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('competitions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
            activeTab === 'competitions'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Competitions & Teams</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>My Portfolio & Skill DNA</span>
          {portfolioProjects.length > 0 && (
            <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded-full font-bold">
              {portfolioProjects.length}
            </span>
          )}
        </button>
      </div>

      {/* Top Profile Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-sm font-medium">Your overall score (out of 10)</span>
              <button
                type="button"
                onClick={() => {
                  setEditBio(profileData.profile.bio || '');
                  setEditGithub(profileData.profile.githubUrl || '');
                  setEditAvailability(profileData.profile.availabilityHours || 10);
                  setEditPreferredRole(profileData.profile.preferredRole || 'backend');
                  setShowEditProfileModal(true);
                }}
                className="btn ghost text-xs py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
            <div className="big text-4xl font-extrabold mb-4">{profileData.generalScore.toFixed(1)}</div>

            <div className="space-y-3">
              {profileData.skills.slice(0, 5).map((s) => (
                <div key={s.skillId} className="skill">
                  <div className="flex justify-between items-center text-sm font-semibold mb-1">
                    <span className="text-slate-800">{s.name}</span>
                    <span className="text-teal-700 font-bold">{s.score.toFixed(1)}</span>
                  </div>
                  <div className="bar w-full">
                    <i style={{ width: `${Math.min(100, s.score * 10)}%` }}></i>
                  </div>
                </div>
              ))}
              {profileData.skills.length === 0 && (
                <p className="text-slate-400 text-sm">Add your skills to calculate your assessment score.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e5eaf3] flex flex-wrap gap-4 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Availability:</span>{' '}
              {profileData.profile.availabilityHours} hrs/week
            </div>
            {profileData.profile.preferredRole && (
              <div>
                <span className="font-semibold text-slate-700">Role:</span>{' '}
                <span className="capitalize">{profileData.profile.preferredRole}</span>
              </div>
            )}
            {profileData.profile.githubUrl && (
              <a
                href={profileData.profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-teal-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>GitHub Profile</span>
              </a>
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-600" /> Skill strengths
            </h3>
            <span className="text-xs text-slate-400 font-medium">Top skills balance</span>
          </div>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            <RadarChart labels={radarLabels} data={radarData} />
          </div>
        </div>
      </div>

      {/* VIEW 1: COMPETITIONS & TEAMS */}
      {activeTab === 'competitions' && (
        <>
          {/* Your Team Section */}
          <div className="mb-10">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-600" />
              <span>Your team</span>
            </h2>

            {myTeams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTeams.map((t) => {
                  const fullTeam = store.getTeamsForCompetition(
                    store.getState().teams.find((x) => x.id === t.teamId)?.competitionId || 0,
                    user.id,
                    'student'
                  )[0];

                  return (
                    <div key={t.teamId} className="card flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-slate-900 text-base">{t.competition}</h3>
                          <span className="badge">Team {t.teamNo}</span>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          Average balanced score: <b className="text-teal-700">{t.avgScore.toFixed(2)}</b>
                        </p>

                        {fullTeam && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {fullTeam.members.map((m) => (
                              <span
                                key={m.userId}
                                className={`chip text-xs ${m.isLeader ? 'lead font-semibold' : ''}`}
                              >
                                {m.name}
                                {m.isLeader ? ' (leader)' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenTeam(t.teamId)}
                        className="btn flex items-center justify-center gap-1.5 w-full text-xs py-2 cursor-pointer mt-2"
                      >
                        <span>Open team workspace</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card text-slate-500 text-sm py-6 text-center">
                No team assigned yet. Teams appear here after the coordinator publishes and finalizes them.
              </div>
            )}
          </div>

          {/* Competitions Section */}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              <span>Competitions</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitions.map((c) => {
                const joined = c.myStatus === 'confirmed';
                const open = c.status === 'registration_open';
                const wantsToLead = c.myApplication?.wantsToLead ?? false;

                return (
                  <CompetitionCard
                    key={c.id}
                    competition={c}
                    joined={joined}
                    open={open}
                    initialWantsToLead={wantsToLead}
                    onApply={(lead) => handleApply(c.id, lead)}
                    onOpenPreferences={() => setShowPreferenceModal(c.id)}
                  />
                );
              })}

              {competitions.length === 0 && (
                <div className="col-span-full card text-center py-8 text-slate-400 text-sm">
                  No competitions are open yet. Check back soon!
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: PORTFOLIO & SKILLS DNA (PHASE 1, STEP 1 & 2) */}
      {activeTab === 'portfolio' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Bio & Portfolio Intro */}
          <div className="card bg-gradient-to-br from-white via-white to-teal-50/40">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" />
                  <span>Student Portfolio & Technical Profile</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  {profileData.profile.bio ||
                    'Build your verifiable project portfolio, highlight certifications, and maintain your skill self-assessments to maximize fair matching in hackathons.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddProjectModal(true)}
                className="btn text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Portfolio Project</span>
              </button>
            </div>

            {/* Certifications and Achievements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#e5eaf3]">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Certifications</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(profileData.profile.certifications || [
                    'AWS Certified Cloud Practitioner',
                    'TensorFlow Developer Certificate',
                  ]).map((cert, i) => (
                    <span key={i} className="chip text-[11px] bg-white border-slate-200">
                      🏅 {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Achievements & Honors</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(profileData.profile.achievements || [
                    'Campus Hackathon Finalist 2025',
                    'Dean’s List Academic Honor',
                  ]).map((ach, i) => (
                    <span key={i} className="chip text-[11px] bg-white border-slate-200">
                      ⭐ {ach}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Skill Sliders & Scoring Engine Explanation */}
          <div className="card">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Technical Skills Proficiency & Experience Sliders</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust sliders to simulate live skill updates and recalculate your overall score out of 10.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSkillSliders}
                className="btn text-xs py-1.5 px-4 shadow-sm"
              >
                Save Skill Ratings
              </button>
            </div>

            {/* Formula explanation callout */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 mb-5 text-xs text-slate-700 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-teal-900 mb-0.5">Transparent Scoring Engine Formula</div>
                <div>
                  <code className="text-teal-800 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-teal-200">
                    Skill Score = 0.5 × (Proficiency × 2) + 0.3 × Experience + 0.2 × Assessment
                  </code>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Proficiency (1 to 5), Experience (0 to 10), and Assessment (0 to 10) are combined to form your verified skill fitness.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillsRatingState.map((sr, idx) => {
                const currentScore = Number(
                  (0.5 * (sr.proficiency * 2) + 0.3 * sr.experienceScore + 0.2 * 5.0).toFixed(1)
                );

                return (
                  <div
                    key={sr.skillId}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs text-slate-900">{sr.name}</span>
                      <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {currentScore} / 10
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                          <span>Proficiency Level (1-5)</span>
                          <span className="font-bold text-slate-700">{sr.proficiency} / 5</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={sr.proficiency}
                          onChange={(e) => {
                            const updated = [...skillsRatingState];
                            updated[idx].proficiency = Number(e.target.value);
                            setSkillsRatingState(updated);
                          }}
                          className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                          <span>Experience Score (0-10)</span>
                          <span className="font-bold text-slate-700">{sr.experienceScore}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.5"
                          value={sr.experienceScore}
                          onChange={(e) => {
                            const updated = [...skillsRatingState];
                            updated[idx].experienceScore = Number(e.target.value);
                            setSkillsRatingState(updated);
                          }}
                          className="w-full accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Portfolio Projects Grid */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                <span>Featured Projects & Repositories ({portfolioProjects.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioProjects.map((p) => (
                <div key={p.id} className="card bg-white p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <h4 className="font-bold text-sm text-slate-900">{p.title}</h4>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        className="text-slate-300 hover:text-rose-500 transition cursor-pointer p-1"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{p.description}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {p.techStack.map((tech, tidx) => (
                        <span key={tidx} className="chip text-[10px] bg-slate-100 text-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-[#e5eaf3] text-xs font-semibold">
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>Repository</span>
                      </a>
                    )}
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}

              {portfolioProjects.length === 0 && (
                <div className="col-span-full card text-center py-8 text-slate-400 text-xs">
                  No projects added yet. Click "Add Portfolio Project" to showcase your GitHub work.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Teammate Preferences Modal */}
      {showPreferenceModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600" /> Teammate Wishes
              </h3>
              <button
                type="button"
                onClick={() => setShowPreferenceModal(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              SkillSync balances skill fairness while maximizing mutual partner requests and respecting separation needs.
              You can choose up to 3 peers to <b>prefer</b> working with or <b>avoid</b>.
            </p>

            {/* List existing preferences */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Your Saved Wishes:
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {store.getPreferences(showPreferenceModal, user.id).map((p, idx) => {
                  const targetUser = store.getUserById(p.otherUserId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200"
                    >
                      <span className="font-medium text-slate-800">
                        {targetUser?.name || `Student ${p.otherUserId}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.kind === 'prefer' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.kind}
                      </span>
                    </div>
                  );
                })}
                {store.getPreferences(showPreferenceModal, user.id).length === 0 && (
                  <div className="text-xs text-slate-400 italic">No teammate wishes recorded yet.</div>
                )}
              </div>
            </div>

            {/* Add Preference Form */}
            <form onSubmit={(e) => handleAddPreference(e, showPreferenceModal)} className="pt-3 border-t border-slate-100">
              <div className="grid grid-cols-1 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
                  <select
                    value={prefTargetStudentId}
                    onChange={(e) => setPrefTargetStudentId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-xs"
                    required
                  >
                    <option value="">-- Choose a student --</option>
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preference Type</label>
                  <div className="flex gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer text-teal-700">
                      <input
                        type="radio"
                        name="kind"
                        value="prefer"
                        checked={prefKind === 'prefer'}
                        onChange={() => setPrefKind('prefer')}
                      />
                      Prefer teammate
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-amber-700">
                      <input
                        type="radio"
                        name="kind"
                        value="avoid"
                        checked={prefKind === 'avoid'}
                        onChange={() => setPrefKind('avoid')}
                      />
                      Avoid teammate
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreferenceModal(null)}
                  className="btn ghost text-xs py-1.5 px-3"
                >
                  Close
                </button>
                <button type="submit" className="btn text-xs py-1.5 px-3">
                  Add Wish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Portfolio Project Modal */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleAddProject}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-teal-600" />
                <span>Add Portfolio Project</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Task Orchestrator"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  required
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GitHub Repo URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={projRepo}
                  onChange={(e) => setProjRepo(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Live Demo / App URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://demo-app.com"
                  value={projDemo}
                  onChange={(e) => setProjDemo(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, FastAPI, PostgreSQL"
                  value={projTech}
                  onChange={(e) => setProjTech(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Brief Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what the project solves and your contributions..."
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddProjectModal(false)}
                className="btn ghost text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button type="submit" className="btn text-xs py-1.5 px-4">
                Add Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Edit Profile Bio & Hours */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                <span>Edit Profile Information</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Short Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Introduce yourself, your technical passions and what makes you a great teammate..."
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={editGithub}
                  onChange={(e) => setEditGithub(e.target.value)}
                  className="w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weekly Hours Available</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(Number(e.target.value))}
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preferred Role</label>
                  <select
                    value={editPreferredRole}
                    onChange={(e) => setEditPreferredRole(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="backend">Backend</option>
                    <option value="frontend">Frontend</option>
                    <option value="ml">Machine Learning / AI</option>
                    <option value="hardware">Hardware / IoT</option>
                    <option value="coordinator">Leader / PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="btn ghost text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button type="submit" className="btn text-xs py-1.5 px-4">
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

interface CompCardProps {
  competition: Competition;
  joined: boolean;
  open: boolean;
  initialWantsToLead: boolean;
  onApply: (wantsToLead: boolean) => void;
  onOpenPreferences: () => void;
}

const CompetitionCard: React.FC<CompCardProps> = ({
  competition: c,
  joined,
  open,
  initialWantsToLead,
  onApply,
  onOpenPreferences,
}) => {
  const [wantsToLead, setWantsToLead] = useState(initialWantsToLead);

  return (
    <div className="card flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
          <span className="big text-xl font-extrabold text-teal-600">{c.myFit?.toFixed(1) || '0.0'}</span>
        </div>

        <p className="text-xs text-slate-500 mb-2 leading-relaxed">{c.description || 'No description provided.'}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-slate-500 font-medium">
            Status: <span className="capitalize">{c.status.replace(/_/g, ' ')}</span>
          </span>
          {joined && <span className="badge">Joined</span>}
          {!c.eligible && c.missing && c.missing.length > 0 && (
            <span className="badge warn">Needs: {c.missing.join(', ')}</span>
          )}
        </div>

        <div className="mb-3 text-[11px] text-slate-400">
          Skills required: {c.requirements.map((r) => r.skill).join(', ')}
        </div>
      </div>

      <div className="pt-3 border-t border-[#e5eaf3]">
        {open && !joined && c.eligible ? (
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-700 font-medium mb-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsToLead}
                onChange={(e) => setWantsToLead(e.target.checked)}
              />
              <span>I'd like to lead a team</span>
            </label>
            <button
              type="button"
              onClick={() => onApply(wantsToLead)}
              className="btn w-full text-xs py-2"
            >
              Apply to Competition
            </button>
          </div>
        ) : joined ? (
          <div className="flex items-center justify-between">
            <span className="text-xs text-teal-700 font-semibold flex items-center gap-1">
              ✓ Application active
            </span>
            <button
              type="button"
              onClick={onOpenPreferences}
              className="btn ghost text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
            >
              <Heart className="w-3 h-3 text-teal-600" />
              <span>Teammate wishes</span>
            </button>
          </div>
        ) : !c.eligible ? (
          <div className="text-xs text-amber-700 font-medium bg-amber-50 p-2 rounded-lg border border-amber-200">
            Mandatory skill level not met.
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">Registration currently closed.</div>
        )}
      </div>
    </div>
  );
};
