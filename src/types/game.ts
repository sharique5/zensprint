export interface Circle {
  id: string;
  color: string;
  x: number;
  y: number;
  radius: number;
  createdAt: number;
  lifetime: number; // milliseconds before fade out
}

export interface GameState {
  score: number;
  timeRemaining: number;
  isPlaying: boolean;
  missedTaps: number;
  correctTaps: number;
  focusColor: string;
  lives: number;
  level: number;
  totalScore: number; // Cumulative score across levels
  combo: number; // Consecutive correct taps
  maxCombo: number; // Best combo in session
}

export const COLORS = {
  focus: '#4ECDC4',     // Teal - the color to tap
  distractor1: '#FF6B6B', // Coral red
  distractor2: '#FFE66D', // Yellow
  distractor3: '#A8E6CF', // Mint green
  distractor4: '#95E1D3', // Aqua
  distractor5: '#F38181', // Pink
  background: '#0a0a0a',
  text: '#ffffff',
  textSecondary: '#888888',
};

export const FOCUS_COLORS = [
  '#4ECDC4', // Teal
  '#FF6B6B', // Coral red
  '#FFE66D', // Yellow
  '#A8E6CF', // Mint green
  '#95E1D3', // Aqua
  '#F38181', // Pink
  '#AA96DA', // Purple
  '#FCBAD3', // Light pink
];

export const GAME_CONFIG = {
  sessionDuration: 60, // seconds per level
  maxLives: 3, // lives before game over
  baseCircleLifetime: 2500, // milliseconds (gets faster each level)
  baseSpawnInterval: 800, // milliseconds (gets faster each level)
  circleRadius: 40,
  maxCircles: 6,
  
  // Difficulty scaling per level
  getDifficulty: (level: number) => {
    const difficultyMultiplier = 1 - (level - 1) * 0.1; // 10% faster each level
    const minMultiplier = 0.5; // Cap at 50% speed (2x faster)
    const multiplier = Math.max(difficultyMultiplier, minMultiplier);
    
    return {
      circleLifetime: GAME_CONFIG.baseCircleLifetime * multiplier,
      spawnInterval: GAME_CONFIG.baseSpawnInterval * multiplier,
      scoreMultiplier: level, // Score worth more at higher levels
    };
  },
};
