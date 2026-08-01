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
  const getCategoryBadge = (p: Spieler) => {
    const category = p.category || 'player';
    const ampel = p.loadAmpel || (p.isInjured || p.status === 'Verletzt' ? 'Rot' : p.status === 'Reha' ? 'Gelb' : 'Grün');

    const ampelBadge = ampel === 'Rot' ? (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-red-950 text-red-300 border border-red-700 flex items-center gap-1" title="🔴 Keine Belastung / Ausfall">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> 🔴 Ausfall
      </span>
    ) : ampel === 'Gelb' ? (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1" title="🟡 Teilbelastung (Vorsicht)">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> 🟡 Teil
      </span>
    ) : (
      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1" title="🟢 Voll Belastbar (100%)">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 🟢 Voll
      </span>
    );

    switch (category) {
      case 'coach': 
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-950/80 text-sky-300 border border-sky-800">Trainer</span>;
      case 'staff': 
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800">Funktionär</span>;
      case 'medical': 
        return <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800">Physio / Arzt</span>;
      default: 
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-700">Spieler</span>
            {ampelBadge}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            Team-Datenbank
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <Activity size={13} className="text-amber-400" />
            Zentrales Register • {players.length} Mitglieder
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isEditing && onAddPlayer && (
            <button
              onClick={onAddPlayer}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-md active:scale-95"
            >
              <Plus size={15} />
              Hinzufügen
            </button>
          )}
        </div>
      </div>
      
      {/* Data Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse text-left text-slate-100">
          <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm">
            <tr>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">Name / Geburtsdatum</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">Kontakt & Adresse</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">Ausrüstung</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider">Position / Rolle</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider text-right">Einsatzzeit</th>
              <th className="px-5 py-3.5 text-[10px] font-black text-amber-400 uppercase tracking-wider text-right">Leistung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950">
            {players.map((p) => (
              <tr key={p.id} className="hover:bg-slate-900/80 transition-colors group">
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {isEditing && onEditPlayer && (
                      <button 
                        onClick={() => onEditPlayer(p)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all border border-transparent hover:border-slate-700"
                        title="Bearbeiten"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {getCategoryBadge(p)}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                    {p.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar size={11} className="text-amber-400/80" /> {p.geburtsdatum || '-'}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <Phone size={12} className="text-slate-400" /> {p.telefon || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Mail size={12} className="text-slate-400" /> {p.email || '-'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 italic truncate max-w-[180px]">
                      <MapPin size={11} className="text-slate-500" /> {p.adresse || '-'}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  {p.category === 'player' ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-3">O:</span>
                        <span className="text-slate-200">{p.oberteil || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-3">K:</span>
                        <span className="text-slate-200">{p.kurze_hose || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-3">L:</span>
                        <span className="text-slate-200">{p.lange_hose || '-'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 w-3">S:</span>
                        <span className="text-slate-200">{p.schuhe || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 italic">N/A</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-xs font-bold text-slate-200">
                    {p.position || (p.category === 'coach' ? 'Trainer' : (p.category === 'staff' || p.category === 'medical') ? 'Funktionär' : '-')}
                  </div>
                  {p.number && (
                    <div className="text-[11px] font-black text-amber-400 mt-0.5">
                      Trikot #{p.number}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  {p.category === 'player' ? (
                    <div className="inline-flex flex-col items-end gap-1 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[11px] font-bold text-slate-300">
                        Pflicht: <span className="text-amber-400 font-black">{p.einsatzzeitenGesamt || 0} MIN</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-300">
                        Test: <span className="text-sky-400 font-black">{p.testEinsatzzeitenGesamt || 0} MIN</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 italic">N/A</span>
                  )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  {p.category === 'player' ? (
                    <div className="inline-flex flex-col items-end gap-1 bg-slate-900 p-2 rounded-xl border border-slate-800">
                      <div className="text-[11px] font-bold text-slate-300">
                        Sprint: <span className="text-amber-400 font-black">{p.diagnostics?.sprintwert || '-'}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-300">
                        Yoyo: <span className="text-emerald-400 font-black">{p.diagnostics?.yoyotest || '-'}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 italic">N/A</span>
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
