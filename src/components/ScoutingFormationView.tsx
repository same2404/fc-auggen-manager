import React, { useState, useRef } from 'react';
import { ScoutingEntry, Player } from '../types';
import { motion } from 'motion/react';
import { Shield, Users, GripVertical, Target, UserCheck, X, Plus, Trash2, MessageSquare, Clock, Search } from 'lucide-react';
import { useSyncedState } from '../hooks/useSyncedState';

interface PositionData {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

interface ScoutingFormationViewProps {
  candidates: ScoutingEntry[];
  players?: Player[];
  onAddClick: () => void;
  onRemoveClick: () => void;
  onQuickAdd: (name: string) => void;
  isEditing?: boolean;
}

const GRUNDORDNUNG_4231: PositionData[] = [
  { id: 'TW', label: 'TW', x: 50, y: 90 },
  { id: 'IV1', label: 'IV', x: 35, y: 75 },
  { id: 'IV2', label: 'IV', x: 65, y: 75 },
  { id: 'LV', label: 'LV', x: 15, y: 70 },
  { id: 'RV', label: 'RV', x: 85, y: 70 },
  { id: 'DM1', label: 'DM', x: 40, y: 55 },
  { id: 'DM2', label: 'DM', x: 60, y: 55 },
  { id: 'LM', label: 'Flügel', x: 15, y: 35 },
  { id: 'OM', label: 'Mittelfeld', x: 50, y: 35 },
  { id: 'RM', label: 'Flügel', x: 85, y: 35 },
  { id: 'ST', label: 'Sturm', x: 50, y: 15 },
];

const WITH_BALL_433: PositionData[] = [
  { id: 'TW', label: 'TW', x: 50, y: 90 },
  { id: 'IV1', label: 'IV', x: 35, y: 80 },
  { id: 'IV2', label: 'IV', x: 65, y: 80 },
  { id: 'LV', label: 'LV', x: 10, y: 55 },
  { id: 'RV', label: 'RV', x: 90, y: 55 },
  { id: 'DM', label: 'DM', x: 50, y: 65 },
  { id: 'ZM1', label: 'Mittelfeld', x: 35, y: 45 },
  { id: 'ZM2', label: 'Mittelfeld', x: 65, y: 45 },
  { id: 'LW', label: 'Flügel', x: 15, y: 20 },
  { id: 'RW', label: 'Flügel', x: 85, y: 20 },
  { id: 'ST', label: 'Sturm', x: 50, y: 15 },
];

export const ScoutingFormationView: React.FC<ScoutingFormationViewProps> = ({ candidates, players = [], onAddClick, onRemoveClick, onQuickAdd, isEditing = false }) => {
  const [withBall, setWithBall] = useState(false);
  const [activeTab, setActiveTab] = useState<'kader' | 'scouting'>('scouting');
  const [searchTerm, setSearchTerm] = useState('');
  
  const posKey = withBall ? 'scouting_pos_with_ball' : 'scouting_pos_grund';
  const lineupKey = withBall ? 'scouting_lineup_with_ball' : 'scouting_lineup_grund';

  const [posData, setPosData] = useSyncedState<PositionData[]>(posKey, () => {
    const saved = localStorage.getItem(withBall ? 'fca_scouting_pos_with_ball' : 'fca_scouting_pos_grund');
    if (saved) return JSON.parse(saved);
    return withBall ? WITH_BALL_433 : GRUNDORDNUNG_4231;
  });

  const [rawAssignments, setAssignments] = useSyncedState<Record<string, any>>(lineupKey, () => {
    const savedLineup = localStorage.getItem(withBall ? 'fca_scouting_lineup_with_ball' : 'fca_scouting_lineup_grund');
    if (savedLineup) {
      const parsed = JSON.parse(savedLineup);
      const migrated: Record<string, string[]> = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (typeof val === 'string') migrated[key] = [val];
        else if (Array.isArray(val)) migrated[key] = val as string[];
      });
      return migrated;
    }
    return {};
  });

  const assignments = React.useMemo(() => {
    const normalized: Record<string, string[]> = {};
    Object.entries(rawAssignments).forEach(([key, val]) => {
      if (typeof val === 'string') normalized[key] = [val];
      else if (Array.isArray(val)) normalized[key] = val;
      else normalized[key] = [];
    });
    return normalized;
  }, [rawAssignments]);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (id: string, info: any) => {
    if (!isEditing || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((info.point.x - rect.left) / rect.width) * 100;
    const y = ((info.point.y - rect.top) / rect.height) * 100;

    const updated = posData.map(p => p.id === id ? { ...p, x, y } : p);
    setPosData(updated);
  };

  const handleAssign = (slotId: string, id: string) => {
    if (!isEditing) return;
    setAssignments((prev: Record<string, any>) => {
      const currentRaw = prev[slotId] || [];
      const current = (Array.isArray(currentRaw) ? currentRaw : [currentRaw]).filter(existingId => {
        if (!existingId) return false;
        if (existingId.startsWith('manual:')) return true;
        const existsAsPlayer = players.some(p => p.id === existingId);
        const existsAsScout = candidates.some(s => s.id === existingId);
        return existsAsPlayer || existsAsScout;
      });
      
      if (!current.includes(id) && current.length < 3) {
        return { ...prev, [slotId]: [...current, id] };
      }
      return { ...prev, [slotId]: current };
    });
  };

  const handleRemoveAssign = (slotId: string, id: string) => {
    if (!isEditing) return;
    setAssignments((prev: Record<string, any>) => {
      const currentRaw = prev[slotId] || [];
      const current = Array.isArray(currentRaw) ? currentRaw : [currentRaw];
      return { ...prev, [slotId]: current.filter((c: string) => c !== id) };
    });
  };

  const resetPositions = () => {
    if (!isEditing) return;
    const defaults = withBall ? WITH_BALL_433 : GRUNDORDNUNG_4231;
    setPosData(defaults);
  };

  const allOptions = [
    ...players.map(p => ({ id: p.id, name: `${p.lastName} (#${p.number})`, position: p.position, club: 'FC Auggen', type: 'kader', data: p })),
    ...candidates.map(c => ({ id: c.id, name: c.name, position: c.position, club: c.club, type: 'scouting', data: c }))
  ];

  const filteredOptions = allOptions.filter(o => 
    o.type === activeTab && 
    (o.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full space-y-2 overflow-hidden bg-white">
      {/* Header - Minimalist */}
      <div className="flex justify-between items-center shrink-0 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[#C00000]" />
          <h3 className="font-bold text-sm uppercase tracking-tight text-gray-800">Scouting & Kaderplanung</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button 
              onClick={resetPositions}
              className="text-xs font-medium text-gray-500 hover:text-black transition-colors px-2"
            >
              Reset
            </button>
          )}
          <div className="flex bg-gray-100 rounded-md p-0.5">
            <button 
              onClick={() => isEditing && setWithBall(false)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${!withBall ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'} ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={!isEditing}
            >
              4-2-3-1
            </button>
            <button 
              onClick={() => isEditing && setWithBall(true)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all ${withBall ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'} ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={!isEditing}
            >
              4-3-3
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Pitch Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-[#2d5a27] rounded-xl overflow-hidden shadow-inner"
        >
          {/* Pitch Markings */}
          <div className="absolute inset-4 border border-white/30 pointer-events-none rounded-sm">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/30 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 border border-white/30 border-t-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 border border-white/30 border-b-0" />
          </div>

          {/* Draggable Position Groups */}
          {posData.map((pos) => {
            const assignedIds = assignments[pos.id] || [];
            const assignedPersons = assignedIds.map(id => allOptions.find(o => o.id === id)).filter(Boolean);

            return (
              <motion.div
                key={`${withBall ? 'wb' : 'gr'}-${pos.id}`}
                drag={isEditing}
                dragMomentum={false}
                onDragEnd={(_, info) => isEditing && handleDragEnd(pos.id, info)}
                initial={false}
                animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ touchAction: 'none' }}
              >
                <div 
                  onDragOver={(e) => {
                    if (!isEditing) return;
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-2', 'ring-white', 'scale-105');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-2', 'ring-white', 'scale-105');
                  }}
                  onDrop={(e) => {
                    if (!isEditing) return;
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-2', 'ring-white', 'scale-105');
                    const id = e.dataTransfer.getData('text/plain');
                    if (id) handleAssign(pos.id, id);
                  }}
                  className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-lg w-40 flex flex-col group transition-all overflow-hidden border border-gray-200 ${isEditing ? 'cursor-move' : 'cursor-default'}`}
                >
                  <div className="bg-gray-900 text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <GripVertical size={10} className="opacity-40" />
                      <span>{pos.label}</span>
                    </div>
                    <span className="text-[8px] opacity-60">{assignedPersons.length} Spieler</span>
                  </div>
                  <div className="p-1.5 min-h-[60px] flex flex-col gap-1 justify-center">
                    {assignedPersons.length > 0 ? (
                      <>
                        {assignedPersons.map((person, idx) => (
                          <div key={idx} className="w-full bg-gray-50 border border-gray-100 rounded p-1.5 relative group/item">
                            <div className="flex justify-between items-start">
                              <p className="text-[9px] font-bold uppercase leading-tight truncate pr-4">{person?.name}</p>
                              {person?.type === 'scouting' && (
                                <span className={`shrink-0 text-[6px] font-black px-1 py-0.5 rounded-sm ${
                                  (person.data as ScoutingEntry).recommendation === 'Verpflichten' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                  {(person.data as ScoutingEntry).recommendation === 'Verpflichten' ? 'TOP' : 'BEOB.'}
                                </span>
                              )}
                            </div>
                            <p className="text-[7px] font-medium text-gray-500 truncate mt-0.5">{person?.club} • {person?.position}</p>
                            {isEditing && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRemoveAssign(pos.id, person!.id); }} 
                                className="absolute top-1 right-1 opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-opacity bg-white rounded-full p-0.5 shadow-sm"
                              >
                                <X size={8} />
                              </button>
                            )}
                          </div>
                        ))}
                        {Array.from({ length: 3 - assignedPersons.length }).map((_, i) => (
                          <div key={`slot-${i}`} className="w-full border border-dashed border-gray-200 rounded p-1.5 opacity-30">
                            <p className="text-[8px] font-bold uppercase text-center">Slot {assignedPersons.length + i + 1}</p>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="flex flex-col gap-1 w-full opacity-20">
                        <div className="border border-dashed border-gray-300 rounded p-1 text-[8px] font-bold uppercase text-center">Slot 1</div>
                        <div className="border border-dashed border-gray-300 rounded p-1 text-[8px] font-bold uppercase text-center">Slot 2</div>
                        <div className="border border-dashed border-gray-300 rounded p-1 text-[8px] font-bold uppercase text-center">Slot 3</div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar Lists */}
        <div className="w-72 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setActiveTab('kader')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'kader' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Kader
            </button>
            <button
              onClick={() => setActiveTab('scouting')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === 'scouting' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Scouting
            </button>
          </div>

          {/* Search & Actions */}
          <div className="p-3 bg-white border-b border-gray-200 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input 
                type="text" 
                placeholder="SUCHEN..." 
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-black transition-shadow"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim() && activeTab === 'scouting') {
                    onQuickAdd(searchTerm.trim());
                    setSearchTerm('');
                  }
                }}
              />
            </div>
            {activeTab === 'scouting' && (
              <div className="flex gap-1">
                <button 
                  onClick={() => {
                    if (searchTerm.trim()) {
                      onQuickAdd(searchTerm.trim());
                      setSearchTerm('');
                    } else {
                      onAddClick();
                    }
                  }} 
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-black text-white rounded-md text-[9px] font-bold uppercase hover:bg-gray-800 transition-colors"
                >
                  <Plus size={10} /> {searchTerm.trim() ? 'Schnell hinzufügen' : 'Neu'}
                </button>
                {isEditing && (
                  <button onClick={onRemoveClick} className="px-2 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
            {filteredOptions.map(o => {
              const isAssigned = Object.values(assignments).some(arr => arr.includes(o.id));
              return (
                <div
                  key={o.id}
                  draggable={isEditing}
                  onDragStart={(e) => {
                    if (!isEditing) return;
                    e.dataTransfer.setData('text/plain', o.id);
                  }}
                  className={`bg-white p-2.5 rounded-lg border transition-all hover:shadow-sm ${
                    isEditing ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                  } ${
                    isAssigned ? 'border-green-200 bg-green-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900 truncate pr-2">{o.name}</span>
                    {isAssigned && <UserCheck size={12} className="text-green-500 shrink-0" />}
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-medium text-gray-500">
                    <span>{o.position}</span>
                    <span className="truncate pl-2">{o.club}</span>
                  </div>
                  {o.type === 'scouting' && (o.data as ScoutingEntry).recommendation && (
                    <div className="mt-2 flex items-center gap-2">
                       <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                          (o.data as ScoutingEntry).recommendation === 'Verpflichten' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {(o.data as ScoutingEntry).recommendation}
                        </span>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs font-medium">
                Keine Spieler gefunden
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
