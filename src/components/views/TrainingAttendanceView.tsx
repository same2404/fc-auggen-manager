import React, { useState, useRef, useEffect } from 'react';
import { User, Plus, Trash2, Pencil, X, BarChart2, Calendar, Shield, Activity, Info, TrendingUp, Users } from 'lucide-react';
import { Spieler, Player, AttendanceRecord } from '../../types';
import { sortPlayers, isPlayer } from '../../utils/playerSorting';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell 
} from 'recharts';

interface TrainingAttendanceViewProps {
  players: Spieler[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (playerId: string, sessionNum: number, status: string) => void;
  onUpdatePlayer: (id: string, field: keyof Spieler, value: any) => void;
  onEditPlayer: (player: Spieler) => void;
  onDeletePlayer: (id: string) => void;
  onClearSession: (sessionNum: number) => void;
  onClearRangeSessions?: (start: number, end: number) => void;
  onClearAllSessions?: () => void;
  onAddPlayer?: () => void;
  isEditing: boolean;
}

const ATTENDANCE_OPTIONS = [
  { key: 'x', label: 'Anwesend', color: 'bg-green-600', textColor: 'text-green-600' },
  { key: 'e', label: 'Entschuldigt', color: 'bg-blue-600', textColor: 'text-blue-600' },
  { key: 'u', label: 'Unentschuldigt', color: 'bg-red-600', textColor: 'text-red-600' },
  { key: 'k', label: 'Krank', color: 'bg-yellow-600', textColor: 'text-yellow-600' },
  { key: 'P', label: 'Privat', color: 'bg-purple-600', textColor: 'text-purple-600' },
  { key: 'L', label: 'Lehrgang', color: 'bg-orange-600', textColor: 'text-orange-600' },
  { key: 'v', label: 'Verletzt', color: 'bg-gray-400', textColor: 'text-gray-400' },
  { key: '', label: 'Leeren', color: 'bg-gray-200', textColor: 'text-gray-400' },
];

export const TrainingAttendanceView: React.FC<TrainingAttendanceViewProps> = ({
  players,
  attendance,
  onUpdateAttendance,
  onUpdatePlayer,
  onEditPlayer,
  onDeletePlayer,
  onClearSession,
  onClearRangeSessions,
  onClearAllSessions,
  onAddPlayer,
  isEditing
}) => {
  const [activePopover, setActivePopover] = useState<{ playerId: string, sessionNum: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [rangePreset, setRangePreset] = useState<string>('all');
  const [startSession, setStartSession] = useState<number>(6);
  const [endSession, setEndSession] = useState<number>(120);
  const [posFilter, setPosFilter] = useState<string>('all');
  const [chartType, setChartType] = useState<'vertical' | 'horizontal'>('vertical');

  // Find latest session with any attendance data
  const latestSessionWithData = React.useMemo(() => {
    let maxSession = 6;
    attendance.forEach(rec => {
      const sess = rec.sessions || {};
      Object.keys(sess).forEach(k => {
        const num = parseInt(k);
        if (!isNaN(num) && num > maxSession && sess[num]) {
          maxSession = num;
        }
      });
    });
    return maxSession;
  }, [attendance]);

  useEffect(() => {
    if (rangePreset === 'all') {
      setStartSession(6);
      setEndSession(120);
    } else if (rangePreset === 'vorrunde') {
      setStartSession(6);
      setEndSession(60);
    } else if (rangePreset === 'rueckrunde') {
      setStartSession(61);
      setEndSession(120);
    } else if (rangePreset === 'last10') {
      const end = latestSessionWithData;
      setStartSession(Math.max(6, end - 9));
      setEndSession(end);
    } else if (rangePreset === 'last20') {
      const end = latestSessionWithData;
      setStartSession(Math.max(6, end - 19));
      setEndSession(end);
    }
  }, [rangePreset, latestSessionWithData]);

  const getPositionCategory = (pos: string) => {
    const p = (pos || '').toUpperCase();
    if (p.includes('TW') || p.includes('TOR')) return 'Torwart';
    if (p.includes('IV') || p.includes('RV') || p.includes('LV') || p.includes('AV') || p.includes('ABW')) return 'Abwehr';
    if (p.includes('DM') || p.includes('ZM') || p.includes('OM') || p.includes('RM') || p.includes('LM') || p.includes('6') || p.includes('8') || p.includes('10')) return 'Mittelfeld';
    if (p.includes('ST') || p.includes('MS') || p.includes('LA') || p.includes('RA') || p.includes('FL') || p.includes('ANG')) return 'Angriff';
    return 'Sonstige';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sessions = Array.from({ length: 115 }, (_, i) => i + 6);

  const getStatusColor = (status: string) => {
    const option = ATTENDANCE_OPTIONS.find(o => o.key === status);
    return option ? option.textColor : 'text-gray-300';
  };

  const calculateStats = (playerId: string) => {
    const record = attendance.find(a => a.playerId === playerId);
    if (!record) return { gesamt: 0, vor: 0, rueck: 0, quote: '0.0 %' };

    const sessionsData = record.sessions || {};
    // Only consider sessions that are currently displayed (6-120)
    const sessionEntries = Object.entries(sessionsData)
      .filter(([num]) => sessions.includes(parseInt(num)));
    
    const sessionValues = sessionEntries.map(([_, status]) => status);
    const totalAttended = sessionValues.filter(s => s === 'x').length;
    
    const vorAttended = sessionEntries
      .filter(([num, status]) => parseInt(num) <= 60 && status === 'x').length;
    
    const rueckAttended = sessionEntries
      .filter(([num, status]) => parseInt(num) > 60 && status === 'x').length;

    // New calculation: Only players who were present for all sessions get 100%.
    // All other statuses (e=excused, u=unexcused, k=sick, P=private, L=course, v=injured) are counted in the denominator and calculated proportionally.
    const excused = sessionValues.filter(s => s === 'e').length;
    const unexcused = sessionValues.filter(s => s === 'u').length;
    const sick = sessionValues.filter(s => s === 'k').length;
    const privat = sessionValues.filter(s => s === 'P').length;
    const course = sessionValues.filter(s => s === 'L').length;
    const injured = sessionValues.filter(s => s === 'v').length;

    const relevantSessions = totalAttended + excused + unexcused + sick + privat + course + injured;
    
    let quote = '0.0 %';
    if (relevantSessions > 0) {
      quote = ((totalAttended / relevantSessions) * 100).toFixed(1) + ' %';
    }

    return {
      gesamt: totalAttended,
      vor: vorAttended,
      rueck: rueckAttended,
      quote
    };
  };

  const handleCellClick = (playerId: string, sessionNum: number, currentStatus: string) => {
    if (!isEditing) return;
    
    const currentIndex = ATTENDANCE_OPTIONS.findIndex(opt => opt.key === currentStatus);
    const nextIndex = (currentIndex + 1) % ATTENDANCE_OPTIONS.length;
    const nextStatus = ATTENDANCE_OPTIONS[nextIndex].key;
    
    onUpdateAttendance(playerId, sessionNum, nextStatus);
  };

  const renderTableSection = (title: string, category: string) => {
    const filteredPlayers = sortPlayers(players.filter(p => {
      if (category === 'player') return isPlayer(p);
      const cat = (p.category || 'player').toLowerCase();
      if (category === 'coach') return cat === 'coach' || cat === 'trainer';
      if (category === 'staff') return cat === 'staff' || cat === 'funktionär' || cat === 'betreuer' || cat === 'teammanager';
      if (category === 'medical') return cat === 'medical' || cat === 'medizinisch' || cat === 'arzt' || cat === 'ärztlich' || cat === 'physio';
      return false;
    }));
    
    return (
      <>
        <tr className="bg-gray-200">
          <td colSpan={sessions.length + 10} className="p-2 font-black uppercase text-xs tracking-widest border border-black">
            {title}
          </td>
        </tr>
        {filteredPlayers.map((player, idx) => {
          const stats = calculateStats(player.id);
          const record = attendance.find(a => a.playerId === player.id);

          return (
            <tr key={player.id} className="hover:bg-gray-50 transition-colors">
              <td className="p-2 border border-black text-center">{idx + 1}</td>
              <td className="p-2 border border-black">
                <input 
                  type="text"
                  className={`w-full bg-transparent focus:outline-none ${!isEditing ? 'cursor-not-allowed' : 'font-bold uppercase'}`}
                  value={player.lastName || ''}
                  onChange={(e) => onUpdatePlayer(player.id, 'lastName', e.target.value)}
                  disabled={!isEditing}
                />
              </td>
              <td className="p-2 border border-black text-center uppercase">{player.position}</td>
              <td className="p-2 border border-black text-center">{player.number || player.nummer}</td>
              <td className="p-2 border border-black text-center font-black">{stats.gesamt}</td>
              <td className="p-2 border border-black text-center">{stats.vor}</td>
              <td className="p-2 border border-black text-center">{stats.rueck}</td>
              <td className="p-2 border border-black text-center text-[8px]">{stats.quote}</td>
              {isEditing && (
                <td className="p-2 border border-black text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onEditPlayer(player)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => {
                        onDeletePlayer(player.id);
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              )}
              {sessions.map(num => {
                const status = (record?.sessions && record.sessions[num]) || record?.[`sessions.${num}`] || '';
                const isPopoverActive = activePopover?.playerId === player.id && activePopover?.sessionNum === num;

                return (
                  <td 
                    key={num} 
                    className={`p-0 border border-black text-center min-w-[32px] relative hover:bg-gray-100 ${getStatusColor(status)}`}
                  >
                    <div 
                      className="w-full h-full min-h-[24px] flex items-center justify-center cursor-pointer"
                      onClick={() => handleCellClick(player.id, num, status)}
                      onContextMenu={(e) => {
                        if (!isEditing) return;
                        e.preventDefault();
                        setActivePopover({ playerId: player.id, sessionNum: num });
                      }}
                    >
                      <span className="font-black uppercase select-none">{status}</span>
                    </div>

                    {isPopoverActive && (
                      <div 
                        ref={popoverRef}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 p-2 min-w-[140px]"
                      >
                        <div className="grid grid-cols-4 gap-1">
                          {ATTENDANCE_OPTIONS.map(opt => (
                            <button
                              key={opt.key}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateAttendance(player.id, num, opt.key);
                                setActivePopover(null);
                              }}
                              className={`w-8 h-8 flex items-center justify-center font-black uppercase border border-black hover:scale-110 transition-transform ${opt.key === status ? 'bg-black text-white' : 'bg-white ' + opt.textColor}`}
                              title={opt.label}
                            >
                              {opt.key || <X size={12} />}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-[8px] uppercase font-bold text-center border-t border-black pt-1">
                          Status wählen
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs font-bold font-sans">
          <p className="font-black uppercase border-b border-black pb-1 mb-1 text-red-700">{data.lastName}</p>
          <p className="text-gray-700">Kumulierte Belastung: <span className="font-black text-black">{data.load} Pkt.</span></p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1 border-t border-dashed border-gray-300 pt-1 text-[10px]">
            <p className="text-green-600">Anwesend: <span className="font-bold text-black">{data.attended}</span></p>
            <p className="text-orange-600">Lehrgang: <span className="font-bold text-black">{data.course}</span></p>
            <p className="text-gray-500">Verletzt: <span className="font-bold text-black">{data.injured}</span></p>
            <p className="text-blue-600">Entschuldigt: <span className="font-bold text-black">{data.excused}</span></p>
            <p className="text-red-600">Unentschuldigt: <span className="font-bold text-black">{data.unexcused}</span></p>
            <p className="text-yellow-600">Krank: <span className="font-bold text-black">{data.sick}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Compute chart data
  const chartData = React.useMemo(() => {
    const squadPlayers = players.filter(isPlayer);
    const filteredByPos = squadPlayers.filter(p => {
      if (posFilter === 'all') return true;
      return getPositionCategory(p.position) === posFilter;
    });

    return filteredByPos.map(player => {
      const record = attendance.find(a => a.playerId === player.id);
      let totalLoad = 0;
      let countAttended = 0;
      let countExcused = 0;
      let countUnexcused = 0;
      let countSick = 0;
      let countPrivate = 0;
      let countCourse = 0;
      let countInjured = 0;

      for (let s = startSession; s <= endSession; s++) {
        const status = (record?.sessions && record.sessions[s]) || record?.[`sessions.${s}`] || '';
        
        if (status === 'x') {
          totalLoad += 100;
          countAttended++;
        } else if (status === 'L') {
          totalLoad += 80;
          countCourse++;
        } else if (status === 'v') {
          totalLoad += 30;
          countInjured++;
        } else if (status === 'e') {
          countExcused++;
        } else if (status === 'u') {
          countUnexcused++;
        } else if (status === 'k') {
          countSick++;
        } else if (status === 'P') {
          countPrivate++;
        }
      }

      return {
        id: player.id,
        name: `${player.lastName || ''} (${player.number || player.nummer || '#'})`,
        lastName: player.lastName || '',
        load: totalLoad,
        attended: countAttended,
        excused: countExcused,
        unexcused: countUnexcused,
        sick: countSick,
        private: countPrivate,
        course: countCourse,
        injured: countInjured
      };
    }).sort((a, b) => b.load - a.load);
  }, [players, attendance, startSession, endSession, posFilter]);

  const dashboardStats = React.useMemo(() => {
    if (chartData.length === 0) {
      return { 
        max: 0, min: 0, avg: 0, topPerformer: 'Keine', 
        highCount: 0, medCount: 0, lowCount: 0, maxPossibleLoad: 100, totalSessions: 1 
      };
    }
    
    const loads = chartData.map(d => d.load);
    const sum = loads.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / chartData.length);
    const max = Math.max(...loads);
    const min = Math.min(...loads);
    
    const topPlayers = chartData.filter(d => d.load === max).map(d => d.lastName);
    const topPerformer = topPlayers.length > 0 ? topPlayers.join(', ') : 'Keine';
    
    const totalSessions = Math.max(1, endSession - startSession + 1);
    const maxPossibleLoad = totalSessions * 100;
    
    let highCount = 0;
    let medCount = 0;
    let lowCount = 0;
    
    chartData.forEach(d => {
      const pct = (d.load / maxPossibleLoad) * 100;
      if (pct >= 75) highCount++;
      else if (pct >= 40) medCount++;
      else lowCount++;
    });
    
    return {
      max,
      min,
      avg,
      topPerformer,
      highCount,
      medCount,
      lowCount,
      maxPossibleLoad,
      totalSessions
    };
  }, [chartData, startSession, endSession]);

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden watermark-bg">
      <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <h3 className="font-black uppercase text-sm tracking-widest">Trainingsbeteiligung</h3>
            
            {/* View Mode Switcher */}
            <div className="flex border-2 border-black divide-x-2 divide-black font-black text-[10px]">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 uppercase transition-colors flex items-center gap-1 ${viewMode === 'table' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black'}`}
              >
                <Users size={12} /> Tabelle
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-2.5 py-1 uppercase transition-colors flex items-center gap-1 ${viewMode === 'chart' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100 text-black'}`}
              >
                <BarChart2 size={12} /> Belastungsanalyse
              </button>
            </div>
          </div>

          {viewMode === 'table' && (
            <div className="text-[10px] font-bold uppercase opacity-60 flex gap-3 flex-wrap">
              <span>LEGENDE:</span>
              <span><span className="text-green-600 font-black">x</span>=Anwesend</span>
              <span><span className="text-blue-600 font-black">e</span>=Entschuldigt</span>
              <span><span className="text-red-600 font-black">u</span>=Unentschuldigt</span>
              <span><span className="text-yellow-600 font-black">k</span>=Krank</span>
              <span><span className="text-purple-600 font-black">P</span>=Privat</span>
              <span><span className="text-orange-600 font-black">L</span>=Lehrgang</span>
              <span><span className="text-gray-400 font-black">v</span>=Verletzt</span>
              <span className="ml-4 text-black/40 italic">(Klick zum Durchschalten • Rechtsklick für Auswahl)</span>
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex items-center gap-2">
            {onClearRangeSessions && (
              <div className="flex gap-2">
                <button 
                  onClick={() => onClearRangeSessions(1, 54)}
                  className="bg-red-800 text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-2"
                  title="Die ersten 54 Einheiten löschen"
                >
                  <Trash2 size={14} /> 1-54
                </button>
                {onClearAllSessions && (
                  <button 
                    onClick={onClearAllSessions}
                    className="bg-red-950 text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-2"
                    title="Alle Einheiten löschen"
                  >
                    <Trash2 size={14} /> ALLE
                  </button>
                )}
              </div>
            )}
            <button 
              onClick={onAddPlayer}
              className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus size={14} /> HINZUFÜGEN
            </button>
          </div>
        )}
      </div>

      {viewMode === 'table' ? (
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full border-collapse text-[10px] font-bold">
            <thead className="sticky top-0 bg-black text-white z-20">
              <tr>
                <th className="p-2 border border-white/20 text-left w-10">Nr</th>
                <th className="p-2 border border-white/20 text-left w-48">Spieler (Nachname)</th>
                <th className="p-2 border border-white/20 text-center w-12">Pos</th>
                <th className="p-2 border border-white/20 text-center w-12">Rück.Nr</th>
                <th className="p-2 border border-white/20 text-center w-12">Gesamt</th>
                <th className="p-2 border border-white/20 text-center w-12">Vor.</th>
                <th className="p-2 border border-white/20 text-center w-12">Rück.</th>
                <th className="p-2 border border-white/20 text-center w-16">Quote</th>
                {isEditing && <th className="p-2 border border-white/20 text-center w-20">Aktion</th>}
                {sessions.map(num => (
                  <th key={num} className="p-1 border border-white/20 text-center w-8 min-w-[32px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>{num}</span>
                      {isEditing && (
                        <button 
                          onClick={() => onClearSession(num)}
                          className="text-red-400 hover:text-red-200 transition-colors"
                          title="Spalte leeren"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderTableSection('Spielerkader', 'player')}
              {renderTableSection('Trainerteam', 'coach')}
              {renderTableSection('Funktionsteam (Leitung / Betreuung)', 'staff')}
              {renderTableSection('Medizinische Abteilung (Physio / Arzt)', 'medical')}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50 custom-scrollbar text-black">
          {/* Controls Box */}
          <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-red-700" /> Zeitraum (Einheiten)
              </label>
              <select
                value={rangePreset}
                onChange={(e) => setRangePreset(e.target.value)}
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 focus:outline-none bg-white uppercase text-[11px]"
              >
                <option value="all">Gesamte Saison (6-120)</option>
                <option value="vorrunde">Vorrunde (6-60)</option>
                <option value="rueckrunde">Rückrunde (61-120)</option>
                <option value="last10">Letzte 10 Einheiten</option>
                <option value="last20">Letzte 20 Einheiten</option>
                <option value="custom">Individueller Bereich (Slider)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <User size={14} className="text-red-700" /> Positionsgruppe
              </label>
              <select
                value={posFilter}
                onChange={(e) => setPosFilter(e.target.value)}
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 focus:outline-none bg-white uppercase text-[11px]"
              >
                <option value="all">Alle Spieler</option>
                <option value="Torwart">Torwart (TW)</option>
                <option value="Abwehr">Abwehr (ABW)</option>
                <option value="Mittelfeld">Mittelfeld (MF)</option>
                <option value="Angriff">Angriff (ANG)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Activity size={14} className="text-red-700" /> Diagramm-Typ
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'vertical' | 'horizontal')}
                className="w-full border-2 border-black p-2 font-bold focus:bg-gray-50 focus:outline-none bg-white uppercase text-[11px]"
              >
                <option value="vertical">Balkendiagramm (Vertikal)</option>
                <option value="horizontal">Säulendiagramm (Horizontal)</option>
              </select>
            </div>

            {rangePreset === 'custom' ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="font-bold uppercase text-[9px] text-gray-600">Von: {startSession}</span>
                  <input
                    type="range"
                    min={6}
                    max={endSession}
                    value={startSession}
                    onChange={(e) => setStartSession(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bold uppercase text-[9px] text-gray-600">Bis: {endSession}</span>
                  <input
                    type="range"
                    min={startSession}
                    max={120}
                    value={endSession}
                    onChange={(e) => setEndSession(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2 border border-dashed border-gray-300 rounded text-center text-gray-500 font-bold uppercase text-[10px]">
                Einheiten {startSession} bis {endSession} ({dashboardStats.totalSessions} Einheiten)
              </div>
            )}
          </div>

          {/* Stats Summary Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="p-2.5 bg-red-100 border border-black rounded">
                <Activity size={20} className="text-red-700" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Kader-Schnitt</p>
                <p className="text-lg font-black">{dashboardStats.avg} Pkt.</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">v. max. {dashboardStats.maxPossibleLoad} Pkt.</p>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="p-2.5 bg-yellow-100 border border-black rounded">
                <TrendingUp size={20} className="text-yellow-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Höchste Belastung</p>
                <p className="text-base font-black truncate text-red-700" title={dashboardStats.topPerformer}>
                  {dashboardStats.topPerformer}
                </p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Wert: {dashboardStats.max} Pkt.</p>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="p-2.5 bg-green-100 border border-black rounded">
                <Users size={20} className="text-green-700" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Aktive Spieler</p>
                <p className="text-lg font-black">{chartData.length}</p>
                <p className="text-[9px] text-gray-500 font-bold uppercase">im Filterbereich</p>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
              <div className="p-2.5 bg-blue-100 border border-black rounded">
                <Shield size={20} className="text-blue-700" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Belastungszonen</p>
                <div className="flex gap-2 mt-0.5 font-bold text-[10px]">
                  <span className="text-red-700" title="Hoch (>75%)">H: {dashboardStats.highCount}</span>
                  <span className="text-yellow-700" title="Mittel (40%-75%)">M: {dashboardStats.medCount}</span>
                  <span className="text-green-700" title="Gering (<40%)">G: {dashboardStats.lowCount}</span>
                </div>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Grenzwerte (% v. Max)</p>
              </div>
            </div>
          </div>

          {/* Chart Board */}
          <div className="bg-white border-2 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-black pb-3">
              <h4 className="font-black uppercase tracking-wider text-xs flex items-center gap-2">
                <BarChart2 size={16} className="text-red-700" /> Kumulierte Belastungs-Kurve
              </h4>
              <span className="font-mono text-[9px] bg-black text-white px-2 py-0.5 rounded uppercase font-bold">
                Einheiten {startSession} - {endSession}
              </span>
            </div>

            <div className="w-full h-[450px]">
              {chartData.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 text-gray-500 font-bold uppercase text-xs gap-2">
                  <Info size={24} className="text-gray-400" />
                  Keine Daten im aktuellen Filterbereich verfügbar
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'vertical' ? (
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e5e7eb" />
                      <XAxis 
                        type="number" 
                        domain={[0, dashboardStats.maxPossibleLoad]} 
                        tick={{ fontSize: 9, fontWeight: 'bold', fill: '#000000' }}
                        tickFormatter={(val) => `${val} P`}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={140} 
                        tick={{ fontSize: 9, fontWeight: 'black', fill: '#000000' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="load" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => {
                          const maxPossible = dashboardStats.maxPossibleLoad;
                          const pct = (entry.load / maxPossible) * 100;
                          let fill = '#16a34a'; // green
                          if (pct >= 75) fill = '#dc2626'; // red
                          else if (pct >= 40) fill = '#ca8a04'; // yellow
                          
                          return <Cell key={`cell-${index}`} fill={fill} stroke="#000000" strokeWidth={1} />;
                        })}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 9, fontWeight: 'black', fill: '#000000', angle: -45, textAnchor: 'end' }}
                        interval={0}
                        height={70}
                      />
                      <YAxis 
                        type="number" 
                        domain={[0, dashboardStats.maxPossibleLoad]}
                        tick={{ fontSize: 9, fontWeight: 'bold', fill: '#000000' }}
                        tickFormatter={(val) => `${val} P`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => {
                          const maxPossible = dashboardStats.maxPossibleLoad;
                          const pct = (entry.load / maxPossible) * 100;
                          let fill = '#16a34a'; // green
                          if (pct >= 75) fill = '#dc2626'; // red
                          else if (pct >= 40) fill = '#ca8a04'; // yellow
                          
                          return <Cell key={`cell-${index}`} fill={fill} stroke="#000000" strokeWidth={1} />;
                        })}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Load Model Explanation Info */}
          <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-xs flex flex-col gap-2">
            <h5 className="font-black uppercase text-gray-700 tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
              <Info size={14} className="text-red-700" /> Wissenschaftliches Belastungsmodell
            </h5>
            <p className="text-gray-600 leading-relaxed">
              Die kumulierte Belastung wird tagesaktuell anhand der Anwesenheits- und Verbandstätigkeiten der Spieler berechnet. Verschiedene Statusmeldungen fließen mit unterschiedlichen Intensitätsfaktoren (Load Units) in die Berechnung ein:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-bold mt-1 text-[11px]">
              <div className="p-2 bg-green-50 border border-green-200 rounded flex justify-between items-center">
                <span>Anwesend (x)</span>
                <span className="text-green-700">100% (100 Pkt / EH)</span>
              </div>
              <div className="p-2 bg-orange-50 border border-orange-200 rounded flex justify-between items-center">
                <span>Lehrgang (L)</span>
                <span className="text-orange-700">80% (80 Pkt / EH)</span>
              </div>
              <div className="p-2 bg-gray-50 border border-gray-200 rounded flex justify-between items-center">
                <span>Verletzt (v)</span>
                <span className="text-gray-700">30% (30 Pkt / EH)</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 italic mt-1 font-bold">
              * Entschuldigte Fehltage (e), Unentschuldigte Fehltage (u), Krankheitstage (k) und private Absenzen (P) werden mit 0 Load Units verbucht, da keine physische Belastung im Mannschaftstraining stattfindet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
