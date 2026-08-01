import React, { useRef, useState } from 'react';
import { Share2, Save, Users, UserPlus, UserMinus, MessageSquare, Mail, Camera, Download, FileText, Copy, ChevronDown, Check, Upload, Edit, RefreshCw, Brain, Sparkles, Award, Maximize2, Compass, Layers } from 'lucide-react';

interface UniformMaskProps {
  title: string;
  children: React.ReactNode;
  onShareText?: () => void;
  onEmail?: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onManageSquad?: () => void;
  onAddPlayer?: () => void;
  onRemovePlayer?: () => void;
  onReset?: () => void;
  onDeduplicate?: () => void;
  onMigrate?: () => void;
  onOpenKaderAgent?: (preset?: 'beste_formation' | 'topform_startelf' | 'vollbild_ordnung' | 'laufwege_profi') => void;
  onOpen3DTacticBoard?: () => void;
  saveStatus?: 'idle' | 'saving' | 'success';
  isEditing?: boolean;
}

export const UniformMask: React.FC<UniformMaskProps> = ({ 
  title, 
  children, 
  onShareText, 
  onEmail, 
  onEdit, 
  onSave, 
  onManageSquad, 
  onAddPlayer, 
  onRemovePlayer, 
  onReset, 
  onDeduplicate, 
  onMigrate,
  onOpenKaderAgent,
  onOpen3DTacticBoard,
  saveStatus, 
  isEditing 
}) => {
  const maskRef = useRef<HTMLDivElement>(null);
  const [showKaderMenu, setShowKaderMenu] = useState(false);

  return (
    <div ref={maskRef} className="relative flex flex-col h-full bg-slate-950 text-slate-100 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:border-0 print:shadow-none print:h-auto print:overflow-visible">

      {/* Header */}
      <header className="bg-gradient-to-r from-red-900 via-slate-900 to-slate-950 text-white px-3 sm:px-4 py-2 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden shadow-lg z-20 min-h-[50px]">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center rounded-lg border border-amber-300 font-black text-slate-950 text-[11px] shadow-md shrink-0">
            FCA
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-xs font-black uppercase tracking-wider text-amber-400 leading-none whitespace-nowrap">FC Auggen</h1>
            <span className="text-slate-600 text-xs shrink-0">|</span>
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-200 leading-none whitespace-nowrap">{title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 justify-end overflow-x-auto no-scrollbar py-0.5 shrink-0 max-w-full">
          
          {/* 3D-Taktiktafel (Profi) Direct Global Header Button */}
          {onOpen3DTacticBoard && (
            <button
              onClick={onOpen3DTacticBoard}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border border-black px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              title="3D-Taktiktafel & Interaktive Laufwege im Profi-Modus öffnen"
            >
              <Layers size={14} className="text-slate-950 animate-pulse shrink-0" />
              <span className="text-[10px]">3D-Taktiktafel</span>
            </button>
          )}

          {/* KaderAgent Global Option (Always Visible across all tabs) */}
          {onOpenKaderAgent && (
            <div className="relative shrink-0">
              <div className="flex items-center bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-amber-400/80 rounded-xl shadow-md transition-all overflow-hidden">
                <button
                  onClick={() => onOpenKaderAgent('beste_formation')}
                  className="px-2.5 sm:px-3 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer hover:bg-white/10 whitespace-nowrap"
                  title="Beste Aufstellung & Formation anzeigen (KaderAgent Profi-Modus)"
                >
                  <Brain size={14} className="text-amber-300 animate-pulse shrink-0" />
                  <span className="text-[10px]">Beste Aufstellung & Formation</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowKaderMenu(!showKaderMenu);
                  }}
                  className="px-2 py-1.5 border-l border-red-500/50 hover:bg-white/20 cursor-pointer"
                  title="Weitere KaderAgent Optionen anzeigen"
                >
                  <ChevronDown size={12} className="text-amber-300" />
                </button>
              </div>

              {showKaderMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl z-[100] p-2 space-y-1 backdrop-blur-xl text-slate-100"
                  onClick={() => setShowKaderMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Brain size={14} className="text-amber-300" />
                    <span>KaderAgent Optionen (Profi-Modus)</span>
                  </div>

                  <button
                    onClick={() => onOpenKaderAgent('beste_formation')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-colors flex items-center gap-2 text-slate-200 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Beste Formation anzeigen</span>
                  </button>

                  <button
                    onClick={() => onOpenKaderAgent('topform_startelf')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-colors flex items-center gap-2 text-slate-200 cursor-pointer"
                  >
                    <Award size={14} className="text-emerald-400" />
                    <span>Startelf basierend auf Topform</span>
                  </button>

                  <button
                    onClick={() => onOpenKaderAgent('vollbild_ordnung')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-colors flex items-center gap-2 text-slate-200 cursor-pointer"
                  >
                    <Maximize2 size={14} className="text-amber-400" />
                    <span>Optimale Grundordnung im Vollbild</span>
                  </button>

                  <button
                    onClick={() => onOpenKaderAgent('laufwege_profi')}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-colors flex items-center gap-2 text-slate-200 cursor-pointer"
                  >
                    <Compass size={14} className="text-sky-400" />
                    <span>Positionsspezifische Laufwege</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {onManageSquad && (
            <button 
              onClick={onManageSquad}
              className="bg-slate-900/90 text-slate-200 hover:text-white hover:bg-slate-800 p-2 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5 rounded-xl text-xs font-bold shadow-sm"
              title="Kader verwalten"
            >
              <Users size={13} className="text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Kader</span>
            </button>
          )}
          {onAddPlayer && (
            <button 
              onClick={onAddPlayer}
              className="bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/80 transition-all flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold shadow-sm"
              title="Spieler hinzufügen"
            >
              <UserPlus size={13} className="text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Hinzufügen</span>
            </button>
          )}
          {onRemovePlayer && (
            <button 
              onClick={onRemovePlayer}
              className="bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-800/80 transition-all flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold shadow-sm"
              title="Spieler entfernen"
            >
              <UserMinus size={13} className="text-rose-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Entfernen</span>
            </button>
          )}
          {onSave && (
            <button 
              onClick={onSave}
              className={`p-2 border transition-all flex items-center gap-1.5 rounded-xl text-xs font-bold shadow-md ${
                saveStatus === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 
                saveStatus === 'saving' ? 'bg-amber-500 text-slate-950 border-amber-400' : 
                'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 font-black hover:brightness-110'
              }`}
              title="Speichern"
            >
              <Save size={13} />
              <span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">
                {saveStatus === 'success' ? 'Gespeichert' : saveStatus === 'saving' ? 'Speichert...' : 'Speichern'}
              </span>
            </button>
          )}

          {onEdit && (
            <button 
              onClick={onEdit}
              className={`p-2 border transition-all flex items-center gap-1.5 rounded-xl text-xs font-bold shadow-sm ${
                isEditing ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-900/90 text-sky-400 hover:bg-slate-800 border-slate-800'
              }`}
              title="Bearbeiten"
            >
              <Edit size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Bearbeiten</span>
            </button>
          )}
          <button 
            onClick={onEmail}
            className="bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 p-2 border border-slate-800 transition-all flex items-center gap-1.5 rounded-xl text-xs font-bold shadow-sm"
            title="Per E-Mail senden"
          >
            <Mail size={13} className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">E-Mail</span>
          </button>
          <button 
            onClick={onShareText}
            className="bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 p-2 border border-slate-800 transition-all flex items-center gap-1.5 rounded-xl text-xs font-bold shadow-sm"
            title="WhatsApp senden"
          >
            <MessageSquare size={13} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">WhatsApp</span>
          </button>
          {onReset && (
            <button 
              onClick={onReset}
              className="bg-slate-900/90 text-amber-400 hover:bg-slate-800 p-2 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center gap-1.5 rounded-xl text-xs font-bold shadow-sm"
              title="Auf Standard zurücksetzen"
            >
              <RefreshCw size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Reset</span>
            </button>
          )}
          {onMigrate && (
            <button 
              onClick={onMigrate}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-2 border border-amber-400 transition-all flex items-center gap-1.5 rounded-xl text-xs font-black shadow-md hover:brightness-110"
              title="Lokale Daten in die Cloud übertragen"
            >
              <Upload size={13} />
              <span className="text-[10px] font-black uppercase tracking-wider">Cloud Sync</span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950 text-slate-100 print:p-0 print:bg-white print:overflow-visible custom-scrollbar">
        {children}
      </div>
    </div>
  );
};

