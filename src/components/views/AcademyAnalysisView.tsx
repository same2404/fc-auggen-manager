import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  FileText, 
  Award, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  Trash2, 
  RefreshCw,
  UserCheck,
  BrainCircuit,
  BarChart2,
  CheckCircle2,
  Save,
  Star,
  Trophy,
  Filter,
  Plus,
  Edit3,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Target,
  Calculator,
  Flame,
  Activity,
  Zap,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';
import { Spieler, AcademySessionEvaluation, AcademyWeeklyReport, AcademyPlayerEvaluation } from '../../types';

interface AcademyAnalysisViewProps {
  players: Spieler[];
  sessionEvaluations: AcademySessionEvaluation[];
  weeklyReports: AcademyWeeklyReport[];
  attendance?: any[];
  saveSessionEvaluation: (item: AcademySessionEvaluation) => Promise<any>;
  deleteSessionEvaluation: (id: string) => Promise<any>;
  saveWeeklyReport: (item: AcademyWeeklyReport) => Promise<any>;
  deleteWeeklyReport: (id: string) => Promise<any>;
}

// Preset Cognitive & Mental Skills / Attributes (Kognitive & Mentale Fähigkeiten)
const COGNITIVE_PRESETS = [
  '🎯 Extrem konzentriert',
  '⚡ Hoch motiviert',
  '👁️ Spielintelligenz & Übersicht',
  '🚀 Mutig & entscheidungsfreudig',
  '🗣️ Kommunikativ & lautstark',
  '💪 Resilient & durchhaltewillig',
  '🧊 Ruhig unter Druck',
  '⚠️ Unkonzentriert / abgelenkt'
];

// German School Grade definitions (Schulnoten 1.0 - 6.0)
const SCHOOL_GRADES = [
  { value: 1.0, label: '1 - Sehr gut', badge: 'Sehr gut 🌟', color: 'bg-emerald-600 text-white border-emerald-500' },
  { value: 1.5, label: '1.5', badge: '1.5', color: 'bg-emerald-700/80 text-emerald-200 border-emerald-600' },
  { value: 2.0, label: '2 - Gut', badge: 'Gut 👍', color: 'bg-teal-600 text-white border-teal-500' },
  { value: 2.5, label: '2.5', badge: '2.5', color: 'bg-teal-700/80 text-teal-200 border-teal-600' },
  { value: 3.0, label: '3 - Befriedigend', badge: 'Befriedigend ⚖️', color: 'bg-amber-600 text-white border-amber-500' },
  { value: 3.5, label: '3.5', badge: '3.5', color: 'bg-amber-700/80 text-amber-200 border-amber-600' },
  { value: 4.0, label: '4 - Ausreichend', badge: 'Ausreichend ⚠️', color: 'bg-orange-600 text-white border-orange-500' },
  { value: 4.5, label: '4.5', badge: '4.5', color: 'bg-orange-700/80 text-orange-200 border-orange-600' },
  { value: 5.0, label: '5 - Mangelhaft', badge: 'Mangelhaft ❌', color: 'bg-rose-600 text-white border-rose-500' },
  { value: 6.0, label: '6 - Ungenügend', badge: 'Ungenügend 🔴', color: 'bg-red-900 text-white border-red-700' }
];

// Helper to convert legacy 1-10 note to Schulnote 1.0 - 6.0 if needed
const normalizeToSchulnote = (note: number): number => {
  if (!note || note <= 0) return 0; // 0 means unrated/removed
  if (note > 6) {
    // legacy 1-10 scale where 10 is best, 1 is worst -> convert to 1.0 - 6.0 where 1.0 is best
    const converted = 1.0 + (10 - note) * (5.0 / 9.0);
    return Math.round(converted * 10) / 10;
  }
  return Math.round(note * 10) / 10;
};

// Format Schulnote into readable German text
const getSchulnoteText = (note: number): string => {
  if (!note || note <= 0) return 'Nicht bewertet';
  const clean = normalizeToSchulnote(note);
  if (clean <= 1.5) return `Note ${clean} (Sehr gut 🌟)`;
  if (clean <= 2.5) return `Note ${clean} (Gut 👍)`;
  if (clean <= 3.5) return `Note ${clean} (Befriedigend ⚖️)`;
  if (clean <= 4.5) return `Note ${clean} (Ausreichend ⚠️)`;
  if (clean <= 5.5) return `Note ${clean} (Mangelhaft ❌)`;
  return `Note ${clean} (Ungenügend 🔴)`;
};

export const AcademyAnalysisView: React.FC<AcademyAnalysisViewProps> = ({
  players,
  sessionEvaluations = [],
  weeklyReports = [],
  attendance = [],
  saveSessionEvaluation,
  deleteSessionEvaluation,
  saveWeeklyReport,
  deleteWeeklyReport
}) => {
  const [datum, setDatum] = useState<string>(new Date().toISOString().split('T')[0]);
  const [typ, setTyp] = useState<'Training' | 'Spiel'>('Training');
  const [bezeichnung, setBezeichnung] = useState<string>('Training 1');
  const [customBezeichnung, setCustomBezeichnung] = useState<string>('');

  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Maximum weekly sessions target (default = 5, e.g. 3 Trainings + 2 Matches)
  const [targetWeeklyUnits, setTargetWeeklyUnits] = useState<number>(5);

  // Editing state for correcting a wrong session grade
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Expanded row details state in leaderboard
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Manual Grades State: player name -> { note, begründung, fokus, kognitive: string[] }
  const [manualGrades, setManualGrades] = useState<Record<string, { note: number; begründung: string; fokus: string; kognitive: string[] }>>({});

  // Active Tab inside view: "manual" | "weekly_report" | "ai_evaluator"
  const [viewTab, setViewTab] = useState<'manual' | 'weekly_report' | 'ai_evaluator'>('manual');

  // Filter for history/leaderboard (e.g. all vs specific type)
  const [filterType, setFilterType] = useState<'Alle' | 'Training' | 'Spiel'>('Alle');

  // Month filter for leaderboard (e.g. "Alle", "2026-07", "2026-08")
  const [filterMonth, setFilterMonth] = useState<string>('Alle');

  // Latest active result
  const [currentWeeklyReportResult, setCurrentWeeklyReportResult] = useState<AcademyWeeklyReport | null>(null);

  // Helper for player display name
  const getPlayerDisplayName = (p: Spieler) => {
    return p.firstName ? `${p.firstName} ${p.lastName}` : p.name;
  };

  // Presets for quick selection
  const trainingPresets = ['Training 1', 'Training 2', 'Training 3', 'Training 4', 'Abschlusstraining'];
  const matchPresets = ['Spiel 1 (Liga)', 'Spiel 2 (Liga/Pokal)', 'Testspiel 1', 'Testspiel 2'];

  const effectiveBezeichnung = customBezeichnung.trim() || bezeichnung;

  // Filter ONLY squad players (Kader-Spieler) — excluding trainers, coaches, doctors, physios, functionaries
  const squadPlayers = useMemo(() => {
    if (!players || !Array.isArray(players)) return [];
    
    const nonPlayerKeywords = [
      "trainer", "coach", "physio", "arzt", "manager", "betreuer", 
      "funktionär", "funktionaer", "staff", "official", "medical", 
      "athletik", "leiter", "sportlicher"
    ];

    return players.filter(p => {
      // Exclude by category if explicitly non-player
      if (p.category && p.category !== "player") {
        return false;
      }
      // Exclude by position
      const pos = (p.position || "").toLowerCase();
      if (nonPlayerKeywords.some(kw => pos.includes(kw))) {
        return false;
      }
      // Exclude by name or title if indicates non-player staff
      const fullName = (p.name || `${p.firstName || ""} ${p.lastName || ""}`).toLowerCase();
      if (nonPlayerKeywords.some(kw => fullName.includes(kw))) {
        return false;
      }
      return true;
    });
  }, [players]);

  // Extract available months from sessionEvaluations for month dropdown
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    sessionEvaluations.forEach(s => {
      if (s.datum && s.datum.length >= 7) {
        monthSet.add(s.datum.substring(0, 7)); // e.g. "2026-07"
      }
    });
    return Array.from(monthSet).sort().reverse();
  }, [sessionEvaluations]);

  // Compute attendance stats map by playerId
  const playerAttendanceMap = useMemo(() => {
    const map: Record<string, { totalAttended: number; totalSessions: number; quotePercentage: number }> = {};
    if (!attendance || !Array.isArray(attendance)) return map;

    attendance.forEach(rec => {
      const pId = rec.playerId;
      if (!pId) return;
      const sess = rec.sessions || {};
      const sessionEntries = Object.entries(sess);
      const attended = sessionEntries.filter(([_, status]) => status === 'x').length;
      const relevant = sessionEntries.filter(([_, status]) => ['x', 'e', 'u', 'k', 'P', 'L', 'v'].includes(status as string)).length;

      const quote = relevant > 0 ? (attended / relevant) * 100 : (sessionEntries.length > 0 && attended > 0 ? 100 : 0);

      map[pId] = {
        totalAttended: attended,
        totalSessions: relevant || sessionEntries.length,
        quotePercentage: Math.round(quote * 10) / 10
      };
    });

    return map;
  }, [attendance]);

  // Set grade or field for a player in manual input mode
  const handleGradeChange = (playerName: string, field: 'note' | 'begründung' | 'fokus', value: any) => {
    setManualGrades(prev => ({
      ...prev,
      [playerName]: {
        note: field === 'note' ? Number(value) : (prev[playerName]?.note ?? 2.0),
        begründung: field === 'begründung' ? value : (prev[playerName]?.begründung ?? ''),
        fokus: field === 'fokus' ? value : (prev[playerName]?.fokus ?? ''),
        kognitive: prev[playerName]?.kognitive || []
      }
    }));
  };

  // Toggle a cognitive attribute for a player
  const toggleCognitiveTag = (playerName: string, tag: string) => {
    setManualGrades(prev => {
      const currentList = prev[playerName]?.kognitive || [];
      const exists = currentList.includes(tag);
      const updated = exists ? currentList.filter(t => t !== tag) : [...currentList, tag];
      return {
        ...prev,
        [playerName]: {
          note: prev[playerName]?.note ?? 2.0,
          begründung: prev[playerName]?.begründung ?? '',
          fokus: prev[playerName]?.fokus ?? '',
          kognitive: updated
        }
      };
    });
  };

  // Load an existing session into manual editor to correct/modify grades
  const handleStartEditSession = (session: AcademySessionEvaluation) => {
    setEditingSessionId(session.id || null);
    setDatum(session.datum || new Date().toISOString().split('T')[0]);
    const isSpiel = session.typ === 'Spiel';
    setTyp(isSpiel ? 'Spiel' : 'Training');
    
    if (session.bezeichnung) {
      if ((isSpiel ? matchPresets : trainingPresets).includes(session.bezeichnung)) {
        setBezeichnung(session.bezeichnung);
        setCustomBezeichnung('');
      } else {
        setBezeichnung('Sonstiges');
        setCustomBezeichnung(session.bezeichnung);
      }
    } else {
      setBezeichnung(isSpiel ? 'Spiel 1 (Liga)' : 'Training 1');
      setCustomBezeichnung('');
    }

    const gradesMap: Record<string, { note: number; begründung: string; fokus: string; kognitive: string[] }> = {};
    session.bewertungen?.forEach(b => {
      gradesMap[b.spieler] = {
        note: Number(b.note) || 2.0,
        begründung: b.begründung || '',
        fokus: b.fokus || '',
        kognitive: b.kognitiveFaehigkeiten || []
      };
    });

    setManualGrades(gradesMap);
    setViewTab('manual');
    setSuccessMessage(`Einheit "${session.bezeichnung || session.typ}" vom ${session.datum} geladen. Du kannst Schulnoten & Kognition korrigieren.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setManualGrades({});
    setCustomBezeichnung('');
  };

  // Save Manual Session Evaluation (or Update existing session)
  const handleSaveManualSession = async () => {
    const bewertungen: AcademyPlayerEvaluation[] = [];

    Object.entries(manualGrades).forEach(([pName, entry]) => {
      if (entry.note && entry.note > 0) {
        bewertungen.push({
          spieler: pName,
          note: entry.note,
          begründung: entry.begründung || 'Trainerbewertung (Schulnote)',
          fokus: entry.fokus || 'Weiterhin fokussiert trainieren',
          kognitiveFaehigkeiten: entry.kognitive || []
        });
      }
    });

    if (bewertungen.length === 0) {
      setErrorMessage("Bitte vergib mindestens für einen Spieler eine Schulnote (1.0 bis 6.0).");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const newItem: AcademySessionEvaluation = {
        id: editingSessionId || `eval_${Date.now()}`,
        datum,
        bezeichnung: effectiveBezeichnung,
        typ,
        bewertungen,
        createdAt: editingSessionId ? (sessionEvaluations.find(s => s.id === editingSessionId)?.createdAt || Date.now()) : Date.now(),
        rawInputNotes: 'Manuell eingegebene Schulnoten & Kognition'
      };

      await saveSessionEvaluation(newItem);

      setSuccessMessage(
        editingSessionId 
          ? `Korrektur gespeichert: "${effectiveBezeichnung}" (${datum})!` 
          : `Gespeichert: "${effectiveBezeichnung}" vom ${datum} (${bewertungen.length} Spieler bewertet)!`
      );
      
      // Reset manual form notes after save
      setManualGrades({});
      setEditingSessionId(null);
      setCustomBezeichnung('');
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err: any) {
      console.error("Fehler beim Speichern der Noten:", err);
      setErrorMessage("Speichern fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger AI Text Session Evaluation
  const handleRunAiSessionEvaluation = async () => {
    const textToAnalyze = inputText.trim();
    if (!textToAnalyze) {
      setErrorMessage("Bitte gib Notizen oder Spielerbeobachtungen ein.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/football-academy/evaluate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datum,
          typ,
          notes: textToAnalyze
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Fehler bei der KI-Analyse");
      }

      const data: AcademySessionEvaluation = await response.json();

      const newItem: AcademySessionEvaluation = {
        ...data,
        id: `eval_${Date.now()}`,
        bezeichnung: effectiveBezeichnung,
        createdAt: Date.now(),
        rawInputNotes: textToAnalyze
      };
      await saveSessionEvaluation(newItem);

      setSuccessMessage(`KI-Bewertung für "${effectiveBezeichnung}" (${data.bewertungen.length} Spieler) gespeichert!`);
      setInputText('');
      setTimeout(() => setSuccessMessage(null), 4000);

    } catch (err: any) {
      console.error("Session Evaluation Error:", err);
      setErrorMessage(err.message || "Analyse fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger weekly report API
  const handleGenerateWeeklyReport = async () => {
    if (sessionEvaluations.length === 0) {
      setErrorMessage("Keine Noten vorhanden. Bitte trage zuerst Noten für mindestens ein Training oder Spiel ein.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/football-academy/weekly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionEvaluations,
          kwLabel: `Woche vom ${new Date().toLocaleDateString('de-DE')}`
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Fehler beim Erstellen des Wochenberichts.");
      }

      const data: AcademyWeeklyReport = await response.json();
      setCurrentWeeklyReportResult(data);

      const newReport: AcademyWeeklyReport = {
        ...data,
        id: `report_${Date.now()}`,
        kwLabel: `Woche vom ${new Date().toLocaleDateString('de-DE')}`,
        createdAt: Date.now()
      };
      await saveWeeklyReport(newReport);
      setViewTab('weekly_report');

    } catch (err: any) {
      console.error("Weekly Report Error:", err);
      setErrorMessage(err.message || "Wochenbericht konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  // Computed Leaderboard across all stored evaluations (Schulnoten 1.0 - 6.0 & Kognitive Fähigkeiten)
  const leaderboardData = useMemo(() => {
    const filteredEvaluations = sessionEvaluations.filter(e => {
      if (filterType !== 'Alle' && e.typ !== filterType) return false;
      if (filterMonth !== 'Alle' && e.datum && !e.datum.startsWith(filterMonth)) return false;
      return true;
    });

    const statsMap: Record<string, { 
      totalSchulnoten: number; 
      count: number; 
      trainingsCount: number;
      matchesCount: number;
      grades: number[]; 
      cognitiveList: string[];
      focusList: string[]; 
      notes: string[];
      history: Array<{ id: string; datum: string; typ: string; bezeichnung: string; note: number; begründung: string; fokus: string; kognitive: string[] }>;
    }> = {};

    filteredEvaluations.forEach(session => {
      const sId = session.id || `s_${session.datum}`;
      const sDatum = session.datum;
      const sTyp = session.typ || 'Training';
      const sBez = session.bezeichnung || sTyp;

      session.bewertungen?.forEach(b => {
        const pName = b.spieler;
        if (!statsMap[pName]) {
          statsMap[pName] = { 
            totalSchulnoten: 0, 
            count: 0, 
            trainingsCount: 0,
            matchesCount: 0,
            grades: [], 
            cognitiveList: [],
            focusList: [], 
            notes: [],
            history: [] 
          };
        }

        const rawNote = Number(b.note);
        if (!isNaN(rawNote) && rawNote > 0) {
          const schulnote = normalizeToSchulnote(rawNote);
          statsMap[pName].totalSchulnoten += schulnote;
          statsMap[pName].count += 1;
          if (sTyp === 'Spiel') {
            statsMap[pName].matchesCount += 1;
          } else {
            statsMap[pName].trainingsCount += 1;
          }
          statsMap[pName].grades.push(schulnote);

          const cogList = b.kognitiveFaehigkeiten || [];
          cogList.forEach(c => {
            if (!statsMap[pName].cognitiveList.includes(c)) {
              statsMap[pName].cognitiveList.push(c);
            }
          });

          statsMap[pName].history.push({
            id: sId,
            datum: sDatum,
            typ: sTyp,
            bezeichnung: sBez,
            note: schulnote,
            begründung: b.begründung || '',
            fokus: b.fokus || '',
            kognitive: cogList
          });
        }

        if (b.fokus) statsMap[pName].focusList.push(b.fokus);
        if (b.begründung) statsMap[pName].notes.push(b.begründung);
      });
    });

    const nonPlayerKeywords = ["trainer", "coach", "physio", "arzt", "manager", "betreuer", "funktionär", "funktionaer", "staff", "official", "medical", "athletik", "leiter", "sportlicher"];
    const list = Object.entries(statsMap)
      .filter(([spieler]) => {
        const sp = spieler.toLowerCase();
        return !nonPlayerKeywords.some(kw => sp.includes(kw));
      })
      .map(([spieler, data]) => {
      const avgSchulnote = data.count > 0 ? (data.totalSchulnoten / data.count) : 3.0;
      const bestSchulnote = data.grades.length > 0 ? Math.min(...data.grades) : 3.0;
      const worstSchulnote = data.grades.length > 0 ? Math.max(...data.grades) : 3.0;
      const latestFocus = data.focusList.length > 0 ? data.focusList[data.focusList.length - 1] : '-';

      // Sort history by date descending
      data.history.sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));

      // Match player to find real Attendance stats from 'attendance' collection
      const matchedPlayer = players.find(p => 
        getPlayerDisplayName(p).toLowerCase() === spieler.toLowerCase() ||
        p.name?.toLowerCase() === spieler.toLowerCase() ||
        p.lastName?.toLowerCase() === spieler.toLowerCase() ||
        p.id === spieler
      );

      const attRecord = matchedPlayer ? playerAttendanceMap[matchedPlayer.id] : null;
      const attendanceQuote = attRecord ? attRecord.quotePercentage : 100;
      const attendedSessions = attRecord ? attRecord.totalAttended : data.trainingsCount;

      // Score out of 5.0 (Punkte aus 5.0) where Schulnote 1.0 = 5.0 Points, Schulnote 6.0 = 0.0 Points
      const gradeComponentPoints = Math.max(0, Math.min(5.0, 6.0 - avgSchulnote));
      const attComponentPoints = (attendanceQuote / 100) * 5.0;

      // Cognitive Bonus Points (+0.15 pts per positive cognitive attribute, -0.20 per negative attribute)
      const positiveCogCount = data.cognitiveList.filter(c => !c.toLowerCase().includes('unkonzentriert') && !c.toLowerCase().includes('abgelenkt')).length;
      const negativeCogCount = data.cognitiveList.filter(c => c.toLowerCase().includes('unkonzentriert') || c.toLowerCase().includes('abgelenkt')).length;
      const cogBonusPoints = Math.round(((positiveCogCount * 0.15) - (negativeCogCount * 0.20)) * 10) / 10;

      // Combined score out of 5.0 with cognitive bonus
      const combinedScoreRaw = (gradeComponentPoints * 0.65) + (attComponentPoints * 0.25) + cogBonusPoints;
      const unitRatio = Math.min(1, data.count / Math.max(1, targetWeeklyUnits));
      const scoreOutof5 = Math.min(5.0, Math.max(0, Math.round((combinedScoreRaw * unitRatio) * 10) / 10));

      return {
        spieler,
        avgSchulnote: Math.round(avgSchulnote * 10) / 10,
        scoreOutof5, // e.g. 4.6 / 5.0
        attendanceQuote, // e.g. 95.0%
        attendedSessions,
        cogBonusPoints,
        anzahlEinheiten: data.count,
        trainingsCount: data.trainingsCount,
        matchesCount: data.matchesCount,
        besteSchulnote: bestSchulnote,
        schwächsteSchulnote: worstSchulnote,
        cognitiveList: data.cognitiveList,
        letzterFokus: latestFocus,
        history: data.history
      };
    });

    // Sort descending: best overall score out of 5 first (which corresponds to best Schulnoten + attendance)
    list.sort((a, b) => b.scoreOutof5 - a.scoreOutof5 || a.avgSchulnote - b.avgSchulnote);
    return list;
  }, [sessionEvaluations, filterType, filterMonth, targetWeeklyUnits, players, playerAttendanceMap]);

  // Score out of 5 badge styling helper
  const getScore5BadgeClass = (score: number) => {
    if (score >= 4.0) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm';
    if (score >= 3.0) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  // Schulnote Badge Class Helper
  const getSchulnoteBadgeClass = (note: number) => {
    if (note <= 1.5) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (note <= 2.5) return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    if (note <= 3.5) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (note <= 4.5) return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  };

  // Format YYYY-MM to readable month label (e.g. 2026-07 -> Juli 2026)
  const formatMonthLabel = (mStr: string) => {
    if (!mStr || mStr === 'Alle') return 'Alle Monate';
    const [year, month] = mStr.split('-');
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const mIndex = parseInt(month, 10) - 1;
    return monthNames[mIndex] ? `${monthNames[mIndex]} ${year}` : mStr;
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-2 sm:px-4 py-6">
      
      {/* Header Banner - FC Auggen Colors (Rot, Schwarz, Weiß) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-black border border-red-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
          <Trophy className="w-64 h-64 text-red-500" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-red-600/30 text-red-300 border border-red-500/40 mb-3 shadow-md">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Performance, Kognition & Entwicklung (FC Auggen)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Performance Training & Spiele</span>
              <span className="text-xs bg-red-600 text-white font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow">
                FC Auggen
              </span>
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Vergib Leistungsnoten (1.0 bis 6.0) für Training & Spiele und erfasse <strong>kognitive & mentale Eigenschaften</strong> (z.B. extrem konzentriert, motiviert). Kognitive Stärken bringen <strong>Extra-Bonuspunkte</strong> für die Gesamtwertung (aus 5.0 Punkten)!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setViewTab('manual')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                viewTab === 'manual'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4 text-white" />
              <span>Bewertung & Kognition eintragen</span>
            </button>

            <button
              onClick={() => setViewTab('weekly_report')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                viewTab === 'weekly_report'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Gesamttabelle ({sessionEvaluations.length} Einheiten)</span>
            </button>

            <button
              onClick={() => setViewTab('ai_evaluator')}
              className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all flex items-center gap-2 ${
                viewTab === 'ai_evaluator'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-red-400" />
              <span>KI-Noten per Freitext</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Toast Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-sm font-semibold flex items-center gap-2 shadow-xl animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VIEW TAB 1: Direct Manual Grading & Cognitive Attributes Selection */}
      {viewTab === 'manual' && (
        <div className="space-y-6 animate-fadeIn">
          
          {editingSessionId && (
            <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span>Du korrigierst aktuell: <strong>{effectiveBezeichnung} ({datum})</strong></span>
              </div>
              <button
                onClick={handleCancelEdit}
                className="px-2.5 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Abbrechen
              </button>
            </div>
          )}

          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-red-500" />
                  {editingSessionId ? 'Bewertung & Kognition korrigieren' : 'Bewertung & Kognitive Fähigkeiten eintragen'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Noten (1 = Sehr gut bis 6 = Ungenügend) + schnelle Tags für Konzentration, Motivation & Spielintelligenz (bringen Extra-Bonuspunkte).
                </p>
              </div>

              {/* Type, Session Name Presets, & Date Selector */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Type switch */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTyp('Training');
                      setBezeichnung('Training 1');
                      setCustomBezeichnung('');
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      typ === 'Training'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚽ Training
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTyp('Spiel');
                      setBezeichnung('Spiel 1 (Liga)');
                      setCustomBezeichnung('');
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      typ === 'Spiel'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🏆 Spiel
                  </button>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={datum}
                    onChange={(e) => setDatum(e.target.value)}
                    className="bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Presets Row for designating Training 1, 2, 3 or Spiel 1, 2 */}
            <div className="mb-6 p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Bezeichnung der Einheit / des Spiels:
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {(typ === 'Training' ? trainingPresets : matchPresets).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setBezeichnung(preset);
                      setCustomBezeichnung('');
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      bezeichnung === preset && !customBezeichnung
                        ? 'bg-red-600/30 text-red-300 border-red-500/60 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Custom Title Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 shrink-0">Oder eigener Name:</span>
                <input
                  type="text"
                  placeholder="z.B. Testspiel vs. Basel, Athletikeinheit, Hallenturnier..."
                  value={customBezeichnung}
                  onChange={(e) => setCustomBezeichnung(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 flex-1 max-w-md"
                />
              </div>
            </div>

            {/* Players Grading List */}
            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-1">
              {squadPlayers.length > 0 ? (
                squadPlayers.map((player) => {
                  const pName = getPlayerDisplayName(player);
                  const currentEntry = manualGrades[pName] || { note: 2.0, begründung: '', fokus: '', kognitive: [] };

                  return (
                    <div 
                      key={player.id}
                      className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all space-y-4"
                    >
                      {/* Top Row: Player Info & Grade Selector */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Player Info */}
                        <div className="lg:w-48 shrink-0 flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-red-400 font-mono text-sm font-extrabold flex items-center justify-center shrink-0">
                            {player.number || '#'}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm truncate">{pName}</h4>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{player.position || 'Spieler'}</span>
                          </div>
                        </div>

                        {/* German School Grade Selector (1.0 to 6.0) + Clear option */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>Leistungsnote:</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-red-300 bg-red-950/60 border border-red-500/40 px-2.5 py-0.5 rounded-lg">
                                {getSchulnoteText(currentEntry.note)}
                              </span>
                              {currentEntry.note > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleGradeChange(pName, 'note', 0)}
                                  className="px-2 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all"
                                  title="Note für diesen Spieler entfernen"
                                >
                                  <Trash2 className="w-3 h-3" /> Note entfernen
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Grade buttons 1.0 to 6.0 + Clear button */}
                          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleGradeChange(pName, 'note', 0)}
                              className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition-all flex flex-col items-center justify-center ${
                                !currentEntry.note || currentEntry.note === 0
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow font-bold ring-2 ring-rose-500/40'
                                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                              }`}
                              title="Keine Note vergeben / entfernen"
                            >
                              <span>❌</span>
                              <span className="text-[9px]">Keine</span>
                            </button>

                            {SCHOOL_GRADES.map((sg) => (
                              <button
                                key={sg.value}
                                type="button"
                                onClick={() => handleGradeChange(pName, 'note', sg.value)}
                                className={`py-2 px-1 text-xs font-extrabold rounded-xl border transition-all flex flex-col items-center justify-center ${
                                  currentEntry.note === sg.value
                                    ? 'bg-red-600 text-white border-red-400 shadow-lg scale-105 ring-2 ring-red-400/50'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                                }`}
                              >
                                <span>{sg.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Cognitive & Mental Attributes (Kognitive Fähigkeiten) */}
                      <div className="p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4 text-red-400" />
                            <span>Kognitive & Mentale Fähigkeiten (Tags antippen zum Auswählen):</span>
                          </label>
                          <span className="text-[10px] text-slate-400">
                            {currentEntry.kognitive?.length || 0} Eigenschaften gewählt
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {COGNITIVE_PRESETS.map((tag) => {
                            const isSelected = currentEntry.kognitive?.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleCognitiveTag(pName, tag)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-red-600/30 text-red-200 border-red-500/80 font-bold shadow-md'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                                }`}
                              >
                                <span>{tag}</span>
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-red-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Row: Begründung & Fokus Text Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Begründung (z.B. Starkes 1v1, hohes Tempo)"
                          value={currentEntry.begründung}
                          onChange={(e) => handleGradeChange(pName, 'begründung', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                        />
                        <input
                          type="text"
                          placeholder="Fokuspunkt (z.B. Torabschluss mit links)"
                          value={currentEntry.fokus}
                          onChange={(e) => handleGradeChange(pName, 'fokus', e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 p-4 text-center">Keine Spieler im Kader gefunden.</p>
              )}
            </div>

            {/* Save Action Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Speichern für <strong>{effectiveBezeichnung}</strong> ({datum}) – {Object.values(manualGrades).filter(g => g.note > 0).length} Spieler bewertet.
              </span>

              <button
                type="button"
                onClick={handleSaveManualSession}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-red-500/40"
              >
                <Save className="w-4 h-4" />
                <span>{editingSessionId ? 'Änderungen Speichern' : 'Einheit Speichern & In Tabelle übernehmen'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW TAB 2: Leaderboard Table & Multiple Sessions Breakdown & Result out of 5 */}
      {viewTab === 'weekly_report' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Target Weekly Units Selector Bar */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-black border border-red-500/40 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/30 text-red-400 border border-red-500/40 shadow-inner">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Wochen-Zielberechnung (Standard: 5 Einheiten)</span>
                  <span className="text-[10px] bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full border border-red-500/40 font-bold">
                    3 Trainings + 2 Spiele = 5 Einheiten
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Schulnoten (70%) + Trainingsbeteiligung (30%) fließen live in das <strong>Gesamtergebnis aus 5.0 Punkten</strong> ein.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl">
              <Target className="w-4 h-4 text-red-400 shrink-0" />
              <label className="text-xs font-semibold text-slate-300">Ziel-Anzahl Einheiten:</label>
              <select
                value={targetWeeklyUnits}
                onChange={(e) => setTargetWeeklyUnits(Number(e.target.value))}
                className="bg-slate-900 text-red-300 font-bold text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-red-500"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>
                    {num} Einheiten per Woche
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controls Header: Filters (Type & Month) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/95 border border-slate-800 p-5 rounded-2xl gap-4 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Performance-Tabelle & Wochenauswertung
              </h2>
              <p className="text-xs text-slate-400">
                Vergleiche die Schulnoten, Kognition & Beteiligung deines Kaders. Top 3 werden mit Gold, Silber & Bronze geehrt.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
                <button
                  type="button"
                  onClick={() => setFilterType('Alle')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'Alle' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Alle ({sessionEvaluations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('Training')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'Training' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nur Trainings
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('Spiel')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    filterType === 'Spiel' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nur Spiele
                </button>
              </div>

              {/* Month Filter */}
              {availableMonths.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 border border-slate-800 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="text-xs text-slate-400 font-semibold">Monat:</span>
                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Alle" className="bg-slate-900 text-white">Alle Monate</option>
                    {availableMonths.map(m => (
                      <option key={m} value={m} className="bg-slate-900 text-white">
                        {formatMonthLabel(m)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerateWeeklyReport}
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all disabled:opacity-50 border border-red-500/40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>KI-Wochenbericht</span>
              </button>
            </div>
          </div>

          {/* Leaderboard Table with Gold/Silver/Bronze Highlighting */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                Rangliste & Performance ({leaderboardData.length} Spieler)
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Klicke auf eine Zeile für die Aufschlüsselung aller Noten & kognitiven Merkmale
              </span>
            </h3>

            {leaderboardData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Rang</th>
                      <th className="p-3">Spieler</th>
                      <th className="p-3">Ergebnis (aus 5.0)</th>
                      <th className="p-3">Ø Schulnote (1-6)</th>
                      <th className="p-3">Kognitive Stärken</th>
                      <th className="p-3">Trainingsbeteiligung</th>
                      <th className="p-3">Einheiten & Spiele</th>
                      <th className="p-3">Letzter Fokus</th>
                      <th className="p-3 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {leaderboardData.map((item, idx) => {
                      const isExpanded = expandedPlayer === item.spieler;
                      const isGold = idx === 0;
                      const isSilver = idx === 1;
                      const isBronze = idx === 2;

                      let rowClass = "hover:bg-slate-800/50 transition-all cursor-pointer ";
                      if (isGold) {
                        rowClass += "bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-l-4 border-amber-400 ";
                      } else if (isSilver) {
                        rowClass += "bg-gradient-to-r from-slate-300/15 via-slate-900 to-slate-900 border-l-4 border-slate-300 ";
                      } else if (isBronze) {
                        rowClass += "bg-gradient-to-r from-amber-800/15 via-slate-900 to-slate-900 border-l-4 border-amber-600 ";
                      }

                      return (
                        <React.Fragment key={idx}>
                          <tr 
                            className={rowClass}
                            onClick={() => setExpandedPlayer(isExpanded ? null : item.spieler)}
                          >
                            {/* Rank Badge (Gold, Silver, Bronze) */}
                            <td className="p-3 font-bold">
                              {isGold && (
                                <span className="inline-flex items-center gap-1 font-extrabold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.25)]">
                                  🥇 Gold (#1)
                                </span>
                              )}
                              {isSilver && (
                                <span className="inline-flex items-center gap-1 font-extrabold text-slate-200 bg-slate-300/20 px-2.5 py-1 rounded-md border border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.2)]">
                                  🥈 Silber (#2)
                                </span>
                              )}
                              {isBronze && (
                                <span className="inline-flex items-center gap-1 font-extrabold text-amber-500 bg-amber-800/30 px-2.5 py-1 rounded-md border border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.2)]">
                                  🥉 Bronze (#3)
                                </span>
                              )}
                              {!isGold && !isSilver && !isBronze && (
                                <span className="font-mono font-bold text-slate-400 pl-2">
                                  #{idx + 1}
                                </span>
                              )}
                            </td>

                            {/* Player name */}
                            <td className="p-3 font-bold text-white text-sm">
                              <div className="flex items-center gap-2">
                                <span>{item.spieler}</span>
                                {isGold && <span className="text-amber-400 text-xs">⭐ Top Spieler</span>}
                              </div>
                            </td>

                            {/* Score out of 5.0 */}
                            <td className="p-3">
                              <span className={`px-2.5 py-1 rounded-lg font-mono font-extrabold text-xs border ${getScore5BadgeClass(item.scoreOutof5)}`}>
                                🔥 {item.scoreOutof5} / 5.0
                              </span>
                            </td>

                            {/* Average German School Grade */}
                            <td className="p-3">
                              <span className={`font-bold text-xs px-2.5 py-1 rounded-lg border ${getSchulnoteBadgeClass(item.avgSchulnote)}`}>
                                Ø {getSchulnoteText(item.avgSchulnote)}
                              </span>
                            </td>

                            {/* Cognitive Attributes Badges & Bonus Badge */}
                            <td className="p-3">
                              <div className="flex flex-col gap-1 max-w-xs">
                                <div className="flex flex-wrap gap-1">
                                  {item.cognitiveList.length > 0 ? (
                                    item.cognitiveList.slice(0, 2).map((tag, tIdx) => (
                                      <span key={tIdx} className="bg-slate-800 text-red-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-500 text-[10px] italic">-</span>
                                  )}
                                  {item.cognitiveList.length > 2 && (
                                    <span className="text-slate-400 text-[10px] font-mono">+{item.cognitiveList.length - 2}</span>
                                  )}
                                </div>
                                {item.cogBonusPoints !== 0 && (
                                  <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded border w-fit ${
                                    item.cogBonusPoints > 0 
                                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/40' 
                                      : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                  }`}>
                                    🧠 {item.cogBonusPoints > 0 ? `+${item.cogBonusPoints}` : item.cogBonusPoints} Bonus-Pkt
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Attendance % directly integrated */}
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                <span className={`font-mono font-bold text-xs ${
                                  item.attendanceQuote >= 85 ? 'text-emerald-400' : item.attendanceQuote >= 65 ? 'text-amber-400' : 'text-rose-400'
                                }`}>
                                  {item.attendanceQuote}% Beteiligung
                                </span>
                              </div>
                            </td>

                            {/* Count Breakdown (out of target e.g. 5) */}
                            <td className="p-3">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="bg-slate-800 text-red-300 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-slate-700">
                                    {item.anzahlEinheiten} / {targetWeeklyUnits} Einheiten
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <span>{item.trainingsCount} TE</span>
                                  <span>•</span>
                                  <span>{item.matchesCount} Spiele</span>
                                </div>
                              </div>
                            </td>

                            {/* Focus */}
                            <td className="p-3 text-slate-300 max-w-xs truncate">{item.letzterFokus}</td>

                            {/* Toggle Button */}
                            <td className="p-3 text-right">
                              <button 
                                type="button"
                                className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded breakdown row */}
                          {isExpanded && (
                            <tr className="bg-slate-950 border-b border-slate-800">
                              <td colSpan={9} className="p-4">
                                <div className="space-y-4">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                    <h4 className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                                      <BrainCircuit className="w-4 h-4 text-red-400" />
                                      Detaillierte Leistungsbewertung & Kognition von {item.spieler}:
                                    </h4>
                                    <span className="text-xs text-slate-300">
                                      Ergebnis: <strong>{item.scoreOutof5} / 5.0 Punkte</strong> (Beteiligung {item.attendanceQuote}%)
                                    </span>
                                  </div>

                                  {/* Cognitive attributes summary */}
                                  {item.cognitiveList.length > 0 && (
                                    <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                                      <span className="text-[11px] font-bold text-slate-300 block mb-1.5">🧠 Kognitives Profil / Mentale Stärken:</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {item.cognitiveList.map((cog, cIdx) => (
                                          <span key={cIdx} className="bg-red-950/80 text-red-200 border border-red-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-red-400" />
                                            <span>{cog}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {item.history.map((h, hIdx) => (
                                      <div key={hIdx} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            h.typ === 'Spiel' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                          }`}>
                                            {h.bezeichnung || h.typ}
                                          </span>
                                          <span className="text-[10px] font-mono text-slate-400">{h.datum}</span>
                                        </div>

                                        <div className="flex items-baseline justify-between">
                                          <span className="text-xs font-semibold text-slate-300">Note:</span>
                                          <div className="flex items-center gap-1.5">
                                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${getSchulnoteBadgeClass(h.note)}`}>
                                              {getSchulnoteText(h.note)}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const fullEval = sessionEvaluations.find(s => s.id === h.id);
                                                if (fullEval) handleStartEditSession(fullEval);
                                              }}
                                              className="text-red-400 hover:text-red-300 p-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                                              title="Diese Einheit/Note korrigieren"
                                            >
                                              <Edit3 className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (h.id) {
                                                  deleteSessionEvaluation(h.id);
                                                  setSuccessMessage(`Einheit "${h.bezeichnung || h.datum}" gelöscht.`);
                                                  setTimeout(() => setSuccessMessage(null), 3000);
                                                }
                                              }}
                                              className="text-slate-400 hover:text-rose-400 p-1 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                                              title="Diese Einheit/Note löschen"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {h.kognitive && h.kognitive.length > 0 && (
                                          <div className="flex flex-wrap gap-1 pt-1">
                                            {h.kognitive.map((c, idxC) => (
                                              <span key={idxC} className="text-[9px] bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded">
                                                {c}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                        {h.begründung && (
                                          <p className="text-[11px] text-slate-400 italic">"{h.begründung}"</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Noch keine Schulnoten für den ausgewählten Filter ({filterMonth !== 'Alle' ? formatMonthLabel(filterMonth) : 'alle Monate'}) eingetragen.
                </p>
              </div>
            )}
          </div>

          {/* Optional AI Weekly Summary Output */}
          {currentWeeklyReportResult && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Top 3 Players */}
                <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-amber-300 flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-amber-400" />
                    KI-Top 3 der Woche
                  </h3>
                  
                  <div className="space-y-3">
                    {currentWeeklyReportResult.top_spieler?.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-950/90 border border-amber-500/30 p-3 rounded-xl">
                        <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Attention Players */}
                <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-rose-300 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    Besondere Aufmerksamkeit ("Kritisch")
                  </h3>

                  <div className="space-y-3">
                    {currentWeeklyReportResult.kritisch?.length > 0 ? (
                      currentWeeklyReportResult.kritisch.map((name, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950/90 border border-rose-500/30 p-3 rounded-xl">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                          <span className="font-bold text-white text-sm">{name}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">Keine auffällig kritischen Spieler in dieser Woche.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Recommendations Box */}
              <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/40 rounded-2xl p-6 shadow-xl">
                <h3 className="text-base font-bold text-red-300 flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-red-400" />
                  KI-Empfehlungen für die kommende Woche
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {currentWeeklyReportResult.empfehlungen}
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW TAB 3: AI Text Evaluator */}
      {viewTab === 'ai_evaluator' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500" />
              Bewertung & Kognition aus Freitext-Notizen generieren
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Schreibe Stichpunkte zu deinen Spielern – die KI bewertet automatisch jeden genannten Spieler mit einer Leistungsnote (1.0 bis 6.0), ermittelt kognitive Fähigkeiten und formuliert Begründungen & Fokus-Punkte.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Typ & Bezeichnung</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => { setTyp('Training'); setBezeichnung('Training 1'); }}
                    className={`py-1.5 px-3 text-xs font-bold rounded-xl border ${
                      typ === 'Training' ? 'bg-red-600 text-white border-red-500' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ⚽ Training
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTyp('Spiel'); setBezeichnung('Spiel 1 (Liga)'); }}
                    className={`py-1.5 px-3 text-xs font-bold rounded-xl border ${
                      typ === 'Spiel' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    🏆 Spiel
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Datum</label>
                <input
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="z.B. Lukas war extrem konzentriert und zweikampfstark (Note 1). Felix war hoch motiviert, hatte aber Pech im Abschluss. Noah wirkte unkonzentriert..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-sm text-white font-mono focus:outline-none focus:border-red-500 mb-4"
            />

            <button
              type="button"
              onClick={handleRunAiSessionEvaluation}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-red-500/40"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analysiere mit KI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>KI-Bewertung generieren</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* History / Saved Sessions with Edit & Delete */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-500" />
            Alle gespeicherten Einheiten & Spiele ({sessionEvaluations.length})
          </h3>
          <span className="text-xs text-slate-400">
            Klicke auf "Bearbeiten / Korrigieren", um falsche Noten oder Kognition sofort anzupassen
          </span>
        </div>

        {sessionEvaluations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionEvaluations.map((evalItem) => (
              <div 
                key={evalItem.id} 
                className="bg-slate-950/90 border border-slate-800 hover:border-red-500/40 rounded-xl p-4 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${
                      evalItem.typ === 'Spiel' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      {evalItem.bezeichnung || evalItem.typ}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{evalItem.datum}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-semibold mb-2">
                    {evalItem.bewertungen?.length || 0} Spieler bewertet
                  </p>

                  <div className="text-[11px] text-slate-400 space-y-1.5 mb-3">
                    {evalItem.bewertungen?.slice(0, 4).map((b, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="truncate max-w-[140px]">{b.spieler}</span>
                        <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${getSchulnoteBadgeClass(b.note)}`}>
                          {getSchulnoteText(b.note)}
                        </span>
                      </div>
                    ))}
                    {(evalItem.bewertungen?.length || 0) > 4 && (
                      <p className="text-[10px] text-slate-500 italic">+ weitere Spieler</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleStartEditSession(evalItem)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-red-300 font-semibold px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-red-400" />
                    <span>Bearbeiten / Korrigieren</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (evalItem.id) {
                        deleteSessionEvaluation(evalItem.id);
                        setSuccessMessage(`Einheit "${evalItem.bezeichnung || evalItem.datum}" gelöscht.`);
                        setTimeout(() => setSuccessMessage(null), 3000);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Einheit löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Noch keine Einheiten eingetragen.</p>
        )}
      </div>

    </div>
  );
};
