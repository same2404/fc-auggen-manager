import React from 'react';
import { Player } from '../../types';
import { sortPlayers } from '../../utils/playerSorting';
import { 
  Activity, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Timer, 
  History,
  AlertCircle,
  Calendar,
  Edit2,
  FileText
} from 'lucide-react';

interface RunsSWViewProps {
  players: Player[];
  runRecords: any[];
  runMeta: any[];
  onUpdateRunRecord: (record: any) => void;
  onUpdateRunMeta: (meta: any) => void;
  onUpdatePlayer: (id: string, field: keyof Player, value: any) => void;
  isEditing?: boolean;
}

export const RunsSWView: React.FC<RunsSWViewProps> = ({
  players,
  runRecords,
  runMeta,
  onUpdateRunRecord,
  onUpdateRunMeta,
  onUpdatePlayer,
  isEditing = false
}) => {
  const sortedPlayers = sortPlayers(players);

  const handleUpdateRun = (playerId: string, runIdx: number, value: string) => {
    const existing = runRecords.find(r => r.playerId === playerId);
    if (existing) {
      onUpdateRunRecord({ 
        ...existing, 
        runs: { ...existing.runs, [runIdx]: value } 
      });
    } else {
      onUpdateRunRecord({ 
        id: playerId,
        playerId, 
        runs: { [runIdx]: value } 
      });
    }
  };

  const getRunMeta = (idx: number) => {
    return runMeta.find(m => m.id === `run_${idx}`) || { id: `run_${idx}`, name: `Lauf ${idx + 1}`, date: '' };
  };

  const handleUpdateRunMeta = (idx: number, field: string, value: string) => {
    const existing = getRunMeta(idx);
    onUpdateRunMeta({ ...existing, [field]: value });
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className="p-2 border-b-2 border-black bg-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[#C00000]" />
            <h3 className="font-black uppercase text-xs tracking-widest">Läufe & Ausdauer (SW)</h3>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold uppercase opacity-40">
            <TrendingUp size={10} />
            <span>Leistungsdiagnostik</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-[10px] font-bold">
          <thead className="sticky top-0 bg-black text-white z-20">
            <tr>
              <th className="p-3 border border-white/20 text-left w-12 align-top">Nr</th>
              <th className="p-3 border border-white/20 text-left w-80 align-top">Spieler</th>
              <th className="p-3 border border-white/20 text-center w-20 align-top font-black">Pos</th>
              {Array.from({ length: 15 }, (_, i) => {
                const meta = getRunMeta(i);
                return (
                  <th key={i} className="p-2 border border-white/20 text-center min-w-[140px] bg-black group">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 justify-center">
                        <input 
                          type="text"
                          className="bg-transparent text-center focus:outline-none w-full text-[10px] font-black uppercase placeholder-white/40 border-b border-white/10 focus:border-white/50"
                          value={meta.name}
                          onChange={(e) => handleUpdateRunMeta(i, 'name', e.target.value)}
                          placeholder="Lauf Name"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <textarea
                          placeholder="Inhalt/Beschreibung..."
                          className="bg-transparent text-center focus:outline-none w-full text-[8px] font-bold text-gray-400 focus:text-white placeholder-white/20 resize-none h-8 custom-scrollbar border-b border-white/5"
                          value={meta.content || ''}
                          onChange={(e) => handleUpdateRunMeta(i, 'content', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <Calendar size={8} className="text-yellow-400 shrink-0" />
                        <input 
                          type="date"
                          className="bg-transparent text-center focus:outline-none w-full text-[8px] font-bold text-gray-400 focus:text-white appearance-none"
                          value={meta.date}
                          onChange={(e) => handleUpdateRunMeta(i, 'date', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {['player', 'coach', 'staff', 'medical'].map(category => {
              const filteredPlayers = sortedPlayers.filter(p => (p.category || 'player') === category);
              if (filteredPlayers.length === 0) return null;

              return (
                <React.Fragment key={category}>
                  <tr className="bg-gray-200">
                    <td colSpan={20} className="p-2 font-black uppercase text-[10px] tracking-widest border border-black">
                      {category === 'player' ? 'Spielerkader' : category === 'coach' ? 'Trainerteam' : category === 'staff' ? 'Funktionsteam' : 'Ärztliche Abteilung'}
                    </td>
                  </tr>
                  {filteredPlayers.map((player, pIdx) => {
                    const record = runRecords.find(r => r.playerId === player.id);

                    return (
                      <tr key={player.id} className="hover:bg-gray-50 transition-colors border-b border-black/10">
                        <td className="p-3 border-r border-black/10 text-center opacity-40">{pIdx + 1}</td>
                        <td className="p-3 border-r border-black/10">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 border border-black text-[8px] font-black shrink-0">
                              {player.category === 'player' ? `#${player.number}` : (player.category === 'coach' ? 'T' : (player.category === 'staff' ? 'F' : 'M'))}
                            </span>
                            <div className="flex flex-col leading-tight min-w-0">
                              <span className="text-[11px] font-black uppercase">
                                {player.firstName} {player.lastName}
                              </span>
                              <span className="text-[8px] font-bold opacity-60 uppercase">
                                {player.category === 'player' ? 'Spieler' : 'Stab'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-r border-black/10 text-center text-[#C00000]">{player.position}</td>
                        {Array.from({ length: 15 }, (_, i) => (
                          <td key={i} className="p-0 border-r border-black/10">
                            <input 
                              type="text"
                              className={`w-full h-full p-3 text-center bg-transparent font-black focus:bg-yellow-50 focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                              value={record?.runs[i] || ''}
                              onChange={(e) => handleUpdateRun(player.id, i, e.target.value)}
                              placeholder={isEditing ? "--" : ""}
                              disabled={!isEditing}
                            />
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
            <Timer size={14} className="text-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">Zeiten in MM:SS oder Distanz in Meter erfassen.</span>
          </div>
        </div>
        <p className="text-[9px] font-bold uppercase opacity-60 italic">
          Individuelle Ausdauerwerte für die Trainingssteuerung.
        </p>
      </div>
    </div>
  );
};
