import React, { useState, useMemo, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  Compass,
  Map,
  List,
  Check,
  AlertCircle,
  X,
  FileDown,
  Printer,
  Pause,
  Play,
  Video
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell,
  CartesianGrid
} from 'recharts';
import { VideoSection } from '../VideoSection';
import { VideoClip } from '../../types';

interface PlayerPortalViewProps {
  players: Spieler[];
  sessionLogs: any[];
  onSaveLog: (log: any) => Promise<void>;
  onDeleteLog: (id: string) => Promise<void>;
  onUpdatePlayerDiagnostics?: (playerId: string, diagnostics: any) => Promise<void>;
  onUpdatePlayerStats?: (playerId: string, minutes: number, goals: number, assists: number) => Promise<void>;
  onUpdatePlayerDatenblatt?: (playerId: string, report: any) => Promise<void>;
  onUpdatePlayerTracker?: (playerId: string, trackerData: any) => Promise<void>;
  onUpdatePlayerMovementPoints?: (playerId: string, points: any[]) => Promise<void>;
  onUpdatePlayerVideos?: (playerId: string, videoClips: VideoClip[]) => Promise<void>;
  competitiveMatches?: any[];
  competitiveMinutes?: any[];
  testMatches?: any[];
  testMinutes?: any[];
}

export const PlayerPortalView: React.FC<PlayerPortalViewProps> = ({
  players,
  sessionLogs,
  onSaveLog,
  onDeleteLog,
  onUpdatePlayerDiagnostics,
  onUpdatePlayerStats,
  onUpdatePlayerDatenblatt,
  onUpdatePlayerTracker,
  onUpdatePlayerMovementPoints,
  onUpdatePlayerVideos,
  competitiveMatches = [],
  competitiveMinutes = [],
  testMatches = [],
  testMinutes = []
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
  const [portalView, setPortalView] = useState<'form' | 'datenblatt' | 'vergleich' | 'tracker' | 'spielanalyse' | 'video'>('tracker');
  const [editDatenblatt, setEditDatenblatt] = useState<boolean>(false);
  const [editTracker, setEditTracker] = useState<boolean>(false);

  // Spielanalyse & Bewegungsprofil States
  const [selectedMovementMatchId, setSelectedMovementMatchId] = useState<string | number>('');
  const [movementMinuteInput, setMovementMinuteInput] = useState<number>(45);
  const [movementMinuteFilter, setMovementMinuteFilter] = useState<number>(90);
  const [movementViewMode, setMovementViewMode] = useState<'combined' | 'heatmap' | 'vectors'>('combined');
  const [selectedActionType, setSelectedActionType] = useState<'sprint' | 'run' | 'walk' | 'defensive'>('sprint');
  const [isPlayingAnimation, setIsPlayingAnimation] = useState<boolean>(false);
  const [animationMinute, setAnimationMinute] = useState<number>(1);

  // Animation interval timer for movement trajectory playback
  useEffect(() => {
    let timer: any;
    if (isPlayingAnimation) {
      timer = setInterval(() => {
        setAnimationMinute(prev => {
          if (prev >= 90) {
            setIsPlayingAnimation(false);
            return 90;
          }
          return prev + 1;
        });
      }, 150);
    }
    return () => clearInterval(timer);
  }, [isPlayingAnimation]);

  // Derive all matches list
  const allMatches = useMemo(() => {
    const list: any[] = [];
    competitiveMatches.forEach(m => list.push({ ...m, type: 'Pflichtspiel' }));
    testMatches.forEach(m => list.push({ ...m, type: 'Testspiel' }));
    return list.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  }, [competitiveMatches, testMatches]);

  // Set default selected match if not set
  useEffect(() => {
    if (!selectedMovementMatchId && allMatches.length > 0) {
      setSelectedMovementMatchId(allMatches[0].id);
    }
  }, [allMatches, selectedMovementMatchId]);

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

  // PDF / Document Parsing & Export States
  const portalFileInputRef = useRef<HTMLInputElement>(null);
  const [portalDragActive, setPortalDragActive] = useState<boolean>(false);
  const [parsedDocModalOpen, setParsedDocModalOpen] = useState<boolean>(false);
  const [parsedDocData, setParsedDocData] = useState<any>(null);
  const [parsedDocFileName, setParsedDocFileName] = useState<string>('');
  const [isExportingDataSheetPDF, setIsExportingDataSheetPDF] = useState<boolean>(false);

  const processPortalPDFFile = async (file: File) => {
    if (!file) return;
    setParsingDoc(true);
    setParsingError('');
    setParsingSuccess(`Analysiere "${file.name}" per Gemini KI...`);
    setParsedDocFileName(file.name);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const commaIdx = result.indexOf(',');
          resolve(commaIdx !== -1 ? result.substring(commaIdx + 1) : result);
        };
        reader.onerror = (error) => reject(error);
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

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
      setParsedDocData(parsed);
      setParsedDocModalOpen(true);
      setParsingSuccess(`Dokument "${file.name}" erfolgreich analysiert! Bitte Ergebnisse prüfen.`);
    } catch (err: any) {
      console.error(err);
      setParsingError(err.message || "Datei konnte nicht gelesen oder verarbeitet werden.");
    } finally {
      setParsingDoc(false);
    }
  };

  const handlePortalFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPortalPDFFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handlePortalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPortalDragActive(true);
  };

  const handlePortalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPortalDragActive(false);
  };

  const handlePortalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPortalDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPortalPDFFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyParsedDoc = () => {
    if (!parsedDocData) return;

    if (parsedDocData.date) setDate(parsedDocData.date);
    if (parsedDocData.focus) setFocus(parsedDocData.focus);
    if (parsedDocData.duration) setDuration(Number(parsedDocData.duration));
    if (parsedDocData.rpe) setRpe(Number(parsedDocData.rpe));

    if (parsedDocData.type === 'Match' || parsedDocData.type === 'match') {
      setType('Match');
      if (parsedDocData.matchMinutes !== undefined) setMatchMinutes(Number(parsedDocData.matchMinutes));
      if (parsedDocData.goals !== undefined) setGoals(Number(parsedDocData.goals));
      if (parsedDocData.assists !== undefined) setAssists(Number(parsedDocData.assists));
      if (parsedDocData.passAccuracy !== undefined) setPassAccuracy(Number(parsedDocData.passAccuracy));
      if (parsedDocData.tackleRate !== undefined) setTackleRate(Number(parsedDocData.tackleRate));
    } else {
      setType('Training');
    }

    if (parsedDocData.sprint10m || parsedDocData.sprint30m || parsedDocData.yoyotest || parsedDocData.jumpHeight) {
      setUpdateKpis(true);
      if (parsedDocData.sprint10m) {
        setSprint10m(parsedDocData.sprint10m);
        setKpi10m(parsedDocData.sprint10m);
      }
      if (parsedDocData.sprint30m) {
        setSprint30m(parsedDocData.sprint30m);
        setKpi30m(parsedDocData.sprint30m);
      }
      if (parsedDocData.yoyotest) {
        setYoyotest(parsedDocData.yoyotest);
        setKpiYoyo(parsedDocData.yoyotest);
      }
      if (parsedDocData.jumpHeight) {
        setJumpHeight(parsedDocData.jumpHeight);
        setKpiJump(parsedDocData.jumpHeight);
      }
    }

    if (parsedDocData.trackerTotalDist) setTrackerTotalDist(parsedDocData.trackerTotalDist);
    if (parsedDocData.trackerHighSpeed) setTrackerHighSpeed(parsedDocData.trackerHighSpeed);
    if (parsedDocData.trackerMaxSpeed) setTrackerMaxSpeed(parsedDocData.trackerMaxSpeed);
    if (parsedDocData.trackerSprints) setTrackerSprints(parsedDocData.trackerSprints);
    if (parsedDocData.trackerAvgHr) setTrackerAvgHr(parsedDocData.trackerAvgHr);
    if (parsedDocData.trackerMaxHr) setTrackerMaxHr(parsedDocData.trackerMaxHr);
    if (parsedDocFileName) setTrackerFileName(parsedDocFileName);

    setPortalView('form');
    setParsedDocModalOpen(false);
    setParsingSuccess(`Daten aus "${parsedDocFileName}" erfolgreich in das Spielerprofil übernommen!`);
  };

  const handleExportDataSheetPDF = async () => {
    setIsExportingDataSheetPDF(true);
    try {
      const element = document.getElementById('player-data-sheet-pdf');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const nameStr = selectedPlayer ? `${selectedPlayer.lastName}_${selectedPlayer.firstName}` : 'Spieler';
      pdf.save(`Spielerdatenblatt_${nameStr}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Fehler beim Erstellen der PDF. Bitte versuche 'Report drucken / PDF'.");
    } finally {
      setIsExportingDataSheetPDF(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processPortalPDFFile(file);
    e.target.value = '';
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

  // Played matches with starting lineups vs subs minutes
  const playedMatches = useMemo(() => {
    if (!selectedPlayer) return [];
    const list: any[] = [];
    
    // Competitive matches
    competitiveMatches.forEach(m => {
      const rec = competitiveMinutes.find(r => r.playerId === selectedPlayer.id);
      const mins = rec?.minutes?.[m.id] || 0;
      if (mins > 0) {
        const details = rec?.details?.[m.id];
        const isSubstitute = details && details.start && details.start !== "" && details.start !== "00:00";
        list.push({
          matchId: m.id,
          opponent: m.opponent,
          date: m.date || '',
          type: 'Pflichtspiel',
          minutes: mins,
          startelfMinutes: isSubstitute ? 0 : mins,
          einwechslungMinutes: isSubstitute ? mins : 0,
          isSubstitute
        });
      }
    });

    // Test matches
    testMatches.forEach(m => {
      const rec = testMinutes.find(r => r.playerId === selectedPlayer.id);
      const mins = rec?.minutes?.[m.id] || 0;
      if (mins > 0) {
        const details = rec?.details?.[m.id];
        const isSubstitute = details && details.start && details.start !== "" && details.start !== "00:00";
        list.push({
          matchId: m.id,
          opponent: m.opponent,
          date: m.date || '',
          type: 'Testspiel',
          minutes: mins,
          startelfMinutes: isSubstitute ? 0 : mins,
          einwechslungMinutes: isSubstitute ? mins : 0,
          isSubstitute
        });
      }
    });

    // Chronological sorting
    return list.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
  }, [selectedPlayer, competitiveMatches, competitiveMinutes, testMatches, testMinutes]);

  // Plotted points for the currently selected player and match
  const filteredPointsForMatch = useMemo(() => {
    if (!selectedPlayer || !selectedMovementMatchId) return [];
    return (selectedPlayer.movementPoints || []).filter(
      pt => String(pt.matchId) === String(selectedMovementMatchId)
    );
  }, [selectedPlayer, selectedMovementMatchId]);

  // Points filtered by current slider minute and sorted chronologically
  const pointsBeforeFilter = useMemo(() => {
    return filteredPointsForMatch
      .filter(pt => pt.minute <= (isPlayingAnimation ? animationMinute : movementMinuteFilter))
      .sort((a, b) => a.minute - b.minute);
  }, [filteredPointsForMatch, movementMinuteFilter, isPlayingAnimation, animationMinute]);

  // Interpolated position for smooth animation replay along the trajectory path
  const animatedPlayerPos = useMemo(() => {
    const pts = [...filteredPointsForMatch].sort((a, b) => a.minute - b.minute);
    if (pts.length === 0) return null;
    const currentMin = isPlayingAnimation ? animationMinute : movementMinuteFilter;

    if (currentMin <= pts[0].minute) {
      return { x: pts[0].x, y: pts[0].y, actionType: pts[0].actionType || 'run', label: pts[0].label || `Min. ${pts[0].minute}` };
    }
    if (currentMin >= pts[pts.length - 1].minute) {
      const last = pts[pts.length - 1];
      return { x: last.x, y: last.y, actionType: last.actionType || 'run', label: last.label || `Min. ${last.minute}` };
    }

    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      if (currentMin >= p1.minute && currentMin <= p2.minute) {
        const factor = (currentMin - p1.minute) / (p2.minute - p1.minute);
        const interpolatedX = p1.x + (p2.x - p1.x) * factor;
        const interpolatedY = p1.y + (p2.y - p1.y) * factor;
        return {
          x: interpolatedX,
          y: interpolatedY,
          actionType: p2.actionType || 'run',
          label: `${p1.minute}' ➔ ${p2.minute}': ${p2.label || 'Laufbewegung'}`
        };
      }
    }
    return { x: pts[0].x, y: pts[0].y, actionType: pts[0].actionType || 'run' };
  }, [filteredPointsForMatch, isPlayingAnimation, animationMinute, movementMinuteFilter]);

  // Auto-generate realistic GPS trajectory points based on player position
  const handleGeneratePositionalTrajectory = () => {
    if (!selectedPlayer || !selectedMovementMatchId) return;

    const pos = selectedPlayer.position?.toUpperCase() || 'ZM';
    let templatePoints: { minute: number; x: number; y: number; actionType: 'sprint' | 'run' | 'walk' | 'defensive'; label: string }[] = [];

    if (pos === 'TW') {
      templatePoints = [
        { minute: 5, x: 8, y: 50, actionType: 'walk', label: 'Torlinie Grundposition' },
        { minute: 18, x: 16, y: 38, actionType: 'run', label: 'Abstoß / Passwinkel links' },
        { minute: 32, x: 12, y: 62, actionType: 'run', label: 'Flanke abfangen rechts' },
        { minute: 45, x: 8, y: 50, actionType: 'walk', label: 'Halbzeit Torlinie' },
        { minute: 58, x: 22, y: 50, actionType: 'sprint', label: 'Mitspielender TW (Herausrücken)' },
        { minute: 74, x: 10, y: 42, actionType: 'sprint', label: '1-gegen-1 Klärung' },
        { minute: 90, x: 8, y: 50, actionType: 'walk', label: 'Schlussphase Torlinie' },
      ];
    } else if (pos.includes('IV')) {
      templatePoints = [
        { minute: 5, x: 25, y: 45, actionType: 'walk', label: 'Abwehrkette Grundordnung' },
        { minute: 15, x: 38, y: 42, actionType: 'run', label: 'Vorschieben im Aufbauspiel' },
        { minute: 28, x: 18, y: 35, actionType: 'defensive', label: 'Tiefensicherung / Laufduell' },
        { minute: 40, x: 28, y: 52, actionType: 'run', label: 'Diagonaler Ballgewinn' },
        { minute: 52, x: 32, y: 40, actionType: 'sprint', label: 'Gegenpressing nach Ballverlust' },
        { minute: 68, x: 85, y: 50, actionType: 'sprint', label: 'Offensiv-Ecke Kopfballduell' },
        { minute: 78, x: 22, y: 48, actionType: 'defensive', label: 'Rückzug Abwehrriegel' },
        { minute: 90, x: 24, y: 45, actionType: 'walk', label: 'Schlussabsicherung' },
      ];
    } else if (pos.includes('RV') || pos.includes('LV')) {
      const isRight = pos.includes('RV');
      const sideY = isRight ? 82 : 18;
      templatePoints = [
        { minute: 5, x: 28, y: sideY, actionType: 'walk', label: 'Außenverteidiger Grundstellung' },
        { minute: 16, x: 55, y: sideY, actionType: 'run', label: 'Aufrücken Flügelzone' },
        { minute: 28, x: 82, y: sideY - 5, actionType: 'sprint', label: 'Flankensprint Grundlinie' },
        { minute: 42, x: 30, y: sideY, actionType: 'defensive', label: 'Rücklauf Konterabsicherung' },
        { minute: 55, x: 68, y: sideY, actionType: 'sprint', label: 'Überlaufen des Flügelstürmers' },
        { minute: 72, x: 78, y: 50, actionType: 'sprint', label: 'Einrücken / Torgefahr 16m' },
        { minute: 88, x: 25, y: sideY, actionType: 'defensive', label: 'Kette schließen' },
      ];
    } else if (pos.includes('ST')) {
      templatePoints = [
        { minute: 5, x: 68, y: 50, actionType: 'walk', label: 'Anspielstation Zentrum' },
        { minute: 14, x: 86, y: 38, actionType: 'sprint', label: 'Tiefenlauf Schnittstelle' },
        { minute: 28, x: 92, y: 52, actionType: 'sprint', label: 'Strafraum-Szenario / Abschluss' },
        { minute: 42, x: 62, y: 45, actionType: 'defensive', label: 'Anlaufpressing gegnerische IV' },
        { minute: 58, x: 84, y: 70, actionType: 'run', label: 'Ausweichen auf den Flügel' },
        { minute: 72, x: 88, y: 48, actionType: 'sprint', label: 'Kopfball-Präsenz 11m-Punkt' },
        { minute: 86, x: 75, y: 55, actionType: 'run', label: 'Festmachen des Ballempfangs' },
      ];
    } else {
      templatePoints = [
        { minute: 5, x: 48, y: 50, actionType: 'walk', label: 'Zentrales Mittelfeld Anpfiff' },
        { minute: 14, x: 65, y: 38, actionType: 'run', label: 'Aufrücken / Box-to-Box' },
        { minute: 26, x: 82, y: 45, actionType: 'sprint', label: 'Torgefährlicher Vorstoss 16m' },
        { minute: 38, x: 38, y: 60, actionType: 'defensive', label: 'Defensiver Umschaltlauf' },
        { minute: 52, x: 55, y: 48, actionType: 'run', label: 'Spielaufbau / Verteilerrolle' },
        { minute: 66, x: 76, y: 28, actionType: 'sprint', label: 'Flügelunterstützung' },
        { minute: 80, x: 32, y: 50, actionType: 'defensive', label: 'Abfangpass Tiefenabsicherung' },
        { minute: 90, x: 58, y: 48, actionType: 'run', label: 'Schlussoffensive Pressing' },
      ];
    }

    const generatedPoints = templatePoints.map((pt, idx) => ({
      id: `gen_point_${Date.now()}_${idx}`,
      matchId: selectedMovementMatchId,
      minute: pt.minute,
      x: pt.x,
      y: pt.y,
      actionType: pt.actionType,
      label: pt.label
    }));

    const existingOtherMatchPoints = (selectedPlayer.movementPoints || []).filter(
      pt => String(pt.matchId) !== String(selectedMovementMatchId)
    );
    const updatedPoints = [...existingOtherMatchPoints, ...generatedPoints];

    onUpdatePlayerMovementPoints?.(selectedPlayer.id, updatedPoints);
  };

  const handleClearAllMatchPoints = () => {
    if (!selectedPlayer || !selectedMovementMatchId) return;
    if (window.confirm('Möchten Sie wirklich alle Laufweg-Punkte für dieses Spiel löschen?')) {
      const remainingPoints = (selectedPlayer.movementPoints || []).filter(
        pt => String(pt.matchId) !== String(selectedMovementMatchId)
      );
      onUpdatePlayerMovementPoints?.(selectedPlayer.id, remainingPoints);
    }
  };

  // Handle setting a point on the pitch
  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedPlayer || !selectedMovementMatchId) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const actionLabels: Record<string, string> = {
      sprint: 'Vollsprint / Tempoakzent',
      run: 'Laufbewegung / Umschalten',
      walk: 'Positionierung / Trotten',
      defensive: 'Defensivlauf / Pressing'
    };

    const newPoint = {
      id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      matchId: selectedMovementMatchId,
      minute: movementMinuteInput,
      x: parseFloat(x.toFixed(1)),
      y: parseFloat(y.toFixed(1)),
      actionType: selectedActionType,
      label: actionLabels[selectedActionType] || 'Laufbewegung'
    };

    const currentPoints = selectedPlayer.movementPoints || [];
    const updatedPoints = [...currentPoints, newPoint];
    onUpdatePlayerMovementPoints?.(selectedPlayer.id, updatedPoints);
  };

  // Handle deleting a plotted point
  const handleDeletePoint = (pointId: string) => {
    if (!selectedPlayer) return;
    const currentPoints = selectedPlayer.movementPoints || [];
    const updatedPoints = currentPoints.filter(pt => pt.id !== pointId);
    onUpdatePlayerMovementPoints?.(selectedPlayer.id, updatedPoints);
  };

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
        playerName: selectedPlayer ? selectedPlayer.lastName : 'Unbekannt',
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
        name: p.lastName,
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
          playerName: selectedPlayer.lastName,
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
    <div 
      className="max-w-6xl mx-auto p-4 space-y-6 relative"
      onDragOver={handlePortalDragOver}
      onDragLeave={handlePortalDragLeave}
      onDrop={handlePortalDrop}
    >
      {/* Hidden File Input for PDF / Image Upload */}
      <input
        type="file"
        ref={portalFileInputRef}
        onChange={handlePortalFileInputChange}
        accept="application/pdf,image/*,.csv"
        className="hidden"
      />

      {/* Drag & Drop Fullscreen Overlay */}
      {portalDragActive && (
        <div className="absolute inset-0 z-50 bg-[#0D4433]/90 backdrop-blur-sm border-8 border-dashed border-white flex flex-col items-center justify-center text-white p-8 rounded-lg shadow-2xl">
          <Sparkles size={64} className="animate-bounce mb-4 text-emerald-300" />
          <h2 className="text-3xl font-black uppercase tracking-wider text-center">
            PDF ODER BERICHT HIER ABLEGEN
          </h2>
          <p className="text-sm font-bold text-emerald-100 mt-2 text-center max-w-md">
            Gemini KI extrahiert Trainingsdaten, Match-Stats, Garmin/TRACKTICS GPS und Sprintzeiten automatisch für {selectedPlayer ? selectedPlayer.lastName : 'den Spieler'}!
          </p>
        </div>
      )}

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
                #{p.number} {p.lastName} ({p.position})
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
                {selectedPlayer.lastName}
              </h4>
              <p className="text-[10px] font-bold text-gray-500 mt-1">
                Trikot-Nr. {selectedPlayer.number} • {selectedPlayer.position}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Persistent KI Upload & Quick Action Banner */}
      {selectedPlayer && (
        <div className="bg-[#0D4433] text-white border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-800 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-emerald-300 shrink-0">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <span>KI-PDF-PARSER & AUTOMATISCHER IMPORT</span>
                <span className="text-[10px] bg-emerald-400 text-black font-black px-1.5 py-0.5 rounded uppercase">BETA</span>
              </h3>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Lade ein PDF (Garmin, TRACKTICS, Leistungsblatt) oder Foto hoch. Gemini füllt die Daten für <strong>{selectedPlayer.lastName}</strong> aus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => portalFileInputRef.current?.click()}
            disabled={parsingDoc}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black border-2 border-black font-black text-xs uppercase tracking-wider transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2 shrink-0"
          >
            {parsingDoc ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Analysiere PDF...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>PDF / Bericht hochladen</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Parsed Doc Review Modal */}
      {parsedDocModalOpen && parsedDocData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-4 border-black p-6 max-w-2xl w-full shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b-4 border-black pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#0D4433] text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest border border-black">
                    GEMINI KI ANALYSE ERFOLGREICH
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-500 truncate max-w-[200px]">
                    {parsedDocFileName}
                  </span>
                </div>
                <h2 className="text-2xl font-black uppercase mt-1 tracking-tight">
                  GEPARSETE DOKUMENTENDATEN
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setParsedDocModalOpen(false)}
                className="p-1.5 border-2 border-black bg-gray-100 hover:bg-red-100 text-black transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-gray-50 p-3 border-2 border-black">
                <span className="text-[10px] text-gray-500 uppercase font-black block">Datum</span>
                <span className="font-black text-sm">{parsedDocData.date || '—'}</span>
              </div>
              <div className="bg-gray-50 p-3 border-2 border-black">
                <span className="text-[10px] text-gray-500 uppercase font-black block">Typ</span>
                <span className="font-black text-sm">{parsedDocData.type || 'Training'}</span>
              </div>
              <div className="bg-gray-50 p-3 border-2 border-black">
                <span className="text-[10px] text-gray-500 uppercase font-black block">Dauer & RPE</span>
                <span className="font-black text-sm">{parsedDocData.duration || 0} min • RPE {parsedDocData.rpe || '—'}</span>
              </div>
            </div>

            {/* Details Sections */}
            <div className="space-y-3 text-xs">
              <div className="bg-emerald-50 p-3 border-2 border-black space-y-1">
                <span className="font-black uppercase text-[10px] text-emerald-900 tracking-wider">Fokus / Schwerpunkt</span>
                <p className="font-bold text-sm text-black">{parsedDocData.focus || 'Kein Schwerpunkt'}</p>
              </div>

              {(parsedDocData.matchMinutes || parsedDocData.goals || parsedDocData.assists || parsedDocData.passAccuracy) && (
                <div className="bg-amber-50 p-3 border-2 border-black">
                  <span className="font-black uppercase text-[10px] text-amber-900 tracking-wider block mb-1">Match Statistiken</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    <div><strong>Einsatz:</strong> {parsedDocData.matchMinutes || 0} Min</div>
                    <div><strong>Tore/Assists:</strong> {parsedDocData.goals || 0} T / {parsedDocData.assists || 0} A</div>
                    <div><strong>Passquote:</strong> {parsedDocData.passAccuracy ? parsedDocData.passAccuracy + '%' : '—'}</div>
                    <div><strong>Zweikampf:</strong> {parsedDocData.tackleRate ? parsedDocData.tackleRate + '%' : '—'}</div>
                  </div>
                </div>
              )}

              {(parsedDocData.sprint10m || parsedDocData.sprint30m || parsedDocData.yoyotest || parsedDocData.jumpHeight) && (
                <div className="bg-blue-50 p-3 border-2 border-black">
                  <span className="font-black uppercase text-[10px] text-blue-900 tracking-wider block mb-1">Athletik KPIs</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    {parsedDocData.sprint10m && <div><strong>10m Sprint:</strong> {parsedDocData.sprint10m}</div>}
                    {parsedDocData.sprint30m && <div><strong>30m Sprint:</strong> {parsedDocData.sprint30m}</div>}
                    {parsedDocData.yoyotest && <div><strong>Yo-Yo Test:</strong> {parsedDocData.yoyotest}</div>}
                    {parsedDocData.jumpHeight && <div><strong>Sprungkraft:</strong> {parsedDocData.jumpHeight}</div>}
                  </div>
                </div>
              )}

              {(parsedDocData.trackerTotalDist || parsedDocData.trackerMaxSpeed) && (
                <div className="bg-purple-50 p-3 border-2 border-black">
                  <span className="font-black uppercase text-[10px] text-purple-900 tracking-wider block mb-1">GPS & Tracker Daten</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                    {parsedDocData.trackerTotalDist && <div><strong>Distanz:</strong> {parsedDocData.trackerTotalDist} km</div>}
                    {parsedDocData.trackerHighSpeed && <div><strong>High Speed:</strong> {parsedDocData.trackerHighSpeed} m</div>}
                    {parsedDocData.trackerMaxSpeed && <div><strong>Max Speed:</strong> {parsedDocData.trackerMaxSpeed} km/h</div>}
                    {parsedDocData.trackerSprints && <div><strong>Sprints:</strong> {parsedDocData.trackerSprints}</div>}
                    {parsedDocData.trackerAvgHr && <div><strong>Puls Schnitt:</strong> {parsedDocData.trackerAvgHr} bpm</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t-2 border-black">
              <button
                type="button"
                onClick={handleApplyParsedDoc}
                className="flex-1 py-3 px-4 bg-[#0D4433] hover:bg-emerald-900 text-white font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                <Check size={16} /> In Spielerprofil & Formular übernehmen
              </button>
              <button
                type="button"
                onClick={() => setParsedDocModalOpen(false)}
                className="py-3 px-4 bg-gray-200 hover:bg-gray-300 text-black font-black text-xs uppercase tracking-wider border-2 border-black flex items-center justify-center gap-2"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

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
          <button
            type="button"
            onClick={() => setPortalView('spielanalyse')}
            className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-t-4 sm:border-t-0 sm:border-l-4 border-black flex items-center justify-center gap-2 ${portalView === 'spielanalyse' ? 'bg-purple-900 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Compass size={16} /> 📋 Spielanalyse & Bewegungsprofil
          </button>
          <button
            type="button"
            onClick={() => setPortalView('video')}
            className={`flex-1 py-3 px-4 font-black text-xs uppercase tracking-wider transition-all border-t-4 sm:border-t-0 sm:border-l-4 border-black flex items-center justify-center gap-2 ${portalView === 'video' ? 'bg-red-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            <Video size={16} /> 🎬 Video-Highlights & Szenen
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
                onClick={handleExportDataSheetPDF}
                disabled={isExportingDataSheetPDF}
                className="bg-[#0D4433] text-white hover:bg-emerald-900 px-4 py-2 border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors"
              >
                {isExportingDataSheetPDF ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} PDF Herunterladen
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-white text-black hover:bg-gray-50 px-4 py-2 border-2 border-black font-black uppercase text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                <Printer size={14} /> Drucken / System-PDF
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
                SPIELER: {selectedPlayer?.lastName?.toUpperCase()}
              </div>
            </div>

            {/* METADATA GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 border-2 border-black text-xs">
              <div>
                <span className="font-black uppercase text-gray-500 block text-[9px] tracking-wide">Spieler</span>
                <span className="font-black text-sm uppercase">{selectedPlayer?.lastName}</span>
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
                            <span className="text-[7px] font-black text-gray-400 w-12 truncate">{p1.lastName}</span>
                            <div className="flex-1 h-2 bg-gray-200 border border-black rounded-none overflow-hidden">
                              <div className={`h-full border-r border-black ${p1Wins ? 'bg-[#0D4433]' : 'bg-gray-500'}`} style={{ width: width1 }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[7px] font-black text-gray-400 w-12 truncate">{p2.lastName}</span>
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
                    <XAxis dataKey="lastName" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#000000" />
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
                    <XAxis dataKey="lastName" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#000000" />
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
      ) : portalView === 'tracker' ? (
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
                  {selectedPlayer.lastName} (#{selectedPlayer.number})
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
                Sende neue Tracking-Rohdaten, GPS-Exporte oder MagentaCLOUD Links direkt in den Ordner von {selectedPlayer.lastName}.
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
      ) : portalView === 'spielanalyse' ? (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-black text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={20} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Spielanalyse & Bewegungsprofil (Heatmap)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-wider italic">
              {selectedPlayer.lastName} (#{selectedPlayer.number})
            </h2>
            <p className="text-xs text-gray-300 font-bold mt-1">
              Einsatzzeiten-Analyse & Manuelle Positions-Erfassung
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left/Main Column: Einsatzzeiten (Bar Chart) & Plotted Points */}
            <div className="xl:col-span-6 space-y-8">
              {/* Card 1: Einsatzzeiten-Diagramm */}
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-2 border-black pb-2 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#0D4433]" />
                    <h3 className="font-black uppercase text-sm tracking-wider">Einsatzzeiten-Diagramm</h3>
                  </div>
                  <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded">
                    STARTELF VS. EINWECHSLUNG
                  </span>
                </div>

                {playedMatches.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <Clock size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-xs uppercase">Keine Einsatzzeiten für Pflicht- oder Testspiele erfasst.</p>
                    <p className="text-[10px] uppercase mt-1">Trage Einsatzminuten in der Spielplanung ein.</p>
                  </div>
                ) : (
                  <div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={playedMatches}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="opponent" 
                            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#000' }}
                            stroke="#000"
                            strokeWidth={2}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fontWeight: 'bold', fill: '#000' }}
                            stroke="#000"
                            strokeWidth={2}
                            domain={[0, 90]}
                          />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '3px solid #000',
                              borderRadius: '0px',
                              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              fontWeight: 'bold',
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                          />
                          <Bar name="Startelf (Mins)" dataKey="startelfMinutes" stackId="a" fill="#0D4433" />
                          <Bar name="Einwechselung (Mins)" dataKey="einwechslungMinutes" stackId="a" fill="#C00000" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 border-2 border-black p-3 bg-gray-50 flex flex-wrap gap-4 text-xs font-black uppercase">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#0D4433] border border-black" />
                        <span>Startelf-Spiele: {playedMatches.filter(m => !m.isSubstitute).length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#C00000] border border-black" />
                        <span>Einwechslungen: {playedMatches.filter(m => m.isSubstitute).length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Gesamtspielzeit: {playedMatches.reduce((acc, m) => acc + m.minutes, 0)} MIN</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: List of plotted points */}
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-2 border-black pb-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <List size={18} className="text-blue-900" />
                    <h3 className="font-black uppercase text-sm tracking-wider">Erfasste Positionspunkte</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 rounded">
                      {filteredPointsForMatch.length} PLOT-PUNKTE
                    </span>
                    {filteredPointsForMatch.length > 0 && (
                      <button
                        onClick={handleClearAllMatchPoints}
                        className="text-[10px] font-black uppercase text-red-600 hover:text-red-800 underline"
                        title="Alle Punkte zurücksetzen"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto-generate button */}
                <div className="mb-4">
                  <button
                    onClick={handleGeneratePositionalTrajectory}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase text-xs p-2.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Zap size={14} className="animate-pulse text-yellow-300" />
                    <span>Laufwege für Position ({selectedPlayer?.position || 'ZM'}) generieren</span>
                  </button>
                  <p className="text-[9px] font-bold text-gray-500 uppercase text-center mt-1">
                    Erzeugt automatisch realistische Match-Laufwege & GPS-Szenarien von Min. 1-90
                  </p>
                </div>

                {filteredPointsForMatch.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <MapPin size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-xs uppercase">Noch keine Bewegungspunkte für dieses Spiel gezeichnet.</p>
                    <p className="text-[10px] uppercase mt-1">Nutze den Button oben oder klicke rechts auf das Spielfeld.</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border-2 border-black">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black text-white font-black uppercase tracking-wider text-[10px] sticky top-0">
                        <tr>
                          <th className="p-2">Minute</th>
                          <th className="p-2">Aktionstyp</th>
                          <th className="p-2">Beschreibung</th>
                          <th className="p-2 text-center">Löschen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-black font-bold divide-black/10">
                        {filteredPointsForMatch
                          .sort((a, b) => a.minute - b.minute)
                          .map((pt) => {
                            const act = pt.actionType || 'run';
                            const badgeBg = act === 'sprint' ? 'bg-red-100 text-red-800 border-red-500' : act === 'defensive' ? 'bg-blue-100 text-blue-800 border-blue-500' : act === 'walk' ? 'bg-green-100 text-green-800 border-green-500' : 'bg-amber-100 text-amber-800 border-amber-500';
                            const badgeText = act === 'sprint' ? 'Sprint' : act === 'defensive' ? 'Defensiv' : act === 'walk' ? 'Position' : 'Tempolauf';
                            return (
                              <tr key={pt.id} className="hover:bg-gray-50">
                                <td className="p-2 font-mono font-black text-[#C00000]">Min. {pt.minute}</td>
                                <td className="p-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${badgeBg}`}>
                                    {badgeText}
                                  </span>
                                </td>
                                <td className="p-2 text-[10px] text-gray-700 font-bold truncate max-w-[120px]">
                                  {pt.label || `X: ${pt.x}% | Y: ${pt.y}%`}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    onClick={() => handleDeletePoint(pt.id)}
                                    className="text-red-600 hover:text-red-900 transition-colors p-1"
                                    title="Punkt löschen"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Interactive Heatmap & Spielfeld */}
            <div className="xl:col-span-6 space-y-8">
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="border-b-2 border-black pb-2 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Map size={18} className="text-green-700" />
                    <h3 className="font-black uppercase text-sm tracking-wider">Interaktive Bewegungserfassung & Laufwege</h3>
                  </div>
                  
                  {/* Match Selection Dropdown */}
                  <select
                    className="bg-gray-100 border-2 border-black px-2 py-1 font-black text-xs outline-none focus:bg-white"
                    value={selectedMovementMatchId}
                    onChange={(e) => {
                      setSelectedMovementMatchId(e.target.value);
                      setMovementMinuteFilter(90);
                      setIsPlayingAnimation(false);
                    }}
                  >
                    <option value="">-- Spiel auswählen --</option>
                    {allMatches.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.date || 'Ohne Datum'} - {m.opponent} ({m.type})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedMovementMatchId ? (
                  <div className="py-24 text-center text-gray-400">
                    <Trophy size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="font-bold text-xs uppercase">Bitte wähle ein Spiel aus der Liste aus, um das Bewegungsprofil zu bearbeiten.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* View Mode & Action Type Selector Bar */}
                    <div className="space-y-3 border-2 border-black p-3 bg-gray-50">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">Ansichtsmodus:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setMovementViewMode('combined')}
                            className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black transition-all ${
                              movementViewMode === 'combined' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                            }`}
                          >
                            ⚡ Kombiniert
                          </button>
                          <button
                            onClick={() => setMovementViewMode('vectors')}
                            className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black transition-all ${
                              movementViewMode === 'vectors' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                            }`}
                          >
                            📐 Nur Laufwege
                          </button>
                          <button
                            onClick={() => setMovementViewMode('heatmap')}
                            className={`px-2 py-1 text-[10px] font-black uppercase border-2 border-black transition-all ${
                              movementViewMode === 'heatmap' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                            }`}
                          >
                            🔴 Nur Heatmap
                          </button>
                        </div>
                      </div>

                      {/* Setup tools: Minute & Action Intensity Input before plot */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider mb-1">
                            Spielminute für nächsten Plot
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={movementMinuteInput}
                              onChange={(e) => setMovementMinuteInput(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 bg-white border-2 border-black p-1 text-center font-black outline-none text-xs"
                            />
                            <span className="text-[9px] font-bold text-gray-500 uppercase">
                              (Min. 1-120)
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider mb-1">
                            Aktionstyp beim Klick
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            <button
                              onClick={() => setSelectedActionType('sprint')}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase border border-black rounded ${
                                selectedActionType === 'sprint' ? 'bg-red-600 text-white' : 'bg-white text-red-700 hover:bg-red-50'
                              }`}
                            >
                              🔴 Sprint
                            </button>
                            <button
                              onClick={() => setSelectedActionType('run')}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase border border-black rounded ${
                                selectedActionType === 'run' ? 'bg-amber-500 text-white' : 'bg-white text-amber-700 hover:bg-amber-50'
                              }`}
                            >
                              🟡 Tempolauf
                            </button>
                            <button
                              onClick={() => setSelectedActionType('defensive')}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase border border-black rounded ${
                                selectedActionType === 'defensive' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'
                              }`}
                            >
                              🔵 Defensiv
                            </button>
                            <button
                              onClick={() => setSelectedActionType('walk')}
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase border border-black rounded ${
                                selectedActionType === 'walk' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              🟢 Position
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Football Field */}
                    <div className="relative">
                      {/* Grid/Striped pitch container */}
                      <div 
                        onClick={handlePitchClick}
                        className="w-full relative rounded-lg border-4 border-black overflow-hidden shadow-md cursor-crosshair select-none"
                        style={{
                          aspectRatio: '1.54',
                          background: 'repeating-linear-gradient(90deg, #1b5e20, #1b5e20 6.25%, #237029 6.25%, #237029 12.5%)'
                        }}
                      >
                        {/* Football lines SVG */}
                        <svg viewBox="0 0 100 64" className="w-full h-full absolute inset-0 pointer-events-none opacity-50">
                          <rect x="2" y="2" width="96" height="60" fill="none" stroke="white" strokeWidth="0.5" />
                          <line x1="50" y1="2" x2="50" y2="62" stroke="white" strokeWidth="0.5" />
                          <circle cx="50" cy="32" r="9.15" fill="none" stroke="white" strokeWidth="0.5" />
                          <circle cx="50" cy="32" r="0.5" fill="white" />
                          <rect x="2" y="14" width="16.5" height="36" fill="none" stroke="white" strokeWidth="0.5" />
                          <rect x="2" y="23" width="5.5" height="18" fill="none" stroke="white" strokeWidth="0.5" />
                          <circle cx="13" cy="32" r="0.5" fill="white" />
                          <path d="M 18.5 26.5 A 9.15 9.15 0 0 1 18.5 37.5" fill="none" stroke="white" strokeWidth="0.5" />
                          <rect x="81.5" y="14" width="16.5" height="36" fill="none" stroke="white" strokeWidth="0.5" />
                          <rect x="92.5" y="23" width="5.5" height="18" fill="none" stroke="white" strokeWidth="0.5" />
                          <circle cx="87" cy="32" r="0.5" fill="white" />
                          <path d="M 81.5 26.5 A 9.15 9.15 0 0 0 81.5 37.5" fill="none" stroke="white" strokeWidth="0.5" />
                          <path d="M 2 3 A 1 1 0 0 0 3 2" fill="none" stroke="white" strokeWidth="0.5" />
                          <path d="M 2 61 A 1 1 0 0 1 3 62" fill="none" stroke="white" strokeWidth="0.5" />
                          <path d="M 98 3 A 1 1 0 0 1 97 2" fill="none" stroke="white" strokeWidth="0.5" />
                          <path d="M 98 61 A 1 1 0 0 0 97 62" fill="none" stroke="white" strokeWidth="0.5" />
                        </svg>

                        {/* TRAJECTORY VECTORS / CONNECTING MOVEMENT LINES */}
                        {(movementViewMode === 'combined' || movementViewMode === 'vectors') && pointsBeforeFilter.length >= 2 && (
                          <svg viewBox="0 0 100 64" className="w-full h-full absolute inset-0 pointer-events-none z-10 overflow-visible">
                            <defs>
                              <marker id="arrow-sprint" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
                              </marker>
                              <marker id="arrow-run" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                              </marker>
                              <marker id="arrow-defensive" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
                              </marker>
                              <marker id="arrow-walk" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                              </marker>
                            </defs>

                            {pointsBeforeFilter.map((pt, idx) => {
                              if (idx === 0) return null;
                              const prev = pointsBeforeFilter[idx - 1];
                              const x1 = prev.x;
                              const y1 = (prev.y / 100) * 64;
                              const x2 = pt.x;
                              const y2 = (pt.y / 100) * 64;

                              const actType = pt.actionType || 'run';
                              const strokeColor = actType === 'sprint' ? '#ef4444' : actType === 'defensive' ? '#3b82f6' : actType === 'walk' ? '#10b981' : '#f59e0b';
                              const strokeDash = actType === 'sprint' ? '1.5,0.8' : actType === 'defensive' ? '1,0.5' : 'none';
                              const markerId = `arrow-${actType}`;

                              return (
                                <g key={`vector_${prev.id}_${pt.id}`}>
                                  <line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke={strokeColor}
                                    strokeWidth="0.8"
                                    strokeDasharray={strokeDash}
                                    markerEnd={`url(#${markerId})`}
                                    opacity="0.95"
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        )}

                        {/* RENDER PLOTTED HEATMAP & INDIVIDUAL POINTS */}
                        {pointsBeforeFilter.map((pt) => {
                          const act = pt.actionType || 'run';
                          const ringBorder = act === 'sprint' ? 'border-red-600' : act === 'defensive' ? 'border-blue-600' : act === 'walk' ? 'border-emerald-600' : 'border-amber-500';

                          return (
                            <React.Fragment key={pt.id}>
                              {/* Heat Map Overlay Glow (Semi-transparent red glow) */}
                              {(movementViewMode === 'combined' || movementViewMode === 'heatmap') && (
                                <>
                                  <div
                                    className="absolute bg-red-600/30 rounded-full blur-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                      left: `${pt.x}%`,
                                      top: `${pt.y}%`,
                                      width: '8%',
                                      height: '12%',
                                    }}
                                  />
                                  <div
                                    className="absolute bg-amber-500/40 rounded-full blur-sm pointer-events-none -translate-x-1/2 -translate-y-1/2"
                                    style={{
                                      left: `${pt.x}%`,
                                      top: `${pt.y}%`,
                                      width: '4%',
                                      height: '6%',
                                    }}
                                  />
                                </>
                              )}

                              {/* Individual interactive marker */}
                              <div
                                className="absolute group -translate-x-1/2 -translate-y-1/2 z-20"
                                style={{
                                  left: `${pt.x}%`,
                                  top: `${pt.y}%`,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                <div className={`w-5 h-5 bg-white border-2 ${ringBorder} rounded-full flex items-center justify-center font-mono text-[8px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:scale-125 transition-all cursor-pointer`}>
                                  {pt.minute}
                                </div>
                                
                                {/* Point hover/action tooltip */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-black text-white text-[9px] font-black border border-white p-1.5 rounded whitespace-nowrap shadow-md z-30">
                                  <span>Min. {pt.minute}: {pt.label || 'Laufweg-Punkt'}</span>
                                  <button
                                    onClick={() => handleDeletePoint(pt.id)}
                                    className="text-red-400 hover:text-red-300 font-bold mt-1 underline"
                                  >
                                    [Punkt Löschen]
                                  </button>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}

                        {/* ANIMATED PLAYER AVATAR TOKEN ON PITCH */}
                        {animatedPlayerPos && (isPlayingAnimation || pointsBeforeFilter.length > 0) && (
                          <div
                            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-150 pointer-events-none"
                            style={{
                              left: `${animatedPlayerPos.x}%`,
                              top: `${animatedPlayerPos.y}%`,
                            }}
                          >
                            <div className="relative flex items-center justify-center">
                              <div className="absolute -inset-2 bg-yellow-400/60 rounded-full animate-ping" />
                              <div className="w-6 h-6 bg-yellow-400 border-2 border-black rounded-full flex items-center justify-center font-black text-[10px] text-black shadow-lg">
                                #{selectedPlayer?.number || '10'}
                              </div>
                              <div className="absolute top-7 bg-black text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-white whitespace-nowrap shadow">
                                {selectedPlayer?.lastName || selectedPlayer?.name || 'Spieler'} ({isPlayingAnimation ? `${animationMinute}'` : `${movementMinuteFilter}'`})
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Controls & Time Slider Filter */}
                    <div className="space-y-3 border-2 border-black p-4 bg-gray-50">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b-2 border-black pb-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (isPlayingAnimation) {
                                setIsPlayingAnimation(false);
                              } else {
                                if (animationMinute >= 90) setAnimationMinute(1);
                                setIsPlayingAnimation(true);
                              }
                            }}
                            className={`px-3 py-1.5 font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 transition-all ${
                              isPlayingAnimation ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {isPlayingAnimation ? (
                              <>
                                <Pause size={14} />
                                <span>Animation Pausieren</span>
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                <span>▶ Laufweg-Animation Abspielen</span>
                              </>
                            )}
                          </button>
                          <span className="text-[10px] font-black uppercase text-gray-600">
                            Status: <span className="text-black">{isPlayingAnimation ? `Replay Min. ${animationMinute}/90` : `Filter Min. ${movementMinuteFilter}`}</span>
                          </span>
                        </div>

                        <span className="text-[#C00000] bg-white border-2 border-black px-2 py-0.5 font-black text-xs">
                          Anzeige bis Minute {isPlayingAnimation ? animationMinute : movementMinuteFilter}
                        </span>
                      </div>

                      <div>
                        <input
                          type="range"
                          min="1"
                          max="120"
                          value={isPlayingAnimation ? animationMinute : movementMinuteFilter}
                          onChange={(e) => {
                            setIsPlayingAnimation(false);
                            setMovementMinuteFilter(parseInt(e.target.value));
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase mt-1">
                          <span>Anpfiff (Min. 1)</span>
                          <span>Halbzeit (Min. 45)</span>
                          <span>Regulär (Min. 90)</span>
                          <span>Nachspielzeit (Min. 120)</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="pt-2 border-t border-gray-300 flex flex-wrap gap-4 text-[10px] font-black uppercase text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1 bg-red-600" />
                          <span>Vollsprint / Tiefenlauf</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1 bg-amber-500" />
                          <span>Tempolauf / Umschalten</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1 bg-blue-600" />
                          <span>Defensivlauf / Pressing</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-1 bg-emerald-600" />
                          <span>Positionierung / Gehen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : portalView === 'video' && selectedPlayer ? (
        <div className="space-y-6 animate-fadeIn">
          <VideoSection 
            title={`Video-Highlights & Szenen - ${selectedPlayer.lastName} (#${selectedPlayer.number})`}
            subtitle="Individuelle Spielermomente, Torchancen, Zweikämpfe und Videoszenen"
            clips={selectedPlayer.videoHighlights || []}
            onUpdateClips={(clips) => {
              if (onUpdatePlayerVideos) {
                onUpdatePlayerVideos(selectedPlayer.id, clips);
              }
            }}
            players={players}
            defaultCategory="Spieler-Momente"
          />
        </div>
      ) : null}

    </div>
  );
};
