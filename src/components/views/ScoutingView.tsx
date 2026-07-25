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
          <Search size={48} className="text-gray-200 mb-4" />
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-black/10">
            <p className="font-black uppercase opacity-20 italic mb-2">Keine Kandidaten gefunden</p>
            <p className="text-[10px] font-bold uppercase opacity-40">Nutze "Neuer Kandidat" oder "Cloud Sync" zum Laden.</p>
          </div>
          {handleResetScouting && (
            <button 
              onClick={handleResetScouting}
              className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] flex items-center gap-2"
            >
              <RefreshCw size={14} /> Standard-Daten laden
            </button>
          )}
        </div>
      )}
      {filteredCandidates.map(candidate => (
        <div key={candidate.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col group watermark-bg">
          <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-start">
            <div>
              <h4 className="font-black uppercase text-lg tracking-tighter leading-none">{candidate.name}</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">{candidate.club}</p>
            </div>
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase text-white ${candidate.recommendation === 'Verpflichten' ? 'bg-green-600' : 'bg-blue-600'}`}>
              {candidate.recommendation}
            </span>
          </div>
          <div className="p-4 flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black uppercase opacity-40 block">Position</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-transparent text-xs font-black uppercase focus:outline-none border-b border-black/10"
                    value={candidate.position}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'position', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-black uppercase">{candidate.position}</p>
                )}
              </div>
              <div>
                <label className="text-[8px] font-black uppercase opacity-40 block">Alter</label>
                {isEditing ? (
                  <input 
                    type="number"
                    className="w-full bg-transparent text-xs font-black uppercase focus:outline-none border-b border-black/10"
                    value={candidate.age}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'age', parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <p className="text-xs font-black uppercase">{candidate.age}</p>
                )}
              </div>
              <div>
                <label className="text-[8px] font-black uppercase opacity-40 block">Marktwert</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-transparent text-xs font-black uppercase focus:outline-none border-b border-black/10"
                    value={candidate.marketValue}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'marketValue', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-black uppercase">{candidate.marketValue}</p>
                )}
              </div>
              <div>
                <label className="text-[8px] font-black uppercase opacity-40 block">Datum</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-transparent text-xs font-black uppercase focus:outline-none border-b border-black/10"
                    value={candidate.date || ''}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'date', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-black uppercase">{candidate.date || '-'}</p>
                )}
              </div>
              <div>
                <label className="text-[8px] font-black uppercase opacity-40 block">Status</label>
                {isEditing ? (
                  <input 
                    type="text"
                    className="w-full bg-transparent text-xs font-black uppercase focus:outline-none border-b border-black/10"
                    value={candidate.status || ''}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'status', e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-black uppercase">{candidate.status}</p>
                )}
              </div>
            </div>
            {(candidate.conversationNotes || isEditing) && (
              <div className="pt-2 border-t border-black/5">
                <label className="text-[8px] font-black uppercase opacity-40 block mb-1">Notizen</label>
                {isEditing ? (
                  <textarea 
                    className="w-full bg-gray-50 border border-black/10 p-2 text-[10px] font-bold italic focus:outline-none min-h-[40px] resize-none"
                    value={candidate.conversationNotes || ''}
                    onChange={(e) => handleUpdateScoutingCandidate(candidate.id, 'conversationNotes', e.target.value)}
                  />
                ) : (
                  <p className="text-[10px] font-bold italic opacity-60 line-clamp-2">"{candidate.conversationNotes}"</p>
                )}
              </div>
            )}
          </div>
          <div className="p-2 bg-black flex justify-between items-center">
            <div className="flex gap-2">
              <button className="text-white hover:text-[#C00000] transition-colors"><MessageSquare size={14} /></button>
              <button className="text-white hover:text-[#C00000] transition-colors"><TrendingUp size={14} /></button>
            </div>
            {isEditing && (
              <button 
                onClick={() => {
                  handleRemoveScoutingCandidate(candidate.id);
                }}
                className="text-white hover:text-red-500 transition-colors"
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
        className="border-4 border-dashed border-gray-200 hover:border-black hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-4 p-8 group"
      >
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
          <Plus size={24} />
        </div>
        <span className="font-black uppercase text-xs tracking-widest opacity-40 group-hover:opacity-100">Kandidat hinzufügen</span>
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="p-6">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden watermark-bg">
        {filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <Search size={48} className="text-gray-200 mb-4" />
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-black/10">
              <p className="font-black uppercase opacity-20 italic mb-2">Keine Kandidaten gefunden</p>
              <p className="text-[10px] font-bold uppercase opacity-40">Nutze "Neuer Kandidat" oder "Cloud Sync" zum Laden.</p>
            </div>
            {handleResetScouting && (
              <button 
                onClick={handleResetScouting}
                className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] flex items-center gap-2"
              >
                <RefreshCw size={14} /> Standard-Daten laden
              </button>
            )}
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
          <thead className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-4 border-r border-white/10">Name</th>
              <th className="p-4 border-r border-white/10">Verein</th>
              <th className="p-4 border-r border-white/10">Pos</th>
              <th className="p-4 border-r border-white/10">Alter</th>
              <th className="p-4 border-r border-white/10">MW</th>
              <th className="p-4 border-r border-white/10">Datum</th>
              <th className="p-4 border-r border-white/10">Status</th>
              <th className="p-4 border-r border-white/10">Empfehlung</th>
              <th className="p-4 border-r border-white/10">Warten bis</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {filteredCandidates.map(c => (
              <tr key={c.id} className="border-b border-black/10 hover:bg-gray-50 transition-colors">
                <td className="p-4 uppercase">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-full font-black"
                      value={c.name}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'name', e.target.value)}
                    />
                  ) : c.name}
                </td>
                <td className="p-4 uppercase opacity-60">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-full"
                      value={c.club}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'club', e.target.value)}
                    />
                  ) : c.club}
                </td>
                <td className="p-4 text-[#C00000]">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-full uppercase"
                      value={c.position}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'position', e.target.value)}
                    />
                  ) : c.position}
                </td>
                <td className="p-4">
                  {isEditing ? (
                    <input 
                      type="number"
                      className="bg-transparent focus:outline-none w-12"
                      value={c.age}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'age', parseInt(e.target.value) || 0)}
                    />
                  ) : c.age}
                </td>
                <td className="p-4">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-16"
                      value={c.marketValue}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'marketValue', e.target.value)}
                    />
                  ) : c.marketValue}
                </td>
                <td className="p-4">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-20"
                      value={c.date || ''}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'date', e.target.value)}
                    />
                  ) : (c.date || '-')}
                </td>
                <td className="p-4 uppercase">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-20"
                      value={c.status || ''}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'status', e.target.value)}
                    />
                  ) : (c.status || '-')}
                </td>
                <td className="p-4">
                  {isEditing ? (
                    <select 
                      className="bg-transparent focus:outline-none text-[8px] font-black uppercase"
                      value={c.recommendation}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'recommendation', e.target.value as any)}
                    >
                      <option value="Verpflichten">Verpflichten</option>
                      <option value="Beobachten">Beobachten</option>
                      <option value="Absage">Absage</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase text-white ${c.recommendation === 'Verpflichten' ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {c.recommendation}
                    </span>
                  )}
                </td>
                <td className="p-4 text-[#C00000]">
                  {isEditing ? (
                    <input 
                      type="text"
                      className="bg-transparent focus:outline-none w-20"
                      value={c.waitingTime || ''}
                      onChange={(e) => handleUpdateScoutingCandidate(c.id, 'waitingTime', e.target.value)}
                    />
                  ) : (c.waitingTime || '-')}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-black hover:text-white transition-colors border border-black"><ChevronRight size={14} /></button>
                    {isEditing && (
                      <button 
                        onClick={() => {
                          handleRemoveScoutingCandidate(c.id);
                        }} 
                        className="p-1 hover:bg-red-600 hover:text-white transition-colors border border-black text-red-600"
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
        <div className="p-4 border-t border-black/10 bg-gray-50 flex justify-center">
          <button 
            onClick={() => setShowAddScoutingModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
          >
            <UserPlus size={14} /> Kandidat hinzufügen
          </button>
        </div>
      </div>
    </div>
  );

  const renderDepthChart = () => {
    const positions = ['TW', 'IV', 'RV', 'LV', 'DM', 'ZM', 'RM/RW', 'LM/LW', 'OM', 'ST'];
    const allOptions = sortPlayers([
      ...players.map(p => ({ id: p.id, name: `${p.lastName} (#${p.number})`, type: 'Kader', position: p.position })),
      ...scoutingCandidates.map(c => ({ id: c.id, name: `${c.name} (${c.club})`, type: 'Scouting', position: c.position }))
    ]);

    return (
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {positions.map(pos => (
          <div key={pos} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col watermark-bg">
            <div className="bg-black text-white p-2 text-[10px] font-black uppercase tracking-widest text-center">
              {pos}
            </div>
            <div className="p-3 space-y-3">
              {[0, 1, 2].map(idx => (
                <div key={idx} className="space-y-1">
                  <label className="text-[8px] font-black uppercase opacity-40">{idx + 1}. Wahl</label>
                  <select 
                    className={`w-full bg-gray-50 border-2 border-black p-1.5 text-[10px] font-black uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    value={depthChart[pos]?.[idx] || ''}
                    onChange={(e) => handleDepthChartChange(pos, idx, e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="">-- WÄHLEN --</option>
                    <optgroup label="KADER">
                      {allOptions.filter(o => o.type === 'Kader').map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="SCOUTING">
                      {allOptions.filter(o => o.type === 'Scouting').map(o => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sub-Header */}
      <div className="bg-white border-b-2 border-black p-2 flex justify-between items-center shrink-0 watermark-bg">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            <input 
              type="text" 
              placeholder="KANDIDATEN SUCHEN..." 
              className="pl-7 pr-2 py-1 bg-gray-100 border-2 border-black text-[10px] font-black uppercase focus:outline-none w-48"
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100 border-2 border-black p-0.5">
            <button 
              onClick={() => setScoutingViewMode('grid')}
              className={`p-1.5 transition-all ${scoutingViewMode === 'grid' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
              title="GRID"
            >
              <LayoutGrid size={12} />
            </button>
            <button 
              onClick={() => setScoutingViewMode('table')}
              className={`p-1.5 transition-all ${scoutingViewMode === 'table' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
              title="LISTE"
            >
              <TableIcon size={12} />
            </button>
            <button 
              onClick={() => setScoutingViewMode('field')}
              className={`p-1.5 transition-all ${scoutingViewMode === 'field' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
              title="FELD"
            >
              <MapIcon size={12} />
            </button>
            <button 
              onClick={() => setScoutingViewMode('depth')}
              className={`p-1.5 transition-all ${scoutingViewMode === 'depth' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
              title="SCHATTENKADER"
            >
              <Users size={12} />
            </button>
          </div>
          {isEditing && handleResetScouting && (
            <button 
              onClick={handleResetScouting}
              className="p-1.5 bg-gray-200 border-2 border-black hover:bg-black hover:text-white transition-all"
              title="LISTE ZURÜCKSETZEN"
            >
              <Clock size={12} />
            </button>
          )}
        </div>
        <button 
          onClick={() => setShowAddScoutingModal(true)}
          className="bg-[#C00000] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1"
        >
          <UserPlus size={12} /> NEUER KANDIDAT
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50">
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

        <div className="p-8 text-center opacity-40 text-[10px] font-black uppercase tracking-widest border-t border-black/5">
          FC AUGGEN 1921 e.V. | Team Management System 2026/2027
        </div>
      </div>
    </div>
  );
};
