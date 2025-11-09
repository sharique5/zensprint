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
  sessionDuration: 60, // seconds
  maxLives: 3, // lives before game over
  circleLifetime: 2500, // milliseconds
  spawnInterval: 800, // milliseconds between spawns
  circleRadius: 40,
  maxCircles: 6,
};
