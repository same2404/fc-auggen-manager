import React from 'react';
import { LogEntry } from '../../types';
import { Clock, Activity } from 'lucide-react';

interface AuditLogViewProps {
  logs: LogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  return (
    <div className="flex flex-col h-full bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <div className="p-2 border-b-2 border-black bg-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black text-white flex items-center justify-center border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <Activity size={14} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-black uppercase text-xs tracking-widest">Änderungsprotokoll</h3>
            <span className="text-black/20 text-xs">|</span>
            <p className="text-[8px] font-bold uppercase opacity-40 tracking-widest">Automatische Dokumentation aller Systemänderungen</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="mx-auto mb-3 opacity-50" size={32} />
            <p className="font-medium">Noch keine Änderungen protokolliert.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[10px] font-bold">
            <thead className="sticky top-0 bg-black text-white z-10">
              <tr>
                <th className="p-2 border border-white/20 text-left w-32">Datum</th>
                <th className="p-2 border border-white/20 text-left w-32">Uhrzeit</th>
                <th className="p-2 border border-white/20 text-left w-48">Bereich</th>
                <th className="p-2 border border-white/20 text-left">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors border-b border-black/10">
                  <td className="p-2 border-r border-black/10">{log.dateStr}</td>
                  <td className="p-2 border-r border-black/10">{log.timeStr} Uhr</td>
                  <td className="p-2 border-r border-black/10 uppercase text-[#C00000]">{log.tabName}</td>
                  <td className="p-2">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
