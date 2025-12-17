import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { RingData, LogEntry, COLORS, TaskId } from './types';
import { FLOOR_RADIUS_MIN, FLOOR_RADIUS_MAX, MAX_STACK_CAPACITY } from './constants';

// --- Game/Level Definitions ---

type LevelConfig = {
  id: TaskId;
  title: string;
  instruction: string;
  checkCompletion: (stackSize: number, lastLog?: LogEntry) => boolean;
};

const LEVELS: LevelConfig[] = [
  {
    id: 'LEVEL_1',
    title: 'The Basics',
    instruction: 'Push 3 rings onto the stack.',
    checkCompletion: (size) => size === 3
  },
  {
    id: 'LEVEL_2',
    title: 'LIFO Logic',
    instruction: 'Empty the stack completely.',
    checkCompletion: (size) => size === 0
  },
  {
    id: 'LEVEL_3',
    title: 'Capacity Stress Test',
    instruction: `Try to push ${MAX_STACK_CAPACITY + 1} rings onto the stack.`,
    checkCompletion: (size, lastLog) => size === MAX_STACK_CAPACITY && lastLog?.errorType === 'CAPACITY_FULL'
  }
];

const generateInitialRings = (count: number): RingData[] => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / count;
    const radius = FLOOR_RADIUS_MIN + Math.random() * (FLOOR_RADIUS_MAX - FLOOR_RADIUS_MIN);
    return {
      id: uuidv4(),
      color: COLORS[i % COLORS.length],
      floorPosition: [Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius],
      status: 'floor',
      stackIndex: null,
      shakeTrigger: 0
    };
  });
};

const App: React.FC = () => {
  // --- State ---
  const [rings, setRings] = useState<RingData[]>(() => generateInitialRings(8));
  const [stack, setStack] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Game State
  const [levelIndex, setLevelIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const currentLevel = LEVELS[levelIndex] || LEVELS[LEVELS.length - 1];
  const isGameComplete = levelIndex >= LEVELS.length;

  const totalErrors = useMemo(() => logs.filter(l => l.action === 'ERROR').length, [logs]);

  // --- Logic ---

  const addLog = useCallback((action: 'PUSH' | 'POP' | 'ERROR', errorType?: 'LIFO_VIOLATION' | 'CAPACITY_FULL' | null) => {
    const newLog: LogEntry = {
      _uiId: uuidv4(),
      taskId: isGameComplete ? 'FREE_PLAY' : currentLevel.id,
      timestamp: Date.now(),
      action,
      errorType: errorType || null
    };
    setLogs(prev => [...prev, newLog]);
    return newLog;
  }, [currentLevel, isGameComplete]);

  const handleLevelComplete = () => {
    setShowSuccessModal(true);
  };

  const advanceLevel = () => {
    setShowSuccessModal(false);
    if (levelIndex < LEVELS.length) {
      setLevelIndex(prev => prev + 1);
    }
  };

  const handleRingClick = useCallback((id: string) => {
    if (showSuccessModal) return; // Block input during modal

    setRings(prevRings => {
      const ringIndex = prevRings.findIndex(r => r.id === id);
      if (ringIndex === -1) return prevRings;

      const newRings = [...prevRings];
      const currentRing = { ...newRings[ringIndex] };
      const currentStackSize = stack.length;
      let lastLogEntry: LogEntry | undefined;

      // --- PUSH LOGIC ---
      if (currentRing.status === 'floor') {
        if (currentStackSize >= MAX_STACK_CAPACITY) {
          // CAPICITY ERROR
          currentRing.shakeTrigger = Date.now();
          lastLogEntry = addLog('ERROR', 'CAPACITY_FULL');
        } else {
          // SUCCESSFUL PUSH
          currentRing.status = 'stack';
          currentRing.stackIndex = currentStackSize;
          setStack(prev => [...prev, id]); // Schedule stack update
          lastLogEntry = addLog('PUSH');
        }
      } 
      // --- POP LOGIC ---
      else if (currentRing.status === 'stack') {
        const topOfStackId = stack[currentStackSize - 1];
        
        if (id === topOfStackId) {
          // SUCCESSFUL POP
          currentRing.status = 'floor';
          currentRing.stackIndex = null;
          setStack(prev => prev.slice(0, -1)); // Schedule stack update
          lastLogEntry = addLog('POP');
        } else {
          // LIFO ERROR
          currentRing.shakeTrigger = Date.now();
          lastLogEntry = addLog('ERROR', 'LIFO_VIOLATION');
        }
      }

      newRings[ringIndex] = currentRing;

      // Check Level Completion immediately (using predicted stack size)
      // Note: We use the 'future' stack size for checking logic
      if (!isGameComplete && lastLogEntry) {
        let predictedStackSize = currentStackSize;
        if (lastLogEntry.action === 'PUSH') predictedStackSize++;
        if (lastLogEntry.action === 'POP') predictedStackSize--;

        if (currentLevel.checkCompletion(predictedStackSize, lastLogEntry)) {
          // We need to defer the modal slightly to let the animation start/log register
          setTimeout(handleLevelComplete, 500);
        }
      }

      return newRings;
    });
  }, [stack, currentLevel, isGameComplete, showSuccessModal, addLog]);

  // --- Render ---

  return (
    <div className="flex w-full h-full bg-slate-100 font-sans text-slate-800">
      
      {/* Main 3D Area */}
      <div className="flex-1 relative h-full">
        {/* Instruction Card */}
        {!isGameComplete && (
           <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
             <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 border-2 border-indigo-100 transform transition-all hover:scale-105">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">
                   Task {levelIndex + 1} / {LEVELS.length}
                 </span>
                 {levelIndex === 2 && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">STRESS TEST</span>}
               </div>
               <h2 className="text-2xl font-bold text-slate-800 mb-1">{currentLevel.title}</h2>
               <p className="text-slate-600 text-lg">{currentLevel.instruction}</p>
             </div>
           </div>
        )}

        <Canvas shadows camera={{ position: [8, 6, 8], fov: 45 }}>
          <Scene rings={rings} stack={stack} onRingClick={handleRingClick} />
        </Canvas>
      </div>

      {/* Right Sidebar */}
      <div className="hidden md:block h-full">
        <Sidebar logs={logs} currentTask={isGameComplete ? 'FREE_PLAY' : currentLevel.id} totalErrors={totalErrors} />
      </div>

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-bounce-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🎉
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Success!</h2>
            <p className="text-slate-600 mb-8">
              You completed <span className="font-bold text-indigo-600">{currentLevel.title}</span>.
            </p>
            <button 
              onClick={advanceLevel}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95"
            >
              {levelIndex < LEVELS.length - 1 ? "Next Level →" : "Finish Study"}
            </button>
          </div>
        </div>
      )}

      {/* Game Complete Overlay */}
      {isGameComplete && !showSuccessModal && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md pointer-events-none">
          <div className="bg-green-500/90 backdrop-blur-md rounded-2xl shadow-xl p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-1">Study Complete!</h2>
            <p className="opacity-90">Thank you for participating.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
