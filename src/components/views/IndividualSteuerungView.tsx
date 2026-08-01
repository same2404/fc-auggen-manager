import React from 'react';
import { Player } from '../../types';
import { sortPlayers } from '../../utils/playerSorting';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Target, 
  TrendingUp, 
  History,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Shield,
  Search
} from 'lucide-react';

interface IndividualSteuerungViewProps {
  players: Player[];
  individualTrainingData: any[];
  selectedIndividualDate: string;
  setSelectedIndividualDate: (date: string) => void;
  handleUpdateIndividualTraining: (playerId: string, field: string, value: any) => void;
  onUpdatePlayer: (id: string, field: keyof Player, value: any) => void;
  onDeletePlayer: (id: string) => void;
  onAddPlayer?: () => void;
  onAddPlayerDirect?: (player: any) => void;
  isEditing?: boolean;
}

export const IndividualSteuerungView: React.FC<IndividualSteuerungViewProps> = ({
  players,
  individualTrainingData,
  selectedIndividualDate,
  setSelectedIndividualDate,
  handleUpdateIndividualTraining,
  onUpdatePlayer,
  onDeletePlayer,
  onAddPlayer,
  onAddPlayerDirect,
  isEditing = false
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [ampelFilter, setAmpelFilter] = React.useState<'ALLE' | 'Grün' | 'Gelb' | 'Rot'>('ALLE');
  const [newPlayer, setNewPlayer] = React.useState({
    lastName: '',
    firstName: '',
    number: '',
    position: '',
    category: 'player' as any
  });

  const sortedPlayers = sortPlayers(players);

  // Helper to determine active Ampel status for a player
  const getPlayerAmpelStatus = (player: Player): 'Grün' | 'Gelb' | 'Rot' => {
    const record = individualTrainingData.find(r => r.playerId === player.id && r.date === selectedIndividualDate);
    if (record?.loadAmpel) return record.loadAmpel;
    if (player.loadAmpel) return player.loadAmpel;
    if (player.isInjured || player.status === 'Verletzt') return 'Rot';
    if (player.status === 'Reha' || player.status === 'Vorsicht' || record?.load === 'Pause') return 'Gelb';
    return 'Grün';
  };

  const ampelCounts = React.useMemo(() => {
    let green = 0;
    let yellow = 0;
    let red = 0;
    sortedPlayers.forEach(p => {
      const status = getPlayerAmpelStatus(p);
      if (status === 'Grün') green++;
      else if (status === 'Gelb') yellow++;
      else if (status === 'Rot') red++;
    });
    return { green, yellow, red, total: sortedPlayers.length };
  }, [sortedPlayers, individualTrainingData, selectedIndividualDate]);

  const filteredPlayers = sortedPlayers.filter(p => {
    const matchesSearch = p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number?.toString().includes(searchTerm);
    if (!matchesSearch) return false;

    if (ampelFilter !== 'ALLE') {
      const status = getPlayerAmpelStatus(p);
      return status === ampelFilter;
    }
    return true;
  });

  const handleQuickAddPlayer = () => {
    if (!newPlayer.lastName || !newPlayer.position) {
      alert('Bitte Nachname und Position eingeben.');
      return;
    }
    const playerToSave: any = {
      ...newPlayer,
      id: `p${Date.now()}`,
      name: `${newPlayer.firstName} ${newPlayer.lastName}`.trim(),
      number: parseInt(newPlayer.number) || 0,
      status: 'Aktiv'
    };
    if (onAddPlayerDirect) {
      onAddPlayerDirect(playerToSave);
      setNewPlayer({
        lastName: '',
        firstName: '',
        number: '',
        position: '',
        category: 'player' as any
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className="p-2.5 border-b-2 border-black bg-slate-900 text-white flex flex-wrap justify-between items-center gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-amber-400" />
            <h3 className="font-black uppercase text-xs tracking-wider">Individuelle Steuerung & Belastungs-Ampel</h3>
          </div>
          <div className="flex items-center gap-2 border-l border-white/20 pl-3">
            <Search size={10} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="SPIELER SUCHEN..." 
              className="bg-slate-950 text-white text-[9px] font-black uppercase focus:outline-none px-2 py-1 rounded border border-white/10 w-32"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Belastungs-Ampel Schnell-Filter & Statistik */}
        <div className="flex items-center gap-2 text-[9px] font-black uppercase">
          <span className="text-slate-400 mr-1">Belastbarkeit:</span>
          <button
            onClick={() => setAmpelFilter('ALLE')}
            className={`px-2 py-1 rounded border transition-all ${ampelFilter === 'ALLE' ? 'bg-white text-black border-white' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
          >
            ALLE ({ampelCounts.total})
          </button>
          <button
            onClick={() => setAmpelFilter('Grün')}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-all ${ampelFilter === 'Grün' ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900'}`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            🟢 VOLL ({ampelCounts.green})
          </button>
          <button
            onClick={() => setAmpelFilter('Gelb')}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-all ${ampelFilter === 'Gelb' ? 'bg-amber-400 text-black border-amber-300 font-extrabold shadow' : 'bg-amber-950/60 text-amber-300 border-amber-800 hover:bg-amber-900'}`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            🟡 TEIL ({ampelCounts.yellow})
          </button>
          <button
            onClick={() => setAmpelFilter('Rot')}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-all ${ampelFilter === 'Rot' ? 'bg-red-500 text-white border-red-400 font-extrabold shadow' : 'bg-red-950/60 text-red-300 border-red-800 hover:bg-red-900'}`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            🔴 AUSFALL ({ampelCounts.red})
          </button>
        </div>

        <div className="flex items-center gap-1">
          {isEditing && onAddPlayer && (
            <button 
              onClick={onAddPlayer}
              className="flex items-center gap-1 px-2 py-1 bg-[#C00000] text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition-all mr-2 shadow"
            >
              <Plus size={10} />
              Spieler hinzufügen
            </button>
          )}
          <div className="flex items-center gap-2 mr-2">
            <Calendar size={10} className="text-slate-400" />
            <input 
              type="date"
              className="bg-slate-950 text-white text-[8px] font-black uppercase focus:outline-none px-1 py-0.5 rounded border border-white/20"
              value={selectedIndividualDate}
              onChange={(e) => setSelectedIndividualDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-[10px] font-bold">
          <thead className="sticky top-0 bg-black text-white z-20">
            <tr>
              <th className="p-3 border border-white/20 text-left w-10">Nr</th>
              <th className="p-3 border border-white/20 text-left w-56">Spieler</th>
              <th className="p-3 border border-white/20 text-center w-14">Pos</th>
              <th className="p-3 border border-white/20 text-center w-36">Belastungs-Ampel</th>
              <th className="p-3 border border-white/20 text-left w-28">Datum</th>
              <th className="p-3 border border-white/20 text-left">Individueller Schwerpunkt</th>
              <th className="p-3 border border-white/20 text-left">Saisonziele</th>
              <th className="p-3 border border-white/20 text-left">Status / Fortschritt</th>
              <th className="p-3 border border-white/20 text-center w-24">Intensität</th>
              <th className="p-3 border border-white/20 text-center w-8">EK</th>
              <th className="p-3 border border-white/20 text-center w-8">O</th>
              <th className="p-3 border border-white/20 text-center w-8">T</th>
              <th className="p-3 border border-white/20 text-center w-8">P</th>
              <th className="p-3 border border-white/20 text-center w-8">S</th>
              <th className="p-3 border border-white/20 text-center w-8">A</th>
              <th className="p-3 border border-white/20 text-center w-8">W</th>
              {isEditing && <th className="p-3 border border-white/20 text-center w-10">Aktion</th>}
            </tr>
          </thead>
          <tbody>
            {/* Quick Add Player Row */}
            {isEditing && (
              <tr className="bg-blue-50/50 border-b border-black">
                <td className="p-3 border-r border-black/10">
                  <input 
                    type="number"
                    className="w-full bg-transparent font-black text-center focus:outline-none text-blue-700"
                    placeholder="NR"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                  />
                </td>
                <td className="p-3 border-r border-black/10">
                  <div className="flex gap-1">
                    <input 
                      type="text"
                      className="bg-transparent font-black uppercase focus:outline-none w-1/2 text-blue-700"
                      placeholder="VORNAME"
                      value={newPlayer.firstName}
                      onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
                    />
                    <input 
                      type="text"
                      className="bg-transparent font-black uppercase focus:outline-none w-1/2 text-blue-700"
                      placeholder="NACHNAME"
                      value={newPlayer.lastName}
                      onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
                    />
                  </div>
                </td>
                <td className="p-3 border-r border-black/10 text-center">
                  <input 
                    type="text"
                    className="w-full bg-transparent font-black text-center focus:outline-none text-blue-700 uppercase"
                    placeholder="POS"
                    value={newPlayer.position}
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                  />
                </td>
                <td colSpan={12} className="p-3 border-r border-black/10">
                  <div className="flex items-center justify-between">
                    <select 
                      className="bg-transparent font-black uppercase focus:outline-none text-blue-700 text-[8px]"
                      value={newPlayer.category}
                      onChange={(e) => setNewPlayer({ ...newPlayer, category: e.target.value as any })}
                    >
                      <option value="player">Spieler</option>
                      <option value="staff">Trainerteam</option>
                      <option value="official">Funktionär</option>
                    </select>
                    <button 
                      onClick={handleQuickAddPlayer}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black"
                    >
                      Direkt Hinzufügen
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {['player', 'staff', 'official'].map(category => {
              const categoryPlayers = filteredPlayers.filter(p => (p.category || 'player') === category);
              if (categoryPlayers.length === 0) return null;

              return (
                <React.Fragment key={category}>
                  <tr className="bg-gray-200">
                    <td colSpan={isEditing ? 16 : 15} className="p-2 font-black uppercase text-[10px] tracking-widest border border-black">
                      {category === 'player' ? 'Spielerkader' : category === 'staff' ? 'Trainerteam' : 'Funktionäre'}
                    </td>
                  </tr>
                  {categoryPlayers.map((player, pIdx) => {
                    const record = individualTrainingData.find(r => r.playerId === player.id && r.date === selectedIndividualDate) || {
                      focus: '',
                      goals: '',
                      status: '',
                      load: 'Normal',
                      loadAmpel: undefined,
                      targetDate: '',
                      ek: '',
                      o: '',
                      t: '',
                      p: '',
                      s: '',
                      a: '',
                      w: ''
                    };

                    const currentAmpel = getPlayerAmpelStatus(player);

                    const handleAmpelChange = (newAmpel: 'Grün' | 'Gelb' | 'Rot') => {
                      handleUpdateIndividualTraining(player.id, 'loadAmpel', newAmpel);
                      onUpdatePlayer(player.id, 'loadAmpel', newAmpel);
                    };

                    return (
                      <tr key={player.id} className="hover:bg-gray-50 transition-colors border-b border-black/10">
                        <td className="p-3 border-r border-black/10 text-center opacity-40">{pIdx + 1}</td>
                        <td className="p-3 border-r border-black/10">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 border border-black text-[8px] font-black shrink-0">
                              {player.category === 'player' ? `#${player.number}` : (player.category === 'staff' ? 'T' : 'F')}
                            </span>
                            <div className="flex gap-1 flex-1">
                              <input 
                                type="text"
                                className={`bg-transparent focus:outline-none w-full ${!isEditing ? 'cursor-not-allowed' : 'font-bold uppercase'}`}
                                value={player.lastName || ''}
                                onChange={(e) => onUpdatePlayer(player.id, 'lastName', e.target.value)}
                                disabled={!isEditing}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-r border-black/10 text-center text-[#C00000]">{player.position}</td>
                        
                        {/* Belastungs-Ampel (Grün / Gelb / Rot) */}
                        <td className="p-2 border-r border-black/10 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleAmpelChange('Grün')}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all border ${currentAmpel === 'Grün' ? 'bg-emerald-500 text-white border-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' : 'bg-emerald-100 text-emerald-700 border-emerald-300 opacity-40 hover:opacity-100'}`}
                              title="🟢 GRÜN: 100% Voll belastbar & einsatzbereit"
                            >
                              🟢
                            </button>
                            <button
                              onClick={() => handleAmpelChange('Gelb')}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all border ${currentAmpel === 'Gelb' ? 'bg-amber-400 text-slate-950 border-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-110' : 'bg-amber-100 text-amber-700 border-amber-300 opacity-40 hover:opacity-100'}`}
                              title="🟡 GELB: Teilbelastung (z.B. max. 45 Min / Reduzierte Intensität)"
                            >
                              🟡
                            </button>
                            <button
                              onClick={() => handleAmpelChange('Rot')}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all border ${currentAmpel === 'Rot' ? 'bg-red-600 text-white border-red-800 shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110' : 'bg-red-100 text-red-700 border-red-300 opacity-40 hover:opacity-100'}`}
                              title="🔴 ROT: Keine Belastung (Verletzt / Schonung / Reha)"
                            >
                              🔴
                            </button>
                          </div>
                          <div className="text-[8px] font-black uppercase mt-1">
                            {currentAmpel === 'Grün' && <span className="text-emerald-700 font-extrabold">Voll (100%)</span>}
                            {currentAmpel === 'Gelb' && <span className="text-amber-700 font-extrabold">Teil (Max 45m)</span>}
                            {currentAmpel === 'Rot' && <span className="text-red-700 font-extrabold">Ausfall / Pause</span>}
                          </div>
                        </td>

                        <td className="p-3 border-r border-black/10">
                          <input 
                            type="date"
                            className={`w-full bg-transparent font-bold focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            value={record.targetDate || ''}
                            onChange={(e) => handleUpdateIndividualTraining(player.id, 'targetDate', e.target.value)}
                            disabled={!isEditing}
                          />
                        </td>
                        <td className="p-3 border-r border-black/10">
                          <input 
                            type="text"
                            className={`w-full bg-transparent font-black uppercase focus:outline-none placeholder:opacity-20 ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder={isEditing ? "Z.B. ABSCHLUSS..." : ""}
                            value={record.focus || ''}
                            onChange={(e) => handleUpdateIndividualTraining(player.id, 'focus', e.target.value)}
                            disabled={!isEditing}
                          />
                        </td>
                        <td className="p-3 border-r border-black/10">
                          <input 
                            type="text"
                            className={`w-full bg-transparent italic opacity-60 focus:outline-none ${!isEditing ? 'cursor-not-allowed' : ''}`}
                            placeholder={isEditing ? "Ziele definieren..." : ""}
                            value={record.goals || ''}
                            onChange={(e) => handleUpdateIndividualTraining(player.id, 'goals', e.target.value)}
                            disabled={!isEditing}
                          />
                        </td>
                        <td className="p-3 border-r border-black/10">
                          <input 
                            type="text"
                            className={`w-full bg-transparent font-bold focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                            placeholder={isEditing ? "Fortschritt..." : ""}
                            value={record.status || ''}
                            onChange={(e) => handleUpdateIndividualTraining(player.id, 'status', e.target.value)}
                            disabled={!isEditing}
                          />
                        </td>
                        <td className="p-3 text-center border-r border-black/10">
                          <select 
                            className={`text-[8px] font-black uppercase p-1 border focus:outline-none
                              ${record.load === 'Hoch' ? 'bg-red-50 text-red-700 border-red-200' : 
                                record.load === 'Niedrig' ? 'bg-green-50 text-green-700 border-green-200' : 
                                'bg-gray-50 text-gray-700 border-gray-200'}`}
                            value={record.load || 'Normal'}
                            onChange={(e) => handleUpdateIndividualTraining(player.id, 'load', e.target.value)}
                            disabled={!isEditing}
                          >
                            <option value="Niedrig">Niedrig</option>
                            <option value="Normal">Normal</option>
                            <option value="Hoch">Hoch</option>
                            <option value="Pause">Pause</option>
                          </select>
                        </td>
                        {['ek', 'o', 't', 'p', 's', 'a', 'w'].map(field => (
                          <td key={field} className="p-0 border-r border-black/10">
                            <input 
                              type="text"
                              className={`w-full h-full p-2 text-center bg-transparent font-black focus:bg-yellow-50 focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                              value={record[field] || ''}
                              onChange={(e) => handleUpdateIndividualTraining(player.id, field, e.target.value)}
                              placeholder={isEditing ? "-" : ""}
                              disabled={!isEditing}
                            />
                          </td>
                        ))}
                        {isEditing && (
                          <td className="p-3 border-r border-black/10 text-center">
                            <button 
                              onClick={() => {
                                onDeletePlayer(player.id);
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-black text-white border-t-2 border-black flex justify-between items-center shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Individuelle Förderung ist der Schlüssel zum Erfolg.</span>
          </div>
        </div>
        <p className="text-[9px] font-bold uppercase opacity-60 italic">
          Steuerung der individuellen Belastung und Entwicklungsschwerpunkte.
        </p>
      </div>
    </div>
  );
};
