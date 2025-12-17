import React, { useEffect, useRef } from 'react';
import { LogEntry, TaskId } from '../types';

interface SidebarProps {
  logs: LogEntry[];
  currentTask: TaskId;
  totalErrors: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ logs, currentTask, totalErrors }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-80 md:w-96 z-10 font-mono text-sm shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
          Observer Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">Smart Stack Research Prototype v0.9</p>
      </div>

      {/* Live Metrics */}
      <div className="p-4 grid grid-cols-2 gap-3 bg-slate-100 border-b border-slate-200">
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Current Task</div>
          <div className="text-indigo-600 font-bold text-sm mt-1">{currentTask}</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Errors</div>
          <div className={`font-bold text-xl mt-1 ${totalErrors > 0 ? 'text-red-500' : 'text-slate-700'}`}>
            {totalErrors}
          </div>
        </div>
      </div>

      {/* JSON Stream */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 text-slate-300">
        <div className="p-2 bg-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex justify-between items-center">
          <span>JSON Log Stream</span>
          <span className="bg-slate-700 px-2 py-0.5 rounded text-white">{logs.length} events</span>
        </div>
        
        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs"
        >
          {logs.length === 0 && (
            <div className="text-slate-600 italic text-center mt-10">
              Waiting for user interaction...
            </div>
          )}
          {logs.map((log) => (
            <div key={log._uiId} className="group relative">
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${
                log.action === 'ERROR' ? 'bg-red-500' : 
                log.action === 'PUSH' ? 'bg-blue-500' : 'bg-green-500'
              }`}></div>
              <pre className="pl-3 whitespace-pre-wrap break-all opacity-80 group-hover:opacity-100 transition-opacity">
{JSON.stringify({
  taskId: log.taskId,
  time: log.timestamp,
  act: log.action,
  ...(log.errorType ? { err: log.errorType } : {})
}, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
