import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layers, Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  phase: string;
  description: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  phase,
  description,
}) => {
  const { role } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center mx-auto mb-4 text-cyan-400">
          <Construction className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/80 border border-cyan-800 text-cyan-300 mb-3">
          <Layers className="w-3.5 h-3.5" />
          {phase}
        </span>

        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
          {description}
        </p>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 max-w-md mx-auto mb-6 text-xs font-mono text-left space-y-1">
          <div className="flex justify-between text-slate-400">
            <span>MODULE STATUS:</span>
            <span className="text-amber-400 font-semibold">SCHEDULED FOR SUBSEQUENT PHASE</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>SECURITY ACCESS:</span>
            <span className="text-emerald-400 font-semibold">AUTHENTICATED ({role})</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>BACKEND CONTRACT:</span>
            <span className="text-slate-300">PROTECTED ROUTE VERIFIED</span>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
