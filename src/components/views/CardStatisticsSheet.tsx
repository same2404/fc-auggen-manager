import React from 'react';
import { Player, Match, CardRecord } from '../../types';
import { sortPlayers } from '../../utils/playerSorting';
import { 
  ShieldAlert, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Activity,
  History,
  AlertTriangle
} from 'lucide-react';

interface CardStatisticsSheetProps {
  players: Player[];
  competitiveMatches: Match[];
  cardRecords: CardRecord[];
  handleUpdateCard: (playerId: string, matchId: number | string, card: 'G' | 'GR' | 'R' | '') => void;
  onUpdatePlayer: (id: string, field: keyof Player, value: any) => void;
  onDeletePlayer: (id: string) => void;
  setShowAddPlayerModal: (show: boolean) => void;
  isEditing?: boolean;
}

export const CardStatisticsSheet: React.FC<CardStatisticsSheetProps> = ({
  players,
  competitiveMatches,
  cardRecords,
  handleUpdateCard,
  onUpdatePlayer,
  onDeletePlayer,
  setShowAddPlayerModal,
  isEditing = false
}) => {
  const sortedPlayers = sortPlayers(players);

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className="p-2 border-b-2 border-black bg-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-[#C00000]" />
            <h3 className="font-black uppercase text-xs tracking-widest">Karten-Statistik (Pflichtspiele)</h3>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold uppercase opacity-40">
            <Activity size={10} />
            <span>Saison 26/27</span>
          </div>
        </div>
        <button 
          onClick={() => setShowAddPlayerModal(true)}
          className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest border-2 border-black hover:bg-gray-800 transition-colors flex items-center gap-1"
        >
          <Plus size={10} /> Spieler hinzufügen
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-[10px] font-bold">
          <thead className="sticky top-0 bg-black text-white z-20">
            <tr>
              <th className="p-3 border border-white/20 text-left w-12">Nr</th>
              <th className="p-3 border border-white/20 text-left w-64">Spieler</th>
              <th className="p-3 border border-white/20 text-center w-16">Pos</th>
              <th className="p-3 border border-white/20 text-center w-12 bg-yellow-500 text-black">G</th>
              <th className="p-3 border border-white/20 text-center w-12 bg-yellow-600 text-white">G/R</th>
              <th className="p-3 border border-white/20 text-center w-12 bg-red-600 text-white">R</th>
              {isEditing && <th className="p-3 border border-white/20 text-center w-10">Aktion</th>}
              {competitiveMatches.map((match) => (
                <th key={match.id} className="p-0 border border-white/20 min-w-[100px]">
                  <div className="flex flex-col p-2 text-center">
                    <span className="text-[8px] font-black uppercase truncate">{match.opponent}</span>
                    <span className="text-[6px] font-bold opacity-60">{match.kickOff}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['player', 'coach', 'staff', 'medical'].map(category => {
              const filteredPlayers = sortedPlayers.filter(p => (p.category || 'player') === category);
              if (filteredPlayers.length === 0) return null;

              return (
                <React.Fragment key={category}>
                  <tr className="bg-gray-200">
                    <td colSpan={competitiveMatches.length + 10} className="p-2 font-black uppercase text-[10px] tracking-widest border border-black">
                      {category === 'player' ? 'Spielerkader' : category === 'coach' ? 'Trainerteam' : category === 'staff' ? 'Funktionsteam' : 'Ärztliche Abteilung'}
                    </td>
                  </tr>
                  {filteredPlayers.map((player, pIdx) => {
                    const record = cardRecords.find(r => r.playerId === player.id);
                    const totalYellow = Object.values(record?.cards || {}).filter(c => c === 'G').length;
                    const totalYellowRed = Object.values(record?.cards || {}).filter(c => c === 'GR').length;
                    const totalRed = Object.values(record?.cards || {}).filter(c => c === 'R').length;

                    return (
                      <tr key={player.id} className="hover:bg-gray-50 transition-colors border-b border-black/10">
                        <td className="p-3 border-r border-black/10 text-center opacity-40">{pIdx + 1}</td>
                        <td className="p-3 border-r border-black/10">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 border border-black text-[8px] font-black shrink-0">
                              {player.category === 'player' ? `#${player.number}` : (player.category === 'coach' ? 'T' : (player.category === 'staff' ? 'F' : 'M'))}
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
                        <td className={`p-3 border-r border-black/10 text-center font-black ${totalYellow >= 4 ? 'bg-yellow-100 text-yellow-700' : ''}`}>{totalYellow}</td>
                        <td className="p-3 border-r border-black/10 text-center font-black">{totalYellowRed}</td>
                        <td className="p-3 border-r border-black/10 text-center font-black">{totalRed}</td>
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
                        {competitiveMatches.map(match => (
                          <td key={match.id} className="p-1 border-r border-black/10">
                            <select 
                              className={`w-full bg-transparent text-center font-black focus:bg-yellow-50 focus:outline-none uppercase ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                              value={record?.cards?.[match.id] || record?.[`cards.${match.id}`] || ''}
                              onChange={(e) => handleUpdateCard(player.id, match.id, e.target.value as any)}
                              disabled={!isEditing}
                            >
                              <option value="">-</option>
                              <option value="G">G</option>
                              <option value="GR">G/R</option>
                              <option value="R">R</option>
                            </select>
                          </td>
                        ))}
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
            <AlertTriangle size={14} className="text-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sperren-Warnung: 5. Gelbe Karte führt zu automatischer Sperre.</span>
          </div>
        </div>
        <p className="text-[9px] font-bold uppercase opacity-60 italic">
          Karten werden pro Spieltag erfasst.
        </p>
      </div>
    </div>
  );
};
