import React, { useState } from 'react';
import { MeetingEntry, Player, ScoutingEntry } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  Trash2, 
  User, 
  Target, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw
} from 'lucide-react';

interface MeetingsCalendarViewProps {
  players: Player[];
  scoutingCandidates: ScoutingEntry[];
  meetingsData: MeetingEntry[];
  handleAddMeetingEntry: () => void;
  handleUpdateMeetingEntry: (id: string, field: keyof MeetingEntry, value: any) => void;
  handleRemoveMeetingEntry: (id: string) => void;
  handleResetMeetings?: () => void;
  handleImportMeetings?: () => void;
  onAddScoutingCandidate: (candidate: ScoutingEntry) => void;
  isEditing?: boolean;
}

export const MeetingsCalendarView: React.FC<MeetingsCalendarViewProps> = ({
  players,
  scoutingCandidates,
  meetingsData,
  handleAddMeetingEntry,
  handleUpdateMeetingEntry,
  handleRemoveMeetingEntry,
  handleResetMeetings,
  handleImportMeetings,
  isEditing = false
}) => {
  console.log('MeetingsCalendarView rendered with meetingsData:', meetingsData);
  const [filter, setFilter] = useState<'all' | 'kader' | 'scouting'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Offen' | 'Zusage' | 'Absage'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  const filteredMeetings = meetingsData
    .filter(m => {
      // Type filter
      let matchesType = true;
      if (filter === 'kader') {
        matchesType = players.some(p => {
          const playerNameLower = m.playerName.toLowerCase();
          const pLastNameLower = (p.lastName || '').toLowerCase();
          return playerNameLower.includes(pLastNameLower);
        });
      }
      else if (filter === 'scouting') {
        matchesType = scoutingCandidates.some(c => {
          const playerNameLower = m.playerName.toLowerCase();
          const cNameLower = (c.name || '').toLowerCase();
          return playerNameLower.includes(cNameLower);
        });
      }

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== 'all') matchesStatus = (m.status || 'Offen') === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter) matchesDate = m.date === dateFilter;

      return matchesType && matchesStatus && matchesDate;
    });

  const sortByDateTime = (a: MeetingEntry, b: MeetingEntry) => {
    const dateA = a.date + ' ' + (a.time || '00:00');
    const dateB = b.date + ' ' + (b.time || '00:00');
    return dateB.localeCompare(dateA);
  };

  const handleDelete = (id: string) => {
    handleRemoveMeetingEntry(id);
  };

  const MeetingCard: React.FC<{ meeting: MeetingEntry }> = ({ meeting }) => {
    const isPlayer = players.some(p => 
      meeting.playerName.toLowerCase().includes(p.lastName.toLowerCase())
    );
    const isScouting = scoutingCandidates.some(c => 
      meeting.playerName.toLowerCase().includes(c.name.toLowerCase())
    );
    const categoryColor = isScouting ? 'border-green-600' : isPlayer ? 'border-blue-600' : 'border-black';

    return (
      <div className={`bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden group ${categoryColor}`}>
        <div className={`p-3 border-b-2 border-black flex justify-between items-center bg-gray-50 ${categoryColor.replace('border', 'bg').replace('600', '50')}`}>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input 
                  type="date"
                  value={meeting.date}
                  onChange={(e) => handleUpdateMeetingEntry(meeting.id, 'date', e.target.value)}
                  className="text-[10px] font-black bg-white border border-black px-1 focus:outline-none"
                />
                <input 
                  type="time"
                  value={meeting.time}
                  onChange={(e) => handleUpdateMeetingEntry(meeting.id, 'time', e.target.value)}
                  className="text-[10px] font-black bg-white border border-black px-1 focus:outline-none w-16"
                />
              </div>
            ) : (
              <>
                <span className="text-sm font-black">{meeting.date.split('-').reverse().join('.')}</span>
                <span className="text-[10px] font-black opacity-40">|</span>
                <span className="text-[10px] font-black flex items-center gap-1"><Clock size={10} /> {meeting.time}</span>
              </>
            )}
          </div>
          {isEditing && (
            <button 
              onClick={() => {
                handleDelete(meeting.id);
              }} 
              className="text-red-600 hover:scale-110 transition-transform"
              title="Termin löschen"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isScouting ? <Target size={14} className="text-green-600" /> : <User size={14} className="text-blue-600" />}
              <h4 className="font-black uppercase text-sm tracking-tight leading-none">
                {meeting.playerName.split(',')[0]}
              </h4>
              {meeting.isScout && (
                <span className="bg-green-600 text-white text-[7px] font-black px-1 py-0.5 uppercase tracking-widest border border-black">
                  + SCOUT
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest opacity-60">
              <MapPin size={10} /> {meeting.location}
            </div>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase opacity-40 block mb-1">Gesprächsnotizen</label>
            <textarea 
              className={`w-full bg-gray-50 border border-black p-2 text-[10px] font-bold italic focus:outline-none min-h-[60px] resize-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              placeholder={isEditing ? "Notizen..." : ""}
              value={meeting.notes}
              onChange={(e) => handleUpdateMeetingEntry(meeting.id, 'notes', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <label className="text-[8px] font-black uppercase opacity-40 block mb-1">Grund der Zusage/Absage</label>
            <textarea 
              className={`w-full bg-gray-50 border border-black p-2 text-[10px] font-bold italic focus:outline-none min-h-[40px] resize-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              placeholder={isEditing ? "Grund angeben..." : ""}
              value={meeting.reason || ''}
              onChange={(e) => handleUpdateMeetingEntry(meeting.id, 'reason', e.target.value)}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <select 
              value={meeting.status || 'Offen'}
              onChange={(e) => handleUpdateMeetingEntry(meeting.id, 'status', e.target.value)}
              className="w-full bg-white border border-black p-1 text-[9px] font-black uppercase tracking-widest focus:outline-none"
            >
              <option value="Offen">Offen</option>
              <option value="Zusage">Zusage</option>
              <option value="Absage">Absage</option>
            </select>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar: Calendar Mini-View or Filters */}
      <div className="w-72 bg-white border-r-2 border-black flex flex-col shrink-0">
        <div className="p-4 border-b-2 border-black bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
              <CalendarIcon size={14} /> Datum Filter
            </h3>
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="text-[8px] font-black uppercase text-red-600 hover:underline"
              >
                Löschen
              </button>
            )}
          </div>
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-white border-2 border-black p-2 text-[10px] font-black focus:outline-none"
          />
        </div>

        <div className="p-4 space-y-6">
          {isEditing && (
            <button 
              onClick={handleAddMeetingEntry}
              className="w-full bg-black text-white py-3 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(192,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 mb-4"
            >
              <Plus size={14} /> NEUER TERMIN
            </button>
          )}
          <div>
            <h4 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-3">
              <Filter size={14} /> Typ Filter
            </h4>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'Alle Termine', color: 'bg-black' },
                { id: 'kader', label: 'Kader-Gespräche', color: 'bg-blue-600' },
                { id: 'scouting', label: 'Scouting-Termine', color: 'bg-green-600' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className={`w-full flex items-center gap-3 p-2 border-2 transition-all
                    ${filter === f.id ? 'border-black bg-gray-100' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <span className={`w-3 h-3 ${f.color} border border-black`}></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2 mb-3">
              <RefreshCw size={14} /> Status Filter
            </h4>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'Alle Status', color: 'bg-gray-400' },
                { id: 'Offen', label: 'Offen', color: 'bg-yellow-400' },
                { id: 'Zusage', label: 'Zusage', color: 'bg-green-600' },
                { id: 'Absage', label: 'Absage', color: 'bg-red-600' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`w-full flex items-center gap-3 p-2 border-2 transition-all
                    ${statusFilter === f.id ? 'border-black bg-gray-100' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <span className={`w-3 h-3 ${f.color} border border-black`}></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">{f.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 space-y-2">
          {isEditing && handleImportMeetings && (
            <button 
              onClick={handleImportMeetings}
              className="w-full bg-white text-black py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} /> TERMINE IMPORTIEREN
            </button>
          )}
          {isEditing && handleResetMeetings && (
            <button 
              onClick={handleResetMeetings}
              className="w-full bg-white text-black py-2 text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={14} /> DATEN ZURÜCKSETZEN
            </button>
          )}
        </div>
      </div>

      {/* Main Kanban View */}
      <div className="flex-1 overflow-x-auto bg-gray-100 p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Gesprächskalender</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-1">Terminplanung & Gesprächsdokumentation</p>
        </div>
        <div className="flex gap-6 h-[calc(100%-60px)] min-w-[1000px]">
          {/* Column: Zusage */}
          <div className="flex-1 flex flex-col min-w-[320px]">
            <div className="bg-green-600 text-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full" />
                Zusagen
              </h3>
              <span className="bg-black text-white text-[10px] px-2 py-0.5 font-black">
                {filteredMeetings.filter(m => m.status === 'Zusage').length}
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {filteredMeetings.filter(m => m.status === 'Zusage').sort(sortByDateTime).map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </div>

          {/* Column: Offen */}
          <div className="flex-1 flex flex-col min-w-[320px]">
            <div className="bg-yellow-400 text-black p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-black rounded-full" />
                Offen
              </h3>
              <span className="bg-black text-white text-[10px] px-2 py-0.5 font-black">
                {filteredMeetings.filter(m => (m.status || 'Offen') === 'Offen').length}
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {filteredMeetings.filter(m => (m.status || 'Offen') === 'Offen').sort(sortByDateTime).map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </div>

          {/* Column: Absage */}
          <div className="flex-1 flex flex-col min-w-[320px]">
            <div className="bg-red-600 text-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 flex items-center justify-between">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full" />
                Absagen
              </h3>
              <span className="bg-black text-white text-[10px] px-2 py-0.5 font-black">
                {filteredMeetings.filter(m => m.status === 'Absage').length}
              </span>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              {filteredMeetings.filter(m => m.status === 'Absage').sort(sortByDateTime).map(meeting => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
