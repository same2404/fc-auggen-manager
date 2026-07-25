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
  const sortedPlayers = sortPlayers(players);
  const [newEntry, setNewEntry] = React.useState<any>({
    playerId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Behandlung',
    diagnosis: '',
    status: 'In Behandlung',
    remarks: ''
  });

  const handleAddEntry = () => {
    onAddPhysioEntry();
  };

  const handleQuickAdd = () => {
    if (!newEntry.playerId) {
      alert('Bitte wählen Sie einen Spieler aus.');
      return;
    }
    const entryToSave = {
      ...newEntry,
      id: Date.now().toString()
    };
    onUpdatePhysioEntry(entryToSave);
    // Reset new entry form
    setNewEntry({
      playerId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Behandlung',
      diagnosis: '',
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
            <h2 className="text-xs font-black uppercase tracking-tighter leading-none">Physio- & Verletzungsplan</h2>
            <span className="text-black/20 text-xs">|</span>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Medizinische Abteilung - Statusübersicht</p>
          </div>
        </div>
        {isEditing && (
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
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse text-[10px] font-bold">
              <thead className="sticky top-0 bg-black text-white z-10">
                <tr>
                  <th className="p-4 border-r border-white/10 text-left w-64">Spieler</th>
                  <th className="p-4 border-r border-white/10 text-left w-32">Datum</th>
                  <th className="p-4 border-r border-white/10 text-left w-32">Typ</th>
                  <th className="p-4 border-r border-white/10 text-left">Diagnose / Grund</th>
                  <th className="p-4 border-r border-white/10 text-left w-40">Status</th>
                  <th className="p-4 border-r border-white/10 text-left">Bemerkungen</th>
                  <th className="p-4 text-center w-16">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {/* Quick Add Row */}
                {isEditing && (
                  <tr className="bg-blue-50/50 border-b border-black">
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className="w-full bg-transparent font-black uppercase focus:outline-none text-blue-700"
                        value={newEntry.playerId}
                        onChange={(e) => setNewEntry({ ...newEntry, playerId: e.target.value })}
                      >
                        <option value="">-- Spieler wählen --</option>
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
                      <select 
                        className="w-full bg-transparent font-black uppercase focus:outline-none text-blue-700"
                        value={newEntry.status}
                        onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                      >
                        <option value="In Behandlung">In Behandlung</option>
                        <option value="Reha-Phase">Reha-Phase</option>
                        <option value="Wieder Fit">Wieder Fit</option>
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
                {physioEntries.length === 0 && !isEditing && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400 italic">
                      Keine Einträge vorhanden. Klicken Sie auf "Neuer Eintrag" oder nutzen Sie die Schnell-Hinzufügen-Zeile.
                    </td>
                  </tr>
                )}
                {physioEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b border-black/10">
                    <td className="p-4 border-r border-black/10">
                      <div className="flex flex-col gap-1">
                        <select 
                          className={`w-full bg-transparent font-black uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                          value={item.playerId || ''}
                          onChange={(e) => handleUpdate(item.id, 'playerId', e.target.value)}
                          disabled={!isEditing}
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
                        {isEditing && (
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
                        className={`w-full bg-transparent font-black focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={item.date || ''}
                        onChange={(e) => handleUpdate(item.id, 'date', e.target.value)}
                        disabled={!isEditing}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className={`w-full bg-transparent font-black uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={item.type || ''}
                        onChange={(e) => handleUpdate(item.id, 'type', e.target.value)}
                        disabled={!isEditing}
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
                        className={`w-full bg-transparent font-black uppercase focus:outline-none placeholder:opacity-20 ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholder={isEditing ? "Z.B. MUSKELFASERRIBS..." : ""}
                        value={item.diagnosis || ''}
                        onChange={(e) => handleUpdate(item.id, 'diagnosis', e.target.value)}
                        disabled={!isEditing}
                      />
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <select 
                        className={`w-full bg-transparent font-black uppercase focus:outline-none
                          ${item.status === 'Wieder Fit' ? 'text-green-600' : item.status === 'Langzeit' ? 'text-red-600' : 'text-blue-600'} ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                        value={item.status || ''}
                        onChange={(e) => handleUpdate(item.id, 'status', e.target.value)}
                        disabled={!isEditing}
                      >
                        <option value="In Behandlung">In Behandlung</option>
                        <option value="Reha-Phase">Reha-Phase</option>
                        <option value="Wieder Fit">Wieder Fit</option>
                        <option value="Langzeit">Langzeit</option>
                      </select>
                    </td>
                    <td className="p-4 border-r border-black/10">
                      <input 
                        type="text"
                        className={`w-full bg-transparent italic opacity-60 focus:outline-none ${!isEditing ? 'cursor-not-allowed' : ''}`}
                        placeholder={isEditing ? "Zusatzinfos..." : ""}
                        value={item.remarks || ''}
                        onChange={(e) => handleUpdate(item.id, 'remarks', e.target.value)}
                        disabled={!isEditing}
                      />
                    </td>
                    <td className="p-4 text-center">
                      {isEditing && (
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
            <span className="text-[10px] font-black uppercase tracking-widest">Verletzt: {physioEntries.filter(i => i.status !== 'Wieder Fit').length}</span>
          </div>
        </div>
        <p className="text-[8px] font-bold uppercase opacity-40 italic">Dokumentation der medizinischen Abteilung.</p>
      </div>
    </div>
  );
};
