import React, { useEffect, useRef } from 'react';
import { LogEntry, TaskId } from '../types';

interface SidebarProps {
  logs: LogEntry[];
  currentTask: TaskId;
  totalErrors: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ logs, currentTask, totalErrors }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 md:w-96 z-10 font-mono text-sm shadow-2xl">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h1 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Research Session Log
        </h1>
      </div>

      <div className="p-3 grid grid-cols-2 gap-2 bg-slate-100 border-b border-slate-200 text-center">
        <div className="bg-white p-2 rounded border border-slate-200">
          <div className="text-[9px] text-slate-400 uppercase font-bold">Protocol Stage</div>
          <div className="text-indigo-600 font-bold text-xs mt-1">{currentTask}</div>
        </div>
        <div className="bg-white p-2 rounded border border-slate-200">
          <div className="text-[9px] text-slate-400 uppercase font-bold">Violations</div>
          <div className={`font-bold text-xs mt-1 ${totalErrors > 0 ? 'text-red-600' : 'text-slate-600'}`}>
            {totalErrors}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 bg-slate-900 space-y-2">
        {logs.length === 0 && <div className="text-slate-600 italic text-center text-xs mt-10">Waiting for subject interaction...</div>}
        
        {logs.map((log) => (
          <div key={log._uiId} className="flex gap-2 text-[10px] font-mono border-l-2 pl-2 py-1 transition-all"
               style={{ borderColor: log.action === 'ERROR' ? '#ef4444' : log.action === 'GUESS' ? '#eab308' : '#3b82f6' }}>
            <div className="text-slate-500 min-w-[50px]">{log.timestamp.toString().slice(-5)}</div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className={`font-bold ${
                  log.action === 'ERROR' ? 'text-red-400' : 
                  log.action === 'PUSH' ? 'text-emerald-400' : 
                  log.action === 'POP' ? 'text-blue-400' : 'text-slate-300'
                }`}>
                  {log.action}
                </span>
                <span className="text-slate-600">{log.taskId}</span>
              </div>
              {log.errorType && (
                <div className="text-red-400 font-bold mt-0.5">> {log.errorType}</div>
              )}
              {log.context && (
                <div className="text-slate-500 mt-0.5">Ctx: {log.context}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
