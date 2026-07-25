export type TabId = 'personnel' | 'attendance' | 'trainer_view' | 'yearly' | 'cards' | 
                   'scouting' | 'budget_finance' | 'meetings_calendar' | 'tacticboard' | 'individual_control' | 'runs_sw' | 'physio_plan' | 'summer_prep' | 'winter_prep' | 'team_list' | 'developer_tasks' | 'training_planning' | 'competitive_planning' | 'test_planning' | 'match_report' | 'access_control' | 'player_portal';

export interface MatchAnalysis {
  id: string; // analysis id
  matchId?: string | number;
  opponent?: string;
  date?: string;
  category?: 'Pflichtspiel' | 'Testspiel' | 'Pokalspiel' | string;
  isHome?: boolean;
  result?: string;
  lineupImage?: string;
  lineupImages?: string[];
  openingPlay?: string;
  openingPlayImages?: string[];
  transitionOffensive?: string;
  transitionOffensiveImages?: string[];
  transitionDefensive?: string;
  transitionDefensiveImages?: string[];
  goalChancesOwn?: string;
  goalChancesOwnImages?: string[];
  goalChancesOpponent?: string;
  goalChancesOpponentImages?: string[];
  goalsOwn?: string;
  goalsOpponent?: string;
  goodActions?: string;
  badActions?: string;
  specialMoments?: string;
  standardsOwn?: string;
  standardsOwnImages?: string[];
  standardsOpponent?: string;
  standardsOpponentImages?: string[];
  trainerGood?: string;
  trainerGoodImages?: string[];
  trainerBad?: string;
  trainerBadImages?: string[];
  trainerTactical?: string;
  trainerFazit?: string;
  trainerFazitImages?: string[];
  playerOfTheMatch?: string;
  matchRating?: string; // e.g. "7/10"
  presentations?: string; // Links or notes about game presentations
  presentationImages?: string[]; // Array of image URLs for presentations
}

export interface LogEntry {
  id: string;
  timestamp: string;
  dateStr: string;
  timeStr: string;
  tabName: string;
  message: string;
}

export interface Training {
  id: string;
  datum: string;
  wochentag: string;
  uhrzeit: string;
  ort: string;
  inhalte: string;
  teilnehmer: string[]; // IDs or names
  fehlend: string[];    // IDs or names
}

export interface Vorbereitung {
  id: string;
  date: string;
  time: string;
  type: string;
  content: string;
  inhalt?: string; // Alias for content
  intensity: string;
  location: string;
  status?: string; // Added status field
  notes?: string; // Added notes field
  color?: string; // Added color field
  // Detailed session fields to match DayPlan
  athletik?: { start: string; end: string; notes: string };
  vormittag?: { start: string; end: string; notes: string };
  individual?: { start: string; end: string; notes: string };
  video?: { start: string; end: string; notes: string };
  training?: { start: string; end: string; notes: string };
  // Additional fields for PreparationView
  kw?: number;
  day?: string;
  start?: string;
  end?: string;
  opponent?: string;
  remarks?: string;
  te?: number;
  treffpunkt?: string;
  ergebnis?: string;
  // Compatibility with older fields
  datum?: string;
  wochentag?: string;
  gegner?: string;
  ort?: string;
  thema?: string;
  intensität?: string;
}

export type SummerPrepUnit = Vorbereitung;
export type WinterPrepUnit = Vorbereitung;

export interface Spiel {
  id: string;
  datum: string;
  wochentag: string;
  gegner: string;
  heim_auswärts: 'Heim' | 'Auswärts';
  uhrzeit?: string;
  treffpunkt?: string;
  ort?: string;
  ergebnis: string;
  tore: string[];
  karten: string[];
  analyse: string;
}

export interface Finanz {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  pos: string;
  baseSalary: number;
  bonusPerMatch: number;
  seasonExtra: number;
  individualBonus: number;
  sideAgreements: string;
  ist: number;
  nr?: number;
  // Compatibility with older fields
  aktuelles_budget?: number;
  einnahmen?: number;
  ausgaben?: number;
  kategorie?: string;
  datum?: string;
  wochentag?: string;
  notiz?: string;
}

export type FinanceEntry = Finanz;

export interface DayPlan {
  date: string; // ISO string
  athletik: { start: string; end: string; notes: string };
  vormittag: { start: string; end: string; notes: string };
  individual: { start: string; end: string; notes: string };
  video: { start: string; end: string; notes: string };
  training: { start: string; end: string; notes: string };
  activity: string; // Haupt-Aktivität
  time: string; // Uhrzeit for activity
  location: string; // Ort for activity
  treffpunkt?: string; // Added treffpunkt
  opponent?: string; // Added opponent
  ergebnis?: string; // Added ergebnis
  type: 'training' | 'competitive' | 'test' | 'off' | 'Testspiel' | 'Pflichtspiel' | 'Event';
  isHome?: boolean;
  phase: 'summer' | 'winter' | 'season';
  kw?: number;
  te?: number;
  status?: string;
  notes?: string;
}

export interface YearlyPlan {
  [date: string]: DayPlan;
}

export interface CardRecord {
  playerId: string;
  cards: Record<string | number, 'G' | 'GR' | 'R' | ''>; // match id -> card type
}

export interface Opponent {
  id: string;
  name: string;
  logo?: string;
  notes?: string;
}

export interface Match {
  id: number | string;
  index?: number;
  opponent: string;
  location: string;
  isHome: boolean;
  kickOff: string;
  meetingTime: string;
  meetingPoint?: string;
  result?: string;
  endTime?: string;
  date?: string;
  competition?: string;
  trainerNote?: string;
  notes?: string;
}

export interface MatchPlanningEntry {
  id: string;
  playerId: string;
  matchId: string;
  date?: string;
  opponent?: string;
  location?: string;
  meeting?: string;
  start?: string;
  end?: string;
  result?: string;
  playtime?: string;
  trainerNote?: string;
  notes?: string;
}

export interface MatchMinuteRecord {
  playerId: string;
  minutes: Record<string | number, number>; // match id -> minutes
  matchMinutes?: Record<string | number, number>; // for backward compatibility
  matchAvailability?: Record<string | number, 'Anwesend' | 'Verletzt' | 'Entschuldigt' | ''>;
  details?: Record<string | number, { start: string, end: string, notes: string }>; // match id -> details
}

export interface AttendanceRecord {
  id: string;
  playerId: string;
  sessions: Record<number, string>; // session number (1-120) -> status code
}

export interface RunRecord {
  id: string;
  playerId: string;
  runs: Record<number, string>;
}

export interface RunMeta {
  id: string;
  name: string;
  date: string;
  content?: string;
}

export interface Player {
  id: string;
  number: number;
  firstName: string;
  lastName: string;
  position: string;
  category: 'player' | 'coach' | 'staff' | 'medical';
  image?: string;
  additionalImages?: string[];
  geburtsdatum?: string;
  wochentag?: string;
  status?: string;
  notizen?: string;
  adresse?: string;
  telefon?: string;
  email?: string;
  oberteil?: string;
  kurze_hose?: string;
  lange_hose?: string;
  schuhe?: string;
  injuryHistory?: string;
  professionalStatus?: 'Student' | 'Schüler' | 'Arbeitslos' | 'Angestellter' | string;
  education?: string;
  employer?: string;
  secondaryPositions?: string[];
  marketValue?: string;
  potential?: number;
  einsatzzeitenGesamt?: number;
  testEinsatzzeitenGesamt?: number;
  physical?: {
    height?: number;
    weight?: number;
    bodyFat?: number;
    strongFoot?: 'Rechts' | 'Links' | 'Beidfüßig';
  };
  diagnostics?: {
    ift?: string;
    sprint30m?: string;
    sprintwert?: string;
    yoyotest?: string;
    jumpHeight?: string;
  };
  finance?: {
    baseSalary: number;
    bonusPerMatch: number;
    months?: number;
    transferFeeIn?: number;
    transferFeeOut?: number;
    seasonExtra?: number;
    individualBonus?: number;
    sideAgreements?: string;
    sideAgreementAmount?: number;
    ist: number;
  };
  analysis?: {
    strengths?: string;
    weaknesses?: string;
    development?: string;
    seasonGoals?: string;
  };
  datenblattReport?: {
    verein?: string;
    saison?: string;
    playerStatus?: string;
    analysedatum?: string;
    kpi10m?: string;
    kpi10mBenchmark?: string;
    kpi10mStatus?: string;
    kpi30m?: string;
    kpi30mBenchmark?: string;
    kpi30mStatus?: string;
    kpiYoyo?: string;
    kpiYoyoBenchmark?: string;
    kpiYoyoStatus?: string;
    kpiJump?: string;
    kpiJumpBenchmark?: string;
    kpiJumpStatus?: string;
    sheetMinutes?: string;
    sheetGoalsAssists?: string;
    sheetPassAccuracy?: string;
    sheetTackleRate?: string;
    taktischeKernkompetenz?: string;
    optimierungsPotenzial?: string;
    naechsteMassnahmen?: string;
    sheetLogs?: {
      id?: string;
      title?: string;
      focus?: string;
      duration?: string;
      rpe?: string;
    }[];
  };
  trackerAnalysis?: {
    fileName?: string;
    fileUrl?: string;
    uploadDate?: string;
    totalDistanceKm?: number;
    highSpeedDistanceM?: number;
    sprintDistanceM?: number;
    maxSpeedKmh?: number;
    sprintCount?: number;
    accelerations?: number;
    decelerations?: number;
    avgHeartRateBpm?: number;
    maxHeartRateBpm?: number;
    workloadIndex?: number;
    heatMapZone?: string;
    tacticalSummary?: string;
    recommendations?: string;
    matchName?: string;
    rawText?: string;
  };
  trackerHistory?: {
    id: string;
    fileName: string;
    fileUrl?: string;
    matchName?: string;
    uploadDate: string;
    totalDistanceKm: number;
    highSpeedDistanceM: number;
    sprintDistanceM: number;
    maxSpeedKmh: number;
    sprintCount: number;
    tacticalSummary: string;
  }[];
}

export interface Spieler extends Player {
  name: string; // Full name for compatibility
  nummer: number; // Alias for number
  geburtsdatum: string;
  wochentag: string;
  status: string;
  notizen: string;
}

export interface MeetingEntry {
  id: string;
  date: string;
  time: string;
  playerName: string;
  manualName?: string;
  location: string;
  notes: string;
  reason?: string;
  status?: 'Offen' | 'Zusage' | 'Absage';
  isScout?: boolean;
}

export interface ExternalPerson {
  id: string;
  name: string;
  role: string;
  category: 'coach' | 'staff' | 'medical';
}

export interface TrainingDocumentGlobal {
  id: string;
  name: string;
  url?: string; // Optional to allow metadata-only fetching
  uploadedAt: string;
  mimeType: string;
}

export interface TrainingDocumentContent {
  id: string;
  base64: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  weekday: string;
  group: string;
  load: string;
  duration: string;
  weeklyFocus: string;
  sessionFocus: string;
  trainer: string;
  intensity: string;
  status?: string;
  opponent?: string;
  location?: string;
  trainingDocumentId?: string | null;
  players: { name: string; position: string; status: 'Aktiv' | 'Verletzt' | 'Abwesend' | 'U23' | 'U19' | '1' | 'A' | 'B'; category?: string }[];
  content: { 
    warmup: string; 
    warmupDuration?: string;
    warmupImages?: string[];
    main1: string; 
    main1Duration?: string;
    main1Images?: string[];
    main2: string; 
    main2Duration?: string;
    main2Images?: string[];
    closing: string; 
    closingDuration?: string;
    closingImages?: string[];
  };
  importantInfo: string;
  importantInfoImages?: string[];
  remarks: string;
  remarksImages?: string[];
}

export interface IndividualTrainingRecord {
  id?: string;
  date: string;
  playerId: string;
  focus: string;
  goals: string;
  status: string;
  load: string;
  targetDate: string;
  ek: string;
  o: string;
  t: string;
  p: string;
  s: string;
  a: string;
  w: string;
  notes: string;
}

export interface DepthChartEntry {
  position: string;
  slots: string[]; // 3 slots
}

export interface ScoutingEntry {
  id: string;
  name: string;
  age: number;
  position: string;
  club: string;
  marketValue: string;
  recommendation: 'Verpflichten' | 'Beobachten' | 'Kein Interesse';
  category: 'Abwehr' | 'Mittelfeld' | 'Flügel' | 'Sturm' | 'Sonstige';
  date: string; // Added date
  createdAt?: number; // Added for sorting
  conversationNotes?: string;
  waitingTime?: string;
  status?: string;
}

export interface TransferNeed {
  position: string;
  currentCount: number;
  targetCount: number;
  priority: 'Hoch' | 'Mittel' | 'Gering';
}

export interface TransferMarketEntry {
  id: string;
  name: string;
  club: string;
  fee: string;
  salary: string;
  contractDuration: string;
  role: string;
  status: string;
}

export interface PlayerPerformance {
  id: string;
  playerId: string;
  playerName: string;
  position: string;
  totalDistance: number;
  lowIntensityDistance: number;
  mediumIntensityDistance: number;
  highIntensityDistance: number;
  highIntensityRuns: number;
  sprintCount: number;
  sprintDuration: number;
  topSpeed: number;
  accelerations: number;
  decelerations: number;
  playerLoad: number;
  stressZones?: { low: number; medium: number; high: number };
  heatmap?: { x: number; y: number }[];
  sprintmap?: { x: number; y: number }[];
  movementPattern?: string;
  formCurve?: number[];
  technique: number;
  tactics: number;
  mentality: number;
  decisionMaking: number;
  pressureBehavior: number;
  rating: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  trend?: 'positiv' | 'stagnierend' | 'rückläufig';
  nlzAnalysis?: string;
  jahrgang?: number;
}

export interface PlayerPerformanceTeam {
  id: string;
  teamOverview: string;
  updatedAt: number;
}
