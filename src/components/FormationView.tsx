import React, { useState, useEffect } from 'react';
import { Player, ScoutingEntry, ExternalPerson } from '../types';
import { sortPlayers } from '../utils/playerSorting';
import { motion } from 'motion/react';
import { Shield, Users, GripVertical, UserCheck, X, Target, Trash2, Maximize2 } from 'lucide-react';
import { useSyncedState } from '../hooks/useSyncedState';

interface PositionData {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

interface FormationViewProps {
  players: Player[];
  scoutingCandidates?: ScoutingEntry[];
  formation: string;
  onFormationChange: (f: string) => void;
  isEditing?: boolean;
}

const DEFAULT_POSITIONS: Record<string, PositionData[]> = {
  '4-4-2': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 35, y: 75 },
    { id: 'IV2', label: 'IV', x: 65, y: 75 },
    { id: 'LV', label: 'LV', x: 15, y: 70 },
    { id: 'RV', label: 'RV', x: 85, y: 70 },
    { id: 'LM', label: 'LM/LW', x: 15, y: 45 },
    { id: 'RM', label: 'RM/RW', x: 85, y: 45 },
    { id: 'ZM1', label: 'ZM', x: 40, y: 50 },
    { id: 'ZM2', label: 'ZM', x: 60, y: 50 },
    { id: 'ST1', label: 'ST', x: 40, y: 20 },
    { id: 'ST2', label: 'ST', x: 60, y: 20 },
  ],
  '4-3-3': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 35, y: 75 },
    { id: 'IV2', label: 'IV', x: 65, y: 75 },
    { id: 'LV', label: 'LV', x: 15, y: 70 },
    { id: 'RV', label: 'RV', x: 85, y: 70 },
    { id: 'DM', label: 'DM', x: 50, y: 55 },
    { id: 'ZM1', label: 'ZM', x: 35, y: 45 },
    { id: 'ZM2', label: 'ZM', x: 65, y: 45 },
    { id: 'LW', label: 'LM/LW', x: 20, y: 20 },
    { id: 'RW', label: 'RM/RW', x: 80, y: 20 },
    { id: 'ST', label: 'ST', x: 50, y: 15 },
  ],
  '4-2-3-1': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 35, y: 75 },
    { id: 'IV2', label: 'IV', x: 65, y: 75 },
    { id: 'LV', label: 'LV', x: 15, y: 70 },
    { id: 'RV', label: 'RV', x: 85, y: 70 },
    { id: 'DM1', label: 'DM', x: 40, y: 55 },
    { id: 'DM2', label: 'DM', x: 60, y: 55 },
    { id: 'LM', label: 'LM/LW', x: 15, y: 35 },
    { id: 'OM', label: 'OM', x: 50, y: 35 },
    { id: 'RM', label: 'RM/RW', x: 85, y: 35 },
    { id: 'ST', label: 'ST', x: 50, y: 15 },
  ],
  '3-5-2': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 50, y: 75 },
    { id: 'IV2', label: 'IV', x: 30, y: 75 },
    { id: 'IV3', label: 'IV', x: 70, y: 75 },
    { id: 'DM1', label: 'DM', x: 40, y: 55 },
    { id: 'DM2', label: 'DM', x: 60, y: 55 },
    { id: 'LM', label: 'LM/LW', x: 15, y: 45 },
    { id: 'RM', label: 'RM/RW', x: 85, y: 45 },
    { id: 'OM', label: 'OM', x: 50, y: 35 },
    { id: 'ST1', label: 'ST', x: 40, y: 20 },
    { id: 'ST2', label: 'ST', x: 60, y: 20 },
  ],
  '3-4-3': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 50, y: 75 },
    { id: 'IV2', label: 'IV', x: 30, y: 75 },
    { id: 'IV3', label: 'IV', x: 70, y: 75 },
    { id: 'ZM1', label: 'ZM', x: 40, y: 55 },
    { id: 'ZM2', label: 'ZM', x: 60, y: 55 },
    { id: 'LM', label: 'LM/LW', x: 15, y: 45 },
    { id: 'RM', label: 'RM/RW', x: 85, y: 45 },
    { id: 'ST1', label: 'ST', x: 50, y: 15 },
    { id: 'LW', label: 'LM/LW', x: 25, y: 20 },
    { id: 'RW', label: 'RM/RW', x: 75, y: 20 },
  ],
  '5-3-2': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 50, y: 75 },
    { id: 'IV2', label: 'IV', x: 30, y: 75 },
    { id: 'IV3', label: 'IV', x: 70, y: 75 },
    { id: 'LV', label: 'LV', x: 15, y: 65 },
    { id: 'RV', label: 'RV', x: 85, y: 65 },
    { id: 'ZM1', label: 'ZM', x: 50, y: 45 },
    { id: 'ZM2', label: 'ZM', x: 30, y: 45 },
    { id: 'ZM3', label: 'ZM', x: 70, y: 45 },
    { id: 'ST1', label: 'ST', x: 40, y: 20 },
    { id: 'ST2', label: 'ST', x: 60, y: 20 },
  ],
  '5-4-1': [
    { id: 'TW', label: 'TW', x: 50, y: 90 },
    { id: 'IV1', label: 'IV', x: 50, y: 75 },
    { id: 'IV2', label: 'IV', x: 30, y: 75 },
    { id: 'IV3', label: 'IV', x: 70, y: 75 },
    { id: 'LV', label: 'LV', x: 15, y: 65 },
    { id: 'RV', label: 'RV', x: 85, y: 65 },
    { id: 'ZM1', label: 'ZM', x: 40, y: 45 },
    { id: 'ZM2', label: 'ZM', x: 60, y: 45 },
    { id: 'LM', label: 'LM/LW', x: 15, y: 40 },
    { id: 'RM', label: 'RM/RW', x: 85, y: 40 },
    { id: 'ST', label: 'ST', x: 50, y: 15 },
  ]
};

export const FormationView: React.FC<FormationViewProps> = ({ players, scoutingCandidates = [], formation, onFormationChange, isEditing = false }) => {
  const [posData, setPosData] = useSyncedState<PositionData[]>(`posData_${formation}`, () => {
    const savedPos = localStorage.getItem(`fca_posData_${formation}`);
    if (savedPos) return JSON.parse(savedPos);
    return DEFAULT_POSITIONS[formation] || DEFAULT_POSITIONS['4-4-2'];
  });
  const [rawAssignments, setAssignments] = useSyncedState<Record<string, any>>(`lineup_${formation}`, () => {
    const savedLineup = localStorage.getItem(`fca_lineup_${formation}`);
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
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [manualInputSlot, setManualInputSlot] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const formations = ['4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '5-4-1'];

  interface Talent {
    id: string;
    name: string;
    position: string;
    positionId: string | null;
  }

  interface ExternalPerson {
    id: string;
    name: string;
    role: string;
    positionId: string | null;
  }

  const [transitionTalents, setTransitionTalents] = useSyncedState<Talent[]>('transition_talents_complex_v2', []);
  const [externalPersons, setExternalPersons] = useSyncedState<ExternalPerson[]>('external_persons_v1', []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-cleanup useEffect was removed to prevent data loss 
  // when synchronization delays occur across different clients.

  const [newTalentName, setNewTalentName] = useState('');
  const [newTalentPosition, setNewTalentPosition] = useState('');

  const [newExternalName, setNewExternalName] = useState('');
  const [newExternalRole, setNewExternalRole] = useState('Spieler');

  const handleDragEnd = (id: string, info: any) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((info.point.x - rect.left) / rect.width) * 100;
    const y = ((info.point.y - rect.top) / rect.height) * 100;

    const updated = posData.map(p => p.id === id ? { ...p, x, y } : p);
    setPosData(updated);
  };

  const handleAssign = (slotId: string, playerId: string | null) => {
    if (!isEditing) return;
    
    setAssignments((prev: Record<string, any>) => {
      const currentRaw = prev[slotId] || [];
      const current = (Array.isArray(currentRaw) ? currentRaw : [currentRaw]).filter(id => {
        if (!id) return false;
        if (id.startsWith('manual:')) return true;
        if (id.startsWith('talent:')) {
          const tId = id.replace('talent:', '');
          return transitionTalents.some(t => t.id === tId);
        }
        if (id.startsWith('external:')) {
          const eId = id.replace('external:', '');
          return externalPersons.some(e => e.id === eId);
        }
        const existsAsPlayer = players.some(p => p.id === id);
        const existsAsScout = scoutingCandidates.some(s => s.id === id);
        return existsAsPlayer || existsAsScout;
      });
      
      if (playerId === null) {
        // If we clear a slot, check if any talents or externals were there
        const removedTalents = current.filter((id: string) => id.startsWith('talent:'));
        const removedExternals = current.filter((id: string) => id.startsWith('external:'));
        
        if (removedTalents.length > 0) {
          setTransitionTalents(prev => prev.map(t => {
            const tId = `talent:${t.id}`;
            return removedTalents.includes(tId) ? { ...t, positionId: null } : t;
          }));
        }
        if (removedExternals.length > 0) {
          setExternalPersons(prev => prev.map(e => {
            const eId = `external:${e.id}`;
            return removedExternals.includes(eId) ? { ...e, positionId: null } : e;
          }));
        }
        return { ...prev, [slotId]: [] };
      }

      if (current.includes(playerId)) {
        // Removing a specific player/talent/external
        if (playerId.startsWith('talent:')) {
          const tId = playerId.replace('talent:', '');
          setTransitionTalents(prev => prev.map(t => t.id === tId ? { ...t, positionId: null } : t));
        } else if (playerId.startsWith('external:')) {
          const eId = playerId.replace('external:', '');
          setExternalPersons(prev => prev.map(e => e.id === eId ? { ...e, positionId: null } : e));
        }
        return { ...prev, [slotId]: current.filter((id: string) => id !== playerId) };
      } else if (current.length < 15) {
        // Adding a player/talent/external
        if (playerId.startsWith('talent:')) {
          const tId = playerId.replace('talent:', '');
          // If the talent had a previous position, remove it from that slot first
          setAssignments(p => {
            const next = { ...p };
            Object.keys(next).forEach(k => {
              if (Array.isArray(next[k])) {
                next[k] = next[k].filter((id: string) => id !== playerId);
              }
            });
            return next;
          });
          // Update talent's internal position state
          setTransitionTalents(prev => prev.map(t => t.id === tId ? { ...t, positionId: slotId } : t));
        } else if (playerId.startsWith('external:')) {
          const eId = playerId.replace('external:', '');
          setAssignments(p => {
            const next = { ...p };
            Object.keys(next).forEach(k => {
              if (Array.isArray(next[k])) {
                next[k] = next[k].filter((id: string) => id !== playerId);
              }
            });
            return next;
          });
          setExternalPersons(prev => prev.map(e => e.id === eId ? { ...e, positionId: slotId } : e));
        }
        return { ...prev, [slotId]: [...current, playerId] };
      }
      return { ...prev, [slotId]: current };
    });
  };

  // Sync: Remove talents/externals from board if they are deleted from lists
  useEffect(() => {
    setAssignments(prev => {
      let changed = false;
      const next = { ...prev };
      Object.entries(next).forEach(([slotId, ids]) => {
        const filtered = ids.filter((id: string) => {
          if (id.startsWith('talent:')) {
            const tId = id.replace('talent:', '');
            return transitionTalents.some(t => t.id === tId);
          }
          if (id.startsWith('external:')) {
            const eId = id.replace('external:', '');
            return externalPersons.some(e => e.id === eId);
          }
          return true;
        });
        if (filtered.length !== ids.length) {
          next[slotId] = filtered;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [transitionTalents, externalPersons]);

  const handleAddTalent = () => {
    if (!newTalentName.trim()) return;
    if (transitionTalents.length >= 15) {
      alert('Maximal 15 Talente erlaubt.');
      return;
    }
    const newTalent: Talent = {
      id: Date.now().toString(),
      name: newTalentName.trim(),
      position: newTalentPosition.trim().toUpperCase() || 'N/A',
      positionId: null
    };
    setTransitionTalents(prev => [...prev, newTalent]);
    setNewTalentName('');
    setNewTalentPosition('');
  };

  const handleDeleteTalent = (id: string) => {
    setTransitionTalents(prev => prev.filter(t => t.id !== id));
  };

  const handleAddExternal = () => {
    if (!newExternalName.trim()) return;
    if (externalPersons.length >= 20) {
      alert('Maximal 20 externe Personen erlaubt.');
      return;
    }
    const newPerson: ExternalPerson = {
      id: Date.now().toString(),
      name: newExternalName.trim(),
      role: newExternalRole,
      positionId: null
    };
    setExternalPersons(prev => [...prev, newPerson]);
    setNewExternalName('');
  };

  const handleDeleteExternal = (id: string) => {
    setExternalPersons(prev => prev.filter(e => e.id !== id));
  };

  const resetFormation = () => {
    const defaults = DEFAULT_POSITIONS[formation] || DEFAULT_POSITIONS['4-4-2'];
    setPosData(defaults);
  };

  return (
    <div 
      className={`flex flex-col h-full space-y-2 overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] bg-[#E8E8E8] p-4' : ''}`}
      onClick={() => {
        if (!isFullscreen) setIsFullscreen(true);
      }}
    >
      {/* Header */}
      <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center shrink-0 watermark-bg">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-[#C00000]" />
          <div className="flex items-center gap-2">
            <h3 className="font-black uppercase text-xs tracking-tighter leading-none">Kaderübersicht & Grundordnung</h3>
            <span className="text-black/20 text-xs">|</span>
            <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">FC Auggen • Taktische Ausrichtung</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFullscreen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreen(false);
              }}
              className="bg-red-600 text-white border-2 border-black p-1 hover:bg-red-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] mr-2"
            >
              <X size={12} />
            </button>
          )}
          {!isFullscreen && (
            <div className="flex items-center gap-1 opacity-30 mr-2">
              <Maximize2 size={10} />
              <span className="text-[7px] font-black uppercase">Vollbild</span>
            </div>
          )}
          {isEditing && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                resetFormation();
              }}
              className="bg-white text-black px-2 py-1 text-[8px] font-black uppercase tracking-widest border-2 border-black hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          )}
          <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Grundordnung:</span>
          <select 
            onClick={(e) => e.stopPropagation()}
            className={`bg-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest border-2 border-black focus:outline-none ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            value={formation}
            onChange={(e) => isEditing && onFormationChange(e.target.value)}
            disabled={!isEditing}
          >
            {formations.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-1 flex gap-2 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Sidebars Container Left */}
        <div className="flex gap-2 shrink-0">
          {/* Transition Players & Talents Sidebar (w-56) */}
          <div className="w-56 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden watermark-bg">
            <div className="bg-amber-500 text-black p-2 flex justify-between items-center border-b-2 border-black">
              <h4 className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1 leading-none">
                <Target size={12} /> Talente
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1.5">
              {transitionTalents.map((talent) => {
                const id = `talent:${talent.id}`;
                const posLabel = posData.find(pd => pd.id === talent.positionId)?.label;

                return (
                  <div 
                    key={talent.id} 
                    draggable={isEditing}
                    onDragStart={(e) => {
                      if (!isEditing) return;
                      e.dataTransfer.setData('text/plain', id);
                      e.currentTarget.classList.add('opacity-50');
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('opacity-50');
                    }}
                    onClick={() => {
                      if (!isEditing) return;
                      if (!selectedSlot) return;
                      handleAssign(selectedSlot, id);
                    }}
                    className={`flex flex-col p-1.5 border-2 border-black transition-all group cursor-pointer ${talent.positionId ? 'bg-amber-50' : 'bg-white hover:bg-gray-100'} ${!selectedSlot && isEditing ? 'hover:border-amber-400' : ''}`}
                    title={!selectedSlot && isEditing ? 'Zuerst Position auf dem Feld wählen' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-black bg-black text-white px-2 py-1 leading-none min-w-[28px] text-center rounded-[1px]">
                            {talent.position}
                          </span>
                          <span className="text-[11px] font-black uppercase truncate leading-none">
                            {talent.name}
                          </span>
                        </div>
                        {talent.positionId && (
                          <span className="text-[6px] font-black text-[#C00000] uppercase tracking-tighter mt-0.5">
                            • {posLabel}
                          </span>
                        )}
                        {!selectedSlot && isEditing && !talent.positionId && (
                          <span className="text-[5px] font-bold text-amber-600 uppercase mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            Zuerst Pos. wählen
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTalent(talent.id);
                        }}
                        className="text-white bg-red-600 hover:bg-red-700 transition-colors p-1 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ml-1"
                        title="Diesen Eintrag löschen"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {transitionTalents.length === 0 && (
                <p className="text-[8px] font-bold uppercase opacity-30 text-center py-4 italic">Keine Einträge</p>
              )}
            </div>

            <div className="p-1.5 border-t-2 border-black bg-gray-50">
              <div className="flex flex-col gap-1.5">
                <input 
                  type="text"
                  value={newTalentName}
                  onChange={(e) => setNewTalentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTalent();
                  }}
                  placeholder="NAME..."
                  className="w-full text-[8px] font-black uppercase border-2 border-black p-1 focus:outline-none focus:border-amber-500"
                />
                <input 
                  type="text"
                  value={newTalentPosition}
                  onChange={(e) => setNewTalentPosition(e.target.value)}
                  placeholder="POS..."
                  className="w-full text-[8px] font-black uppercase border-2 border-black p-1 focus:outline-none focus:border-amber-500"
                />
                <button 
                  onClick={handleAddTalent}
                  className="w-full bg-black text-white text-[9px] font-black uppercase py-1 hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none mt-1"
                >
                  Talent +
                </button>
              </div>
            </div>
          </div>

          {/* External Persons & Trainers Sidebar (w-56) */}
          <div className="w-56 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden watermark-bg">
            <div className="bg-blue-600 text-white p-2 flex justify-between items-center border-b-2 border-black">
              <h4 className="text-[10px] font-black uppercase tracking-tight flex items-center gap-1 leading-none">
                <Users size={12} /> Extern / Trainer
              </h4>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1.5">
              {externalPersons.map((person) => {
                const id = `external:${person.id}`;
                const posLabel = posData.find(pd => pd.id === person.positionId)?.label;

                return (
                  <div 
                    key={person.id} 
                    draggable={isEditing}
                    onDragStart={(e) => {
                      if (!isEditing) return;
                      e.dataTransfer.setData('text/plain', id);
                      e.currentTarget.classList.add('opacity-50');
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('opacity-50');
                    }}
                    onClick={() => {
                      if (!isEditing) return;
                      if (!selectedSlot) return;
                      handleAssign(selectedSlot, id);
                    }}
                    className={`flex flex-col p-1.5 border-2 border-black transition-all group cursor-pointer ${person.positionId ? 'bg-blue-50' : 'bg-white hover:bg-gray-100'} ${!selectedSlot && isEditing ? 'hover:border-blue-400' : ''}`}
                    title={!selectedSlot && isEditing ? 'Zuerst Position auf dem Feld wählen' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-black px-2 py-1 leading-none min-w-[28px] text-center rounded-[1px] ${person.role === 'Trainer' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {person.role === 'Trainer' ? 'TR' : 'EX'}
                          </span>
                          <span className="text-[11px] font-black uppercase truncate leading-none">
                            {person.name}
                          </span>
                        </div>
                        {person.positionId && (
                          <span className="text-[6px] font-black text-[#C00000] uppercase tracking-tighter mt-0.5">
                            • {posLabel}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExternal(person.id);
                        }}
                        className="text-white bg-red-600 hover:bg-red-700 transition-colors p-1 border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ml-1"
                        title="Diesen Eintrag löschen"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {externalPersons.length === 0 && (
                <p className="text-[8px] font-bold uppercase opacity-30 text-center py-4 italic">Keine Einträge</p>
              )}
            </div>

            <div className="p-1.5 border-t-2 border-black bg-gray-50">
              <div className="flex flex-col gap-1.5">
                <input 
                  type="text"
                  value={newExternalName}
                  onChange={(e) => setNewExternalName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddExternal();
                  }}
                  placeholder="NAME..."
                  className="w-full text-[8px] font-black uppercase border-2 border-black p-1 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-1">
                  {['Spieler', 'Trainer'].map(r => (
                    <button 
                      key={r} 
                      type="button" 
                      onClick={() => setNewExternalRole(r)}
                      className={`flex-1 text-[7px] font-black uppercase border-2 border-black py-0.5 hover:bg-black hover:text-white transition-colors ${newExternalRole === r ? 'bg-black text-white' : 'bg-white'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleAddExternal}
                  className="w-full bg-black text-white text-[9px] font-black uppercase py-1 hover:bg-gray-800 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none mt-1"
                >
                  Person +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pitch Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-[#2d5a27] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
        >
          {/* Pitch Markings */}
          <div className="absolute inset-4 border-2 border-white/30 pointer-events-none">
            {/* Center Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
            {/* Penalty Areas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-white/30 border-t-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 border-2 border-white/30 border-b-0" />
            {/* Goal Areas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white/30 border-t-0" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white/30 border-b-0" />
          </div>

          {posData.map((pos) => {
            const assignedIds = assignments[pos.id] || [];
            const assignedPlayers = assignedIds.map(id => {
              if (id.startsWith('manual:')) return { id, name: id.replace('manual:', ''), sub: 'GAST', isManual: true };
              if (id.startsWith('talent:')) {
                const tId = id.replace('talent:', '');
                const talentObj = transitionTalents.find(t => t.id === tId);
                return { id, name: talentObj?.name || 'Talent', sub: 'TALENT', isManual: true };
              }
              if (id.startsWith('external:')) {
                const eId = id.replace('external:', '');
                const externalObj = externalPersons.find(e => e.id === eId);
                return { id, name: externalObj?.name || 'Gast', sub: externalObj?.role.toUpperCase() || 'EXTERN', isManual: true };
              }
              const p = players.find(player => player.id === id);
              if (p) return { id, name: (p.lastName || p.firstName || (p as any).name || 'Spieler'), sub: `#${p.number}`, isManual: false };
              const s = scoutingCandidates.find(scout => scout.id === id);
              if (s) return { id, name: (s.name || 'Scout'), sub: 'SCOUT', isManual: false };
              return { id, name: 'Unbekannt', sub: id, isManual: false };
            });

            const isSelected = selectedSlot === pos.id;

            return (
              <motion.div
                key={`${formation}-${pos.id}`}
                drag={isEditing}
                dragMomentum={false}
                onDragEnd={(_, info) => isEditing && handleDragEnd(pos.id, info)}
                initial={false}
                animate={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ touchAction: 'none' }}
              >
                <div 
                  onClick={() => isEditing && setSelectedSlot(isSelected ? null : pos.id)}
                  onDragOver={(e) => {
                    if (!isEditing) return;
                    e.preventDefault();
                    e.currentTarget.classList.add('ring-4', 'ring-[#C00000]', 'scale-105');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('ring-4', 'ring-[#C00000]', 'scale-105');
                  }}
                  onDrop={(e) => {
                    if (!isEditing) return;
                    e.preventDefault();
                    e.currentTarget.classList.remove('ring-4', 'ring-[#C00000]', 'scale-105');
                    const id = e.dataTransfer.getData('text/plain');
                    if (id) handleAssign(pos.id, id);
                  }}
                  className={`bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-28 flex flex-col group transition-all ${isEditing ? 'cursor-move' : 'cursor-default'} ${isSelected ? 'ring-4 ring-[#C00000] scale-110 z-20' : ''}`}
                >
                  <div className="bg-black text-white p-0.5 text-[7px] font-black uppercase tracking-widest flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <GripVertical size={6} className="opacity-40" />
                      <span>{pos.label}</span>
                    </div>
                    {assignedPlayers.length > 0 && <UserCheck size={6} className="text-green-400" />}
                  </div>
                  <div className="p-1 min-h-[60px] flex flex-col items-center text-center bg-white/95 space-y-0.5">
                    {manualInputSlot === pos.id ? (
                      <input 
                        autoFocus
                        className="w-full text-[8px] font-black uppercase text-center focus:outline-none border-b border-black"
                        placeholder="NAME..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAssign(pos.id, `manual:${(e.target as HTMLInputElement).value}`);
                            setManualInputSlot(null);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value) {
                            handleAssign(pos.id, `manual:${e.target.value}`);
                          }
                          setManualInputSlot(null);
                        }}
                      />
                    ) : assignedPlayers.length > 0 ? (
                      <div className="w-full h-full flex flex-col justify-start">
                        {assignedPlayers.map((ap, idx) => (
                          <div key={`${ap.id}-${idx}`} className={`w-full py-0.5 relative group/item ${idx > 0 ? 'border-t border-black/5' : ''}`}>
                            <p className="text-[8px] font-black uppercase leading-[1.1] truncate pr-4">{ap.name}</p>
                            <p className="text-[5px] font-bold opacity-40 leading-none mt-0.5">{ap.sub}</p>
                            {isEditing && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssign(pos.id, ap.id);
                                }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 text-red-600 hover:text-red-800 transition-opacity p-0.5"
                                title="Spieler entfernen"
                              >
                                <X size={8} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        ))}
                        {assignedPlayers.length < 15 && (
                          <div className="w-full border-t border-black/5 py-0.5 opacity-10">
                            <p className="text-[6px] font-bold uppercase italic leading-none">Slot {assignedPlayers.length + 1}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 w-full opacity-10 h-full justify-center py-1">
                        <p className="text-[7px] font-bold uppercase italic leading-none">Slot 1</p>
                        <p className="text-[7px] font-bold uppercase italic leading-none">Slot 2</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Dropdown inside card */}
                  {isEditing && (
                    <div className="p-0.5 border-t border-black/10 bg-gray-50">
                      <select 
                        className="w-full text-[6px] font-black uppercase bg-transparent focus:outline-none cursor-pointer"
                        value=""
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_MANUAL') {
                            setManualInputSlot(pos.id);
                          } else if (e.target.value) {
                            handleAssign(pos.id, e.target.value);
                          }
                        }}
                      >
                        <option value="">+ SPIELER</option>
                        <option value="ADD_MANUAL">+ GASTSPIELER</option>
                        <optgroup label="KADER">
                          {sortPlayers(players).map(p => (
                            <option key={p.id} value={p.id}>
                              {assignedIds.includes(p.id) ? '✓ ' : ''}#{p.number} {p.lastName}
                            </option>
                          ))}
                        </optgroup>
                        {transitionTalents.length > 0 && (
                          <optgroup label="ÜBERGANGSSPIELER & TALENTE">
                            {transitionTalents.map(t => (
                              <option key={t.id} value={`talent:${t.id}`}>
                                {assignedIds.includes(`talent:${t.id}`) ? '✓ ' : ''}{t.name} ({t.position})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {externalPersons.length > 0 && (
                          <optgroup label="EXTERNE PERSONEN & TRAINER">
                            {externalPersons.map(e => (
                              <option key={e.id} value={`external:${e.id}`}>
                                {assignedIds.includes(`external:${e.id}`) ? '✓ ' : ''}{e.name} ({e.role})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {scoutingCandidates.length > 0 && (
                          <optgroup label="SCOUTING">
                            {scoutingCandidates.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                              <option key={c.id} value={c.id}>
                                {assignedIds.includes(c.id) ? '✓ ' : ''}{c.name} ({c.club})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar Squad List */}
        <div className="w-44 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden watermark-bg shrink-0">
          <div className="bg-black text-white p-2 flex justify-between items-center">
            <h4 className="text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
              <Users size={12} /> Kader
            </h4>
            <span className="text-[8px] font-bold opacity-50">{players.length}</span>
          </div>
            
            <div className="p-1.5 bg-gray-100 border-b border-black">
              <p className="text-[7px] font-bold uppercase opacity-60 leading-tight">
                {selectedSlot 
                  ? 'Ziel wählen:' 
                  : 'Pos. wählen'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-3">
              {/* Unified Player List */}
              <div className="space-y-1">
                {sortPlayers([
                  ...players.map(p => ({ ...p, isScout: false, isTalent: false, isExternal: false, displayName: p.lastName, displaySub: `#${p.number}` })),
                  ...scoutingCandidates.map(s => ({ ...s, isScout: true, isTalent: false, isExternal: false, displayName: s.name, displaySub: `S | ${s.club}` })),
                  ...transitionTalents.map(t => ({ 
                    id: `talent:${t.id}`, 
                    name: t.name, 
                    position: t.position,
                    isScout: false, 
                    isTalent: true, 
                    isExternal: false,
                    displayName: t.name, 
                    displaySub: t.position || 'TALENT' 
                  })),
                  ...externalPersons.map(e => ({
                    id: `external:${e.id}`,
                    name: e.name,
                    isScout: false,
                    isTalent: false,
                    isExternal: true,
                    displayName: e.name,
                    displaySub: e.role.toUpperCase()
                  }))
                ]).map(p => {
                  const assignedSlots = Object.entries(assignments)
                    .filter(([_, ids]) => ids.includes(p.id))
                    .map(([slotId]) => posData.find(pd => pd.id === slotId)?.label)
                    .filter(Boolean);
                  const isAssignedSomewhere = assignedSlots.length > 0;
                  const isTalent = (p as any).isTalent;
                  const isExternal = (p as any).isExternal;
                  
                  return (
                    <button
                      key={p.id}
                      draggable={isEditing}
                      onDragStart={(e) => {
                        if (!isEditing) return;
                        e.dataTransfer.setData('text/plain', p.id);
                        e.currentTarget.classList.add('opacity-50');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50');
                      }}
                      onClick={() => {
                        if (!isEditing) return;
                        if (!selectedSlot) return;
                        handleAssign(selectedSlot, p.id);
                      }}
                      title={!selectedSlot && isEditing ? 'Zuerst Position auf dem Feld wählen' : ''}
                      className={`w-full flex items-center justify-between p-1.5 border-2 transition-all group ${
                        isEditing 
                          ? 'border-black hover:bg-black hover:text-white cursor-pointer' 
                          : 'border-transparent opacity-60 cursor-default'
                      } ${isAssignedSomewhere ? (p.isScout ? 'bg-blue-50' : (isTalent ? 'bg-amber-50' : (isExternal ? 'bg-blue-100' : 'bg-green-50'))) : 'bg-white'} ${!selectedSlot && isEditing ? 'hover:border-amber-400' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 max-w-full overflow-hidden">
                        <span className={`min-w-[14px] h-[14px] flex items-center justify-center text-[7px] font-black border border-black shrink-0 ${
                          isAssignedSomewhere 
                            ? (p.isScout ? 'bg-blue-500 text-white' : (isTalent ? 'bg-amber-500 text-white' : (isExternal ? 'bg-blue-700 text-white' : 'bg-green-500 text-white'))) 
                            : 'bg-gray-100'
                        }`}>
                          {p.isScout ? 'S' : (isTalent ? 'T' : (isExternal ? 'E' : (p as any).number))}
                        </span>
                        <div className="text-left overflow-hidden">
                          <span className="text-[8px] font-bold uppercase truncate block leading-none">{p.displayName}</span>
                          <div className="flex items-center gap-1 overflow-hidden">
                            <span className="text-[6px] opacity-40 uppercase truncate">{p.displaySub}</span>
                            {isAssignedSomewhere && (
                              <span className="text-[6px] font-black text-[#C00000] uppercase tracking-tighter shrink-0">
                                • {assignedSlots.join(',')}
                              </span>
                            )}
                          </div>
                          {!selectedSlot && isEditing && (
                            <span className="text-[5px] font-bold text-amber-600 uppercase mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              Zuerst Pos. wählen
                            </span>
                          )}
                        </div>
                      </div>
                      {isAssignedSomewhere && <UserCheck size={8} className={`${p.isScout ? 'text-blue-600' : (isTalent ? 'text-amber-600' : (isExternal ? 'text-blue-700' : 'text-green-600'))} group-hover:text-white shrink-0`} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSlot && (
              <div className="p-1.5 border-t-2 border-black bg-gray-50">
                <button 
                  onClick={() => handleAssign(selectedSlot, null)}
                  className="w-full bg-[#C00000] text-white py-1.5 text-[8px] font-black uppercase tracking-widest border-2 border-black hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
                >
                  <X size={10} /> Räumen
                </button>
              </div>
            )}
          </div>
        </div>

      {/* Legend / Info */}
      <div className="bg-black text-white p-3 border-2 border-black flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#C00000]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Kader: {players.length} Spieler</span>
          </div>
        </div>
        <p className="text-[9px] font-bold uppercase opacity-60 italic">
          Hinweis: Positionen können frei auf der Tafel verschoben werden.
        </p>
      </div>
    </div>
  );
};
