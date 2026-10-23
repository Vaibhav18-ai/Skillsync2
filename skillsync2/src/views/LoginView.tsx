import React, { useState } from 'react';
import { User } from '../types';
import { login, register } from '../services/auth';

interface LoginViewProps {
  onSuccess: (user: User) => void;
  onToast: (msg: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess, onToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('student1@skillsync.test');
  const [password, setPassword] = useState('Demo@1234');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        const user = register(name, email);
        onToast(`Welcome to SkillSync, ${user.name}!`);
        onSuccess(user);
      } else {
        const user = login(email, password);
        onToast(`Logged in as ${user.name} (${user.role})`);
        onSuccess(user);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check credentials.');
    }
  };

  const setPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('Demo@1234');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8">
      <form
        id="f"
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/95 rounded-3xl border border-[#e5eaf3] p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#0d9488] to-[#2563eb] bg-clip-text text-transparent">
            SkillSync
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isRegister
              ? 'Create a student profile to join team competitions.'
              : 'Log in to see your competitions, balanced teams, and workspace.'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 text-xs font-semibold text-[#c2410c] bg-[#fff1e0] border border-[#fbd9b4] rounded-xl p-3"
          >
            {error}
          </div>
        )}

        {isRegister && (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              required
              className="w-full text-sm"
            />
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full text-sm"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full text-sm"
          />
        </div>

        <button type="submit" className="btn w-full py-3 text-base font-semibold shadow-lg">
          {isRegister ? 'Register as Student' : 'Log in'}
        </button>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-[#0d9488] font-semibold hover:underline cursor-pointer"
          >
            {isRegister ? 'Already have an account? Log in' : "Don't have an account? Register"}
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Demo quick credentials:
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPreset('coordinator@skillsync.test')}
              className="chip cursor-pointer text-[11px] hover:border-teal-400"
            >
              👨‍🏫 Prof. Sharma (Coordinator)
            </button>
            <button
              type="button"
              onClick={() => setPreset('student1@skillsync.test')}
              className="chip cursor-pointer text-[11px] hover:border-teal-400"
            >
              🎓 Aarav (Student 1)
            </button>
            <button
              type="button"
              onClick={() => setPreset('student2@skillsync.test')}
              className="chip cursor-pointer text-[11px] hover:border-teal-400"
            >
              🎓 Diya (Student 2)
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
