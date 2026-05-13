
export enum Difficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export enum OperationType {
  Addition = 'addition',
  Subtraction = 'subtraction',
  Both = 'both'
}

export interface GameSettings {
  operationsCount: number;
  digits: 1 | 2 | 3;
  operationType: OperationType;
  difficulty: Difficulty;
  interval: number; // in milliseconds
}

export interface MathStep {
  number: number;
  operator: '+' | '-' | '';
}
