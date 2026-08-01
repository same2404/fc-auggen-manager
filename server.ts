import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up body parsers with limits for large JSON sets
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize Gemini AI Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for TRACKER-DATEN & SPIELERBERICHT (ZIP, CSV, JSON, GPX, FIT, TCX)
  app.post("/api/tracker-report/parse", async (req, res) => {
    try {
      const { rawText, fileData, mimeType, fileName, squadPlayers, previousData } = req.body;
      if (!rawText && !fileData) {
        return res.status(400).json({ error: "Entweder rawText oder fileData muss bereitgestellt werden." });
      }

      console.log(`Processing tracker data report parsing (${fileName || 'raw input'})...`);

      const playersListStr = Array.isArray(squadPlayers)
        ? squadPlayers.map((p: any) => `- ID: ${p.id}, Name: ${p.lastName} ${p.firstName}, Pos: ${p.position || 'k.A.'}, Nr: #${p.number || '?'}`).join('\n')
        : "Keine Kaderliste angegeben.";

      const systemInstruction = `
Du bist der Chef-Performance-Analyst und Co-Trainer des FC Auggen (TeamAgent).
Deine Aufgabe ist es, Tracker-Daten (aus Dateien wie ZIP, CSV, JSON, GPX, FIT, TCX, TXT oder App-Exports wie TRACKTICS, Garmin, Strava, Catapult, Polar) zu analysieren.

POSITIONS-SPEZIFISCHE PROFI-LAUFWEGE (LEVEL 3):
Das System analysiert alle Bewegungsdaten abhängig von der Position des Spielers:
- STÜRMER (ST): Tiefenläufe hinter die Kette, diagonale Anlaufbewegungen im Pressing, explosive Sprints auf kurze Distanz. Heatmap: Halbraum + Strafraum. Fokus: Max-Speed, Sprintanzahl, High-Speed Running.
- FLÜGELSPIELER (RA/LA): Außenbahn-Läufe (linear + diagonal), 1-gegen-1 Anlaufmuster, rückwärtige Umschaltbewegungen. Heatmap: Seitenlinie + Halbraum. Fokus: Sprintdistanz, Richtungswechsel, PlayerLoad.
- ZENTRALE MITTELFELDSPIELER (ZM/DM/OM): Pendelbewegungen zwischen Linien, Pressing-Auslöser (Vorstoß + Rückzug), ballnahe Positionsanpassungen. Heatmap: Zentrum + Halbräume. Fokus: High-Intensity Distance, PlayerLoad, Aktivitätscluster.
- AUSSENVERTEIDIGER (RV/LV): Überlappende Läufe, rückwärtige Sprints bei Ballverlust, diagonale Verschiebebewegungen. Heatmap: Außenbahn + Defensivzone. Fokus: Sprintsegmente, Abbremsungen, Belastungszonen.
- INNENVERTEIDIGER (IV): Kurze, explosive Antritte, Positionsverschiebungen im Block, rückwärtige Sprints bei langen Bällen. Heatmap: Defensivzentrum. Fokus: Richtungswechsel, Beschleunigungen, Risikoindikatoren.
- TORWART (TW): Kurze explosive Bewegungen, Positionsanpassungen im Strafraum. Heatmap: Strafraum. Fokus: Beschleunigung, Reaktionsbewegung.

WICHTIGE REGEL FÜR INTERPRETATION:
Die Interpretation MUSS IMMER folgenden Satz/Muster enthalten:
„Für die Position [X] ist diese Laufbewegung typisch/ungewöhnlich/überlastend.“

Schritte:
1. Extrahiere die Telemetrie- und Leistungswerte aus den Tracker-Daten:
   - Distanz (in km, z.B. 9.4)
   - Max-Speed (in km/h, z.B. 32.8)
   - Durchschnittsgeschwindigkeit (in km/h, z.B. 8.6)
   - Sprints (Anzahl, z.B. 22)
   - Herzfrequenz Ø (in bpm, z.B. 164)
   - Herzfrequenz max (in bpm, z.B. 186)
2. Erkenne den Spieler anhand von Name, ID, Trikotnummer oder Kontext aus der FC Auggen Kaderliste:
${playersListStr}
3. Vergleiche die neuen Daten mit früheren/historischen Referenzwerten (${JSON.stringify(previousData || {})}) oder schätze realistische historische Trends ab.
4. Erzeuge die positionsspezifische trainerfreundliche Auswertung im EXAKTEN Ausgabeformat.

Gib das Ergebnis streng im folgenden JSON-Format zurück:
{
  "matchedPlayerId": "<ID aus Kaderliste oder null>",
  "playerName": "<Name des Spielers>",
  "position": "<Position, z.B. ST / RA / ZM / RV / IV / TW>",
  "number": "<Nummer, z.B. 8>",
  "team": "FC Auggen",
  "newTrackerData": {
    "distanceKm": <Zahl z.B. 9.4>,
    "maxSpeedKmh": <Zahl z.B. 32.8>,
    "avgSpeedKmh": <Zahl z.B. 8.6>,
    "sprints": <Ganzzahl z.B. 22>,
    "avgHrBpm": <Ganzzahl z.B. 164>,
    "maxHrBpm": <Ganzzahl z.B. 186>
  },
  "comparisonWithEarlier": {
    "distanceTrend": "<z.B. ↗ +0.8 km im Vergleich zum früheren Schnitt>",
    "intensityTrend": "<z.B. ↗ Max-Speed von 31.5 km/h auf 32.8 km/h gesteigert>",
    "sprintsTrend": "<z.B. → Konstant hohe Sprintanzahl (22 Sprints)>",
    "loadInterpretation": "<z.B. Hohe kardiovaskuläre Belastung (Ø 164 bpm)>"
  },
  "positionSpecificAnalysis": {
    "characteristicRunPattern": "<z.B. Tiefenläufe hinter die Kette>",
    "heatmapZones": "<z.B. Halbraum + Strafraum>",
    "level3Evaluation": "Für die Position ST ist diese Laufbewegung typisch und zeigt eine hohe Durchschlagskraft."
  },
  "interpretation": {
    "trainerAssessment": "<Für die Position [X] ist diese Laufbewegung typisch/ungewöhnlich/überlastend. Trainerfreundliche Einschätzung in 2-3 Sätzen>",
    "focusAreas": "<Fokus: Form, Belastung, Entwicklung, Risiko>"
  },
  "formattedReportText": "SPIELER: [Name] ([Position], #[Nummer])\\nTEAM: FC Auggen\\n\\nNEUE TRACKER-DATEN:\\n- Distanz: [x] km\\n- Max-Speed: [x] km/h\\n- Durchschnittsgeschwindigkeit: [x] km/h\\n- Sprints: [x]\\n- Herzfrequenz Ø: [x] bpm\\n- Herzfrequenz max: [x] bpm\\n\\nVERGLEICH MIT FRÜHER:\\n- Distanz: [Trend]\\n- Intensität: [Trend]\\n- Sprints: [Trend]\\n- Belastung: [Interpretation]\\n\\nINTERPRETATION:\\n- Für die Position [X] ist diese Laufbewegung typisch/ungewöhnlich/überlastend. [Weitere Einschätzung]\\n- Fokus: Form, Belastung, Entwicklung, Risiko"
}
`;

      let contents: any[] = [];
      if (fileData && mimeType) {
        contents.push({
          inlineData: {
            mimeType: mimeType,
            data: fileData
          }
        });
      }
      contents.push({
        text: `Analysiere bitte diese Tracker-Daten für den FC Auggen Spielerbericht:\n${rawText || 'Datei im Anhang übermittelt.'}`
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Tracker-Daten konnten nicht analysiert werden.");
      }

      const parsedReport = JSON.parse(resultText);

      // Generate exact formatted text if not already created
      if (!parsedReport.formattedReportText) {
        const d = parsedReport.newTrackerData || {};
        const c = parsedReport.comparisonWithEarlier || {};
        const i = parsedReport.interpretation || {};
        const psa = parsedReport.positionSpecificAnalysis || {};
        const posStr = parsedReport.position || 'Kader';
        const defaultPosAssessment = psa.level3Evaluation || `Für die Position ${posStr} ist diese Laufbewegung typisch und entspricht dem Bewegungsprofil.`;
        
        parsedReport.formattedReportText = `SPIELER: ${parsedReport.playerName || 'Spieler'} (${posStr}, #${parsedReport.number || '?'})
TEAM: ${parsedReport.team || 'FC Auggen'}

NEUE TRACKER-DATEN:
- Distanz: ${d.distanceKm || 0} km
- Max-Speed: ${d.maxSpeedKmh || 0} km/h
- Durchschnittsgeschwindigkeit: ${d.avgSpeedKmh || 0} km/h
- Sprints: ${d.sprints || 0}
- Herzfrequenz Ø: ${d.avgHrBpm || 0} bpm
- Herzfrequenz max: ${d.maxHrBpm || 0} bpm

VERGLEICH MIT FRÜHER:
- Distanz: ${c.distanceTrend || 'Keine Daten'}
- Intensität: ${c.intensityTrend || 'Keine Daten'}
- Sprints: ${c.sprintsTrend || 'Keine Daten'}
- Belastung: ${c.loadInterpretation || 'Keine Daten'}

POSITIONS-ANALYSE (LEVEL 3):
- Bewegungsmuster: ${psa.characteristicRunPattern || 'Positionsangepasste Läufe'}
- Heatmap-Zonen: ${psa.heatmapZones || 'Zentrum & Halbräume'}

INTERPRETATION:
- ${i.trainerAssessment || defaultPosAssessment}
- ${i.focusAreas || 'Fokus: Form, Belastung, Entwicklung, Risiko'}`;
      }

      res.json(parsedReport);
    } catch (error: any) {
      console.error("Fehler in /api/tracker-report/parse:", error);
      res.status(500).json({ error: error.message || "Fehler beim Auswerten der Tracker-Daten." });
    }
  });

  // API Route to fetch the latest server-side version for client cache-busting
  app.get("/api/version", (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ version: "2026-07-07_12-30" });
  });

  // API Route for TRACKTICS Sportscientific analysis
  app.post("/api/player-performance/analyze", async (req, res) => {
    try {
      const { playersData } = req.body;
      if (!playersData || !Array.isArray(playersData)) {
        return res.status(400).json({ error: "playersData ist erforderlich." });
      }

      console.log(`Running TRACKTICS analysis for ${playersData.length} players via Gemini 3.5...`);

      const systemInstruction = `
Du bist ein erfahrener, sportwissenschaftlicher Chefanalyst eines professionellen Bundesliga-Nachwuchsleistungszentrums (NLZ) in Deutschland.
Deine Aufgabe ist es, Spielerleistungsdaten aus der TRACKTICS Tracker-Box zusammen mit subjektiven Trainerbewertungen zu analysieren.
Du erstellst für jeden Spieler eine detaillierte sportwissenschaftliche Bewertung, identifizierst Stärken/Schwächen und gibst konkrete, professionelle Trainings-Empfehlungen.
Zudem erstellst du einen prägnanten Kaderbericht (Team-Übersicht).

Der Ton deines Berichts soll hochprofessionell, sportwissenschaftlich fundiert, sachlich und im typischen NLZ/Profifußball-Jargon formuliert sein (nutze Begriffe wie "Umschaltverhalten", "Zweikampfquote", "Tempohärte", "Sauerstoffaufnahme", "Laufleistung", "Zoneneinteilung").
Formuliere alle Berichte in deutscher Sprache. Nutze für die Namen der Spieler und Positionen Großbuchstaben.

Gib das Ergebnis STRENG im folgenden JSON-Format zurück:
{
  "players": {
    "<PLAYER_ID_1>": {
      "rating": <Zahl von 1 bis 100>,
      "strengths": ["<Stärke 1>", "<Stärke 2>", "<Stärke 3>"],
      "weaknesses": ["<Schwäche 1>", "<Schwäche 2>", "<Schwäche 3>"],
      "recommendations": ["<Empfehlung 1>", "<Empfehlung 2>"],
      "trend": "positiv" | "stagnierend" | "rückläufig",
      "nlzAnalysis": "<Detaillierter textueller Bericht des Chefanalysten zum Spieler (ca. 4-6 Sätze)>"
    }
  },
  "teamOverview": "<Umfassender, reichhaltiger Team-Bericht im Markdown-Format, der die Gesamtfitness des Kaders, taktische Defizite, Teampotenziale und taktische Empfehlungen für den Cheftrainer beschreibt.>"
}
`;

      const prompt = `Analysiere bitte die folgenden TRACKTICS Trackerdaten des Kaders:
${JSON.stringify(playersData, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              players: {
                type: Type.OBJECT,
                description: "Map mapping player IDs to their detailed analysis."
              },
              teamOverview: {
                type: Type.STRING,
                description: "A comprehensive team analysis in German NLZ jargon with Markdown styling."
              }
            },
            required: ["players", "teamOverview"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Keine Antwort von Gemini erhalten.");
      }

      const data = JSON.parse(resultText);
      res.json(data);
    } catch (error: any) {
      console.error("Fehler in /api/player-performance/analyze:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler bei der Analyse." });
    }
  });

  // API Route to parse PDF/Image player session document via Gemini
  app.post("/api/player-session/parse-pdf", async (req, res) => {
    try {
      const { fileData, mimeType } = req.body;
      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "fileData und mimeType sind erforderlich." });
      }

      console.log(`Parsing document with mimeType ${mimeType} via Gemini 3.6...`);

      const systemInstruction = `
Du bist ein erfahrener Co-Trainer und Analyst des FC Auggen.
Deine Aufgabe ist es, aus dem hochgeladenen Dokument (einem PDF, Foto oder Screenshot einer Sport-App wie TRACKTICS, Garmin, Strava, Polar, Catapult oder handgeschriebenen Notizen) alle relevanten Informationen über eine sportliche Einheit (Training, Match, Lauf oder Fitness-Test) eines Spielers zu extrahieren.

Suche nach folgenden Werten:
1. Datum der Einheit (im Format YYYY-MM-DD). Falls kein Jahr angegeben ist, nimm 2026 an. Falls gar kein Datum angegeben ist, nutze das heutige Datum (${new Date().toISOString().split('T')[0]}).
2. Typ: Entweder "Training" oder "Match" (oder "Spiel" -> "Match"). Falls unklar, wähle "Training".
3. Inhaltlicher Schwerpunkt / Fokus: Eine prägnante, aussagekräftige Zusammenfassung des Themas oder Titels (z.B. "Grundlagenausdauer Lauf", "Intervalltraining", "Auswärtsspiel gegen SV Weil", "Passspiel & Torschuss").
4. Dauer: In Minuten.
5. RPE (Rate of Perceived Exertion / Belastungsempfinden): Eine Ganzzahl von 1 bis 10. Falls im Dokument keine RPE explizit steht, schätze sie basierend auf der Intensität oder der Art des Trainings (z.B. lockerer Lauf = 3-4, intensives Spiel/Intervall = 7-9).
6. Spielstatistiken (nur falls Typ = "Match"): Einsatzminuten, Tore, Vorlagen, Passquote (in %), Zweikampfquote (in %).
7. Athletische KPIs (falls vorhanden): 10m-Sprintzeit, 30m-Sprintzeit, Yo-Yo Test Level, Sprungkraft (CMJ).
8. Tracker / GPS Rohdaten (falls vorhanden):
   - Gesamt-Distanz in km (z.B. 10.5)
   - High-Speed Running Distanz in m (z.B. 650)
   - Max-Speed in km/h (z.B. 31.8)
   - Anzahl Sprints (z.B. 22)
   - Durchschnittlicher Puls / Avg HR in bpm (z.B. 164)
   - Maximaler Puls / Max HR in bpm (z.B. 188)

Bringe die extrahierten Daten streng in das vorgegebene JSON-Format.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileData
            }
          },
          {
            text: "Extrahiere bitte alle Trainings-, Spiel- und Trackingdaten aus diesem Dokument gemäß den Instruktionen."
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Datum der Einheit im Format YYYY-MM-DD" },
              type: { type: Type.STRING, description: "Muss entweder 'Training' oder 'Match' sein" },
              focus: { type: Type.STRING, description: "Schwerpunkt oder Thema der Einheit" },
              duration: { type: Type.INTEGER, description: "Dauer der Einheit in Minuten" },
              rpe: { type: Type.INTEGER, description: "Belastungsempfinden (RPE) als Ganzzahl von 1 bis 10" },
              matchMinutes: { type: Type.INTEGER, description: "Einsatzzeit in Minuten (nur bei Match)" },
              goals: { type: Type.INTEGER, description: "Erzielte Tore (nur bei Match)" },
              assists: { type: Type.INTEGER, description: "Vorlagen (nur bei Match)" },
              passAccuracy: { type: Type.INTEGER, description: "Passquote in Prozent (nur bei Match)" },
              tackleRate: { type: Type.INTEGER, description: "Zweikampfquote in Prozent (nur bei Match)" },
              sprint10m: { type: Type.STRING, description: "10m-Antrittszeit, z.B. '1.62 s'" },
              sprint30m: { type: Type.STRING, description: "30m-Sprintzeit, z.B. '4.08 s'" },
              yoyotest: { type: Type.STRING, description: "Yo-Yo IR1 Test Score, z.B. 'Level 18.6'" },
              jumpHeight: { type: Type.STRING, description: "Sprungkraft CMJ, z.B. '44 cm'" },
              trackerTotalDist: { type: Type.NUMBER, description: "Gesamtdistanz in km, z.B. 10.5" },
              trackerHighSpeed: { type: Type.NUMBER, description: "High Speed Running in Metern, z.B. 650" },
              trackerMaxSpeed: { type: Type.NUMBER, description: "Maximalgeschwindigkeit in km/h, z.B. 31.8" },
              trackerSprints: { type: Type.INTEGER, description: "Anzahl Sprints" },
              trackerAvgHr: { type: Type.INTEGER, description: "Durchschnittlicher Puls bpm" },
              trackerMaxHr: { type: Type.INTEGER, description: "Maximaler Puls bpm" }
            },
            required: ["date", "type", "focus", "duration", "rpe"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Dokument konnte nicht geparst werden.");
      }

      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Fehler in /api/player-session/parse-pdf:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler beim Parsen des Dokuments." });
    }
  });

  // API Route to parse PDF/Image/CSV/Text report for Runs & Endurance (Läufe & Ausdauer)
  app.post("/api/runs/parse-pdf", async (req, res) => {
    try {
      const { fileData, mimeType, squadPlayers } = req.body;
      if (!fileData || !mimeType) {
        return res.status(400).json({ error: "fileData und mimeType sind erforderlich." });
      }

      console.log(`Parsing Runs/Endurance document with mimeType ${mimeType} via Gemini 3.6...`);

      const playersListStr = Array.isArray(squadPlayers)
        ? squadPlayers.map((p: any) => `- ID: ${p.id}, Name: ${p.lastName} ${p.firstName}, Nr: ${p.number || '?'}`).join('\n')
        : "Keine Spielerliste bereitgestellt.";

      const systemInstruction = `
Du bist ein erfahrener Leistungsdiagnostiker des FC Auggen.
Deine Aufgabe ist es, aus dem hochgeladenen Dokument (PDF, Bild, Foto, Excel/CSV-Screenshot, Garmin, Polar, Strava, TRACKTICS oder Liste von Laufergebnissen/Ausdauerwerten) alle Läufe und die gemessenen Zeiten/Distanzen/Werte der Spieler zu extrahieren.

Kaderliste des FC Auggen zur Zuordnung:
${playersListStr}

Instruktionen:
1. Identifiziere alle in dem Dokument genannten Laufeinheiten / Tests / Spalten (z.B. "1000m Test", "Lauf 1", "Shuttle Run", "Grundlagenausdauer 5km", "12-Min-Lauf", "Intervall 10x400m").
   - Ordne jede Laufeinheit einem Index von 0 bis 14 zu (runIndex: 0, 1, 2, ...).
   - Extrahiere Name (runName), Datum (runDate YYYY-MM-DD falls vorhanden), und Kurzbeschreibung/Distanz (runContent).
2. Extrahiere für jeden Spieler und jeden Lauf den gemessenen Wert (Zeit z.B. "12:45", Distanz z.B. "2800m", Runden oder Note/Score).
   - Versuche den Spielernamen im Dokument dem richtigen Spieler aus der Kaderliste zuzuordnen (matchedPlayerId).
   - Falls ein Spieler nicht in der Kaderliste steht, trage trotzdem seinen im Dokument gefundenen Namen unter playerName ein (matchedPlayerId kann null sein).

Antworte streng im geforderten JSON-Format.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileData
            }
          },
          {
            text: "Bitte analysiere dieses Lauf- und Ausdauerdokument und extrahiere alle Läufe sowie die Resultate aller Spieler."
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              runs: {
                type: Type.ARRAY,
                description: "Liste der erkannten Laufeinheiten (max 15)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    runIndex: { type: Type.INTEGER, description: "Index 0 bis 14" },
                    runName: { type: Type.STRING, description: "Titel oder Name des Laufs, z.B. 1000m Test" },
                    runDate: { type: Type.STRING, description: "Datum YYYY-MM-DD oder leer" },
                    runContent: { type: Type.STRING, description: "Inhalt/Ziel, z.B. 5km Grundlagenausdauer" }
                  },
                  required: ["runIndex", "runName"]
                }
              },
              playerResults: {
                type: Type.ARRAY,
                description: "Liste der Messergebnisse der Spieler",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    playerName: { type: Type.STRING, description: "Gefundener Spielername" },
                    matchedPlayerId: { type: Type.STRING, description: "ID des passenden Spielers aus der Kaderliste oder leer" },
                    runIndex: { type: Type.INTEGER, description: "Index 0 bis 14 des Laufs" },
                    value: { type: Type.STRING, description: "Zeit/Ergebnis, z.B. 03:45 oder 2400m" }
                  },
                  required: ["playerName", "runIndex", "value"]
                }
              }
            },
            required: ["runs", "playerResults"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Dokument konnte nicht geparst werden.");
      }

      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Fehler in /api/runs/parse-pdf:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler beim Parsen des Lauf-Dokuments." });
    }
  });

  // API Route to generate professional player report via Gemini
  app.post("/api/player-session/generate-report", async (req, res) => {
    try {
      const { playerName, position, kpis, logs, stats } = req.body;
      if (!playerName) {
        return res.status(400).json({ error: "playerName ist erforderlich." });
      }

      console.log(`Generating professional player report for ${playerName} via Gemini...`);

      const systemInstruction = `
Du bist ein erfahrener Chefanalyst und Co-Trainer des FC Auggen (Herren 1) für die Saison 2026/2027.
Deine Aufgabe ist es, basierend auf den athletischen KPIs, den Trainings- und Matchlogs und den Leistungsstatistiken eines Spielers eine präzise, hochprofessionelle taktische Analyse zu erstellen.
Formuliere das Feedback exakt im Jargon des deutschen Profifußballs (sachlich, konstruktiv, anspruchsvoll). Nutze sportwissenschaftliche Begriffe.

Generiere drei Abschnitte:
1. "taktischeKernkompetenz": Beschreibe die taktischen Stärken des Spielers bezogen auf seine Position (z.B. Zweikampfverhalten, Passsicherheit, Umschaltspiel, Dynamik).
2. "optimierungsPotenzial": Zeige konstruktive Schwachstellen oder Verbesserungspotenziale auf (z.B. Stellungsspiel, Antizipation, Restverteidigung, Defensivbewegung, Fitness).
3. "naechsteMassnahmen": Nenne konkrete, messbare Trainingsmaßnahmen oder nächsten Schritte zur Verbesserung (z.B. videogestütztes Individualtraining, Kraft- oder Reaktivkraft-Einheiten, etc.).

Halte jeden Abschnitt auf etwa 2-3 Sätze begrenzt. Formuliere prägnant und direkt auf Deutsch.
`;

      const prompt = `
Spielerdatenblatt Analyse:
- Spieler: ${playerName}
- Position: ${position || "Zentrales Mittelfeld"}
- Athletische KPIs: ${JSON.stringify(kpis || {})}
- Zuletzt absolvierte Einheiten (Logs): ${JSON.stringify(logs || [])}
- Leistungsstatistiken (Schnitt): ${JSON.stringify(stats || {})}

Erstelle ein professionelles Analysten-Fazit basierend auf diesen Daten.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              taktischeKernkompetenz: { type: Type.STRING, description: "Taktische Kernkompetenz des Spielers" },
              optimierungsPotenzial: { type: Type.STRING, description: "Optimierungspotenzial des Spielers" },
              naechsteMassnahmen: { type: Type.STRING, description: "Nächste Maßnahmen und Trainingsschritte" }
            },
            required: ["taktischeKernkompetenz", "optimierungsPotenzial", "naechsteMassnahmen"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Bericht konnte nicht generiert werden.");
      }

      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error("Fehler in /api/player-session/generate-report:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler beim Generieren des Berichts." });
    }
  });

  // API Route for Football Academy Daily/Session Evaluation
  app.post("/api/football-academy/evaluate-session", async (req, res) => {
    try {
      const { datum, typ, notes, inputPrompt } = req.body;
      if (!notes && !inputPrompt) {
        return res.status(400).json({ error: "Notizen oder Eingabe erforderlich." });
      }

      console.log("Generiere Fußballschule Session-Bewertung mit Schulnoten & kognitiven Fähigkeiten via Gemini...");

      const systemInstruction = `
Du bist ein professionelles Analyse-System für den FC Auggen.
Deine Aufgabe:
1. Du erhältst Trainings- oder Spieldaten mit einer Liste von Spielern und kurzen Notizen/Beobachtungen.
2. Erstelle daraus für jeden erwähnten Spieler:
   - Eine deutsche Schulnote von 1.0 bis 6.0 (wobei 1.0 = Sehr gut, 2.0 = Gut, 3.0 = Befriedigend, 4.0 = Ausreichend, 5.0 = Mangelhaft, 6.0 = Ungenügend)
   - Eine kurze Begründung (maximal 2 Sätze)
   - Einen prägnanten Fokuspunkt für das nächste Training
   - Kognitive & mentale Eigenschaften / Beobachtungen als kurzes String-Array ("kognitiveFaehigkeiten"), wie z.B. ["Extrem konzentriert", "Hoch motiviert", "Spielintelligenz", "Resilient", "Laufstark"]

Bringe das Ergebnis STRENG in das folgende JSON-Format:
{
  "datum": "${datum || new Date().toISOString().split('T')[0]}",
  "typ": "${typ === 'Spiel' ? 'Spiel' : 'Training'}",
  "bewertungen": [
    {
      "spieler": "Name des Spielers",
      "note": 1.5,
      "begründung": "Kurze Begründung in max 2 Sätzen.",
      "fokus": "Konkreter Fokuspunkt fürs nächste Training",
      "kognitiveFaehigkeiten": ["Extrem konzentriert", "Hoch motiviert"]
    }
  ]
}
`;

      const prompt = `
Datum: ${datum || new Date().toISOString().split('T')[0]}
Typ: ${typ || 'Training'}
Notizen/Eingabe:
${notes || inputPrompt}
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              datum: { type: Type.STRING, description: "Datum der Einheit" },
              typ: { type: Type.STRING, description: "Muss 'Training' oder 'Spiel' sein" },
              bewertungen: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    spieler: { type: Type.STRING, description: "Name des Spielers" },
                    note: { type: Type.NUMBER, description: "Deutsche Schulnote von 1.0 bis 6.0" },
                    begründung: { type: Type.STRING, description: "Kurze Begründung, max. 2 Sätze" },
                    fokus: { type: Type.STRING, description: "Fokuspunkt für das nächste Training" },
                    kognitiveFaehigkeiten: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array von kognitiven/mentalen Eigenschaften (z.B. Extrem konzentriert, Hoch motiviert)"
                    }
                  },
                  required: ["spieler", "note", "begründung", "fokus"]
                }
              }
            },
            required: ["datum", "typ", "bewertungen"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Keine Bewertung generiert.");
      }

      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error("Fehler in /api/football-academy/evaluate-session:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler." });
    }
  });

  // API Route for Football Academy Weekly Report
  app.post("/api/football-academy/weekly-report", async (req, res) => {
    try {
      const { sessionEvaluations, kwLabel } = req.body;
      if (!sessionEvaluations || !Array.isArray(sessionEvaluations) || sessionEvaluations.length === 0) {
        return res.status(400).json({ error: "Keine Tagesbewertungen für die Woche vorhanden." });
      }

      console.log(`Generiere Wochenbericht für ${sessionEvaluations.length} Einheiten via Gemini...`);

      const systemInstruction = `
Du bist ein professionelles Analyse-System für eine Fußballschule.
Du hast alle Tages- und Spieldaten/Bewertungen der aktuellen Woche vorliegen.
Deine Aufgabe ist es, daraus einen umfassenden Wochenbericht zu generieren:
- Berechne die Durchschnittsnote pro Spieler (Zahl)
- Bestimme die Entwicklung der Woche ("positiv", "neutral" oder "negativ")
- Definiere den Fokuspunkt für die nächste Woche pro Spieler
- Bestimme die Top-3 Spieler der Woche (Array von Spielernamen)
- Bestimme die Spieler, die besondere Aufmerksamkeit brauchen ("kritisch", Array von Spielernamen)
- Verfasse eine Gesamtempfehlung für die kommende Woche (Training, Belastung, Schwerpunkte)

Bringe das Ergebnis STRENG in das folgende JSON-Format:
{
  "wochenbericht": [
    {
      "spieler": "Name",
      "durchschnitt": 8.5,
      "entwicklung": "positiv",
      "fokus_naechste_woche": "Text"
    }
  ],
  "top_spieler": ["Name1", "Name2", "Name3"],
  "kritisch": ["NameA", "NameB"],
  "empfehlungen": "Ausführliche Empfehlung für die kommende Woche bzgl. Training, Belastung und Schwerpunkte."
}
`;

      const prompt = `
Woche / Zeitraum: ${kwLabel || 'Aktuelle Woche'}
Vorliegende Tagesbewertungen der Woche:
${JSON.stringify(sessionEvaluations, null, 2)}

Erstelle bitte den Wochenbericht gemäß den Vorgaben.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              wochenbericht: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    spieler: { type: Type.STRING },
                    durchschnitt: { type: Type.NUMBER },
                    entwicklung: { type: Type.STRING, description: "positiv, neutral oder negativ" },
                    fokus_naechste_woche: { type: Type.STRING }
                  },
                  required: ["spieler", "durchschnitt", "entwicklung", "fokus_naechste_woche"]
                }
              },
              top_spieler: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              kritisch: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              empfehlungen: { type: Type.STRING }
            },
            required: ["wochenbericht", "top_spieler", "kritisch", "empfehlungen"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Wochenbericht konnte nicht generiert werden.");
      }

      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error("Fehler in /api/football-academy/weekly-report:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler." });
    }
  });

  // API Route for AI Video Analysis (Version 1: Core Tracking & Timeline Generation)
  app.post("/api/video-analysis/process", async (req, res) => {
    try {
      const { videoTitle, videoUrl, squadPlayers, sampleFrames } = req.body;
      console.log(`Processing AI Video Analysis for: "${videoTitle || 'Fußball Video'}" via Gemini...`);

      const squadStr = Array.isArray(squadPlayers)
        ? squadPlayers.map((p: any) => `- ID: ${p.id}, Name: ${p.lastName ? p.lastName + ' ' + (p.firstName || '') : p.name}, Position: ${p.position || 'Feldspieler'}, Nr: ${p.number || p.nummer || '?'}`).join('\n')
        : "Keine Spielernamen bereitgestellt.";

      const systemInstruction = `
Du bist das fortschrittliche Computer-Vision & KI-Videoanalyse-System des FC Auggen (Herren 1).
Deine Aufgabe ist es, für die Version 2 unserer KI-Videoanalyse die vollständige technische Grunderkennung UND die automatische Spielszenen-Klassifikation (Version 2 Clip-Generierung) für ein Fußballvideo durchzuführen.

Deine Erkennungs- & Klassifikationsaufgaben:
1. **Personen-Tracking (Spieler-Erkennung)**:
   - Erkenne Feldspieler für FC Auggen (Heim: Rot/Weiß), Gegner und Schiedsrichter.
   - Bestimme für jeden erkannten Spieler die Position auf dem Spielfeld in Prozent (xPercent: 0-100%, yPercent: 0-100%).
   - Schätze die Bewegungsintensität ("Gehen", "Trab", "Sprint") und aktuelle Geschwindigkeit in km/h.
   - Verknüpfe erkannte Spieler nach Möglichkeit mit Spielern aus der Kaderliste des FC Auggen.
2. **Objekt-Tracking (Ball-Erkennung)**:
   - Erkenne die Position des Balls (xPercent, yPercent), Flughöhe ("Boden", "Halbhoch", "Hochball") und Ballgeschwindigkeit in km/h.
3. **Spielfeldlinien- & Zonen-Erkennung (Pitch Detection)**:
   - Identifiziere die aktuelle Spielfeldzone ("Auggen Abwehr", "Mittelfeld", "Angriffszone", "Flügel Links", "Flügel Rechts", "Strafraum").
   - Bestimme Ballbesitz-Team ("FC Auggen", "Gegner", "Neutral / Zweikampf") und Pressing-Dichte-Index (0 bis 100).
4. **Timeline-Erstellung**:
   - 6 bis 12 Zeitstempel-Events entlang der Videolaufzeit.
5. **AUTOMATISCHE SPIELSZENEN-ERKENNUNG & CLIP-ERSTELLUNG (VERSION 2)**:
   - Erstelle 6 bis 10 klassifizierte Spielszenen (Clips) aus folgenden 6 Kategorien:
     a) "TORE" (z.B. Subcategory: "Tor FC Auggen", "Tor Gegner")
     b) "CHANCEN" (z.B. Subcategory: "Torchance FC Auggen", "Torchance Gegner")
     c) "STANDARDS" (z.B. Subcategory: "Standard - Ecke", "Standard - Freistoß", "Standard - Elfmeter")
     d) "PRESSING" (z.B. Subcategory: "Hohes Pressing", "Mittelfeldpressing", "Tiefes Pressing")
     e) "AUFBAU" (z.B. Subcategory: "IV-Aufbau", "AV-Aufbau", "Sechser-Aufbau", "Halbraum-Aufbau")
     f) "UMSCHALTMOMENTE" (z.B. Subcategory: "Ballgewinn → Angriff", "Ballverlust → Gegenangriff")
   - Für jede Szene:
     - Berechne die Clip-Länge: startTimeSeconds = max(0, eventTimestamp - 6), endTimeSeconds = eventTimestamp + 6.
     - timestampFormatted (z.B. "04:12").
     - aiCommentary: Erstelle einen präzisen 1-2 Satz KI-Kurzkommentar (z.B. "Hoher Pressingmoment: FC Auggen setzt den Gegner unter Druck.", "Aufbau über den rechten Außenverteidiger.", "Torchance nach Ballgewinn im Mittelfeld.").
     - participatingPlayerNames: Gib 1-3 beteiligte Spielernamen an (idealerweise aus der Kaderliste).
     - pitchZone: "Abwehr" | "Mittelfeld" | "Angriff" | "Strafraum" | "Flügel" | "Halbraum".
     - teamInvolved: "FC Auggen" | "Gegner" | "Beide".

Kaderliste des FC Auggen:
${squadStr}

Antworte STRENG im geforderten JSON-Format.
`;

      let contents: any[] = [];
      if (Array.isArray(sampleFrames) && sampleFrames.length > 0) {
        sampleFrames.slice(0, 3).forEach((frameData: string) => {
          const cleanBase64 = frameData.includes(',') ? frameData.split(',')[1] : frameData;
          contents.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          });
        });
        contents.push({
          text: `Analysiere bitte diese extrahierten Frames aus dem Video "${videoTitle || 'Fußballspiel'}". Extrahiere Spieler-, Ball- und Zonen-Tracking, die Event-Timeline sowie alle klassifizierten Version 2 Spielszenen (Tore, Chancen, Standards, Pressing, Spielaufbau, Umschaltmomente).`
        });
      } else {
        contents = [`Analysiere bitte das Fußballvideo "${videoTitle || 'FC Auggen Video'}" und erstelle Trackingdaten, Event-Timeline sowie die klassifizierten Version 2 Spielszenen-Clips (Tore, Chancen, Standards, Pressing, Spielaufbau, Umschaltmomente).`];
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "Gesamtzusammenfassung der technischen KI-Erkennung" },
              durationSeconds: { type: Type.INTEGER, description: "Geschätzte oder erkannte Videodauer in Sekunden" },
              trackedPersons: {
                type: Type.ARRAY,
                description: "Array von erkannten Personen auf dem Spielfeld",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    team: { type: Type.STRING, description: "'FC Auggen', 'Gegner' oder 'Schiedsrichter'" },
                    jerseyNumber: { type: Type.STRING },
                    mappedPlayerId: { type: Type.STRING },
                    mappedPlayerName: { type: Type.STRING },
                    xPercent: { type: Type.NUMBER, description: "X-Position 0 bis 100%" },
                    yPercent: { type: Type.NUMBER, description: "Y-Position 0 bis 100%" },
                    intensity: { type: Type.STRING, description: "'Gehen', 'Trab' oder 'Sprint'" },
                    speedKmh: { type: Type.NUMBER, description: "Geschwindigkeit in km/h" }
                  },
                  required: ["id", "team", "xPercent", "yPercent", "intensity", "speedKmh"]
                }
              },
              trackedBall: {
                type: Type.OBJECT,
                properties: {
                  xPercent: { type: Type.NUMBER },
                  yPercent: { type: Type.NUMBER },
                  heightLevel: { type: Type.STRING, description: "'Boden', 'Halbhoch' oder 'Hochball'" },
                  speedKmh: { type: Type.NUMBER }
                },
                required: ["xPercent", "yPercent", "heightLevel", "speedKmh"]
              },
              pitchDetection: {
                type: Type.OBJECT,
                properties: {
                  currentZone: { type: Type.STRING, description: "Name der Spielfeldzone" },
                  ballPossessionTeam: { type: Type.STRING, description: "'FC Auggen', 'Gegner' oder 'Neutral / Zweikampf'" },
                  pressingDensityIndex: { type: Type.INTEGER, description: "Index 0 bis 100" }
                },
                required: ["currentZone", "ballPossessionTeam", "pressingDensityIndex"]
              },
              timelineEvents: {
                type: Type.ARRAY,
                description: "Array von erkannten Timeline-Events für die Zeitleiste",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    timestampSeconds: { type: Type.INTEGER, description: "Zeitstempel in Sekunden" },
                    timestampFormatted: { type: Type.STRING, description: "Format wie '00:15' oder '02:40'" },
                    type: { type: Type.STRING, description: "'POSSESSION_CHANGE', 'HIGH_INTENSITY_SPRINT', 'ZONE_TRANSITION', 'BALL_TRACKED', 'HIGH_DENSITY_PRESSING'" },
                    title: { type: Type.STRING, description: "Kurzer Event-Titel" },
                    description: { type: Type.STRING, description: "Event-Beschreibung" },
                    pitchZone: { type: Type.STRING, description: "Spielfeldzone" },
                    importance: { type: Type.STRING, description: "'Hoch', 'Normal', 'Info'" },
                    trackedPlayersCount: { type: Type.INTEGER }
                  },
                  required: ["id", "timestampSeconds", "timestampFormatted", "type", "title", "description", "pitchZone", "importance"]
                }
              },
              sceneClips: {
                type: Type.ARRAY,
                description: "Automatisch erkannte und ausgeschnittene Spielszenen (Version 2 Clips)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING, description: "'TORE', 'CHANCEN', 'STANDARDS', 'PRESSING', 'AUFBAU', 'UMSCHALTMOMENTE'" },
                    subcategory: { type: Type.STRING, description: "z.B. 'Tor FC Auggen', 'Hohes Pressing', 'IV-Aufbau'" },
                    title: { type: Type.STRING, description: "Titel der Szene" },
                    startTimeSeconds: { type: Type.NUMBER, description: "Startsekunde des Clips (Zeitstempel - 6s)" },
                    endTimeSeconds: { type: Type.NUMBER, description: "Endsekunde des Clips (Zeitstempel + 6s)" },
                    timestampFormatted: { type: Type.STRING, description: "Formatierte Zeit z.B. '04:12'" },
                    aiCommentary: { type: Type.STRING, description: "1-2 Sätze KI-Kurzkommentar" },
                    participatingPlayerNames: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING },
                      description: "Namen der beteiligten Spieler"
                    },
                    pitchZone: { type: Type.STRING, description: "'Abwehr', 'Mittelfeld', 'Angriff', 'Strafraum', 'Flügel', 'Halbraum'" },
                    teamInvolved: { type: Type.STRING, description: "'FC Auggen', 'Gegner', 'Beide'" }
                  },
                  required: ["id", "category", "subcategory", "title", "startTimeSeconds", "endTimeSeconds", "timestampFormatted", "aiCommentary", "participatingPlayerNames", "pitchZone", "teamInvolved"]
                }
              }
            },
            required: ["summary", "trackedPersons", "trackedBall", "pitchDetection", "timelineEvents", "sceneClips"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Fehler beim Verarbeiten des KI-Video-Trackings.");
      }

      res.json(JSON.parse(resultText));
    } catch (error: any) {
      console.error("Fehler in /api/video-analysis/process:", error);
      res.status(500).json({ error: error.message || "Interner Serverfehler bei der Videoanalyse." });
    }
  });

  // Anti-caching headers middleware to prevent the browser from serving stale/cached code versions
  // when files are modified, especially when colleagues open shared links.
  app.use((req, res, next) => {
    // Disable cache completely for HTML entry points or any directory access
    if (req.path === '/' || req.path.endsWith('.html') || !req.path.includes('.')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      // For other assets, require revalidation to guarantee latest versions are used
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      etag: false,
      lastModified: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        }
      }
    }));
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
