import React, { useState, useEffect } from 'react';
import { User } from './types';
import { getSessionUser, setSessionUser } from './services/auth';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { WorkflowGuideModal } from './components/WorkflowGuide';
import { LoginView } from './views/LoginView';
import { StudentDashboard } from './views/StudentDashboard';
import { CoordinatorDashboard } from './views/CoordinatorDashboard';
import { TeamWorkspaceView } from './views/TeamWorkspaceView';

export function App() {
  const [user, setUser] = useState<User | null>(() => getSessionUser());
  const [currentView, setCurrentView] = useState<'dashboard' | 'team'>('dashboard');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleUserChange = (newUser: User | null) => {
    setUser(newUser);
    setSessionUser(newUser);
    setCurrentView('dashboard');
    setSelectedTeamId(null);
  };

  const handleOpenTeam = (teamId: number) => {
    setSelectedTeamId(teamId);
    setCurrentView('team');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedTeamId(null);
  };

  // If user logs out or session is empty
  if (!user) {
    return (
      <div className="min-h-screen">
        <LoginView onSuccess={handleUserChange} onToast={showToast} />
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-6">
      <div className="max-w-[1040px] mx-auto px-4">
        <Header
          user={user}
          onUserChange={handleUserChange}
          titleSuffix={user.role === 'coordinator' ? 'Coordinator' : undefined}
          onNavigateHome={handleBackToDashboard}
          onToast={showToast}
          onOpenWorkflowGuide={() => setShowWorkflowGuide(true)}
        />

        {currentView === 'team' && selectedTeamId ? (
          <TeamWorkspaceView
            user={user}
            teamId={selectedTeamId}
            onBack={handleBackToDashboard}
            onToast={showToast}
          />
        ) : user.role === 'coordinator' ? (
          <CoordinatorDashboard
            user={user}
            onOpenTeamWorkspace={handleOpenTeam}
            onToast={showToast}
          />
        ) : (
          <StudentDashboard
            user={user}
            onOpenTeam={handleOpenTeam}
            onToast={showToast}
          />
        )}
      </div>

      <WorkflowGuideModal
        isOpen={showWorkflowGuide}
        onClose={() => setShowWorkflowGuide(false)}
      />
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}

export default App;
