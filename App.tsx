import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import { Scene } from './components/Scene';
import { Sidebar } from './components/Sidebar';
import { RingData, LogEntry, COLORS, TaskId, PoleId } from './types';
import { FLOOR_RADIUS_MIN, FLOOR_RADIUS_MAX, MAX_STACK_CAPACITY } from './constants';

// --- Level Configuration Types ---

type GameState = {
  rings: RingData[];
  stacks: Record<string, string[]>; // PoleID -> Array of Ring IDs
  selectedRingId: string | null;
  popCount?: number; // For Level 4
  blindfoldSequence?: string[]; // For Level 6 (Removed but keeping type clean if needed)
};

type LevelDefinition = {
  id: TaskId;
  title: string;
  instruction: string;
  layout: 'SINGLE' | 'DUAL';
  blindfold: boolean;
  setup: () => GameState;
};

// --- Helper Functions ---

const createRing = (color: string, index: number, total: number, poleId: PoleId = 'CENTER', status: 'floor' | 'stack' = 'floor'): RingData => {
  // Distribute rings evenly in a circle to prevent overlap
  const angle = (index / total) * Math.PI * 2;
  const radius = 5.5; 
  return {
    id: uuidv4(),
    color,
    floorPosition: [Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius],
    status,
    poleId,
    stackIndex: null,
    shakeTrigger: 0
  };
};

// --- The 5 Levels ---

const LEVELS: LevelDefinition[] = [
  {
    id: 'LEVEL_1',
    title: 'The Basics',
    instruction: 'Push 3 rings onto the stack.',
    layout: 'SINGLE',
    blindfold: false,
    setup: () => {
      const colors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.PURPLE, COLORS.GOLD];
      const rings = colors.map((c, i) => createRing(c, i, colors.length));
      return { rings, stacks: { CENTER: [] }, selectedRingId: null };
    }
  },
  {
    id: 'LEVEL_2',
    title: 'The Cleanup (LIFO)',
    instruction: 'Empty the stack completely.',
    layout: 'SINGLE',
    blindfold: false,
    setup: () => {
      // Even though they start on stack, we assign unique floor slots via index for when they pop
      const r1 = createRing(COLORS.RED, 0, 3, 'CENTER', 'stack');
      const r2 = createRing(COLORS.BLUE, 1, 3, 'CENTER', 'stack');
      const r3 = createRing(COLORS.GREEN, 2, 3, 'CENTER', 'stack');
      r1.stackIndex = 0; r2.stackIndex = 1; r3.stackIndex = 2;
      return { 
        rings: [r1, r2, r3], 
        stacks: { CENTER: [r1.id, r2.id, r3.id] }, 
        selectedRingId: null 
      };
    }
  },
  {
    id: 'LEVEL_3',
    title: 'Buried Treasure',
    instruction: 'Pop the GOLD Ring.',
    layout: 'SINGLE',
    blindfold: false,
    setup: () => {
      const gold = createRing(COLORS.GOLD, 0, 3, 'CENTER', 'stack');
      const blue1 = createRing(COLORS.BLUE, 1, 3, 'CENTER', 'stack');
      const blue2 = createRing(COLORS.BLUE, 2, 3, 'CENTER', 'stack');
      gold.stackIndex = 0; blue1.stackIndex = 1; blue2.stackIndex = 2;
      return { 
        rings: [gold, blue1, blue2], 
        stacks: { CENTER: [gold.id, blue1.id, blue2.id] }, 
        selectedRingId: null 
      };
    }
  },
  {
    id: 'LEVEL_4',
    title: 'The Phantom Pop',
    instruction: 'Perform the Pop action exactly 5 times.',
    layout: 'SINGLE',
    blindfold: false,
    setup: () => {
      const r1 = createRing(COLORS.PURPLE, 0, 3, 'CENTER', 'stack');
      const r2 = createRing(COLORS.PURPLE, 1, 3, 'CENTER', 'stack');
      const r3 = createRing(COLORS.PURPLE, 2, 3, 'CENTER', 'stack');
      r1.stackIndex = 0; r2.stackIndex = 1; r3.stackIndex = 2;
      return { 
        rings: [r1, r2, r3], 
        stacks: { CENTER: [r1.id, r2.id, r3.id] }, 
        selectedRingId: null,
        popCount: 0
      };
    }
  },
  {
    id: 'LEVEL_5',
    title: 'The Twin Towers',
    instruction: 'Move the RED ring to the RIGHT pole.',
    layout: 'DUAL',
    blindfold: false,
    setup: () => {
      const red = createRing(COLORS.RED, 0, 2, 'LEFT', 'stack');
      const blue = createRing(COLORS.BLUE, 1, 2, 'LEFT', 'stack');
      red.stackIndex = 0; blue.stackIndex = 1;
      return {
        rings: [red, blue],
        stacks: { LEFT: [red.id, blue.id], RIGHT: [] },
        selectedRingId: null
      };
    }
  }
];

// --- Main App Component ---

const App: React.FC = () => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [flashError, setFlashError] = useState(false);
  
  const currentLevel = LEVELS[levelIdx];
  const isComplete = levelIdx >= LEVELS.length;

  // Initialize State based on Level
  const [gameState, setGameState] = useState<GameState>(currentLevel?.setup() || { rings: [], stacks: {}, selectedRingId: null });

  // Reset state when level changes
  useEffect(() => {
    if (!isComplete) {
      setGameState(currentLevel.setup());
      setShowSuccess(false);
    }
  }, [levelIdx, isComplete]);

  // Logging Utility
  const addLog = useCallback((action: LogEntry['action'], errorType: LogEntry['errorType'] = null, context: string = '') => {
    setLogs(prev => [...prev, {
      _uiId: uuidv4(),
      taskId: currentLevel.id,
      timestamp: Date.now(),
      action,
      errorType,
      context
    }]);
    if (errorType) {
      setFlashError(true);
      setTimeout(() => setFlashError(false), 500);
    }
  }, [currentLevel]);

  const advanceLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx(prev => prev + 1);
    } else {
      // End game state
      setLevelIdx(LEVELS.length);
    }
  };

  // --- Interaction Logic (The Brain) ---

  const handleRingClick = (id: string) => {
    if (showSuccess || isComplete) return;

    setGameState(prev => {
      const ring = prev.rings.find(r => r.id === id);
      if (!ring) return prev;
      
      const poleStack = prev.stacks[ring.poleId];
      const isTop = poleStack[poleStack.length - 1] === ring.id;

      // --- LEVEL SPECIFIC LOGIC ---

      // Level 2 & 3: LIFO & Buried Treasure
      if ((currentLevel.id === 'LEVEL_2' || currentLevel.id === 'LEVEL_3') && ring.status === 'stack') {
        if (!isTop) {
          // LIFO Violation
          ring.shakeTrigger = Date.now();
          const context = (ring.color === COLORS.GOLD) ? 'GOLD_RING' : 'BURIED_RING';
          addLog('ERROR', 'LIFO_VIOLATION', context);
          return { ...prev }; // Force re-render for shake
        }
        // Valid Pop
        const newStack = poleStack.slice(0, -1);
        const newRings = prev.rings.map(r => r.id === id ? { ...r, status: 'floor' as const, stackIndex: null } : r);
        
        // Check Level 3 Success (Popped Gold)
        if (currentLevel.id === 'LEVEL_3' && ring.color === COLORS.GOLD) {
          addLog('POP', null, 'GOLD_RING_RETRIEVED');
          setTimeout(() => setShowSuccess(true), 500);
        } else {
          addLog('POP');
        }

        // Check Level 2 Success (Empty Stack)
        if (currentLevel.id === 'LEVEL_2' && newStack.length === 0) {
          setTimeout(() => setShowSuccess(true), 500);
        }

        return { ...prev, rings: newRings, stacks: { ...prev.stacks, [ring.poleId]: newStack } };
      }

      // Level 4: Phantom Pop (User clicks topmost ring)
      if (currentLevel.id === 'LEVEL_4' && ring.status === 'stack') {
        // Standard pop
        const newStack = poleStack.slice(0, -1);
        const newRings = prev.rings.map(r => r.id === id ? { ...r, status: 'floor' as const, stackIndex: null } : r);
        
        const newPopCount = (prev.popCount || 0) + 1;
        addLog('POP', null, `Count: ${newPopCount}`);

        if (newPopCount >= 5) setTimeout(() => setShowSuccess(true), 500);

        return { ...prev, rings: newRings, stacks: { ...prev.stacks, [ring.poleId]: newStack }, popCount: newPopCount };
      }

      // Level 5: Twin Towers Selection
      if (currentLevel.id === 'LEVEL_5' && ring.status === 'stack') {
        if (!isTop) {
           // Blocked
           ring.shakeTrigger = Date.now();
           addLog('ERROR', 'BLOCKED_BY_TOP', 'TELEPORT_ATTEMPT');
           return { ...prev };
        }
        // Select Ring
        return { ...prev, selectedRingId: prev.selectedRingId === id ? null : id };
      }

      // Level 1: Basic Push (Click floor ring)
      if (currentLevel.id === 'LEVEL_1' && ring.status === 'floor') {
        const stack = prev.stacks['CENTER'];
        const newRings = prev.rings.map(r => r.id === id ? { 
          ...r, status: 'stack' as const, poleId: 'CENTER' as PoleId, stackIndex: stack.length 
        } : r);
        
        addLog('PUSH');
        if (stack.length + 1 >= 3) setTimeout(() => setShowSuccess(true), 500);
        
        return { ...prev, rings: newRings, stacks: { CENTER: [...stack, id] } };
      }

      return prev;
    });
  };

  const handlePoleClick = (poleId: PoleId) => {
    if (showSuccess || isComplete) return;

    // Level 4: Empty Pop Click (Phantom Pop)
    // In Level 4, we interpret clicking the "Pole" (or base) when empty as a "Pop Attempt"
    if (currentLevel.id === 'LEVEL_4') {
      const stack = gameState.stacks[poleId] || [];
      if (stack.length === 0) {
        const newPopCount = (gameState.popCount || 0) + 1;
        addLog('ERROR', 'STACK_UNDERFLOW', 'EMPTY_POP');
        
        // This counts towards the goal of 5 interactions
        if (newPopCount >= 5) setTimeout(() => setShowSuccess(true), 500);
        
        return setGameState(prev => ({ ...prev, popCount: newPopCount }));
      }
    }

    // Level 5: Move Logic
    if (currentLevel.id === 'LEVEL_5' && gameState.selectedRingId) {
      setGameState(prev => {
        const ring = prev.rings.find(r => r.id === prev.selectedRingId);
        if (!ring) return prev;
        
        // Can't move to same pole if already there (simplify logic: just ignore)
        if (ring.poleId === poleId) return { ...prev, selectedRingId: null };

        // Move it
        const oldPole = ring.poleId;
        const newStack = [...(prev.stacks[poleId] || []), ring.id];
        const oldStack = prev.stacks[oldPole].filter(id => id !== ring.id);

        const newRings = prev.rings.map(r => r.id === ring.id ? { 
          ...r, poleId, stackIndex: newStack.length - 1, status: 'stack' as const 
        } : r);

        // Update indices for old stack (shouldn't be needed if strictly top, but good for safety)
        
        addLog('MOVE', null, `${oldPole} -> ${poleId}`);

        // Success Check: Red Ring on Right Pole
        if (ring.color === COLORS.RED && poleId === 'RIGHT') {
          setTimeout(() => setShowSuccess(true), 500);
        }

        return { 
          ...prev, 
          rings: newRings, 
          stacks: { ...prev.stacks, [oldPole]: oldStack, [poleId]: newStack },
          selectedRingId: null
        };
      });
    }
  };

  // --- Render ---

  if (isComplete) {
    return (
      <div className="flex w-full h-full bg-slate-100 items-center justify-center p-8">
        <div className="flex flex-col max-w-4xl w-full h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-slate-200 bg-slate-50">
             <h1 className="text-3xl font-bold text-slate-800">Study Complete</h1>
             <p className="text-slate-600 mt-2">Data collection finished. Please copy the logs below.</p>
          </div>
          <div className="flex-1 bg-slate-900 overflow-hidden relative">
             <div className="absolute inset-0 overflow-y-auto p-6 text-xs font-mono text-emerald-400">
               {logs.map(l => (
                 <div key={l._uiId} className="mb-1 border-b border-slate-800 pb-1 last:border-0 hover:bg-slate-800">
                   {JSON.stringify(l)}
                 </div>
               ))}
             </div>
          </div>
          <div className="p-4 bg-slate-100 text-center text-slate-500 text-sm">
            Total Interactions: {logs.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full h-full bg-slate-100 font-sans text-slate-800 transition-colors duration-200 ${flashError ? 'bg-red-50' : ''}`}>
      
      <div className="flex-1 relative h-full">
        {/* Instruction Card */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 border-2 border-indigo-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold tracking-widest text-indigo-500 uppercase">
                Stage {levelIdx + 1}: {currentLevel.title}
              </span>
            </div>
            <p className="text-slate-700 text-lg font-medium">{currentLevel.instruction}</p>
          </div>
        </div>

        <Canvas shadows camera={{ position: [0, 8, 12], fov: 45 }}>
          <Scene 
            rings={gameState.rings} 
            stacks={gameState.stacks} 
            onRingClick={handleRingClick}
            onPoleClick={handlePoleClick}
            layout={currentLevel.layout}
            blindfold={currentLevel.blindfold}
            selectedRingId={gameState.selectedRingId}
          />
        </Canvas>
      </div>

      <div className="hidden md:block h-full">
        <Sidebar logs={logs} currentTask={currentLevel.id} totalErrors={logs.filter(l => l.action === 'ERROR').length} />
      </div>

      {showSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-bounce-in">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Stage Complete</h2>
            <button 
              onClick={advanceLevel}
              className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Continue Protocol →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;