import React, { useState, useMemo } from 'react';
import { Player, Match, MatchMinuteRecord, Opponent } from '../../types';
import { isPlayer } from '../../utils/playerSorting';
import { Calendar, MapPin, Clock, Save, ChevronRight, ChevronLeft, Timer, Users, Trash2, Edit2, Plus, X, ChevronDown, LayoutGrid, List, ExternalLink, Trophy, Target, RotateCcw, Download, Award, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchPlanningViewProps {
  players: Player[];
  matches: Match[];
  matchMinutes: MatchMinuteRecord[];
  opponents: Opponent[];
  onSaveMatch: (match: Match) => Promise<void>;
  onDeleteMatch: (id: string | number) => Promise<void>;
  onSaveMinutes: (record: MatchMinuteRecord) => Promise<void>;
  onSaveOpponent: (opponent: Opponent) => Promise<void>;
  onDeleteOpponent: (id: string) => Promise<void>;
  onWipeAllMatches?: () => Promise<void>;
  onRestoreMatches?: () => Promise<void>;
  title?: string;
}

// KW calculation helper
const getKW = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
};

export const MatchPlanningView: React.FC<MatchPlanningViewProps> = ({
  players,
  matches,
  matchMinutes,
  opponents,
  onSaveMatch,
  onDeleteMatch,
  onSaveMinutes,
  onSaveOpponent,
  onDeleteOpponent,
  onWipeAllMatches,
  onRestoreMatches,
  title = "Pflichtspiel-Planung"
}) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string | number>(matches[0]?.id || '');
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'table'>(title.includes('Test') ? 'table' : 'list');
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  // Helper component for local state inputs to prevent hanging
  const EditableField = ({ 
    value, 
    onSave, 
    type = "text", 
    className = "", 
    isTextArea = false,
    listId = "",
    placeholder = ""
  }: { 
    value: string, 
    onSave: (val: string) => void, 
    type?: string, 
    className?: string,
    isTextArea?: boolean,
    listId?: string,
    placeholder?: string
  }) => {
    const [localValue, setLocalValue] = useState(value);
    
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    if (isTextArea) {
      return (
        <textarea 
          placeholder={placeholder}
          className={className}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => {
            if (localValue !== value) onSave(localValue);
          }}
        />
      );
    }

    return (
      <input 
        type={type}
        list={listId}
        placeholder={placeholder}
        className={className}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) onSave(localValue);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (localValue !== value) onSave(localValue);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    );
  };
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);
  const [newOpponentName, setNewOpponentName] = useState('');
  const [showDeleteMatchConfirm, setShowDeleteMatchConfirm] = useState(false);
  const [opponentToDelete, setOpponentToDelete] = useState<Opponent | null>(null);
  const [playerToReset, setPlayerToReset] = useState<Player | null>(null);

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'TBD';
    if (dateStr.includes('.')) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('de-DE');
  };

  const parseMatchDate = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('.')) {
      const parts = dateStr.split('.');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dateStr;
  };

  const selectedMatch = useMemo(() => 
    matches.find(m => m.id === selectedMatchId),
    [matches, selectedMatchId]
  );

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const dateA = parseMatchDate(a.date);
      const dateB = parseMatchDate(b.date);
      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return (Number(a.index) || 0) - (Number(b.index) || 0);
    });
  }, [matches]);

  const matchStats = useMemo(() => {
    let played = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const scorerMap: Record<string, number> = {};

    matches.forEach(m => {
      if (m.result && m.result.includes(':')) {
        played++;
        const parts = m.result.split(':').map(s => parseInt(s.trim(), 10));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
          const teamGoals = m.isHome ? parts[0] : parts[1];
          const oppGoals = m.isHome ? parts[1] : parts[0];
          goalsFor += teamGoals;
          goalsAgainst += oppGoals;

          if (teamGoals > oppGoals) wins++;
          else if (teamGoals === oppGoals) draws++;
          else losses++;
        }
      }

      if (m.scorers) {
        const tokens = m.scorers.split(/[,;\n]/);
        tokens.forEach(tok => {
          const cleaned = tok.trim();
          if (cleaned) {
            const countMatch = cleaned.match(/(.*?)\((\d+)\)/);
            if (countMatch) {
              const name = countMatch[1].trim();
              const cnt = parseInt(countMatch[2], 10) || 1;
              scorerMap[name] = (scorerMap[name] || 0) + cnt;
            } else {
              scorerMap[cleaned] = (scorerMap[cleaned] || 0) + 1;
            }
          }
        });
      }
    });

    const topScorers = Object.entries(scorerMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total: matches.length,
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      diff: goalsFor - goalsAgainst,
      topScorers
    };
  }, [matches]);

  const handleExportICS = (matchToExport?: Match) => {
    const listToExport = matchToExport ? [matchToExport] : sortedMatches;
    if (listToExport.length === 0) return;

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FC Auggen Match Plan//NONSGML v1.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${title}`
    ];

    listToExport.forEach(m => {
      const matchDateStr = parseMatchDate(m.date);
      const matchDate = matchDateStr ? new Date(matchDateStr + 'T' + (m.kickOff || '15:00')) : new Date();
      const endDate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
      const formatDateToICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      lines.push(
        'BEGIN:VEVENT',
        `UID:match-${m.id}-${Date.now()}@fc-auggen`,
        `DTSTAMP:${formatDateToICS(new Date())}`,
        `DTSTART:${formatDateToICS(matchDate)}`,
        `DTEND:${formatDateToICS(endDate)}`,
        `SUMMARY:[${m.isHome ? 'Heim' : 'Auswärts'}] FC Auggen vs. ${m.opponent}`,
        `LOCATION:${m.location || 'Auggen'}`,
        `DESCRIPTION:Anstoß: ${m.kickOff || 'TBD'} Uhr\\nTreffpunkt: ${m.meetingTime || 'TBD'} Uhr\\nErgebnis: ${m.result || 'Noch nicht gespielt'}\\nTorschützen: ${m.scorers || '-'}\\nNotizen: ${m.notes || '-'}`,
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = matchToExport ? `spiel_${matchToExport.opponent.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics` : `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMatchChange = (field: keyof Match, value: any) => {
    if (!selectedMatch) return;
    onSaveMatch({ ...selectedMatch, [field]: value });
  };

  const handleAddMatch = async () => {
    const newIndex = matches.length > 0 ? Math.max(...matches.map(m => Number(m.index) || 0)) + 1 : 1;
    const newMatch: Match = {
      id: `match_${Date.now()}`,
      index: newIndex,
      opponent: 'NEUER GEGNER',
      location: 'Auggen',
      isHome: true,
      kickOff: '15:30',
      endTime: '17:15',
      meetingTime: '14:15',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    await onSaveMatch(newMatch);
    setSelectedMatchId(newMatch.id);
  };

  const handleDeleteMatch = async () => {
    if (!selectedMatchId) return;
    
    const currentIdx = sortedMatches.findIndex(m => m.id === selectedMatchId);
    await onDeleteMatch(selectedMatchId);
    
    // Select another match
    if (sortedMatches.length > 1) {
      const nextIdx = currentIdx > 0 ? currentIdx - 1 : 1;
      setSelectedMatchId(sortedMatches[nextIdx].id);
    } else {
      setSelectedMatchId('');
    }
    setShowDeleteMatchConfirm(false);
  };

  const handleSaveOpponent = async () => {
    if (!newOpponentName.trim()) return;
    const opponent: Opponent = {
      id: editingOpponent?.id || `opp_${Date.now()}`,
      name: newOpponentName.trim()
    };
    await onSaveOpponent(opponent);
    setEditingOpponent(null);
    setNewOpponentName('');
  };

  const handleMinuteChange = (playerId: string, field: 'start' | 'end' | 'notes', value: string) => {
    if (!selectedMatchId) return;
    
    const record = matchMinutes.find(r => r.playerId === playerId) || {
      playerId,
      minutes: {},
      details: {}
    };

    const currentDetails = record.details || {};
    const currentMinutes = record.minutes || {};
    
    const matchDetails = currentDetails[selectedMatchId] || { start: '', end: '', notes: '' };
    const updatedDetails = { ...matchDetails, [field]: value };
    
    // Calculate minutes
    let minutes = 0;
    const start = field === 'start' ? value : updatedDetails.start;
    const end = field === 'end' ? value : updatedDetails.end;
    
    if (start && end) {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      if (endTotal > startTotal) {
        minutes = endTotal - startTotal;
      }
    }

    onSaveMinutes({
      ...record,
      details: { ...currentDetails, [selectedMatchId]: updatedDetails },
      minutes: { ...currentMinutes, [selectedMatchId]: minutes }
    });
  };

  const calculateTotalMinutes = (playerId: string) => {
    const record = matchMinutes.find(r => r.playerId === playerId);
    if (!record || !record.minutes) return 0;
    return Object.values(record.minutes).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  const handleResetPlayerMinutes = async (playerId: string) => {
    const record = matchMinutes.find(r => r.playerId === playerId);
    if (!record) return;

    await onSaveMinutes({
      ...record,
      minutes: {},
      details: {}
    });
    setPlayerToReset(null);
  };

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h2>
          
          <div className="flex items-center gap-2 bg-black/5 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-black/5'
              }`}
            >
              <LayoutGrid size={14} />
              Übersicht
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'table' ? 'bg-black text-white' : 'hover:bg-black/5'
              }`}
            >
              <List size={14} />
              Tabellen-Plan
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'detail' ? 'bg-black text-white' : 'hover:bg-black/5'
              }`}
            >
              <Target size={14} />
              Spiel-Details
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {onRestoreMatches && (
            <button 
              onClick={onRestoreMatches}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-800 px-3 py-2 font-black uppercase text-xs transition-colors flex items-center gap-2 shadow-sm"
              title="Alle 32 Pflichtspiele der Saison 2026/2027 wiederherstellen"
            >
              <RotateCcw size={14} /> Pflichtspiele wiederherstellen
            </button>
          )}
          {onWipeAllMatches && (
            confirmWipe ? (
              <div className="flex gap-1 items-center bg-red-50 p-1 border-2 border-[#C00000] rounded">
                <span className="text-[10px] font-black uppercase text-[#C00000] px-1">Sicher?</span>
                <button 
                  onClick={async () => {
                    await onWipeAllMatches();
                    setConfirmWipe(false);
                  }}
                  className="bg-[#C00000] text-white px-2 py-1 font-black uppercase text-[10px] hover:bg-red-800 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} /> Ja, alle löschen
                </button>
                <button 
                  onClick={() => setConfirmWipe(false)}
                  className="bg-white text-black px-2 py-1 font-black uppercase text-[10px] hover:bg-gray-100 transition-colors border border-black"
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmWipe(true)}
                className="bg-red-50 text-[#C00000] border-2 border-[#C00000] px-4 py-2 font-black uppercase text-xs hover:bg-red-100 transition-colors flex items-center gap-2"
                title="Alle Pflichtspiele, Tabellenplanung und Spielerstatistiken komplett zurücksetzen"
              >
                <Trash2 size={14} /> Alle löschen
              </button>
            )
          )}
          <button 
            onClick={() => handleExportICS()}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 font-black uppercase text-xs transition-colors border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            title="Spieltermine als ICS-Kalenderdatei exportieren"
          >
            <Download size={14} /> Kalender (.ics)
          </button>
          <button 
            onClick={handleAddMatch}
            className="bg-black text-white px-4 py-2 font-black uppercase text-xs hover:bg-[#C00000] transition-colors border-2 border-black flex items-center gap-2"
          >
            <Plus size={14} /> Neues Spiel
          </button>
          <button 
            onClick={() => setShowOpponentModal(true)}
            className="bg-white text-black px-4 py-2 font-black uppercase text-xs hover:bg-gray-100 transition-colors border-2 border-black flex items-center gap-2"
          >
            <Users size={14} /> Gegner verwalten
          </button>
        </div>
      </div>

      {/* Aggregated Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">Spiele & Bilanz</div>
            <div className="text-2xl font-black">{matchStats.played} / {matchStats.total}</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase">
              {matchStats.wins}S - {matchStats.draws}U - {matchStats.losses}N
            </div>
          </div>
          <Trophy className="text-amber-500 h-8 w-8 opacity-80" />
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-gray-500">Torverhältnis</div>
            <div className="text-2xl font-black">{matchStats.goalsFor} : {matchStats.goalsAgainst}</div>
            <div className="text-[10px] font-bold text-blue-600 uppercase">
              Diff: {matchStats.diff > 0 ? `+${matchStats.diff}` : matchStats.diff}
            </div>
          </div>
          <Target className="text-[#C00000] h-8 w-8 opacity-80" />
        </div>

        <div className="bg-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between col-span-2 sm:col-span-2">
          <div className="w-full">
            <div className="text-[10px] font-black uppercase text-gray-500 mb-1 flex items-center gap-1">
              <Award size={12} className="text-amber-500" /> Top-Torschützen ({title.includes('Test') ? 'Testspiele' : 'Pflichtspiele'})
            </div>
            {matchStats.topScorers.length > 0 ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {matchStats.topScorers.map(([name, goals]) => (
                  <span key={name} className="bg-black text-white px-2.5 py-1 rounded font-black text-[10px] uppercase flex items-center gap-1">
                    {name}: <span className="text-amber-400 font-extrabold">{goals} Tore</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Noch keine Torschützen erfasst</span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-12"
          >
            {/* Next Match Highlight (if any upcoming) */}
            {(() => {
              const now = new Date().toISOString().split('T')[0];
              const upcoming = sortedMatches.filter(m => {
                if (!m.date) return false;
                // Handle both ISO (YYYY-MM-DD) and German (DD.MM.YYYY)
                const dateISO = m.date.includes('.') ? m.date.split('.').reverse().join('-') : m.date;
                return dateISO >= now;
              }).sort((a,b) => {
                const dateA = (a.date || '').includes('.') ? a.date.split('.').reverse().join('-') : (a.date || '');
                const dateB = (b.date || '').includes('.') ? b.date.split('.').reverse().join('-') : (b.date || '');
                return dateA.localeCompare(dateB);
              });
              const nextMatch = upcoming[0];
              
              if (!nextMatch) return null;
              
              return (
                <div className="bg-[#C00000] border-4 border-black p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-white relative overflow-hidden group">
                  <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <Trophy size={200} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-[0.3em]">Nächstes Spiel</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                      <div>
                        <h3 className="text-5xl font-black uppercase tracking-tighter italic leading-none mb-2">
                          {nextMatch.opponent}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-xs font-black uppercase">
                          <span className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded">
                            <Calendar size={14} /> {formatDate(nextMatch.date)}
                          </span>
                          <span className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded">
                            <Clock size={14} /> {nextMatch.kickOff} Uhr
                          </span>
                          <span className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded">
                            <MapPin size={14} /> {nextMatch.location}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedMatchId(nextMatch.id);
                          setViewMode('detail');
                        }}
                        className="bg-white text-black px-8 py-3 font-black uppercase text-sm hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]"
                      >
                        Details & Zeiten
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* All Matches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedMatches.map((match) => (
                <motion.div
                  key={match.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(192,0,0,1)] transition-all cursor-pointer flex flex-col group"
                  onClick={() => {
                    setSelectedMatchId(match.id);
                    setViewMode('detail');
                  }}
                >
                  <div className="p-4 bg-black text-white flex justify-between items-start">
                    <div>
                      <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C00000] mb-1">
                        {title.includes('Test') ? 'TESTSPIEL' : 'PFLICHTSPIEL'}
                      </div>
                      <div className="text-lg font-black uppercase truncate max-w-[180px]">
                        {match.opponent}
                      </div>
                    </div>
                    <div className="bg-white text-black p-2 font-black text-sm">
                       {match.isHome ? 'HEIM' : 'AW'}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#C00000]" />
                      <span className="text-[10px] font-black uppercase whitespace-nowrap">
                        {formatDate(match.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#C00000]" />
                      <span className="text-[10px] font-black uppercase">{match.kickOff || '--:--'} Uhr</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                       <MapPin size={14} className="text-[#C00000]" />
                      <span className="text-[10px] font-black uppercase truncate">{match.location}</span>
                    </div>

                    {match.result && (
                      <div className="col-span-2 bg-black/5 p-2 rounded border border-black/10 flex justify-between items-center text-[11px] font-black">
                        <span className="text-gray-500 text-[9px] uppercase">Ergebnis:</span>
                        <span className="bg-[#C00000] text-white px-2 py-0.5 rounded text-xs">{match.result}</span>
                      </div>
                    )}

                    {match.scorers && (
                      <div className="col-span-2 text-[10px] bg-amber-50 p-2 rounded border border-amber-200">
                        <span className="font-black text-amber-800 uppercase block mb-0.5">⚽ Torschützen:</span>
                        <span className="font-bold text-gray-800">{match.scorers}</span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4 flex justify-between items-center text-[8px] font-black uppercase border-t border-black/5 pt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportICS(match);
                      }}
                      className="text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                      title="Termin im Kalender speichern"
                    >
                      <Download size={10} /> ICS Kalender
                    </button>
                    <div className="group-hover:text-[#C00000] transition-colors flex items-center gap-1">
                      Details <ExternalLink size={10} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : viewMode === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left shrink-0">
                <thead>
                  <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="p-3 border border-white/10 w-12 text-center">ID</th>
                    <th className="p-3 border border-white/10 w-12 text-center">KW</th>
                    <th className="p-3 border border-white/10 w-32">Datum</th>
                    <th className="p-3 border border-white/10 w-20">Anstoß</th>
                    <th className="p-3 border border-white/10 w-20 text-center">H/A</th>
                    <th className="p-3 border border-white/10 min-w-[180px]">Gegner</th>
                    <th className="p-3 border border-white/10 min-w-[130px]">Ort</th>
                    <th className="p-3 border border-white/10 w-24 text-center">Ergebnis</th>
                    <th className="p-3 border border-white/10 min-w-[160px]">Torschützen</th>
                    <th className="p-3 border border-white/10 w-20 text-center">Treff</th>
                    <th className="p-3 border border-white/10 w-20 text-center">Ende</th>
                    <th className="p-3 border border-white/10 min-w-[180px]">Notizen</th>
                    <th className="p-3 border border-white/10 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {sortedMatches.map((match) => (
                    <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 border-r border-black/10 font-black text-center">{match.index}</td>
                      <td className="p-3 border-r border-black/10 font-black text-center text-[10px] opacity-40">{getKW(match.date || '')}</td>
                      <td className="p-3 border-r border-black/10">
                        <EditableField 
                          type="date"
                          className="w-full bg-transparent focus:outline-none font-bold"
                          value={match.date || ''}
                          onSave={(val) => onSaveMatch({ ...match, date: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10">
                        <EditableField 
                          type="time"
                          className="w-full bg-transparent focus:outline-none font-black"
                          value={match.kickOff || ''}
                          onSave={(val) => onSaveMatch({ ...match, kickOff: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10 text-center">
                        <select 
                          className="bg-transparent font-black uppercase text-[10px] focus:outline-none cursor-pointer"
                          value={match.isHome ? 'H' : 'A'}
                          onChange={(e) => onSaveMatch({ ...match, isHome: e.target.value === 'H' })}
                        >
                          <option value="H">Heim</option>
                          <option value="A">AW</option>
                        </select>
                      </td>
                      <td className="p-3 border-r border-black/10">
                        <EditableField 
                          listId="opponents-list-table"
                          className="w-full bg-transparent focus:outline-none font-black uppercase text-[12px] text-[#C00000]"
                          value={match.opponent || ''}
                          onSave={(val) => onSaveMatch({ ...match, opponent: val })}
                        />
                        <datalist id="opponents-list-table">
                          {opponents.map(opp => <option key={opp.id} value={opp.name} />)}
                        </datalist>
                      </td>
                      <td className="p-3 border-r border-black/10">
                        <EditableField 
                          className="w-full bg-transparent focus:outline-none font-bold text-[10px] uppercase opacity-70"
                          value={match.location || ''}
                          onSave={(val) => onSaveMatch({ ...match, location: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10 text-center">
                        <EditableField 
                          placeholder="z.B. 3:1"
                          className="w-full bg-transparent focus:outline-none font-black text-xs text-[#C00000] text-center uppercase"
                          value={match.result || ''}
                          onSave={(val) => onSaveMatch({ ...match, result: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10">
                        <EditableField 
                          placeholder="Torschützen..."
                          className="w-full bg-transparent focus:outline-none font-bold text-[10px] text-slate-800"
                          value={match.scorers || ''}
                          onSave={(val) => onSaveMatch({ ...match, scorers: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10 text-center">
                         <EditableField 
                          type="time"
                          className="w-full bg-transparent focus:outline-none font-black opacity-50"
                          value={match.meetingTime || ''}
                          onSave={(val) => onSaveMatch({ ...match, meetingTime: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10 text-center">
                        <EditableField 
                          type="time"
                          className="w-full bg-transparent focus:outline-none font-black opacity-50"
                          value={match.endTime || ''}
                          onSave={(val) => onSaveMatch({ ...match, endTime: val })}
                        />
                      </td>
                      <td className="p-3 border-r border-black/10">
                        <EditableField 
                          className="w-full bg-transparent focus:outline-none italic opacity-60 text-[10px]"
                          value={match.notes || ''}
                          onSave={(val) => onSaveMatch({ ...match, notes: val })}
                        />
                      </td>
                      <td className="p-3 text-center">
                        <button 
                          onClick={() => {
                            setSelectedMatchId(match.id);
                            setShowDeleteMatchConfirm(true);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedMatches.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-12 text-center italic opacity-30">Keine Spiele angelegt</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-black/5 text-center">
              <button 
                onClick={handleAddMatch}
                className="bg-black text-white px-8 py-3 font-black uppercase text-xs hover:bg-[#C00000] transition-all border-2 border-black"
              >
                + Weiteres Spiel hinzufügen
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {selectedMatch ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
              <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6" /> Spiel-Details
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-black uppercase opacity-60">Gegner</label>
                    <div className="flex gap-3 items-center">
                      <button 
                        onClick={() => handleExportICS(selectedMatch)}
                        className="text-[10px] font-black uppercase text-sky-700 hover:underline flex items-center gap-1"
                        title="Diesen Spieltermin als ICS-Kalenderdatei herunterladen"
                      >
                        <Download size={12} /> ICS Export
                      </button>
                      <button 
                        onClick={() => setShowDeleteMatchConfirm(true)}
                        className="text-[10px] font-black uppercase text-red-600 hover:underline"
                      >
                        Spiel löschen
                      </button>
                    </div>
                  </div>
                  <div className="relative group">
                    <EditableField 
                      listId="opponents-list-planning"
                      className="w-full border-2 border-black p-2 font-bold bg-white focus:border-[#C00000] focus:outline-none uppercase" 
                      value={selectedMatch.opponent} 
                      onSave={(val) => handleMatchChange('opponent', val)}
                    />
                    <datalist id="opponents-list-planning">
                      {opponents.map((opp) => (
                        <option key={opp.id} value={opp.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase opacity-60 flex items-center gap-1 text-[#C00000]">
                      <Trophy className="h-3 w-3" /> Ergebnis / Endstand
                    </label>
                    <EditableField 
                      placeholder="z.B. 3:1"
                      className="w-full border-2 border-black p-2 font-black text-sm bg-red-50 focus:bg-white"
                      value={selectedMatch.result || ''} 
                      onSave={(val) => handleMatchChange('result', val)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase opacity-60">Heim/Auswärts</label>
                    <select 
                      className="w-full border-2 border-black p-2 font-bold"
                      value={selectedMatch.isHome ? 'Heim' : 'Auswärts'}
                      onChange={(e) => handleMatchChange('isHome', e.target.value === 'Heim')}
                    >
                      <option value="Heim">Heim</option>
                      <option value="Auswärts">Auswärts</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase opacity-60 flex items-center gap-1">
                    ⚽ Torschützen (Name, Min / Anzahl)
                  </label>
                  <EditableField 
                    placeholder="z.B. J. Ehret (2), D. Valchuk (45')"
                    className="w-full border-2 border-black p-2 font-bold bg-amber-50/50"
                    value={selectedMatch.scorers || ''} 
                    onSave={(val) => handleMatchChange('scorers', val)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase opacity-60">Datum</label>
                    <EditableField 
                      type="date" 
                      className="w-full border-2 border-black p-2 font-bold"
                      value={selectedMatch.date || ''} 
                      onSave={(val) => handleMatchChange('date', val)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase opacity-60 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Ort
                    </label>
                    <EditableField 
                      className="w-full border-2 border-black p-2 font-bold"
                      value={selectedMatch.location || ''} 
                      onSave={(val) => handleMatchChange('location', val)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black uppercase opacity-60 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Beginn
                    </label>
                    <EditableField 
                      type="time" 
                      className="w-full border-2 border-black p-2 font-bold"
                      value={selectedMatch.kickOff || ''} 
                      onSave={(val) => handleMatchChange('kickOff', val)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black uppercase opacity-60 flex items-center gap-1">
                      <Timer className="h-3 w-3" /> Ende
                    </label>
                    <EditableField 
                      type="time" 
                      className="w-full border-2 border-black p-2 font-bold"
                      value={selectedMatch.endTime || ''} 
                      onSave={(val) => handleMatchChange('endTime', val)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black uppercase opacity-60">Notizen</label>
                  <EditableField 
                    isTextArea
                    className="w-full border-2 border-black p-2 font-bold min-h-[100px]"
                    value={selectedMatch.notes || ''}
                    onSave={(val) => handleMatchChange('notes', val)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="p-6 border-b-4 border-black flex items-center justify-between bg-gray-50">
                <h3 className="text-xl font-black uppercase">Spieler-Einsatzzeiten</h3>
                <div className="text-xs font-bold uppercase opacity-60">
                  Wird automatisch berechnet
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black text-white uppercase text-xs font-black tracking-widest">
                      <th className="p-4">Spieler</th>
                      <th className="p-4">Gesamt</th>
                      <th className="p-4">Start</th>
                      <th className="p-4">Ende</th>
                      <th className="p-4 text-center">Min</th>
                      <th className="p-4">Notizen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black">
                    {players.filter(isPlayer).map(player => {
                      const record = matchMinutes.find(r => r.playerId === player.id);
                      const details = record?.details?.[selectedMatchId] || { start: '', end: '', notes: '' };
                      const minutes = record?.minutes?.[selectedMatchId] || 0;
                      const totalMinutes = calculateTotalMinutes(player.id);

                      return (
                        <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-black uppercase text-sm">
                            {player.lastName}
                          </td>
                          <td className="p-4 text-xs font-bold opacity-60">
                            <div className="flex items-center gap-2">
                              {totalMinutes} MIN
                              {totalMinutes > 0 && (
                                <button 
                                  onClick={() => setPlayerToReset(player)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Alle Zeiten für diesen Spieler zurücksetzen"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <EditableField 
                              type="time" 
                              className="border-2 border-black p-1 font-bold text-xs w-24" 
                              value={details.start}
                              onSave={(val) => handleMinuteChange(player.id, 'start', val)}
                            />
                          </td>
                          <td className="p-4">
                            <EditableField 
                              type="time" 
                              className="border-2 border-black p-1 font-bold text-xs w-24" 
                              value={details.end}
                              onSave={(val) => handleMinuteChange(player.id, 'end', val)}
                            />
                          </td>
                          <td className="p-4 text-center font-black text-lg">
                            {minutes}
                          </td>
                          <td className="p-4">
                            <EditableField 
                              className="w-full border-2 border-black p-1 font-bold text-xs" 
                              value={details.notes}
                              onSave={(val) => handleMinuteChange(player.id, 'notes', val)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
          ) : (
            <div className="bg-white border-4 border-black p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-black/20" />
              <h3 className="text-xl font-black uppercase text-black/40">Kein Spiel ausgewählt</h3>
              <p className="text-xs font-bold opacity-40 mt-2">Bitte wähle ein Spiel aus der Übersicht oder erstelle ein neues.</p>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Opponent Management Modal */}
      <AnimatePresence>
        {showOpponentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-black text-white p-4 flex justify-between items-center">
                <h3 className="font-black uppercase tracking-widest flex items-center gap-2">
                  <Users size={20} /> Gegner-Verwaltung
                </h3>
                <button onClick={() => setShowOpponentModal(false)} className="hover:text-[#C00000] transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 border-2 border-black p-2 font-bold uppercase"
                    placeholder="Gegner Name..."
                    value={newOpponentName}
                    onChange={(e) => setNewOpponentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveOpponent()}
                  />
                  <button 
                    onClick={handleSaveOpponent}
                    className="bg-black text-white px-6 py-2 font-black uppercase text-xs hover:bg-[#C00000] transition-colors border-2 border-black"
                  >
                    {editingOpponent ? 'Speichern' : 'Hinzufügen'}
                  </button>
                  {editingOpponent && (
                    <button 
                      onClick={() => {
                        setEditingOpponent(null);
                        setNewOpponentName('');
                      }}
                      className="bg-gray-200 text-black px-4 py-2 font-black uppercase text-xs hover:bg-gray-300 transition-colors border-2 border-black"
                    >
                      Abbrechen
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar border-2 border-black">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr className="border-b-2 border-black">
                        <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Gegner Name</th>
                        <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black/5">
                      {opponents.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="p-8 text-center text-xs font-bold opacity-40 italic">
                            Keine Gegner hinterlegt.
                          </td>
                        </tr>
                      ) : (
                        opponents.map(opp => (
                          <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3 font-bold uppercase text-sm">{opp.name}</td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingOpponent(opp);
                                    setNewOpponentName(opp.name);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Bearbeiten"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => setOpponentToDelete(opp)}
                                  className="p-1 text-red-600 hover:bg-red-50 transition-colors"
                                  title="Löschen"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Match Confirm Modal */}
      <AnimatePresence>
        {showDeleteMatchConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6"
            >
              <h3 className="text-xl font-black uppercase mb-4">Spiel löschen?</h3>
              <p className="font-bold text-sm mb-6">Möchtest du dieses Spiel wirklich unwiderruflich löschen?</p>
              <div className="flex gap-4">
                <button 
                  onClick={handleDeleteMatch}
                  className="flex-1 bg-red-600 text-white py-3 font-black uppercase text-xs hover:bg-red-700 transition-colors border-2 border-black"
                >
                  Ja, löschen
                </button>
                <button 
                  onClick={() => setShowDeleteMatchConfirm(false)}
                  className="flex-1 bg-gray-200 text-black py-3 font-black uppercase text-xs hover:bg-gray-300 transition-colors border-2 border-black"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Opponent Confirm Modal */}
      <AnimatePresence>
        {opponentToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6"
            >
              <h3 className="text-xl font-black uppercase mb-4">Gegner löschen?</h3>
              <p className="font-bold text-sm mb-6">Möchtest du den Gegner "{opponentToDelete.name}" wirklich löschen?</p>
              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    await onDeleteOpponent(opponentToDelete.id);
                    setOpponentToDelete(null);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 font-black uppercase text-xs hover:bg-red-700 transition-colors border-2 border-black"
                >
                  Ja, löschen
                </button>
                <button 
                  onClick={() => setOpponentToDelete(null)}
                  className="flex-1 bg-gray-200 text-black py-3 font-black uppercase text-xs hover:bg-gray-300 transition-colors border-2 border-black"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Player Minutes Confirm Modal */}
      <AnimatePresence>
        {playerToReset && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md p-6"
            >
              <h3 className="text-xl font-black uppercase mb-4">Zeiten zurücksetzen?</h3>
              <p className="font-bold text-sm mb-6">
                Möchtest du wirklich alle Einsatzzeiten für <span className="text-[#C00000]">{playerToReset.lastName}</span> über alle Spiele hinweg auf 0 setzen?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleResetPlayerMinutes(playerToReset.id)}
                  className="flex-1 bg-red-600 text-white py-3 font-black uppercase text-xs hover:bg-red-700 transition-colors border-2 border-black"
                >
                  Ja, zurücksetzen
                </button>
                <button 
                  onClick={() => setPlayerToReset(null)}
                  className="flex-1 bg-gray-200 text-black py-3 font-black uppercase text-xs hover:bg-gray-300 transition-colors border-2 border-black"
                >
                  Abbrechen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
