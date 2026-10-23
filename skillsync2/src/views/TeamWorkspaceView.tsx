import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { store } from '../services/storage';
import { BarChart } from '../components/BarChart';
import { ArrowLeft, CheckSquare, Clock, Flag, Plus, Calendar, AlertCircle } from 'lucide-react';

interface TeamWorkspaceViewProps {
  user: User;
  teamId: number;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export const TeamWorkspaceView: React.FC<TeamWorkspaceViewProps> = ({
  user,
  teamId,
  onBack,
  onToast,
}) => {
  const [workspace, setWorkspace] = useState(() =>
    store.getTeamWorkspace(teamId, user.id, user.role)
  );

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState<number | ''>('');
  const [taskHours, setTaskHours] = useState(2);
  const [taskDeadline, setTaskDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  // New milestone form state
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const todayStr = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(() => {
    try {
      const ws = store.getTeamWorkspace(teamId, user.id, user.role);
      setWorkspace(ws);
    } catch (err: unknown) {
      if (err instanceof Error) onToast(err.message);
    }
  }, [teamId, user.id, user.role, onToast]);

  useEffect(() => {
    loadData();
    const unsub = store.subscribe(loadData);
    return unsub;
  }, [loadData]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      store.createTask(
        teamId,
        user.id,
        taskTitle,
        '',
        taskAssignee ? Number(taskAssignee) : null,
        taskHours,
        taskDeadline || null
      );
      setTaskTitle('');
      onToast('Task added to board.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error adding task');
    }
  };

  const handleStatusChange = (taskId: number, status: 'todo' | 'doing' | 'done') => {
    try {
      store.updateTaskStatus(taskId, status);
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error moving task');
    }
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneTitle.trim()) return;
    try {
      store.createMilestone(teamId, milestoneTitle, milestoneDueDate || null);
      setMilestoneTitle('');
      onToast('Milestone created.');
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error creating milestone');
    }
  };

  const handleToggleMilestone = (mid: number) => {
    try {
      store.toggleMilestone(mid);
      loadData();
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : 'Error updating milestone');
    }
  };

  const memberNames = workspace.members.map((m) => m.name);
  const memberHours = workspace.members.map((m) => m.hours || 0);

  return (
    <div className="max-w-[1040px] mx-auto px-4 pb-16">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="btn ghost text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to dashboard</span>
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Team {workspace.team.teamNo}
        </h1>
        <p className="text-sm text-slate-500 font-medium">{workspace.team.competition}</p>
      </div>

      {/* Progress & Workload Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                <span>Sprint Progress</span>
              </h3>
              <b className="text-teal-700 text-xl font-extrabold">{workspace.progress.percent}%</b>
            </div>

            <div className="bar w-full mb-2">
              <i style={{ width: `${workspace.progress.percent}%` }}></i>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {workspace.progress.done} of {workspace.progress.total} tasks completed
            </p>

            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Team Members
            </h4>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {workspace.members.map((m) => (
                <span
                  key={m.userId}
                  className={`chip text-xs ${m.isLeader ? 'lead font-semibold' : ''}`}
                >
                  {m.name}
                  {m.isLeader ? ' (leader)' : ''}
                </span>
              ))}
            </div>

            {!workspace.team.leaderId && (
              <p className="text-xs text-slate-400 italic mt-2">
                This team has no assigned leader yet. Any member can manage milestones and project setup.
              </p>
            )}
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>Planned hours per member</span>
            </h3>
            <span className="text-xs text-slate-400">Task estimates</span>
          </div>
          <div className="flex-1 min-h-[200px]">
            <BarChart
              labels={memberNames}
              data={memberHours}
              labelName="Estimated Hours"
              minY={0}
            />
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-3 flex items-center gap-2">
          <Flag className="w-5 h-5 text-teal-600" />
          <span>Milestones</span>
        </h2>

        <div className="card">
          <div className="divide-y divide-[#e5eaf3]">
            {workspace.milestones.map((m) => {
              const late = !m.done && m.dueDate && m.dueDate < todayStr;
              return (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        m.done ? 'line-through text-slate-400' : 'font-medium text-slate-800'
                      }`}
                    >
                      {m.done ? '✔ ' : '○ '}
                      {m.title}
                    </span>
                    {m.dueDate && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {m.dueDate}
                      </span>
                    )}
                    {late && (
                      <span className="badge warn text-[10px] font-bold">Overdue</span>
                    )}
                  </div>

                  {workspace.me.canManage && (
                    <button
                      type="button"
                      onClick={() => handleToggleMilestone(m.id)}
                      className="btn ghost text-xs py-1 px-3"
                    >
                      {m.done ? 'Reopen' : 'Mark done'}
                    </button>
                  )}
                </div>
              );
            })}

            {workspace.milestones.length === 0 && (
              <p className="text-xs text-slate-400 py-3 text-center">No milestones scheduled yet.</p>
            )}
          </div>

          {workspace.me.canManage && (
            <form onSubmit={handleAddMilestone} className="mt-4 pt-4 border-t border-[#e5eaf3]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New milestone
                  </label>
                  <input
                    type="text"
                    value={milestoneTitle}
                    onChange={(e) => setMilestoneTitle(e.target.value)}
                    placeholder="e.g. Dataset ready / Model evaluation complete"
                    required
                    className="w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={milestoneDueDate}
                    onChange={(e) => setMilestoneDueDate(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
              </div>
              <button type="submit" className="btn text-xs py-1.5 px-4 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add milestone</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Tasks Kanban Board */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-3 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-teal-600" />
          <span>Tasks</span>
        </h2>

        {/* Add Task Form (available to members) */}
        {workspace.me.isMember && (
          <form onSubmit={handleAddTask} className="card mb-6 bg-slate-50 border-teal-200">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-3">
              Add New Task
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task</label>
                <input
                  type="text"
                  placeholder="e.g. Clean the training dataset"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned to</label>
                <select
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-xs"
                >
                  <option value="">Unassigned</option>
                  {workspace.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="100"
                  step="0.5"
                  value={taskHours}
                  onChange={(e) => setTaskHours(Number(e.target.value))}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  min={todayStr}
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <button type="submit" className="btn text-xs py-1.5 px-4 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add task</span>
            </button>
          </form>
        )}

        {/* 3 Columns: To do, In progress, Done */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['todo', 'doing', 'done'] as const).map((colKey) => {
            const colTitle =
              colKey === 'todo' ? 'To do' : colKey === 'doing' ? 'In progress' : 'Done';
            const colTasks = workspace.tasks.filter((t) => t.status === colKey);

            return (
              <div key={colKey} className="card bg-slate-50 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-sm text-slate-800">{colTitle}</h3>
                  <span className="text-xs bg-slate-200/80 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colTasks.map((t) => {
                    const isLate = colKey !== 'done' && t.deadline && t.deadline < todayStr;
                    return (
                      <div key={t.id} className="task p-3 bg-white">
                        <div className="font-semibold text-xs text-slate-900 mb-1">{t.title}</div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          <span className="font-medium text-slate-700">{t.assignee}</span> · {t.estimatedHours}h
                          {t.deadline && <span> · due {t.deadline}</span>}
                        </div>

                        {isLate && (
                          <div className="badge warn text-[10px] mb-2 font-bold flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </div>
                        )}

                        {t.canEdit && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                            {colKey !== 'todo' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(t.id, 'todo')}
                                className="btn ghost text-[10px] py-0.5 px-2 cursor-pointer"
                              >
                                To do
                              </button>
                            )}
                            {colKey !== 'doing' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(t.id, 'doing')}
                                className="btn ghost text-[10px] py-0.5 px-2 cursor-pointer"
                              >
                                Start
                              </button>
                            )}
                            {colKey !== 'done' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(t.id, 'done')}
                                className="btn text-[10px] py-0.5 px-2 cursor-pointer"
                              >
                                Done
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="text-xs text-slate-400 py-6 text-center italic">
                      Nothing here.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase 7: Project Deliverable & Event Submission */}
      <div className="mt-8 card border-teal-200 bg-gradient-to-br from-white via-white to-teal-50/30">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Flag className="w-5 h-5 text-teal-600" />
              <span>Team Deliverable & Project Submission (Phase 7)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit your team's code repository and project documentation for coordinator evaluation.
            </p>
          </div>

          {workspace.team.isSubmitted ? (
            <span className="badge font-bold bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
              ✓ Project Submitted
            </span>
          ) : (
            <span className="badge warn font-bold">Submission Pending</span>
          )}
        </div>

        {workspace.team.isSubmitted ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-sm text-slate-900">{workspace.team.projectTitle}</div>
                <p className="text-slate-600 mt-1">{workspace.team.projectDescription}</p>
              </div>
              {workspace.team.evaluationScore !== undefined && (
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Judge Score</div>
                  <div className="text-xl font-extrabold text-teal-700">
                    {workspace.team.evaluationScore} / 100
                  </div>
                </div>
              )}
            </div>

            {workspace.team.projectRepoUrl && (
              <div className="pt-2">
                <a
                  href={workspace.team.projectRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  🔗 Repository: {workspace.team.projectRepoUrl}
                </a>
              </div>
            )}

            {workspace.team.feedback && (
              <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                <b className="text-slate-800">Coordinator Feedback:</b> {workspace.team.feedback}
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const title = (target.elements.namedItem('ptitle') as HTMLInputElement).value;
              const repo = (target.elements.namedItem('prepo') as HTMLInputElement).value;
              const desc = (target.elements.namedItem('pdesc') as HTMLTextAreaElement).value;
              const notes = (target.elements.namedItem('pnotes') as HTMLTextAreaElement).value;

              store.submitTeamProject(teamId, {
                projectTitle: title,
                projectRepoUrl: repo,
                projectDescription: desc,
                submissionNotes: notes,
              });
              onToast('Project deliverable submitted to coordinator for evaluation!');
              loadData();
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  name="ptitle"
                  type="text"
                  placeholder="e.g. SkillSync Autonomous Agent"
                  required
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">GitHub / Code Repository URL</label>
                <input
                  name="prepo"
                  type="url"
                  placeholder="https://github.com/team-repo/hackathon-project"
                  required
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Project Description & Architecture</label>
              <textarea
                name="pdesc"
                rows={2}
                placeholder="Explain the project features, system design, and algorithms implemented..."
                required
                className="w-full text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Submission Notes (Optional)</label>
              <textarea
                name="pnotes"
                rows={1}
                placeholder="Deployment URLs, test accounts, or evaluator instructions..."
                className="w-full text-xs"
              />
            </div>

            <button type="submit" className="btn text-xs py-2 px-5">
              Submit Team Project Deliverable
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
