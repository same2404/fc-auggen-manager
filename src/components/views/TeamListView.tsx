import React from 'react';
import { Player, Spieler } from '../../types';
import { Download, Phone, Mail, MapPin, Calendar, Activity, Edit2, Plus } from 'lucide-react';

interface TeamListViewProps {
  players: Spieler[];
  onEditPlayer?: (player: Spieler) => void;
  onAddPlayer?: () => void;
  isEditing: boolean;
}

export const TeamListView: React.FC<TeamListViewProps> = ({ players, onEditPlayer, onAddPlayer, isEditing }) => {
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'coach': 
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">Trainer</span>;
      case 'staff': 
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">Funktionär</span>;
      case 'medical': 
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">Physio / Arzt</span>;
      default: 
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">Spieler</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Modern Header */}
      <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Team-Datenbank</h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1 flex items-center gap-2">
            <Activity size={12} className="text-blue-600" />
            Zentrales Register • {players.length} Mitglieder
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && onAddPlayer && (
            <button
              onClick={onAddPlayer}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#C00000] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95"
            >
              <Plus size={14} />
              Hinzufügen
            </button>
          )}
        </div>
      </div>
      
      {/* Professional Data Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Name / Geburtsdatum</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Kontakt & Adresse</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Ausrüstung</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Position / Rolle</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Einsatzzeit</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Leistung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {isEditing && onEditPlayer && (
                      <button 
                        onClick={() => onEditPlayer(p)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                        title="Bearbeiten"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {getCategoryBadge(p.category || 'player')}
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {p.lastName}
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar size={10} /> {p.geburtsdatum || '-'}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700">
                      <Phone size={11} className="text-gray-400" /> {p.telefon || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <Mail size={11} className="text-gray-400" /> {p.email || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 italic truncate max-w-[180px]">
                      <MapPin size={10} /> {p.adresse || '-'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  {p.category === 'player' ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 w-3">O:</span>
                        <span className="text-gray-700">{p.oberteil || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 w-3">K:</span>
                        <span className="text-gray-700">{p.kurze_hose || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 w-3">L:</span>
                        <span className="text-gray-700">{p.lange_hose || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 w-3">S:</span>
                        <span className="text-gray-700">{p.schuhe || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="text-xs font-bold text-gray-800">
                    {p.position || (p.category === 'coach' ? 'Trainer' : (p.category === 'staff' || p.category === 'medical') ? 'Funktionär' : '-')}
                  </div>
                  {p.number && (
                    <div className="text-[10px] font-black text-blue-600 mt-0.5">
                      Trikot #{p.number}
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  {p.category === 'player' ? (
                    <div className="inline-flex flex-col items-end gap-1 bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-500">
                        Pflicht: <span className="text-[#C00000]">{p.einsatzzeitenGesamt || 0} MIN</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500">
                        Test: <span className="text-blue-600">{p.testEinsatzzeitenGesamt || 0} MIN</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  {p.category === 'player' ? (
                    <div className="inline-flex flex-col items-end gap-1 bg-gray-50 p-2 rounded border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-500">
                        Sprint: <span className="text-gray-900">{p.diagnostics?.sprintwert || '-'}</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500">
                        Yoyo: <span className="text-gray-900">{p.diagnostics?.yoyotest || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 italic">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
