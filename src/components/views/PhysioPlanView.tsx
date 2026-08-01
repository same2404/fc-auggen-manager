import React from 'react';
import { Player } from '../../types';
import { sortPlayers } from '../../utils/playerSorting';
import { 
  Activity, 
  Plus, 
  Trash2, 
  HeartPulse, 
  Stethoscope, 
  History,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';

interface PhysioPlanViewProps {
  players: Player[];
  physioEntries: any[];
  onAddPhysioEntry: () => void;
  onUpdatePhysioEntry: (entry: any) => void;
  onUpdatePlayer: (id: string, field: keyof Player, value: any) => void;
  onDeletePlayer: (id: string) => void;
  onDeletePhysioEntry: (id: string) => void;
  setShowAddPlayerModal: (show: boolean) => void;
  isEditing?: boolean;
}

export const PhysioPlanView: React.FC<PhysioPlanViewProps> = ({
  players,
  physioEntries,
  onAddPhysioEntry,
  onUpdatePhysioEntry,
  onUpdatePlayer,
  onDeletePlayer,
  onDeletePhysioEntry,
  setShowAddPlayerModal,
  isEditing = false
}) => {
  const editable = true; // Physio records are always editable to allow continuous logging
  const sortedPlayers = sortPlayers(players);
  const [newEntry, setNewEntry] = React.useState<any>({
    playerId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Behandlung',
    diagnosis: '',
    treatment: '',
    status: 'In Behandlung',
    remarks: ''
  });

  const [quickAddError, setQuickAddError] = React.useState<string | null>(null);

  const handleAddEntry = () => {
    onAddPhysioEntry();
  };

  const handleQuickAdd = () => {
    setQuickAddError(null);
    if (!newEntry.playerId) {
      setQuickAddError('Bitte wählen Sie einen Spieler aus.');
      return;
    }
    if (!newEntry.date) {
      setQuickAddError('Bitte geben Sie ein gültiges Datum an.');
      return;
    }
    if (!newEntry.diagnosis || !newEntry.diagnosis.trim()) {
      setQuickAddError('Bitte geben Sie eine Diagnose oder Beschwerde an.');
      return;
    }

    const entryToSave = {
      ...newEntry,
      diagnosis: newEntry.diagnosis.trim(),
      treatment: (newEntry.treatment || '').trim(),
      remarks: (newEntry.remarks || '').trim(),
      id: Date.now().toString()
    };
    onUpdatePhysioEntry(entryToSave);
    // Reset new entry form
    setNewEntry({
      playerId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Behandlung',
      diagnosis: '',
      treatment: '',
      status: 'In Behandlung',
      remarks: ''
    });
  };

  const handleUpdate = (id: string, field: string, value: any) => {
    const entry = physioEntries.find(item => item.id === id);
    if (entry) {
      onUpdatePhysioEntry({ ...entry, [field]: value });
    }
  };

  const handleDelete = (id: string) => {
    onDeletePhysioEntry(id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b-2 border-black bg-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 border border-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <HeartPulse size={14} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-tighter leading-none text-slate-900">Physio- & Verletzungsplan</h2>
            <span className="text-slate-400 text-xs">|</span>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Medizinische Abteilung - Statusübersicht</p>
          </div>
        </div>
        {editable && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAddPlayerModal(true)}
              className="bg-[#C00000] text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest border-2 border-black hover:bg-red-700 transition-colors flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus size={10} /> Neuer Spieler
            </button>
            <button 
              onClick={handleAddEntry}
              className="bg-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest border-2 border-black hover:bg-gray-800 transition-colors flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              <Plus size={10} /> Neuer Eintrag
            </button>
          </div>
        )}
      </div>

      {/* Main Table Area */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-2">
        {quickAddError && (
          <div className="bg-red-500 text-white px-4 py-2 text-xs font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{quickAddError}</span>
            </div>
            <button onClick={() => setQuickAddError(null)} className="hover:underline font-extrabold text-[10px]">VERWERFEN</button>
          </div>
        )}
        <div className="h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse text-[10px] font-bold">
              <thead className="sticky top-0 bg-black text-white z-10">
                <tr>
                  <th className="p-4 border-r border-white/10 text-left w-56">Spieler</th>
                  <th className="p-4 border-r border-white/10 text-left w-28">Datum</th>
                  <th className="p-4 border-r border-white/10 text-left w-28">Typ</th>
                  <th className="p-4 border-r border-white/10 text-left w-44">Diagnose / Beschwerde</th>
                  <th className="p-4 border-r border-white/10 text-left w-44">Durchgeführte Behandlung</th>
                  <th className="p-4 border-r border-white/10 text-left w-44">Status & Ampel-Belastbarkeit</th>
                  <th className="p-4 border-r border-white/10 text-left">Bemerkungen</th>
                  <th className="p-4 text-center w-16">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {/* Quick Add Row */}
                {editable && (
                  <tr className="bg-blue-50/50 border-b border-black">
                    <td className="p-4 border-r border-black/10">
                      <div className="flex gap-1 items-center">
                        <select 
                          className="flex-1 bg-transparent font-black uppercase focus:outline-none text-blue-700 min-w-0"
                          value={newEntry.playerId}
                          onChange={(e) => {
                            if (e.target.value === 'NEW_PLAYER') {
                              setShowAddPlayerModal(true);
                              setNewEntry({ ...newEntry, playerId: '' });
                            } else {
                              setNewEntry({ ...newEntry, playerId: e.target.value });
                            }
                          }}
                        >
                          <option value="">-- Spieler wählen --</option>
                          <option value="NEW_PLAYER" className="text-red-600 font-bold">+ NEUER SPIELER...</option>
                          <optgroup label="Spielerkader">
                            {sortedPlayers.filter(p => (p.category || 'player') === 'player').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Trainerteam">
                            {sortedPlayers.filter(p => p.category === 'coach').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Funktionsteam">
                            {sortedPlayers.filter(p => p.category === 'staff').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Ärztliche Abteilung">
                            {sortedPlayers.filter(p => p.category === 'medical').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                        </select>
                        <button
                          onClick={() => setShowAddPlayerModal(true)}
                          className="bg-red-600 text-white p-1 rounded hover:bg-red-700 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border border-black shrink-0"
                          title="Neuen Spieler anlegen"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="date"
                        className="w-full bg-transparent font-black focus:outline-none text-blue-700"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className="w-full bg-transparent font-black uppercase focus:outline-none text-blue-700"
                        value={newEntry.type}
                        onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                      >
                        <option value="Behandlung">Behandlung</option>
                        <option value="Verletzung">Verletzung</option>
                        <option value="Reha">Reha</option>
                        <option value="Prävention">Prävention</option>
                      </select>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className="w-full bg-transparent font-black uppercase focus:outline-none placeholder:text-blue-300 text-blue-700"
                        placeholder="NEUE DIAGNOSE..."
                        value={newEntry.diagnosis}
                        onChange={(e) => setNewEntry({ ...newEntry, diagnosis: e.target.value })}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className="w-full bg-transparent font-black uppercase focus:outline-none placeholder:text-blue-300 text-blue-700"
                        placeholder="Z.B. MASSAGE, ULTRASCHALL..."
                        value={newEntry.treatment || ''}
                        onChange={(e) => setNewEntry({ ...newEntry, treatment: e.target.value })}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className="w-full bg-transparent font-black uppercase focus:outline-none text-blue-700"
                        value={newEntry.status}
                        onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                      >
                        <option value="In Behandlung">In Behandlung</option>
                        <option value="Austrainiert">Austrainiert</option>
                        <option value="Spielfähig">Spielfähig</option>
                        <option value="Reha-Phase">Reha-Phase</option>
                        <option value="Langzeit">Langzeit</option>
                      </select>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className="w-full bg-transparent italic opacity-60 focus:outline-none text-blue-700"
                        placeholder="Zusatzinfos..."
                        value={newEntry.remarks}
                        onChange={(e) => setNewEntry({ ...newEntry, remarks: e.target.value })}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={handleQuickAdd}
                        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border border-black"
                        title="Direkt hinzufügen"
                      >
                        <Plus size={16} />
                      </button>
                    </td>
                  </tr>
                )}
                {physioEntries.length === 0 && !editable && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400 italic">
                      Keine Einträge vorhanden. Klicken Sie auf "Neuer Eintrag" oder nutzen Sie die Schnell-Hinzufügen-Zeile.
                    </td>
                  </tr>
                )}
                {physioEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b border-black/10">
                    <td className="p-4 border-r border-black/10">
                      <div className="flex flex-col gap-1">
                        <select 
                          className={`w-full bg-transparent font-black uppercase focus:outline-none ${!editable ? 'opacity-70 cursor-not-allowed' : ''}`}
                          value={item.playerId || ''}
                          onChange={(e) => handleUpdate(item.id, 'playerId', e.target.value)}
                          disabled={!editable}
                        >
                          <optgroup label="Spielerkader">
                            {sortedPlayers.filter(p => (p.category || 'player') === 'player').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Trainerteam">
                            {sortedPlayers.filter(p => p.category === 'coach').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Funktionsteam">
                            {sortedPlayers.filter(p => p.category === 'staff').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Ärztliche Abteilung">
                            {sortedPlayers.filter(p => p.category === 'medical').map(p => (
                              <option key={p.id} value={p.id}>{p.lastName}</option>
                            ))}
                          </optgroup>
                        </select>
                        {editable && (
                          <div className="flex gap-1 mt-1">
                            <input 
                              type="text"
                              className="bg-gray-100 border border-black/20 px-1 py-0.5 text-[8px] w-full focus:outline-none focus:border-black"
                              value={players.find(p => p.id === item.playerId)?.lastName || ''}
                              onChange={(e) => onUpdatePlayer(item.playerId, 'lastName', e.target.value)}
                              placeholder="Nachname"
                            />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="date"
                        className={`w-full bg-transparent font-black focus:outline-none ${!editable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={item.date || ''}
                        onChange={(e) => handleUpdate(item.id, 'date', e.target.value)}
                        disabled={!editable}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className={`w-full bg-transparent font-black uppercase focus:outline-none ${!editable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={item.type || ''}
                        onChange={(e) => handleUpdate(item.id, 'type', e.target.value)}
                        disabled={!editable}
                      >
                        <option value="Behandlung">Behandlung</option>
                        <option value="Verletzung">Verletzung</option>
                        <option value="Reha">Reha</option>
                        <option value="Prävention">Prävention</option>
                      </select>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className={`w-full bg-transparent font-black uppercase focus:outline-none placeholder:opacity-20 ${!editable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder={editable ? "Z.B. MUSKELFASERRIBS..." : ""}
                        value={item.diagnosis || ''}
                        onChange={(e) => handleUpdate(item.id, 'diagnosis', e.target.value)}
                        disabled={!editable}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className={`w-full bg-transparent font-black uppercase focus:outline-none placeholder:opacity-20 ${!editable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder={editable ? "Z.B. MASSAGE, ULTRASCHALL..." : ""}
                        value={item.treatment || ''}
                        onChange={(e) => handleUpdate(item.id, 'treatment', e.target.value)}
                        disabled={!editable}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className={`w-full bg-transparent font-black uppercase focus:outline-none text-[9px] p-1 rounded border
                          ${(item.status || '').includes('Grün') || item.status === 'Spielfähig' || item.status === 'Wieder Fit' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 
                            (item.status || '').includes('Gelb') || item.status === 'Reha-Phase' || item.status === 'In Behandlung' ? 'bg-amber-50 text-amber-800 border-amber-300' : 
                            'bg-red-50 text-red-700 border-red-300'} ${!editable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={item.status || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate(item.id, 'status', val);
                          if (item.playerId) {
                            if (val.includes('Grün') || val === 'Spielfähig' || val === 'Wieder Fit') {
                              onUpdatePlayer(item.playerId, 'loadAmpel', 'Grün');
                            } else if (val.includes('Gelb') || val === 'Reha-Phase' || val === 'In Behandlung') {
                              onUpdatePlayer(item.playerId, 'loadAmpel', 'Gelb');
                            } else if (val.includes('Rot') || val === 'Langzeit' || val === 'Ausfall') {
                              onUpdatePlayer(item.playerId, 'loadAmpel', 'Rot');
                            }
                          }
                        }}
                        disabled={!editable}
                      >
                        <option value="🟢 Grün - Voll Belastbar (100%)">🟢 Grün - Voll Belastbar (100%)</option>
                        <option value="🟡 Gelb - Teilbelastung (Vorsicht)">🟡 Gelb - Teilbelastung (Vorsicht)</option>
                        <option value="🔴 Rot - Ausfall / Keine Belastung">🔴 Rot - Ausfall / Keine Belastung</option>
                        <option value="In Behandlung">In Behandlung (🟡 Gelb)</option>
                        <option value="Reha-Phase">Reha-Phase (🟡 Gelb)</option>
                        <option value="Spielfähig">Spielfähig (🟢 Grün)</option>
                        <option value="Langzeit">Langzeit Ausfall (🔴 Rot)</option>
                      </select>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className={`w-full bg-transparent italic opacity-60 focus:outline-none ${!editable ? 'cursor-not-allowed' : ''}`}
                        placeholder={editable ? "Zusatzinfos..." : ""}
                        value={item.remarks || ''}
                        onChange={(e) => handleUpdate(item.id, 'remarks', e.target.value)}
                        disabled={!editable}
                      />
                    </td>
                    <td className="p-4 text-center">
                      {editable && (
                        <div className="flex flex-col gap-2 items-center">
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:scale-110 transition-transform" title="Eintrag löschen"><Trash2 size={16} /></button>
                          <button 
                            onClick={() => {
                              onDeletePlayer(item.playerId);
                            }}
                            className="text-red-800 hover:scale-110 transition-transform opacity-40 hover:opacity-100"
                            title="Spieler löschen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="p-4 bg-black text-white flex justify-between items-center shrink-0">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <Stethoscope size={14} className="text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Verletzt: {physioEntries.filter(i => i.status !== 'Spielfähig' && i.status !== 'Wieder Fit').length}</span>
          </div>
        </div>
        <p className="text-[8px] font-bold uppercase opacity-40 italic">Dokumentation der medizinischen Abteilung.</p>
      </div>
    </div>
  );
};
