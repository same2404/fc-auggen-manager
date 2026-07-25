import React from 'react';
import { 
  ListTodo, 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Clock, 
  Layout, 
  Database, 
  Zap,
  ArrowUpCircle,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'ui' | 'logic' | 'database' | 'ux';
  status: 'pending' | 'in-progress' | 'completed';
  steps: string[];
}

const tasks: Task[] = [
  {
    id: '1',
    title: 'Physio-Modul Vervollständigung',
    description: 'Physios müssen in der Lage sein, neue Spieler direkt im Modul anzulegen und Behandlungen lückenlos zu dokumentieren.',
    priority: 'high',
    category: 'logic',
    status: 'in-progress',
    steps: [
      'Button "Neuer Spieler" mit dem globalen Spieler-Modal verknüpfen (Erledigt)',
      'Löschfunktion für Physio-Einträge aktivieren (Erledigt)',
      'Physios der Kategorie "medical" zuordnen (Erledigt)',
      'Validierung der Eingabefelder im Physio-Plan implementieren'
    ]
  },
  {
    id: '2',
    title: 'Globale Namensanzeige (Nachname)',
    description: 'Sicherstellen, dass in allen Modulen konsistent nur der Nachname angezeigt wird.',
    priority: 'high',
    category: 'ux',
    status: 'in-progress',
    steps: [
      'YearlyPlanView: Vorname entfernt (Erledigt)',
      'MeetingsCalendar: Filter und Anzeige auf Nachname umgestellt (Erledigt)',
      'BudgetFinance: Vorname-Spalte entfernt (Erledigt)',
      'TacticBoard: Initialen entfernt (Erledigt)',
      'PersonnelView: Anzeige auf Nachname fixiert (Erledigt)',
      'TeamListView: Export und Anzeige geprüft (Erledigt)'
    ]
  },
  {
    id: '3',
    title: 'Zusatzfelder Personal/Basisdaten',
    description: 'Integration von Verletzungshistorie, beruflichem Status und Arbeitgeber.',
    priority: 'medium',
    category: 'database',
    status: 'completed',
    steps: [
      'Datenmodell um injuryHistory, professionalStatus und employer erweitert (Erledigt)',
      'Eingabemaske im Spieler-Modal angepasst (Erledigt)',
      'Anzeige in der Personal-Detailansicht sichergestellt (Erledigt)'
    ]
  },
  {
    id: '4',
    title: 'Tactic Board Optimierung',
    description: 'Verbesserung der Interaktivität und Bearbeitbarkeit von Elementen auf dem Taktikboard.',
    priority: 'medium',
    category: 'ui',
    status: 'pending',
    steps: [
      'Farbauswahl für gezeichnete Linien und Formen implementieren',
      'Größenänderung von Spielersymbolen ermöglichen',
      'Speichern von verschiedenen Taktik-Setups in der Datenbank',
      'Export-Funktion als Bild (PNG/JPG)'
    ]
  },
  {
    id: '5',
    title: 'Scouting Modul Fehlerbehebung',
    description: 'Behebung von Problemen beim Hinzufügen und Entfernen von Kandidaten.',
    priority: 'high',
    category: 'logic',
    status: 'in-progress',
    steps: [
      'Löschfunktion in der Grid- und Tabellenansicht prüfen (Erledigt)',
      'Hinzufügen-Modal Validierung verbessern',
      'Schattenkader-Logik (Depth Chart) mit Scouting-Daten synchronisieren'
    ]
  },
  {
    id: '6',
    title: 'Testspiele & Wettbewerbe',
    description: 'Bearbeitung und Übersicht der Testspiele verbessern.',
    priority: 'medium',
    category: 'ui',
    status: 'pending',
    steps: [
      'Detailansicht für Testspiele mit Torschützen und Notizen',
      'Statistik-Aggregation über alle Testspiele hinweg',
      'Kalender-Integration für Spieltermine'
    ]
  }
];

export const DeveloperTasksView: React.FC = () => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-400 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ui': return <Layout size={14} />;
      case 'logic': return <Zap size={14} />;
      case 'database': return <Database size={14} />;
      case 'ux': return <ShieldCheck size={14} />;
      default: return <ListTodo size={14} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b-4 border-black bg-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <ListTodo size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter leading-none">Entwickler-Roadmap & Tasks</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Priorisierte Aufgabenliste für die App-Optimierung</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 border-2 border-black text-[10px] font-black uppercase">
            <CheckCircle2 size={14} className="text-green-600" />
            <span>{tasks.filter(t => t.status === 'completed').length} Erledigt</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 border-2 border-black text-[10px] font-black uppercase">
            <Clock size={14} className="text-yellow-600" />
            <span>{tasks.filter(t => t.status === 'in-progress').length} In Arbeit</span>
          </div>
        </div>
      </div>

      {/* Task Grid */}
      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tasks.map(task => (
            <div key={task.id} className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
              <div className="p-4 border-b-4 border-black flex justify-between items-start bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Prio: Hoch' : task.priority === 'medium' ? 'Prio: Mittel' : 'Prio: Niedrig'}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest">
                      {getCategoryIcon(task.category)} {task.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight leading-tight">{task.title}</h3>
                </div>
                <div className={`p-2 border-2 border-black ${task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-yellow-400' : 'bg-gray-200'}`}>
                  {task.status === 'completed' ? <CheckCircle2 size={20} /> : task.status === 'in-progress' ? <Clock size={20} /> : <Circle size={20} />}
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-4">
                <p className="text-xs font-bold text-gray-600 italic">"{task.description}"</p>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-1 flex items-center gap-2">
                    <ArrowUpCircle size={12} /> Umsetzungsschritte
                  </h4>
                  <ul className="space-y-1.5">
                    {task.steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] font-bold">
                        {step.includes('(Erledigt)') ? (
                          <CheckCircle2 size={12} className="text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle size={12} className="text-black/20 shrink-0 mt-0.5" />
                        )}
                        <span className={step.includes('(Erledigt)') ? 'line-through opacity-40' : ''}>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t-4 border-black flex justify-between items-center">
                <div className="flex gap-2">
                  <button className="p-1.5 border-2 border-black hover:bg-black hover:text-white transition-all"><MessageSquare size={12} /></button>
                  <button className="p-1.5 border-2 border-black hover:bg-black hover:text-white transition-all"><AlertTriangle size={12} /></button>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Task ID: {task.id}</span>
              </div>
            </div>
          ))}
        </div>

        {/* UI/UX Suggestions Section */}
        <div className="mt-12 bg-black text-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)]">
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
            <Zap size={28} className="text-yellow-400" /> UI/UX Design Vorschläge
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h4 className="font-black uppercase text-sm text-yellow-400">Neubrutalismus-Stil</h4>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                Beibehaltung der harten Schatten (8px/12px), dicken Rahmen (4px) und der kontrastreichen Farbpalette (Schwarz/Weiß/Rot). Dies verleiht der App einen professionellen, aber modernen "Mission Control" Vibe.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-black uppercase text-sm text-yellow-400">Interaktive Feedbacks</h4>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                Einführung von Hover-Effekten (Scale, Rotate) für alle Buttons und Karten. Toast-Benachrichtigungen für alle Speicher- und Löschvorgänge konsistent einsetzen.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-black uppercase text-sm text-yellow-400">Mobile Optimierung</h4>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                Sicherstellen, dass alle Tabellen auf kleinen Bildschirmen horizontal scrollbar sind oder in Kartenansichten umbrechen. Touch-Targets auf mindestens 44px vergrößern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
