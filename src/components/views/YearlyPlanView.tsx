import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Activity, 
  Plus, 
  Target,
  Shield,
  Star,
  List,
  LayoutGrid,
  GripHorizontal,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  CalendarDays,
  CalendarRange,
  Dribbble,
  Flag,
  Landmark,
  Users,
  Search,
  Edit2,
  Trash2,
  TableProperties,
  X,
  Gift
} from 'lucide-react';
import { getHolidays } from '../../utils/holidays';

interface YearlyPlanViewProps {
  yearlyPlan: Record<string, any>;
  players: any[];
  trainingSessions: any[];
  summerPrep?: any[];
  testMatches?: any[];
  competitiveMatches?: any[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  handleUpdateDayPlan: (dateKey: string, field: string, value: any) => void;
  isEditing?: boolean;
}

export const YearlyPlanView: React.FC<YearlyPlanViewProps> = ({
  yearlyPlan,
  players,
  trainingSessions,
  summerPrep = [],
  testMatches = [],
  competitiveMatches = [],
  currentMonth,
  setCurrentMonth,
  handleUpdateDayPlan,
  isEditing = false
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list'>('list');
  const [calendarMode, setCalendarMode] = useState<'month' | 'week' | 'year'>('year');
  const [timelineZoom, setTimelineZoom] = useState<'year' | 'quarter' | 'month'>('year');
  const [selectedEventDate, setSelectedEventDate] = useState<string | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genOptions, setGenOptions] = useState({
    startDate: '2026-07-06',
    endDate: '2027-05-30',
    trainingDays: [2, 4], // Tuesday & Thursday as default training days
    skipHolidays: true,
    breakStart: '2026-12-15',
    breakEnd: '2027-01-15'
  });

  const toggleTrainingDay = (day: number) => {
    setGenOptions(prev => {
      const active = prev.trainingDays.includes(day);
      const updated = active 
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day];
      return { ...prev, trainingDays: updated };
    });
  };

  const [sidebarTab, setSidebarTab] = useState<'status' | 'birthdays'>('status');
  const [birthdaySearch, setBirthdaySearch] = useState('');

  const birthdaysByMonthDay = useMemo(() => {
    const map: Record<string, Array<{ id: string; name: string; firstName?: string; lastName?: string; geburtsdatum: string; category: string; birthYear?: number; categoryLabel: string }>> = {};
    if (!players || !Array.isArray(players)) return map;
    
    const categoryLabels: Record<string, string> = {
      player: 'Spielerkader',
      coach: 'Trainerteam',
      staff: 'Teammanagement / Funktionär',
      medical: 'Medizinische Abteilung'
    };

    players.forEach((p: any) => {
      if (!p.geburtsdatum) return;
      
      let month = '';
      let day = '';
      let birthYear = 0;
      
      if (p.geburtsdatum.includes('-')) {
        const parts = p.geburtsdatum.split('-');
        if (parts.length >= 3) {
          birthYear = parseInt(parts[0], 10);
          month = String(parseInt(parts[1], 10)).padStart(2, '0');
          day = String(parseInt(parts[2], 10)).padStart(2, '0');
        }
      } else if (p.geburtsdatum.includes('.')) {
        const parts = p.geburtsdatum.split('.');
        if (parts.length >= 3) {
          // DD.MM.YYYY
          birthYear = parseInt(parts[2], 10);
          month = String(parseInt(parts[1], 10)).padStart(2, '0');
          day = String(parseInt(parts[0], 10)).padStart(2, '0');
        }
      }
      
      if (month && day) {
        const key = `${month}-${day}`;
        if (!map[key]) {
          map[key] = [];
        }
        map[key].push({
          id: p.id,
          name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
          firstName: p.firstName,
          lastName: p.lastName,
          geburtsdatum: p.geburtsdatum,
          category: p.category || 'player',
          categoryLabel: categoryLabels[p.category] || 'Sonstige',
          birthYear: birthYear || undefined
        });
      }
    });
    
    return map;
  }, [players]);

  const getBirthdaysForDate = (dateKey: string) => {
    const parts = dateKey.split('-');
    if (parts.length < 3) return [];
    const monthDayKey = `${parts[1]}-${parts[2]}`;
    const people = birthdaysByMonthDay[monthDayKey] || [];
    const targetYear = parseInt(parts[0], 10);
    
    return people.map(p => {
      let age: number | undefined = undefined;
      if (p.birthYear) {
        age = targetYear - p.birthYear;
      }
      return {
        ...p,
        age
      };
    });
  };

  const sortedBirthdays = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      geburtsdatum: string;
      category: string;
      month: number;
      day: number;
      birthYear?: number;
      formattedDate: string;
      categoryLabel: string;
    }> = [];
    
    const categoryLabels: Record<string, string> = {
      player: 'Spielerkader',
      coach: 'Trainerteam',
      staff: 'Teammanagement / Funktionär',
      medical: 'Medizinische Abteilung'
    };

    const monthNames = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];

    Object.entries(birthdaysByMonthDay).forEach(([monthDayKey, people]) => {
      const [mStr, dStr] = monthDayKey.split('-');
      const month = parseInt(mStr, 10);
      const day = parseInt(dStr, 10);
      
      people.forEach(p => {
        list.push({
          id: p.id,
          name: p.name,
          geburtsdatum: p.geburtsdatum,
          category: p.category,
          month,
          day,
          birthYear: p.birthYear,
          formattedDate: `${day}. ${monthNames[month - 1]}`,
          categoryLabel: categoryLabels[p.category] || 'Sonstige'
        });
      });
    });

    return list.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }, [birthdaysByMonthDay]);

  const filteredBirthdays = useMemo(() => {
    return sortedBirthdays.filter(p => 
      p.name.toLowerCase().includes(birthdaySearch.toLowerCase()) ||
      p.categoryLabel.toLowerCase().includes(birthdaySearch.toLowerCase())
    );
  }, [sortedBirthdays, birthdaySearch]);

  const getDayHolidayName = (dateKey: string) => {
    const planData = yearlyPlan[dateKey];
    if (planData && planData.customHolidayName !== undefined && planData.customHolidayName !== null) {
      return planData.customHolidayName || null;
    }
    const year = parseInt(dateKey.split('-')[0], 10);
    const calculatedHolidays = getHolidays(year);
    return calculatedHolidays[dateKey] || null;
  };

  const mergedData = useMemo(() => {
    const data: Record<string, any> = {};
    const startDate = new Date('2026-06-01');
    const endDate = new Date('2027-07-31');
    
    let current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const dateStr = current.toLocaleDateString('de-DE');
      
      const planData = yearlyPlan[dateKey] || {};
      const session = trainingSessions.find(s => s.date === dateStr);
      const summerEntry = summerPrep.find(s => s.date === dateKey);
      const testMatch = testMatches.find(m => m.date === dateKey);
      const compMatch = competitiveMatches.find(m => m.date === dateKey);

      // Phases
      let phase: 'summer' | 'winter' | 'season' | 'break' = 'season';
      const summerS = new Date('2026-07-06');
      const summerE = new Date('2026-08-15');
      const breakS = new Date('2026-12-15');
      const breakE = new Date('2027-01-15');
      const winterS = new Date('2027-01-16');
      const winterE = new Date('2027-03-15');

      if (current >= summerS && current <= summerE) phase = 'summer';
      else if (current >= breakS && current <= breakE) phase = 'break';
      else if (current >= winterS && current <= winterE) phase = 'winter';

      data[dateKey] = {
        ...planData,
        type: planData.type || (testMatch ? 'Testspiel' : (compMatch ? 'Pflichtspiel' : (phase === 'break' ? 'Frei' : (session ? 'Training' : 'Frei')))),
        activity: planData.activity || (testMatch ? `Testspiel vs ${testMatch.opponent}` : (compMatch ? `Pflichtspiel vs ${compMatch.opponent}` : (phase === 'break' ? 'WINTERPAUSE' : (session?.sessionFocus || session?.weeklyFocus || '')))),
        time: planData.time || testMatch?.kickOff || compMatch?.kickOff || '19:00',
        location: planData.location || testMatch?.location || compMatch?.location || '',
        opponent: planData.opponent || testMatch?.opponent || compMatch?.opponent || '',
        treffpunkt: planData.treffpunkt || testMatch?.meetingTime || compMatch?.meetingTime || '',
        ergebnis: planData.ergebnis || testMatch?.result || compMatch?.result || '',
        phase: planData.phase || phase,
        ...(summerEntry ? {
          kw: summerEntry.kw,
          te: summerEntry.te,
          type: summerEntry.type || planData.type,
          activity: summerEntry.content || summerEntry.inhalt || planData.activity,
          time: summerEntry.time || planData.time,
          location: summerEntry.location || planData.location,
          opponent: summerEntry.opponent || planData.opponent,
          status: summerEntry.status || planData.status,
          notes: summerEntry.notes || planData.notes,
          treffpunkt: summerEntry.treffpunkt || planData.treffpunkt,
          ergebnis: summerEntry.ergebnis || planData.ergebnis
        } : {})
      };

      current.setDate(current.getDate() + 1);
    }
    return data;
  }, [yearlyPlan, trainingSessions, summerPrep, testMatches, competitiveMatches]);
  const onlyPlayers = useMemo(() => {
    return players.filter(p => p.category !== 'coach' && p.category !== 'staff' && p.category !== 'medical');
  }, [players]);

  const [listSearch, setListSearch] = useState('');
  const [listGroupBy, setListGroupBy] = useState<'month' | 'phase'>('month');
  const [selectedListDate, setSelectedListDate] = useState<string | null>('2026-07-06');

  const [listPhaseFilter, setListPhaseFilter] = useState<'all' | 'summer' | 'season' | 'winter' | 'break'>('all');

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthName = currentMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const changeMonth = (offset: number) => {
    const next = new Date(currentMonth);
    next.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(next);
  };

  const changeWeek = (offset: number) => {
    const next = new Date(currentMonth);
    next.setDate(currentMonth.getDate() + (offset * 7));
    setCurrentMonth(next);
  };

  const typeColors: Record<string, string> = {
    'Training': 'bg-blue-600 text-white border-blue-700',
    'Spiel': 'bg-red-600 text-white border-red-700',
    'Frei': 'bg-green-600 text-white border-green-700',
    'Event': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Pflichtspiel': 'bg-red-700 text-white border-red-800',
    'Testspiel': 'bg-red-500 text-white border-red-600',
    'Turnier': 'bg-purple-50 text-purple-700 border-purple-200',
    'Meeting': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const phaseColors: Record<string, string> = {
    'summer': 'border-l-4 border-orange-500 bg-orange-50/30',
    'winter': 'border-l-4 border-blue-500 bg-blue-50/30',
    'break': 'border-l-4 border-gray-500 bg-gray-100/50',
    'season': 'border-l-4 border-gray-300',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    'Training': <Dribbble size={10} />,
    'Spiel': <Target size={10} />,
    'Pflichtspiel': <Shield size={10} />,
    'Testspiel': <Flag size={10} />,
    'Turnier': <Star size={10} />,
    'Meeting': <Users size={10} />,
    'Frei': <MapPin size={10} />,
    'Event': <Landmark size={10} />
  };

  const handleDragStart = (e: React.DragEvent, dateKey: string) => {
    e.dataTransfer.setData('text/plain', dateKey);
  };

  const handleDrop = (e: React.DragEvent, targetDateKey: string) => {
    e.preventDefault();
    const sourceDateKey = e.dataTransfer.getData('text/plain');
    if (sourceDateKey && sourceDateKey !== targetDateKey) {
      const sourceData = yearlyPlan[sourceDateKey];
      if (sourceData) {
        // Move event
        handleUpdateDayPlan(targetDateKey, 'type', sourceData.type || 'Training');
        handleUpdateDayPlan(targetDateKey, 'time', sourceData.time || '');
        handleUpdateDayPlan(targetDateKey, 'content', sourceData.content || '');
        // Clear source
        handleUpdateDayPlan(sourceDateKey, 'type', 'Frei');
        handleUpdateDayPlan(sourceDateKey, 'time', '');
        handleUpdateDayPlan(sourceDateKey, 'content', '');
      }
    }
  };

  const renderFullYearCalendar = () => {
    const years = [currentMonth.getFullYear()];
    // If the season spans two years, show both or a range. Traditionally 26/27.
    // Let's show the full season year range: July 2026 to June 2027
    const startMonth = 6; // July (0-indexed is June, so 6 is July)
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const displayMonth = new Date(currentMonth.getFullYear(), startMonth + i, 1);
      const daysInM = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0).getDate();
      const firstDay = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), 1).getDay();
      const offset = firstDay === 0 ? 6 : firstDay - 1;
      
      const dayCells = [];
      for (let j = 0; j < offset; j++) {
        dayCells.push(<div key={`empty-${i}-${j}`} className="h-6 w-full bg-gray-50/30" />);
      }

      for (let d = 1; d <= daysInM; d++) {
        const dateKey = `${displayMonth.getFullYear()}-${String(displayMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = mergedData[dateKey];
        const holidayName = getDayHolidayName(dateKey);
        const isToday = dateKey === new Date().toISOString().split('T')[0];
        const dObj = new Date(displayMonth.getFullYear(), displayMonth.getMonth(), d);
        const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6;

        let cellBgClass = 'bg-white';
        let cellTextClass = 'text-black';
        const isCustomType = dayData && dayData.type;

        if (isToday) {
          cellBgClass = 'bg-[#C00000] text-white ring-1 ring-inset ring-black/20';
          cellTextClass = 'text-white';
        } else if (isCustomType && dayData.type === 'Frei') {
          cellBgClass = 'bg-green-50 text-green-900 border-green-100/50';
          cellTextClass = 'text-green-800';
        } else if (isCustomType && (dayData.type === 'Spiel' || dayData.type === 'Pflichtspiel' || dayData.type === 'Testspiel')) {
          cellBgClass = 'bg-red-50 text-red-900 border-red-100/50';
          cellTextClass = 'text-red-800';
        } else if (isCustomType && dayData.type === 'Training') {
          cellBgClass = 'bg-blue-50/70 text-blue-900 border-blue-100/50';
          cellTextClass = 'text-blue-800';
        } else if (isCustomType && dayData.type === 'Meeting') {
          cellBgClass = 'bg-emerald-50 text-emerald-900 border-emerald-100/50';
          cellTextClass = 'text-emerald-800';
        } else if (isCustomType && dayData.type === 'Event') {
          cellBgClass = 'bg-yellow-50/50 text-yellow-900 border-yellow-100/50';
          cellTextClass = 'text-yellow-800';
        } else if (holidayName) {
          cellBgClass = 'bg-amber-50 text-amber-950';
          cellTextClass = 'text-orange-600 font-bold';
        } else if (isWeekend) {
          cellBgClass = 'bg-gray-50';
        }

        const dayBirthdays = getBirthdaysForDate(dateKey);

        dayCells.push(
          <div 
            key={d} 
            onClick={() => setSelectedEventDate(dateKey)}
            className={`h-8 border border-black/5 flex flex-col items-center justify-center relative cursor-pointer hover:bg-black hover:text-white transition-all group
              ${cellBgClass}`}
          >
             <span className={`text-[9px] font-black ${cellTextClass}`}>{d}</span>
             {holidayName && (
               <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-orange-500 rounded-full" title={holidayName} />
             )}
             {dayBirthdays.length > 0 && (
               <div className="absolute top-0 left-0 text-[6px]" title={`Geburtstag: ${dayBirthdays.map(p => p.name).join(', ')}`}>
                 🎂
               </div>
             )}
             {dayData && dayData.type !== 'Frei' && (
               <div className="flex gap-0.5 mt-0.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${typeColors[dayData.type]?.split(' ')[0] || 'bg-gray-400'}`} />
               </div>
             )}
             {/* Tooltip for entry */}
             {(dayData?.activity || holidayName || dayBirthdays.length > 0) && (
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-black text-white text-[7px] p-1 whitespace-nowrap rounded font-bold uppercase pointer-events-none">
                 {holidayName ? holidayName : ''} 
                 {dayBirthdays.length > 0 ? (holidayName ? ' | ' : '') + '🎂 ' + dayBirthdays.map(p => `${p.name} (${p.age || '?'})`).join(', ') : ''}
                 {dayData?.activity ? ((holidayName || dayBirthdays.length > 0) ? ' | ' : '') + dayData.activity : ''}
               </div>
             )}
          </div>
        );
      }

      months.push(
        <div key={i} className="border-2 border-black flex flex-col bg-white overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white text-[9px] font-black uppercase tracking-widest text-center py-1">
            {displayMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </div>
          <div className="grid grid-cols-7 text-[7px] font-black uppercase text-center border-b border-black/10 py-1 opacity-40">
            {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, idx) => <div key={idx}>{day}</div>)}
          </div>
          <div className="flex-1 grid grid-cols-7 auto-rows-fr">
            {dayCells}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto custom-scrollbar p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
          {months}
        </div>
      </div>
    );
  };

  const renderMonthCalendar = () => {
    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square bg-gray-50/50 border border-black/5"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = mergedData[dateKey] || { type: 'Frei', content: '', time: '19:00' };
      const holidayName = getDayHolidayName(dateKey);
      
      const dayBirthdays = getBirthdaysForDate(dateKey);
      
      days.push(
        <div 
          key={d} 
          className={`aspect-square bg-white border border-black/10 p-2 flex flex-col gap-1 group hover:border-black transition-all overflow-hidden cursor-pointer ${holidayName ? 'bg-amber-50/20' : ''} ${dayBirthdays.length > 0 ? 'bg-pink-50/10 border-pink-100/50' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, dateKey)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, dateKey)}
          onClick={() => setSelectedEventDate(dateKey)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-[10px] font-black ${d === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() ? 'bg-[#C00000] text-white w-5 h-5 flex items-center justify-center' : ''}`}>
              {d}
            </span>
            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-1 px-1 py-0.5 rounded-sm border ${typeColors[dayData.type] || 'bg-gray-100 text-gray-500'}`}>
                {typeIcons[dayData.type] || <Dribbble size={8} />}
                <span className="text-[7px] font-black uppercase">{dayData.type?.substring(0, 2)}</span>
              </div>
              {holidayName && (
                <span className="text-[6px] font-black uppercase text-orange-600 bg-orange-50 px-1 rounded border border-orange-100 max-w-[60px] truncate" title={holidayName}>
                  {holidayName}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-1 mt-1">
            {dayData.time && <div className="text-[8px] font-black uppercase opacity-60 flex items-center gap-1"><Clock size={8} /> {dayData.time}</div>}
            {dayData.content && <div className="text-[9px] font-bold italic leading-tight line-clamp-2">{dayData.content}</div>}
            {dayBirthdays.length > 0 && (
              <div className="mt-auto space-y-0.5 pt-1 border-t border-dashed border-pink-200">
                {dayBirthdays.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[8px] bg-pink-50 text-pink-700 border border-pink-100 rounded px-1 py-0.5 truncate font-bold" title={`${p.name} (${p.categoryLabel})`}>
                    🎂 {p.name} ({p.age !== undefined ? p.age : '?'})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col watermark-bg">
        <div className="grid grid-cols-7 bg-black text-white text-[10px] font-black uppercase tracking-widest text-center py-3 border-b-2 border-black">
          {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 overflow-y-auto custom-scrollbar">
          {days}
        </div>
      </div>
    );
  };

  const renderWeekCalendar = () => {
    // Calculate start of week (Monday)
    const startOfWeek = new Date(currentMonth);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      const dayData = mergedData[dateKey] || { type: 'Frei', content: '', time: '19:00' };
      const holidayName = getDayHolidayName(dateKey);

      const dayBirthdays = getBirthdaysForDate(dateKey);

      days.push(
        <div 
          key={i} 
          className={`flex-1 bg-white border-r border-black/10 p-4 flex flex-col gap-2 hover:bg-gray-50 transition-colors ${holidayName ? 'bg-amber-50/10' : ''} ${dayBirthdays.length > 0 ? 'bg-pink-50/5' : ''}`}
          draggable
          onDragStart={(e) => handleDragStart(e, dateKey)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, dateKey)}
          onClick={() => setSelectedEventDate(dateKey)}
        >
          <div className="flex justify-between items-start border-b border-black/10 pb-2">
            <div>
              <div className="text-[10px] font-black uppercase opacity-40">{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][i]}</div>
              <div className={`text-lg font-black ${currentDate.getDate() === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'text-[#C00000]' : ''}`}>
                {currentDate.getDate()}.{currentDate.getMonth() + 1}.
              </div>
            </div>
            {holidayName && (
              <span className="text-[7px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 self-start max-w-[80px] truncate" title={holidayName}>
                {holidayName}
              </span>
            )}
          </div>
          <div className={`flex-1 p-3 rounded-md border ${typeColors[dayData.type] || 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {typeIcons[dayData.type] || <Dribbble size={12} />}
              <span className="text-[10px] font-black uppercase">{dayData.type}</span>
            </div>
            {dayData.time && <div className="text-xs font-bold flex items-center gap-1 mb-2"><Clock size={10} /> {dayData.time}</div>}
            {dayData.content && <div className="text-xs italic">{dayData.content}</div>}
            {dayBirthdays.length > 0 && (
              <div className="mt-3 space-y-1">
                <div className="text-[8px] font-black uppercase text-pink-500 tracking-wider flex items-center gap-1">🎂 Geburtstage:</div>
                {dayBirthdays.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[9px] bg-pink-50 border border-pink-100 text-pink-700 font-bold p-1 rounded">
                    <span>🎂</span>
                    <span className="truncate">{p.name} ({p.age !== undefined ? p.age : '?'})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col watermark-bg">
        <div className="flex-1 flex overflow-x-auto custom-scrollbar">
          {days}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const groupedData: Record<string, any[]> = {};
    
    Object.entries(mergedData).forEach(([dateKey, dayData]) => {
      const date = new Date(dateKey);
      
      // Filtering
      if (listSearch && !dateKey.includes(listSearch) && !dayData.activity?.toLowerCase().includes(listSearch.toLowerCase()) && !dayData.type?.toLowerCase().includes(listSearch.toLowerCase())) {
        return;
      }

      // Main view filter: only show specific types unless a specific phase is selected
      if (listPhaseFilter === 'all') {
        const allowedTypes = ['Pflichtspiel', 'Testspiel', 'Training', 'Event'];
        if (!allowedTypes.includes(dayData.type)) return;
      } else if (dayData.phase !== listPhaseFilter) {
        return;
      }

      let groupKey = '';
      if (listGroupBy === 'month') {
        groupKey = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      } else {
        const phase = dayData.phase || 'season';
        groupKey = phase === 'summer' ? 'Sommerplan (06.07. - 15.08.)' : 
                   phase === 'winter' ? 'Wintervorbereitung (16.01. - 15.03.)' : 
                   phase === 'break' ? 'Winterpause (15.12. - 15.01.)' : 'Saison';
      }

      if (!groupedData[groupKey]) groupedData[groupKey] = [];
      groupedData[groupKey].push({ dateKey, ...dayData });
    });

    return (
      <div className="h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden watermark-bg">
        <div className="p-4 border-b-2 border-black bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex border-2 border-black">
              <button 
                onClick={() => setListPhaseFilter('all')}
                className={`px-3 py-1 text-[9px] font-black uppercase transition-all ${listPhaseFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Gesamtplan
              </button>
              <button 
                onClick={() => setListPhaseFilter('summer')}
                className={`px-3 py-1 text-[9px] font-black uppercase border-l-2 border-black transition-all ${listPhaseFilter === 'summer' ? 'bg-orange-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Sommerplan
              </button>
              <button 
                onClick={() => setListPhaseFilter('season')}
                className={`px-3 py-1 text-[9px] font-black uppercase border-l-2 border-black transition-all ${listPhaseFilter === 'season' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Saison
              </button>
              <button 
                onClick={() => setListPhaseFilter('winter')}
                className={`px-3 py-1 text-[9px] font-black uppercase border-l-2 border-black transition-all ${listPhaseFilter === 'winter' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Wintervorbereitung
              </button>
              <button 
                onClick={() => setListPhaseFilter('break')}
                className={`px-3 py-1 text-[9px] font-black uppercase border-l-2 border-black transition-all ${listPhaseFilter === 'break' ? 'bg-gray-500 text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Winterpause
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Suchen..."
              className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black text-xs font-bold uppercase focus:outline-none"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase opacity-40">Gruppieren nach:</span>
            <div className="flex border-2 border-black">
              <button 
                onClick={() => setListGroupBy('month')}
                className={`px-3 py-1 text-[9px] font-black uppercase transition-all ${listGroupBy === 'month' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Monat
              </button>
              <button 
                onClick={() => setListGroupBy('phase')}
                className={`px-3 py-1 text-[9px] font-black uppercase border-l-2 border-black transition-all ${listGroupBy === 'phase' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                Phase
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <div className="space-y-8 pb-8">
            {Object.entries(groupedData).map(([group, items]) => (
              <div key={group} className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] bg-black text-white px-3 py-1 inline-block mb-2">{group}</h3>
                <div className="border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <table className="w-full border-collapse text-[10px] font-bold">
                    <thead className="bg-gray-100 border-b-2 border-black sticky top-0 z-10">
                      {listPhaseFilter === 'summer' ? (
                        <tr>
                          <th className="p-2 border-r border-black text-left w-8">KW</th>
                          <th className="p-2 border-r border-black text-left w-8">TE</th>
                          <th className="p-2 border-r border-black text-left w-24">Datum</th>
                          <th className="p-2 border-r border-black text-left w-12">Tag</th>
                          <th className="p-2 border-r border-black text-left w-16">Zeit</th>
                          <th className="p-2 border-r border-black text-left w-16">Treff</th>
                          <th className="p-2 border-r border-black text-left w-24">Typ</th>
                          <th className="p-2 border-r border-black text-left">Inhalt / Aktivität</th>
                          <th className="p-2 border-r border-black text-left w-24">Ort</th>
                          <th className="p-2 border-r border-black text-left w-32">Gegner</th>
                          <th className="p-2 border-r border-black text-left w-20">Ergebnis</th>
                          <th className="p-2 border-r border-black text-left w-24">Status</th>
                          <th className="p-2 text-left w-32">Notizen</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="p-2 border-r border-black text-left w-24">Datum</th>
                          <th className="p-2 border-r border-black text-left w-16">Tag</th>
                          <th className="p-2 border-r border-black text-left w-20">Typ</th>
                          <th className="p-2 border-r border-black text-left w-16">Zeit</th>
                          <th className="p-2 border-r border-black text-left">Inhalt / Aktivität</th>
                          <th className="p-2 border-r border-black text-left w-24">Ort</th>
                          <th className="p-2 border-r border-black text-center w-12">ATH</th>
                          <th className="p-2 border-r border-black text-center w-12">VOR</th>
                          <th className="p-2 border-r border-black text-center w-12">IND</th>
                          <th className="p-2 border-r border-black text-center w-12">VID</th>
                          <th className="p-2 text-center w-12">TR</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const date = new Date(item.dateKey);
                        const isSelected = selectedListDate === item.dateKey;
                        const weekday = date.toLocaleDateString('de-DE', { weekday: 'short' });
                        const dayBirthdays = getBirthdaysForDate(item.dateKey);
                        const holidayName = getDayHolidayName(item.dateKey);
                        
                        if (listPhaseFilter === 'summer') {
                          return (
                            <tr 
                              key={item.dateKey} 
                              className={`border-b border-black/10 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''} ${phaseColors[item.phase] || ''}`}
                              onClick={() => setSelectedListDate(item.dateKey)}
                            >
                              <td className="p-2 border-r border-black/10 text-center opacity-40">{item.kw || '-'}</td>
                              <td className="p-2 border-r border-black/10 text-center opacity-40">{item.te || '-'}</td>
                              <td className="p-2 border-r border-black/10 font-black">{date.toLocaleDateString('de-DE')}</td>
                              <td className="p-2 border-r border-black/10 uppercase opacity-60">{weekday}</td>
                              <td className="p-2 border-r border-black/10">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent font-black focus:outline-none"
                                  value={item.time || ''}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'time', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent opacity-60 focus:outline-none"
                                  value={item.treffpunkt || ''}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'treffpunkt', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <select 
                                  className={`px-1.5 py-0.5 rounded-sm border text-[8px] font-black uppercase inline-flex items-center gap-1 appearance-none cursor-pointer ${typeColors[item.type] || 'bg-gray-100'}`}
                                  value={item.type}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'type', e.target.value)}
                                  disabled={!isEditing}
                                >
                                  {Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <div className="flex flex-col">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent font-black uppercase text-[11px] focus:outline-none"
                                    value={item.activity || ''}
                                    onChange={(e) => handleUpdateDayPlan(item.dateKey, 'activity', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="-"
                                  />
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent text-[9px] opacity-60 italic focus:outline-none"
                                    value={item.content || ''}
                                    onChange={(e) => handleUpdateDayPlan(item.dateKey, 'content', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Notizen..."
                                  />
                                  {(holidayName || dayBirthdays.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {holidayName && (
                                        <span className="text-[7px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                          🎉 {holidayName}
                                        </span>
                                      )}
                                      {dayBirthdays.map((p, idx) => (
                                        <span key={idx} className="text-[7px] font-black uppercase text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded flex items-center gap-0.5" title={p.categoryLabel}>
                                          🎂 {p.name} ({p.age !== undefined ? p.age : '?'})
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent uppercase opacity-60 focus:outline-none"
                                  value={item.location || ''}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'location', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent uppercase opacity-60 focus:outline-none"
                                  value={item.opponent || ''}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'opponent', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent font-black text-center focus:outline-none"
                                  value={item.ergebnis || ''}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'ergebnis', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="p-2 border-r border-black/10">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent uppercase opacity-60 focus:outline-none"
                                  value={item.status || 'Geplant'}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'status', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                              <td className="p-2">
                                <input 
                                  type="text"
                                  className="w-full bg-transparent text-[9px] opacity-60 focus:outline-none"
                                  value={item.notes || ''}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'notes', e.target.value)}
                                  disabled={!isEditing}
                                />
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr 
                            key={item.dateKey} 
                            className={`border-b border-black/10 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : ''} ${phaseColors[item.phase] || ''}`}
                            onClick={() => setSelectedListDate(item.dateKey)}
                          >
                            <td className="p-2 border-r border-black/10 font-black">{date.toLocaleDateString('de-DE')}</td>
                            <td className="p-2 border-r border-black/10 uppercase opacity-60">{weekday}</td>
                            <td className="p-2 border-r border-black/10">
                              <select 
                                className={`px-1.5 py-0.5 rounded-sm border text-[8px] font-black uppercase inline-flex items-center gap-1 appearance-none cursor-pointer ${typeColors[item.type] || 'bg-gray-100'}`}
                                value={item.type}
                                onChange={(e) => handleUpdateDayPlan(item.dateKey, 'type', e.target.value)}
                                disabled={!isEditing}
                              >
                                {Object.keys(typeColors).map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </td>
                            <td className="p-2 border-r border-black/10">
                              <input 
                                type="text"
                                className="w-full bg-transparent font-black focus:outline-none"
                                value={item.time || ''}
                                onChange={(e) => handleUpdateDayPlan(item.dateKey, 'time', e.target.value)}
                                disabled={!isEditing}
                              />
                            </td>
                            <td className="p-2 border-r border-black/10">
                              <div className="flex items-center justify-between group/row">
                                <div className="flex flex-col flex-1">
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent font-black uppercase text-[11px] focus:outline-none"
                                    value={item.activity || ''}
                                    onChange={(e) => handleUpdateDayPlan(item.dateKey, 'activity', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="-"
                                  />
                                  <input 
                                    type="text"
                                    className="w-full bg-transparent text-[9px] opacity-60 italic focus:outline-none"
                                    value={item.content || ''}
                                    onChange={(e) => handleUpdateDayPlan(item.dateKey, 'content', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Notizen..."
                                  />
                                  {(holidayName || dayBirthdays.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {holidayName && (
                                        <span className="text-[7px] font-black uppercase text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                          🎉 {holidayName}
                                        </span>
                                      )}
                                      {dayBirthdays.map((p, idx) => (
                                        <span key={idx} className="text-[7px] font-black uppercase text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded flex items-center gap-0.5" title={p.categoryLabel}>
                                          🎂 {p.name} ({p.age !== undefined ? p.age : '?'})
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventDate(item.dateKey);
                                  }}
                                  className="opacity-0 group-hover/row:opacity-100 p-1 hover:bg-black hover:text-white transition-all"
                                >
                                  <Edit2 size={10} />
                                </button>
                              </div>
                            </td>
                            <td className="p-2 border-r border-black/10">
                              <input 
                                type="text"
                                className="w-full bg-transparent uppercase opacity-60 focus:outline-none"
                                value={item.location || ''}
                                onChange={(e) => handleUpdateDayPlan(item.dateKey, 'location', e.target.value)}
                                disabled={!isEditing}
                                placeholder="-"
                              />
                            </td>
                            <td 
                              className={`p-2 border-r border-black/10 text-center font-black cursor-pointer hover:bg-black/5 ${item.athletik?.start ? 'text-green-600' : 'text-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing) return;
                                handleUpdateDayPlan(item.dateKey, 'athletik.start', item.athletik?.start ? '' : '09:00');
                              }}
                            >
                              {isEditing && item.athletik?.start ? (
                                <input 
                                  type="text"
                                  className="w-full bg-transparent text-center text-[8px] font-black focus:outline-none text-green-600"
                                  value={item.athletik.start}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'athletik.start', e.target.value)}
                                />
                              ) : (
                                item.athletik?.start ? '✓' : '-'
                              )}
                            </td>
                            <td 
                              className={`p-2 border-r border-black/10 text-center font-black cursor-pointer hover:bg-black/5 ${item.vormittag?.start ? 'text-green-600' : 'text-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing) return;
                                handleUpdateDayPlan(item.dateKey, 'vormittag.start', item.vormittag?.start ? '' : '10:30');
                              }}
                            >
                              {isEditing && item.vormittag?.start ? (
                                <input 
                                  type="text"
                                  className="w-full bg-transparent text-center text-[8px] font-black focus:outline-none text-green-600"
                                  value={item.vormittag.start}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'vormittag.start', e.target.value)}
                                />
                              ) : (
                                item.vormittag?.start ? '✓' : '-'
                              )}
                            </td>
                            <td 
                              className={`p-2 border-r border-black/10 text-center font-black cursor-pointer hover:bg-black/5 ${item.individual?.start ? 'text-green-600' : 'text-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing) return;
                                handleUpdateDayPlan(item.dateKey, 'individual.start', item.individual?.start ? '' : '14:00');
                              }}
                            >
                              {isEditing && item.individual?.start ? (
                                <input 
                                  type="text"
                                  className="w-full bg-transparent text-center text-[8px] font-black focus:outline-none text-green-600"
                                  value={item.individual.start}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'individual.start', e.target.value)}
                                />
                              ) : (
                                item.individual?.start ? '✓' : '-'
                              )}
                            </td>
                            <td 
                              className={`p-2 border-r border-black/10 text-center font-black cursor-pointer hover:bg-black/5 ${item.video?.start ? 'text-green-600' : 'text-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing) return;
                                handleUpdateDayPlan(item.dateKey, 'video.start', item.video?.start ? '' : '17:00');
                              }}
                            >
                              {isEditing && item.video?.start ? (
                                <input 
                                  type="text"
                                  className="w-full bg-transparent text-center text-[8px] font-black focus:outline-none text-green-600"
                                  value={item.video.start}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'video.start', e.target.value)}
                                />
                              ) : (
                                item.video?.start ? '✓' : '-'
                              )}
                            </td>
                            <td 
                              className={`p-2 text-center font-black cursor-pointer hover:bg-black/5 ${item.training?.start ? 'text-green-600' : 'text-gray-300'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isEditing) return;
                                handleUpdateDayPlan(item.dateKey, 'training.start', item.training?.start ? '' : '19:00');
                              }}
                            >
                              {isEditing && item.training?.start ? (
                                <input 
                                  type="text"
                                  className="w-full bg-transparent text-center text-[8px] font-black focus:outline-none text-green-600"
                                  value={item.training.start}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleUpdateDayPlan(item.dateKey, 'training.start', e.target.value)}
                                />
                              ) : (
                                item.training?.start ? '✓' : '-'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTimeline = () => {
    // Generate months for timeline
    const months = [];
    const startYear = currentMonth.getFullYear();
    
    let numMonths = 12;
    if (timelineZoom === 'quarter') numMonths = 3;
    if (timelineZoom === 'month') numMonths = 1;

    for (let i = 0; i < numMonths; i++) {
      const mDate = new Date(startYear, currentMonth.getMonth() + i, 1);
      const mDays = new Date(mDate.getFullYear(), mDate.getMonth() + 1, 0).getDate();
      
      const days = [];
      for (let d = 1; d <= mDays; d++) {
        const dateKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = yearlyPlan[dateKey];
        
        days.push(
          <div 
            key={d} 
            className="flex-shrink-0 w-12 flex flex-col border-r border-black/10 group cursor-pointer"
            draggable
            onDragStart={(e) => handleDragStart(e, dateKey)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, dateKey)}
            onClick={() => setSelectedEventDate(dateKey)}
          >
            <div className={`h-6 flex items-center justify-center text-[8px] font-black border-b border-black/10 ${mDate.getDay() === 0 || mDate.getDay() === 6 ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`}>
              {d}.
            </div>
            <div className="flex-1 p-1 relative min-h-[60px]">
              {dayData && dayData.type !== 'Frei' && (
                <div className={`absolute inset-1 rounded-sm border flex flex-col items-center justify-center p-0.5 ${typeColors[dayData.type] || 'bg-gray-100'}`}>
                  {typeIcons[dayData.type]}
                </div>
              )}
            </div>
          </div>
        );
      }

      months.push(
        <div key={i} className="flex flex-col border-r-2 border-black">
          <div className="bg-black text-white text-[10px] font-black uppercase tracking-widest py-1 px-2 sticky left-0">
            {mDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
          </div>
          <div className="flex flex-1">
            {days}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden watermark-bg">
        <div className="flex-1 flex overflow-x-auto custom-scrollbar">
          {months}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b-2 border-black bg-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#C00000]" />
            <h2 className="text-sm font-black uppercase tracking-tighter">Jahresplan</h2>
          </div>
          
          <div className="flex bg-gray-100 border-2 border-black p-0.5">
            <button 
              onClick={() => setViewMode('calendar')} 
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
            >
              <CalendarDays size={10} /> Kalender
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${viewMode === 'list' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
            >
              <AlignLeft size={10} /> Liste
            </button>
            <button 
              onClick={() => setViewMode('timeline')} 
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${viewMode === 'timeline' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}
            >
              <List size={10} /> Timeline
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {viewMode === 'calendar' && (
            <div className="flex bg-gray-100 border-2 border-black p-0.5 mr-2">
              <button 
                onClick={() => setCalendarMode('year')} 
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${calendarMode === 'year' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                Jahr
              </button>
              <button 
                onClick={() => setCalendarMode('month')} 
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${calendarMode === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                Monat
              </button>
              <button 
                onClick={() => setCalendarMode('week')} 
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${calendarMode === 'week' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                Woche
              </button>
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="flex bg-gray-100 border-2 border-black p-0.5 mr-2">
              <button 
                onClick={() => setTimelineZoom('year')} 
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${timelineZoom === 'year' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                Jahr
              </button>
              <button 
                onClick={() => setTimelineZoom('quarter')} 
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${timelineZoom === 'quarter' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                Quartal
              </button>
              <button 
                onClick={() => setTimelineZoom('month')} 
                className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${timelineZoom === 'month' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                Monat
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest mr-2">
              {viewMode === 'calendar' && calendarMode === 'week' 
                ? `KW ${Math.ceil((currentMonth.getDate() - currentMonth.getDay() + 1) / 7)}` 
                : monthName}
            </span>
            <div className="flex bg-gray-100 border-2 border-black p-0.5">
              <button onClick={() => viewMode === 'calendar' && calendarMode === 'week' ? changeWeek(-1) : changeMonth(-1)} className="p-1 hover:bg-black hover:text-white transition-all"><ChevronLeft size={12} /></button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-2 text-[8px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Heute</button>
              <button onClick={() => viewMode === 'calendar' && calendarMode === 'week' ? changeWeek(1) : changeMonth(1)} className="p-1 hover:bg-black hover:text-white transition-all"><ChevronRight size={12} /></button>
            </div>
            {isEditing && (
              <button 
                onClick={() => setShowGenModal(true)}
                className="ml-2 bg-[#C00000] text-white px-3 py-1 text-[8px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                Saison generieren
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {viewMode === 'calendar' && calendarMode === 'year' && renderFullYearCalendar()}
          {viewMode === 'calendar' && calendarMode === 'month' && renderMonthCalendar()}
          {viewMode === 'calendar' && calendarMode === 'week' && renderWeekCalendar()}
          {viewMode === 'timeline' && renderTimeline()}
          {viewMode === 'list' && renderListView()}
        </div>

        {/* Sidebar (Right Side): Player Status or Birthdays */}
        <div className="w-80 bg-white border-l-2 border-black flex flex-col shrink-0 watermark-bg">
          {/* Tab Switcher */}
          <div className="flex border-b-2 border-black">
            <button
              onClick={() => setSidebarTab('status')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 border-r border-black
                ${sidebarTab === 'status' ? 'bg-black text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
            >
              <Users size={12} />
              Kader & Status
            </button>
            <button
              onClick={() => setSidebarTab('birthdays')}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5
                ${sidebarTab === 'birthdays' ? 'bg-[#C00000] text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
            >
              <Gift size={12} />
              Geburtstage
            </button>
          </div>

          {sidebarTab === 'status' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b-2 border-black bg-gray-50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-[#C00000]" /> Kader & Status
                  </h3>
                  <span className="text-[10px] font-black">{onlyPlayers.length}</span>
                </div>
                {selectedListDate && (
                  <div className="text-[9px] font-bold bg-black text-white px-2 py-1 rounded-sm">
                    {new Date(selectedListDate).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-black z-10">
                    <tr>
                      <th className="text-[8px] font-black uppercase p-2 text-left border-r border-black/10">Spieler</th>
                      <th className="text-[8px] font-black uppercase p-2 text-center border-r border-black/10">Pos</th>
                      <th className="text-[8px] font-black uppercase p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlyPlayers.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || '')).map((player: any) => {
                      // Find training session for selected date
                      let status = '-';
                      if (selectedListDate) {
                        const [y, m, d] = selectedListDate.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const selectedDateStr = dateObj.toLocaleDateString('de-DE');
                        const session = trainingSessions.find(s => s.date === selectedDateStr);
                        const playerInSession = session?.players?.find((p: any) => p.name === player.lastName);
                        status = playerInSession?.status || '-';
                      }

                      const getStatusStyle = (s: string) => {
                        switch(s) {
                          case '1': return 'bg-green-100 text-green-800 border-green-200';
                          case 'A': return 'bg-blue-100 text-blue-800 border-blue-200';
                          case 'B': return 'bg-red-100 text-red-800 border-red-200';
                          case 'K': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                          default: return 'bg-gray-50 text-gray-400 border-gray-200';
                        }
                      };

                      const handleStatusToggle = () => {
                        if (!isEditing || !selectedListDate) return;
                        
                        const statuses = ['-', '1', 'A', 'B', 'K'];
                        const currentIndex = statuses.indexOf(status);
                        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                        
                        const [y, m, d] = selectedListDate.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const selectedDateStr = dateObj.toLocaleDateString('de-DE');
                        
                        let session = trainingSessions.find(s => s.date === selectedDateStr);
                        
                        if (!session) {
                          // Create session if it doesn't exist
                          const newSession = {
                            id: `ts${Date.now()}`,
                            date: selectedDateStr,
                            weekday: new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(dateObj),
                            group: 'FC Auggen',
                            load: 'Mittel',
                            duration: '90 Min',
                            weeklyFocus: '',
                            sessionFocus: '',
                            trainer: 'Amin',
                            intensity: 'Mittel',
                            players: onlyPlayers.map(p => ({ 
                              name: p.lastName, 
                              position: p.position, 
                              status: p.id === player.id ? nextStatus : '-' 
                            })),
                            content: { warmup: '', main1: '', main2: '', closing: '' },
                            importantInfo: '',
                            remarks: ''
                          };
                          (window as any).saveTrainingSession?.(newSession);
                        } else {
                          // Update existing session
                          const updatedPlayers = [...(session.players || [])];
                          const playerIdx = updatedPlayers.findIndex(p => p.name === player.lastName);
                          
                          if (playerIdx > -1) {
                            updatedPlayers[playerIdx] = { ...updatedPlayers[playerIdx], status: nextStatus as any };
                          } else {
                            updatedPlayers.push({ name: player.lastName, position: player.position, status: nextStatus as any });
                          }
                          
                          (window as any).saveTrainingSession?.({ ...session, players: updatedPlayers });
                        }
                      };

                      return (
                        <tr key={player.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                          <td className="p-2 border-r border-black/10">
                            <div className="text-[10px] font-bold leading-tight">{player.lastName}</div>
                          </td>
                          <td className="p-2 text-center border-r border-black/10">
                            <span className="text-[8px] font-black uppercase px-1 py-0.5 bg-gray-100 rounded-sm">{player.position}</span>
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              onClick={handleStatusToggle}
                              disabled={!isEditing}
                              className={`text-[10px] font-black w-6 h-6 flex items-center justify-center mx-auto rounded-sm border transition-all ${getStatusStyle(status)} ${isEditing ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'}`}
                            >
                              {status}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t-2 border-black bg-gray-50 text-[8px] font-bold grid grid-cols-2 gap-2 shrink-0">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-100 border border-green-200"></div> 1: Training</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-100 border border-blue-200"></div> A: Aufbau</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-100 border border-red-200"></div> B: Verletzt</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-100 border border-yellow-200"></div> K: Kader 1</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b-2 border-black bg-gray-50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <Gift size={14} className="text-pink-600" /> Geburtstag-Liste
                  </h3>
                  <span className="text-[10px] font-black bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                    {filteredBirthdays.length}
                  </span>
                </div>
                {/* Search */}
                <div className="relative mt-1">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Suchen..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border-2 border-black text-[10px] font-black uppercase focus:outline-none"
                    value={birthdaySearch}
                    onChange={(e) => setBirthdaySearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 bg-gray-50">
                {filteredBirthdays.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs font-bold">
                    Keine Geburtstage gefunden.
                  </div>
                ) : (
                  filteredBirthdays.map((p) => {
                    // Check if birthday is today
                    const today = new Date();
                    const isToday = p.month === (today.getMonth() + 1) && p.day === today.getDate();
                    
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          const targetYear = currentMonth.getFullYear();
                          const targetDate = new Date(targetYear, p.month - 1, p.day);
                          setCurrentMonth(targetDate);
                          const dateKey = `${targetYear}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
                          setSelectedEventDate(dateKey);
                        }}
                        className={`p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer flex items-center justify-between
                          ${isToday ? 'bg-pink-100 border-pink-600' : 'bg-white hover:bg-gray-100'}`}
                      >
                        <div className="space-y-1 min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            {isToday && <span className="animate-bounce">🎂</span>}
                            <div className="text-[10px] font-black leading-tight text-gray-900 truncate">{p.name}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[7px] font-black uppercase tracking-wider px-1 py-0.5 bg-gray-100 text-gray-700 rounded border border-black/5 truncate max-w-[120px]" title={p.categoryLabel}>
                              {p.category === 'player' ? 'Spieler' : p.category === 'coach' ? 'Trainer' : p.category === 'staff' ? 'Funktionär' : p.category === 'medical' ? 'Medizin' : p.categoryLabel}
                            </span>
                            <span className="text-[8px] font-bold text-gray-500">
                              {p.formattedDate}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          {p.birthYear ? (
                            <span className="text-[9px] font-black text-pink-700 bg-pink-50 border border-pink-200 px-1.5 py-0.5 rounded">
                              wird {new Date().getFullYear() - p.birthYear}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="p-3 bg-white border-t-2 border-black flex justify-between items-center shrink-0">
        <div className="flex gap-4 flex-wrap">
          {Object.entries(typeColors).map(([type, colorClass]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 border ${colorClass} flex items-center justify-center`}>
                {typeIcons[type]}
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{type}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border bg-yellow-50 flex items-center justify-center relative">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-orange-600">Feiertage</span>
          </div>
        </div>
        <p className="text-[8px] font-bold uppercase opacity-40 italic">Drag & Drop zum Verschieben</p>
      </div>

      {/* Event Detail Modal */}
      {selectedEventDate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md flex flex-col watermark-bg">
            <div className="bg-black text-white p-3 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-sm">Event Details</h3>
              <button onClick={() => setSelectedEventDate(null)} className="hover:text-gray-300">
                <Plus size={16} className="rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Datum</label>
                  <div className="text-sm font-bold">{new Date(selectedEventDate).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Phase</label>
                  <select 
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={mergedData[selectedEventDate]?.phase || 'season'}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'phase', e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="summer">Sommervorbereitung</option>
                    <option value="season">Saison</option>
                    <option value="winter">Wintervorbereitung</option>
                    <option value="break">Pause</option>
                  </select>
                </div>
              </div>

              {/* Geburtstag-Anzeige im Modal */}
              {(() => {
                const dayBirthdays = getBirthdaysForDate(selectedEventDate);
                if (dayBirthdays.length === 0) return null;
                return (
                  <div className="bg-pink-50 border-2 border-pink-200 p-3 space-y-1 rounded-sm">
                    <div className="text-[9px] font-black uppercase text-pink-700 tracking-wider flex items-center gap-1.5">
                      <Gift size={12} className="text-pink-600 fill-pink-600" />
                      Geburtstage an diesem Tag!
                    </div>
                    <div className="space-y-1.5">
                      {dayBirthdays.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-pink-900">
                          <span className="flex items-center gap-1">
                            🎂 <strong className="text-pink-950">{p.name}</strong> ({p.categoryLabel})
                          </span>
                          {p.age !== undefined && (
                            <span className="bg-pink-100 text-pink-800 text-[9px] px-1.5 py-0.5 rounded font-black">
                              wird {p.age} Jahre alt!
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Typ</label>
                  <select 
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    value={mergedData[selectedEventDate]?.type || 'Training'}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'type', e.target.value)}
                    disabled={!isEditing}
                  >
                    {Object.keys(typeColors).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Haupt-Aktivität Zeit</label>
                  <input 
                    type="text"
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder={isEditing ? "19:00" : ""}
                    value={mergedData[selectedEventDate]?.time || ''}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'time', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Haupt-Aktivität</label>
                  <input 
                    type="text"
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder={isEditing ? "z.B. SPIEL" : ""}
                    value={mergedData[selectedEventDate]?.activity || ''}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'activity', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Ort</label>
                  <input 
                    type="text"
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder={isEditing ? "Ort" : ""}
                    value={mergedData[selectedEventDate]?.location || ''}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'location', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Treffpunkt</label>
                  <input 
                    type="text"
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder={isEditing ? "Treffpunkt" : ""}
                    value={mergedData[selectedEventDate]?.treffpunkt || ''}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'treffpunkt', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                {(mergedData[selectedEventDate]?.type === 'Testspiel' || mergedData[selectedEventDate]?.type === 'Pflichtspiel' || mergedData[selectedEventDate]?.type === 'Spiel') && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Gegner</label>
                    <input 
                      type="text"
                      className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                      placeholder={isEditing ? "Gegner" : ""}
                      value={mergedData[selectedEventDate]?.opponent || ''}
                      onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'opponent', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                )}
              </div>

              {(mergedData[selectedEventDate]?.type === 'Testspiel' || mergedData[selectedEventDate]?.type === 'Pflichtspiel' || mergedData[selectedEventDate]?.type === 'Spiel') && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Ergebnis</label>
                  <input 
                    type="text"
                    className={`w-full p-2 bg-gray-50 border-2 border-black text-xs font-bold uppercase focus:outline-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    placeholder={isEditing ? "-:-" : ""}
                    value={mergedData[selectedEventDate]?.ergebnis || ''}
                    onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'ergebnis', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              )}

              {/* Detailed Sessions Section */}
              <div className="space-y-4 border-t-2 border-black pt-4">
                <h4 className="text-xs font-black uppercase tracking-widest">Tagesablauf Details</h4>
                {[
                  { label: 'Athletik', key: 'athletik' },
                  { label: 'Vormittag', key: 'vormittag' },
                  { label: 'Individual', key: 'individual' },
                  { label: 'Videoanalyse', key: 'video' },
                  { label: 'Haupttraining', key: 'training' }
                ].map(session => (
                  <div key={session.key} className="p-3 bg-gray-50 border-2 border-black space-y-2">
                    <div className="text-[10px] font-black uppercase">{session.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        placeholder="Start"
                        className="p-1 border border-black text-[10px] font-bold uppercase focus:outline-none"
                        value={mergedData[selectedEventDate]?.[session.key]?.start || ''}
                        onChange={(e) => handleUpdateDayPlan(selectedEventDate, `${session.key}.start`, e.target.value)}
                        disabled={!isEditing}
                      />
                      <input 
                        type="text"
                        placeholder="Ende"
                        className="p-1 border border-black text-[10px] font-bold uppercase focus:outline-none"
                        value={mergedData[selectedEventDate]?.[session.key]?.end || ''}
                        onChange={(e) => handleUpdateDayPlan(selectedEventDate, `${session.key}.end`, e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <input 
                      type="text"
                      placeholder="Notizen..."
                      className="w-full p-1 border border-black text-[10px] font-medium focus:outline-none"
                      value={mergedData[selectedEventDate]?.[session.key]?.notes || ''}
                      onChange={(e) => handleUpdateDayPlan(selectedEventDate, `${session.key}.notes`, e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                ))}
              </div>

              {/* Feiertags-Verwaltung */}
              <div className="space-y-3 border-t-2 border-black pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Flag size={14} className="text-orange-500" />
                    Feiertags-Verwaltung (BW)
                  </h4>
                  {getDayHolidayName(selectedEventDate) && (
                    <span className="text-[7px] bg-orange-100 text-orange-800 font-bold px-1.5 py-0.5 rounded uppercase">
                      Aktiv
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-700 bg-orange-50/40 p-2.5 border border-black/10">
                    {(() => {
                      const calcH = getHolidays(parseInt(selectedEventDate.split('-')[0], 10))[selectedEventDate];
                      const customH = yearlyPlan[selectedEventDate]?.customHolidayName;
                      if (customH === "") {
                        return (
                          <span>
                            Regulärer Feiertag (<span className="line-through">{calcH}</span>) wurde für diesen Tag <strong className="text-red-600">deaktiviert</strong>.
                          </span>
                        );
                      } else if (customH) {
                        return (
                          <span>
                            Benutzerdefinierter Feiertag: <strong className="text-orange-600">{customH}</strong> {calcH ? `(ersetzt regulären Feiertag: ${calcH})` : ''}
                          </span>
                        );
                      } else if (calcH) {
                        return (
                          <span>
                            Regulärer Feiertag in BW: <strong className="text-orange-600">{calcH}</strong>
                          </span>
                        );
                      } else {
                        return <span>Kein gesetzlicher Feiertag an diesem Tag.</span>;
                      }
                    })()}
                  </div>

                  {isEditing && (
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest opacity-60">Feiertagsname ändern / hinzufügen</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            className="flex-1 p-2 bg-white border-2 border-black text-xs font-bold focus:outline-none placeholder-gray-400"
                            placeholder={getHolidays(parseInt(selectedEventDate.split('-')[0], 10))[selectedEventDate] || "z.B. Vereinsjubiläum"}
                            value={yearlyPlan[selectedEventDate]?.customHolidayName !== undefined ? (yearlyPlan[selectedEventDate]?.customHolidayName || '') : ''}
                            onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'customHolidayName', e.target.value)}
                          />
                          {(yearlyPlan[selectedEventDate]?.customHolidayName !== undefined && yearlyPlan[selectedEventDate]?.customHolidayName !== null) && (
                            <button
                              onClick={() => handleUpdateDayPlan(selectedEventDate, 'customHolidayName', null)}
                              className="px-2 py-1 bg-gray-100 border-2 border-black text-[9px] font-black uppercase tracking-wider hover:bg-gray-200 transition-colors"
                              title="Auf Standard zurücksetzen"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Toggle Buttons */}
                      {(() => {
                        const calcH = getHolidays(parseInt(selectedEventDate.split('-')[0], 10))[selectedEventDate];
                        const customH = yearlyPlan[selectedEventDate]?.customHolidayName;
                        if (calcH && customH !== "") {
                          return (
                            <button
                              type="button"
                              onClick={() => handleUpdateDayPlan(selectedEventDate, 'customHolidayName', '')}
                              className="w-full py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[9px] font-black uppercase tracking-wider transition-colors rounded-sm text-center"
                            >
                              Feiertag für diesen Tag deaktivieren
                            </button>
                          );
                        } else if (calcH && customH === "") {
                          return (
                            <button
                              type="button"
                              onClick={() => handleUpdateDayPlan(selectedEventDate, 'customHolidayName', null)}
                              className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[9px] font-black uppercase tracking-wider transition-colors rounded-sm text-center"
                            >
                              Regulären Feiertag wieder aktivieren
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Allgemeine Notizen</label>
                <textarea 
                  className={`w-full h-24 p-3 bg-gray-50 border-2 border-black text-sm font-medium focus:outline-none resize-none ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder={isEditing ? "Zusätzliche Details..." : ""}
                  value={mergedData[selectedEventDate]?.content || ''}
                  onChange={(e) => handleUpdateDayPlan(selectedEventDate, 'content', e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t-2 border-black flex justify-between items-center">
              {isEditing && (
                <button 
                  onClick={() => {
                    handleUpdateDayPlan(selectedEventDate, 'type', 'Frei');
                    handleUpdateDayPlan(selectedEventDate, 'time', '');
                    handleUpdateDayPlan(selectedEventDate, 'content', '');
                    handleUpdateDayPlan(selectedEventDate, 'treffpunkt', '');
                    handleUpdateDayPlan(selectedEventDate, 'opponent', '');
                    handleUpdateDayPlan(selectedEventDate, 'ergebnis', '');
                    // Clear detailed sessions
                    ['athletik', 'vormittag', 'individual', 'video', 'training'].forEach(key => {
                      handleUpdateDayPlan(selectedEventDate, `${key}.start`, '');
                      handleUpdateDayPlan(selectedEventDate, `${key}.end`, '');
                      handleUpdateDayPlan(selectedEventDate, `${key}.notes`, '');
                    });
                    setSelectedEventDate(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={14} /> Termin löschen
                </button>
              )}
              <button 
                onClick={() => setSelectedEventDate(null)}
                className="px-6 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors ml-auto"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-black text-white flex justify-between items-center border-b-4 border-black">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-white">
                <Calendar size={16} className="text-[#C00000]" />
                Saison-Planung generieren
              </h2>
              <button 
                onClick={() => setShowGenModal(false)}
                className="hover:text-red-500 transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {/* Zeitraum */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Zeitraum</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40">Start</span>
                    <input 
                      type="date"
                      className="w-full p-2 border-2 border-black text-xs font-bold focus:outline-none"
                      value={genOptions.startDate}
                      onChange={(e) => setGenOptions(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40">Ende</span>
                    <input 
                      type="date"
                      className="w-full p-2 border-2 border-black text-xs font-bold focus:outline-none"
                      value={genOptions.endDate}
                      onChange={(e) => setGenOptions(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Trainings-Wochentage */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Trainings-Wochentage</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Montag', value: 1 },
                    { label: 'Dienstag', value: 2 },
                    { label: 'Mittwoch', value: 3 },
                    { label: 'Donnerstag', value: 4 },
                    { label: 'Freitag', value: 5 },
                    { label: 'Samstag', value: 6 },
                    { label: 'Sonntag', value: 0 },
                  ].map(day => {
                    const isChecked = genOptions.trainingDays.includes(day.value);
                    return (
                      <label 
                        key={day.value}
                        className={`flex items-center gap-2 p-2 border-2 border-black text-[10px] font-black uppercase cursor-pointer select-none transition-all
                          ${isChecked ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-[2px_2px_0px_0px_rgba(37,99,235,1)]' : 'bg-gray-50 border-black/10 hover:border-black'}`}
                      >
                        <input 
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={() => toggleTrainingDay(day.value)}
                        />
                        <div className={`w-3.5 h-3.5 border-2 border-current flex items-center justify-center text-[8px] ${isChecked ? 'bg-blue-600 text-white' : 'bg-white'}`}>
                          {isChecked && '✓'}
                        </div>
                        {day.label}
                      </label>
                    );
                  })}
                </div>
                <p className="text-[8px] font-medium opacity-50 italic">Nicht ausgewählte Wochentage werden im Jahresplan automatisch als freie Tage ("Spielfrei") markiert.</p>
              </div>

              {/* Feiertage */}
              <div className="space-y-2 bg-yellow-50/50 p-3 border-2 border-amber-200">
                <label className="text-[10px] font-black uppercase tracking-widest text-amber-900">Feiertage (Baden-Württemberg)</label>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    checked={genOptions.skipHolidays}
                    onChange={(e) => setGenOptions(prev => ({ ...prev, skipHolidays: e.target.checked }))}
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950">Feiertage als freie Tage markieren</span>
                </label>
                <p className="text-[8px] font-medium text-amber-800 italic">Überspringt automatisch das Generieren von Einheiten an Feiertagen und markiert sie als "Frei".</p>
              </div>

              {/* Winterpause */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Winterpause</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40">Pause von</span>
                    <input 
                      type="date"
                      className="w-full p-2 border-2 border-black text-xs font-bold focus:outline-none"
                      value={genOptions.breakStart}
                      onChange={(e) => setGenOptions(prev => ({ ...prev, breakStart: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase tracking-wider opacity-40">Pause bis</span>
                    <input 
                      type="date"
                      className="w-full p-2 border-2 border-black text-xs font-bold focus:outline-none"
                      value={genOptions.breakEnd}
                      onChange={(e) => setGenOptions(prev => ({ ...prev, breakEnd: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t-2 border-black flex justify-end gap-2">
              <button 
                onClick={() => setShowGenModal(false)}
                className="px-4 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                Abbrechen
              </button>
              <button 
                onClick={async () => {
                  setShowGenModal(false);
                  if ((window as any).generateSeasonSessions) {
                    await (window as any).generateSeasonSessions(genOptions);
                  }
                }}
                className="px-6 py-2 bg-[#C00000] text-white text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                Generieren starten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
