import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/storage';
import { logout } from '../services/auth';
import { Users, LogOut, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
  titleSuffix?: string;
  onNavigateHome?: () => void;
  onToast: (msg: string) => void;
  onOpenWorkflowGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onUserChange,
  titleSuffix,
  onNavigateHome,
  onToast,
  onOpenWorkflowGuide,
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const handleLogout = () => {
    logout();
    onUserChange(null);
  };

  const handleSwitchUser = (selectedUser: User) => {
    onUserChange(selectedUser);
    setShowSwitchMenu(false);
    onToast(`Switched account to ${selectedUser.name} (${selectedUser.role})`);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to default initial state?')) {
      store.resetToDefault();
      const updatedUser = user ? store.getUserById(user.id) || store.getUserById(100) : null;
      onUserChange(updatedUser || null);
      onToast('Demo data reset to initial seed state.');
    }
  };

  const allUsers = store.getState().users;
  const coordinator = allUsers.find((u) => u.role === 'coordinator');
  const students = allUsers.filter((u) => u.role === 'student').slice(0, 8);

  return (
    <header className="bg-white/85 backdrop-blur-md border border-[#e5eaf3] rounded-2xl px-5 py-3 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onNavigateHome}
          className="text-left font-extrabold tracking-tight text-2xl logo transition hover:opacity-90 cursor-pointer flex items-center gap-1.5"
        >
          <span>Skill</span>
          <span className="text-[#0d9488]">Sync</span>
          {titleSuffix && (
            <span className="text-slate-400 font-normal text-sm ml-2 px-2 py-0.5 rounded-full bg-slate-100">
              {titleSuffix}
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        {onOpenWorkflowGuide && (
          <button
            type="button"
            onClick={onOpenWorkflowGuide}
            className="btn ghost text-xs py-1.5 px-3 flex items-center gap-1.5 border-teal-200 text-teal-800 bg-teal-50/70 hover:bg-teal-100/80 cursor-pointer shadow-xs"
            title="View 7-phase / 13-step workflow diagram"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden sm:inline font-bold">13-Step Workflow</span>
          </button>
        )}

        {user ? (
          <>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Switch demo account"
              >
                <Users className="w-4 h-4 text-[#0d9488]" />
                <span className="font-semibold">{user.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium capitalize">
                  {user.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-sm">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                    Quick Switch Role / Account
                  </div>
                  {coordinator && (
                    <button
                      type="button"
                      onClick={() => handleSwitchUser(coordinator)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between hover:bg-teal-50 cursor-pointer ${
                        user.id === coordinator.id ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div>{coordinator.name}</div>
                        <div className="text-xs text-slate-400">{coordinator.email}</div>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        Coordinator
                      </span>
                    </button>
                  )}
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Sample Students
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSwitchUser(s)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between hover:bg-teal-50 cursor-pointer text-xs ${
                          user.id === s.id ? 'bg-teal-50 font-bold text-teal-800' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <div>{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.email}</div>
                        </div>
                        <span className="text-[10px] text-teal-600 font-semibold">#{s.id}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-2 pt-1 flex justify-between">
                    <button
                      type="button"
                      onClick={handleResetData}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2 py-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Data
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="btn ghost flex items-center gap-1.5 text-xs py-1.5 px-3"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400">Not logged in</span>
        )}
      </div>
    </header>
  );
};
