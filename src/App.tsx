/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  Play, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Check, 
  ChevronRight,
  TrendingUp,
  Brain,
  Layers,
  Calculator
} from 'lucide-react';
import { Difficulty, OperationType, GameSettings, MathStep } from './types';

// More refined weighted random generator
const generateWeightedNumber = (digits: number, difficulty: Difficulty): number => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const range = max - min + 1;
  
  const pick = () => Math.floor(Math.random() * range) + min;

  if (difficulty === Difficulty.Easy) {
    if (Math.random() < 0.7) {
      if (digits === 1) {
        const simpleDigits = [1, 2, 5].filter(n => n >= min && n <= max);
        return simpleDigits.length > 0 ? simpleDigits[Math.floor(Math.random() * simpleDigits.length)] : pick();
      }
      let simple = pick();
      simple = simple - (simple % 5); // transform to multiple of 5
      // Ensure it stays in range
      if (simple < min) simple = min + (5 - (min % 5));
      if (simple > max) simple = max - (max % 5);
      return simple;
    }
  }

  if (difficulty === Difficulty.Hard) {
    if (Math.random() < 0.6) {
      const complex = pick();
      const lastDigit = complex % 10;
      if (![7, 8, 9].includes(lastDigit)) {
        let candidate = complex - lastDigit + (Math.random() > 0.5 ? 7 : 9);
        if (candidate > max) candidate = max;
        if (candidate < min) candidate = min;
        return candidate;
      }
      return complex;
    }
  }

  return pick();
};

export default function App() {
  const [settings, setSettings] = useState<GameSettings>({
    operationsCount: 5,
    digits: 1,
    operationType: OperationType.Both,
    difficulty: Difficulty.Medium,
    interval: 1200,
  });

  const [gameState, setGameState] = useState<'setup' | 'countdown' | 'playing' | 'result'>('setup');
  const [countdown, setCountdown] = useState(3);
  const [steps, setSteps] = useState<MathStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTraining = useCallback(() => {
    const newSteps: MathStep[] = [];
    
    for (let i = 0; i < settings.operationsCount; i++) {
      let num = generateWeightedNumber(settings.digits, settings.difficulty);
      let op: '+' | '-' | '' = '';

      if (i === 0) {
        op = '';
      } else {
        if (settings.operationType === OperationType.Addition) {
          op = '+';
        } else if (settings.operationType === OperationType.Subtraction) {
          op = '-';
        } else {
          op = Math.random() > 0.5 ? '+' : '-';
        }
      }
      newSteps.push({ number: num, operator: op });
    }

    setSteps(newSteps);
    setGameState('countdown');
    setCountdown(3);
    setCurrentStepIndex(-1);
    setShowAnswer(false);
    setShowHistory(false);
  }, [settings]);

  // Countdown logic
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
        setCurrentStepIndex(0);
      }
    }
  }, [gameState, countdown]);

  useEffect(() => {
    if (gameState === 'playing' && currentStepIndex < steps.length) {
      timerRef.current = setTimeout(() => {
        if (currentStepIndex === steps.length - 1) {
          setGameState('result');
        } else {
          setCurrentStepIndex(prev => prev + 1);
        }
      }, settings.interval);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, currentStepIndex, steps.length, settings.interval]);

  const finalResult = steps.reduce((acc, step) => {
    if (step.operator === '+') return acc + step.number;
    if (step.operator === '-') return acc - step.number;
    return step.number;
  }, 0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#FDFCFB]">
      {/* Background purely decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pastel-rose rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pastel-blue rounded-full blur-[120px] opacity-60" />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 1.02 }}
            className="w-full max-w-2xl relative z-10"
          >
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                Entrenamiento Mental
              </span>
              <h1 className="text-5xl font-display font-bold tracking-tight text-slate-800 mb-2">MenteÁgil</h1>
              <p className="text-slate-400 font-light">Configura tu sesión de cálculo rápido</p>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-rose-100/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left Column: Core Settings */}
                <div className="space-y-8">
                  <SettingGroup icon={<Layers size={18} />} label="Cantidad de Números">
                    <div className="flex gap-2 p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
                      {[3, 5, 10, 15].map(v => (
                        <TabButton 
                          key={v} 
                          active={settings.operationsCount === v} 
                          onClick={() => setSettings(s => ({ ...s, operationsCount: v }))}
                          color="rose"
                        >
                          {v}
                        </TabButton>
                      ))}
                    </div>
                  </SettingGroup>

                  <SettingGroup icon={<Brain size={18} />} label="Cifras por Número">
                    <div className="flex gap-2 p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
                      {[1, 2, 3].map(v => (
                        <TabButton 
                          key={v} 
                          active={settings.digits === v} 
                          onClick={() => setSettings(s => ({ ...s, digits: v as 1|2|3 }))}
                          color="blue"
                        >
                          {v} {v === 1 ? 'Cifra' : 'Cifras'}
                        </TabButton>
                      ))}
                    </div>
                  </SettingGroup>

                  <SettingGroup icon={<TrendingUp size={18} />} label="Nivel de Desafío">
                    <div className="flex gap-2 p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
                      {[
                        { id: Difficulty.Easy, label: 'Básico' },
                        { id: Difficulty.Medium, label: 'Medio' },
                        { id: Difficulty.Hard, label: 'Experto' }
                      ].map(d => (
                        <TabButton 
                          key={d.id} 
                          active={settings.difficulty === d.id} 
                          onClick={() => setSettings(s => ({ ...s, difficulty: d.id }))}
                          color="purple"
                        >
                          {d.label}
                        </TabButton>
                      ))}
                    </div>
                  </SettingGroup>
                </div>

                {/* Right Column: Speed & Operations */}
                <div className="space-y-8">
                  <SettingGroup icon={<Calculator size={18} />} label="Tipo de Operación">
                    <div className="space-y-2">
                      {[
                        { id: OperationType.Both, label: 'Suma y Resta' },
                        { id: OperationType.Addition, label: 'Solo Suma' },
                        { id: OperationType.Subtraction, label: 'Solo Resta' }
                      ].map(op => (
                        <button
                          key={op.id}
                          onClick={() => setSettings(s => ({ ...s, operationType: op.id }))}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            settings.operationType === op.id 
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-100' 
                            : 'bg-white border-slate-50 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <span className="text-sm font-medium">{op.label}</span>
                          {settings.operationType === op.id && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </SettingGroup>

                  <SettingGroup icon={<SettingsIcon size={18} />} label={`Velocidad: ${settings.interval}ms`}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Lento', val: 2000 },
                          { label: 'Medio', val: 1200 },
                          { label: 'Rápido', val: 800 },
                          { label: 'Rayo', val: 400 },
                        ].map(p => (
                          <button
                            key={p.val}
                            onClick={() => setSettings(s => ({ ...s, interval: p.val }))}
                            className={`py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all ${
                              settings.interval === p.val 
                              ? 'bg-amber-400 text-white' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <div className="px-2">
                        <input 
                          type="range" 
                          min="300" 
                          max="3000" 
                          step="100"
                          value={settings.interval}
                          onChange={(e) => setSettings(s => ({ ...s, interval: parseInt(e.target.value) }))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                      </div>
                    </div>
                  </SettingGroup>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={startTraining}
                  className="w-full flex items-center justify-center gap-3 py-6 bg-slate-800 text-white rounded-[2rem] hover:bg-slate-900 shadow-xl shadow-slate-200/50 transition-all duration-300 group"
                  id="main-start-button"
                >
                  <span className="text-lg font-semibold">Empezar ahora</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ChevronRight size={20} />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'countdown' && (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="flex flex-col items-center justify-center h-full w-full relative z-10"
          >
            <div className="text-[15rem] font-display font-bold text-rose-400 leading-none">
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            <p className="text-slate-400 font-light mt-4 uppercase tracking-[0.5em]">Prepárate</p>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full w-full relative z-10"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentStepIndex}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.1, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-5xl font-display font-light text-rose-300 mb-6 flex items-center justify-center h-16 w-16 rounded-full bg-rose-50/50">
                  {steps[currentStepIndex]?.operator || ''}
                </div>
                <div className="text-[14rem] md:text-[20rem] leading-none font-display font-bold tracking-tighter text-slate-800">
                  {steps[currentStepIndex]?.number}
                </div>
                
                {/* Progress Circle or Bar */}
                <div className="mt-16 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    key={`bar-${currentStepIndex}`}
                    transition={{ duration: settings.interval / 1000, ease: "linear" }}
                    className="h-full bg-rose-400"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-1 w-8 bg-rose-100 rounded-full" />
                  <span className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest">
                    Paso {currentStepIndex + 1} de {settings.operationsCount}
                  </span>
                  <div className="h-1 w-8 bg-rose-100 rounded-full" />
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {gameState === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl text-center relative z-10"
          >
            <div className="glass-card rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-200 via-blue-200 to-purple-200" />
               
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-8">Sesión Completada</h3>
               
               <div className="min-h-[200px] flex items-center justify-center mb-8">
                <AnimatePresence mode="wait">
                  {showAnswer ? (
                    <motion.div 
                      key="answer"
                      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest mb-4">Resultado final</span>
                      <div className="text-9xl md:text-[12rem] font-display font-bold text-slate-800 tracking-tight leading-none">
                        {finalResult}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button 
                      key="hide"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAnswer(true)}
                      className="w-56 h-56 rounded-[3.5rem] bg-rose-50 border-2 border-dashed border-rose-200 flex flex-col items-center justify-center group transition-all hover:bg-rose-100/30"
                    >
                      <Eye size={48} className="text-rose-300 group-hover:text-rose-400 transition-colors mb-3" />
                      <span className="text-sm font-bold text-rose-400 uppercase tracking-[0.2em]">Revelar</span>
                    </motion.button>
                  )}
                </AnimatePresence>
               </div>

               {/* History Section */}
               <div className="mb-10 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                  <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center justify-between w-full text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest">Ver operaciones</span>
                    <ChevronRight size={16} className={`transform transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 flex flex-wrap justify-center gap-3">
                          {steps.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                              {step.operator && <span className="text-rose-400 font-bold">{step.operator}</span>}
                              <span className="text-slate-700 font-display font-medium">{step.number}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                            <span className="text-emerald-500 font-bold">=</span>
                            <span className="text-emerald-700 font-display font-bold">{finalResult}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={startTraining}
                    className="btn-minimal bg-slate-800 text-white hover:bg-slate-900 flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                  >
                    <RotateCcw size={18} />
                    <span>Reintentar</span>
                  </button>
                  <button 
                    onClick={() => setGameState('setup')}
                    className="btn-minimal bg-white border-2 border-slate-100 text-slate-600 hover:border-slate-200 flex items-center justify-center gap-2"
                  >
                    <SettingsIcon size={18} />
                    <span>Configurar</span>
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SettingGroupProps {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}

function SettingGroup({ icon, label, children }: SettingGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-400">
        <div className="p-1.5 rounded-lg bg-slate-100/50">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      {children}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  color: 'rose' | 'blue' | 'purple';
}

function TabButton({ active, onClick, children, color }: TabButtonProps) {
  const colorMap = {
    rose: 'bg-rose-500 text-white shadow-md shadow-rose-200',
    blue: 'bg-blue-500 text-white shadow-md shadow-blue-200',
    purple: 'bg-purple-600 text-white shadow-md shadow-purple-200'
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all duration-300 transform ${
        active ? `${colorMap[color]} scale-105` : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-600'
      }`}
    >
      {children}
    </button>
  );
}
