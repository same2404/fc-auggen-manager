import React, { useState, useMemo, useEffect } from 'react';
import { Spieler } from '../../types';
import { 
  User, 
  Calendar, 
  Clock, 
  Activity, 
  Trash2, 
  Award, 
  TrendingUp, 
  Flame, 
  Save, 
  CheckCircle,
  Plus,
  Shield,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  ArrowLeftRight,
  Trophy,
  Users,
  MapPin,
  HeartPulse,
  Zap,
  Download,
  ExternalLink,
  Cpu,
  FolderCheck,
  Compass
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell 
} from 'recharts';

interface PlayerPortalViewProps {
  players: Spieler[];
  sessionLogs: any[];
  onSaveLog: (log: any) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdatePlayerDiagnostics?: (playerId: string, diagnostics: any) => Promise<void>;
  onUpdatePlayerStats?: (playerId: string, minutes: number, goals: number, assists: number) => Promise<void>;
  onUpdatePlayerDatenblatt?: (playerId: string, report: any) => Promise<void>;
  onUpdatePlayerTracker?: (playerId: string, trackerData: any) => Promise<void>;
}

export const PlayerPortalView: React.FC<PlayerPortalViewProps> = ({
  players,
  sessionLogs,
  onSaveLog,
  onDeleteLog,
  onUpdatePlayerDiagnostics,
  onUpdatePlayerStats,
  onUpdatePlayerDatenblatt,
  onUpdatePlayerTracker
}) => {
  const onlyPlayers = useMemo(() => {
    return players.filter(p => !p.category || p.category === 'player');
  }, [players]);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(onlyPlayers[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'Training' | 'Match'>('Training');
  const [focus, setFocus] = useState<string>('');
  const [duration, setDuration] = useState<number>(90);
  const [rpe, setRpe] = useState<number>(5);
  
  // Match stats
  const [matchMinutes, setMatchMinutes] = useState<number>(0);
  const [goals, setGoals] = useState<number>(0);
  const [assists, setAssists] = useState<number>(0);
  const [passAccuracy, setPassAccuracy] = useState<number>(80);
  const [tackleRate, setTackleRate] = useState<number>(60);

  // AI Document parsing state
  const [parsingDoc, setParsingDoc] = useState<boolean>(false);
  const [parsingError, setParsingError] = useState<string>('');
  const [parsingSuccess, setParsingSuccess] = useState<string>('');

  // Player Data Sheet States
  const [portalView, setPortalView] = useState<'form' | 'datenblatt' | 'vergleich' | 'tracker'>('tracker');
  const [editDatenblatt, setEditDatenblatt] = useState<boolean>(false);
  const [editTracker, setEditTracker] = useState<boolean>(false);

  // Tracker Specific State
  const [trackerFileName, setTrackerFileName] = useState<string>('');
  const [trackerFileUrl, setTrackerFileUrl] = useState<string>('');
  const [trackerTotalDist, setTrackerTotalDist] = useState<number>(10.5);
  const [trackerHighSpeed, setTrackerHighSpeed] = useState<number>(650);
  const [trackerSprintDist, setTrackerSprintDist] = useState<number>(280);
  const [trackerMaxSpeed, setTrackerMaxSpeed] = useState<number>(31.8);
  const [trackerSprints, setTrackerSprints] = useState<number>(22);
  const [trackerAccels, setTrackerAccels] = useState<number>(34);
  const [trackerDecels, setTrackerDecels] = useState<number>(30);
  const [trackerAvgHr, setTrackerAvgHr] = useState<number>(164);
  const [trackerMaxHr, setTrackerMaxHr] = useState<number>(188);
  const [trackerWorkload, setTrackerWorkload] = useState<number>(780);
  const [trackerHeatmap, setTrackerHeatmap] = useState<string>('Zentrum & Halbspuren');
  const [trackerTactical, setTrackerTactical] = useState<string>('');
  const [trackerRecommendations, setTrackerRecommendations] = useState<string>('');
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importRawText, setImportRawText] = useState<string>('');
  const [analysedatum, setAnalysedatum] = useState<string>(new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }));
  const [verein, setVerein] = useState<string>('FC Auggen (Herren 1)');
  const [saison, setSaison] = useState<string>('2026/2027');
  const [playerStatus, setPlayerStatus] = useState<string>('Aktiv / Wettkampffähig');

  // KPI fields
  const [kpi10m, setKpi10m] = useState<string>('1.62 s');
  const [kpi10mBenchmark, setKpi10mBenchmark] = useState<string>('< 1,65 s');
  const [kpi10mStatus, setKpi10mStatus] = useState<string>('Exzellent Hohe raumgreifende Dynamik');

  const [kpi30m, setKpi30m] = useState<string>('4.08 s');
  const [kpi30mBenchmark, setKpi30mBenchmark] = useState<string>('< 4,10 s');
  const [kpi30mStatus, setKpi30mStatus] = useState<string>('Ziel erreicht Wichtig für Umschaltbewegungen');

  const [kpiYoyo, setKpiYoyo] = useState<string>('Level 18.6');
  const [kpiYoyoBenchmark, setKpiYoyoBenchmark] = useState<string>('Level 18.5');
  const [kpiYoyoStatus, setKpiYoyoStatus] = useState<string>('Ziel erreicht Optimales Fundament fürs Zentrum');

  const [kpiJump, setKpiJump] = useState<string>('44 cm');
  const [kpiJumpBenchmark, setKpiJumpBenchmark] = useState<string>('> 42 cm');
  const [kpiJumpStatus, setKpiJumpStatus] = useState<string>('Exzellent Hohe Explosivität bei Kopfballduellen');

  // Log table custom state
  const [sheetLogs, setSheetLogs] = useState<any[]>([]);

  // Stats
  const [sheetMinutes, setSheetMinutes] = useState<string>('90 Minuten (Durchgespielt)');
  const [sheetGoalsAssists, setSheetGoalsAssists] = useState<string>('0 Tore / 1 Assist');
  const [sheetPassAccuracy, setSheetPassAccuracy] = useState<string>('84,5 %');
  const [sheetTackleRate, setSheetTackleRate] = useState<string>('62,0 %');

  // Conclusion
  const [taktischeKernkompetenz, setTaktischeKernkompetenz] = useState<string>('');
  const [optimierungsPotenzial, setOptimierungsPotenzial] = useState<string>('');
  const [naechsteMassnahmen, setNaechsteMassnahmen] = useState<string>('');
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingDoc(true);
    setParsingError('');
    setParsingSuccess('');

    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract only the base64 part, removing the data:... prefix
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = (error) => reject(error);
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // 2. Post to our new API route
      const response = await fetch("/api/player-session/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type || "application/pdf"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Fehler beim Parsen der Datei.");
      }

      const parsed = await response.json();

      // 3. Populate form fields
      if (parsed.date) setDate(parsed.date);
      if (parsed.focus) setFocus(parsed.focus);
      if (parsed.duration) setDuration(Number(parsed.duration));
      if (parsed.rpe) setRpe(Number(parsed.rpe));

      if (parsed.type === 'Match' || parsed.type === 'match') {
        setType('Match');
        if (parsed.matchMinutes !== undefined) setMatchMinutes(Number(parsed.matchMinutes));
        if (parsed.goals !== undefined) setGoals(Number(parsed.goals));
        if (parsed.assists !== undefined) setAssists(Number(parsed.assists));
        if (parsed.passAccuracy !== undefined) setPassAccuracy(Number(parsed.passAccuracy));
        if (parsed.tackleRate !== undefined) setTackleRate(Number(parsed.tackleRate));
      } else {
        setType('Training');
      }

      if (parsed.sprint10m || parsed.sprint30m || parsed.yoyotest || parsed.jumpHeight) {
        setUpdateKpis(true);
        if (parsed.sprint10m) setSprint10m(parsed.sprint10m);
        if (parsed.sprint30m) setSprint30m(parsed.sprint30m);
        if (parsed.yoyotest) setYoyotest(parsed.yoyotest);
        if (parsed.jumpHeight) setJumpHeight(parsed.jumpHeight);
      }

      setParsingSuccess(`Erfolgreich eingelesen! Daten aus "${file.name}" wurden in das Formular übernommen.`);
    } catch (err: any) {
      console.error(err);
      setParsingError(err.message || "Datei konnte nicht gelesen oder verarbeitet werden.");
    } finally {
      setParsingDoc(false);
      // Clear file input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  // Optional Athletic KPIs
  const [updateKpis, setUpdateKpis] = useState<boolean>(false);
  const [sprint10m, setSprint10m] = useState<string>('');
  const [sprint30m, setSprint30m] = useState<string>('');
  const [yoyotest, setYoyotest] = useState<string>('');
  const [jumpHeight, setJumpHeight] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Selected player object
  const selectedPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId);
  }, [players, selectedPlayerId]);

  // Logs of the selected player
  const playerLogs = useMemo(() => {
    return sessionLogs
      .filter(log => log.playerId === selectedPlayerId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessionLogs, selectedPlayerId]);

  // Calculations
  const calculatedLoad = duration * rpe;

  const rpeLabels: Record<number, { text: string; color: string; bg: string }> = {
    1: { text: 'Sehr leicht', color: 'text-green-600', bg: 'bg-green-50' },
    2: { text: 'Leicht', color: 'text-green-600', bg: 'bg-green-50' },
    3: { text: 'Moderat', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    4: { text: 'Mittel', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    5: { text: 'Etwas anstrengend', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    6: { text: 'Anstrengend', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    7: { text: 'Schwer', color: 'text-orange-600', bg: 'bg-orange-50' },
    8: { text: 'Sehr schwer', color: 'text-orange-600', bg: 'bg-orange-50' },
    9: { text: 'Extrem schwer', color: 'text-red-600', bg: 'bg-red-50' },
    10: { text: 'Maximal', color: 'text-red-700 font-black', bg: 'bg-red-100' }
  };

  const handlePlayerChange = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setSuccessMsg('');
    const p = players.find(x => x.id === playerId);
    if (p) {
      // Prefill with existing diagnostics if any
      setSprint10m(p.diagnostics?.sprintwert || '');
      setSprint30m(p.diagnostics?.sprint30m || '');
      setYoyotest(p.diagnostics?.yoyotest || '');
      setJumpHeight(p.physical?.bodyFat?.toString() || ''); // Or standard fields
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      alert('Bitte wähle zuerst einen Spieler aus.');
      return;
    }
    if (!focus.trim()) {
      alert('Bitte gib den inhaltlichen Schwerpunkt oder das Thema an.');
      return;
    }

    try {
      setSubmitting(true);
      const logId = `log-${Date.now()}`;
      
      const sessionData: any = {
        id: logId,
        playerId: selectedPlayerId,
        playerName: selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : 'Unbekannt',
        date,
        type,
        focus: focus.trim(),
        duration,
        rpe,
        calculatedLoad,
        timestamp: new Date().toISOString()
      };

      if (type === 'Match') {
        sessionData.matchMinutes = Number(matchMinutes);
        sessionData.goals = Number(goals);
        sessionData.assists = Number(assists);
        sessionData.passAccuracy = Number(passAccuracy);
        sessionData.tackleRate = Number(tackleRate);
      }

      if (updateKpis) {
        sessionData.kpis = {
          sprint10m,
          sprint30m,
          yoyotest,
          jumpHeight
        };
      }

      // Save the log
      await onSaveLog(sessionData);

      // Trigger automatic calculations and profile updates
      if (updateKpis && onUpdatePlayerDiagnostics) {
        await onUpdatePlayerDiagnostics(selectedPlayerId, {
          sprintwert: sprint10m,
          sprint30m: sprint30m,
          yoyotest: yoyotest,
          jumpHeight: jumpHeight
        });
      }

      // Update total playing minutes if match is saved
      if (type === 'Match' && onUpdatePlayerStats) {
        await onUpdatePlayerStats(selectedPlayerId, Number(matchMinutes), Number(goals), Number(assists));
      }

      setFocus('');
      setUpdateKpis(false);
      setSuccessMsg('Deine Daten wurden erfolgreich eingetragen!');
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Fehler beim Speichern der Einheit:', err);
      alert('Fehler beim Speichern der Einheit.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to parse numeric values from diagnostic strings
  const parseNumber = (str: string | undefined | null): number => {
    if (!str) return 0;
    const cleaned = str.replace(/[^0-9.,]/g, '').replace(',', '.');
    const val = parseFloat(cleaned);
    return isNaN(val) ? 0 : val;
  };

  // Compute stats and KPIs for ALL players for comparison
  const playerAverages = useMemo(() => {
    return onlyPlayers.map(p => {
      const logs = sessionLogs.filter(log => log.playerId === p.id);
      const totals = logs.reduce((acc, log) => {
        acc.count += 1;
        if (log.type === 'Match') {
          acc.matchCount += 1;
          acc.minutesSum += log.matchMinutes || 0;
          acc.goalsSum += log.goals || 0;
          acc.assistsSum += log.assists || 0;
          acc.passAccuracySum += log.passAccuracy || 0;
          acc.tackleRateSum += log.tackleRate || 0;
        }
        return acc;
      }, { count: 0, matchCount: 0, minutesSum: 0, goalsSum: 0, assistsSum: 0, passAccuracySum: 0, tackleRateSum: 0 });

      // Check if player has custom datenblattReport saved
      const rep = p.datenblattReport;
      
      const sprint10mStr = rep?.kpi10m || p.diagnostics?.sprintwert || '';
      const sprint30mStr = rep?.kpi30m || p.diagnostics?.sprint30m || '';
      const yoyoStr = rep?.kpiYoyo || p.diagnostics?.yoyotest || '';
      const jumpStr = rep?.kpiJump || p.diagnostics?.jumpHeight || '';

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        name: `${p.firstName} ${p.lastName}`,
        position: p.position || 'Feldspieler',
        sprint10m: sprint10mStr || 'k.A.',
        sprint30m: sprint30mStr || 'k.A.',
        yoyo: yoyoStr || 'k.A.',
        jump: jumpStr || 'k.A.',
        sprint10mNum: parseNumber(sprint10mStr),
        sprint30mNum: parseNumber(sprint30mStr),
        yoyoNum: parseNumber(yoyoStr),
        jumpNum: parseNumber(jumpStr),
        totalUnits: totals.count,
        matchCount: totals.matchCount,
        totalMinutes: totals.minutesSum || p.einsatzzeitenGesamt || 0,
        totalGoals: totals.goalsSum,
        totalAssists: totals.assistsSum,
        avgPass: totals.matchCount > 0 ? Math.round(totals.passAccuracySum / totals.matchCount) : 0,
        avgTackle: totals.matchCount > 0 ? Math.round(totals.tackleRateSum / totals.matchCount) : 0,
      };
    });
  }, [onlyPlayers, sessionLogs]);

  // Leaders for various metrics
  const leaders = useMemo(() => {
    const valid10m = playerAverages.filter(p => p.sprint10mNum > 0);
    const valid30m = playerAverages.filter(p => p.sprint30mNum > 0);
    const validYoyo = playerAverages.filter(p => p.yoyoNum > 0);
    const validJump = playerAverages.filter(p => p.jumpNum > 0);
    const validGoals = playerAverages.filter(p => p.totalGoals > 0);

    return {
      sprint10m: valid10m.length > 0 ? [...valid10m].sort((a, b) => a.sprint10mNum - b.sprint10mNum)[0] : null,
      sprint30m: valid30m.length > 0 ? [...valid30m].sort((a, b) => a.sprint30mNum - b.sprint30mNum)[0] : null,
      yoyo: validYoyo.length > 0 ? [...validYoyo].sort((a, b) => b.yoyoNum - a.yoyoNum)[0] : null,
      jump: validJump.length > 0 ? [...validJump].sort((a, b) => b.jumpNum - a.jumpNum)[0] : null,
      goals: validGoals.length > 0 ? [...validGoals].sort((a, b) => b.totalGoals - a.totalGoals)[0] : null,
    };
  }, [playerAverages]);

  // Duel compare states
  const [comparePlayerId1, setComparePlayerId1] = useState<string>(selectedPlayerId);
  const [comparePlayerId2, setComparePlayerId2] = useState<string>('');

  // Auto set comparePlayerId2 to second player if empty
  useEffect(() => {
    if (!comparePlayerId2 && onlyPlayers.length > 1) {
      const secondPlayer = onlyPlayers.find(p => p.id !== selectedPlayerId);
      if (secondPlayer) setComparePlayerId2(secondPlayer.id);
    }
  }, [onlyPlayers, selectedPlayerId, comparePlayerId2]);

  // Sync selectedPlayer to comparePlayerId1
  useEffect(() => {
    if (selectedPlayerId) {
      setComparePlayerId1(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  // Compute averages for active player
  const analytics = useMemo(() => {
    if (playerLogs.length === 0) return null;
    const totals = playerLogs.reduce((acc, log) => {
      acc.rpeSum += log.rpe;
      acc.loadSum += log.calculatedLoad;
      acc.durationSum += log.duration;
      acc.count += 1;
      if (log.type === 'Match') {
        acc.matchCount += 1;
        acc.minutesSum += log.matchMinutes || 0;
        acc.goalsSum += log.goals || 0;
        acc.assistsSum += log.assists || 0;
        acc.passAccuracySum += log.passAccuracy || 0;
        acc.tackleRateSum += log.tackleRate || 0;
      }
      return acc;
    }, { rpeSum: 0, loadSum: 0, durationSum: 0, count: 0, matchCount: 0, minutesSum: 0, goalsSum: 0, assistsSum: 0, passAccuracySum: 0, tackleRateSum: 0 });

    return {
      avgRpe: (totals.rpeSum / totals.count).toFixed(1),
      avgLoad: Math.round(totals.loadSum / totals.count),
      totalDuration: totals.durationSum,
      totalUnits: totals.count,
      matchCount: totals.matchCount,
      totalMinutes: totals.minutesSum,
      totalGoals: totals.goalsSum,
      totalAssists: totals.assistsSum,
      avgPass: totals.matchCount > 0 ? Math.round(totals.passAccuracySum / totals.matchCount) : 0,
      avgTackle: totals.matchCount > 0 ? Math.round(totals.tackleRateSum / totals.matchCount) : 0,
    };
  }, [playerLogs]);

  // Prefill player data sheet when selected player or logs change
  useEffect(() => {
    if (!selectedPlayer) return;

    const rep = selectedPlayer.datenblattReport;
    if (rep) {
      setVerein(rep.verein || 'FC Auggen (Herren 1)');
      setSaison(rep.saison || '2026/2027');
      setPlayerStatus(rep.playerStatus || 'Aktiv / Wettkampffähig');
      setAnalysedatum(rep.analysedatum || new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }));

      setKpi10m(rep.kpi10m || selectedPlayer.diagnostics?.sprintwert || '1.62 s');
      setKpi10mBenchmark(rep.kpi10mBenchmark || '< 1,65 s');
      setKpi10mStatus(rep.kpi10mStatus || (selectedPlayer.diagnostics?.sprintwert ? 'Exzellent Sprintschnelligkeit' : 'Exzellent Hohe raumgreifende Dynamik'));

      setKpi30m(rep.kpi30m || selectedPlayer.diagnostics?.sprint30m || '4.08 s');
      setKpi30mBenchmark(rep.kpi30mBenchmark || '< 4,10 s');
      setKpi30mStatus(rep.kpi30mStatus || (selectedPlayer.diagnostics?.sprint30m ? 'Ziel erreicht Grundspeed' : 'Ziel erreicht Wichtig für Umschaltbewegungen'));

      setKpiYoyo(rep.kpiYoyo || selectedPlayer.diagnostics?.yoyotest || 'Level 18.6');
      setKpiYoyoBenchmark(rep.kpiYoyoBenchmark || 'Level 18.5');
      setKpiYoyoStatus(rep.kpiYoyoStatus || (selectedPlayer.diagnostics?.yoyotest ? 'Ziel erreicht Ausdauerleistung' : 'Ziel erreicht Optimales Fundament fürs Zentrum'));

      setKpiJump(rep.kpiJump || selectedPlayer.diagnostics?.jumpHeight || '44 cm');
      setKpiJumpBenchmark(rep.kpiJumpBenchmark || '> 42 cm');
      setKpiJumpStatus(rep.kpiJumpStatus || (selectedPlayer.diagnostics?.jumpHeight ? 'Exzellent CMJ Vertikalsprung' : 'Exzellent Hohe Explosivität bei Kopfballduellen'));

      setSheetMinutes(rep.sheetMinutes || (analytics && analytics.totalUnits > 0 ? (analytics.matchCount > 0 ? `${analytics.totalMinutes} Minuten (Gesamt)` : '90 Minuten (Durchgespielt)') : '90 Minuten (Durchgespielt)'));
      setSheetGoalsAssists(rep.sheetGoalsAssists || (analytics && analytics.totalUnits > 0 ? `${analytics.totalGoals || 0} Tore / ${analytics.totalAssists || 0} Assists` : '0 Tore / 1 Assist'));
      setSheetPassAccuracy(rep.sheetPassAccuracy || (analytics && analytics.totalUnits > 0 ? `${analytics.avgPass || 84.5} %` : '84,5 %'));
      setSheetTackleRate(rep.sheetTackleRate || (analytics && analytics.totalUnits > 0 ? `${analytics.avgTackle || 62.0} %` : '62,0 %'));

      setTaktischeKernkompetenz(rep.taktischeKernkompetenz || `${selectedPlayer.firstName} agiert als exzellenter Stabilisator auf seiner Position (${selectedPlayer.position}). Seine hohe Disziplin sichert die defensive Struktur ab.`);
      setOptimierungsPotenzial(rep.optimierungsPotenzial || `Stellungsspiel und Antizipation bei schnellen gegnerischen Gegenangriffen können weiter verfeinert werden, um Räume kompakter zu halten.`);
      setNaechsteMassnahmen(rep.naechsteMassnahmen || `Spezifisches videogestütztes Individualtraining sowie Fortführung der Schnelligkeits- und Reaktivkraft-Einheiten.`);

      if (rep.sheetLogs && rep.sheetLogs.length > 0) {
        setSheetLogs(rep.sheetLogs);
      } else if (playerLogs.length > 0) {
        const formattedLogs = playerLogs.slice(0, 3).map((log, index) => {
          const rpeLabel = rpeLabels[log.rpe]?.text || 'Moderat';
          return {
            id: log.id,
            title: `Einheit ${index + 1}`,
            focus: log.focus,
            duration: `${log.duration} Min`,
            rpe: `${log.rpe} / 10 (${rpeLabel})`
          };
        });
        setSheetLogs(formattedLogs);
      } else {
        setSheetLogs([
          { id: '1', title: 'Einheit 1', focus: 'Taktische Grundordnung: Kompaktheit im Zentrum', duration: '90 Min', rpe: '6 / 10 (Moderat)' },
          { id: '2', title: 'Einheit 2', focus: 'Athletisches Intervalltraining: High-Intensity-Sprints', duration: '75 Min', rpe: '8 / 10 (Hoch)' },
          { id: '3', title: 'Einheit 3', focus: 'Abschlusstraining: Aktivierung & offensive Standards', duration: '60 Min', rpe: '4 / 10 (Niedrig)' }
        ]);
      }
    } else {
      setVerein('FC Auggen (Herren 1)');
      setSaison('2026/2027');
      setPlayerStatus('Aktiv / Wettkampffähig');
      setAnalysedatum(new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }));

      setKpi10m(selectedPlayer.diagnostics?.sprintwert || '1.62 s');
      setKpi30m(selectedPlayer.diagnostics?.sprint30m || '4.08 s');
      setKpiYoyo(selectedPlayer.diagnostics?.yoyotest || 'Level 18.6');
      setKpiJump(selectedPlayer.diagnostics?.jumpHeight || '44 cm');

      setKpi10mBenchmark('< 1,65 s');
      setKpi30mBenchmark('< 4,10 s');
      setKpiYoyoBenchmark('Level 18.5');
      setKpiJumpBenchmark('> 42 cm');

      setKpi10mStatus(selectedPlayer.diagnostics?.sprintwert ? 'Exzellent Sprintschnelligkeit' : 'Exzellent Hohe raumgreifende Dynamik');
      setKpi30mStatus(selectedPlayer.diagnostics?.sprint30m ? 'Ziel erreicht Grundspeed' : 'Ziel erreicht Wichtig für Umschaltbewegungen');
      setKpiYoyoStatus(selectedPlayer.diagnostics?.yoyotest ? 'Ziel erreicht Ausdauerleistung' : 'Ziel erreicht Optimales Fundament fürs Zentrum');
      setKpiJumpStatus(selectedPlayer.diagnostics?.jumpHeight ? 'Exzellent CMJ Vertikalsprung' : 'Exzellent Hohe Explosivität bei Kopfballduellen');

      if (playerLogs.length > 0) {
        const formattedLogs = playerLogs.slice(0, 3).map((log, index) => {
          const rpeLabel = rpeLabels[log.rpe]?.text || 'Moderat';
          return {
            id: log.id,
            title: `Einheit ${index + 1}`,
            focus: log.focus,
            duration: `${log.duration} Min`,
            rpe: `${log.rpe} / 10 (${rpeLabel})`
          };
        });
        setSheetLogs(formattedLogs);
      } else {
        setSheetLogs([
          { id: '1', title: 'Einheit 1', focus: 'Taktische Grundordnung: Kompaktheit im Zentrum', duration: '90 Min', rpe: '6 / 10 (Moderat)' },
          { id: '2', title: 'Einheit 2', focus: 'Athletisches Intervalltraining: High-Intensity-Sprints', duration: '75 Min', rpe: '8 / 10 (Hoch)' },
          { id: '3', title: 'Einheit 3', focus: 'Abschlusstraining: Aktivierung & offensive Standards', duration: '60 Min', rpe: '4 / 10 (Niedrig)' }
        ]);
      }

      if (analytics && analytics.totalUnits > 0) {
        setSheetMinutes(analytics.matchCount > 0 ? `${analytics.totalMinutes} Minuten (Gesamt)` : '90 Minuten (Durchgespielt)');
        setSheetGoalsAssists(`${analytics.totalGoals || 0} Tore / ${analytics.totalAssists || 0} Assists`);
        setSheetPassAccuracy(`${analytics.avgPass || 84.5} %`);
        setSheetTackleRate(`${analytics.avgTackle || 62.0} %`);
      } else {
        setSheetMinutes('90 Minuten (Durchgespielt)');
        setSheetGoalsAssists('0 Tore / 1 Assist');
        setSheetPassAccuracy('84,5 %');
        setSheetTackleRate('62,0 %');
      }

      setTaktischeKernkompetenz(`${selectedPlayer.firstName} agiert als exzellenter Stabilisator auf seiner Position (${selectedPlayer.position}). Seine hohe Disziplin sichert die defensive Struktur ab.`);
      setOptimierungsPotenzial(`Stellungsspiel und Antizipation bei schnellen gegnerischen Gegenangriffen können weiter verfeinert werden, um Räume kompakter zu halten.`);
      setNaechsteMassnahmen(`Spezifisches videogestütztes Individualtraining sowie Fortführung der Schnelligkeits- und Reaktivkraft-Einheiten.`);
    }

    // Sync Tracker Analysis for selected player
    const tr = selectedPlayer.trackerAnalysis;
    if (tr) {
      setTrackerFileName(tr.fileName || (selectedPlayer.number === 11 ? 'WG__Tracker_Julian_Ehret_RNr_11' : selectedPlayer.number === 23 ? 'Tracker_Stefan_Lauer_RNr_23' : `Tracker_${selectedPlayer.firstName}_${selectedPlayer.lastName}`));
      setTrackerFileUrl(tr.fileUrl || (selectedPlayer.number === 11 ? 'https://magentacloud.de/s/H3zDkjkx8pigtpw' : selectedPlayer.number === 23 ? 'https://magentacloud.de/s/6KJqaSL847wGBrf' : ''));
      setTrackerTotalDist(tr.totalDistanceKm ?? (selectedPlayer.number === 11 ? 11.4 : selectedPlayer.number === 23 ? 5.3 : 10.2));
      setTrackerHighSpeed(tr.highSpeedDistanceM ?? (selectedPlayer.number === 11 ? 820 : selectedPlayer.number === 23 ? 140 : 650));
      setTrackerSprintDist(tr.sprintDistanceM ?? (selectedPlayer.number === 11 ? 340 : selectedPlayer.number === 23 ? 65 : 280));
      setTrackerMaxSpeed(tr.maxSpeedKmh ?? (selectedPlayer.number === 11 ? 32.8 : selectedPlayer.number === 23 ? 26.4 : 31.5));
      setTrackerSprints(tr.sprintCount ?? (selectedPlayer.number === 11 ? 28 : selectedPlayer.number === 23 ? 8 : 22));
      setTrackerAccels(tr.accelerations ?? (selectedPlayer.number === 11 ? 42 : selectedPlayer.number === 23 ? 18 : 34));
      setTrackerDecels(tr.decelerations ?? (selectedPlayer.number === 11 ? 38 : selectedPlayer.number === 23 ? 16 : 30));
      setTrackerAvgHr(tr.avgHeartRateBpm ?? (selectedPlayer.number === 11 ? 168 : selectedPlayer.number === 23 ? 138 : 162));
      setTrackerMaxHr(tr.maxHeartRateBpm ?? (selectedPlayer.number === 11 ? 192 : selectedPlayer.number === 23 ? 165 : 185));
      setTrackerWorkload(tr.workloadIndex ?? (selectedPlayer.number === 11 ? 885 : selectedPlayer.number === 23 ? 420 : 780));
      setTrackerHeatmap(tr.heatMapZone || (selectedPlayer.number === 11 ? 'Zentrum / Rechte Halbspur & Box-to-Box' : selectedPlayer.number === 23 ? 'Strafraum & 16m-Außenkante bei Abstößen' : 'Zentrales Mittelfeld'));
      setTrackerTactical(tr.tacticalSummary || (selectedPlayer.number === 11 ? 'Julian Ehret zeigt eine herausragende Laufleistung von 11,4 km als ZM. Hohe Intensität im Umschaltspiel mit 28 Vollsprints und exzellenter Abdeckung des zentralen Mittelfelds.' : selectedPlayer.number === 23 ? 'Stefan Lauer liefert als Torwart (TW) sehr stabile Bewegungswerte (5,3 km). Sehr reaktionsschnelles Nachrücken bei gegnerischen Tiefenläufen und starke Präsenz beim Rausrücken.' : 'Gute Raumabdeckung und dynamische Tiefenläufe.'));
      setTrackerRecommendations(tr.recommendations || (selectedPlayer.number === 11 ? 'Regeneration im Beugeapparat nach hoher Sprintbelastung. Beibehalten der aggressiven Raumabdeckung im Übergangsspiel.' : selectedPlayer.number === 23 ? 'Spezifisches Torwart-Schnellkrafttraining für explosive Abdruckbewegungen.' : 'Aktive Erholung und Dehneinheit für Beugekette.'));
    } else {
      if (selectedPlayer.number === 11 || selectedPlayer.firstName.toLowerCase().includes('julian')) {
        setTrackerFileName('WG__Tracker_Julian_Ehret_RNr_11');
        setTrackerFileUrl('https://magentacloud.de/s/H3zDkjkx8pigtpw');
        setTrackerTotalDist(11.4);
        setTrackerHighSpeed(820);
        setTrackerSprintDist(340);
        setTrackerMaxSpeed(32.8);
        setTrackerSprints(28);
        setTrackerAccels(42);
        setTrackerDecels(38);
        setTrackerAvgHr(168);
        setTrackerMaxHr(192);
        setTrackerWorkload(885);
        setTrackerHeatmap('Zentrum / Rechte Halbspur & Box-to-Box');
        setTrackerTactical('Julian Ehret zeigt eine herausragende Laufleistung von 11,4 km als ZM. Hohe Intensität im Umschaltspiel mit 28 Vollsprints und exzellenter Abdeckung des zentralen Mittelfelds.');
        setTrackerRecommendations('Regeneration im Beugeapparat nach hoher Sprintbelastung. Beibehalten der aggressiven Raumabdeckung im Übergangsspiel.');
      } else if (selectedPlayer.number === 23 || selectedPlayer.firstName.toLowerCase().includes('stefan')) {
        setTrackerFileName('Tracker_Stefan_Lauer_RNr_23');
        setTrackerFileUrl('https://magentacloud.de/s/6KJqaSL847wGBrf');
        setTrackerTotalDist(5.3);
        setTrackerHighSpeed(140);
        setTrackerSprintDist(65);
        setTrackerMaxSpeed(26.4);
        setTrackerSprints(8);
        setTrackerAccels(18);
        setTrackerDecels(16);
        setTrackerAvgHr(138);
        setTrackerMaxHr(165);
        setTrackerWorkload(420);
        setTrackerHeatmap('Strafraum & 16m-Außenkante bei Abstößen');
        setTrackerTactical('Stefan Lauer liefert als Torwart (TW) sehr stabile Bewegungswerte (5,3 km). Sehr reaktionsschnelles Nachrücken bei gegnerischen Tiefenläufen und starke Präsenz beim Rausrücken.');
        setTrackerRecommendations('Spezifisches Torwart-Schnellkrafttraining für explosive Abdruckbewegungen.');
      } else {
        setTrackerFileName(`Tracker_${selectedPlayer.firstName}_${selectedPlayer.lastName}_RNr_${selectedPlayer.number}`);
        setTrackerFileUrl('');
        setTrackerTotalDist(9.8);
        setTrackerHighSpeed(540);
        setTrackerSprintDist(210);
        setTrackerMaxSpeed(31.2);
        setTrackerSprints(18);
        setTrackerAccels(30);
        setTrackerDecels(26);
        setTrackerAvgHr(162);
        setTrackerMaxHr(184);
        setTrackerWorkload(720);
        setTrackerHeatmap('Aktivitätsfeld Zentrum & Flügel');
        setTrackerTactical(`${selectedPlayer.firstName} ${selectedPlayer.lastName} zeigt ein stabiles Laufprofil mit dynamischen Zwischensprints.`);
        setTrackerRecommendations('Erhaltung der Grundlagenausdauer und gezielte Antrittsübungen.');
      }
    }
  }, [selectedPlayerId, playerLogs, analytics, selectedPlayer]);

  const handleSaveTrackerAnalysis = async () => {
    if (!selectedPlayerId || !onUpdatePlayerTracker) return;
    const trackerData = {
      fileName: trackerFileName,
      fileUrl: trackerFileUrl,
      uploadDate: new Date().toISOString().split('T')[0],
      totalDistanceKm: Number(trackerTotalDist) || 0,
      highSpeedDistanceM: Number(trackerHighSpeed) || 0,
      sprintDistanceM: Number(trackerSprintDist) || 0,
      maxSpeedKmh: Number(trackerMaxSpeed) || 0,
      sprintCount: Number(trackerSprints) || 0,
      accelerations: Number(trackerAccels) || 0,
      decelerations: Number(trackerDecels) || 0,
      avgHeartRateBpm: Number(trackerAvgHr) || 0,
      maxHeartRateBpm: Number(trackerMaxHr) || 0,
      workloadIndex: Number(trackerWorkload) || 0,
      heatMapZone: trackerHeatmap,
      tacticalSummary: trackerTactical,
      recommendations: trackerRecommendations
    };
    await onUpdatePlayerTracker(selectedPlayerId, trackerData);
  };

  const handleSaveReport = async (customReport?: any) => {
    if (!selectedPlayerId || !onUpdatePlayerDatenblatt) return;
    const reportData = customReport || {
      verein,
      saison,
      playerStatus,
      analysedatum,
      kpi10m,
      kpi10mBenchmark,
      kpi10mStatus,
      kpi30m,
      kpi30mBenchmark,
      kpi30mStatus,
      kpiYoyo,
      kpiYoyoBenchmark,
      kpiYoyoStatus,
      kpiJump,
      kpiJumpBenchmark,
      kpiJumpStatus,
      sheetMinutes,
      sheetGoalsAssists,
      sheetPassAccuracy,
      sheetTackleRate,
      taktischeKernkompetenz,
      optimierungsPotenzial,
      naechsteMassnahmen,
      sheetLogs
    };

    try {
      await onUpdatePlayerDatenblatt(selectedPlayerId, reportData);
    } catch (err) {
      console.error("Fehler beim Speichern des Berichts:", err);
    }
  };

  const generateAiReport = async () => {
    if (!selectedPlayer) return;
    try {
      setGeneratingReport(true);
      const response = await fetch("/api/player-session/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
          position: selectedPlayer.position,
          kpis: {
            sprint10m: kpi10m,
            sprint30m: kpi30m,
            yoyotest: kpiYoyo,
            jumpHeight: kpiJump
          },
          logs: sheetLogs,
          stats: {
            minutes: sheetMinutes,
            goalsAssists: sheetGoalsAssists,
            passAccuracy: sheetPassAccuracy,
            tackleRate: sheetTackleRate
          }
        })
      });

      if (!response.ok) {
        throw new Error("Fehler beim Generieren des KI-Berichts.");
      }

      const data = await response.json();
      const updatedReport = {
        verein,
        saison,
        playerStatus,
        analysedatum,
        kpi10m,
        kpi10mBenchmark,
        kpi10mStatus,
        kpi30m,
        kpi30mBenchmark,
        kpi30mStatus,
        kpiYoyo,
        kpiYoyoBenchmark,
        kpiYoyoStatus,
        kpiJump,
        kpiJumpBenchmark,
        kpiJumpStatus,
        sheetMinutes,
        sheetGoalsAssists,
        sheetPassAccuracy,
        sheetTackleRate,
        taktischeKernkompetenz: data.taktischeKernkompetenz || taktischeKernkompetenz,
        optimierungsPotenzial: data.optimierungsPotenzial || optimierungsPotenzial,
        naechsteMassnahmen: data.naechsteMassnahmen || naechsteMassnahmen,
        sheetLogs
      };

      if (data.taktischeKernkompetenz) setTaktischeKernkompetenz(data.taktischeKernkompetenz);
      if (data.optimierungsPotenzial) setOptimierungsPotenzial(data.optimierungsPotenzial);
      if (data.naechsteMassnahmen) setNaechsteMassnahmen(data.naechsteMassnahmen);

      await handleSaveReport(updatedReport);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Analyse konnte nicht generiert werden.");
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      
      {/* Design Header */}
      <div className="bg-[#0D4433] text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-[#C00000] text-white font-black text-[9px] px-2 py-0.5 border border-black uppercase tracking-widest">
            SPIELER-PORTAL
          </span>
          <h1 className="text-3xl font-black uppercase leading-none mt-2">
            PERFORMANCE & BELASTUNGSMONITOR
          </h1>
          <p className="text-xs font-semibold text-emerald-100 opacity-85 mt-1 uppercase tracking-wider">
            FC AUGGEN 1921 • PROFESSIONELLES SPIELERDATENBLATT & POST-SESSION LOGS
          </p>
        </div>
        <div className="shrink-0 font-mono text-xs text-right bg-black/30 p-2.5 border border-white/10">
          <p className="font-bold">STATUS: BEREIT FÜR EINTRAGUNG</p>
          <p className="text-[10px] text-emerald-300 mt-1">SAISON: 2026/2027</p>
        </div>
      </div>

      {/* Selector & Setup */}
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
            Wähle dein Spielerprofil aus:
          </label>
          <select 
            className="w-full bg-white border-2 border-black p-3 font-black uppercase text-sm focus:bg-emerald-50 focus:outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            value={selectedPlayerId}
            onChange={(e) => handlePlayerChange(e.target.value)}
          >
            <option value="" disabled>-- Bitte Spieler auswählen --</option>
            {onlyPlayers.map(p => (
              <option key={p.id} value={p.id}>
                #{p.number} {p.lastName}, {p.firstName} ({p.position})
              </option>
            ))}
          </select>
        </div>
        {selectedPlayer && (
          <div className="flex items-center gap-4 shrink-0 bg-gray-50 p-3 border-2 border-dashed border-gray-300 w-full md:w-auto">
            <div className="w-12 h-12 bg-gray-200 border-2 border-black rounded-full overflow-hidden flex items-center justify-center shrink-0">
              {selectedPlayer.image ? (
                <img src={selectedPlayer.image} alt={selectedPlayer.lastName} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-gray-400" />
              )}
            </div>
            <div className="text-left">
              <h4 className="font-black text-sm uppercase leading-none">
                {selectedPlayer.lastName}, {selectedPlayer.firstName}
              </h4>
              <p className="text-[10px] font-bold text-gray-500 mt-1">
                Trikot-Nr. {selectedPlayer.number} • {selectedPlayer.position}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Tabs */}
      {selectedPlayer && (
        <div className="flex flex-col sm:flex-row border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none">
          <button
            type="button"
            onClick={() => setPortalView('form')}
            className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${portalView === 'form' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Activity size={16} /> 📝 Einheit eintragen & Statistiken
          </button>
          <button
            type="button"
            onClick={() => setPortalView('datenblatt')}
            className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-t-4 sm:border-t-0 sm:border-l-4 border-black flex items-center justify-center gap-2 ${portalView === 'datenblatt' ? 'bg-[#0D4433] text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <FileText size={16} /> 📄 Professionelles Spielerdatenblatt
          </button>
          <button
            type="button"
            onClick={() => setPortalView('vergleich')}
            className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-t-4 sm:border-t-0 sm:border-l-4 border-black flex items-center justify-center gap-2 ${portalView === 'vergleich' ? 'bg-[#C00000] text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Users size={16} /> 📊 Spielervergleich & Benchmarks
          </button>
          <button
            type="button"
            onClick={() => setPortalView('tracker')}
            className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-t-4 sm:border-t-0 sm:border-l-4 border-black flex items-center justify-center gap-2 ${portalView === 'tracker' ? 'bg-blue-900 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <FolderCheck size={16} /> 📍 WG Tracker & Ordner
          </button>
        </div>
      )}

      {portalView === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
              <div className="border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-[#0D4433]" />
                <h3 className="font-black uppercase text-sm tracking-wider">NEUE EINHEIT PROTOKOLLIEREN</h3>
              </div>

              {/* AI PDF/Image Uploader Section */}
              <div className="bg-emerald-50/50 border-2 border-dashed border-emerald-600 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-700 animate-pulse shrink-0" />
                  <h4 className="font-black uppercase text-xs text-emerald-800 tracking-wider">
                    KI-DOKUMENT-PARSER (BETA)
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                  Lade ein PDF (z.B. Garmin-Report, TRACKTICS-PDF) oder ein Foto/Screenshot deines Workouts hoch. Gemini füllt die Daten automatisch für dich aus!
                </p>

                <div className="relative border-2 border-black bg-white hover:bg-emerald-50 transition-colors p-3 cursor-pointer text-center flex flex-col items-center justify-center gap-1 group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    disabled={parsingDoc}
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  {parsingDoc ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 size={24} className="text-[#0D4433] animate-spin" />
                      <span className="font-black text-xs uppercase text-[#0D4433]">Analysiere Dokument...</span>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="text-[#0D4433] group-hover:scale-110 transition-transform" />
                      <span className="font-black text-xs uppercase text-black">
                        PDF oder Foto hochladen
                      </span>
                      <span className="text-[10px] text-gray-500 font-bold">
                        PDF, PNG, JPG • Bis zu 10MB
                      </span>
                    </>
                  )}
                </div>

                {parsingError && (
                  <div className="bg-red-50 border-2 border-red-600 text-red-800 p-2.5 font-black uppercase text-[10px] flex items-center justify-between gap-2">
                    <span>⚠️ {parsingError}</span>
                    <button 
                      type="button" 
                      onClick={() => setParsingError('')}
                      className="text-red-800 hover:text-black font-black"
                    >
                      [X]
                    </button>
                  </div>
                )}

                {parsingSuccess && (
                  <div className="bg-emerald-100 border-2 border-emerald-600 text-emerald-800 p-2.5 font-black uppercase text-[10px] flex items-center justify-between gap-2">
                    <span>✅ {parsingSuccess}</span>
                    <button 
                      type="button" 
                      onClick={() => setParsingSuccess('')}
                      className="text-emerald-800 hover:text-black font-black"
                    >
                      [X]
                    </button>
                  </div>
                )}
              </div>

              {successMsg && (
                <div className="bg-emerald-50 border-2 border-emerald-600 text-emerald-800 p-4 font-black uppercase text-xs flex items-center gap-2 animate-bounce">
                  <CheckCircle size={16} /> {successMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">Datum</label>
                  <div className="flex border-2 border-black">
                    <span className="p-2.5 bg-gray-100 border-r border-black"><Calendar size={14} /></span>
                    <input 
                      type="date" 
                      required
                      className="p-2 w-full font-black text-sm focus:outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">Einheitstyp</label>
                  <div className="flex border-2 border-black">
                    <button
                      type="button"
                      onClick={() => setType('Training')}
                      className={`flex-1 py-2 font-black uppercase text-xs transition-colors ${type === 'Training' ? 'bg-[#0D4433] text-white' : 'bg-white hover:bg-gray-50'}`}
                    >
                      Training
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('Match')}
                      className={`flex-1 py-2 font-black uppercase text-xs transition-colors border-l border-black ${type === 'Match' ? 'bg-[#C00000] text-white' : 'bg-white hover:bg-gray-50'}`}
                    >
                      Match / Spiel
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">
                  Inhaltlicher Schwerpunkt (Focus / Thema der Einheit)
                </label>
                <input 
                  type="text"
                  required
                  placeholder="z.B. Athletisches Intervalltraining, Kompaktheit im Zentrum"
                  className="w-full bg-white border-2 border-black p-2.5 font-bold text-xs focus:bg-emerald-50 focus:outline-none"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    Dauer (Minuten)
                  </label>
                  <div className="flex border-2 border-black">
                    <span className="p-2.5 bg-gray-100 border-r border-black"><Clock size={14} /></span>
                    <input 
                      type="number"
                      min={1}
                      required
                      className="p-2 w-full font-black text-sm focus:outline-none"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-1">
                    Belastungsempfinden (RPE 1-10)
                  </label>
                  <div className="flex border-2 border-black">
                    <span className="p-2.5 bg-gray-100 border-r border-black font-mono font-black text-sm text-[#0D4433]">
                      {rpe}/10
                    </span>
                    <select 
                      className="p-2 w-full font-black text-sm focus:outline-none"
                      value={rpe}
                      onChange={(e) => setRpe(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>
                          {n} - {rpeLabels[n]?.text || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Live calculated load badge */}
              <div className="bg-gray-50 p-4 border-2 border-black flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-500">Berechneter Trainingsload (Dauer × RPE)</p>
                  <p className="text-sm font-black text-gray-900 mt-1">{duration} Min × {rpe} RPE</p>
                </div>
                <div className="text-right">
                  <span className="bg-[#0D4433] text-white px-3 py-2 text-sm font-black tracking-wider border-2 border-black inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {calculatedLoad} LOAD UNITS
                  </span>
                </div>
              </div>

              {/* Match performance details (Taktische Kennzahlen) */}
              {type === 'Match' && (
                <div className="border-t-2 border-dashed border-black pt-4 space-y-4">
                  <div className="bg-[#C00000]/10 border border-[#C00000]/30 p-2 text-[#C00000] font-black uppercase text-[10px] tracking-wide mb-2">
                    Match-Performance & Taktische Daten erfassen
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">Einsatzminuten</label>
                      <input 
                        type="number" 
                        min={0}
                        className="w-full p-2 border-2 border-black font-black text-xs text-center"
                        value={matchMinutes}
                        onChange={(e) => setMatchMinutes(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">Tore</label>
                      <input 
                        type="number" 
                        min={0}
                        className="w-full p-2 border-2 border-black font-black text-xs text-center"
                        value={goals}
                        onChange={(e) => setGoals(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">Vorlagen</label>
                      <input 
                        type="number" 
                        min={0}
                        className="w-full p-2 border-2 border-black font-black text-xs text-center"
                        value={assists}
                        onChange={(e) => setAssists(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">Passquote %</label>
                      <input 
                        type="number" 
                        min={0}
                        max={100}
                        className="w-full p-2 border-2 border-black font-black text-xs text-center"
                        value={passAccuracy}
                        onChange={(e) => setPassAccuracy(Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">Zweikampf %</label>
                      <input 
                        type="number" 
                        min={0}
                        max={100}
                        className="w-full p-2 border-2 border-black font-black text-xs text-center"
                        value={tackleRate}
                        onChange={(e) => setTackleRate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Diagnostic KPIs Option */}
              <div className="border-t-2 border-black pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    id="update-kpis-chk" 
                    className="w-4 h-4 cursor-pointer"
                    checked={updateKpis}
                    onChange={(e) => setUpdateKpis(e.target.checked)}
                  />
                  <label htmlFor="update-kpis-chk" className="text-[10px] font-black uppercase text-gray-800 cursor-pointer select-none">
                    Athletische Leistungsindikatoren (KPIs) aktualisieren
                  </label>
                </div>

                {updateKpis && (
                  <div className="bg-gray-50 p-4 border-2 border-dashed border-gray-400 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">
                        10m-Antritt (z.B. "1.62 s")
                      </label>
                      <input 
                        type="text" 
                        placeholder="1.62 s"
                        className="w-full p-2 border-2 border-black font-black text-xs uppercase"
                        value={sprint10m}
                        onChange={(e) => setSprint10m(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">
                        30m-Sprint (z.B. "4.08 s")
                      </label>
                      <input 
                        type="text" 
                        placeholder="4.08 s"
                        className="w-full p-2 border-2 border-black font-black text-xs uppercase"
                        value={sprint30m}
                        onChange={(e) => setSprint30m(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">
                        Yo-Yo IR1 Test (z.B. "Level 18.6")
                      </label>
                      <input 
                        type="text" 
                        placeholder="Level 18.6"
                        className="w-full p-2 border-2 border-black font-black text-xs uppercase"
                        value={yoyotest}
                        onChange={(e) => setYoyotest(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase tracking-wider text-gray-500 mb-1">
                        Sprungkraft CMJ (z.B. "44 cm")
                      </label>
                      <input 
                        type="text" 
                        placeholder="44 cm"
                        className="w-full p-2 border-2 border-black font-black text-xs uppercase"
                        value={jumpHeight}
                        onChange={(e) => setJumpHeight(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-black text-white font-black uppercase text-sm border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#0D4433] hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-2"
              >
                <Save size={18} /> {submitting ? 'Daten werden übertragen...' : 'Einheit absenden'}
              </button>
            </form>
          </div>

          {/* Right Column: Statistics Sheet & Log History (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dashboard of Selected Player */}
            {analytics ? (
              <div className="bg-[#0D4433] text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="border-b border-white/20 pb-2">
                  <span className="bg-black text-white text-[8px] font-black px-1.5 py-0.5 uppercase">Performance Dashboard</span>
                  <h3 className="font-black uppercase text-lg mt-1">SAISON STATISTIK</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 p-3 border border-white/10">
                    <p className="text-[8px] font-black uppercase text-emerald-300">Einheiten Gesamt</p>
                    <p className="text-2xl font-black">{analytics.totalUnits}</p>
                  </div>
                  <div className="bg-black/30 p-3 border border-white/10">
                    <p className="text-[8px] font-black uppercase text-emerald-300">Ø Belastung (RPE)</p>
                    <p className="text-2xl font-black text-yellow-400">{analytics.avgRpe}</p>
                  </div>
                  <div className="bg-black/30 p-3 border border-white/10">
                    <p className="text-[8px] font-black uppercase text-emerald-300">Ø Training-Load</p>
                    <p className="text-2xl font-black text-green-400">{analytics.avgLoad}</p>
                  </div>
                  <div className="bg-black/30 p-3 border border-white/10">
                    <p className="text-[8px] font-black uppercase text-emerald-300">Aktivitätszeit</p>
                    <p className="text-2xl font-black">{analytics.totalDuration} Min</p>
                  </div>
                </div>

                {analytics.matchCount > 0 && (
                  <div className="border-t border-white/20 pt-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      Match Performance ({analytics.matchCount} Spiele)
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-black/40 p-2 border border-white/10">
                        <p className="text-[7px] font-black uppercase text-gray-300">Minuten</p>
                        <p className="text-sm font-black">{analytics.totalMinutes}</p>
                      </div>
                      <div className="bg-black/40 p-2 border border-white/10">
                        <p className="text-[7px] font-black uppercase text-gray-300">Tore / Vorl.</p>
                        <p className="text-sm font-black text-yellow-400">{analytics.totalGoals} / {analytics.totalAssists}</p>
                      </div>
                      <div className="bg-black/40 p-2 border border-white/10">
                        <p className="text-[7px] font-black uppercase text-gray-300">Pass / ZK %</p>
                        <p className="text-[11px] font-black text-green-400">{analytics.avgPass}% / {analytics.avgTackle}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#0D4433] text-white/50 border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center font-black uppercase text-xs">
                <Flame size={32} className="mx-auto mb-2 animate-pulse text-yellow-400" />
                Keine Statistiken vorhanden.<br />Trage deine erste Einheit ein!
              </div>
            )}

            {/* Log History */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col h-[400px]">
              <div className="border-b-2 border-black pb-2 mb-4 flex justify-between items-center shrink-0">
                <h3 className="font-black uppercase text-xs tracking-wider">LETZTE LOGS ({playerLogs.length})</h3>
                <span className="text-[8px] font-mono text-gray-400">ABSTREIGEND</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {playerLogs.length === 0 ? (
                  <div className="text-center p-12 text-gray-300 font-black uppercase text-[10px] tracking-wide h-full flex flex-col justify-center border-2 border-dashed border-gray-100">
                    Keine Einheiten dokumentiert
                  </div>
                ) : (
                  playerLogs.map(log => (
                    <div key={log.id} className="border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative group">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Diese Einheit wirklich löschen?')) {
                            onDeleteLog(log.id);
                          }
                        }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors opacity-60 hover:opacity-100"
                        title="Löschen"
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 border border-black ${log.type === 'Match' ? 'bg-[#C00000] text-white' : 'bg-[#0D4433] text-white'}`}>
                          {log.type}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400">{log.date}</span>
                      </div>
                      <div className="font-black text-xs uppercase leading-snug">{log.focus}</div>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2 text-[9px] font-bold text-gray-600 bg-gray-50 p-1.5 border border-black/5">
                        <div>
                          Dauer: <span className="font-black text-gray-900">{log.duration} Min</span>
                        </div>
                        <div>
                          RPE: <span className="font-black text-[#0D4433]">{log.rpe}/10</span>
                        </div>
                        <div>
                          Load: <span className="font-black text-emerald-700">{log.calculatedLoad}</span>
                        </div>
                      </div>

                      {log.type === 'Match' && (
                        <div className="mt-1 bg-red-50/50 p-1.5 border border-[#C00000]/10 text-[8px] font-semibold text-gray-700 flex justify-between">
                          <span>Minuten: <strong>{log.matchMinutes}</strong></span>
                          <span>Tore/Vorl: <strong>{log.goals}/{log.assists}</strong></span>
                          <span>Pass/ZK: <strong>{log.passAccuracy}%/{log.tackleRate}%</strong></span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      ) : portalView === 'datenblatt' ? (
        /* PROFESSIONELLES SPIELERDATENBLATT */
        <div className="space-y-6">
          {/* Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] select-none">
            <div className="flex items-center gap-2">
              <span className="bg-[#0D4433] text-white p-2 border-2 border-black"><Award size={18} /></span>
              <div>
                <h4 className="font-black uppercase text-xs">BERICHTSSTEUERUNG</h4>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Optionen zur Anpassung und zum Drucken</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={generatingReport}
                onClick={generateAiReport}
                className="bg-black text-white px-4 py-2 border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 hover:bg-emerald-800 hover:text-white transition-colors disabled:opacity-50"
              >
                {generatingReport ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Analyst liest...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-yellow-400" /> KI-Fazit generieren
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (editDatenblatt) {
                    handleSaveReport();
                  }
                  setEditDatenblatt(!editDatenblatt);
                }}
                className={`px-4 py-2 border-2 border-black font-black uppercase text-xs transition-colors ${editDatenblatt ? 'bg-[#0D4433] text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}`}
              >
                {editDatenblatt ? '💾 Änderungen speichern' : '✏️ Daten manuell anpassen'}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white text-black hover:bg-gray-50 px-4 py-2 border-2 border-black font-black uppercase text-xs flex items-center gap-1.5"
              >
                <FileText size={14} /> Report drucken / PDF
              </button>
            </div>
          </div>

          {/* HIGH POLISHED NEU-BRUTALIST SPIELERDATENBLATT CONTAINER */}
          <div className="border-4 border-black p-8 bg-white text-black space-y-6 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" id="player-data-sheet-pdf">
            {/* TOP RIBBON */}
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-widest text-[#0D4433]">
                  PERFORMANCE & TRACKING MONITOR
                </p>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  PROFESSIONELLES SPIELERDATENBLATT
                </h2>
              </div>
              <div className="text-right font-mono text-xs font-bold border-2 border-black p-2 bg-gray-50">
                SPIELER: {selectedPlayer?.firstName?.toUpperCase()} {selectedPlayer?.lastName?.toUpperCase()}
              </div>
            </div>

            {/* METADATA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 border-2 border-black text-xs">
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Spieler</span>
                <span className="font-black text-sm uppercase">{selectedPlayer?.firstName} {selectedPlayer?.lastName}</span>
              </div>
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Verein</span>
                {editDatenblatt ? (
                  <input 
                    type="text" 
                    className="border-2 border-black p-1 bg-white font-black w-full text-xs" 
                    value={verein} 
                    onChange={(e) => setVerein(e.target.value)} 
                  />
                ) : (
                  <span className="font-black text-sm uppercase">{verein}</span>
                )}
              </div>
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Saison</span>
                {editDatenblatt ? (
                  <input 
                    type="text" 
                    className="border-2 border-black p-1 bg-white font-black w-full text-xs" 
                    value={saison} 
                    onChange={(e) => setSaison(e.target.value)} 
                  />
                ) : (
                  <span className="font-black text-sm uppercase">{saison}</span>
                )}
              </div>
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Position</span>
                <span className="font-black text-sm uppercase">{selectedPlayer?.position || 'Zentrales Mittelfeld'}</span>
              </div>
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Analysedatum</span>
                {editDatenblatt ? (
                  <input 
                    type="text" 
                    className="border-2 border-black p-1 bg-white font-black w-full text-xs" 
                    value={analysedatum} 
                    onChange={(e) => setAnalysedatum(e.target.value)} 
                  />
                ) : (
                  <span className="font-black text-sm uppercase">{analysedatum}</span>
                )}
              </div>
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Status</span>
                {editDatenblatt ? (
                  <input 
                    type="text" 
                    className="border-2 border-black p-1 bg-white font-black w-full text-xs" 
                    value={playerStatus} 
                    onChange={(e) => setPlayerStatus(e.target.value)} 
                  />
                ) : (
                  <span className="font-black text-sm uppercase text-[#0D4433]">{playerStatus}</span>
                )}
              </div>
            </div>

            {/* SECTION 1 */}
            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase border-b-2 border-black pb-1">
                1. Athletische Leistungsindikatoren (KPIs)
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                Die aus den Rohdaten extrahierten physischen Parameter zeigen hervorragende konditionelle und explosive Werte im Vergleich zu den mannschaftsinternen Benchmarks.
              </p>
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black font-black uppercase">
                      <th className="p-2 border-r border-black">Metrik / Parameter</th>
                      <th className="p-2 border-r border-black w-1/4">Benchmark</th>
                      <th className="p-2 border-r border-black w-1/4">Gemessener Wert</th>
                      <th className="p-2 w-1/3">Status / Einordnung</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black font-bold">
                      <td className="p-2 border-r border-black bg-gray-50/50 font-black">10m-Antritt (Sprintschnelligkeit)</td>
                      <td className="p-2 border-r border-black font-mono">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs" value={kpi10mBenchmark} onChange={(e) => setKpi10mBenchmark(e.target.value)} />
                        ) : kpi10mBenchmark}
                      </td>
                      <td className="p-2 border-r border-black font-mono text-[#0D4433] font-black">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs font-black" value={kpi10m} onChange={(e) => setKpi10m(e.target.value)} />
                        ) : kpi10m}
                      </td>
                      <td className="p-2 text-xs">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white text-xs" value={kpi10mStatus} onChange={(e) => setKpi10mStatus(e.target.value)} />
                        ) : kpi10mStatus}
                      </td>
                    </tr>
                    <tr className="border-b border-black font-bold">
                      <td className="p-2 border-r border-black bg-gray-50/50 font-black">30m-Sprint (Grundspeed)</td>
                      <td className="p-2 border-r border-black font-mono">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs" value={kpi30mBenchmark} onChange={(e) => setKpi30mBenchmark(e.target.value)} />
                        ) : kpi30mBenchmark}
                      </td>
                      <td className="p-2 border-r border-black font-mono text-[#0D4433] font-black">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs font-black" value={kpi30m} onChange={(e) => setKpi30m(e.target.value)} />
                        ) : kpi30m}
                      </td>
                      <td className="p-2 text-xs">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white text-xs" value={kpi30mStatus} onChange={(e) => setKpi30mStatus(e.target.value)} />
                        ) : kpi30mStatus}
                      </td>
                    </tr>
                    <tr className="border-b border-black font-bold">
                      <td className="p-2 border-r border-black bg-gray-50/50 font-black">Yo-Yo IR1 Test (Ausdauerleistung)</td>
                      <td className="p-2 border-r border-black font-mono">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs" value={kpiYoyoBenchmark} onChange={(e) => setKpiYoyoBenchmark(e.target.value)} />
                        ) : kpiYoyoBenchmark}
                      </td>
                      <td className="p-2 border-r border-black font-mono text-[#0D4433] font-black">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs font-black" value={kpiYoyo} onChange={(e) => setKpiYoyo(e.target.value)} />
                        ) : kpiYoyo}
                      </td>
                      <td className="p-2 text-xs">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white text-xs" value={kpiYoyoStatus} onChange={(e) => setKpiYoyoStatus(e.target.value)} />
                        ) : kpiYoyoStatus}
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td className="p-2 border-r border-black bg-gray-50/50 font-black">Sprungkraft (CMJ Vertikalsprung)</td>
                      <td className="p-2 border-r border-black font-mono">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs" value={kpiJumpBenchmark} onChange={(e) => setKpiJumpBenchmark(e.target.value)} />
                        ) : kpiJumpBenchmark}
                      </td>
                      <td className="p-2 border-r border-black font-mono text-[#0D4433] font-black">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white font-mono text-xs font-black" value={kpiJump} onChange={(e) => setKpiJump(e.target.value)} />
                        ) : kpiJump}
                      </td>
                      <td className="p-2 text-xs">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black w-full bg-white text-xs" value={kpiJumpStatus} onChange={(e) => setKpiJumpStatus(e.target.value)} />
                        ) : kpiJumpStatus}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2 */}
            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase border-b-2 border-black pb-1">
                2. Belastungssteuerung & Trainings-Log
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                Dokumentation der Trainingsbelastung mittels RPE-Index (Rate of Perceived Exertion) zur optimalen Steuerung der Frische vor dem Wettkampf.
              </p>
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black font-black uppercase">
                      <th className="p-2 border-r border-black w-1/4">Einheit</th>
                      <th className="p-2 border-r border-black">Inhaltlicher Schwerpunkt</th>
                      <th className="p-2 border-r border-black w-1/6">Dauer</th>
                      <th className="p-2 w-1/4">Belastung (RPE 1-10)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="border-b last:border-b-0 border-black font-bold">
                        <td className="p-2 border-r border-black bg-gray-50/50">
                          {editDatenblatt ? (
                            <input type="text" className="p-1 border border-black w-full bg-white text-xs font-bold" value={log.title} onChange={(e) => {
                              const next = [...sheetLogs];
                              next[idx].title = e.target.value;
                              setSheetLogs(next);
                            }} />
                          ) : log.title}
                        </td>
                        <td className="p-2 border-r border-black">
                          {editDatenblatt ? (
                            <input type="text" className="p-1 border border-black w-full bg-white text-xs" value={log.focus} onChange={(e) => {
                              const next = [...sheetLogs];
                              next[idx].focus = e.target.value;
                              setSheetLogs(next);
                            }} />
                          ) : log.focus}
                        </td>
                        <td className="p-2 border-r border-black">
                          {editDatenblatt ? (
                            <input type="text" className="p-1 border border-black w-full bg-white text-xs" value={log.duration} onChange={(e) => {
                              const next = [...sheetLogs];
                              next[idx].duration = e.target.value;
                              setSheetLogs(next);
                            }} />
                          ) : log.duration}
                        </td>
                        <td className="p-2 font-mono text-[#0D4433] font-black">
                          {editDatenblatt ? (
                            <input type="text" className="p-1 border border-black w-full bg-white text-xs font-black font-mono" value={log.rpe} onChange={(e) => {
                              const next = [...sheetLogs];
                              next[idx].rpe = e.target.value;
                              setSheetLogs(next);
                            }} />
                          ) : log.rpe}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3 */}
            <div className="space-y-3">
              <h3 className="font-black text-sm uppercase border-b-2 border-black pb-1">
                3. Match-Performance & Taktische Kennzahlen
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed italic">
                Reale Leistungsdaten aus den Pflichtspielen im zentralen Mittelfeld.
              </p>
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-black font-black uppercase">
                      <th className="p-2 border-r border-black w-1/4">Einsatzminuten</th>
                      <th className="p-2 border-r border-black w-1/4">Tore / Vorlagen</th>
                      <th className="p-2 border-r border-black w-1/4">Passquote</th>
                      <th className="p-2 w-1/4">Zweikampfquote</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-black text-sm">
                      <td className="p-3 border-r border-black">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black text-center w-full bg-white text-xs font-black" value={sheetMinutes} onChange={(e) => setSheetMinutes(e.target.value)} />
                        ) : sheetMinutes}
                      </td>
                      <td className="p-3 border-r border-black text-[#C00000]">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black text-center w-full bg-white text-xs font-black text-[#C00000]" value={sheetGoalsAssists} onChange={(e) => setSheetGoalsAssists(e.target.value)} />
                        ) : sheetGoalsAssists}
                      </td>
                      <td className="p-3 border-r border-black text-emerald-800">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black text-center w-full bg-white text-xs font-black text-emerald-800" value={sheetPassAccuracy} onChange={(e) => setSheetPassAccuracy(e.target.value)} />
                        ) : sheetPassAccuracy}
                      </td>
                      <td className="p-3 text-emerald-800">
                        {editDatenblatt ? (
                          <input type="text" className="p-1 border border-black text-center w-full bg-white text-xs font-black text-emerald-800" value={sheetTackleRate} onChange={(e) => setSheetTackleRate(e.target.value)} />
                        ) : sheetTackleRate}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4 */}
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase border-b-2 border-black pb-1">
                4. Analysten-Fazit & Strategischer Entwicklungsplan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-2 border-black p-4 bg-gray-50/50 space-y-2">
                  <h4 className="font-black text-[10px] uppercase text-[#0D4433] tracking-wider">
                    Taktische Kernkompetenz
                  </h4>
                  {editDatenblatt ? (
                    <textarea className="w-full p-2 border-2 border-black text-xs font-bold bg-white h-32 resize-none focus:outline-none focus:bg-emerald-50" value={taktischeKernkompetenz} onChange={(e) => setTaktischeKernkompetenz(e.target.value)} />
                  ) : (
                    <p className="text-xs text-gray-800 font-bold leading-relaxed">{taktischeKernkompetenz}</p>
                  )}
                </div>

                <div className="border-2 border-black p-4 bg-gray-50/50 space-y-2">
                  <h4 className="font-black text-[10px] uppercase text-[#C00000] tracking-wider">
                    Optimierungspotenzial
                  </h4>
                  {editDatenblatt ? (
                    <textarea className="w-full p-2 border-2 border-black text-xs font-bold bg-white h-32 resize-none focus:outline-none focus:bg-red-50" value={optimierungsPotenzial} onChange={(e) => setOptimierungsPotenzial(e.target.value)} />
                  ) : (
                    <p className="text-xs text-gray-800 font-bold leading-relaxed">{optimierungsPotenzial}</p>
                  )}
                </div>

                <div className="border-2 border-black p-4 bg-gray-50/50 space-y-2">
                  <h4 className="font-black text-[10px] uppercase text-amber-700 tracking-wider">
                    Nächste Maßnahmen
                  </h4>
                  {editDatenblatt ? (
                    <textarea className="w-full p-2 border-2 border-black text-xs font-bold bg-white h-32 resize-none focus:outline-none focus:bg-amber-50" value={naechsteMassnahmen} onChange={(e) => setNaechsteMassnahmen(e.target.value)} />
                  ) : (
                    <p className="text-xs text-gray-800 font-bold leading-relaxed">{naechsteMassnahmen}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : portalView === 'vergleich' ? (
        /* SPIELERVERGLEICH & BENCHMARKS */
        <div className="space-y-8 animate-fadeIn">
          {/* Bento-Grid Leaderboards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 10m Leader */}
            <div className="bg-[#0D4433] text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">⚡ Sprintschnelligkeit (10m)</span>
                  <Trophy size={14} className="text-yellow-400" />
                </div>
                {leaders.sprint10m ? (
                  <div>
                    <h5 className="font-black text-sm uppercase truncate">{leaders.sprint10m.name}</h5>
                    <p className="text-[10px] text-gray-300 font-bold uppercase mt-0.5">{leaders.sprint10m.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">Keine Daten</p>
                )}
              </div>
              <div className="text-right mt-3">
                <span className="text-2xl font-black text-yellow-300 font-mono">
                  {leaders.sprint10m ? leaders.sprint10m.sprint10m : '—'}
                </span>
              </div>
            </div>

            {/* KPI 30m Leader */}
            <div className="bg-[#0D4433] text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">🏎️ Topspeed (30m)</span>
                  <Trophy size={14} className="text-yellow-400" />
                </div>
                {leaders.sprint30m ? (
                  <div>
                    <h5 className="font-black text-sm uppercase truncate">{leaders.sprint30m.name}</h5>
                    <p className="text-[10px] text-gray-300 font-bold uppercase mt-0.5">{leaders.sprint30m.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">Keine Daten</p>
                )}
              </div>
              <div className="text-right mt-3">
                <span className="text-2xl font-black text-yellow-300 font-mono">
                  {leaders.sprint30m ? leaders.sprint30m.sprint30m : '—'}
                </span>
              </div>
            </div>

            {/* KPI Yoyo Leader */}
            <div className="bg-[#0D4433] text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">🫁 Ausdauer (Yo-Yo)</span>
                  <Trophy size={14} className="text-yellow-400" />
                </div>
                {leaders.yoyo ? (
                  <div>
                    <h5 className="font-black text-sm uppercase truncate">{leaders.yoyo.name}</h5>
                    <p className="text-[10px] text-gray-300 font-bold uppercase mt-0.5">{leaders.yoyo.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">Keine Daten</p>
                )}
              </div>
              <div className="text-right mt-3">
                <span className="text-2xl font-black text-yellow-300 font-mono">
                  {leaders.yoyo ? leaders.yoyo.yoyo : '—'}
                </span>
              </div>
            </div>

            {/* KPI Jump Leader */}
            <div className="bg-[#0D4433] text-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300">🚀 Sprungkraft (CMJ)</span>
                  <Trophy size={14} className="text-yellow-400" />
                </div>
                {leaders.jump ? (
                  <div>
                    <h5 className="font-black text-sm uppercase truncate">{leaders.jump.name}</h5>
                    <p className="text-[10px] text-gray-300 font-bold uppercase mt-0.5">{leaders.jump.position}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">Keine Daten</p>
                )}
              </div>
              <div className="text-right mt-3">
                <span className="text-2xl font-black text-yellow-300 font-mono">
                  {leaders.jump ? leaders.jump.jump : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Duel - Head to Head Comparison */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6">
            <div className="border-b-4 border-black pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={20} className="text-[#C00000]" />
                <h3 className="font-black uppercase text-base tracking-wider">1vs1 DIREKTER SPIELERVERGLEICH</h3>
              </div>
              
              {/* Dual Selectors */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select 
                  className="p-1.5 border-2 border-black font-black text-xs uppercase bg-white max-w-[180px] truncate"
                  value={comparePlayerId1}
                  onChange={(e) => setComparePlayerId1(e.target.value)}
                >
                  {playerAverages.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <span className="font-black text-xs">VS</span>
                <select 
                  className="p-1.5 border-2 border-black font-black text-xs uppercase bg-white max-w-[180px] truncate"
                  value={comparePlayerId2}
                  onChange={(e) => setComparePlayerId2(e.target.value)}
                >
                  <option value="" disabled>Gegner wählen...</option>
                  {playerAverages.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            {(() => {
              const p1 = playerAverages.find(p => p.id === comparePlayerId1);
              const p2 = playerAverages.find(p => p.id === comparePlayerId2);

              if (!p1 || !p2) {
                return <p className="text-center py-6 text-gray-500 font-bold italic">Bitte zwei Spieler auswählen, um den Vergleich zu starten.</p>;
              }

              const metrics = [
                { label: 'Sprintschnelligkeit (10m) ⚡', key: 'sprint10m', numKey: 'sprint10mNum', inverse: true, unit: ' s' },
                { label: 'Topspeed (30m) 🏎️', key: 'sprint30m', numKey: 'sprint30mNum', inverse: true, unit: ' s' },
                { label: 'Yo-Yo Ausdauerleistung 🫁', key: 'yoyo', numKey: 'yoyoNum', inverse: false, unit: ' lvl' },
                { label: 'CMJ Vertikalsprung 🚀', key: 'jump', numKey: 'jumpNum', inverse: false, unit: ' cm' },
                { label: 'Gesamt Spielminuten ⏱️', key: 'totalMinutes', numKey: 'totalMinutes', inverse: false, unit: ' Min' },
                { label: 'Tore in dieser Saison ⚽', key: 'totalGoals', numKey: 'totalGoals', inverse: false, unit: '' },
                { label: 'Assists in dieser Saison 🎯', key: 'totalAssists', numKey: 'totalAssists', inverse: false, unit: '' },
                { label: 'Ø Passgenauigkeit 👟', key: 'avgPass', numKey: 'avgPass', inverse: false, unit: '%' },
                { label: 'Ø Zweikampfquote 🛡️', key: 'avgTackle', numKey: 'avgTackle', inverse: false, unit: '%' },
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.map(m => {
                    const val1 = p1[m.key as keyof typeof p1];
                    const val2 = p2[m.key as keyof typeof p2];
                    const num1 = p1[m.numKey as keyof typeof p1] as number;
                    const num2 = p2[m.numKey as keyof typeof p2] as number;

                    // Calculate winner
                    let p1Wins = false;
                    let p2Wins = false;
                    if (num1 > 0 && num2 > 0) {
                      if (m.inverse) {
                        p1Wins = num1 < num2;
                        p2Wins = num2 < num1;
                      } else {
                        p1Wins = num1 > num2;
                        p2Wins = num2 > num1;
                      }
                    } else if (num1 > 0) {
                      p1Wins = true;
                    } else if (num2 > 0) {
                      p2Wins = true;
                    }

                    // For the progress bar widths
                    const maxVal = Math.max(num1, num2) || 1;
                    const width1 = `${Math.min(100, Math.max(5, (num1 / maxVal) * 100))}%`;
                    const width2 = `${Math.min(100, Math.max(5, (num2 / maxVal) * 100))}%`;

                    return (
                      <div key={m.label} className="border-2 border-black p-4 bg-gray-50 flex flex-col justify-between space-y-3">
                        <div className="text-center font-black text-[10px] uppercase tracking-wider text-gray-500">
                          {m.label}
                        </div>
                        <div className="grid grid-cols-3 items-center text-center">
                          {/* Player 1 value */}
                          <div className={`p-1.5 border-2 border-black font-black text-xs truncate ${p1Wins ? 'bg-yellow-100' : 'bg-white'}`}>
                            {typeof val1 === 'number' ? `${val1}${m.unit}` : val1}
                          </div>
                          
                          {/* Comparison indicator */}
                          <div className="font-mono text-[9px] text-gray-400 font-bold">
                            {p1Wins ? '◄ Besser' : p2Wins ? 'Besser ►' : '—'}
                          </div>
                          
                          {/* Player 2 value */}
                          <div className={`p-1.5 border-2 border-black font-black text-xs truncate ${p2Wins ? 'bg-yellow-100' : 'bg-white'}`}>
                            {typeof val2 === 'number' ? `${val2}${m.unit}` : val2}
                          </div>
                        </div>

                        {/* Dual bar comparison */}
                        <div className="space-y-1 select-none">
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] font-black text-gray-400 w-12 truncate">{p1.firstName}</span>
                            <div className="flex-1 h-2 bg-gray-200 border border-black rounded-none overflow-hidden">
                              <div className={`h-full border-r border-black ${p1Wins ? 'bg-[#0D4433]' : 'bg-gray-500'}`} style={{ width: width1 }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] font-black text-gray-400 w-12 truncate">{p2.firstName}</span>
                            <div className="flex-1 h-2 bg-gray-200 border border-black rounded-none overflow-hidden">
                              <div className={`h-full border-r border-black ${p2Wins ? 'bg-[#C00000]' : 'bg-gray-500'}`} style={{ width: width2 }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Visual Recharts Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sprint speeds comparison chart */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="border-b border-black pb-2">
                <h4 className="font-black uppercase text-xs">SPRINTSCHNELLIGKEIT IM VERGLEICH (s)</h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Niedriger ist besser (10m vs. 30m Sprint)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={playerAverages.filter(p => p.sprint10mNum > 0 || p.sprint30mNum > 0)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis dataKey="firstName" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#000000" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#000000" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '2px solid black', fontFamily: 'monospace', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar name="10m Sprint (s)" dataKey="sprint10mNum" fill="#0D4433" stroke="#000000" strokeWidth={1} />
                    <Bar name="30m Sprint (s)" dataKey="sprint30mNum" fill="#C00000" stroke="#000000" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ausdauer und Sprungkraft */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="border-b border-black pb-2">
                <h4 className="font-black uppercase text-xs">SPRUNGKRAFT (cm) & ENDURANCE-LEVELS</h4>
                <p className="text-[9px] text-gray-500 font-bold uppercase">Höher ist besser (Sprungkraft & Yo-Yo Test)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={playerAverages.filter(p => p.jumpNum > 0 || p.yoyoNum > 0)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <XAxis dataKey="firstName" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#000000" />
                    <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#000000" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '2px solid black', fontFamily: 'monospace', fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                    <Bar name="CMJ Sprunghöhe (cm)" dataKey="jumpNum" fill="#D97706" stroke="#000000" strokeWidth={1} />
                    <Bar name="Yo-Yo Test Level" dataKey="yoyoNum" fill="#1D4ED8" stroke="#000000" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Complete Comparison Roster list */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="border-b-4 border-black pb-2 mb-4">
              <h3 className="font-black uppercase text-base tracking-wider">GESAMTER SPIELER-KADER IM DIREKTEN VERGLEICH</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Übersicht aller physischer und spielerischer Leistungsindikatoren der aktuellen Saison</p>
            </div>
            
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white font-black uppercase text-[10px]">
                    <th className="p-3 border-r border-black/30">Spieler</th>
                    <th className="p-3 border-r border-black/30 text-center">Position</th>
                    <th className="p-3 border-r border-black/30 text-center">10m-Sprint</th>
                    <th className="p-3 border-r border-black/30 text-center">30m-Sprint</th>
                    <th className="p-3 border-r border-black/30 text-center">Yo-Yo Test</th>
                    <th className="p-3 border-r border-black/30 text-center">Sprungkraft</th>
                    <th className="p-3 border-r border-black/30 text-center">Spielminuten</th>
                    <th className="p-3 border-r border-black/30 text-center">Tore / Assists</th>
                    <th className="p-3 text-center">Pass % / ZK %</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black">
                  {playerAverages.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors font-bold text-gray-800">
                      <td className="p-3 border-r border-black font-black uppercase text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        {p.name}
                      </td>
                      <td className="p-3 border-r border-black text-center text-[10px] uppercase text-gray-500">{p.position}</td>
                      <td className="p-3 border-r border-black text-center font-mono text-[#0D4433] font-black">{p.sprint10m}</td>
                      <td className="p-3 border-r border-black text-center font-mono text-[#C00000] font-black">{p.sprint30m}</td>
                      <td className="p-3 border-r border-black text-center font-mono text-blue-700 font-black">{p.yoyo}</td>
                      <td className="p-3 border-r border-black text-center font-mono text-amber-700 font-black">{p.jump}</td>
                      <td className="p-3 border-r border-black text-center font-mono">{p.totalMinutes} Min</td>
                      <td className="p-3 border-r border-black text-center text-xs font-black">
                        <span className="text-[#C00000]">{p.totalGoals}</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className="text-[#0D4433]">{p.totalAssists}</span>
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className="text-green-700 font-black">{p.avgPass}%</span>
                        <span className="text-gray-300 mx-1">/</span>
                        <span className="text-indigo-700 font-black">{p.avgTackle}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SPIELERORDNER & TRACKER-ANALYSE VIEW */
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner for Player Folder */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-black text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/20 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FolderCheck size={20} className="text-emerald-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                    DIGITALER SPIELERORDNER & GPS TRACKER AKTE
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider italic">
                  {selectedPlayer.firstName} {selectedPlayer.lastName} (#{selectedPlayer.number})
                </h2>
                <p className="text-xs text-gray-300 font-bold mt-1">
                  Position: <span className="text-white underline">{selectedPlayer.position}</span> • Status: <span className="text-emerald-400">Aktiv im Kader</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {trackerFileUrl ? (
                  <a 
                    href={trackerFileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase px-4 py-2 border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    <ExternalLink size={14} /> 📥 MagentaCLOUD Ordner öffnen
                  </a>
                ) : (
                  <span className="bg-gray-800 text-gray-300 font-mono text-xs px-3 py-1.5 border border-gray-700 rounded">
                    Datei: {trackerFileName || 'Keine verknüpfte Datei'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setEditTracker(!editTracker)}
                  className={`font-black text-xs uppercase px-4 py-2 border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${editTracker ? 'bg-amber-400 text-black' : 'bg-white text-black hover:bg-gray-100'}`}
                >
                  {editTracker ? '✔ Fertig bearbeiten' : '✏️ Werte Anpassen'}
                </button>

                <button
                  type="button"
                  onClick={handleSaveTrackerAnalysis}
                  className="bg-[#C00000] hover:bg-red-700 text-white font-black text-xs uppercase px-4 py-2 border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Save size={14} /> 💾 Im Ordner Speichern
                </button>
              </div>
            </div>

            {/* Linked file path info box */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm p-3 border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-300 shrink-0" />
                <span className="text-xs font-mono text-blue-100">
                  Verknüpfte Tracker-Datei: <strong className="text-white">{trackerFileName}</strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 border border-emerald-500/40">
                🟢 Live mit Spielerakte & Spielbericht synchronisiert
              </span>
            </div>
          </div>

          {/* GPS Tracker KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Distanz */}
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <MapPin size={12} className="text-blue-600" /> Gesamtdistanz
                </span>
                <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-1.5 py-0.5 border border-black">GPS Meter</span>
              </div>
              {editTracker ? (
                <input 
                  type="number" step="0.1"
                  className="w-full text-2xl font-black border-2 border-black p-1 bg-amber-50"
                  value={trackerTotalDist}
                  onChange={(e) => setTrackerTotalDist(parseFloat(e.target.value))}
                />
              ) : (
                <div className="text-3xl font-black font-mono text-blue-950">
                  {trackerTotalDist} <span className="text-sm font-bold text-gray-600">km</span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 font-bold mt-1">Sollwert ZM/Außen: &gt; 10,0 km</p>
            </div>

            {/* High Speed Distance */}
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <Zap size={12} className="text-amber-500" /> High-Speed Run
                </span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 border border-black">&gt; 19.8 km/h</span>
              </div>
              {editTracker ? (
                <input 
                  type="number"
                  className="w-full text-2xl font-black border-2 border-black p-1 bg-amber-50"
                  value={trackerHighSpeed}
                  onChange={(e) => setTrackerHighSpeed(parseInt(e.target.value))}
                />
              ) : (
                <div className="text-3xl font-black font-mono text-amber-600">
                  {trackerHighSpeed} <span className="text-sm font-bold text-gray-600">m</span>
                </div>
              )}
              <p className="text-[10px] text-gray-500 font-bold mt-1">Hohe Laufintensität</p>
            </div>

            {/* Sprint & Topspeed */}
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <Flame size={12} className="text-[#C00000]" /> Vollsprints & TopSpeed
                </span>
                <span className="text-[10px] font-black bg-red-100 text-[#C00000] px-1.5 py-0.5 border border-black">&gt; 25.2 km/h</span>
              </div>
              {editTracker ? (
                <div className="grid grid-cols-2 gap-1">
                  <input type="number" step="0.1" className="text-lg font-black border-2 border-black p-1" value={trackerMaxSpeed} onChange={(e) => setTrackerMaxSpeed(parseFloat(e.target.value))} />
                  <input type="number" className="text-lg font-black border-2 border-black p-1" value={trackerSprints} onChange={(e) => setTrackerSprints(parseInt(e.target.value))} />
                </div>
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black font-mono text-[#C00000]">
                    {trackerMaxSpeed} <span className="text-xs font-bold text-gray-600">km/h</span>
                  </div>
                  <div className="text-sm font-black font-mono text-gray-800 bg-red-50 border border-red-300 px-2 py-0.5">
                    {trackerSprints} Sprints
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-500 font-bold mt-1">Sprintdistanz: {trackerSprintDist} m</p>
            </div>

            {/* Herzfrequenz & Workload */}
            <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                <span className="text-[10px] font-black uppercase text-gray-500 flex items-center gap-1">
                  <HeartPulse size={12} className="text-rose-600" /> Puls & Workload
                </span>
                <span className="text-[10px] font-black bg-rose-100 text-rose-900 px-1.5 py-0.5 border border-black">Physio</span>
              </div>
              {editTracker ? (
                <div className="grid grid-cols-2 gap-1">
                  <input type="number" className="text-lg font-black border-2 border-black p-1" value={trackerAvgHr} onChange={(e) => setTrackerAvgHr(parseInt(e.target.value))} />
                  <input type="number" className="text-lg font-black border-2 border-black p-1" value={trackerWorkload} onChange={(e) => setTrackerWorkload(parseInt(e.target.value))} />
                </div>
              ) : (
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-black font-mono text-rose-700">
                    {trackerAvgHr} <span className="text-xs font-bold text-gray-600">bpm Ø</span>
                  </div>
                  <div className="text-xs font-black font-mono text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5">
                    Load: {trackerWorkload}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-gray-500 font-bold mt-1">Maximaler Puls: {trackerMaxHr} bpm</p>
            </div>
          </div>

          {/* Tactical & Physical Evaluation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap & Position Summary */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="border-b-4 border-black pb-2 flex items-center justify-between">
                <h3 className="font-black text-sm uppercase flex items-center gap-2">
                  <Compass size={18} className="text-emerald-700" /> Positionierung & Haupt-Aktionszone
                </h3>
                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-black">GPS-Heatmap</span>
              </div>

              <div className="bg-slate-900 text-white p-4 border-2 border-black font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-400 font-black">
                  <span>Hauptzone:</span>
                  <span>{trackerHeatmap}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-700 text-[11px]">
                  <div>Beschleunigungen: <strong className="text-amber-400">{trackerAccels} x</strong></div>
                  <div>Bremsungen (Decel): <strong className="text-blue-400">{trackerDecels} x</strong></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-700">Taktische Analyse-Zusammenfassung:</label>
                {editTracker ? (
                  <textarea 
                    className="w-full p-3 border-2 border-black font-bold text-xs bg-amber-50 h-28 focus:outline-none"
                    value={trackerTactical}
                    onChange={(e) => setTrackerTactical(e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-bold text-gray-800 bg-gray-50 p-3 border-2 border-black leading-relaxed">
                    {trackerTactical}
                  </p>
                )}
              </div>
            </div>

            {/* Medical & Load Recommendation */}
            <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <div className="border-b-4 border-black pb-2 flex items-center justify-between">
                <h3 className="font-black text-sm uppercase flex items-center gap-2">
                  <Shield size={18} className="text-blue-700" /> Physiologische & Medizinische Handlungsempfehlungen
                </h3>
                <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-900 px-2 py-0.5 border border-black">Steuerung</span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-700">Regeneration & Belastungsvorgaben:</label>
                {editTracker ? (
                  <textarea 
                    className="w-full p-3 border-2 border-black font-bold text-xs bg-amber-50 h-28 focus:outline-none"
                    value={trackerRecommendations}
                    onChange={(e) => setTrackerRecommendations(e.target.value)}
                  />
                ) : (
                  <p className="text-xs font-bold text-gray-800 bg-gray-50 p-3 border-2 border-black leading-relaxed">
                    {trackerRecommendations}
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border-2 border-black p-3 text-xs font-bold text-amber-900 flex items-center gap-3">
                <Sparkles size={20} className="text-amber-600 shrink-0" />
                <span>
                  <strong>KI-Steuerungshinweis:</strong> Belastung im nächsten Mannschaftstraining entsprechend der Sprintdistanz ({trackerSprintDist}m) individuell anpassen.
                </span>
              </div>
            </div>
          </div>

          {/* Tracker File Upload / Link Box */}
          <div className="bg-emerald-950 text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase flex items-center gap-2 text-emerald-400">
                <Cpu size={20} /> WG Tracker Import & Ordner-Synchronisation
              </h3>
              <p className="text-xs text-gray-300 font-medium">
                Sende neue Tracking-Rohdaten, GPS-Exporte oder MagentaCLOUD Links direkt in den Ordner von {selectedPlayer.firstName} {selectedPlayer.lastName}.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-6 py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 transition-all"
              >
                <Upload size={16} /> ⚡ Neue Datei / Text analysieren
              </button>
            </div>
          </div>

          {/* Import Modal */}
          {importModalOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black p-6 max-w-xl w-full shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-4">
                <div className="border-b-4 border-black pb-2 flex justify-between items-center">
                  <h3 className="font-black text-base uppercase flex items-center gap-2">
                    <Cpu size={20} className="text-blue-600" /> WG Tracker Rohdaten Importieren
                  </h3>
                  <button type="button" onClick={() => setImportModalOpen(false)} className="font-black text-sm p-1 border-2 border-black hover:bg-gray-100">✕</button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-700">Tracker-Dateiname / Link:</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border-2 border-black text-xs font-bold"
                    placeholder="z.B. WG__Tracker_Julian_Ehret_RNr_11 oder MagentaCLOUD Link..."
                    value={trackerFileName}
                    onChange={(e) => setTrackerFileName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-700">GPS CSV/Text Inhalt einfügen:</label>
                  <textarea 
                    className="w-full p-3 border-2 border-black text-xs font-mono h-32 focus:outline-none"
                    placeholder="Distance: 11.4km, HighSpeed: 820m, MaxSpeed: 32.8km/h, HeartRate: 168bpm..."
                    value={importRawText}
                    onChange={(e) => setImportRawText(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setImportModalOpen(false)}
                    className="px-4 py-2 border-2 border-black font-black text-xs uppercase hover:bg-gray-100"
                  >
                    Abbrechen
                  </button>
                  <button 
                    type="button"
                    onClick={async () => {
                      if (importRawText) {
                        const distMatch = importRawText.match(/(\d+[.,]?\d*)\s*km/i);
                        if (distMatch) setTrackerTotalDist(parseFloat(distMatch[1].replace(',', '.')));
                        const maxMatch = importRawText.match(/(\d+[.,]?\d*)\s*km\/h/i);
                        if (maxMatch) setTrackerMaxSpeed(parseFloat(maxMatch[1].replace(',', '.')));
                        const sprintMatch = importRawText.match(/(\d+)\s*sprint/i);
                        if (sprintMatch) setTrackerSprints(parseInt(sprintMatch[1]));
                      }
                      await handleSaveTrackerAnalysis();
                      setImportModalOpen(false);
                      setImportRawText('');
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white border-2 border-black font-black text-xs uppercase hover:bg-emerald-700 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                  >
                    ⚡ Analysieren & Im Ordner Speichern
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Past History in Folder */}
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="border-b-4 border-black pb-2 flex items-center justify-between">
              <h3 className="font-black uppercase text-base tracking-wider flex items-center gap-2">
                <FolderCheck size={20} className="text-blue-900" /> HISTORIE DER SESSiON- & SPIELANALYSEN IM ORDNER
              </h3>
              <span className="text-xs font-bold text-gray-500">
                {(selectedPlayer.trackerHistory?.length || 0) + 1} Eintrags-Analysen hinterlegt
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white font-black uppercase text-[10px]">
                    <th className="p-3 border-r border-black/30">Datum</th>
                    <th className="p-3 border-r border-black/30">Datei / Spiel</th>
                    <th className="p-3 border-r border-black/30 text-center">Distanz</th>
                    <th className="p-3 border-r border-black/30 text-center">Sprintdistanz</th>
                    <th className="p-3 border-r border-black/30 text-center">Max. Speed</th>
                    <th className="p-3 border-r border-black/30 text-center">Puls Ø</th>
                    <th className="p-3 border-r border-black/30">Taktisches Fazit</th>
                    <th className="p-3 text-center">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black font-bold">
                  <tr className="bg-emerald-50/60 hover:bg-emerald-100/80 transition-colors">
                    <td className="p-3 border-r border-black text-emerald-950 font-black">{new Date().toLocaleDateString('de-DE')}</td>
                    <td className="p-3 border-r border-black font-black text-xs">
                      {trackerFileName || `Tracker_${selectedPlayer.lastName}`}
                    </td>
                    <td className="p-3 border-r border-black text-center font-mono text-blue-900 font-black">{trackerTotalDist} km</td>
                    <td className="p-3 border-r border-black text-center font-mono text-amber-700 font-black">{trackerSprintDist} m</td>
                    <td className="p-3 border-r border-black text-center font-mono text-red-700 font-black">{trackerMaxSpeed} km/h</td>
                    <td className="p-3 border-r border-black text-center font-mono text-rose-800 font-black">{trackerAvgHr} bpm</td>
                    <td className="p-3 border-r border-black text-[11px] text-gray-700 truncate max-w-xs">{trackerTactical}</td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 border border-black">Aktiv</span>
                    </td>
                  </tr>

                  {(selectedPlayer.trackerHistory || []).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 border-r border-black font-mono text-gray-600">{item.uploadDate}</td>
                      <td className="p-3 border-r border-black font-black">{item.fileName || item.matchName}</td>
                      <td className="p-3 border-r border-black text-center font-mono">{item.totalDistanceKm} km</td>
                      <td className="p-3 border-r border-black text-center font-mono">{item.sprintDistanceM} m</td>
                      <td className="p-3 border-r border-black text-center font-mono">{item.maxSpeedKmh} km/h</td>
                      <td className="p-3 border-r border-black text-center font-mono">-</td>
                      <td className="p-3 border-r border-black text-[11px] text-gray-600 truncate max-w-xs">{item.tacticalSummary}</td>
                      <td className="p-3 text-center text-xs font-black text-gray-400">Archiv</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
