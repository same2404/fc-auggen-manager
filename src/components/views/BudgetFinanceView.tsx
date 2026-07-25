import React, { useState } from 'react';
import { FinanceEntry, Spieler } from '../../types';
import { sortPlayers } from '../../utils/playerSorting';
import { 
  Euro, 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
  Target,
  AlertCircle,
  Calculator,
  Trash2,
  Users,
  Briefcase,
  Shield,
  User,
  Activity
} from 'lucide-react';

interface BudgetFinanceViewProps {
  players: Spieler[];
  financeMeta: {
    month: string;
    wins: number;
    draws: number;
    bonusPerPoint: number;
  };
  setFinanceMeta: React.Dispatch<React.SetStateAction<{
    month: string;
    wins: number;
    draws: number;
    bonusPerPoint: number;
  }>>;
  handleUpdateFinance: (playerId: string, field: string, value: any) => void;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  isEditing?: boolean;
}

export const BudgetFinanceView: React.FC<BudgetFinanceViewProps> = ({
  players,
  financeMeta,
  setFinanceMeta,
  handleUpdateFinance,
  currentMonth,
  setCurrentMonth,
  isEditing = false
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0000') {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  // Group players by category and sort them
  const sortedAll = sortPlayers(players);
  const categorizedPersonnel = {
    player: sortedAll.filter(p => p.category === 'player'),
    coach: sortedAll.filter(p => p.category === 'coach'),
    staff: sortedAll.filter(p => p.category === 'staff'),
    medical: sortedAll.filter(p => p.category === 'medical')
  };

  // Calculations per player
  const playersWithCosts = players.map(p => {
    const grundgehalt = p.finance?.baseSalary || 0;
    const bonusPerMatch = p.finance?.bonusPerMatch || 0;
    const sideAgreementAmount = p.finance?.sideAgreementAmount || 0;
    const ist = p.finance?.ist || 0;
    const months = p.finance?.months ?? 12;
    
    // For simplicity, let's assume bonusPerMatch is what was previously seasonExtra
    // or just use it as a monthly cost for now.
    const kosten_monat = grundgehalt + bonusPerMatch;
    const kosten_jahr = (kosten_monat * months) + sideAgreementAmount;
    
    return {
      ...p,
      grundgehalt,
      bonusPerMatch,
      sideAgreementAmount,
      ist,
      months,
      kosten_monat,
      kosten_jahr
    };
  });

  // Totals
  const Gesamt_Grundgehalt_monat = playersWithCosts.reduce((sum, p) => sum + p.grundgehalt, 0);
  const Gesamt_Boni_monat = playersWithCosts.reduce((sum, p) => sum + p.bonusPerMatch, 0);
  const Gesamt_Nebenvereinbarung_jahr = playersWithCosts.reduce((sum, p) => sum + p.sideAgreementAmount, 0);
  const Gesamt_IST = playersWithCosts.reduce((sum, p) => sum + p.ist, 0);
  const Gesamt_Abloese_Zugang = players.reduce((sum, p) => sum + (p.finance?.transferFeeIn || 0), 0);
  const Gesamt_Abloese_Abgang = players.reduce((sum, p) => sum + (p.finance?.transferFeeOut || 0), 0);
  const Abloese_Saldo = Gesamt_Abloese_Abgang - Gesamt_Abloese_Zugang;
  
  const Gesamtkosten_Spieler_Monat = playersWithCosts.reduce((sum, p) => sum + p.kosten_monat, 0);
  const Gesamtkosten_Spieler_Jahr = playersWithCosts.reduce((sum, p) => sum + p.kosten_jahr, 0);

  // Point Premiums
  const gesamtpunkte = (financeMeta.wins * 3) + financeMeta.draws;
  const auszahlung = gesamtpunkte * financeMeta.bonusPerPoint;
  
  const totalPointBonuses = auszahlung * categorizedPersonnel.player.length;

  const Gesamtbudget_aktuell_monat = Gesamtkosten_Spieler_Monat + totalPointBonuses;
  const Gesamtbudget_aktuell_jahr = Gesamtkosten_Spieler_Jahr + (totalPointBonuses * 12); // Point bonuses are usually per match/month, assuming 12 for year here as it is team-wide.

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const renderPersonnelTable = (title: string, personnel: Spieler[], icon: React.ReactNode) => {
    if (personnel.length === 0) return null;

    return (
      <>
        <tr className="bg-gray-100">
          <td colSpan={12} className="px-2 py-2 border-y-2 border-black">
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-black uppercase tracking-widest text-[10px]">{title}</span>
            </div>
          </td>
        </tr>
        {personnel.map((p) => {
          const grundgehalt = p.finance?.baseSalary || 0;
          const bonusPerMatch = p.finance?.bonusPerMatch || 0;
          const sideAgreementAmount = p.finance?.sideAgreementAmount || 0;
          const ist = p.finance?.ist || 0;
          const months = p.finance?.months ?? 12;
          const kosten_monat = grundgehalt + bonusPerMatch;
          const kosten_jahr = (kosten_monat * months) + sideAgreementAmount;

          return (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors border-b border-black/5">
              <td className="px-2 py-1 border-r border-black/5 text-center opacity-40">{(p as any).number || (p as any).nummer || (p as any).nr}</td>
              <td className="px-2 py-1 border-r border-black/5 font-black uppercase">{p.lastName || p.name}</td>
              <td className="px-2 py-1 border-r border-black/5 text-center text-[#C00000] font-black">{(p as any).position || (p as any).pos}</td>
              <td className="px-2 py-1 border-r border-black/5 text-right bg-red-50/20">
                <input 
                  type="number"
                  className={`w-full bg-transparent text-right font-black text-red-700 text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={p.finance?.transferFeeIn || 0}
                  onChange={(e) => handleUpdateFinance(p.id, 'transferFeeIn', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right bg-green-50/20">
                <input 
                  type="number"
                  className={`w-full bg-transparent text-right font-black text-green-700 text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={p.finance?.transferFeeOut || 0}
                  onChange={(e) => handleUpdateFinance(p.id, 'transferFeeOut', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right">
                <input 
                  type="number"
                  className={`w-full bg-transparent text-right font-black text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={grundgehalt}
                  onChange={(e) => handleUpdateFinance(p.id, 'baseSalary', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right">
                <input 
                  type="number"
                  className={`w-full bg-transparent text-right font-black text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={bonusPerMatch}
                  onChange={(e) => handleUpdateFinance(p.id, 'bonusPerMatch', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-center bg-blue-50/20">
                <input 
                  type="number"
                  min="0"
                  max="12"
                  className={`w-full bg-transparent text-center font-black text-blue-700 text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={months}
                  onChange={(e) => handleUpdateFinance(p.id, 'months', Math.min(12, Math.max(0, parseInt(e.target.value) || 0)))}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right">
                <input 
                  type="number"
                  className={`w-full bg-transparent text-right font-black text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={sideAgreementAmount}
                  onChange={(e) => handleUpdateFinance(p.id, 'sideAgreementAmount', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right bg-green-50/30">
                <input 
                  type="number"
                  className={`w-full bg-transparent text-right font-black text-green-700 text-[10px] focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={ist}
                  onChange={(e) => handleUpdateFinance(p.id, 'ist', parseInt(e.target.value) || 0)}
                  disabled={!isEditing}
                />
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right bg-gray-50 text-blue-800 text-[10px]">
                {formatCurrency(kosten_monat)}
              </td>
              <td className="px-2 py-1 border-r border-black/5 text-right bg-gray-50 text-blue-800 text-[10px]">
                {formatCurrency(kosten_jahr)}
              </td>
              <td className="px-2 py-1 border-r border-black/5">
                <input 
                  type="text"
                  className={`w-full bg-transparent italic opacity-60 focus:outline-none text-[8px] ${!isEditing ? 'cursor-not-allowed' : ''}`}
                  value={p.finance?.sideAgreements || ''}
                  onChange={(e) => handleUpdateFinance(p.id, 'sideAgreements', e.target.value)}
                  placeholder={isEditing ? "Notizen..." : ""}
                  disabled={!isEditing}
                />
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white border border-black p-8 w-full max-w-md text-center watermark-bg">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Euro size={32} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Budget & Finanzen</h2>
          <p className="text-xs font-bold uppercase opacity-40 mb-8 tracking-widest">Dieser Bereich ist passwortgeschützt</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input 
                type="password"
                placeholder="PASSWORT EINGEBEN..."
                className={`w-full p-4 bg-gray-50 border-2 border-black font-black text-center focus:outline-none transition-all ${error ? 'border-red-500 animate-shake' : 'focus:bg-white'}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error && <p className="text-[10px] font-black text-red-600 uppercase mt-2 tracking-widest">Falsches Passwort!</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-black text-white p-4 font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all active:scale-95"
            >
              Bereich freischalten
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden watermark-bg">
      {/* 1. Kompakte Finanzübersicht */}
      <div className="p-2 grid grid-cols-9 gap-2 shrink-0 border-b border-black/5 bg-gray-50/30">
        <div className="bg-white border border-black/10 p-2 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Users size={10} className="text-blue-600" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">Grundgehalt (Mtl.)</label>
          </div>
          <span className="text-sm font-black">{formatCurrency(Gesamt_Grundgehalt_monat)}</span>
        </div>
        
        <div className="bg-white border border-black/10 p-2 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Briefcase size={10} className="text-orange-600" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">Boni / Extras (Mtl.)</label>
          </div>
          <span className="text-sm font-black">{formatCurrency(Gesamt_Boni_monat)}</span>
        </div>

        <div className="bg-white border border-black/10 p-2 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Euro size={10} className="text-green-600" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">Nebenvereinb. (Jahr)</label>
          </div>
          <span className="text-sm font-black">{formatCurrency(Gesamt_Nebenvereinbarung_jahr)}</span>
        </div>
        
        <div className="bg-white border border-black/10 p-2 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Target size={10} className="text-purple-600" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">IST Aktuell</label>
          </div>
          <span className="text-sm font-black">{formatCurrency(Gesamt_IST)}</span>
        </div>

        <div className="bg-white border border-black/10 p-2 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingDown size={10} className="text-red-600" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">Ablöse Zugänge</label>
          </div>
          <span className="text-sm font-black text-red-600">{formatCurrency(Gesamt_Abloese_Zugang)}</span>
        </div>

        <div className="bg-white border border-black/10 p-2 flex flex-col">
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp size={10} className="text-green-600" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">Ablöse Abgänge</label>
          </div>
          <span className="text-sm font-black text-green-600">{formatCurrency(Gesamt_Abloese_Abgang)}</span>
        </div>

        <div className={`bg-white border-2 p-2 flex flex-col justify-center ${Abloese_Saldo >= 0 ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Euro size={10} className={Abloese_Saldo >= 0 ? 'text-green-600' : 'text-red-600'} />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-50">Ablöse Saldo</label>
          </div>
          <span className={`text-sm font-black ${Abloese_Saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Abloese_Saldo)}</span>
        </div>

        <div className="bg-black text-white border border-black p-2 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Calculator size={12} className="text-green-400" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-70">Budget (Monat)</label>
          </div>
          <span className="text-lg font-black text-green-400 leading-none">{formatCurrency(Gesamtbudget_aktuell_monat)}</span>
        </div>

        <div className="bg-black text-white border border-black p-2 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Euro size={12} className="text-yellow-400" />
            <label className="text-[7px] font-black uppercase tracking-widest opacity-70">Budget (Jahr)</label>
          </div>
          <span className="text-lg font-black text-yellow-400 leading-none">{formatCurrency(Gesamtbudget_aktuell_jahr)}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-2 p-2 pt-0 overflow-hidden">
        {/* Left: Detailed List */}
        <div className="flex-1 bg-white border border-black/10 flex flex-col overflow-hidden relative">
          <div className="p-2 border-b border-black/10 bg-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="font-black uppercase text-[10px] tracking-widest">Kader Finanzen</h3>
              <div className="flex items-center bg-white border border-black/20 p-0.5">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-black hover:text-white transition-colors"><ChevronLeft size={12} /></button>
                <span className="px-3 text-[9px] font-black uppercase tracking-widest">
                  {currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-black hover:text-white transition-colors"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse text-[9px] font-bold">
              <thead className="sticky top-0 bg-black text-white z-20">
                <tr>
                  <th className="px-2 py-1.5 border border-white/10 text-left w-8">Nr</th>
                  <th className="px-2 py-1.5 border border-white/10 text-left w-64">Name</th>
                  <th className="px-2 py-1.5 border border-white/10 text-center w-10">Pos</th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24">Ablöse (Z)<br/><span className="text-[7px] opacity-60">Zugang</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24">Ablöse (A)<br/><span className="text-[7px] opacity-60">Abgang</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24">Grundgehalt<br/><span className="text-[7px] opacity-60">Monat</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24">Boni / Extras<br/><span className="text-[7px] opacity-60">Monat</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-center w-12 text-blue-400">Monate<br/><span className="text-[7px] opacity-60">Aktiv</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24">Nebenvereinb.<br/><span className="text-[7px] opacity-60">Jahr</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24 text-green-400">IST<br/><span className="text-[7px] opacity-60">Aktuell</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-24 bg-gray-800">Kosten<br/><span className="text-[7px] opacity-60">Monat</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-right w-28 bg-gray-800">Kosten<br/><span className="text-[7px] opacity-60">Jahr</span></th>
                  <th className="px-2 py-1.5 border border-white/10 text-left">Notizen</th>
                </tr>
              </thead>
              <tbody>
                {renderPersonnelTable('Spielerkader', categorizedPersonnel.player, <Users size={12} className="text-blue-600" />)}
                {renderPersonnelTable('Trainerteam', categorizedPersonnel.coach, <Shield size={12} className="text-orange-600" />)}
                {renderPersonnelTable('Funktionsteam', categorizedPersonnel.staff, <User size={12} className="text-purple-600" />)}
                {renderPersonnelTable('Ärztliche Abteilung', categorizedPersonnel.medical, <Activity size={12} className="text-red-600" />)}
              </tbody>
              <tfoot className="sticky bottom-0 bg-gray-100 font-black z-20 border-t-2 border-black">
                <tr>
                  <td colSpan={3} className="px-2 py-2 text-right uppercase tracking-widest text-[10px]">Gesamt</td>
                  <td className="px-2 py-2 text-right text-red-700">{formatCurrency(Gesamt_Abloese_Zugang)}</td>
                  <td className="px-2 py-2 text-right text-green-700">{formatCurrency(Gesamt_Abloese_Abgang)}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(Gesamt_Grundgehalt_monat)}</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(Gesamt_Boni_monat)}</td>
                  <td className="px-2 py-2 text-center text-blue-700">-</td>
                  <td className="px-2 py-2 text-right">{formatCurrency(Gesamt_Nebenvereinbarung_jahr)}</td>
                  <td className="px-2 py-2 text-right text-green-700">{formatCurrency(Gesamt_IST)}</td>
                  <td className="px-2 py-2 text-right bg-gray-200">{formatCurrency(Gesamtkosten_Spieler_Monat)}</td>
                  <td className="px-2 py-2 text-right bg-gray-200">{formatCurrency(Gesamtkosten_Spieler_Jahr)}</td>
                  <td className="px-2 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Right: Point Bonus Calculator & Summaries */}
        <div className="w-64 space-y-2 shrink-0 flex flex-col">
          <section className="bg-white border border-black/10 p-3">
            <h4 className="font-black uppercase text-[9px] tracking-widest flex items-center gap-2 mb-3">
              <Target size={12} className="text-[#C00000]" /> Punktprämien
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[7px] font-black uppercase opacity-60 block mb-0.5">Siege</label>
                  <input 
                    type="number"
                    className={`w-full bg-gray-50 border border-black/20 p-1 font-black text-sm focus:outline-none text-center ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={financeMeta.wins}
                    onChange={(e) => setFinanceMeta({ ...financeMeta, wins: parseInt(e.target.value) || 0 })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[7px] font-black uppercase opacity-60 block mb-0.5">Remis</label>
                  <input 
                    type="number"
                    className={`w-full bg-gray-50 border border-black/20 p-1 font-black text-sm focus:outline-none text-center ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={financeMeta.draws}
                    onChange={(e) => setFinanceMeta({ ...financeMeta, draws: parseInt(e.target.value) || 0 })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div>
                <label className="text-[7px] font-black uppercase opacity-60 block mb-0.5">Prämie / Pkt (€)</label>
                <input 
                  type="number"
                  className={`w-full bg-gray-50 border border-black/20 p-1 font-black text-sm focus:outline-none text-center ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  value={financeMeta.bonusPerPoint || 0}
                  onChange={(e) => setFinanceMeta({ ...financeMeta, bonusPerPoint: parseInt(e.target.value) || 0 })}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="pt-2 border-t border-black/10 mt-2">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[8px] font-black uppercase opacity-60">Punkte</span>
                  <span className="text-sm font-black">{gesamtpunkte}</span>
                </div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[8px] font-black uppercase opacity-60">Auszahlung / Spieler</span>
                  <span className="text-sm font-black text-[#C00000]">{formatCurrency(auszahlung)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-1.5 mt-1 border border-black/5">
                  <span className="text-[8px] font-black uppercase opacity-80">Gesamt Team</span>
                  <span className="text-base font-black text-[#C00000]">{formatCurrency(totalPointBonuses)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-black text-white border border-black p-3 flex-1 overflow-auto custom-scrollbar">
            <h4 className="font-black uppercase text-[9px] tracking-widest flex items-center gap-2 mb-3 text-yellow-400">
              <AlertCircle size={12} /> Analyse
            </h4>
            
            <div className="space-y-3">
              <div>
                <h5 className="text-[8px] font-bold uppercase opacity-60 mb-1 border-b border-white/10 pb-0.5">Monatliche Fixkosten</h5>
                <div className="flex justify-between text-[11px] font-black">
                  <span>Kader Grund</span>
                  <span>{formatCurrency(Gesamt_Grundgehalt_monat)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-gray-400">
                  <span>Boni / Extras</span>
                  <span>{formatCurrency(Gesamt_Boni_monat)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-green-400">
                  <span>IST Aktuell</span>
                  <span>{formatCurrency(Gesamt_IST)}</span>
                </div>
              </div>

              <div>
                <h5 className="text-[8px] font-bold uppercase opacity-60 mb-1 border-b border-white/10 pb-0.5">Jahresprojektion</h5>
                <div className="flex justify-between text-[11px] font-black">
                  <span>Kader Gesamt</span>
                  <span>{formatCurrency(Gesamtkosten_Spieler_Jahr)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-gray-400">
                  <span>Boni / Extras</span>
                  <span>{playersWithCosts.reduce((sum, p) => sum + (p.bonusPerMatch * p.months), 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-gray-400">
                  <span>Nebenvereinb.</span>
                  <span>{formatCurrency(Gesamt_Nebenvereinbarung_jahr)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/20">
                <h5 className="text-[8px] font-bold uppercase opacity-60 mb-1 border-b border-white/10 pb-0.5 text-yellow-400">Transfer-Bilanz</h5>
                <div className="flex justify-between text-[11px] font-black text-red-400">
                  <span>Ablöse Zugänge</span>
                  <span>{formatCurrency(Gesamt_Abloese_Zugang)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-green-400">
                  <span>Ablöse Abgänge</span>
                  <span>{formatCurrency(Gesamt_Abloese_Abgang)}</span>
                </div>
                <div className={`flex justify-between text-[13px] font-black mt-1 p-1 border border-white/10 ${Abloese_Saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <span>Saldo</span>
                  <span>{formatCurrency(Abloese_Saldo)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
