import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { 
  Maximize2, 
  Minimize2, 
  Play, 
  Pause, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Activity, 
  Compass, 
  X, 
  Sliders, 
  Zap, 
  CheckCircle2, 
  ZoomIn, 
  ZoomOut,
  ArrowRightLeft,
  BookOpen,
  ShieldAlert,
  Target,
  Layers,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  Check,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  TacticalFormation, 
  GamePhase, 
  TacticalPhilosophy,
  BuildUpVariant,
  FORMATION_REPOSITORY, 
  TACTICAL_PHILOSOPHIES,
  BUILD_UP_VARIANTS,
  generateProTrainerAnalysis,
  compareFormations, 
  FormationComparison,
  LOAD_STROKE_WIDTH,
  PHASE_COLOR
} from '../utils/tacticalAnalysisEngine';

interface Pro3DTacticBoardModalProps {
  players: Player[];
  matches?: any[];
  analyses?: any[];
  onClose: () => void;
  initialSituation?: string;
}

export const Pro3DTacticBoardModal: React.FC<Pro3DTacticBoardModalProps> = ({
  players,
  matches = [],
  analyses = [],
  onClose,
  initialSituation = 'umschalten'
}) => {
  const [phase, setPhase] = useState<GamePhase>(
    initialSituation === 'ballverlust' || initialSituation === 'pressing'
      ? 'gegen_ball'
      : initialSituation === 'umschalten'
      ? 'umschalten'
      : 'mit_ball'
  );
  const [formation, setFormation] = useState<TacticalFormation>('4-3-3');
  const [previousFormation, setPreviousFormation] = useState<TacticalFormation>('4-3-3');
  const [is3DPerspective, setIs3DPerspective] = useState<boolean>(true);
  const [tiltAngle, setTiltAngle] = useState<number>(18); // 0 (2D), 18 (Flach), 28 (Steil)
  const [zoomLevel, setZoomLevel] = useState<number>(1.15); // Pitch zoom level default set higher (115%)
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showLoadZones, setShowLoadZones] = useState<boolean>(true);
  const [selectedPlayerPos, setSelectedPlayerPos] = useState<string>('ST');
  const [animProgress, setAnimProgress] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [philosophy, setPhilosophy] = useState<TacticalPhilosophy>('positionsspiel');
  const [buildUpVariant, setBuildUpVariant] = useState<BuildUpVariant>('6er_drehpunkt');
  const [showTrainerAnalysisModal, setShowTrainerAnalysisModal] = useState<boolean>(false);
  const [showTrainerHUD, setShowTrainerHUD] = useState<boolean>(true);

  // Matchplan data integration
  const [selectedMatchReportId, setSelectedMatchReportId] = useState<string | number | null>(analyses[0]?.id || matches[0]?.id || null);
  const [activeToast, setActiveToast] = useState<string | null>(null);

  // Animation Frame Loop
  useEffect(() => {
    let frameId: number;
    if (isAnimating) {
      const step = () => {
        setAnimProgress((prev) => (prev + 0.008) % 1);
        frameId = requestAnimationFrame(step);
      };
      frameId = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating]);

  // Toast auto-clear
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Current formation data repository
  const currentFormationData = FORMATION_REPOSITORY[formation] || FORMATION_REPOSITORY['4-3-3'];
  const runProfiles = currentFormationData.positions;

  // Selected Match Analysis
  const selectedAnalysis = analyses.find((a: any) => a.id === selectedMatchReportId) || analyses[0] || null;
  const selectedMatch = matches.find((m: any) => m.id === selectedMatchReportId || m.opponent === selectedAnalysis?.opponent) || matches[0] || null;

  // Formation Comparison when changing formation
  const handleFormationChange = (newFormation: TacticalFormation) => {
    if (newFormation !== formation) {
      setPreviousFormation(formation);
      setFormation(newFormation);
      setShowComparisonModal(true);
    }
  };

  const comparison: FormationComparison = compareFormations(previousFormation, formation);
  const proAnalysis = generateProTrainerAnalysis(formation, phase, philosophy, buildUpVariant, selectedPlayerPos);

  // Apply match report tactic onto tactic board
  const applyMatchplanToBoard = (match: any, analysis?: any) => {
    const opp = match?.opponent || analysis?.opponent || 'Verbandsliga Gegner';
    // Auto-detect tactical variant if text contains keywords
    let targetVariant: BuildUpVariant = 'fluegel_lang_st_ausweichen_10er_nachruecken';
    const textSample = `${analysis?.openingPlay || ''} ${analysis?.transitionOffensive || ''} ${match?.tacticalNotes || ''}`.toLowerCase();
    
    if (textSample.includes('6er') || textSample.includes('drehpunkt')) {
      targetVariant = '6er_drehpunkt';
    } else if (textSample.includes('5 ecken') || textSample.includes('breit')) {
      targetVariant = '5_ecken';
    } else if (textSample.includes('3er kette') || textSample.includes('abkippen')) {
      targetVariant = '3er_kette_abkippen';
    } else if (textSample.includes('10er') || textSample.includes('verbindung')) {
      targetVariant = 'zehner_verbindung';
    } else if (textSample.includes('außen') || textSample.includes('flügel') || textSample.includes('lang')) {
      targetVariant = 'fluegel_lang_st_ausweichen_10er_nachruecken';
    }

    setBuildUpVariant(targetVariant);
    setPhase('mit_ball');
    setActiveToast(`Taktik & Spielaufbau aus Spielbericht vs ${opp} geladen!`);
  };

  // Calculate animated position along SVG path
  const getPointOnPathProgress = (pathD: string, progress: number) => {
    const numbers = pathD.match(/-?\d+(\.\d+)?/g)?.map(Number) || [400, 250];
    if (numbers.length >= 4) {
      const startX = numbers[0];
      const startY = numbers[1];
      const endX = numbers[numbers.length - 2];
      const endY = numbers[numbers.length - 1];
      const midX = numbers.length >= 6 ? numbers[2] : (startX + endX) / 2;
      const midY = numbers.length >= 6 ? numbers[3] : (startY + endY) / 2;

      const t = progress;
      const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
      const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
      return { x, y };
    }
    return { x: 400, y: 250 };
  };

  return (
    <div className={`fixed inset-0 bg-slate-950 z-[99999] flex flex-col p-2 sm:p-4 text-white font-sans overflow-hidden select-none ${isFullscreen ? 'p-0' : ''}`}>
      {/* TOAST BANNER */}
      {activeToast && (
        <div className="absolute top-20 right-6 z-[200] bg-emerald-500 text-slate-950 font-black uppercase text-xs px-4 py-2.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200 flex items-center gap-2">
          <CheckCircle2 size={16} /> {activeToast}
        </div>
      )}

      {/* HEADER CONTROL BAR */}
      <div className="bg-slate-900 border-4 border-black p-3 rounded shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* TITLE & LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-600 text-white border-2 border-black font-black flex items-center justify-center shadow-sm shrink-0 rounded">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              3D-TAKTIKTAFEL <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded border border-black font-mono">PROFI-NIVEAU</span>
            </h2>
            <p className="text-[11px] text-slate-300 font-bold hidden md:block">
              Positionsspezifische Laufwege (MIT & GEGEN den Ball) • 3D Heatmaps & Belastungszonen
            </p>
          </div>
        </div>

        {/* QUICK TOGGLE BUTTONS & CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* PERSPECTIVE & ANGLE SELECTOR */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-xs font-mono">
            <button
              onClick={() => { setIs3DPerspective(false); setTiltAngle(0); }}
              className={`px-2.5 py-1 rounded font-black uppercase transition-all ${
                !is3DPerspective ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              2D Draufsicht
            </button>
            <button
              onClick={() => { setIs3DPerspective(true); setTiltAngle(18); }}
              className={`px-2.5 py-1 rounded font-black uppercase transition-all ${
                is3DPerspective && tiltAngle === 18 ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              3D Flach 18°
            </button>
            <button
              onClick={() => { setIs3DPerspective(true); setTiltAngle(28); }}
              className={`px-2.5 py-1 rounded font-black uppercase transition-all ${
                is3DPerspective && tiltAngle === 28 ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-slate-300 hover:text-white'
              }`}
            >
              3D Steil 28°
            </button>
          </div>

          {/* ZOOM CONTROLS */}
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-xs">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.75, Math.round((prev - 0.1) * 100) / 100))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Spielfeld verkleinern"
            >
              <ZoomOut size={16} />
            </button>
            <span className="font-mono text-xs px-1 text-amber-300 font-black min-w-[38px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(2.2, Math.round((prev + 0.1) * 100) / 100))}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
              title="Spielfeld vergrößern"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => { setZoomLevel(1.15); setTiltAngle(18); setIs3DPerspective(true); }}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-300"
              title="Ansicht zurücksetzen"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* SIDEBAR TOGGLE */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`px-2.5 py-1.5 rounded border-2 border-black text-xs font-black uppercase flex items-center gap-1 transition-all ${
              isSidebarCollapsed ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Seitenleiste einklappen für maximale Spielfeld-Größe"
          >
            <Maximize2 size={14} />
            <span>{isSidebarCollapsed ? 'Menü' : 'Feld Max'}</span>
          </button>

          {/* ANIMATION SIMULATION */}
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`px-2.5 py-1.5 rounded border-2 border-black text-xs font-black uppercase flex items-center gap-1 transition-all shadow-sm ${
              isAnimating ? 'bg-emerald-500 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {isAnimating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isAnimating ? 'Pause' : 'Play'}</span>
          </button>

          {/* HEATMAP CLOUD */}
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1.5 rounded border-2 border-black text-xs font-black uppercase flex items-center gap-1 transition-all ${
              showHeatmap ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-400'
            }`}
            title="3D-Heatmap Farbwolke ein/aus"
          >
            <Flame size={14} /> Heatmap
          </button>

          {/* LOAD ZONES */}
          <button
            onClick={() => setShowLoadZones(!showLoadZones)}
            className={`px-2.5 py-1.5 rounded border-2 border-black text-xs font-black uppercase flex items-center gap-1 transition-all ${
              showLoadZones ? 'bg-amber-500 text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-400'
            }`}
            title="Belastungszonen anzeigen"
          >
            <Activity size={14} /> Belastung
          </button>

          {/* TRAINER-HUD TOGGLE */}
          <button
            onClick={() => setShowTrainerHUD(!showTrainerHUD)}
            className={`px-2.5 py-1.5 rounded border-2 border-black text-xs font-black uppercase flex items-center gap-1 transition-all ${
              showTrainerHUD ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-300'
            }`}
            title="Trainer-Analyse HUD im Spielfeld ein/ausblenden"
          >
            <BookOpen size={14} /> HUD {showTrainerHUD ? 'An' : 'Aus'}
          </button>

          {/* FULLSCREEN TOGGLE */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-2 border-black rounded transition-colors"
            title={isFullscreen ? 'Vollbild beenden' : 'Vollbild aktivieren'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* CLOSE */}
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 border-2 border-black rounded transition-colors"
            title="Schließen"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* UNIFIED INTERACTIVE 3D TAKTIKTAFEL BOARD */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 my-3 overflow-hidden">
          
          {/* LEFT PANEL: SPIELPHASEN, FORMATIONEN & FORMATIONVERGLEICH */}
          {!isSidebarCollapsed && (
            <div className="bg-slate-900 border-4 border-black p-3 rounded shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3 overflow-y-auto custom-scrollbar">
              
              {/* SPIELPHASEN (MIT BALL / GEGEN BALL / UMSCHALTEN) */}
              <div>
                <label className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 mb-2">
                  <Zap size={14} /> SPIELPHASE (LAUFWEGE & BELASTUNG):
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'mit_ball', label: '🔵 MIT BALL (Offensiv)', color: 'bg-blue-600 text-white' },
                    { id: 'gegen_ball', label: '🔴 GEGEN DEN BALL (Defensiv & Pressing)', color: 'bg-red-600 text-white' },
                    { id: 'umschalten', label: '🟡 UMSCHALTEN (Blitzangriff / Rückzug)', color: 'bg-amber-500 text-black font-black' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPhase(p.id as GamePhase)}
                      className={`w-full text-left p-2 rounded border-2 border-black text-xs font-black uppercase transition-all flex items-center justify-between ${
                        phase === p.id ? `${p.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] scale-[1.02]` : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{p.label}</span>
                      {phase === p.id && <CheckCircle2 size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORMATION PRESETS (ALL 7 FORMATIONS) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Sliders size={14} /> FORMATION WÄHLEN:
                  </label>
                  <button
                    onClick={() => setShowComparisonModal(true)}
                    className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded border border-black uppercase hover:bg-red-500 flex items-center gap-1"
                  >
                    <ArrowRightLeft size={12} /> Vergleich
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['4-3-3', '4-2-3-1', '3-5-2', '4-4-2', '3-4-3', '4-1-4-1', '3-4-1-2'] as TacticalFormation[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => handleFormationChange(f)}
                      className={`p-2 rounded border-2 border-black text-xs font-black uppercase text-center transition-all ${
                        formation === f ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAKTIK-PHILOSOPHIE (PROFI-LEVEL) */}
              <div>
                <label className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 mb-2">
                  <Award size={14} /> TAKTISCHE PHILOSOPHIE:
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {(Object.keys(TACTICAL_PHILOSOPHIES) as TacticalPhilosophy[]).map((pKey) => {
                    const item = TACTICAL_PHILOSOPHIES[pKey];
                    const isSel = philosophy === pKey;
                    return (
                      <button
                        key={pKey}
                        onClick={() => setPhilosophy(pKey)}
                        className={`p-2 rounded border-2 border-black text-xs font-black text-left uppercase transition-all flex items-center justify-between ${
                          isSel ? 'bg-amber-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span className="truncate">{item.name}</span>
                        {isSel && <CheckCircle2 size={13} className="shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SPIELAUFBAU-VARIANTE (9 VARIANTEN INKL. FLÜGEL LANG/10ER) */}
              <div>
                <label className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 mb-2">
                  <Layers size={14} /> SPIELAUFBAU-VARIANTE:
                </label>
                <select
                  value={buildUpVariant}
                  onChange={(e) => setBuildUpVariant(e.target.value as BuildUpVariant)}
                  className="w-full bg-slate-950 border-2 border-black p-2 rounded text-xs font-black uppercase text-amber-300 focus:outline-none focus:border-amber-400"
                >
                  {(Object.keys(BUILD_UP_VARIANTS) as BuildUpVariant[]).map((vKey) => (
                    <option key={vKey} value={vKey}>
                      {BUILD_UP_VARIANTS[vKey].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TRAINER-ANALYSE PROFI-BUTTON */}
              <button
                onClick={() => setShowTrainerAnalysisModal(true)}
                className="w-full p-2.5 bg-red-600 hover:bg-red-500 text-white border-2 border-black rounded text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <BookOpen size={16} /> Profi-Trainer Analyse öffnen
              </button>

              {/* POSITION PROFILE SELECTOR */}
              <div>
                <label className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 mb-2">
                  <Compass size={14} /> SPIELERPOSITIONEN (11 SPIELER):
                </label>
                <div className="flex flex-wrap gap-1">
                  {runProfiles.map((prof) => (
                    <button
                      key={prof.positionKey}
                      onClick={() => setSelectedPlayerPos(prof.positionKey)}
                      className={`px-2.5 py-1 rounded border border-black text-[11px] font-black uppercase transition-all ${
                        selectedPlayerPos === prof.positionKey
                          ? 'bg-red-600 text-white shadow-sm ring-2 ring-amber-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {prof.positionKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* COLOR INTENSITY & LOAD LEGEND */}
              <div className="bg-slate-950 p-2.5 rounded border border-slate-700 space-y-1.5 text-[10px] font-mono">
                <span className="text-amber-300 font-bold uppercase block">BELASTUNGSANZEIGE & LINIENFARBEN</span>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                  <span>Blau = MIT Ball (Offensiv)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                  <span>Rot = GEGEN den Ball (Defensiv)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
                  <span>Gelb = Umschaltbewegung</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex flex-col gap-1 text-slate-300">
                  <span className="font-bold text-amber-400">Linienbreite / Belastungsstufe:</span>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-400">Dünn (4px): Niedrig</span>
                    <span className="text-emerald-400 font-bold">Mittel (7px): Normal</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-amber-400 font-bold">Dick (11px): Hoch</span>
                    <span className="text-red-400 font-black">Sehr dick (16px): MAXIMAL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CENTER & RIGHT: VOLLFELD-TAKTIKTAFEL 3D & TRAINER-PANEL */}
          <div className={`${isSidebarCollapsed ? 'lg:col-span-4' : 'lg:col-span-3'} flex flex-col gap-3 h-full overflow-hidden transition-all duration-300`}>
            
            {/* 3D PITCH CONTAINER WITH PERSPECTIVE TILT & UNLIMITED ZOOM SCROLL */}
            <div className="flex-1 bg-slate-950 border-4 border-black rounded shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-auto custom-scrollbar flex items-center justify-center p-4 sm:p-8">
              {/* BACKGROUND GRADIENT */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 pointer-events-none" />

              {/* 3D TRANSFORMED STAGE */}
              <div 
                className="relative transition-transform duration-300 ease-out origin-center shrink-0"
                style={{
                  transform: is3DPerspective ? `rotateX(${tiltAngle}deg) scale(${zoomLevel})` : `rotateX(0deg) scale(${zoomLevel})`,
                  transformStyle: 'preserve-3d',
                  width: '800px',
                  height: '520px'
                }}
              >
                {/* SVG PITCH GROUND WITH OFFICIAL MARKINGS */}
                <svg viewBox="0 0 800 520" className="w-full h-full drop-shadow-2xl overflow-visible">
                  {/* PITCH GRASS BACKGROUND & STRIPES */}
                  <rect x="0" y="0" width="800" height="520" fill="#0f381e" rx="16" />
                  
                  {/* Vertical Grass Stripes */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <rect key={i} x={i * 80} y="0" width="40" height="520" fill="#144726" opacity="0.4" />
                  ))}

                  {/* OUTLINE & BOUNDARIES */}
                  <rect x="40" y="30" width="720" height="460" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
                  
                  {/* CENTER LINE */}
                  <line x1="400" y1="30" x2="400" y2="490" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
                  
                  {/* CENTER CIRCLE & SPOT */}
                  <circle cx="400" cy="260" r="70" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
                  <circle cx="400" cy="260" r="4" fill="#ffffff" />

                  {/* LEFT GOAL BOX (AUGGEN ABWEHR) */}
                  <rect x="40" y="145" width="130" height="230" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
                  <rect x="40" y="200" width="45" height="120" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />
                  <circle cx="135" cy="260" r="3" fill="#ffffff" />
                  <path d="M 170 215 A 70 70 0 0 1 170 305" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />

                  {/* RIGHT GOAL BOX (GEGNER PENALTY AREA) */}
                  <rect x="630" y="145" width="130" height="230" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.85" />
                  <rect x="715" y="200" width="45" height="120" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />
                  <circle cx="665" cy="260" r="3" fill="#ffffff" />
                  <path d="M 630 215 A 70 70 0 0 0 630 305" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />

                  {/* CORNER ARCS */}
                  <path d="M 40 50 A 20 20 0 0 1 60 30" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M 40 470 A 20 20 0 0 0 60 490" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M 760 50 A 20 20 0 0 0 740 30" fill="none" stroke="#ffffff" strokeWidth="2.5" />
                  <path d="M 760 470 A 20 20 0 0 1 740 490" fill="none" stroke="#ffffff" strokeWidth="2.5" />

                  {/* HEATMAP CLOUD OVERLAY */}
                  {showHeatmap && (
                    <defs>
                      <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                  )}
                  {showHeatmap && runProfiles.map((p) => 
                    p.heatmapCoords.map((h, i) => (
                      <circle 
                        key={`${p.positionKey}-h-${i}`} 
                        cx={h.x} 
                        cy={h.y} 
                        r={h.r} 
                        fill="url(#heatGradient)" 
                        className="animate-pulse"
                      />
                    ))
                  )}

                  {/* TACTICAL BUILD-UP & PHILOSOPHY OVERLAYS */}
                  <g opacity="0.85" strokeWidth="2.5" strokeDasharray="6,4">
                    {buildUpVariant === '5_ecken' && (
                      <g stroke="#3b82f6" fill="none">
                        <line x1="400" y1="450" x2="260" y2="430" />
                        <line x1="400" y1="450" x2="540" y2="430" />
                        <line x1="260" y1="430" x2="90" y2="360" />
                        <line x1="540" y1="430" x2="710" y2="360" />
                        <circle cx="400" cy="450" r="12" fill="#3b82f6" opacity="0.4" />
                      </g>
                    )}
                    {buildUpVariant === '6er_drehpunkt' && (
                      <g stroke="#fbbf24" fill="none">
                        <circle cx="400" cy="330" r="35" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4,4" />
                        <line x1="280" y1="410" x2="400" y2="330" />
                        <line x1="520" y1="410" x2="400" y2="330" />
                        <line x1="400" y1="330" x2="320" y2="230" />
                        <line x1="400" y1="330" x2="480" y2="230" />
                      </g>
                    )}
                    {buildUpVariant === 'av_fluegel' && (
                      <g stroke="#3b82f6" fill="none">
                        <line x1="90" y1="360" x2="130" y2="180" strokeWidth="3" />
                        <line x1="710" y1="360" x2="670" y2="180" strokeWidth="3" />
                        <path d="M 90 360 Q 180 260 320 230" stroke="#fbbf24" />
                        <path d="M 710 360 Q 620 260 480 230" stroke="#fbbf24" />
                      </g>
                    )}
                    {buildUpVariant === '3er_kette_abkippen' && (
                      <g stroke="#60a5fa" fill="none">
                        <line x1="260" y1="420" x2="400" y2="440" />
                        <line x1="400" y1="440" x2="540" y2="420" />
                        <line x1="90" y1="280" x2="90" y2="180" stroke="#fbbf24" strokeWidth="3" />
                        <line x1="710" y1="280" x2="710" y2="180" stroke="#fbbf24" strokeWidth="3" />
                      </g>
                    )}
                    {buildUpVariant === '6_und_8_dreieck' && (
                      <g stroke="#3b82f6" fill="rgba(59, 130, 246, 0.15)">
                        <polygon points="400,340 310,230 490,230" strokeWidth="3" />
                      </g>
                    )}
                    {buildUpVariant === 'fluegel_dreieck' && (
                      <g stroke="#3b82f6" fill="rgba(59, 130, 246, 0.15)">
                        <polygon points="90,360 310,240 140,160" strokeWidth="3" />
                        <polygon points="710,360 490,240 660,160" strokeWidth="3" />
                      </g>
                    )}
                    {buildUpVariant === 'zehner_verbindung' && (
                      <g stroke="#f59e0b" fill="none">
                        <line x1="400" y1="340" x2="400" y2="170" strokeWidth="3.5" />
                        <circle cx="400" cy="170" r="25" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" strokeWidth="2" />
                      </g>
                    )}
                    {buildUpVariant === 'doppelspitze' && (
                      <g stroke="#ef4444" fill="none">
                        <line x1="400" y1="360" x2="350" y2="110" strokeWidth="3.5" />
                        <line x1="400" y1="360" x2="450" y2="110" strokeWidth="3.5" />
                        <path d="M 350 110 Q 400 160 400 230" stroke="#fbbf24" />
                      </g>
                    )}
                    {buildUpVariant === 'fluegel_lang_st_ausweichen_10er_nachruecken' && (
                      <g stroke="#f59e0b" fill="none">
                        {/* Anspiel nach außen */}
                        <line x1="400" y1="440" x2="110" y2="340" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="5,5" />
                        <circle cx="110" cy="340" r="10" fill="#3b82f6" opacity="0.6" />
                        {/* Langer Flugball auf ausweichenden ST */}
                        <path d="M 110 340 Q 200 130 180 120" stroke="#fbbf24" strokeWidth="4.5" strokeDasharray="8,4" />
                        {/* ST Ausweichbewegung nach außen */}
                        <path d="M 400 110 Q 260 110 180 120" stroke="#38bdf8" strokeWidth="3" />
                        <polygon points="175,115 185,128 190,113" fill="#38bdf8" />
                        {/* Explosives Nachrücken des 10ers in freie Mitte */}
                        <line x1="400" y1="260" x2="400" y2="120" stroke="#ef4444" strokeWidth="4.5" />
                        <polygon points="400,105 392,125 408,125" fill="#ef4444" />
                        {/* Block rückt nach */}
                        <line x1="310" y1="340" x2="310" y2="240" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3,3" />
                        <line x1="490" y1="340" x2="490" y2="240" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="3,3" />
                      </g>
                    )}
                  </g>

                  {/* PHILOSOPHY VECTOR OVERLAY */}
                  <g opacity="0.65">
                    {philosophy === 'positionsspiel' && (
                      <g stroke="#38bdf8" strokeWidth="2" fill="none" strokeDasharray="4,4">
                        <polygon points="400,330 310,230 490,230" />
                        <polygon points="310,230 140,160 400,160" />
                        <polygon points="490,230 660,160 400,160" />
                      </g>
                    )}
                    {philosophy === 'umschaltspiel' && (
                      <g stroke="#f59e0b" strokeWidth="3" fill="none">
                        <line x1="140" y1="200" x2="140" y2="80" />
                        <line x1="400" y1="200" x2="400" y2="80" />
                        <line x1="660" y1="200" x2="660" y2="80" />
                      </g>
                    )}
                    {philosophy === 'gegenpressing' && (
                      <g stroke="#ef4444" strokeWidth="2.5" fill="none">
                        <circle cx="400" cy="190" r="60" stroke="#ef4444" strokeWidth="3" className="animate-ping" />
                        <circle cx="400" cy="190" r="60" stroke="#ef4444" strokeWidth="2" />
                      </g>
                    )}
                    {philosophy === 'fluegelueberladung' && (
                      <g stroke="#3b82f6" strokeWidth="2.5" fill="none">
                        <rect x="50" y="40" width="220" height="440" fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" />
                        <line x1="270" y1="260" x2="650" y2="160" stroke="#fbbf24" strokeWidth="4" strokeDasharray="8,4" />
                      </g>
                    )}
                    {philosophy === 'kompaktheit' && (
                      <g stroke="#10b981" strokeWidth="2.5" fill="none">
                        <rect x="250" y="150" width="300" height="220" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" strokeWidth="3" />
                      </g>
                    )}
                  </g>

                  {/* RUN CURVES (SVG PATHS) FOR ALL 11 POSITIONS */}
                  {runProfiles.map((p) => {
                    const isSelected = selectedPlayerPos === p.positionKey;
                    const pathD = phase === 'mit_ball' ? p.pathDMitBall : phase === 'gegen_ball' ? p.pathDGegenBall : p.pathDUmschalten;
                    const lineColor = PHASE_COLOR[phase];
                    const strokeWidth = showLoadZones ? p.strokeWidth : 5;

                    return (
                      <g key={`run-${p.positionKey}`}>
                        {/* PATH LINE WITH LOAD-BASED STROKE WIDTH */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke={isSelected ? '#f59e0b' : lineColor}
                          strokeWidth={isSelected ? strokeWidth + 3 : strokeWidth}
                          strokeDasharray={phase === 'gegen_ball' ? '8,4' : 'none'}
                          opacity={isSelected ? 1 : 0.75}
                          className="transition-all duration-300"
                        />

                        {/* ANIMATED PULSING NODE MARKER ALONG PATH */}
                        {isAnimating && (
                          <circle
                            cx={getPointOnPathProgress(pathD, animProgress).x}
                            cy={getPointOnPathProgress(pathD, animProgress).y}
                            r={isSelected ? 7 : 5}
                            fill={isSelected ? '#fbbf24' : lineColor}
                            className="animate-pulse"
                          />
                        )}
                      </g>
                    );
                  })}

                  {/* 3D PLAYER NODES (11 FC AUGGEN PLAYERS) */}
                  {runProfiles.map((p) => {
                    const isSelected = selectedPlayerPos === p.positionKey;
                    const nodeX = p.nodeCoords2D.x;
                    const nodeY = p.nodeCoords2D.y;

                    return (
                      <g 
                        key={`node-${p.positionKey}`}
                        onClick={() => setSelectedPlayerPos(p.positionKey)}
                        className="cursor-pointer group"
                      >
                        {/* SELECTION GLOW */}
                        {isSelected && (
                          <circle cx={nodeX} cy={nodeY} r="24" fill="#f59e0b" opacity="0.35" className="animate-ping" />
                        )}

                        {/* PLAYER NODE DISK */}
                        <circle 
                          cx={nodeX} 
                          cy={nodeY} 
                          r={isSelected ? 18 : 15} 
                          fill={isSelected ? '#ef4444' : '#1e293b'} 
                          stroke={isSelected ? '#fbbf24' : '#38bdf8'} 
                          strokeWidth={isSelected ? 3.5 : 2}
                          className="transition-all transform group-hover:scale-110"
                        />

                        {/* POSITION TEXT LABEL */}
                        <text
                          x={nodeX}
                          y={nodeY + 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={isSelected ? "12" : "10"}
                          fontWeight="900"
                          fontFamily="monospace"
                          pointerEvents="none"
                        >
                          {p.positionKey}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* OVERLAY TRAINER HUD (TACTICAL COCKPIT ON PITCH) */}
                {showTrainerHUD && (
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 border-2 border-black p-3 rounded-xl shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs border-amber-400/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-600 border border-black flex items-center justify-center font-black text-white shrink-0">
                        {selectedPlayerPos}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-400 uppercase tracking-wider">
                            POSITION {selectedPlayerPos} ({phase.toUpperCase()})
                          </span>
                          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                            Belastung: {proAnalysis.loadProfileSummary.split('Belastungsstufe')[1] || 'Hoch'}
                          </span>
                        </div>
                        <p className="text-slate-200 font-medium text-[11px] mt-0.5">
                          {phase === 'mit_ball' ? currentFormationData.positions.find(p=>p.positionKey===selectedPlayerPos)?.trainerAdviceMitBall : currentFormationData.positions.find(p=>p.positionKey===selectedPlayerPos)?.trainerAdviceGegenBall}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowTrainerAnalysisModal(true)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-3 py-1.5 rounded-lg font-black uppercase text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
                    >
                      <BookOpen size={14} /> Trainer-Analyse ({formation})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BOTTOM TRAINER EXECUTIVE SUMMARY & QUICK TACTICAL PRESETS */}
            <div className="bg-slate-900 border-4 border-black p-3 rounded shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-400 text-black border-2 border-black font-black flex items-center justify-center rounded">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider">
                    TAKTIK & SPIELAUFBAU STATUS
                  </h4>
                  <p className="text-xs text-slate-200 font-bold">
                    Formation: <span className="text-amber-300 font-mono">{formation}</span> • Philosophie: <span className="text-blue-400">{proAnalysis.philosophyDetails.name}</span> • Aufbau: <span className="text-emerald-400">{proAnalysis.buildUpDetails.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setBuildUpVariant('fluegel_lang_st_ausweichen_10er_nachruecken');
                    setPhase('mit_ball');
                    setActiveToast('Variante: Spiel nach außen & Flugball (10er rückt nach) aktiviert!');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white border-2 border-black rounded text-xs font-black uppercase flex items-center gap-1 shadow-sm transition-all"
                >
                  <Zap size={14} /> Spezial-Aufbau (Flügel + ST + 10er)
                </button>
                <button
                  onClick={() => setShowTrainerAnalysisModal(true)}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white border-2 border-black rounded text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <BookOpen size={14} /> Vollanalyse Öffnen
                </button>
              </div>
            </div>

          </div>
        </div>














      {/* FORMATION COMPARISON MODAL */}
      {showComparisonModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-black p-5 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-black uppercase text-amber-400 flex items-center gap-2">
                <ArrowRightLeft size={20} /> UNTERSCHIEDS-ANALYSE: {comparison.fromFormation} ➔ {comparison.toFormation}
              </h3>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1 bg-slate-800 hover:bg-red-600 rounded text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="font-bold text-amber-300 block mb-1 uppercase">ZUSAMMENFASSUNG FORMATIONSWECHSEL:</span>
                <p className="text-slate-200 leading-relaxed">{comparison.summaryText}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-blue-900">
                  <span className="font-bold text-blue-400 block mb-1 uppercase">VERÄNDERUNGEN MIT BALL:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {comparison.mitBallChanges.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-red-900">
                  <span className="font-bold text-red-400 block mb-1 uppercase">VERÄNDERUNGEN GEGEN DEN BALL:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {comparison.gegenBallChanges.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded border border-amber-900">
                  <span className="font-bold text-amber-400 block mb-1 uppercase">ROLLENVERÄNDERUNGEN:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {comparison.roleChanges.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-emerald-900">
                  <span className="font-bold text-emerald-400 block mb-1 uppercase">BELASTUNGSVERÄNDERUNGEN:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {comparison.loadChanges.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 flex flex-col sm:flex-row justify-between gap-2">
                <div>
                  <span className="text-slate-400 font-bold block">Pressinghöhe:</span>
                  <span className="text-amber-300 font-bold">{comparison.pressingHeightChange}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Kompaktheit:</span>
                  <span className="text-emerald-300 font-bold">{comparison.kompaktheitChange}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="bg-amber-400 hover:bg-amber-500 text-black font-black uppercase px-4 py-2 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Verstanden & Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFI TRAINER-ANALYSE MODAL */}
      {showTrainerAnalysisModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-4 border-black p-6 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-3xl w-full text-white space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 text-white border-2 border-black flex items-center justify-center font-black">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-amber-400 tracking-wider">
                    PROFI-TRAINER ANALYSE & EMPFEHLUNGEN
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    FC Auggen Taktik-Engine • Formation {formation} • {proAnalysis.philosophyDetails.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTrainerAnalysisModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-red-600 rounded text-slate-300 border border-black"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tactical Badges */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="bg-blue-600 text-white px-2.5 py-1 rounded border border-black font-bold">
                Formation: {formation}
              </span>
              <span className="bg-amber-500 text-black px-2.5 py-1 rounded border border-black font-black">
                Phase: {phase.toUpperCase()}
              </span>
              <span className="bg-red-600 text-white px-2.5 py-1 rounded border border-black font-bold">
                Position: {selectedPlayerPos}
              </span>
              <span className="bg-emerald-600 text-white px-2.5 py-1 rounded border border-black font-bold">
                {proAnalysis.philosophyDetails.name}
              </span>
            </div>

            {/* Analysis Sections */}
            <div className="space-y-4 text-xs">
              
              {/* 1. SPIELAUFBAU (MIT BALL) */}
              <div className="bg-slate-950 p-4 rounded border-2 border-blue-600 space-y-2">
                <h4 className="font-black text-blue-400 uppercase text-xs flex items-center gap-2">
                  <Target size={16} /> 1. SPIELAUFBAU (MIT BALL)
                </h4>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {proAnalysis.mitBallSummary}
                </p>
                <div className="pt-2 border-t border-slate-800 text-slate-300 font-mono">
                  <strong className="text-amber-300">Variante:</strong> {proAnalysis.buildUpDetails.name}<br />
                  <strong className="text-amber-300">Ziel:</strong> {proAnalysis.buildUpDetails.goal}
                </div>
              </div>

              {/* 2. GEGEN DEN BALL & PRESSING */}
              <div className="bg-slate-950 p-4 rounded border-2 border-red-600 space-y-2">
                <h4 className="font-black text-red-400 uppercase text-xs flex items-center gap-2">
                  <ShieldAlert size={16} /> 2. GEGEN DEN BALL (DEFENSIV & PRESSING)
                </h4>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {proAnalysis.gegenBallSummary}
                </p>
              </div>

              {/* 3. UMSCHALTEN */}
              <div className="bg-slate-950 p-4 rounded border-2 border-amber-500 space-y-2">
                <h4 className="font-black text-amber-400 uppercase text-xs flex items-center gap-2">
                  <Zap size={16} /> 3. UMSCHALTBEWEGUNG & COMPACTNESS
                </h4>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {proAnalysis.umschaltSummary}
                </p>
              </div>

              {/* 4. BELASTUNGSPROFIL */}
              <div className="bg-slate-950 p-4 rounded border-2 border-emerald-600 space-y-2">
                <h4 className="font-black text-emerald-400 uppercase text-xs flex items-center gap-2">
                  <Activity size={16} /> 4. BELASTUNGSANALYSE FOR POSITION {selectedPlayerPos}
                </h4>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {proAnalysis.loadProfileSummary}
                </p>
              </div>

              {/* 5. KONKRETE TRAINER-EMPFEHLUNGEN */}
              <div className="bg-slate-950 p-4 rounded border-2 border-amber-400 space-y-2">
                <h4 className="font-black text-amber-300 uppercase text-xs flex items-center gap-2">
                  <Award size={16} /> 5. KONKRETE TRAINER-EMPFEHLUNGEN
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-200 font-medium">
                  {proAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* LEVEL 3 EVALUATION MANDATORY SENTENCE */}
              <div className="bg-red-950/60 p-3 rounded border border-red-500 text-amber-300 font-mono text-center font-bold italic">
                {proAnalysis.level3Sentence}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setShowTrainerAnalysisModal(false)}
                className="bg-amber-400 hover:bg-amber-500 text-black font-black uppercase px-5 py-2.5 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Analyse Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

