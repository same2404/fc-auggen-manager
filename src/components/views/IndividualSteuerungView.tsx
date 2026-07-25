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
  const [newPlayer, setNewPlayer] = React.useState({
    lastName: '',
    firstName: '',
    number: '',
    position: '',
    category: 'player' as any
  });

  const sortedPlayers = sortPlayers(players);
  const filteredPlayers = sortedPlayers.filter(p => 
    p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.number?.toString().includes(searchTerm)
  );

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
      <div className="p-2 border-b-2 border-black bg-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-[#C00000]" />
            <h3 className="font-black uppercase text-xs tracking-widest">Individuelle Steuerung & Ziele</h3>
          </div>
          <div className="flex items-center gap-2 border-l border-black/10 pl-4">
            <Search size={10} className="opacity-40" />
            <input 
              type="text" 
              placeholder="SPIELER SUCHEN..." 
              className="bg-transparent text-[8px] font-black uppercase focus:outline-none w-32"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isEditing && onAddPlayer && (
            <button 
              onClick={onAddPlayer}
              className="flex items-center gap-1 px-2 py-1 bg-[#C00000] text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition-all mr-2"
            >
              <Plus size={10} />
              Spieler hinzufügen
            </button>
          )}
          <div className="flex items-center gap-2 mr-4">
            <Calendar size={10} className="opacity-40" />
            <input 
              type="date"
              className="bg-transparent text-[8px] font-black uppercase focus:outline-none border-b border-black/20"
              value={selectedIndividualDate}
              onChange={(e) => setSelectedIndividualDate(e.target.value)}
            />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest">Saison 26/27</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-[10px] font-bold">
          <thead className="sticky top-0 bg-black text-white z-20">
            <tr>
              <th className="p-3 border border-white/20 text-left w-12">Nr</th>
              <th className="p-3 border border-white/20 text-left w-64">Spieler</th>
              <th className="p-3 border border-white/20 text-center w-16">Pos</th>
              <th className="p-3 border border-white/20 text-left w-32">Datum</th>
              <th className="p-3 border border-white/20 text-left">Individueller Schwerpunkt</th>
              <th className="p-3 border border-white/20 text-left">Saisonziele</th>
              <th className="p-3 border border-white/20 text-left">Status / Fortschritt</th>
              <th className="p-3 border border-white/20 text-center w-24">Belastung</th>
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
                      targetDate: '',
                      ek: '',
                      o: '',
                      t: '',
                      p: '',
                      s: '',
                      a: '',
                      w: ''
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
