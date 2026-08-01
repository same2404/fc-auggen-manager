import React, { useState, useMemo, useRef } from 'react';
import { Match, MatchAnalysis, Opponent, Spieler } from '../../types';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clipboard, 
  Image as ImageIcon, 
  Zap, 
  ArrowRightLeft, 
  Target, 
  BookOpen, 
  PieChart, 
  CheckCircle2, 
  XCircle, 
  Star,
  Save,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Presentation,
  Upload,
  Maximize2,
  X,
  RotateCw,
  ExternalLink,
  Activity,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { VideoSection } from '../VideoSection';

interface MatchReportViewProps {
  matches: Match[];
  testMatches: Match[];
  analyses: MatchAnalysis[];
  onSaveAnalysis: (analysis: MatchAnalysis) => Promise<void>;
  onDeleteAnalysis: (id: string) => Promise<void>;
  opponents?: { id: string | number; name: string }[];
  players?: Spieler[];
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
        const maxDim = 800;
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
}> = ({ image, onClose, onUpdate }) => {
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
        {onUpdate && (
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
  onDelete?: () => void;
  currentImage?: string;
  className?: string;
  label?: string;
}> = ({ onUpload, onDelete, currentImage, className, label }) => {
  const [showLightbox, setShowLightbox] = useState(false);

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

  if (currentImage) {
    return (
      <>
        <div className={`relative group border-2 border-black/10 overflow-hidden ${className}`}>
          <img 
            src={currentImage} 
            alt="Upload" 
            className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105" 
            referrerPolicy="no-referrer"
            onClick={() => setShowLightbox(true)}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <Maximize2 size={24} className="text-white" />
          </div>
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="absolute top-2 right-2 bg-red-600 text-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        {showLightbox && (
          <ImageLightbox 
            image={currentImage} 
            onClose={() => setShowLightbox(false)} 
            onUpdate={onUpload}
          />
        )}
      </>
    );
  }

  return (
    <div 
      onPaste={handlePaste}
      className={`relative border-2 border-dashed border-black/20 hover:border-black/40 transition-colors flex flex-col items-center justify-center p-4 cursor-pointer group ${className}`}
    >
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <Upload size={16} className="mb-2 opacity-40 group-hover:opacity-100 transition-opacity" />
      <span className="text-[9px] font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity text-center">
        {label || "Bild hochladen oder einfügen"}
      </span>
    </div>
  );
};

// Local state component to prevent hanging
const EditableArea = ({ value, onSave, placeholder, className, isTextArea = true, type = "text", listId }: { 
  value: string, 
  onSave: (val: string) => void, 
  placeholder?: string, 
  className?: string,
  isTextArea?: boolean,
  type?: string,
  listId?: string
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  if (isTextArea) {
    return (
      <textarea 
        className={className}
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => {
          if (localValue !== value) onSave(localValue);
        }}
      />
    );
  }

  return (
    <input 
      type={type}
      list={listId}
      className={className}
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={() => {
        if (localValue !== value) onSave(localValue);
      }}
    />
  );
};

const ImageGallery = ({ images = [], onUpdate, label }: { 
  images: string[], 
  onUpdate: (newImages: string[]) => void,
  label?: string
}) => {
  return (
    <div className="space-y-3 mt-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img, idx) => (
          <ImageUpload 
            key={idx}
            onUpload={(base64) => {
              const newImages = [...images];
              newImages[idx] = base64;
              onUpdate(newImages);
            }}
            onDelete={() => {
              const newImages = images.filter((_, i) => i !== idx);
              onUpdate(newImages);
            }}
            currentImage={img}
            className="aspect-video"
          />
        ))}
        <ImageUpload 
          onUpload={(base64) => {
            onUpdate([...images, base64]);
          }}
          className="aspect-video"
          label={label || "BILD HINZUFÜGEN"}
        />
      </div>
    </div>
  );
};

export const MatchReportView: React.FC<MatchReportViewProps> = ({
  matches,
  testMatches,
  analyses,
  onSaveAnalysis,
  onDeleteAnalysis,
  opponents = [],
  players = []
}) => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(analyses[0]?.id || '');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnalyses = useMemo(() => {
    const sorted = [...analyses].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    if (!searchTerm) return sorted;
    return sorted.filter(a => 
      (a.opponent?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.date?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [analyses, searchTerm]);

  const currentAnalysis = useMemo(() => {
    return analyses.find(a => a.id === selectedAnalysisId) || null;
  }, [analyses, selectedAnalysisId]);

  const handleUpdate = (field: keyof MatchAnalysis, value: any) => {
    if (!currentAnalysis) return;
    onSaveAnalysis({ ...currentAnalysis, [field]: value });
  };

  const handleCreateNew = () => {
    const newId = `analysis_${Date.now()}`;
    const newAnalysis: MatchAnalysis = {
      id: newId,
      matchId: '',
      opponent: 'NEUER GEGNER',
      date: new Date().toISOString().split('T')[0],
      category: 'Pflichtspiel',
      isHome: true,
      result: '',
      lineupImage: '',
      openingPlay: '',
      transitionOffensive: '',
      transitionDefensive: '',
      goalChancesOwn: '',
      goalChancesOpponent: '',
      goalsOwn: '',
      goalsOpponent: '',
      goodActions: '',
      badActions: '',
      specialMoments: '',
      standardsOwn: '',
      standardsOpponent: '',
      trainerGood: '',
      trainerBad: '',
      trainerTactical: '',
      trainerFazit: '',
      playerOfTheMatch: '',
      matchRating: '',
      presentations: '',
      presentationImages: []
    };
    onSaveAnalysis(newAnalysis);
    setSelectedAnalysisId(newId);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-full bg-white overflow-hidden relative">
      {/* Sidebar - List of reports */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r-4 border-black flex flex-col shrink-0 bg-gray-50 absolute md:relative inset-y-0 left-0 z-40 h-full w-full md:w-auto"
          >
            <div className="p-4 bg-black text-white shrink-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest">ALLE ANALYSEN</h3>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden text-white/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative mb-3">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 opacity-40" />
                <input 
                  type="text" 
                  placeholder="SUCHEN..."
                  className="w-full bg-white/10 border border-white/20 text-[10px] font-black uppercase p-2 pl-7 focus:outline-none focus:bg-white/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={handleCreateNew}
                className="w-full bg-green-500 text-black py-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
              >
                <Plus size={14} /> NEUER BERICHT
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredAnalyses.length === 0 ? (
                <div className="p-8 text-center opacity-30 italic text-[10px]">KEINE BERICHTE</div>
              ) : (
                filteredAnalyses.map(a => (
                  <button 
                    key={a.id}
                    onClick={() => {
                      setSelectedAnalysisId(a.id);
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={`w-full text-left p-3 border-b-2 border-black/5 hover:bg-black/5 transition-all relative ${selectedAnalysisId === a.id ? 'bg-amber-50 border-l-4 border-l-black' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[8px] font-black opacity-40 uppercase truncate mr-2">
                        {a.date || 'KEIN DATUM'}
                      </span>
                      <span className={`text-[7px] font-black uppercase px-1 py-0.5 border border-black ${a.category === 'Pflichtspiel' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                        {a.category === 'Pflichtspiel' ? 'PS' : a.category === 'Testspiel' ? 'TS' : 'PK'}
                      </span>
                    </div>
                    <div className="text-[10px] font-black uppercase truncate leading-none">
                      {a.opponent || 'UNBEKANNT'}
                    </div>
                    {a.result && (
                      <div className="text-[9px] font-black text-green-600 mt-1">
                        RESULTAT: {a.result}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-50 bg-black text-white p-1 hover:bg-[#C00000] transition-colors"
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {currentAnalysis ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 bg-white">
            <div className="max-w-6xl mx-auto space-y-10 pb-16">
              
              {/* Header Section (Editable) */}
              <div className="border-4 border-black p-6 sm:p-8 relative watermark-bg overflow-hidden bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <div className="absolute top-0 right-0 p-3">
                  <button 
                    onClick={() => {
                      if (window.confirm('Sollen dieser Bericht wirklich gelöscht werden?')) {
                        onDeleteAnalysis(currentAnalysis.id);
                        setSelectedAnalysisId(analyses.find(a => a.id !== currentAnalysis.id)?.id || '');
                      }
                    }}
                    className="text-red-600 hover:text-red-800 p-2.5 bg-white/80 border-2 border-black font-bold shadow-sm"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse" />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">SPIEL – FC AUGGEN vs.</span>
                      <EditableArea 
                        isTextArea={false}
                        listId="opponent-list-report"
                        value={currentAnalysis.opponent || ''}
                        onSave={(val) => handleUpdate('opponent', val)}
                        placeholder="GEGNERNAME..."
                        className="flex-1 bg-transparent border-b-4 border-black text-2xl sm:text-4xl font-black uppercase italic focus:outline-none focus:border-green-500 min-w-0"
                      />
                      <datalist id="opponent-list-report">
                        {opponents.map((opp) => (
                          <option key={opp.id} value={opp.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase opacity-60 flex items-center gap-1.5">
                        <Calendar size={14} /> Datum
                      </span>
                      <EditableArea 
                        isTextArea={false}
                        type="date"
                        value={currentAnalysis.date || ''}
                        onSave={(val) => handleUpdate('date', val)}
                        className="text-sm sm:text-base font-bold uppercase border-2 border-black p-2.5 focus:outline-none focus:border-green-500 bg-gray-50/50"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase opacity-60 flex items-center gap-1.5">
                        <Trophy size={14} /> Wettbewerb
                      </span>
                      <select 
                        value={currentAnalysis.category || 'Pflichtspiel'}
                        onChange={(e) => handleUpdate('category', e.target.value)}
                        className="text-sm sm:text-base font-bold uppercase border-2 border-black p-2.5 focus:outline-none focus:border-green-500 bg-gray-50/50"
                      >
                        <option value="Pflichtspiel">Pflichtspiel</option>
                        <option value="Testspiel">Testspiel</option>
                        <option value="Pokalspiel">Pokalspiel</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase opacity-60 flex items-center gap-1.5">
                        <MapPin size={14} /> Heim / Auswärts
                      </span>
                      <div className="flex border-2 border-black">
                        <button 
                          onClick={() => handleUpdate('isHome', true)}
                          className={`flex-1 p-2.5 text-xs sm:text-sm font-black uppercase ${currentAnalysis.isHome ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                          Heim
                        </button>
                        <button 
                          onClick={() => handleUpdate('isHome', false)}
                          className={`flex-1 p-2.5 text-xs sm:text-sm font-black uppercase ${!currentAnalysis.isHome ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                          Auswärts
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black uppercase opacity-60 flex items-center gap-1.5">
                        <Star size={14} /> Ergebnis
                      </span>
                      <EditableArea 
                        isTextArea={false}
                        value={currentAnalysis.result || ''}
                        onSave={(val) => handleUpdate('result', val)}
                        placeholder="Z.B. 3:1"
                        className="text-sm sm:text-base font-black uppercase border-2 border-black p-2.5 focus:outline-none focus:border-green-500 text-green-700 bg-gray-50/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lineup Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                  <ImageIcon size={22} className="text-green-600" />
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">AUFSTELLUNG (BILDER)</h3>
                </div>
                <ImageGallery 
                  images={currentAnalysis.lineupImages || (currentAnalysis.lineupImage ? [currentAnalysis.lineupImage] : [])}
                  onUpdate={(newImages) => handleUpdate('lineupImages', newImages)}
                  label="AUFSTELLUNGSBILD HINZUFÜGEN"
                />
              </section>

              {/* Presentations Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                  <Presentation size={22} className="text-indigo-600" />
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">SPIEL-PRÄSENTATIONEN (LINKS)</h3>
                </div>
                <p className="text-xs font-bold opacity-60 uppercase tracking-wider leading-relaxed italic">
                  HIER KÖNNEN LINKS ZU EXTERNEN PRÄSENTATIONEN ODER WEITERE DOKUMENTE HINTERLEGT WERDEN.
                </p>
                <EditableArea 
                  className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold uppercase min-h-[100px] leading-relaxed focus:outline-none focus:border-green-500 bg-gray-50/50"
                  placeholder="PRÄSENTATIONSLINKS ODER NOTIZEN..."
                  value={currentAnalysis.presentations || ''}
                  onSave={(val) => handleUpdate('presentations', val)}
                />
              </section>

              {/* Opening Play */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                  <Zap size={22} className="text-amber-500" />
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">SPIELERÖFFNUNG</h3>
                </div>
                <p className="text-xs font-bold opacity-60 uppercase tracking-wider leading-relaxed italic">
                  ANALYSE DER ERSTEN SPIELPHASE, AUFBAU UND TAKTISCHE GRUNDORDNUNG BEI BALLBESITZ.
                </p>
                <EditableArea 
                  className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold leading-relaxed uppercase min-h-[180px] focus:outline-none focus:border-green-500 bg-gray-50/50"
                  placeholder="DETAILS ZUR SPIELERÖFFNUNG..."
                  value={currentAnalysis.openingPlay || ''}
                  onSave={(val) => handleUpdate('openingPlay', val)}
                />
                <ImageGallery 
                  images={currentAnalysis.openingPlayImages || []}
                  onUpdate={(imgs) => handleUpdate('openingPlayImages', imgs)}
                />
              </section>

              {/* Transition Play */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                  <ArrowRightLeft size={22} className="text-blue-500" />
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">UMSCHALTSPIEL</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="w-2.5 h-2.5 bg-green-500 rotate-45" />
                       <span className="text-xs sm:text-sm font-black uppercase tracking-wider">UMSCHALTEN OFFENSIV:</span>
                    </div>
                    <EditableArea 
                      className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold leading-relaxed uppercase min-h-[150px] focus:outline-none focus:border-green-500 bg-gray-50/50"
                      placeholder="KONTERVERHALTEN..."
                      value={currentAnalysis.transitionOffensive || ''}
                      onSave={(val) => handleUpdate('transitionOffensive', val)}
                    />
                    <ImageGallery 
                      images={currentAnalysis.transitionOffensiveImages || []}
                      onUpdate={(imgs) => handleUpdate('transitionOffensiveImages', imgs)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <span className="w-2.5 h-2.5 bg-red-500 rotate-45" />
                       <span className="text-xs sm:text-sm font-black uppercase tracking-wider">UMSCHALTEN DEFENSIV:</span>
                    </div>
                    <EditableArea 
                      className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold leading-relaxed uppercase min-h-[150px] focus:outline-none focus:border-green-500 bg-gray-50/50"
                      placeholder="GEGENPRESSING..."
                      value={currentAnalysis.transitionDefensive || ''}
                      onSave={(val) => handleUpdate('transitionDefensive', val)}
                    />
                    <ImageGallery 
                      images={currentAnalysis.transitionDefensiveImages || []}
                      onUpdate={(imgs) => handleUpdate('transitionDefensiveImages', imgs)}
                    />
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Goal Chances */}
                <section className="space-y-5">
                  <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                    <Target size={22} className="text-red-500" />
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">TORCHANCEN</h3>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <span className="text-xs font-black uppercase opacity-70 text-green-600 tracking-wider">UNSERE CHANCEN:</span>
                      <EditableArea 
                        className="w-full border-2 border-black p-4 text-sm font-semibold leading-relaxed uppercase min-h-[140px] focus:outline-none focus:border-green-500"
                        placeholder="MINUTE, AKTION, SPIELER..."
                        value={currentAnalysis.goalChancesOwn || ''}
                        onSave={(val) => handleUpdate('goalChancesOwn', val)}
                      />
                      <ImageGallery 
                        images={currentAnalysis.goalChancesOwnImages || []}
                        onUpdate={(imgs) => handleUpdate('goalChancesOwnImages', imgs)}
                      />
                    </div>
                    <div className="space-y-3">
                      <span className="text-xs font-black uppercase opacity-70 text-red-600 tracking-wider">GEGNER CHANCEN:</span>
                      <EditableArea 
                        className="w-full border-2 border-black p-4 text-sm font-semibold leading-relaxed uppercase min-h-[140px] focus:outline-none focus:border-green-500"
                        placeholder="GEFÄHRLICHE AKTIONEN..."
                        value={currentAnalysis.goalChancesOpponent || ''}
                        onSave={(val) => handleUpdate('goalChancesOpponent', val)}
                      />
                      <ImageGallery 
                        images={currentAnalysis.goalChancesOpponentImages || []}
                        onUpdate={(imgs) => handleUpdate('goalChancesOpponentImages', imgs)}
                      />
                    </div>
                  </div>
                </section>

                {/* Match Progression */}
                <section className="space-y-5">
                  <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                    <BookOpen size={22} className="text-purple-500" />
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">SPIELVERLAUF</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase opacity-60 tracking-wider">TORE FC AUGGEN:</span>
                        <EditableArea 
                          className="w-full border-2 border-black p-3 text-sm font-semibold uppercase min-h-[90px] leading-relaxed focus:outline-none"
                          placeholder="ZEIT | NAME..."
                          value={currentAnalysis.goalsOwn}
                          onSave={(val) => handleUpdate('goalsOwn', val)}
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase opacity-60 tracking-wider">GEGENTORE:</span>
                        <EditableArea 
                          className="w-full border-2 border-black p-3 text-sm font-semibold uppercase min-h-[90px] leading-relaxed focus:outline-none"
                          placeholder="ZEIT | NAME..."
                          value={currentAnalysis.goalsOpponent}
                          onSave={(val) => handleUpdate('goalsOpponent', val)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase opacity-70 text-green-600 tracking-wider">POSITIVE AKTIONEN:</span>
                        <EditableArea 
                          className="w-full border-2 border-black p-3 text-sm font-semibold uppercase min-h-[110px] leading-relaxed focus:outline-none"
                          placeholder="ZERRALTE AKTIONEN..."
                          value={currentAnalysis.goodActions}
                          onSave={(val) => handleUpdate('goodActions', val)}
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase opacity-70 text-red-600 tracking-wider">NEGATIVE AKTIONEN:</span>
                        <EditableArea 
                          className="w-full border-2 border-black p-3 text-sm font-semibold uppercase min-h-[110px] leading-relaxed focus:outline-none"
                          placeholder="FEHLER, LÜCKEN..."
                          value={currentAnalysis.badActions}
                          onSave={(val) => handleUpdate('badActions', val)}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Standards */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b-4 border-black pb-2">
                  <PieChart size={22} className="text-cyan-500" />
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">STANDARDSITUATIONEN</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 border-2 border-black bg-gray-50 flex flex-col gap-3">
                    <span className="text-xs sm:text-sm font-black uppercase text-green-600 tracking-wider">STANDARDS OFFENSIV (FÜR UNS):</span>
                    <EditableArea 
                      className="w-full border-2 border-black p-4 text-sm font-semibold uppercase min-h-[140px] leading-relaxed focus:outline-none focus:border-green-500 bg-white"
                      placeholder="ECKEN, FREISTÖSSE..."
                      value={currentAnalysis.standardsOwn || ''}
                      onSave={(val) => handleUpdate('standardsOwn', val)}
                    />
                    <ImageGallery 
                      images={currentAnalysis.standardsOwnImages || []}
                      onUpdate={(imgs) => handleUpdate('standardsOwnImages', imgs)}
                    />
                  </div>
                  <div className="p-5 border-2 border-black bg-gray-50 flex flex-col gap-3">
                    <span className="text-xs sm:text-sm font-black uppercase text-red-600 tracking-wider">STANDARDS DEFENSIV (GEGEN UNS):</span>
                    <EditableArea 
                      className="w-full border-2 border-black p-4 text-sm font-semibold uppercase min-h-[140px] leading-relaxed focus:outline-none focus:border-green-500 bg-white"
                      placeholder="VERTEIDIGUNG BEI ECKEN..."
                      value={currentAnalysis.standardsOpponent || ''}
                      onSave={(val) => handleUpdate('standardsOpponent', val)}
                    />
                    <ImageGallery 
                      images={currentAnalysis.standardsOpponentImages || []}
                      onUpdate={(imgs) => handleUpdate('standardsOpponentImages', imgs)}
                    />
                  </div>
                </div>
              </section>

              {/* Video-Analyse Hub (Spiel, Gegner & Spieler-Momente) */}
              <section className="space-y-4">
                <VideoSection 
                  title="VIDEO-ANALYSE & HIGHLIGHT-SZENEN"
                  subtitle="Spielanalysen, Gegner-Videos und individuelle Spieler-Momente"
                  clips={currentAnalysis.videoClips || []}
                  onUpdateClips={(clips) => handleUpdate('videoClips', clips)}
                  players={players}
                  defaultCategory="Spiel-Analyse"
                />
              </section>

              {/* Trainer Analysis Footer */}
              <section className="space-y-8 mt-12 bg-gray-100 p-8 sm:p-10 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <Clipboard size={28} className="text-[#C00000]" />
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">TRAINER-FAZIT & ENTSCHEIDUNGEN</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 size={18} />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">POSITIVE ANALYSE:</span>
                    </div>
                    <EditableArea 
                      className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold uppercase min-h-[160px] leading-relaxed focus:outline-none focus:border-green-500 bg-white"
                      placeholder="WAS HAT FUNKTIONIERT?..."
                      value={currentAnalysis.trainerGood || ''}
                      onSave={(val) => handleUpdate('trainerGood', val)}
                    />
                    <ImageGallery 
                      images={currentAnalysis.trainerGoodImages || []}
                      onUpdate={(imgs) => handleUpdate('trainerGoodImages', imgs)}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle size={18} />
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">KRITISCHE ANALYSE:</span>
                    </div>
                    <EditableArea 
                      className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold uppercase min-h-[160px] leading-relaxed focus:outline-none focus:border-green-500 bg-white"
                      placeholder="VERBESSERUNGSPOTENTIAL..."
                      value={currentAnalysis.trainerBad || ''}
                      onSave={(val) => handleUpdate('trainerBad', val)}
                    />
                    <ImageGallery 
                      images={currentAnalysis.trainerBadImages || []}
                      onUpdate={(imgs) => handleUpdate('trainerBadImages', imgs)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider opacity-60">ABSCHLIESSENDES TRAINER-FAZIT:</span>
                  <EditableArea 
                    className="w-full border-2 border-black p-4 text-sm sm:text-base font-semibold uppercase min-h-[140px] leading-relaxed focus:outline-none focus:border-green-500 bg-white"
                    placeholder="WICHTIGSTE ERKENNTNISSE AUS DEM SPIEL..."
                    value={currentAnalysis.trainerFazit || ''}
                    onSave={(val) => handleUpdate('trainerFazit', val)}
                  />
                  <ImageGallery 
                    images={currentAnalysis.trainerFazitImages || []}
                    onUpdate={(imgs) => handleUpdate('trainerFazitImages', imgs)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="bg-black p-5 flex items-center justify-between border-2 border-black">
                    <div className="flex items-center gap-4">
                      <Star size={20} className="text-yellow-400" />
                      <span className="text-white text-xs font-black uppercase tracking-widest">SPIELNOTE:</span>
                    </div>
                    <EditableArea 
                      isTextArea={false}
                      className="bg-white text-black border-2 border-white px-4 py-2 font-black uppercase text-lg focus:outline-none w-28 text-center"
                      placeholder="7 / 10"
                      value={currentAnalysis.matchRating || ''}
                      onSave={(val) => handleUpdate('matchRating', val)}
                    />
                  </div>

                  <div className="bg-[#C00000] p-5 flex items-center justify-between border-2 border-black">
                    <div className="flex items-center gap-4">
                      <Trophy size={20} className="text-white" />
                      <span className="text-white text-xs font-black uppercase tracking-widest">MAN OF THE MATCH:</span>
                    </div>
                    <EditableArea 
                      isTextArea={false}
                      className="bg-white text-black border-2 border-white px-4 py-2 font-black uppercase text-sm focus:outline-none flex-1 ml-4"
                      placeholder="SPIELERNAME..."
                      value={currentAnalysis.playerOfTheMatch || ''}
                      onSave={(val) => handleUpdate('playerOfTheMatch', val)}
                    />
                  </div>
                </div>

                {/* Tracker & Player Performance Section in Match Report */}
                <div className="border-4 border-black p-6 bg-slate-900 text-white space-y-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="border-b-2 border-white/20 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={20} className="text-amber-400" />
                      <h3 className="font-black text-sm uppercase tracking-wider text-amber-400">
                        📍 INTEGRRIERTE GPS TRACKER- & SPIELERANALYSEN DIESES SPIELS
                      </h3>
                    </div>
                    <span className="text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5">
                      ORDNER-SYNCHRONISIERT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(players || []).filter(p => p.trackerAnalysis || p.number === 11 || p.number === 23).map(player => {
                      const tr = player.trackerAnalysis || {
                        fileName: player.number === 11 ? 'WG__Tracker_Julian_Ehret_RNr_11' : player.number === 23 ? 'Tracker_Stefan_Lauer_RNr_23' : `Tracker_${player.lastName}`,
                        fileUrl: player.number === 11 ? 'https://magentacloud.de/s/H3zDkjkx8pigtpw' : player.number === 23 ? 'https://magentacloud.de/s/6KJqaSL847wGBrf' : '',
                        totalDistanceKm: player.number === 11 ? 11.4 : player.number === 23 ? 5.3 : 10.1,
                        sprintDistanceM: player.number === 11 ? 340 : player.number === 23 ? 65 : 220,
                        maxSpeedKmh: player.number === 11 ? 32.8 : player.number === 23 ? 26.4 : 31.0,
                        sprintCount: player.number === 11 ? 28 : player.number === 23 ? 8 : 18,
                        tacticalSummary: player.number === 11 ? 'Julian Ehret zeigte herausragende 11,4 km Laufleistung als ZM mit 28 Vollsprints.' : player.number === 23 ? 'Stefan Lauer mit sehr stabilen Torwart-Bewegungswerten (5,3 km) und reaktionsschnellem Rausrücken.' : 'Gutes Laufprofil.'
                      };

                      return (
                        <div key={player.id} className="bg-slate-800 border-2 border-black p-4 space-y-3 relative">
                          <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                            <div>
                              <h4 className="font-black text-sm uppercase text-white">
                                #{player.number} {player.lastName} ({player.position})
                              </h4>
                              <p className="text-[10px] font-mono text-blue-300">
                                Ordner-Datei: {tr.fileName}
                              </p>
                            </div>
                            {tr.fileUrl && (
                              <a 
                                href={tr.fileUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase px-2.5 py-1 border border-black flex items-center gap-1"
                              >
                                <ExternalLink size={12} /> MagentaCLOUD Ordner
                              </a>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                            <div className="bg-slate-900 p-1.5 border border-slate-700">
                              <span className="text-[9px] block text-gray-400 font-sans">DISTANZ</span>
                              <strong className="text-emerald-400">{tr.totalDistanceKm} km</strong>
                            </div>
                            <div className="bg-slate-900 p-1.5 border border-slate-700">
                              <span className="text-[9px] block text-gray-400 font-sans">SPRINTS</span>
                              <strong className="text-red-400">{tr.sprintCount} ({tr.maxSpeedKmh} km/h)</strong>
                            </div>
                            <div className="bg-slate-900 p-1.5 border border-slate-700">
                              <span className="text-[9px] block text-gray-400 font-sans">SPRINT METER</span>
                              <strong className="text-amber-400">{tr.sprintDistanceM} m</strong>
                            </div>
                          </div>

                          <p className="text-[11px] text-gray-300 leading-snug font-sans bg-slate-900/60 p-2 border border-slate-700/80">
                            {tr.tacticalSummary}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <Trophy size={64} className="opacity-10 mb-4" />
            <p className="font-black uppercase tracking-[0.4em] text-sm opacity-30">BERICHT AUSWÄHLEN ODER ERSTELLEN</p>
            <button 
              onClick={handleCreateNew}
              className="mt-6 bg-black text-white px-8 py-4 font-black uppercase tracking-widest hover:bg-[#C00000] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
            >
              NEUEN BERICHT ANLEGEN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
