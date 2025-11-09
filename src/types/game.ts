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
}

export const COLORS = {
  focus: '#4ECDC4',     // Teal - the color to tap
  distractor1: '#FF6B6B', // Coral red
  distractor2: '#FFE66D', // Yellow
  distractor3: '#A8E6CF', // Mint green
  background: '#0a0a0a',
  text: '#ffffff',
  textSecondary: '#888888',
};

export const GAME_CONFIG = {
  sessionDuration: 60, // seconds
  maxMisses: 5,
  circleLifetime: 2500, // milliseconds
  spawnInterval: 800, // milliseconds between spawns
  circleRadius: 40,
  maxCircles: 6,
};
