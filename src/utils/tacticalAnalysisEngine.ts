export type TacticalFormation = 
  | '4-3-3' 
  | '4-2-3-1' 
  | '3-5-2' 
  | '4-4-2' 
  | '3-4-3' 
  | '4-1-4-1' 
  | '3-4-1-2';

export type GamePhase = 'mit_ball' | 'gegen_ball' | 'umschalten';
export type LoadLevel = 'niedrig' | 'mittel' | 'hoch' | 'max';

export type TacticalPhilosophy = 
  | 'positionsspiel'     // Guardiola: Raumkontrolle, Dreiecksbildung, Geduld
  | 'umschaltspiel'      // Klopp: Vertikale Dynamik, sofortiger Tiefenlauf
  | 'gegenpressing'      // Nagelsmann: Ballverlust = Angriffsauslöser
  | 'fluegelueberladung' // Tuchel: Überzahl am Flügel, diagonale Läufe
  | 'kompaktheit';       // Simeone: Enge Staffelung, kurze Wege, Disziplin

export type BuildUpVariant =
  | '5_ecken'            // TW, IV-L, IV-R, LV, RV
  | '6er_drehpunkt'      // DM als Drehpunkt im Zentrum
  | 'av_fluegel'         // Spielaufbau über AV links/rechts
  | '3er_kette_abkippen' // DM kippt zwischen die IVs
  | '6_und_8_dreieck'    // Dreiecksspiel im Zentrum (DM + ZMs)
  | 'fluegel_dreieck'    // RA/LA + AV + ZM am Flügel
  | 'zehner_verbindung'  // OM als Verbindungsspieler in Zone 14
  | 'doppelspitze'       // Spiel auf ST + Tandem partner
  | 'fluegel_lang_st_ausweichen_10er_nachruecken'; // Spiel nach außen & Langer Ball auf ausweichenden ST (10er rückt nach)

export interface PositionRunData {
  positionKey: string;
  positionLabel: string;
  roleMitBall: string;
  roleGegenBall: string;
  mitBallPattern: string;
  gegenBallPattern: string;
  loadLevel: LoadLevel;
  strokeWidth: number; // 3 = niedrig, 5 = mittel, 8 = hoch, 12 = max
  pathDMitBall: string;
  pathDGegenBall: string;
  pathDUmschalten: string;
  heatmapCoords: { x: number; y: number; r: number }[];
  trainerAdviceMitBall: string;
  trainerAdviceGegenBall: string;
  nodeCoords2D: { x: number; y: number };
}

export interface FormationAnalysis {
  formation: TacticalFormation;
  name: string;
  pressingHeight: 'Hoch' | 'Mittelhoch' | 'Kompakt-Tief';
  kompaktheit: 'Extrem Kompakt' | 'Ausgewogen' | 'Breit-Fächernd';
  offensiveFocus: string;
  defensiveFocus: string;
  positions: PositionRunData[];
}

export interface FormationComparison {
  fromFormation: TacticalFormation;
  toFormation: TacticalFormation;
  mitBallChanges: string[];
  gegenBallChanges: string[];
  roleChanges: string[];
  loadChanges: string[];
  pressingHeightChange: string;
  kompaktheitChange: string;
  summaryText: string;
}

// Stroke Width per Load Level
export const LOAD_STROKE_WIDTH: Record<LoadLevel, number> = {
  niedrig: 4,
  mittel: 7,
  hoch: 11,
  max: 16,
};

// Line Color per Game Phase
export const PHASE_COLOR: Record<GamePhase, string> = {
  mit_ball: '#3b82f6',   // Blau (Offensiv)
  gegen_ball: '#ef4444', // Rot (Defensiv)
  umschalten: '#eab308', // Gelb (Umschaltmoment)
};

// Helper to calculate load width
export const getLoadWidth = (level: LoadLevel): number => LOAD_STROKE_WIDTH[level] || 5;

// Comprehensive 7 Formations Data Repository
export const FORMATION_REPOSITORY: Record<TacticalFormation, FormationAnalysis> = {
  '4-3-3': {
    formation: '4-3-3',
    name: '4-3-3 Offensiv-Dominanz',
    pressingHeight: 'Hoch',
    kompaktheit: 'Ausgewogen',
    offensiveFocus: 'Hohe Flügelbreite, Halbraum-Einbrüche der Wingers & tiefe ST-Läufe.',
    defensiveFocus: 'Explosives Gegenpressing im 4-3-3 Dreieck, Außenverteidigung rückt aggressiv nach.',
    positions: [
      {
        positionKey: 'ST',
        positionLabel: 'Stürmer (ST)',
        roleMitBall: 'Tiefenlauf hinter die Kette & Halbraum-Einbruch',
        roleGegenBall: 'Pressing-Auslöser & Anlaufen der gegnerischen IVs',
        mitBallPattern: '3D-Tiefenlauf hinter IV & diagonale Strafraumbewegung',
        gegenBallPattern: 'Explosive Anlaufkurve auf ballführenden IV',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 400 220 Q 480 150 560 90',
        pathDGegenBall: 'M 400 110 Q 460 160 380 220',
        pathDUmschalten: 'M 400 110 L 400 240',
        heatmapCoords: [{ x: 560, y: 110, r: 75 }, { x: 420, y: 180, r: 60 }],
        trainerAdviceMitBall: 'Für die Position ST ist dieser diagonale 3D-Tiefenlauf typisch. Nutzt die Schnittstelle hinter der IV-Kette.',
        trainerAdviceGegenBall: 'Für die Position ST ist dieser Pressing-Auslöser typisch. Schneidet den Passweg zum LV ab.',
        nodeCoords2D: { x: 400, y: 110 },
      },
      {
        positionKey: 'LA',
        positionLabel: 'Linker Flügel (LA)',
        roleMitBall: 'Außenbahn-Sprint & Halbraum-Diagonallauf',
        roleGegenBall: 'Rückwärtige Sprints & Flügelabsicherung',
        mitBallPattern: 'Iso-Sprint an der Außenbahn mit Cut-Inside',
        gegenBallPattern: 'Rückwärtssprint zur Flügelabsicherung',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 150 260 Q 230 180 340 120',
        pathDGegenBall: 'M 150 150 L 190 290',
        pathDUmschalten: 'M 150 150 L 250 250',
        heatmapCoords: [{ x: 260, y: 160, r: 70 }],
        trainerAdviceMitBall: 'Für die Position LA ist dieser Halbraum-Diagonallauf typisch. Bindet den RV.',
        trainerAdviceGegenBall: 'Für die Position LA sind rückwärtige Sprints typisch. Flügel absichern.',
        nodeCoords2D: { x: 150, y: 150 },
      },
      {
        positionKey: 'RA',
        positionLabel: 'Rechter Flügel (RA)',
        roleMitBall: 'Außenbahn-Sprint & 1v1 Iso-Lauf',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Lange Sprintlinie Außenbahn bis Grundlinie',
        gegenBallPattern: 'Rückwärtiges Doppelnetz mit RV',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 650 260 L 730 140 L 640 90',
        pathDGegenBall: 'M 650 150 L 610 290',
        pathDUmschalten: 'M 650 150 L 550 250',
        heatmapCoords: [{ x: 680, y: 140, r: 70 }],
        trainerAdviceMitBall: 'Für die Position RA ist dieser Tempo-Sprint typisch. Nutzt maximale Breite.',
        trainerAdviceGegenBall: 'Für die Position RA ist der Rückwärtssprint überlastend. Belastung beachten.',
        nodeCoords2D: { x: 650, y: 150 },
      },
      {
        positionKey: 'ZM-L',
        positionLabel: 'Zentrales Mittelfeld Links (ZM-L)',
        roleMitBall: 'Pendelbewegung, Zwischenraum & Passverlagerung',
        roleGegenBall: 'Kompaktes Verschieben & ballorientiertes Pressing',
        mitBallPattern: 'Halbraum-Unterstützung & Nachrücken',
        gegenBallPattern: 'Aggressiver Zweikampf-Anlauf im Halbraum',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 280 320 C 320 280, 260 220, 310 190',
        pathDGegenBall: 'M 280 270 L 320 330',
        pathDUmschalten: 'M 280 270 L 300 220',
        heatmapCoords: [{ x: 300, y: 260, r: 75 }],
        trainerAdviceMitBall: 'Für die Position ZM-L ist diese Pendelbewegung typisch. Bietet Passoption im Halbraum.',
        trainerAdviceGegenBall: 'Für die Position ZM-L ist dieses kompakte Verschieben typisch. Zentrum schließen.',
        nodeCoords2D: { x: 280, y: 270 },
      },
      {
        positionKey: 'ZM-R',
        positionLabel: 'Zentrales Mittelfeld Rechts (ZM-R)',
        roleMitBall: 'Pendelbewegung, Vorstoß & Verlagerung',
        roleGegenBall: 'Kompaktes Verschieben & Balleroberung',
        mitBallPattern: 'Diagonale Zirkulation & Box-Entry',
        gegenBallPattern: 'Anpressen des gegnerischen Sechsers',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 520 320 C 480 280, 540 220, 490 190',
        pathDGegenBall: 'M 520 270 L 480 330',
        pathDUmschalten: 'M 520 270 L 500 220',
        heatmapCoords: [{ x: 500, y: 260, r: 75 }],
        trainerAdviceMitBall: 'Für die Position ZM-R ist dieser Vorstoß typisch. Schafft Überzahl.',
        trainerAdviceGegenBall: 'Für die Position ZM-R ist das Schließen der Passwege typisch.',
        nodeCoords2D: { x: 520, y: 270 },
      },
      {
        positionKey: 'DM',
        positionLabel: 'Defensives Mittelfeld (DM)',
        roleMitBall: 'Spielaufbau, Tiefes Anbieten & Absicherung',
        roleGegenBall: 'Zentrum sperren & Restverteidigung',
        mitBallPattern: 'Horizontale Zirkulationslinie vor der Kette',
        gegenBallPattern: 'Querverschieben als Abwehrriegel',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 350 360 L 450 360',
        pathDGegenBall: 'M 350 340 L 450 340',
        pathDUmschalten: 'M 400 340 L 400 310',
        heatmapCoords: [{ x: 400, y: 340, r: 85 }],
        trainerAdviceMitBall: 'Für die Position DM ist die tiefe Aufbausteuerung typisch.',
        trainerAdviceGegenBall: 'Für die Position DM ist das Sichern des Zentrums vor den IVs typisch.',
        nodeCoords2D: { x: 400, y: 340 },
      },
      {
        positionKey: 'LV',
        positionLabel: 'Linker Außenverteidiger (LV)',
        roleMitBall: 'Überlappung & Flügel-Aufrücken',
        roleGegenBall: 'Rückwärtiger Sprint & Diagonales Verschieben',
        mitBallPattern: 'Flügel-Aufrückbewegung & Hinterlaufen',
        gegenBallPattern: 'Rückwärtssprint zur Absicherung',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 140 380 Q 120 280 180 210',
        pathDGegenBall: 'M 140 380 L 180 420',
        pathDUmschalten: 'M 140 380 L 140 300',
        heatmapCoords: [{ x: 140, y: 320, r: 65 }],
        trainerAdviceMitBall: 'Für die Position LV ist diese Überlappung typisch. Flankenoption erzeugen.',
        trainerAdviceGegenBall: 'Für die Position LV ist der Rückwärtssprint entscheidend bei Ballverlust.',
        nodeCoords2D: { x: 140, y: 380 },
      },
      {
        positionKey: 'RV',
        positionLabel: 'Rechter Außenverteidiger (RV)',
        roleMitBall: 'Überlappung & Außenbahn-Vorstoß',
        roleGegenBall: 'Rückwärtiger Sprint & Diagonales Verschieben',
        mitBallPattern: 'Lange Außenbahn-Kurve über RA',
        gegenBallPattern: 'Einrücken & Abdrängen nach außen',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 660 380 Q 740 280 720 210',
        pathDGegenBall: 'M 660 380 L 620 420',
        pathDUmschalten: 'M 660 380 L 660 300',
        heatmapCoords: [{ x: 680, y: 320, r: 65 }],
        trainerAdviceMitBall: 'Für die Position RV ist dieser Überlappungslauf typisch.',
        trainerAdviceGegenBall: 'Für die Position RV ist das diagonale Einrücken typisch.',
        nodeCoords2D: { x: 660, y: 380 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbaubewegung & Linien-Fächerung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Breites Anbieten im Spielaufbau',
        gegenBallPattern: 'Tiefes Einrücken ins Zentrum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 290 420 L 230 420',
        pathDGegenBall: 'M 290 420 L 330 450',
        pathDUmschalten: 'M 290 420 L 290 390',
        heatmapCoords: [{ x: 280, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für die Position IV-L ist die breite Aufbaubewegung typisch.',
        trainerAdviceGegenBall: 'Für die Position IV-L ist die Restverteidigung gegen Konter typisch.',
        nodeCoords2D: { x: 290, y: 420 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbaubewegung & Linien-Fächerung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Breites Anbieten im Spielaufbau',
        gegenBallPattern: 'Tiefes Einrücken ins Zentrum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 510 420 L 570 420',
        pathDGegenBall: 'M 510 420 L 470 450',
        pathDUmschalten: 'M 510 420 L 510 390',
        heatmapCoords: [{ x: 520, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für die Position IV-R ist die breite Aufbaubewegung typisch.',
        trainerAdviceGegenBall: 'Für die Position IV-R ist die Restverteidigung gegen Konter typisch.',
        nodeCoords2D: { x: 510, y: 420 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung & Rückpassoption',
        roleGegenBall: 'Positionierung bei Kontern & Kastenabsicherung',
        mitBallPattern: 'Vorstoß zur Strafraumgrenze als Anspielstation',
        gegenBallPattern: 'Grundstellung auf der Torlinie',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 435',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für die Position TW ist der mutige Schritt zur Spieleröffnung typisch.',
        trainerAdviceGegenBall: 'Für die Position TW ist die Grundstellung auf der Linie typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  },
  '4-2-3-1': {
    formation: '4-2-3-1',
    name: '4-2-3-1 Kontrolle & Doppel-Sechs',
    pressingHeight: 'Mittelhoch',
    kompaktheit: 'Extrem Kompakt',
    offensiveFocus: 'OM als Zwischenraum-Regisseur, Flügel hinterlaufen, 2 Sechser sichern voll ab.',
    defensiveFocus: 'Kompaktes Sechser-Schild vor der Abwehr, 10er schließt das Mittelfeld.',
    positions: [
      {
        positionKey: 'ST',
        positionLabel: 'Stürmer (ST)',
        roleMitBall: 'Tiefenlauf hinter die Kette & Festmachen',
        roleGegenBall: 'Pressing-Auslöser & Anlaufen der IV',
        mitBallPattern: 'Zentraler Tiefensprint & Bogenlauf',
        gegenBallPattern: 'Aggressives Gegenpressing auf IV',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 400 220 L 400 90',
        pathDGegenBall: 'M 400 110 L 350 180',
        pathDUmschalten: 'M 400 110 L 400 200',
        heatmapCoords: [{ x: 400, y: 110, r: 80 }],
        trainerAdviceMitBall: 'Für die Position ST ist das tiefe Binden beider IVs typisch.',
        trainerAdviceGegenBall: 'Für die Position ST ist dieser Pressing-Auslöser typisch.',
        nodeCoords2D: { x: 400, y: 110 },
      },
      {
        positionKey: 'OM',
        positionLabel: 'Offensives Mittelfeld (OM)',
        roleMitBall: 'Zwischenraumbewegung & Vorstoß in Zone 14',
        roleGegenBall: 'Gegenpressing & Rückzug ins Mittelfeld',
        mitBallPattern: 'Achterbahn-Lauf zwischen den Linien',
        gegenBallPattern: 'Zentrum sperren & Rückzug auf Sechserhöhe',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 400 260 C 340 210, 460 190, 400 150',
        pathDGegenBall: 'M 400 230 L 400 310',
        pathDUmschalten: 'M 400 230 L 400 280',
        heatmapCoords: [{ x: 400, y: 220, r: 85 }],
        trainerAdviceMitBall: 'Für die Position OM ist die Zwischenraumbewegung typisch.',
        trainerAdviceGegenBall: 'Für die Position OM ist dieser Rückzug ins Zentrums-Sechseck typisch.',
        nodeCoords2D: { x: 400, y: 230 },
      },
      {
        positionKey: 'LA',
        positionLabel: 'Linker Flügel (LA)',
        roleMitBall: 'Halbraum-Diagonallauf & Abschluss',
        roleGegenBall: 'Rückwärtige Sprints & Kompaktheit',
        mitBallPattern: 'Halbraum-Diagonalsprint zum Tor',
        gegenBallPattern: 'Rückwärtssprint in die 4er-Mittelfeldkette',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 150 260 Q 250 200 340 140',
        pathDGegenBall: 'M 150 160 L 190 300',
        pathDUmschalten: 'M 150 160 L 220 250',
        heatmapCoords: [{ x: 250, y: 180, r: 70 }],
        trainerAdviceMitBall: 'Für die Position LA ist dieser Einlauf in Zone 14 typisch.',
        trainerAdviceGegenBall: 'Für die Position LA ist das Einrücken in die Mittelfeldkette typisch.',
        nodeCoords2D: { x: 150, y: 160 },
      },
      {
        positionKey: 'RA',
        positionLabel: 'Rechter Flügel (RA)',
        roleMitBall: 'Außenbahn-Sprint & Überlappung',
        roleGegenBall: 'Rückwärtige Sprints & Flügelabsicherung',
        mitBallPattern: 'Sprint an der Außenbahn bis Grundlinie',
        gegenBallPattern: 'Rückwärtssprint zur Absicherung',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 650 260 L 730 140 L 630 100',
        pathDGegenBall: 'M 650 160 L 610 300',
        pathDUmschalten: 'M 650 160 L 580 250',
        heatmapCoords: [{ x: 670, y: 170, r: 70 }],
        trainerAdviceMitBall: 'Für die Position RA ist dieser Außensprint typisch.',
        trainerAdviceGegenBall: 'Für die Position RA ist dieser Rückwärtssprint typisch.',
        nodeCoords2D: { x: 650, y: 160 },
      },
      {
        positionKey: 'DM-L',
        positionLabel: 'Defensives Mittelfeld Links (DM-L)',
        roleMitBall: 'Pendelbewegung, Ballverlagerung & Absicherung',
        roleGegenBall: 'Kompaktes Verschieben & Riegel vor der Kette',
        mitBallPattern: 'Kompakte Zirkulation vor der Abwehr',
        gegenBallPattern: 'Aggressiver Zweikampf im Sechserraum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 310 370 Q 250 330 330 290',
        pathDGegenBall: 'M 310 340 L 350 380',
        pathDUmschalten: 'M 310 340 L 310 310',
        heatmapCoords: [{ x: 310, y: 340, r: 75 }],
        trainerAdviceMitBall: 'Für DM-L ist die tiefe Absicherung typisch.',
        trainerAdviceGegenBall: 'Für DM-L ist die Zweikampfführung vor den IVs typisch.',
        nodeCoords2D: { x: 310, y: 340 },
      },
      {
        positionKey: 'DM-R',
        positionLabel: 'Defensives Mittelfeld Rechts (DM-R)',
        roleMitBall: 'Pendelbewegung & Ballverlagerung',
        roleGegenBall: 'Kompaktes Verschieben & Ballorientiertes Pressing',
        mitBallPattern: 'Kompakte Zirkulation & Diagonallauf',
        gegenBallPattern: 'Doppeln im rechten Halbraum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 490 370 Q 550 330 470 290',
        pathDGegenBall: 'M 490 340 L 450 380',
        pathDUmschalten: 'M 490 340 L 490 310',
        heatmapCoords: [{ x: 490, y: 340, r: 75 }],
        trainerAdviceMitBall: 'Für DM-R ist das Öffnen des Spiels nach rechts typisch.',
        trainerAdviceGegenBall: 'Für DM-R ist die Absicherung bei RA-Aufrücken typisch.',
        nodeCoords2D: { x: 490, y: 340 },
      },
      {
        positionKey: 'LV',
        positionLabel: 'Linker Außenverteidiger (LV)',
        roleMitBall: 'Überlappung & Diagonales Verschieben',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Vorstoß über den Flügel',
        gegenBallPattern: 'Diagonales Einrücken',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 140 380 L 140 230',
        pathDGegenBall: 'M 140 380 L 180 430',
        pathDUmschalten: 'M 140 380 L 140 320',
        heatmapCoords: [{ x: 140, y: 330, r: 65 }],
        trainerAdviceMitBall: 'Für LV ist die Überlappung bei LA-Cut-Inside typisch.',
        trainerAdviceGegenBall: 'Für LV ist das Sichern des eigenen Flügels typisch.',
        nodeCoords2D: { x: 140, y: 380 },
      },
      {
        positionKey: 'RV',
        positionLabel: 'Rechter Außenverteidiger (RV)',
        roleMitBall: 'Überlappung & Diagonales Verschieben',
        roleGegenBall: 'Rückwärtssprint & Diagonales Verschieben',
        mitBallPattern: 'Vorstoß über den rechten Flügel',
        gegenBallPattern: 'Diagonales Einrücken',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 660 380 L 660 230',
        pathDGegenBall: 'M 660 380 L 620 430',
        pathDUmschalten: 'M 660 380 L 660 320',
        heatmapCoords: [{ x: 660, y: 330, r: 65 }],
        trainerAdviceMitBall: 'Für RV ist die Überlappung über RA typisch.',
        trainerAdviceGegenBall: 'Für RV ist das Schließen der Schnittstelle zum IV typisch.',
        nodeCoords2D: { x: 660, y: 380 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbaubewegung & Absicherung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Aufbaupass nach außen',
        gegenBallPattern: 'Kompakte Restverteidigung',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 290 420 L 230 420',
        pathDGegenBall: 'M 290 420 L 330 440',
        pathDUmschalten: 'M 290 420 L 290 400',
        heatmapCoords: [{ x: 280, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-L ist die ruhige Spieleröffnung typisch.',
        trainerAdviceGegenBall: 'Für IV-L ist das Sichern des Strafraums typisch.',
        nodeCoords2D: { x: 290, y: 420 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbaubewegung & Absicherung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Aufbaupass nach außen',
        gegenBallPattern: 'Kompakte Restverteidigung',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 510 420 L 570 420',
        pathDGegenBall: 'M 510 420 L 470 440',
        pathDUmschalten: 'M 510 420 L 510 400',
        heatmapCoords: [{ x: 520, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-R ist die ruhige Spieleröffnung typisch.',
        trainerAdviceGegenBall: 'Für IV-R ist die Zweikampfstärke im Zentrum typisch.',
        nodeCoords2D: { x: 510, y: 420 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung & Rückpassoption',
        roleGegenBall: 'Positionierung bei Kontern',
        mitBallPattern: 'Kurzer Schritt zur Anspielstation',
        gegenBallPattern: 'Grundstellung Torlinie',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 440',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für TW ist die präzise Spieleröffnung typisch.',
        trainerAdviceGegenBall: 'Für TW ist die Konzentration auf der Linie typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  },
  '3-5-2': {
    formation: '3-5-2',
    name: '3-5-2 Zentrums-Macht & Flügel-Power',
    pressingHeight: 'Hoch',
    kompaktheit: 'Breit-Fächernd',
    offensiveFocus: 'Extrem hohe Belastung für LM/RM (ganze Schiene), 2 Spitzen kreuzen & besetzen den Strafraum.',
    defensiveFocus: '5er-Kette entsteht bei tiefem gegnerischem Ballbesitz, 3 IVs sichern das Zentrum lückenlos.',
    positions: [
      {
        positionKey: 'ST-L',
        positionLabel: 'Stürmer Links (ST-L)',
        roleMitBall: 'Tiefenlauf & Ausweichen in Halbraum',
        roleGegenBall: 'Pressing-Auslöser & Anlaufen IV',
        mitBallPattern: 'Diagonaler Tiefenlauf nach links',
        gegenBallPattern: 'Aggressiver Anlauf auf IV-R',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 330 180 Q 250 130 300 80',
        pathDGegenBall: 'M 330 110 L 260 170',
        pathDUmschalten: 'M 330 110 L 330 200',
        heatmapCoords: [{ x: 300, y: 110, r: 75 }],
        trainerAdviceMitBall: 'Für ST-L ist das Ausweichen in den linken Halbraum typisch.',
        trainerAdviceGegenBall: 'Für ST-L ist dieser Pressing-Auslöser typisch.',
        nodeCoords2D: { x: 330, y: 110 },
      },
      {
        positionKey: 'ST-R',
        positionLabel: 'Stürmer Rechts (ST-R)',
        roleMitBall: 'Tiefenlauf & Strafraumbewegung',
        roleGegenBall: 'Pressing-Auslöser & Anlaufen IV',
        mitBallPattern: 'Zentraler Tiefenlauf & Box-Klatscher',
        gegenBallPattern: 'Aggressiver Anlauf auf IV-L',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 470 180 Q 550 130 500 80',
        pathDGegenBall: 'M 470 110 L 540 170',
        pathDUmschalten: 'M 470 110 L 470 200',
        heatmapCoords: [{ x: 500, y: 110, r: 75 }],
        trainerAdviceMitBall: 'Für ST-R ist der diagonale Box-Einlauf typisch.',
        trainerAdviceGegenBall: 'Für ST-R ist das Schließen der Mitte typisch.',
        nodeCoords2D: { x: 470, y: 110 },
      },
      {
        positionKey: 'LM',
        positionLabel: 'Linker Schienenläufer (LM)',
        roleMitBall: 'Flügel-Aufrücken, Sprints & Flanken',
        roleGegenBall: 'Rückwärtssprint & 5er-Kette auffüllen',
        mitBallPattern: 'Gewaltige Sprintlinie über die komplette Außenbahn',
        gegenBallPattern: 'Tiefer Rückwärtssprint auf LV-Höhe',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 110 320 L 110 120',
        pathDGegenBall: 'M 110 280 L 150 420',
        pathDUmschalten: 'M 110 280 L 110 360',
        heatmapCoords: [{ x: 110, y: 250, r: 90 }],
        trainerAdviceMitBall: 'Für LM ist das Bearbeiten der gesamten Schiene typisch. Maximale Belastung!',
        trainerAdviceGegenBall: 'Für LM ist das unverzügliche Auffüllen der 5er-Kette Pflicht.',
        nodeCoords2D: { x: 110, y: 280 },
      },
      {
        positionKey: 'RM',
        positionLabel: 'Rechter Schienenläufer (RM)',
        roleMitBall: 'Flügel-Aufrücken, Sprints & Flanken',
        roleGegenBall: 'Rückwärtssprint & 5er-Kette auffüllen',
        mitBallPattern: 'Gewaltige Sprintlinie über die komplette Außenbahn',
        gegenBallPattern: 'Tiefer Rückwärtssprint auf RV-Höhe',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 690 320 L 690 120',
        pathDGegenBall: 'M 690 280 L 650 420',
        pathDUmschalten: 'M 690 280 L 690 360',
        heatmapCoords: [{ x: 690, y: 250, r: 90 }],
        trainerAdviceMitBall: 'Für RM ist der permanente Vorstoß über außen typisch.',
        trainerAdviceGegenBall: 'Für RM ist der tiefe Rückwärtssprint zur 5er-Kette typisch.',
        nodeCoords2D: { x: 690, y: 280 },
      },
      {
        positionKey: 'ZM-L',
        positionLabel: 'Zentrales Mittelfeld Links (ZM-L)',
        roleMitBall: 'Halbraum-Vorstoß & Verbindungsspiel',
        roleGegenBall: 'Kompaktes Verschieben & Ballorientiertes Pressing',
        mitBallPattern: 'Vorstoß-Sprint in die Offensive',
        gegenBallPattern: 'Zentrumsverdichtung Links',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 290 300 L 250 180',
        pathDGegenBall: 'M 290 260 L 330 320',
        pathDUmschalten: 'M 290 260 L 290 220',
        heatmapCoords: [{ x: 280, y: 250, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-L ist der Vorstoß in den Halbraum typisch.',
        trainerAdviceGegenBall: 'Für ZM-L ist das Schließen der Lücke zum LM typisch.',
        nodeCoords2D: { x: 290, y: 260 },
      },
      {
        positionKey: 'ZM-R',
        positionLabel: 'Zentrales Mittelfeld Rechts (ZM-R)',
        roleMitBall: 'Halbraum-Vorstoß & Ballverlagerung',
        roleGegenBall: 'Kompaktes Verschieben & Zweikampf',
        mitBallPattern: 'Vorstoß-Sprint in die Offensive',
        gegenBallPattern: 'Zentrumsverdichtung Rechts',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 510 300 L 550 180',
        pathDGegenBall: 'M 510 260 L 470 320',
        pathDUmschalten: 'M 510 260 L 510 220',
        heatmapCoords: [{ x: 520, y: 250, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-R ist das Nachrücken an die Box typisch.',
        trainerAdviceGegenBall: 'Für ZM-R ist die Absicherung des rechten Halbraums typisch.',
        nodeCoords2D: { x: 510, y: 260 },
      },
      {
        positionKey: 'DM',
        positionLabel: 'Defensives Mittelfeld (DM)',
        roleMitBall: 'Spielaufbau & Absicherung',
        roleGegenBall: 'Abwehrriegel vor der 3er/5er Kette',
        mitBallPattern: 'Tiefe Zirkulation & Pendelbewegung',
        gegenBallPattern: 'Querverschieben im Sechserraum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 350 370 L 450 370',
        pathDGegenBall: 'M 350 350 L 450 350',
        pathDUmschalten: 'M 400 350 L 400 320',
        heatmapCoords: [{ x: 400, y: 350, r: 85 }],
        trainerAdviceMitBall: 'Für DM ist das Verteilen der Bälle auf die Schienen typisch.',
        trainerAdviceGegenBall: 'Für DM ist das Halten der Zentrumsbalance typisch.',
        nodeCoords2D: { x: 400, y: 350 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbau-Einrücken & Flügel-Absicherung',
        roleGegenBall: 'Kompakt-Block & Vorwärts-Verteidigen',
        mitBallPattern: 'Vorstoß im linken Halbraum',
        gegenBallPattern: 'Verschieben nach links',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 240 430 L 190 380',
        pathDGegenBall: 'M 240 430 L 280 440',
        pathDUmschalten: 'M 240 430 L 240 400',
        heatmapCoords: [{ x: 230, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-L ist das mutige Andribbeln typisch.',
        trainerAdviceGegenBall: 'Für IV-L ist das Rausrücken bei LM-Aufrücken typisch.',
        nodeCoords2D: { x: 240, y: 430 },
      },
      {
        positionKey: 'IV-C',
        positionLabel: 'Zentraler Innenverteidiger (IV-C)',
        roleMitBall: 'Zentraler Aufbau & Restverteidigung',
        roleGegenBall: 'Luftduelle & Letzter Riegel',
        mitBallPattern: 'Zentraler Passgeber',
        gegenBallPattern: 'Zentrales Blockverhalten',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 370 430 L 430 430',
        pathDGegenBall: 'M 400 430 L 400 450',
        pathDUmschalten: 'M 400 430 L 400 410',
        heatmapCoords: [{ x: 400, y: 430, r: 85 }],
        trainerAdviceMitBall: 'Für IV-C ist der ruhige Spielaufbau typisch.',
        trainerAdviceGegenBall: 'Für IV-C ist die Dominanz bei hohen Bällen typisch.',
        nodeCoords2D: { x: 400, y: 430 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbau-Einrücken & Flügel-Absicherung',
        roleGegenBall: 'Kompakt-Block & Vorwärts-Verteidigen',
        mitBallPattern: 'Vorstoß im rechten Halbraum',
        gegenBallPattern: 'Verschieben nach rechts',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 560 430 L 610 380',
        pathDGegenBall: 'M 560 430 L 520 440',
        pathDUmschalten: 'M 560 430 L 560 400',
        heatmapCoords: [{ x: 570, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-R ist das Andribbeln im Halbraum typisch.',
        trainerAdviceGegenBall: 'Für IV-R ist die Absicherung hinter RM typisch.',
        nodeCoords2D: { x: 560, y: 430 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung',
        roleGegenBall: 'Positionierung bei Kontern',
        mitBallPattern: 'Kurzer Schritt zur Anspielstation',
        gegenBallPattern: 'Torlinien-Stellung',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 440',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für TW ist die präzise Eröffnung typisch.',
        trainerAdviceGegenBall: 'Für TW ist die Konzentration im Kasten typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  },
  '4-4-2': {
    formation: '4-4-2',
    name: '4-4-2 Klassische Kompaktheit',
    pressingHeight: 'Mittelhoch',
    kompaktheit: 'Extrem Kompakt',
    offensiveFocus: 'Doppelspitze kombiniert direkt, Flügelspieler bringen präzise Flanken, Vorstöße der ZMs.',
    defensiveFocus: '2 Viererketten verschieben absolut synchron, unüberwindbarer Block im 4-4-2 Riegel.',
    positions: [
      {
        positionKey: 'ST-L',
        positionLabel: 'Stürmer Links (ST-L)',
        roleMitBall: 'Tiefenlauf & Ausweichen',
        roleGegenBall: 'Pressing-Auslöser',
        mitBallPattern: 'Diagonaler Tiefensprint',
        gegenBallPattern: 'Anlaufen der IVs',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 330 180 L 290 90',
        pathDGegenBall: 'M 330 110 L 270 180',
        pathDUmschalten: 'M 330 110 L 330 200',
        heatmapCoords: [{ x: 310, y: 110, r: 75 }],
        trainerAdviceMitBall: 'Für ST-L ist der diagonale Tiefenlauf typisch.',
        trainerAdviceGegenBall: 'Für ST-L ist dieser Pressing-Auslöser typisch.',
        nodeCoords2D: { x: 330, y: 110 },
      },
      {
        positionKey: 'ST-R',
        positionLabel: 'Stürmer Rechts (ST-R)',
        roleMitBall: 'Tiefenlauf & Strafraumbewegung',
        roleGegenBall: 'Pressing-Auslöser',
        mitBallPattern: 'Zentraler Tiefensprint',
        gegenBallPattern: 'Anlaufen der IVs',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 470 180 L 510 90',
        pathDGegenBall: 'M 470 110 L 530 180',
        pathDUmschalten: 'M 470 110 L 470 200',
        heatmapCoords: [{ x: 490, y: 110, r: 75 }],
        trainerAdviceMitBall: 'Für ST-R ist der Box-Sprint typisch.',
        trainerAdviceGegenBall: 'Für ST-R ist das Schließen der Schnittstelle typisch.',
        nodeCoords2D: { x: 470, y: 110 },
      },
      {
        positionKey: 'LM',
        positionLabel: 'Linkes Mittelfeld (LM)',
        roleMitBall: 'Außenbahn-Sprint & Flanken',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Lange Sprintlinie Außenbahn',
        gegenBallPattern: 'Rückzug in die 4er-Mittelfeldkette',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 130 320 L 130 130',
        pathDGegenBall: 'M 130 260 L 170 330',
        pathDUmschalten: 'M 130 260 L 130 310',
        heatmapCoords: [{ x: 130, y: 240, r: 75 }],
        trainerAdviceMitBall: 'Für LM ist das Flankenlaufmuster typisch.',
        trainerAdviceGegenBall: 'Für LM ist das Einreihen in den 4er-Block Pflicht.',
        nodeCoords2D: { x: 130, y: 260 },
      },
      {
        positionKey: 'RM',
        positionLabel: 'Rechtes Mittelfeld (RM)',
        roleMitBall: 'Außenbahn-Sprint & Flanken',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Lange Sprintlinie Außenbahn',
        gegenBallPattern: 'Rückzug in die 4er-Mittelfeldkette',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 670 320 L 670 130',
        pathDGegenBall: 'M 670 260 L 630 330',
        pathDUmschalten: 'M 670 260 L 670 310',
        heatmapCoords: [{ x: 670, y: 240, r: 75 }],
        trainerAdviceMitBall: 'Für RM ist der Flügelvorstoß typisch.',
        trainerAdviceGegenBall: 'Für RM ist der Rückwärtssprint typisch.',
        nodeCoords2D: { x: 670, y: 260 },
      },
      {
        positionKey: 'ZM-L',
        positionLabel: 'Zentrales Mittelfeld Links (ZM-L)',
        roleMitBall: 'Pendelbewegung & Nachrücken',
        roleGegenBall: 'Kompaktes Verschieben & Zweikampf',
        mitBallPattern: 'Zirkulations- & Box-Entry Lauf',
        gegenBallPattern: 'Kompaktes Zentrumsschließen',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 310 340 L 310 200',
        pathDGegenBall: 'M 310 300 L 350 350',
        pathDUmschalten: 'M 310 300 L 310 250',
        heatmapCoords: [{ x: 310, y: 290, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-L ist das Nachrücken in den Strafraum typisch.',
        trainerAdviceGegenBall: 'Für ZM-L ist die Zweikampfführung im Zentrum typisch.',
        nodeCoords2D: { x: 310, y: 300 },
      },
      {
        positionKey: 'ZM-R',
        positionLabel: 'Zentrales Mittelfeld Rechts (ZM-R)',
        roleMitBall: 'Pendelbewegung & Ballverlagerung',
        roleGegenBall: 'Kompaktes Verschieben & Absicherung',
        mitBallPattern: 'Zirkulations- & Diagonallauf',
        gegenBallPattern: 'Kompaktes Zentrumsschließen',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 490 340 L 490 200',
        pathDGegenBall: 'M 490 300 L 450 350',
        pathDUmschalten: 'M 490 300 L 490 250',
        heatmapCoords: [{ x: 490, y: 290, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-R ist die Spielverlagerung typisch.',
        trainerAdviceGegenBall: 'Für ZM-R ist das Schließen der Passwege typisch.',
        nodeCoords2D: { x: 490, y: 300 },
      },
      {
        positionKey: 'LV',
        positionLabel: 'Linker Außenverteidiger (LV)',
        roleMitBall: 'Überlappung & Absicherung',
        roleGegenBall: 'Rückwärtssprint & Diagonales Verschieben',
        mitBallPattern: 'Außenbahn-Hinterlaufen',
        gegenBallPattern: 'Diagonales Einrücken',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 140 380 L 140 250',
        pathDGegenBall: 'M 140 380 L 180 430',
        pathDUmschalten: 'M 140 380 L 140 330',
        heatmapCoords: [{ x: 140, y: 330, r: 65 }],
        trainerAdviceMitBall: 'Für LV ist die Hinterlaufbewegung typisch.',
        trainerAdviceGegenBall: 'Für LV ist das Sichern der linken Kette typisch.',
        nodeCoords2D: { x: 140, y: 380 },
      },
      {
        positionKey: 'RV',
        positionLabel: 'Rechter Außenverteidiger (RV)',
        roleMitBall: 'Überlappung & Absicherung',
        roleGegenBall: 'Rückwärtssprint & Diagonales Verschieben',
        mitBallPattern: 'Außenbahn-Hinterlaufen',
        gegenBallPattern: 'Diagonales Einrücken',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 660 380 L 660 250',
        pathDGegenBall: 'M 660 380 L 620 430',
        pathDUmschalten: 'M 660 380 L 660 330',
        heatmapCoords: [{ x: 660, y: 330, r: 65 }],
        trainerAdviceMitBall: 'Für RV ist die Hinterlaufbewegung typisch.',
        trainerAdviceGegenBall: 'Für RV ist das Sichern der rechten Kette typisch.',
        nodeCoords2D: { x: 660, y: 380 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Aufbaupass nach außen',
        gegenBallPattern: 'Restverteidigung im Strafraum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 290 420 L 230 420',
        pathDGegenBall: 'M 290 420 L 330 440',
        pathDUmschalten: 'M 290 420 L 290 400',
        heatmapCoords: [{ x: 280, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-L ist die breite Staffelung typisch.',
        trainerAdviceGegenBall: 'Für IV-L ist die Strafraumabsicherung typisch.',
        nodeCoords2D: { x: 290, y: 420 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Aufbaupass nach außen',
        gegenBallPattern: 'Restverteidigung im Strafraum',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 510 420 L 570 420',
        pathDGegenBall: 'M 510 420 L 470 440',
        pathDUmschalten: 'M 510 420 L 510 400',
        heatmapCoords: [{ x: 520, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-R ist die breite Staffelung typisch.',
        trainerAdviceGegenBall: 'Für IV-R ist die Strafraumabsicherung typisch.',
        nodeCoords2D: { x: 510, y: 420 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung',
        roleGegenBall: 'Positionierung bei Kontern',
        mitBallPattern: 'Kurzer Schritt nach vorne',
        gegenBallPattern: 'Torlinienstellung',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 440',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für TW ist die geordnete Eröffnung typisch.',
        trainerAdviceGegenBall: 'Für TW ist das Stellungsspiel auf der Linie typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  },
  '3-4-3': {
    formation: '3-4-3',
    name: '3-4-3 Extrem-Offensiv & Total-Pressing',
    pressingHeight: 'Hoch',
    kompaktheit: 'Breit-Fächernd',
    offensiveFocus: '3 echte Spitzen überladen die Abwehrkette, Schienenläufer geben maximale Breite.',
    defensiveFocus: 'Hohes Angriffspressing mit 3 Spitzen, 3er Kette muss extrem mutig hochschieben.',
    positions: [
      {
        positionKey: 'ST',
        positionLabel: 'Stürmer (ST)',
        roleMitBall: 'Tiefenlauf hinter die Kette',
        roleGegenBall: 'Pressing-Auslöser auf IV',
        mitBallPattern: 'Explosiver Tiefenlauf ins Zentrum',
        gegenBallPattern: 'Direkter Anlauf auf IV-C',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 400 220 L 400 90',
        pathDGegenBall: 'M 400 110 L 360 180',
        pathDUmschalten: 'M 400 110 L 400 200',
        heatmapCoords: [{ x: 400, y: 100, r: 80 }],
        trainerAdviceMitBall: 'Für ST ist dieser brutale Tiefenlauf typisch.',
        trainerAdviceGegenBall: 'Für ST ist dieser aggressive Anlauf typisch.',
        nodeCoords2D: { x: 400, y: 110 },
      },
      {
        positionKey: 'LA',
        positionLabel: 'Linker Flügelstürmer (LA)',
        roleMitBall: 'Halbraum-Diagonallauf & Strafraumbewegung',
        roleGegenBall: 'Pressing & Flügelabsicherung',
        mitBallPattern: 'Cut-Inside in Zone 14',
        gegenBallPattern: 'Rückwärtssprint & Pressing',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 160 260 Q 240 180 340 130',
        pathDGegenBall: 'M 160 150 L 200 290',
        pathDUmschalten: 'M 160 150 L 250 240',
        heatmapCoords: [{ x: 260, y: 160, r: 75 }],
        trainerAdviceMitBall: 'Für LA ist dieser Einlauf typisch.',
        trainerAdviceGegenBall: 'Für LA ist das aggressive Zudrehen typisch.',
        nodeCoords2D: { x: 160, y: 150 },
      },
      {
        positionKey: 'RA',
        positionLabel: 'Rechter Flügelstürmer (RA)',
        roleMitBall: 'Halbraum-Diagonallauf & Strafraumbewegung',
        roleGegenBall: 'Pressing & Flügelabsicherung',
        mitBallPattern: 'Cut-Inside in Zone 14',
        gegenBallPattern: 'Rückwärtssprint & Pressing',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 640 260 Q 560 180 460 130',
        pathDGegenBall: 'M 640 150 L 600 290',
        pathDUmschalten: 'M 640 150 L 550 240',
        heatmapCoords: [{ x: 540, y: 160, r: 75 }],
        trainerAdviceMitBall: 'Für RA ist dieser Diagonallauf typisch.',
        trainerAdviceGegenBall: 'Für RA ist das Schließen der Schnittstelle typisch.',
        nodeCoords2D: { x: 640, y: 150 },
      },
      {
        positionKey: 'LM',
        positionLabel: 'Linker Schienenläufer (LM)',
        roleMitBall: 'Flügel-Aufrücken & Flanken',
        roleGegenBall: 'Rückwärtssprint & 5er-Kette',
        mitBallPattern: 'Flügel-Sprint bis Grundlinie',
        gegenBallPattern: 'Rückwärtssprint auf LV-Höhe',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 110 330 L 110 130',
        pathDGegenBall: 'M 110 290 L 150 420',
        pathDUmschalten: 'M 110 290 L 110 350',
        heatmapCoords: [{ x: 110, y: 260, r: 85 }],
        trainerAdviceMitBall: 'Für LM ist das permanente Hinterlaufen typisch.',
        trainerAdviceGegenBall: 'Für LM ist das tiefes Rückwärtslaufen Pflicht.',
        nodeCoords2D: { x: 110, y: 290 },
      },
      {
        positionKey: 'RM',
        positionLabel: 'Rechter Schienenläufer (RM)',
        roleMitBall: 'Flügel-Aufrücken & Flanken',
        roleGegenBall: 'Rückwärtssprint & 5er-Kette',
        mitBallPattern: 'Flügel-Sprint bis Grundlinie',
        gegenBallPattern: 'Rückwärtssprint auf RV-Höhe',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 690 330 L 690 130',
        pathDGegenBall: 'M 690 290 L 650 420',
        pathDUmschalten: 'M 690 290 L 690 350',
        heatmapCoords: [{ x: 690, y: 260, r: 85 }],
        trainerAdviceMitBall: 'Für RM ist die Flügeldominanz typisch.',
        trainerAdviceGegenBall: 'Für RM ist der tiefste Rückwärtssprint typisch.',
        nodeCoords2D: { x: 690, y: 290 },
      },
      {
        positionKey: 'ZM-L',
        positionLabel: 'Zentrales Mittelfeld Links (ZM-L)',
        roleMitBall: 'Pendelbewegung & Absicherung',
        roleGegenBall: 'Kompaktes Verschieben',
        mitBallPattern: 'Verteilungs- & Absicherungslauf',
        gegenBallPattern: 'Aggressives Pressing im Zentrum',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 310 380 L 310 240',
        pathDGegenBall: 'M 310 330 L 350 380',
        pathDUmschalten: 'M 310 330 L 310 280',
        heatmapCoords: [{ x: 310, y: 310, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-L ist das Balancieren typisch.',
        trainerAdviceGegenBall: 'Für ZM-L ist die Zentrumssperre typisch.',
        nodeCoords2D: { x: 310, y: 330 },
      },
      {
        positionKey: 'ZM-R',
        positionLabel: 'Zentrales Mittelfeld Rechts (ZM-R)',
        roleMitBall: 'Pendelbewegung & Absicherung',
        roleGegenBall: 'Kompaktes Verschieben',
        mitBallPattern: 'Verteilungs- & Absicherungslauf',
        gegenBallPattern: 'Aggressives Pressing im Zentrum',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 490 380 L 490 240',
        pathDGegenBall: 'M 490 330 L 450 380',
        pathDUmschalten: 'M 490 330 L 490 280',
        heatmapCoords: [{ x: 490, y: 310, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-R ist das Balancieren typisch.',
        trainerAdviceGegenBall: 'Für ZM-R ist die Zentrumssperre typisch.',
        nodeCoords2D: { x: 490, y: 330 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Mutiges Rausrücken',
        mitBallPattern: 'Halbraum-Andribbeln',
        gegenBallPattern: 'Mutiges Raustreten',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 240 430 L 190 370',
        pathDGegenBall: 'M 240 430 L 280 440',
        pathDUmschalten: 'M 240 430 L 240 400',
        heatmapCoords: [{ x: 230, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-L ist das Mutige Passen typisch.',
        trainerAdviceGegenBall: 'Für IV-L ist das Raustreten im Zweikampf typisch.',
        nodeCoords2D: { x: 240, y: 430 },
      },
      {
        positionKey: 'IV-C',
        positionLabel: 'Zentraler Innenverteidiger (IV-C)',
        roleMitBall: 'Zentraler Aufbau',
        roleGegenBall: 'Absicherung & Kopfball',
        mitBallPattern: 'Spielverlagerung',
        gegenBallPattern: 'Letzte Absicherung',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 370 430 L 430 430',
        pathDGegenBall: 'M 400 430 L 400 450',
        pathDUmschalten: 'M 400 430 L 400 410',
        heatmapCoords: [{ x: 400, y: 430, r: 85 }],
        trainerAdviceMitBall: 'Für IV-C ist die gelassene Steuerung typisch.',
        trainerAdviceGegenBall: 'Für IV-C ist der zentrale Riegel typisch.',
        nodeCoords2D: { x: 400, y: 430 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Mutiges Rausrücken',
        mitBallPattern: 'Halbraum-Andribbeln',
        gegenBallPattern: 'Mutiges Raustreten',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 560 430 L 610 370',
        pathDGegenBall: 'M 560 430 L 520 440',
        pathDUmschalten: 'M 560 430 L 560 400',
        heatmapCoords: [{ x: 570, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-R ist das Mutige Passen typisch.',
        trainerAdviceGegenBall: 'Für IV-R ist das Raustreten im Zweikampf typisch.',
        nodeCoords2D: { x: 560, y: 430 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung',
        roleGegenBall: 'Kastenabsicherung',
        mitBallPattern: 'Kurzer Schritt zur Anspielstation',
        gegenBallPattern: 'Torlinienstellung',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 440',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für TW ist die präzise Spieleröffnung typisch.',
        trainerAdviceGegenBall: 'Für TW ist die Konzentration im Kasten typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  },
  '4-1-4-1': {
    formation: '4-1-4-1',
    name: '4-1-4-1 Mittelfeld-Staffelung & Riegel',
    pressingHeight: 'Mittelhoch',
    kompaktheit: 'Extrem Kompakt',
    offensiveFocus: 'Einziger Stürmer kreuzt tief, 4er-Mittelfeld schiebt stufenweise nach, Anker-Sechser sichert voll ab.',
    defensiveFocus: '2 kompakte Blöcke vor dem eigenen Sechzehner, extrem schwer zu bespielen.',
    positions: [
      {
        positionKey: 'ST',
        positionLabel: 'Stürmer (ST)',
        roleMitBall: 'Tiefenlauf & Wandspieler',
        roleGegenBall: 'Pressing-Auslöser & Bälle abfangen',
        mitBallPattern: 'Zentraler Tiefenlauf & Halbraum-Festmachen',
        gegenBallPattern: 'Anlaufen der IVs & Passwege versperren',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 400 220 L 400 90',
        pathDGegenBall: 'M 400 110 L 350 180',
        pathDUmschalten: 'M 400 110 L 400 200',
        heatmapCoords: [{ x: 400, y: 110, r: 80 }],
        trainerAdviceMitBall: 'Für ST ist dieser isolierte Tiefenlauf typisch.',
        trainerAdviceGegenBall: 'Für ST ist das clevere Versperren der Schnittstellen typisch.',
        nodeCoords2D: { x: 400, y: 110 },
      },
      {
        positionKey: 'LM',
        positionLabel: 'Linkes Mittelfeld (LM)',
        roleMitBall: 'Außenbahn-Sprint & Flanken',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Flügel-Sprint an der Außenbahn',
        gegenBallPattern: 'Rückzug in die 4er-Mittelfeldkette',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 130 300 L 130 140',
        pathDGegenBall: 'M 130 230 L 170 310',
        pathDUmschalten: 'M 130 230 L 130 290',
        heatmapCoords: [{ x: 130, y: 220, r: 75 }],
        trainerAdviceMitBall: 'Für LM ist der Flügelvorstoß typisch.',
        trainerAdviceGegenBall: 'Für LM ist der Disziplin-Rückzug typisch.',
        nodeCoords2D: { x: 130, y: 230 },
      },
      {
        positionKey: 'RM',
        positionLabel: 'Rechtes Mittelfeld (RM)',
        roleMitBall: 'Außenbahn-Sprint & Flanken',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Flügel-Sprint an der Außenbahn',
        gegenBallPattern: 'Rückzug in die 4er-Mittelfeldkette',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 670 300 L 670 140',
        pathDGegenBall: 'M 670 230 L 630 310',
        pathDUmschalten: 'M 670 230 L 670 290',
        heatmapCoords: [{ x: 670, y: 220, r: 75 }],
        trainerAdviceMitBall: 'Für RM ist der Flügelvorstoß typisch.',
        trainerAdviceGegenBall: 'Für RM ist der Disziplin-Rückzug typisch.',
        nodeCoords2D: { x: 670, y: 230 },
      },
      {
        positionKey: 'ZM-L',
        positionLabel: 'Zentrales Mittelfeld Links (ZM-L)',
        roleMitBall: 'Vorstoß & Verbindungsspiel',
        roleGegenBall: 'Kompaktes Verschieben',
        mitBallPattern: 'Vorstoß in Zone 14',
        gegenBallPattern: 'Kompaktes Schließen des Halbraums',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 290 300 L 290 170',
        pathDGegenBall: 'M 290 240 L 330 310',
        pathDUmschalten: 'M 290 240 L 290 270',
        heatmapCoords: [{ x: 290, y: 230, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-L ist das Nachrücken an den Sechzehner typisch.',
        trainerAdviceGegenBall: 'Für ZM-L ist das Verdichten des Raums typisch.',
        nodeCoords2D: { x: 290, y: 240 },
      },
      {
        positionKey: 'ZM-R',
        positionLabel: 'Zentrales Mittelfeld Rechts (ZM-R)',
        roleMitBall: 'Vorstoß & Verbindungsspiel',
        roleGegenBall: 'Kompaktes Verschieben',
        mitBallPattern: 'Vorstoß in Zone 14',
        gegenBallPattern: 'Kompaktes Schließen des Halbraums',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 510 300 L 510 170',
        pathDGegenBall: 'M 510 240 L 470 310',
        pathDUmschalten: 'M 510 240 L 510 270',
        heatmapCoords: [{ x: 510, y: 230, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-R ist der Vorstoß in die Spitze typisch.',
        trainerAdviceGegenBall: 'Für ZM-R ist das Schließen der Lücken typisch.',
        nodeCoords2D: { x: 510, y: 240 },
      },
      {
        positionKey: 'DM',
        positionLabel: 'Anker-Sechser (DM)',
        roleMitBall: 'Tiefe Zirkulation & Absicherung',
        roleGegenBall: 'Alleiniger Riegel vor der 4er-Kette',
        mitBallPattern: 'Horizontale Pendelbewegung',
        gegenBallPattern: 'Absichern der Zone 14',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 340 370 L 460 370',
        pathDGegenBall: 'M 350 350 L 450 350',
        pathDUmschalten: 'M 400 350 L 400 330',
        heatmapCoords: [{ x: 400, y: 350, r: 85 }],
        trainerAdviceMitBall: 'Für DM ist das geduldige Abkippen typisch.',
        trainerAdviceGegenBall: 'Für DM ist das kompromisslose Verriegeln typisch.',
        nodeCoords2D: { x: 400, y: 350 },
      },
      {
        positionKey: 'LV',
        positionLabel: 'Linker Außenverteidiger (LV)',
        roleMitBall: 'Überlappung & Diagonales Verschieben',
        roleGegenBall: 'Rückwärtssprint & Flügelabsicherung',
        mitBallPattern: 'Vorstoß über den Flügel',
        gegenBallPattern: 'Diagonales Einrücken',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 140 380 L 140 250',
        pathDGegenBall: 'M 140 380 L 180 430',
        pathDUmschalten: 'M 140 380 L 140 330',
        heatmapCoords: [{ x: 140, y: 330, r: 65 }],
        trainerAdviceMitBall: 'Für LV ist das disziplinierte Hinterlaufen typisch.',
        trainerAdviceGegenBall: 'Für LV ist die Flügelabsicherung Pflicht.',
        nodeCoords2D: { x: 140, y: 380 },
      },
      {
        positionKey: 'RV',
        positionLabel: 'Rechter Außenverteidiger (RV)',
        roleMitBall: 'Überlappung & Diagonales Verschieben',
        roleGegenBall: 'Rückwärtssprint & Diagonales Verschieben',
        mitBallPattern: 'Vorstoß über den Flügel',
        gegenBallPattern: 'Diagonales Einrücken',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 660 380 L 660 250',
        pathDGegenBall: 'M 660 380 L 620 430',
        pathDUmschalten: 'M 660 380 L 660 330',
        heatmapCoords: [{ x: 660, y: 330, r: 65 }],
        trainerAdviceMitBall: 'Für RV ist das disziplinierte Hinterlaufen typisch.',
        trainerAdviceGegenBall: 'Für RV ist die Flügelabsicherung Pflicht.',
        nodeCoords2D: { x: 660, y: 380 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Aufbaupass nach außen',
        gegenBallPattern: 'Kompakte Restverteidigung',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 290 420 L 230 420',
        pathDGegenBall: 'M 290 420 L 330 440',
        pathDUmschalten: 'M 290 420 L 290 400',
        heatmapCoords: [{ x: 280, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-L ist die ruhige Ballabgabe typisch.',
        trainerAdviceGegenBall: 'Für IV-L ist das sichere Klären typisch.',
        nodeCoords2D: { x: 290, y: 420 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Blockverhalten & Restverteidigung',
        mitBallPattern: 'Aufbaupass nach außen',
        gegenBallPattern: 'Kompakte Restverteidigung',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 510 420 L 570 420',
        pathDGegenBall: 'M 510 420 L 470 440',
        pathDUmschalten: 'M 510 420 L 510 400',
        heatmapCoords: [{ x: 520, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-R ist die ruhige Ballabgabe typisch.',
        trainerAdviceGegenBall: 'Für IV-R ist das sichere Klären typisch.',
        nodeCoords2D: { x: 510, y: 420 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung',
        roleGegenBall: 'Positionierung bei Kontern',
        mitBallPattern: 'Kurzer Schritt zur Anspielstation',
        gegenBallPattern: 'Grundstellung Torlinie',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 440',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für TW ist die strukturierte Eröffnung typisch.',
        trainerAdviceGegenBall: 'Für TW ist die Stellung auf der Linie typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  },
  '3-4-1-2': {
    formation: '3-4-1-2',
    name: '3-4-1-2 Variabel & Doppelspitze mit Spielmacher',
    pressingHeight: 'Hoch',
    kompaktheit: 'Ausgewogen',
    offensiveFocus: '10er verbindet 2 Sturmspitzen, Schienenläufer erzeugen maximale Breite.',
    defensiveFocus: '3er-Abwehrkette sichert gegen gegnerische Konter ab, 10er arbeitet rückwärts mit.',
    positions: [
      {
        positionKey: 'ST-L',
        positionLabel: 'Stürmer Links (ST-L)',
        roleMitBall: 'Tiefenlauf & Halbraum-Sprint',
        roleGegenBall: 'Pressing-Auslöser & Anlaufen IV',
        mitBallPattern: 'Diagonaler Tiefensprint',
        gegenBallPattern: 'Anlaufen auf IV-R',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 330 180 L 270 90',
        pathDGegenBall: 'M 330 110 L 270 180',
        pathDUmschalten: 'M 330 110 L 330 200',
        heatmapCoords: [{ x: 300, y: 110, r: 75 }],
        trainerAdviceMitBall: 'Für ST-L ist der diagonale Ausweichlauf typisch.',
        trainerAdviceGegenBall: 'Für ST-L ist das Anpressen typisch.',
        nodeCoords2D: { x: 330, y: 110 },
      },
      {
        positionKey: 'ST-R',
        positionLabel: 'Stürmer Rechts (ST-R)',
        roleMitBall: 'Tiefenlauf & Strafraumbewegung',
        roleGegenBall: 'Pressing-Auslöser & Anlaufen IV',
        mitBallPattern: 'Zentraler Tiefensprint',
        gegenBallPattern: 'Anlaufen auf IV-L',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 470 180 L 530 90',
        pathDGegenBall: 'M 470 110 L 530 180',
        pathDUmschalten: 'M 470 110 L 470 200',
        heatmapCoords: [{ x: 500, y: 110, r: 75 }],
        trainerAdviceMitBall: 'Für ST-R ist der tiefe Box-Lauf typisch.',
        trainerAdviceGegenBall: 'Für ST-R ist das Anpressen typisch.',
        nodeCoords2D: { x: 470, y: 110 },
      },
      {
        positionKey: 'OM',
        positionLabel: 'Offensives Mittelfeld (OM)',
        roleMitBall: 'Zwischenraumbewegung & Schlüsselpass',
        roleGegenBall: 'Gegenpressing & Rückzug ins Mittelfeld',
        mitBallPattern: 'Freiraumsuche in Zone 14',
        gegenBallPattern: 'Zentrumsverdichtung hinter den Spitzen',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 400 270 C 350 230, 450 200, 400 160',
        pathDGegenBall: 'M 400 220 L 400 300',
        pathDUmschalten: 'M 400 220 L 400 270',
        heatmapCoords: [{ x: 400, y: 220, r: 85 }],
        trainerAdviceMitBall: 'Für OM ist die Freiraumsuche typisch.',
        trainerAdviceGegenBall: 'Für OM ist das Gegenpressing typisch.',
        nodeCoords2D: { x: 400, y: 220 },
      },
      {
        positionKey: 'LM',
        positionLabel: 'Linker Schienenläufer (LM)',
        roleMitBall: 'Flügel-Aufrücken & Flanken',
        roleGegenBall: 'Rückwärtssprint & 5er-Kette',
        mitBallPattern: 'Gewaltige Sprintlinie über Außen',
        gegenBallPattern: 'Rückwärtssprint auf LV-Höhe',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 110 330 L 110 130',
        pathDGegenBall: 'M 110 290 L 150 420',
        pathDUmschalten: 'M 110 290 L 110 350',
        heatmapCoords: [{ x: 110, y: 260, r: 85 }],
        trainerAdviceMitBall: 'Für LM ist das Durchlaufen der Schiene typisch.',
        trainerAdviceGegenBall: 'Für LM ist der Rückwärtssprint zur 5er-Kette Pflicht.',
        nodeCoords2D: { x: 110, y: 290 },
      },
      {
        positionKey: 'RM',
        positionLabel: 'Rechter Schienenläufer (RM)',
        roleMitBall: 'Flügel-Aufrücken & Flanken',
        roleGegenBall: 'Rückwärtssprint & 5er-Kette',
        mitBallPattern: 'Gewaltige Sprintlinie über Außen',
        gegenBallPattern: 'Rückwärtssprint auf RV-Höhe',
        loadLevel: 'max',
        strokeWidth: 12,
        pathDMitBall: 'M 690 330 L 690 130',
        pathDGegenBall: 'M 690 290 L 650 420',
        pathDUmschalten: 'M 690 290 L 690 350',
        heatmapCoords: [{ x: 690, y: 260, r: 85 }],
        trainerAdviceMitBall: 'Für RM ist das Durchlaufen der Schiene typisch.',
        trainerAdviceGegenBall: 'Für RM ist der Rückwärtssprint zur 5er-Kette Pflicht.',
        nodeCoords2D: { x: 690, y: 290 },
      },
      {
        positionKey: 'ZM-L',
        positionLabel: 'Zentrales Mittelfeld Links (ZM-L)',
        roleMitBall: 'Pendelbewegung & Absicherung',
        roleGegenBall: 'Kompaktes Verschieben',
        mitBallPattern: 'Verteilungs- & Halbraumlauf',
        gegenBallPattern: 'Zentrumsabdeckung Links',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 310 390 L 310 270',
        pathDGegenBall: 'M 310 340 L 350 390',
        pathDUmschalten: 'M 310 340 L 310 290',
        heatmapCoords: [{ x: 310, y: 320, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-L ist das Absichern typisch.',
        trainerAdviceGegenBall: 'Für ZM-L ist das Verdichten typisch.',
        nodeCoords2D: { x: 310, y: 340 },
      },
      {
        positionKey: 'ZM-R',
        positionLabel: 'Zentrales Mittelfeld Rechts (ZM-R)',
        roleMitBall: 'Pendelbewegung & Absicherung',
        roleGegenBall: 'Kompaktes Verschieben',
        mitBallPattern: 'Verteilungs- & Halbraumlauf',
        gegenBallPattern: 'Zentrumsabdeckung Rechts',
        loadLevel: 'hoch',
        strokeWidth: 8,
        pathDMitBall: 'M 490 390 L 490 270',
        pathDGegenBall: 'M 490 340 L 450 390',
        pathDUmschalten: 'M 490 340 L 490 290',
        heatmapCoords: [{ x: 490, y: 320, r: 75 }],
        trainerAdviceMitBall: 'Für ZM-R ist das Absichern typisch.',
        trainerAdviceGegenBall: 'Für ZM-R ist das Verdichten typisch.',
        nodeCoords2D: { x: 490, y: 340 },
      },
      {
        positionKey: 'IV-L',
        positionLabel: 'Innenverteidiger Links (IV-L)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Blockverhalten',
        mitBallPattern: 'Halbraum-Aufbau',
        gegenBallPattern: 'Verschieben nach links',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 240 430 L 190 370',
        pathDGegenBall: 'M 240 430 L 280 440',
        pathDUmschalten: 'M 240 430 L 240 400',
        heatmapCoords: [{ x: 230, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-L ist das Andribbeln typisch.',
        trainerAdviceGegenBall: 'Für IV-L ist die Absicherung typisch.',
        nodeCoords2D: { x: 240, y: 430 },
      },
      {
        positionKey: 'IV-C',
        positionLabel: 'Zentraler Innenverteidiger (IV-C)',
        roleMitBall: 'Zentraler Aufbau',
        roleGegenBall: 'Absicherung',
        mitBallPattern: 'Passgeber im Zentrum',
        gegenBallPattern: 'Kopfball-Absicherung',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 370 430 L 430 430',
        pathDGegenBall: 'M 400 430 L 400 450',
        pathDUmschalten: 'M 400 430 L 400 410',
        heatmapCoords: [{ x: 400, y: 430, r: 85 }],
        trainerAdviceMitBall: 'Für IV-C ist die Spieleröffnung typisch.',
        trainerAdviceGegenBall: 'Für IV-C ist der Luft-Block typisch.',
        nodeCoords2D: { x: 400, y: 430 },
      },
      {
        positionKey: 'IV-R',
        positionLabel: 'Innenverteidiger Rechts (IV-R)',
        roleMitBall: 'Aufbaubewegung',
        roleGegenBall: 'Blockverhalten',
        mitBallPattern: 'Halbraum-Aufbau',
        gegenBallPattern: 'Verschieben nach rechts',
        loadLevel: 'mittel',
        strokeWidth: 5,
        pathDMitBall: 'M 560 430 L 610 370',
        pathDGegenBall: 'M 560 430 L 520 440',
        pathDUmschalten: 'M 560 430 L 560 400',
        heatmapCoords: [{ x: 570, y: 420, r: 75 }],
        trainerAdviceMitBall: 'Für IV-R ist das Andribbeln typisch.',
        trainerAdviceGegenBall: 'Für IV-R ist die Absicherung typisch.',
        nodeCoords2D: { x: 560, y: 430 },
      },
      {
        positionKey: 'TW',
        positionLabel: 'Torwart (TW)',
        roleMitBall: 'Spieleröffnung',
        roleGegenBall: 'Positionierung',
        mitBallPattern: 'Kurzer Schritt zur Anspielstation',
        gegenBallPattern: 'Torlinienstellung',
        loadLevel: 'niedrig',
        strokeWidth: 3,
        pathDMitBall: 'M 400 460 L 400 440',
        pathDGegenBall: 'M 400 460 Q 380 465 420 465',
        pathDUmschalten: 'M 400 460 L 400 450',
        heatmapCoords: [{ x: 400, y: 460, r: 35 }],
        trainerAdviceMitBall: 'Für TW ist die geordnete Eröffnung typisch.',
        trainerAdviceGegenBall: 'Für TW ist das Stellungsspiel typisch.',
        nodeCoords2D: { x: 400, y: 460 },
      }
    ]
  }
};

// Formations Comparison Analysis Matrix Engine
export function compareFormations(
  fromForm: TacticalFormation,
  toForm: TacticalFormation
): FormationComparison {
  const fromData = FORMATION_REPOSITORY[fromForm] || FORMATION_REPOSITORY['4-3-3'];
  const toData = FORMATION_REPOSITORY[toForm] || FORMATION_REPOSITORY['4-3-3'];

  const mitBallChanges: string[] = [];
  const gegenBallChanges: string[] = [];
  const roleChanges: string[] = [];
  const loadChanges: string[] = [];

  // Pressing Height Change
  let pressingHeightChange = `Pressinghöhe bleibt auf Niveau ${toData.pressingHeight}.`;
  if (fromData.pressingHeight !== toData.pressingHeight) {
    pressingHeightChange = `Pressinghöhe verändert sich von "${fromData.pressingHeight}" zu "${toData.pressingHeight}".`;
  }

  // Kompaktheit Change
  let kompaktheitChange = `Spielfeld-Kompaktheit bleibt ${toData.kompaktheit}.`;
  if (fromData.kompaktheit !== toData.kompaktheit) {
    kompaktheitChange = `Spielfeld-Kompaktheit ändert sich von "${fromData.kompaktheit}" zu "${toData.kompaktheit}".`;
  }

  // Tactical Shift Details
  mitBallChanges.push(`Fokus Offensiv: ${toData.offensiveFocus}`);
  gegenBallChanges.push(`Fokus Defensiv: ${toData.defensiveFocus}`);

  if (toForm.startsWith('3-')) {
    roleChanges.push('3er-Kette hinten: Die IVs müssen breiter fächern und mutig im Halbraum andribbeln.');
    loadChanges.push('Schienenläufer (LM/RM) tragen die MAXIMALE Laufbelastung auf der Außenbahn.');
  } else {
    roleChanges.push('4er-Kette hinten: Außenverteidiger überlappen stufenweise, IVs sichern kompakt ab.');
    loadChanges.push('Flügelstürmer und Achser teilen sich die Sprintdistanzen gleichmäßig auf.');
  }

  if (toForm === '4-2-3-1') {
    roleChanges.push('OM besetzt die Zone 14 als Spielmacher. Doppel-Sechs sichert das Zentrum voll ab.');
    mitBallChanges.push('Gezieltes Verbindungsspiel über den 10er in die Halbräume.');
  } else if (toForm === '3-5-2') {
    roleChanges.push('Doppelspitze (ST-L & ST-R) kreuzt vor der Box. 3 ZMs kontrollieren das Zentrum.');
    mitBallChanges.push('Flanken-Fokus durch aufrückende LM/RM Schienenläufer.');
  } else if (toForm === '3-4-3') {
    roleChanges.push('3 echte Spitzen setzen den gegnerischen Spielaufbau sofort unter Dauerdruck.');
    loadChanges.push('Angriffstrio hat maximale Belastung im Gegenpressing.');
  }

  const summaryText = `Wechsel von ${fromForm} zu ${toForm}: ${mitBallChanges.join(' ')} ${gegenBallChanges.join(' ')}`;

  return {
    fromFormation: fromForm,
    toFormation: toForm,
    mitBallChanges,
    gegenBallChanges,
    roleChanges,
    loadChanges,
    pressingHeightChange,
    kompaktheitChange,
    summaryText
  };
}

// TACTICAL PHILOSOPHIES REPOSITORY (Guardiola, Klopp, Nagelsmann, Tuchel, Simeone)
export const TACTICAL_PHILOSOPHIES: Record<TacticalPhilosophy, {
  name: string;
  iconLabel: string;
  motto: string;
  coreFocus: string;
  mitBallGuidance: string;
  gegenBallGuidance: string;
  umschaltGuidance: string;
}> = {
  positionsspiel: {
    name: 'Positionsspiel (Guardiola)',
    iconLabel: 'Raumkontrolle & Dreiecke',
    motto: 'Geduld, Ballbesitz & kontinuierliche Pass-Triangulation im Halbraum.',
    coreFocus: 'Strikte Disziplin auf Positionen, Erzeugung von Freiräumen durch Überzahl.',
    mitBallGuidance: 'TW schiebt weit mit auf. IVs ziehen breit. DM bildet Drehpunkt. ZMs und Flügel kreieren Dreiecke.',
    gegenBallGuidance: 'Restverteidigung hoch ansetzen. Sofortiges Zustellen der nahen Anspielstationen.',
    umschaltGuidance: 'Nach Ballgewinn: Erstes Anspiel sichern, nicht überhasten, Spielfeld verlagern.'
  },
  umschaltspiel: {
    name: 'Umschaltspiel (Klopp)',
    iconLabel: 'Vertikale Dynamik',
    motto: 'Vollgas-Fußball: Bei Ballgewinn vertikal in unter 6 Sekunden zum Abschluss.',
    coreFocus: 'Explosive Tiefenläufe von ST, LA, RA und nachrückenden 8ern.',
    mitBallGuidance: 'Schnelle flache Vertikalpässe in die Schnittstellen der Abwehrkette.',
    gegenBallGuidance: 'Kompaktes Mittelfeld-Pressing mit Einladungsfalle auf den gegnerischen Flügel.',
    umschaltGuidance: 'Bei Ballgewinn: Flügel & ST starten sofort steil in den Rücken der gegnerischen IVs.'
  },
  gegenpressing: {
    name: 'Gegenpressing (Nagelsmann)',
    iconLabel: 'Jagd auf Ballverlust',
    motto: 'Der beste Spielmacher ist der Ballgewinn im Angriffsdrittel.',
    coreFocus: 'Keine Sekunde Abschalten – Nach Ballverlust bilden 3-4 Spieler den Jagd-Ring.',
    mitBallGuidance: 'Enge Abstände behalten, um bei Ballverlust sofort zugreifen zu können.',
    gegenBallGuidance: 'Extrem hohes Angriffspressing, gegnerischen TW zum langen Ball zwingen.',
    umschaltGuidance: 'Bei Ballverlust: Sofortiger Schwarm-Druck auf den Ballführenden in unter 3 Sekunden.'
  },
  fluegelueberladung: {
    name: 'Flügelüberladung (Tuchel)',
    iconLabel: 'Überzahl & Verlagerung',
    motto: 'Auf einer Seite verengen und überladen, dann schlagartig verlagern.',
    coreFocus: 'AV + ZM + RA/LA kreieren 3v2 am Flügel, um Räume für den schwachen Flügel zu öffnen.',
    mitBallGuidance: 'Kurzpassspiel am ballnahen Flügel. Schwacher Flügelstürmer zieht kopfballstark in die Box.',
    gegenBallGuidance: 'Ballseitiges Verschieben mit maximaler Kompaktheit, schwache Seite rückt bis zur Mitte nach.',
    umschaltGuidance: 'Bei Ballgewinn: Sofortiger Flugball oder diagonale Verlagerung auf die isolierte Seite.'
  },
  kompaktheit: {
    name: 'Kompaktheit (Simeone)',
    iconLabel: 'Bollwerk & Disziplin',
    motto: 'Kein Durchkommen im Zentrum. Extrem enge Linien und Disziplin.',
    coreFocus: 'Blockabstand von max. 12-15m zwischen den 3 Reihen. Null Raum für gegnerische 10er.',
    mitBallGuidance: 'Gezielter langer Ball auf ST mit schnellem Nachrücken auf den zweiten Ball.',
    gegenBallGuidance: 'Tiefes oder Mittelfeld-Bollwerk. Alle 10 Feldspieler hinter dem Ball.',
    umschaltGuidance: 'Bei Ballverlust: Blitzschneller geordneter Rückzug auf die 16m-Linie.'
  }
};

// BUILD-UP VARIANTS REPOSITORY (8 Profi-Varianten)
export const BUILD_UP_VARIANTS: Record<BuildUpVariant, {
  name: string;
  keyPlayers: string;
  tacticalGoal: string;
  recommendation: string;
}> = {
  '5_ecken': {
    name: 'Aufbau über 5 Ecken (TW, IV-L, IV-R, LV, RV)',
    keyPlayers: 'TW, IV-L, IV-R, LV, RV',
    tacticalGoal: 'Maximale Spielfeld-Breite in erster Linie, um gegnerische Pressingreihe auseinanderzuziehen.',
    recommendation: 'AVs stehen extrem breit an der Seitenlinie; TW agiert als vollwertiger Feldspieler.'
  },
  '6er_drehpunkt': {
    name: 'Aufbau über 6er-Position (DM als Drehpunkt)',
    keyPlayers: 'DM, TW, IV-L, IV-R',
    tacticalGoal: 'Zentraler Aufbauspieler verarbeitet Ball unter Druck und verteilt in die Halbräume.',
    recommendation: 'Bei Aufbau über 6er: ZM-L muss tiefer stehen und die Gegenbewegung absichern.'
  },
  'av_fluegel': {
    name: 'Aufbau über AV links/rechts (Flügelspiel)',
    keyPlayers: 'LV, RV, LA, RA, ZM',
    tacticalGoal: 'Umschiffen des vollen Zentrums über die Außenbahn mit Hinterlaufen des AVs.',
    recommendation: 'AV schiebt mutig hoch, Flügelstürmer zieht in den Halbraum, um Passweg freizumachen.'
  },
  '3er_kette_abkippen': {
    name: 'Aufbau über 3er-Kette (DM kippt ab)',
    keyPlayers: 'DM, IV-L, IV-R, LV, RV',
    tacticalGoal: 'DM kippt zwischen die IVs. IVs schieben breiter, AVs schieben fast auf Flügelhöhe.',
    recommendation: 'DM übernimmt das Andribbeln; die 8er besetzen spiegelbildlich die Halbräume.'
  },
  '6_und_8_dreieck': {
    name: 'Aufbau über 6 & 8 (Dreiecksspiel im Zentrum)',
    keyPlayers: 'DM, ZM-L, ZM-R',
    tacticalGoal: 'Schnelles Flachpass-Dreieck im Zentrum zur Hebelung des gegnerischen Blocks.',
    recommendation: 'Zentrales Mittelfeld agiert mit nur 2 Kontakten (Klatschen lassen & steil spielen).'
  },
  'fluegel_dreieck': {
    name: 'Aufbau über Flügel (RA/LA + AV + ZM)',
    keyPlayers: 'RA/LA, LV/RV, ZM',
    tacticalGoal: 'Lokale 3v2 Überzahl am Flügel kreieren, um die gegnerische Kette zu durchbrechen.',
    recommendation: 'Bei Flügelüberladung: RA soll diagonal in den Halbraum starten.'
  },
  'zehner_verbindung': {
    name: 'Aufbau über 10 (OM als Verbindungsspieler)',
    keyPlayers: 'OM, ST, DM',
    tacticalGoal: 'Direktes Anspiel zwischen die gegnerischen Abwehr- & Mittelfeldlinien in Zone 14.',
    recommendation: 'OM sucht gezielt die Tasche hinter der gegnerischen Sechs und dreht auf.'
  },
  'doppelspitze': {
    name: 'Aufbau über Doppelspitze (ST + RA/LA oder ST + OM)',
    keyPlayers: 'ST, OM/RA, ZM',
    tacticalGoal: 'Vertikaler Flugball auf Target-Man ST, der auf nachrückende Mitspieler prallen lässt.',
    recommendation: 'Zweite Welle rückt geschlossen auf die Kugel nach; IVs sichern sofort ab.'
  },
  'fluegel_lang_st_ausweichen_10er_nachruecken': {
    name: 'Spiel nach außen & Flugball auf ausweichenden ST (10er rückt nach)',
    keyPlayers: 'AV/Flügel, ST, OM (10er), 8er, IVs',
    tacticalGoal: 'Pass nach außen auf AV/Flügel, gefolgt von gezieltem Flugball auf den nach außen ausweichenden Stürmer (ST), während der 10er (OM) explosiv in die freie Mitte nachrückt.',
    recommendation: 'ST zieht die IVs ins Aus/Halbraum. Der 10er sprintet steil in die freie Box. Das Gesamtkollektiv schiebt zur Restverteidigung nach.'
  }
};

export interface ProTrainerAnalysisResult {
  formation: TacticalFormation;
  phase: GamePhase;
  philosophy: TacticalPhilosophy;
  buildUpVariant: BuildUpVariant;
  selectedPosition: string;
  mitBallSummary: string;
  gegenBallSummary: string;
  umschaltSummary: string;
  loadProfileSummary: string;
  philosophyDetails: {
    name: string;
    motto: string;
    mitBall: string;
    gegenBall: string;
    umschalt: string;
  };
  buildUpDetails: {
    name: string;
    goal: string;
    recommendation: string;
  };
  recommendations: string[];
  level3Sentence: string;
}

export function generateProTrainerAnalysis(
  formation: TacticalFormation,
  phase: GamePhase,
  philosophy: TacticalPhilosophy,
  buildUpVariant: BuildUpVariant,
  selectedPosition: string
): ProTrainerAnalysisResult {
  const formDetails = FORMATION_REPOSITORY[formation] || FORMATION_REPOSITORY['4-3-3'];
  const philDetails = TACTICAL_PHILOSOPHIES[philosophy] || TACTICAL_PHILOSOPHIES['positionsspiel'];
  const buDetails = BUILD_UP_VARIANTS[buildUpVariant] || BUILD_UP_VARIANTS['6er_drehpunkt'];

  const posData = formDetails.positions.find(p => p.positionKey === selectedPosition) || formDetails.positions[0];

  const mitBallSummary = `Im ${formation} mit Philosophie "${philDetails.name}": ${formDetails.offensiveFocus} Variante: ${buDetails.name}. Goal: ${buDetails.tacticalGoal}`;
  const gegenBallSummary = `Gegen den Ball (${philDetails.name}): ${formDetails.defensiveFocus} Pressinghöhe: ${formDetails.pressingHeight}. ${philDetails.gegenBallGuidance}`;
  const umschaltSummary = `Umschaltphase: ${philDetails.umschaltGuidance} Bei Ballgewinn/Ballverlust agiert das Kollektiv geschlossen.`;

  const loadProfileSummary = `Position ${posData.positionLabel}: Belastungsstufe ${posData.loadLevel.toUpperCase()} (${posData.strokeWidth}px Linienstärke). Rolle: ${posData.roleMitBall}.`;

  const recommendations = [
    buDetails.recommendation,
    `Bei Gegenpressing: DM muss sofort Druck auf den Ballführenden ausüben.`,
    `Bei Kompaktheit: Zentrale enger halten und blockweise verschieben.`,
    `Für Position ${posData.positionKey}: ${phase === 'mit_ball' ? posData.trainerAdviceMitBall : posData.trainerAdviceGegenBall}`
  ];

  const level3Sentence = `Für die Position ${selectedPosition} ist diese Laufbewegung im ${formation} typisch.`;

  return {
    formation,
    phase,
    philosophy,
    buildUpVariant,
    selectedPosition,
    mitBallSummary,
    gegenBallSummary,
    umschaltSummary,
    loadProfileSummary,
    philosophyDetails: {
      name: philDetails.name,
      motto: philDetails.motto,
      mitBall: philDetails.mitBallGuidance,
      gegenBall: philDetails.gegenBallGuidance,
      umschalt: philDetails.umschaltGuidance
    },
    buildUpDetails: {
      name: buDetails.name,
      goal: buDetails.tacticalGoal,
      recommendation: buDetails.recommendation
    },
    recommendations,
    level3Sentence
  };
}

