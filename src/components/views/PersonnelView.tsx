import React, { useState, useEffect, useRef } from 'react';
import { Player, Spieler } from '../../types';
import { 
  User, 
  Shield, 
  Briefcase, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Pencil, 
  Plus, 
  Activity,
  Maximize2,
  X,
  RotateCw,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { sortPlayers } from '../../utils/playerSorting';

interface PersonnelViewProps {
  players: Spieler[];
  onEditPlayer: (player: Spieler) => void;
  onDeletePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, field: string, value: any) => void;
  onAddPlayer: () => void;
  isEditing: boolean;
  sessionLogs?: any[];
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round(height * (maxDim / width));
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round(width * (maxDim / height));
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = "white"; // Solid background in case of transparent png
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => {
        resolve(base64); // Fallback to original base64 if loading fails
      };
    };
    reader.onerror = error => reject(error);
  });
};

const ImageLightbox: React.FC<{
  image: string;
  onClose: () => void;
  onUpdate?: (newBase64: string) => void;
  isEditing?: boolean;
}> = ({ image, onClose, onUpdate, isEditing }) => {
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdate) {
      try {
        const base64 = await fileToBase64(file);
        onUpdate(base64);
      } catch (err) {
        console.error("Update failed", err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="absolute top-4 right-4 flex gap-4">
        {isEditing && onUpdate && (
          <>
            <button 
              onClick={handleRotate}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center gap-2 font-black uppercase text-[10px]"
            >
              <RotateCw size={20} /> Rotieren
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center gap-2 font-black uppercase text-[10px]"
            >
              <Upload size={20} /> Ersetzen
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />
          </>
        )}
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        <img 
          src={image} 
          alt="Lightbox" 
          className="max-w-full max-h-full object-contain transition-transform duration-300"
          style={{ transform: `rotate(${rotation}deg)` }}
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};

const ImageUpload: React.FC<{ 
  onUpload: (base64: string) => void; 
  className?: string;
  label?: string;
}> = ({ onUpload, className, label }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        onUpload(base64);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          try {
            const base64 = await fileToBase64(blob);
            onUpload(base64);
          } catch (err) {
            console.error("Paste failed", err);
          }
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        onUpload(base64);
      } catch (err) {
        console.error("Drop failed", err);
      }
    }
  };

  return (
    <div 
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed transition-colors flex flex-col items-center justify-center p-4 cursor-pointer group ${isDragging ? 'border-blue-500 bg-blue-50/10' : 'border-white/20 hover:border-white/40'} ${className}`}
    >
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <Plus size={24} className="mb-2 opacity-40 group-hover:opacity-100 transition-opacity text-white" />
      <span className="text-[9px] font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity text-center text-white">
        {label || "Foto hochladen / Einfügen / Drag & Drop"}
      </span>
    </div>
  );
};

const PlayerImageWithLightbox: React.FC<{
  image: string;
  isEditing: boolean;
  lastName: string;
  onUpdate: (base64: string) => void;
  onDelete: () => void;
  className?: string; // Added className here
}> = ({ image, isEditing, lastName, onUpdate, onDelete, className }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  return (
    <>
      <div className={`relative group ${className || 'w-full h-full'}`}>
        <img 
          src={image} 
          alt={lastName} 
          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
          referrerPolicy="no-referrer"
          onClick={() => setShowLightbox(true)}
        />
        <div 
          onClick={() => setShowLightbox(true)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none cursor-pointer"
        >
          <Maximize2 size={24} className="text-white" />
        </div>
        {isEditing && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-1 right-1 bg-red-600/80 text-white p-1 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {showLightbox && (
        <ImageLightbox 
          image={image} 
          onClose={() => setShowLightbox(false)} 
          onUpdate={onUpdate}
          isEditing={isEditing}
        />
      )}
    </>
  );
};

const PersonnelView: React.FC<PersonnelViewProps> = ({ players, onEditPlayer, onDeletePlayer, onUpdatePlayer, onAddPlayer, isEditing, sessionLogs = [] }) => {
  const sortedPersonnel = sortPlayers(players);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Update selectedId if it's null and we have players
  useEffect(() => {
    if (!selectedId && sortedPersonnel.length > 0) {
      setSelectedId(sortedPersonnel[0].id);
    }
  }, [sortedPersonnel, selectedId]);

  const selectedPerson = sortedPersonnel.find(p => p.id === selectedId) || sortedPersonnel[0];

  const activePersonLogs = selectedPerson ? sessionLogs.filter(log => log.playerId === selectedPerson.id) : [];
  const workloadStats = activePersonLogs.length > 0 ? activePersonLogs.reduce((acc, log) => {
    acc.rpeSum += log.rpe;
    acc.loadSum += log.calculatedLoad;
    acc.durationSum += log.duration;
    acc.count += 1;
    return acc;
  }, { rpeSum: 0, loadSum: 0, durationSum: 0, count: 0 }) : null;

  const normalizeCategory = (cat?: string) => {
    if (!cat) return 'player';
    const c = cat.toLowerCase();
    if (c === 'spieler') return 'player';
    if (c === 'trainer') return 'coach';
    if (c === 'funktionär') return 'staff';
    if (c === 'medizinisch' || c === 'arzt' || c === 'ärztlich' || c === 'physio') return 'medical';
    return c;
  };

  const getCategoryColor = (category?: string) => {
    const cat = normalizeCategory(category);
    switch (cat) {
      case 'coach': return 'bg-blue-600';
      case 'staff': return 'bg-amber-600';
      case 'medical': return 'bg-emerald-600';
      default: return 'bg-[#C00000]';
    }
  };

  const getCategoryBorderColor = (category?: string) => {
    const cat = normalizeCategory(category);
    switch (cat) {
      case 'coach': return 'border-blue-600';
      case 'staff': return 'border-amber-600';
      case 'medical': return 'border-emerald-600';
      default: return 'border-[#C00000]';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = normalizeCategory(category);
    switch (cat) {
      case 'coach':
        return <Briefcase size={14} className="text-blue-500" />;
      case 'staff':
        return <Shield size={14} className="text-amber-500" />;
      case 'medical':
        return <Activity size={14} className="text-emerald-500" />;
      default: return <User size={14} className="text-red-600" />;
    }
  };

  const getCategoryLabel = (category?: string) => {
    const cat = normalizeCategory(category);
    switch (cat) {
      case 'coach':
        return 'TRAINERTEAM';
      case 'staff':
        return 'TEAMMANAGEMENT / FUNKTIONÄR';
      case 'medical':
        return 'MEDIZINISCHE ABTEILUNG (PHYSIO / ARZT)';
      default: return 'SPIELERKADER';
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* Left Column: List */}
      <div className="w-1/3 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden watermark-bg">
        <div className="bg-black text-white p-3 shrink-0 flex justify-between items-center">
          <h3 className="font-black uppercase tracking-widest text-xs">Kader & Personal</h3>
          <button 
            onClick={onAddPlayer}
            className="bg-[#C00000] text-white p-1 border border-white hover:bg-red-700 transition-colors"
            title="Person hinzufügen"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {sortedPersonnel.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <User size={48} className="text-gray-200 mb-4" />
              <p className="font-black uppercase opacity-20 italic mb-2">Kein Personal gefunden</p>
              <p className="text-[10px] font-bold uppercase opacity-40">Nutze "Person hinzufügen" oder "Cloud Sync" zum Laden.</p>
            </div>
          ) : (
            sortedPersonnel.map((person, index) => {
            const currentCat = normalizeCategory(person.category);
            const prevCat = index > 0 ? normalizeCategory(sortedPersonnel[index - 1].category) : null;
            const isFirstOfCategory = index === 0 || currentCat !== prevCat;
            
            return (
              <React.Fragment key={person.id}>
                {isFirstOfCategory && (
                  <div className={`text-white px-3 py-2 flex items-center justify-between border-y-2 border-black ${getCategoryColor(person.category)}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      {getCategoryLabel(person.category)}
                    </span>
                    <div className="w-2 h-2 bg-white rotate-45" />
                  </div>
                )}
                <div
                  onClick={() => setSelectedId(person.id)}
                  className={`w-full flex items-center justify-between p-3 border-b border-black last:border-b-0 transition-all group cursor-pointer relative overflow-hidden
                    ${selectedId === person.id ? 'bg-black text-white' : 'hover:bg-gray-50'}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(person.id);
                    }
                  }}
                >
                  {/* Category Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getCategoryColor(person.category)}`} />
                  
                  <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center text-xs font-black border border-black shrink-0 transition-transform group-hover:scale-110
                        ${selectedId === person.id ? 'bg-white text-black border-white rotate-3' : `bg-white ${getCategoryBorderColor(person.category)} border-2`}`}>
                        {(normalizeCategory(person.category) === 'player') ? `#${person.number}` : getCategoryIcon(person.category || 'player')}
                      </span>
                      <div className="text-left">
                        <p className="font-black uppercase text-[11px] leading-tight flex items-center gap-1.5">
                          {person.lastName} {person.firstName}
                          {person.professionalStatus && (
                            <span className={`text-[7px] px-1 py-0.5 rounded leading-none shrink-0 font-bold ${selectedId === person.id ? 'bg-white text-black' : 'bg-black text-white'}`}>
                              {person.professionalStatus}
                            </span>
                          )}
                        </p>
                        <p className={`text-[9px] font-black uppercase mt-0.5 flex items-center gap-1.5 ${selectedId === person.id ? 'text-white/80' : 'text-gray-500'}`}>
                          {person.position}
                          {person.education && (
                            <span className={`text-[7px] italic font-medium leading-none truncate max-w-[100px] ${selectedId === person.id ? 'text-white/60' : 'text-gray-400'}`}>
                              ({person.education})
                            </span>
                          )}
                        </p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing && (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPlayer(person);
                          }}
                          className={`p-1 transition-colors ${selectedId === person.id ? 'text-white/60 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`}
                          title="Bearbeiten"
                        >
                          <Pencil size={12} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePlayer(person.id);
                          }}
                          className={`p-1 transition-colors ${selectedId === person.id ? 'text-white/60 hover:text-white' : 'text-red-600 hover:text-red-800'}`}
                          title="Löschen"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    <ChevronRight size={16} className={`${selectedId === person.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        </div>
      </div>
      
      {/* Right Column: Card */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {selectedPerson ? (
            <motion.div
              key={selectedPerson.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden watermark-bg"
            >
              {/* Card Header */}
              <div className="bg-black text-white p-6 flex justify-between items-start">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-800 border-4 border-white flex items-center justify-center relative overflow-hidden group">
                    {selectedPerson.image ? (
                      <PlayerImageWithLightbox 
                        image={selectedPerson.image} 
                        isEditing={isEditing}
                        lastName={selectedPerson.lastName}
                        onUpdate={(base64) => onUpdatePlayer(selectedPerson.id, 'image', base64)}
                        onDelete={() => onUpdatePlayer(selectedPerson.id, 'image', '')}
                      />
                    ) : (
                      <>
                        <User size={48} className="text-white/20" />
                        {isEditing && (
                          <ImageUpload 
                            onUpload={(base64) => onUpdatePlayer(selectedPerson.id, 'image', base64)}
                            className="absolute inset-0 border-none"
                            label="FOTO"
                          />
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`${getCategoryColor(selectedPerson.category)} text-white px-3 py-1 text-[10px] font-black border border-white tracking-widest flex items-center gap-2`}>
                        <span className="opacity-70">{getCategoryLabel(selectedPerson.category)}</span>
                         {normalizeCategory(selectedPerson.category) === 'player' && (
                           <span className="pl-2 border-l border-white/30 tracking-normal">#{selectedPerson.number}</span>
                         )}
                      </span>
                      <span className="text-white/40 font-black uppercase text-[10px] tracking-widest">{selectedPerson.status}</span>
                    </div>
                    <h2 className="text-4xl font-black uppercase leading-none mb-1">{selectedPerson.lastName}</h2>
                    <p className="text-white/60 font-black uppercase tracking-[0.2em] text-xs">{selectedPerson.firstName}</p>
                    <p className={`font-black uppercase tracking-widest text-sm mt-2 ${selectedPerson.category === 'player' ? 'text-[#C00000]' : 'text-white'}`}>{selectedPerson.position}</p>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEditPlayer(selectedPerson)}
                      className="p-2 bg-white text-black hover:bg-[#C00000] hover:text-white transition-all border-2 border-white"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        onDeletePlayer(selectedPerson.id);
                      }}
                      className="p-2 bg-white text-[#C00000] hover:bg-[#C00000] hover:text-white transition-all border-2 border-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Details */}
                <div className={`space-y-6 ${selectedPerson.category !== 'player' ? 'md:col-span-2' : ''}`}>
                  <section>
                    <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#C00000]" /> Basisdaten
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40">Geburtsdatum</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.geburtsdatum || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40">Wochentag</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.wochentag || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase opacity-40">Adresse</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.adresse || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40">Telefon</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.telefon || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40">Email</p>
                        <p className="font-black uppercase text-sm lowercase">{selectedPerson.email || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase opacity-40">Beruflicher Status / Ausbildung / Arbeitgeber</p>
                        <p className="font-black uppercase text-sm">
                          {selectedPerson.professionalStatus || '-'} 
                          {selectedPerson.education ? ` / ${selectedPerson.education}` : ''}
                          {selectedPerson.employer ? ` / ${selectedPerson.employer}` : ''}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] font-black uppercase opacity-40">Verletzungshistorie</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.injuryHistory || '-'}</p>
                      </div>
                      {selectedPerson.category === 'player' && (
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-40">Gesamteinsatzzeit (Pflichtspiele)</p>
                          <p className="font-black uppercase text-sm text-[#C00000]">{selectedPerson.einsatzzeitenGesamt || 0} MIN</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {selectedPerson.category === 'player' && (
                    <>
                      <section>
                        <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#C00000]" /> Ausrüstung
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Oberteil / Schuhe</p>
                            <p className="font-black uppercase text-sm">{selectedPerson.oberteil || '-'} / {selectedPerson.schuhe || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Hosen (K/L)</p>
                            <p className="font-black uppercase text-sm">{selectedPerson.kurze_hose || '-'} / {selectedPerson.lange_hose || '-'}</p>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-[#C00000]" /> Physis
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Größe / Gewicht</p>
                            <p className="font-black uppercase text-sm">{selectedPerson.physical?.height}cm / {selectedPerson.physical?.weight}kg</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Starker Fuß</p>
                            <p className="font-black uppercase text-sm">{selectedPerson.physical?.strongFoot || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Sprintwert</p>
                            <p className="font-black uppercase text-sm">{selectedPerson.diagnostics?.sprintwert || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Yoyo-Test</p>
                            <p className="font-black uppercase text-sm">{selectedPerson.diagnostics?.yoyotest || '-'}</p>
                          </div>
                        </div>
                      </section>
                    </>
                  )}

                  {selectedPerson.category === 'player' && (
                    <section>
                      <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#C00000]" /> Notizen
                      </h4>
                      <p className="text-xs font-bold leading-relaxed opacity-60 italic">
                        {selectedPerson.notizen || 'Keine Notizen hinterlegt.'}
                      </p>
                    </section>
                  )}

                  {selectedPerson.category === 'player' && (
                    <section className="bg-gray-50 p-4 border-2 border-black col-span-1 md:col-span-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#0D4433]" /> Leistungs- & Belastungsmonitoring (Post-Session)
                      </h4>
                      {workloadStats ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="bg-white p-2.5 border-2 border-black">
                              <p className="text-[8px] font-black uppercase text-gray-500">Einheiten</p>
                              <p className="text-lg font-black text-gray-900">{workloadStats.count}</p>
                            </div>
                            <div className="bg-white p-2.5 border-2 border-black">
                              <p className="text-[8px] font-black uppercase text-gray-500">Ø RPE (Gefühl)</p>
                              <p className="text-lg font-black text-amber-600">{(workloadStats.rpeSum / workloadStats.count).toFixed(1)}/10</p>
                            </div>
                            <div className="bg-white p-2.5 border-2 border-black">
                              <p className="text-[8px] font-black uppercase text-gray-500">Ø Load Units</p>
                              <p className="text-lg font-black text-emerald-700">{Math.round(workloadStats.loadSum / workloadStats.count)}</p>
                            </div>
                            <div className="bg-white p-2.5 border-2 border-black">
                              <p className="text-[8px] font-black uppercase text-gray-500">Gesamt-Minuten</p>
                              <p className="text-lg font-black text-gray-900">{workloadStats.durationSum}m</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Letzte eingetragene Einheiten:</p>
                            <div className="space-y-2">
                              {activePersonLogs.slice(0, 3).map((log: any) => (
                                <div key={log.id} className="bg-white p-2 border border-black/10 flex justify-between items-center text-[10px]">
                                  <div>
                                    <span className={`text-[8px] font-black px-1 mr-1.5 uppercase ${log.type === 'Match' ? 'bg-[#C00000] text-white' : 'bg-[#0D4433] text-white'}`}>
                                      {log.type}
                                    </span>
                                    <span className="font-bold text-gray-900 uppercase">{log.focus}</span>
                                  </div>
                                  <div className="font-mono font-bold text-gray-500">
                                    {log.date} • {log.duration} Min • RPE {log.rpe} (Load: {log.calculatedLoad})
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-bold leading-relaxed opacity-60 italic">
                          Noch keine Post-Session Logs für diesen Spieler eingetragen. Spieler können diese Daten im Reiter "Spieler-Bereich 📝" einpflegen.
                        </p>
                      )}
                    </section>
                  )}

                  {/* Additional Images Section */}
                  <section className="col-span-1 md:col-span-2">
                    <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#C00000]" /> Weitere Impressionen
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(selectedPerson.additionalImages || []).map((img, idx) => (
                        <div key={idx} className="aspect-square border-2 border-black overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02]">
                          <PlayerImageWithLightbox 
                            image={img}
                            isEditing={isEditing}
                            lastName={selectedPerson.lastName}
                            onUpdate={(base64) => {
                              const newImgs = [...(selectedPerson.additionalImages || [])];
                              newImgs[idx] = base64;
                              onUpdatePlayer(selectedPerson.id, 'additionalImages', newImgs);
                            }}
                            onDelete={() => {
                              const newImgs = (selectedPerson.additionalImages || []).filter((_, i) => i !== idx);
                              onUpdatePlayer(selectedPerson.id, 'additionalImages', newImgs);
                            }}
                            className="w-full h-full"
                          />
                        </div>
                      ))}
                      {isEditing && (
                        <ImageUpload 
                          onUpload={(base64) => {
                            const newImgs = [...(selectedPerson.additionalImages || []), base64];
                            onUpdatePlayer(selectedPerson.id, 'additionalImages', newImgs);
                          }}
                          className="aspect-square border-2 border-black bg-gray-50/50"
                          label="BILD HINZUFÜGEN"
                        />
                      )}
                    </div>
                  </section>
                </div>

                {/* Right Column: Analysis/Finance */}
                <div className={`space-y-6 ${selectedPerson.category !== 'player' ? 'md:col-span-2' : ''}`}>
                  {selectedPerson.category === 'player' && (
                    <section>
                      <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#C00000]" /> Analyse
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-40">Stärken</p>
                          <p className="text-xs font-bold">{selectedPerson.analysis?.strengths || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-40">Schwächen</p>
                          <p className="text-xs font-bold">{selectedPerson.analysis?.weaknesses || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase opacity-40">Entwicklungspotenzial</p>
                          <p className="text-xs font-bold">{selectedPerson.analysis?.development || '-'}</p>
                        </div>
                      </div>
                    </section>
                  )}

                  <section>
                    <h4 className="font-black uppercase text-xs border-b-2 border-black pb-1 mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#C00000]" /> Finanzen
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40">Grundgehalt</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.finance?.baseSalary} €</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40">Prämie/Spiel</p>
                        <p className="font-black uppercase text-sm">{selectedPerson.finance?.bonusPerMatch} €</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase opacity-40 text-blue-600">Monate Aktiv</p>
                        <p className="font-black uppercase text-sm text-blue-600">{selectedPerson.finance?.months || 12}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-40">Nebenvereinbarungen</p>
                      <p className="text-xs font-bold opacity-60">{selectedPerson.finance?.sideAgreements || 'Keine'}</p>
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 border-4 border-dashed border-gray-300">
              <User size={48} />
              <p className="font-black uppercase tracking-widest text-sm">Bitte wählen Sie eine Person aus</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PersonnelView;
