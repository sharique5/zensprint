export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  name: string;
  description: string;
  sessionDuration: number;
  baseCircleLifetime: number;
  baseSpawnInterval: number;
  maxLives: number;
  startLevel: number;
}

export const DIFFICULTY_PRESETS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    name: 'Relaxed',
    description: 'Perfect for beginners and relaxation',
    sessionDuration: 60,
    baseCircleLifetime: 3500, // Slower fading
    baseSpawnInterval: 1000,  // Slower spawning
    maxLives: 5,
    startLevel: 1,
  },
  medium: {
    name: 'Balanced',
    description: 'The classic ZenSprint experience',
    sessionDuration: 60,
    baseCircleLifetime: 2500,
    baseSpawnInterval: 800,
    maxLives: 3,
    startLevel: 1,
  },
  hard: {
    name: 'Intense',
    description: 'For focus masters seeking a challenge',
    sessionDuration: 45,       // Shorter sessions
    baseCircleLifetime: 1800,  // Faster fading
    baseSpawnInterval: 600,    // Faster spawning
    maxLives: 3,
    startLevel: 3,             // Start at level 3
  },
};

export const getDifficultyConfig = (difficulty: DifficultyLevel): DifficultyConfig => {
  return DIFFICULTY_PRESETS[difficulty];
};
