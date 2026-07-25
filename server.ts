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

      console.log(`Parsing document with mimeType ${mimeType} via Gemini 3.5...`);

      const systemInstruction = `
Du bist ein erfahrener Co-Trainer und Analyst des FC Auggen.
Deine Aufgabe ist es, aus dem hochgeladenen Dokument (einem PDF, Foto oder Screenshot einer Sport-App wie TRACKTICS, Garmin, Strava oder handgeschriebenen Notizen) alle relevanten Informationen über eine sportliche Einheit (Training oder Match/Spiel) zu extrahieren.

Suche nach folgenden Werten:
1. Datum der Einheit (im Format YYYY-MM-DD). Falls kein Jahr angegeben ist, nimm 2026 an. Falls gar kein Datum angegeben ist, nutze das heutige Datum (${new Date().toISOString().split('T')[0]}).
2. Typ: Entweder "Training" oder "Match" (oder "Spiel" -> "Match"). Falls unklar, wähle "Training".
3. Inhaltlicher Schwerpunkt / Fokus: Eine prägnante, aussagekräftige Zusammenfassung des Themas oder Titels (z.B. "Grundlagenausdauer Lauf", "Intervalltraining", "Auswärtsspiel gegen SV Weil", "Passspiel & Torschuss").
4. Dauer: In Minuten.
5. RPE (Rate of Perceived Exertion / Belastungsempfinden): Eine Ganzzahl von 1 bis 10. Falls im Dokument keine RPE explizit steht, schätze sie basierend auf der Intensität oder der Art des Trainings (z.B. lockerer Lauf = 3-4, intensives Spiel/Intervall = 7-9).
6. Spielstatistiken (nur falls Typ = "Match"): Einsatzminuten, Tore, Vorlagen, Passquote (in %), Zweikampfquote (in %).
7. Athletische KPIs (falls vorhanden): 10m-Sprintzeit, 30m-Sprintzeit, Yo-Yo Test Level, Sprungkraft (CMJ).

Bringe die extrahierten Daten streng in das vorgegebene JSON-Format.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileData
            }
          },
          {
            text: "Extrahiere bitte alle Trainings- oder Spieldaten aus diesem Dokument gemäß den Instruktionen."
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
              jumpHeight: { type: Type.STRING, description: "Sprungkraft CMJ, z.B. '44 cm'" }
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
