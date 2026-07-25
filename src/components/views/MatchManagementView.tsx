import React, { useState, useMemo } from 'react';
import { Spieler, Match, MatchMinuteRecord } from '../../types';
import { 
  Trophy, 
  MapPin, 
  Clock, 
  Shield, 
  Users, 
  Timer,
  Calendar,
  Flag,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Activity,
  Target,
  LayoutGrid,
  List,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MatchManagementViewProps {
  players: Spieler[];
  matches: Match[];
  data: MatchMinuteRecord[];
  type: 'competitive' | 'test';
  onUpdateMatch: (id: string | number, field: keyof Match, value: any) => void;
  onUpdateMinutes: (type: 'competitive' | 'test', playerId: string, matchId: string | number, mins: number) => void;
  onUpdateAvailability: (type: 'competitive' | 'test', playerId: string, matchId: string | number, status: string) => void;
  onAddMatch: () => void;
  onDeleteMatch: (id: string | number) => void;
  isEditing?: boolean;
  opponents?: { id: string | number; name: string }[];
}

export const MatchManagementView: React.FC<MatchManagementViewProps> = ({
  players,
  matches,
  data,
  type,
  onUpdateMatch,
  onUpdateMinutes,
  onUpdateAvailability,
  onAddMatch,
  onDeleteMatch,
  isEditing = false,
  opponents = []
}) => {
  const [selectedMatchIndex, setSelectedMatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [localMatchData, setLocalMatchData] = useState<Partial<Match>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Ensure selectedMatchIndex is within bounds
  const safeIndex = Math.min(Math.max(0, selectedMatchIndex), matches.length - 1);
  const currentMatch = matches[safeIndex];

  // Sync local data when current match changes
  React.useEffect(() => {
    if (currentMatch) {
      setLocalMatchData(currentMatch);
    }
  }, [currentMatch?.id]);

  const handleLocalUpdate = (field: keyof Match, value: any) => {
    setLocalMatchData(prev => ({ ...prev, [field]: value }));
    onUpdateMatch(currentMatch.id, field, value);
  };

  // Sort players by position then number
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const posOrder: Record<string, number> = { 'TW': 1, 'IV': 2, 'AV': 3, 'DM': 4, 'ZM': 5, 'OM': 6, 'WGL': 7, 'ST': 8 };
      const aOrder = posOrder[a.position] || 99;
      const bOrder = posOrder[b.position] || 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.number - b.number;
    });
  }, [players]);

  if (!currentMatch && matches.length > 0) {
    setSelectedMatchIndex(0);
    return null;
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 border-4 border-dashed border-black/10 rounded-xl p-12">
        <Trophy size={64} className="text-black/20 mb-4" />
        <h3 className="text-xl font-black uppercase tracking-widest text-black/40 mb-6">Keine Spiele vorhanden</h3>
        <button 
          onClick={onAddMatch}
          className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest hover:bg-[#C00000] transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Erstes Spiel anlegen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* View Switcher & Action Bar */}
      <div className="bg-black text-white p-3 flex items-center justify-between shrink-0 border-b-2 border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'list' ? 'bg-white text-black' : 'hover:bg-white/10'
              }`}
            >
              <LayoutGrid size={14} />
              Übersicht
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === 'detail' ? 'bg-white text-black' : 'hover:bg-white/10'
              }`}
            >
              <List size={14} />
              Details
            </button>
          </div>
          
          {viewMode === 'detail' && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[400px] md:max-w-[600px]">
              <div className="h-4 w-px bg-white/20 mx-1" />
              {matches.map((match, idx) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatchIndex(idx)}
                  className={`px-3 py-1 text-[9px] font-black uppercase tracking-tighter transition-all shrink-0 border-2 ${
                    safeIndex === idx 
                      ? 'bg-[#C00000] text-white border-[#C00000]' 
                      : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'
                  }`}
                >
                  {match.opponent || `S${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onAddMatch}
          className="bg-[#C00000] text-white px-4 py-2 hover:bg-red-700 transition-colors shrink-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Neues Spiel</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          {viewMode === 'list' ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">
                  Alle <span className="text-[#C00000]">{type === 'competitive' ? 'Pflichtspiele' : 'Testspiele'}</span>
                </h2>
                <div className="text-[10px] font-black uppercase text-black/40">
                  {matches.length} Spiele insgesamt
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...matches].sort((a,b) => {
                  const dateA = (a.date || '').split('.').reverse().join('-');
                  const dateB = (b.date || '').split('.').reverse().join('-');
                  return dateB.localeCompare(dateA);
                }).map((match, idx) => (
                  <motion.div
                    key={match.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(192,0,0,1)] transition-all cursor-pointer group"
                    onClick={() => {
                      const realIndex = matches.findIndex(m => m.id === match.id);
                      setSelectedMatchIndex(realIndex);
                      setViewMode('detail');
                    }}
                  >
                    <div className="p-4 bg-black text-white flex justify-between items-start">
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#C00000] mb-1">
                          {match.competition || (type === 'competitive' ? 'LIGA' : 'TEST')}
                        </div>
                        <div className="text-lg font-black uppercase truncate max-w-[180px]">
                          {match.opponent || 'Unbekannt'}
                        </div>
                      </div>
                      <div className="bg-white text-black p-2 font-black text-sm">
                        {match.result || '- : -'}
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#C00000]" />
                        <span className="text-[10px] font-black uppercase">{match.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#C00000]" />
                        <span className="text-[10px] font-black uppercase">{match.kickOff} Uhr</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#C00000]" />
                        <span className="text-[10px] font-black uppercase truncate">{match.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flag size={14} className="text-[#C00000]" />
                        <span className="text-[10px] font-black uppercase">{match.isHome ? 'Heim' : 'Auswärts'}</span>
                      </div>
                    </div>

                    <div className="px-4 pb-4 flex justify-end">
                      <div className="flex items-center gap-1 text-[8px] font-black uppercase group-hover:text-[#C00000] transition-colors leading-none">
                        Spiel bearbeiten <ExternalLink size={10} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : currentMatch ? (
            <div className="space-y-8 max-w-6xl mx-auto">
              {/* TOP: Match Info Card */}
              <motion.div 
                key={`match-info-${currentMatch.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
              >
            <div className="bg-black text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-[#C00000] p-3 rounded-lg">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-1">
                    {type === 'competitive' ? 'Pflichtspiel' : 'Testspiel'} Details
                  </h2>
                  <div className="flex items-center gap-3 relative">
                    <input 
                      type="text"
                      list="opponent-list-manage"
                      value={localMatchData.opponent || ''}
                      onChange={(e) => handleLocalUpdate('opponent', e.target.value)}
                      className="bg-transparent text-3xl font-black uppercase outline-none border-b-2 border-transparent focus:border-[#C00000] placeholder:text-white/20 w-full md:w-[400px]"
                      placeholder="GEGNER NAME..."
                    />
                    <datalist id="opponent-list-manage">
                      {opponents.map((opp) => (
                        <option key={opp.id} value={opp.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Ergebnis</label>
                  <input 
                    type="text"
                    value={localMatchData.result || ''}
                    onChange={(e) => handleLocalUpdate('result', e.target.value)}
                    className="bg-white/10 text-center text-2xl font-black w-24 py-1 outline-none border-2 border-white/20 focus:border-[#C00000] rounded"
                    placeholder="-:-"
                  />
                </div>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-900/40 hover:bg-red-600 p-3 transition-colors rounded-lg text-red-200 hover:text-white"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t-4 border-black">
              {/* Field: Date */}
              <div className="p-6 border-r-2 border-b-2 border-black flex items-start gap-4">
                <Calendar className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Datum / Spieltag</label>
                  <input 
                    type="text"
                    value={localMatchData.date || ''}
                    onChange={(e) => handleLocalUpdate('date', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="TT.MM.JJJJ"
                  />
                </div>
              </div>

              {/* Field: Kickoff */}
              <div className="p-6 border-r-2 border-b-2 border-black flex items-start gap-4">
                <Clock className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Anstoßzeit</label>
                  <input 
                    type="text"
                    value={localMatchData.kickOff || ''}
                    onChange={(e) => handleLocalUpdate('kickOff', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="00:00"
                  />
                </div>
              </div>

              {/* Field: Meeting Time */}
              <div className="p-6 border-r-2 border-b-2 border-black flex items-start gap-4">
                <Timer className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Treffpunkt (Zeit)</label>
                  <input 
                    type="text"
                    value={localMatchData.meetingTime || ''}
                    onChange={(e) => handleLocalUpdate('meetingTime', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="00:00"
                  />
                </div>
              </div>

              {/* Field: Location */}
              <div className="p-6 border-b-2 border-black flex items-start gap-4">
                <MapPin className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Spielort</label>
                  <input 
                    type="text"
                    value={localMatchData.location || ''}
                    onChange={(e) => handleLocalUpdate('location', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="STADION / PLATZ..."
                  />
                </div>
              </div>

              {/* Field: Home/Away */}
              <div className="p-6 border-r-2 border-black flex items-start gap-4">
                <Flag className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Heim / Auswärts</label>
                  <select 
                    value={localMatchData.isHome ? 'Heim' : 'Auswärts'}
                    onChange={(e) => handleLocalUpdate('isHome', e.target.value === 'Heim')}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000] bg-transparent appearance-none cursor-pointer"
                  >
                    <option value="Heim">Heimspiel</option>
                    <option value="Auswärts">Auswärtsspiel</option>
                  </select>
                </div>
              </div>

              {/* Field: Competition */}
              <div className="p-6 border-r-2 border-black flex items-start gap-4">
                <Shield className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Wettbewerb</label>
                  <input 
                    type="text"
                    value={localMatchData.competition || ''}
                    onChange={(e) => handleLocalUpdate('competition', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="LIGA / POKAL..."
                  />
                </div>
              </div>

              {/* Field: Treffpunkt (Ort) */}
              <div className="p-6 border-r-2 border-black flex items-start gap-4">
                <Target className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Treffpunkt (Ort)</label>
                  <input 
                    type="text"
                    value={localMatchData.meetingPoint || ''}
                    onChange={(e) => handleLocalUpdate('meetingPoint', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="ORT..."
                  />
                </div>
              </div>

              {/* Field: Result (Mobile only) */}
              <div className="p-6 flex md:hidden items-start gap-4">
                <Activity className="text-[#C00000] shrink-0" size={20} />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-1">Ergebnis</label>
                  <input 
                    type="text"
                    value={localMatchData.result || ''}
                    onChange={(e) => handleLocalUpdate('result', e.target.value)}
                    className="w-full font-black text-lg outline-none focus:text-[#C00000]"
                    placeholder="-:-"
                  />
                </div>
              </div>
            </div>
          </motion.div>

              {/* BOTTOM: Player Minutes Table */}
              <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <div className="bg-gray-100 p-4 border-b-4 border-black flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-[#C00000]" />
                    <h3 className="font-black uppercase text-sm tracking-widest">Spieler-Minuten</h3>
                  </div>
                  <div className="text-[10px] font-black uppercase opacity-40">
                    {players.length} Spieler im Kader
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest w-16">Nr.</th>
                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest">Spielername</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest w-24">Pos.</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest w-32">Verfügbarkeit</th>
                        <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest w-32">Minuten</th>
                        <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest w-40">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPlayers.map((player) => {
                        const record = data.find(r => r.playerId === player.id);
                        const minutes = record?.minutes?.[currentMatch.id] || 0;
                        
                        return (
                          <tr key={player.id} className="border-b-2 border-black/5 hover:bg-gray-50 transition-colors">
                            <td className="p-4 font-black text-gray-400">{player.number}</td>
                            <td className="p-4">
                              <div className="font-black uppercase text-sm">{player.lastName}, {player.firstName}</div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="bg-black text-white text-[10px] font-black px-2 py-1 rounded">
                                {player.position}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <select 
                                className="w-full bg-gray-100 border-2 border-black p-2 text-[10px] font-black focus:bg-white focus:border-[#C00000] outline-none transition-all"
                                value={record?.matchAvailability?.[currentMatch.id] || ''}
                                onChange={(e) => onUpdateAvailability(type, player.id, currentMatch.id, e.target.value)}
                              >
                                <option value="">-</option>
                                <option value="Anwesend">Anwesend</option>
                                <option value="Verletzt">Verletzt</option>
                                <option value="Entschuldigt">Entschuldigt</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center">
                                <input 
                                  type="number"
                                  value={minutes || ''}
                                  onChange={(e) => onUpdateMinutes(type, player.id, currentMatch.id, parseInt(e.target.value) || 0)}
                                  className="w-20 bg-gray-100 border-2 border-black p-2 text-center font-black focus:bg-white focus:border-[#C00000] outline-none transition-all"
                                  placeholder="0"
                                />
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {minutes > 0 ? (
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-green-600">
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                    Eingesetzt
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-gray-300">
                                    Nicht eingesetzt
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center text-black/20">
              <Trophy size={64} className="mb-4 opacity-10" />
              <h3 className="text-xl font-black uppercase">Kein Spiel ausgewählt</h3>
              <p className="text-xs font-bold uppercase mt-2">Wähle ein Spiel aus der Übersicht</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                  onClick={() => {
                    onDeleteMatch(currentMatch.id);
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 bg-red-600 text-white py-3 font-black uppercase text-xs hover:bg-red-700 transition-colors border-2 border-black"
                >
                  Ja, löschen
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
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
