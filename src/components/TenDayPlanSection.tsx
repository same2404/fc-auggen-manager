import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Activity, 
  Flame, 
  Zap, 
  ShieldAlert, 
  Smartphone, 
  Clock, 
  Target, 
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Award
} from 'lucide-react';
import { TEN_DAY_ACTIV_PLAN, TEN_DAY_ACTIV_RULES, TenDayPlanUnit } from '../data/tenDayPlan';

interface TenDayPlanSectionProps {
  onSyncWithRunTable?: (plan: TenDayPlanUnit[]) => void;
  isEditing?: boolean;
}

export const TenDayPlanSection: React.FC<TenDayPlanSectionProps> = ({ 
  onSyncWithRunTable,
  isEditing = false 
}) => {
  const [completedDays, setCompletedDays] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('fc_auggen_10_day_plan_completed');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [syncSuccessToast, setSyncSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('fc_auggen_10_day_plan_completed', JSON.stringify(completedDays));
    } catch (e) {
      console.error(e);
    }
  }, [completedDays]);

  const toggleDayCompletion = (dayId: number) => {
    setCompletedDays(prev => ({
      ...prev,
      [dayId]: !prev[dayId]
    }));
  };

  const handleResetProgress = () => {
    if (window.confirm('Möchtest du den Fortschritt des 10-Tage-Aktiv Plans wirklich zurücksetzen?')) {
      setCompletedDays({});
    }
  };

  const handleSyncClick = () => {
    if (onSyncWithRunTable) {
      onSyncWithRunTable(TEN_DAY_ACTIV_PLAN);
      setSyncSuccessToast('10-Tage-Plan wurde erfolgreich in die Lauf-Tabelle übernommen!');
      setTimeout(() => setSyncSuccessToast(null), 3500);
    }
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / TEN_DAY_ACTIV_PLAN.length) * 100);

  const getIntensityBadgeColor = (type: string) => {
    switch (type) {
      case 'Dauerlauf': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800';
      case 'Intervall leicht': return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800';
      case 'Fahrtspiel': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800';
      case 'Intervall intensiv': return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800';
      case 'Intervall': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800';
      case 'Sprints / Explosivität': return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-950 text-white rounded-2xl p-4 sm:p-6 shadow-xl mb-6 relative overflow-hidden">
      {/* Background Accent Lines */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sync Success Toast */}
      {syncSuccessToast && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-2xl border border-white flex items-center gap-2 animate-bounce">
          <Sparkles size={16} />
          <span>{syncSuccessToast}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-red-500 shadow-sm flex items-center gap-1">
              <Flame size={12} className="animate-pulse" />
              Offizielles Vorbereitungsprogramm
            </span>
            <span className="bg-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-md border border-slate-700 flex items-center gap-1">
              <Calendar size={12} className="text-amber-400" />
              17.06.2026 – 03.07.2026
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white flex items-center gap-2">
            <span>10-Tage-Aktiv Plan</span>
            <span className="text-xs font-black text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
              Verbindlich abarbeiten
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Vor-Vorbereitungsplan für alle Kader-Spieler des FC Auggen. Tracking über Adidas Running App an Athletik Klaus.
          </p>
        </div>

        {/* Progress & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Progress Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 px-3 min-w-[150px]">
            <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase text-slate-300 mb-1">
              <span>Fortschritt</span>
              <span className="text-amber-400 font-mono text-xs">{completedCount} / 10 ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-amber-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {onSyncWithRunTable && (
            <button
              onClick={handleSyncClick}
              className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs uppercase px-3.5 py-2.5 rounded-xl border border-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
              title="10-Tage Plan Daten in die 15-Lauf Spalten der Haupttabelle übernehmen"
            >
              <Sparkles size={15} />
              <span>In Tabelle laden</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-xl border border-slate-700 transition-colors"
            title={isExpanded ? 'Plan einklappen' : 'Plan ausklappen'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isExpanded && (
        <div className="mt-5 space-y-6">
          {/* 10 Days Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TEN_DAY_ACTIV_PLAN.map((unit) => {
              const isDone = !!completedDays[unit.id];
              return (
                <div 
                  key={unit.id}
                  onClick={() => toggleDayCompletion(unit.id)}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group relative overflow-hidden ${
                    isDone 
                      ? 'bg-emerald-950/40 border-emerald-700/80 shadow-inner' 
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-600 hover:bg-slate-950'
                  }`}
                >
                  {/* Top Day Header */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {unit.tag} • {unit.date}
                      </span>
                      <button 
                        type="button" 
                        className="text-slate-400 hover:text-white transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDayCompletion(unit.id);
                        }}
                      >
                        {isDone ? (
                          <CheckSquare size={18} className="text-emerald-400 fill-emerald-950" />
                        ) : (
                          <Square size={18} className="text-slate-500 group-hover:text-slate-300" />
                        )}
                      </button>
                    </div>

                    <h4 className={`font-black text-sm uppercase tracking-tight mb-1.5 ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {unit.title}
                    </h4>

                    {/* Type & Intensity Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${getIntensityBadgeColor(unit.type)}`}>
                        {unit.type}
                      </span>
                      <span className="bg-slate-800 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-700">
                        {unit.intensity}
                      </span>
                    </div>

                    {/* Content Details */}
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed mb-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                      <strong className="text-slate-200 font-bold block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">Inhalt:</strong>
                      {unit.content}
                    </p>
                  </div>

                  {/* Goal / Why Footer */}
                  <div className="pt-2 border-t border-slate-800/80 mt-1">
                    <p className="text-[10px] text-slate-400 font-medium italic flex items-start gap-1">
                      <Target size={12} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>{unit.goal}</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[9px] font-black uppercase">
                      <span className={isDone ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {isDone ? '[ x ] erledigt' : '[  ] ausstehend'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rahmenbedingungen & Vorgaben Section */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-500" />
                <span>Rahmenbedingungen & Vorgaben (verbindlich)</span>
              </h3>
              {completedCount > 0 && (
                <button
                  onClick={handleResetProgress}
                  className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Fortschritt zurücksetzen</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Rule 1 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 font-black uppercase text-[11px]">
                  <Activity size={14} className="text-amber-400" />
                  <span>1. Reihenfolge</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {TEN_DAY_ACTIV_RULES.reihenfolge}
                </p>
              </div>

              {/* Rule 2 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 font-black uppercase text-[11px]">
                  <Clock size={14} className="text-blue-400" />
                  <span>2. Ruhetage</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {TEN_DAY_ACTIV_RULES.ruhetage}
                </p>
              </div>

              {/* Rule 3 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 font-black uppercase text-[11px]">
                  <Flame size={14} className="text-rose-400" />
                  <span>3. Verletzungsprophylaxe</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {TEN_DAY_ACTIV_RULES.verletzungsprophylaxe}
                </p>
              </div>

              {/* Rule 4 */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-200 font-black uppercase text-[11px]">
                  <Smartphone size={14} className="text-emerald-400" />
                  <span>4. Datenübermittlung</span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  {TEN_DAY_ACTIV_RULES.datenuebermittlung}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
