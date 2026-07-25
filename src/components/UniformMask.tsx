import React, { useRef, useState } from 'react';
import { Share2, Save, Users, UserPlus, UserMinus, MessageSquare, Mail, Camera, Download, FileText, Copy, ChevronDown, Check, Upload, Edit, RefreshCw } from 'lucide-react';

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
  saveStatus, 
  isEditing 
}) => {
  const maskRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={maskRef} className="relative flex flex-col h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden print:border-0 print:shadow-none print:h-auto print:overflow-visible">

      {/* Header */}
      <header className="bg-[#C00000] text-white px-3 py-1.5 border-b-2 border-black flex justify-between items-center shrink-0 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white flex items-center justify-center border-2 border-black font-black text-[#C00000] text-[10px]">
            FCA
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase tracking-tighter leading-none">FC Auggen</h1>
            <span className="text-white/50 text-xs">|</span>
            <h2 className="text-xs font-bold uppercase tracking-widest leading-none">{title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[75%] justify-end">
          {onManageSquad && (
            <button 
              onClick={onManageSquad}
              className="bg-white text-black p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-gray-100 rounded-sm"
              title="Kader verwalten"
            >
              <Users size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">Kader</span>
            </button>
          )}
          {onAddPlayer && (
            <button 
              onClick={onAddPlayer}
              className="bg-white text-green-600 p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-gray-100 rounded-sm"
              title="Spieler hinzufügen"
            >
              <UserPlus size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">Hinzufügen</span>
            </button>
          )}
          {onRemovePlayer && (
            <button 
              onClick={onRemovePlayer}
              className="bg-white text-[#C00000] p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-gray-100 rounded-sm"
              title="Spieler entfernen"
            >
              <UserMinus size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">Entfernen</span>
            </button>
          )}
          {onSave && (
            <button 
              onClick={onSave}
              className={`p-1.5 border-2 border-black transition-all flex items-center gap-1 rounded-sm ${
                saveStatus === 'success' ? 'bg-emerald-500 text-white' : 
                saveStatus === 'saving' ? 'bg-yellow-400 text-black' : 
                'bg-white text-black hover:bg-gray-100'
              }`}
              title="Speichern"
            >
              <Save size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">
                {saveStatus === 'success' ? 'Gespeichert' : saveStatus === 'saving' ? 'Speichert...' : 'Speichern'}
              </span>
            </button>
          )}

          {onEdit && (
            <button 
              onClick={onEdit}
              className={`p-1.5 border-2 border-black transition-all flex items-center gap-1 rounded-sm ${
                isEditing ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 hover:bg-gray-100'
              }`}
              title="Bearbeiten"
            >
              <Edit size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">Bearbeiten</span>
            </button>
          )}
          <button 
            onClick={onEmail}
            className="bg-white text-black p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-gray-100 rounded-sm"
            title="Per E-Mail senden"
          >
            <Mail size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">E-Mail</span>
          </button>
          <button 
            onClick={onShareText}
            className="bg-white text-black p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-gray-100 rounded-sm"
            title="WhatsApp senden"
          >
            <MessageSquare size={12} />
            <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">WhatsApp</span>
          </button>
          {onReset && (
            <button 
              onClick={onReset}
              className="bg-white text-orange-600 p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-gray-100 rounded-sm"
              title="Auf Standard zurücksetzen"
            >
              <RefreshCw size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest hidden md:inline">Reset</span>
            </button>
          )}
          {onMigrate && (
            <button 
              onClick={onMigrate}
              className="bg-amber-500 text-white p-1.5 border-2 border-black transition-all flex items-center gap-1 hover:bg-amber-600 rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] hover:animate-none"
              title="Lokale Daten in die Cloud übertragen"
            >
              <Upload size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Cloud Sync</span>
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-[#DEDEDE] watermark-bg print:p-0 print:bg-white print:overflow-visible">
        {children}
      </div>
    </div>
  );
};

