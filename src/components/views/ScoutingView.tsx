import React, { useState } from 'react';
import { ScoutingEntry, Player } from '../../types';
import { sortPlayers } from '../../utils/playerSorting';
import { 
  Search, 
  Plus, 
  Trash2, 
  Target, 
  LayoutGrid, 
  Table as TableIcon, 
  Map as MapIcon,
  Users,
  TrendingUp,
  MessageSquare,
  Clock,
  ChevronRight,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { ScoutingFormationView } from '../ScoutingFormationView';

interface ScoutingViewProps {
  scoutingCandidates: ScoutingEntry[];
  scoutingViewMode: 'table' | 'field' | 'grid' | 'depth';
  setScoutingViewMode: (mode: 'table' | 'field' | 'grid' | 'depth') => void;
  setShowAddScoutingModal: (show: boolean) => void;
  setShowRemoveScoutingModal: (show: boolean) => void;
  handleUpdateScoutingCandidate: (id: string, field: keyof ScoutingEntry, value: any) => void;
  handleRemoveScoutingCandidate: (id: string, skipConfirm?: boolean) => void;
  onAddScoutingCandidate: (candidate: ScoutingEntry) => void;
  handleResetScouting?: () => void;
  depthChart: Record<string, string[]>;
  setDepthChart: (chart: Record<string, string[]>) => void;
  players: Player[];
  isEditing?: boolean;
}

export const ScoutingView: React.FC<ScoutingViewProps> = ({
  scoutingCandidates,
  scoutingViewMode,
  setScoutingViewMode,
  setShowAddScoutingModal,
  setShowRemoveScoutingModal,
  handleUpdateScoutingCandidate,
  handleRemoveScoutingCandidate,
  onAddScoutingCandidate,
  handleResetScouting,
  depthChart,
  setDepthChart,
  players,
  isEditing = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = scoutingCandidates.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.club || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.position || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDepthChartChange = (pos: string, index: number, value: string) => {
    const newChart = { ...depthChart };
    if (!newChart[pos]) {
      newChart[pos] = ['', '', ''];
    } else {
      newChart[pos] = [...newChart[pos]]; // Create a copy of the array
    }
    newChart[pos][index] = value;
    setDepthChart(newChart);
  };

  const renderGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {filteredCandidates.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center h-64 text-center p-8">
          <Search size={48} className="text-slate-600 mb-4" />
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <p className="font-bold uppercase text-slate-400 italic mb-2 text-sm">Keine Kandidaten gefunden</p>
            <p className="text-xs font-bold uppercase text-slate-500">Nutze "Neuer Kandidat" oder "Cloud Sync" zum Laden.</p>
          </div>
          {handleResetScouting && (
            <button 
              onClick={handleResetScouting}
              className="mt-4 px-6 py-2.5 bg-slate-900 border border-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
            >
              <RefreshCw size={14} /> Standard-Daten laden
            </button>
          )}
        </div>
      )}
      {filteredCandidates.map(candidate => (
        <div key={candidate.id} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col group transition-all hover:border-amber-400/50 overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex justify-between items-start">
            <div>
              <h4 className="font-black uppercase text-base tracking-tight text-slate-100">{candidate.name}</h4>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-0.5">{candidate.club}</p>
            </div>
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full text-slate-950 ${candidate.recommendation === 'Verpflichten' ? 'bg-emerald-400' : 'bg-sky-400'}`}>
              {candidate.recommendation}
            </span>
          </div>
          <div className="p-4 flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Position</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-slate-950 text-slate-100 text-xs font-bold uppercase px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400"
                    value={candidate.position}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'position', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-bold uppercase text-amber-400">{candidate.position}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Alter</label>
                {isEditing ? (
                  <input 
                    type="number"
                    className="w-full bg-slate-950 text-slate-100 text-xs font-bold uppercase px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400"
                    value={candidate.age}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'age', parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-200">{candidate.age}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Marktwert</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-slate-950 text-slate-100 text-xs font-bold uppercase px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400"
                    value={candidate.marketValue}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'marketValue', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-200">{candidate.marketValue}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Datum</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-slate-950 text-slate-100 text-xs font-bold uppercase px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400"
                    value={candidate.date || ''}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'date', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-300">{candidate.date || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-slate-950 text-slate-100 text-xs font-bold uppercase px-2 py-1 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400"
                    value={candidate.status || ''}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'status', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-bold text-slate-300">{candidate.status}</p>
                )}
              </div>
            </div>
            {(candidate.conversationNotes || isEditing) && (
              <div className="pt-2 border-t border-slate-800">
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Notizen</label>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-amber-400 min-h-[50px] resize-none"
                    value={candidate.conversationNotes || ''}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'conversationNotes', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-medium italic text-slate-300 line-clamp-2">"{candidate.conversationNotes}"</p>
                )}
              </div>
            )}
          </div>
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
            <div className="flex gap-2">
              <button className="text-slate-400 hover:text-amber-400 transition-colors p-1"><MessageSquare size={14} /></button>
              <button className="text-slate-400 hover:text-amber-400 transition-colors p-1"><TrendingUp size={14} /></button>
            </div>
            {isEditing && (
              <button 
                onClick={() => {
                  handleRemoveScoutingCandidate(candidate.id);
                }}
                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Kandidat entfernen"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      ))}
      <button 
        onClick={() => setShowAddScoutingModal(true)}
        className="border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-slate-900/40 hover:bg-slate-900 rounded-2xl transition-all flex flex-col items-center justify-center gap-3 p-8 group min-h-[260px]"
      >
        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
          <Plus size={22} />
        </div>
        <span className="font-bold uppercase text-xs tracking-wider text-slate-400 group-hover:text-amber-400">Kandidat hinzufügen</span>
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <Search size={48} className="text-slate-600 mb-4" />
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
              <p className="font-bold uppercase text-slate-400 italic mb-2 text-sm">Keine Kandidaten gefunden</p>
              <p className="text-xs font-bold uppercase text-slate-500">Nutze "Neuer Kandidat" oder "Cloud Sync" zum Laden.</p>
            </div>
            {handleResetScouting && (
              <button 
                onClick={handleResetScouting}
                className="mt-4 px-6 py-2.5 bg-slate-950 border border-slate-800 text-amber-400 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2"
              >
                <RefreshCw size={14} /> Standard-Daten laden
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
          <thead className="bg-slate-950 text-slate-300 text-xs font-black uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="p-3.5 border-r border-slate-800/60">Name</th>
              <th className="p-3.5 border-r border-slate-800/60">Verein</th>
              <th className="p-3.5 border-r border-slate-800/60">Pos</th>
              <th className="p-3.5 border-r border-slate-800/60">Alter</th>
              <th className="p-3.5 border-r border-slate-800/60">MW</th>
              <th className="p-3.5 border-r border-slate-800/60">Datum</th>
              <th className="p-3.5 border-r border-slate-800/60">Status</th>
              <th className="p-3.5 border-r border-slate-800/60">Empfehlung</th>
              <th className="p-3.5 border-r border-slate-800/60">Warten bis</th>
              <th className="p-3.5">Aktionen</th>
            </tr>
          </thead>
          <tbody className="text-xs font-semibold text-slate-200">
            {filteredCandidates.map(c => (
              <tr key={c.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5 uppercase font-bold text-slate-100">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-full font-bold"
                      value={c.name}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'name', e.target.value)}
                    />
                  ) : c.name}
                </td>
                <td className="p-3.5 uppercase text-slate-400">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-full"
                      value={c.club}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'club', e.target.value)}
                    />
                  ) : c.club}
                </td>
                <td className="p-3.5 text-amber-400 font-bold">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-full uppercase"
                      value={c.position}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'position', e.target.value)}
                    />
                  ) : c.position}
                </td>
                <td className="p-3.5">
                  {isEditing ? (
                    <input 
                      type="number"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-12"
                      value={c.age}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'age', parseInt(e.target.value) || 0)}
                    />
                  ) : c.age}
                </td>
                <td className="p-3.5">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-16"
                      value={c.marketValue}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'marketValue', e.target.value)}
                    />
                  ) : c.marketValue}
                </td>
                <td className="p-3.5">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-20"
                      value={c.date || ''}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'date', e.target.value)}
                    />
                  ) : (c.date || '-')}
                </td>
                <td className="p-3.5 uppercase">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-20"
                      value={c.status || ''}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'status', e.target.value)}
                    />
                  ) : (c.status || '-')}
                </td>
                <td className="p-3.5">
                  {isEditing ? (
                    <select 
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 text-xs font-bold uppercase"
                      value={c.recommendation}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'recommendation', e.target.value as any)}
                    >
                      <option value="Verpflichten">Verpflichten</option>
                      <option value="Beobachten">Beobachten</option>
                      <option value="Absage">Absage</option>
                    </select>
                  ) : (
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full text-slate-950 ${c.recommendation === 'Verpflichten' ? 'bg-emerald-400' : 'bg-sky-400'}`}>
                      {c.recommendation}
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-amber-400">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-slate-950 text-slate-100 px-2 py-1 rounded border border-slate-800 focus:outline-none focus:border-amber-400 w-20"
                      value={c.waitingTime || ''}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'waitingTime', e.target.value)}
                    />
                  ) : (c.waitingTime || '-')}
                </td>
                <td className="p-3.5">
                  <div className="flex gap-2">
                    <button className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"><ChevronRight size={14} /></button>
                    {isEditing && (
                      <button 
                        onClick={() => {
                          handleRemoveScoutingCandidate(c.id);
                        }} 
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Kandidat entfernen"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-center">
          <button 
            onClick={() => setShowAddScoutingModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-lg active:scale-95"
          >
            <UserPlus size={14} /> Kandidat hinzufügen
          </button>
        </div>
      </div>
    </div>
  );

  const handleAutoSyncScoutingToDepthChart = () => {
    const matchPosToDepthKey = (posStr: string = ''): string => {
      const p = posStr.toUpperCase();
      if (p.includes('TW') || p.includes('TOR')) return 'TW';
      if (p.includes('IV') || p.includes('INNEN')) return 'IV';
      if (p.includes('RV') || (p.includes('RECHTS') && p.includes('VERT'))) return 'RV';
      if (p.includes('LV') || (p.includes('LINKS') && p.includes('VERT'))) return 'LV';
      if (p.includes('DM') || p.includes('DEFENSIV')) return 'DM';
      if (p.includes('ZM') || p.includes('ZENTRAL')) return 'ZM';
      if (p.includes('RM') || p.includes('RW') || p.includes('RECHTS')) return 'RM/RW';
      if (p.includes('LM') || p.includes('LW') || p.includes('LINKS')) return 'LM/LW';
      if (p.includes('OM') || p.includes('OFFENSIV')) return 'OM';
      if (p.includes('ST') || p.includes('STÜRM') || p.includes('ANGRIFF')) return 'ST';
      return '';
    };

    const newChart = { ...depthChart };
    scoutingCandidates.forEach(candidate => {
      const depthPos = matchPosToDepthKey(candidate.position || candidate.category || '');
      const targetPos = depthPos || 'ST';
      if (!newChart[targetPos]) {
        newChart[targetPos] = ['', '', ''];
      } else {
        newChart[targetPos] = [...newChart[targetPos]];
      }
      
      if (!newChart[targetPos].includes(candidate.id)) {
        const emptyIdx = newChart[targetPos].findIndex(slot => !slot);
        if (emptyIdx !== -1) {
          newChart[targetPos][emptyIdx] = candidate.id;
        }
      }
    });
    setDepthChart(newChart);
  };

  const renderDepthChart = () => {
    const positions = ['TW', 'IV', 'RV', 'LV', 'DM', 'ZM', 'RM/RW', 'LM/LW', 'OM', 'ST'];
    const allOptions = sortPlayers([
      ...players.map(p => ({ id: p.id, name: `${p.lastName} (#${p.number})`, type: 'Kader', position: p.position })),
      ...scoutingCandidates.map(c => ({ id: c.id, name: `${c.name} (${c.club})`, type: 'Scouting', position: c.position, recommendation: c.recommendation, club: c.club }))
    ]);

    return (
      <div className="p-6 space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
          <div>
            <h4 className="font-black uppercase text-amber-400 text-sm">Schattenkader & Positionstiefe</h4>
            <p className="text-xs text-slate-400">Verknüpfung von aktuellem Spielerkader und Scouting-Kandidaten je Position</p>
          </div>
          {isEditing && (
            <button 
              onClick={handleAutoSyncScoutingToDepthChart}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg"
              title="Scouting-Kandidaten automatisch den passenden Positionen zuordnen"
            >
              <RefreshCw size={14} /> Scouting-Daten synchronisieren
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {positions.map(pos => (
            <div key={pos} className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <div className="bg-slate-950 text-amber-400 border-b border-slate-800 p-2.5 text-xs font-black uppercase tracking-wider text-center flex justify-between items-center px-4">
                <span>{pos}</span>
                <span className="text-[10px] text-slate-500 font-normal">Pos. Depth</span>
              </div>
              <div className="p-3.5 space-y-3">
                {[0, 1, 2].map(idx => {
                  const selectedId = depthChart[pos]?.[idx] || '';
                  const selectedPlayer = players.find(p => p.id === selectedId);
                  const selectedScout = scoutingCandidates.find(c => c.id === selectedId);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase text-slate-400">{idx + 1}. Wahl</label>
                        {selectedScout && (
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${selectedScout.recommendation === 'Verpflichten' ? 'bg-emerald-400 text-slate-950' : 'bg-sky-400 text-slate-950'}`}>
                            Scouting
                          </span>
                        )}
                        {selectedPlayer && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                            Kader
                          </span>
                        )}
                      </div>
                      <select 
                        className={`w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl p-2 text-xs font-bold uppercase focus:outline-none focus:border-amber-400 ${!isEditing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        value={selectedId}
                        onChange={(e) => handleDepthChartChange(pos, idx, e.target.value)}
                        disabled={!isEditing}
                      >
                        <option value="" className="bg-slate-950 text-slate-400">-- WÄHLEN --</option>
                        <optgroup label="KADER" className="bg-slate-900 text-amber-400 font-bold">
                          {allOptions.filter(o => o.type === 'Kader').map(o => (
                            <option key={o.id} value={o.id} className="bg-slate-950 text-slate-100">{o.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="SCOUTING" className="bg-slate-900 text-emerald-400 font-bold">
                          {allOptions.filter(o => o.type === 'Scouting').map(o => (
                            <option key={o.id} value={o.id} className="bg-slate-950 text-slate-100">{o.name}</option>
                          ))}
                        </optgroup>
                      </select>

                      {selectedScout && (
                        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[10px] space-y-0.5">
                          <p className="font-black text-slate-200 uppercase">{selectedScout.name}</p>
                          <p className="text-slate-400 font-bold">Verein: {selectedScout.club || 'Unbekannt'}</p>
                          <p className="text-emerald-400 font-extrabold">{selectedScout.recommendation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl">
      {/* Sub-Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input 
              type="text" 
              placeholder="KANDIDATEN SUCHEN..." 
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl text-xs font-bold uppercase focus:outline-none focus:border-amber-400 w-52 placeholder-slate-500"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setScoutingViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${scoutingViewMode === 'grid' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              title="GRID"
            >
              <LayoutGrid size={14} />
            </button>
            <button 
              onClick={() => setScoutingViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${scoutingViewMode === 'table' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              title="LISTE"
            >
              <TableIcon size={14} />
            </button>
            <button 
              onClick={() => setScoutingViewMode('field')}
              className={`p-1.5 rounded-lg transition-all ${scoutingViewMode === 'field' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              title="FELD"
            >
              <MapIcon size={14} />
            </button>
            <button 
              onClick={() => setScoutingViewMode('depth')}
              className={`p-1.5 rounded-lg transition-all ${scoutingViewMode === 'depth' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'}`}
              title="SCHATTENKADER"
            >
              <Users size={14} />
            </button>
          </div>
          {isEditing && handleResetScouting && (
            <button 
              onClick={handleResetScouting}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-all"
              title="LISTE ZURÜCKSETZEN"
            >
              <Clock size={14} />
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowAddScoutingModal(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center gap-1.5 active:scale-95"
        >
          <UserPlus size={14} /> NEUER KANDIDAT
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950">
        {scoutingViewMode === 'grid' && renderGrid()}
        {scoutingViewMode === 'table' && renderTable()}
        {scoutingViewMode === 'depth' && renderDepthChart()}
        {scoutingViewMode === 'field' && (
          <div className="h-full p-6">
            <ScoutingFormationView 
              candidates={scoutingCandidates}
              players={players}
              onAddClick={() => setShowAddScoutingModal(true)}
              onRemoveClick={() => setShowRemoveScoutingModal(true)}
              onQuickAdd={(name) => onAddScoutingCandidate({
                id: `s${Date.now()}`,
                createdAt: Date.now(),
                name,
                club: 'UNBEKANNT',
                position: 'N/A',
                age: 0,
                marketValue: '0 €',
                recommendation: 'Beobachten',
                status: 'Offen',
                category: 'Sonstige',
                date: new Date().toISOString().split('T')[0]
              })}
              isEditing={isEditing}
            />
          </div>
        )}

        <div className="p-6 text-center text-slate-500 text-xs font-bold uppercase tracking-widest border-t border-slate-900">
          FC AUGGEN 1921 e.V. | Team Management System 2026/2027
        </div>
      </div>
    </div>
  );
};
