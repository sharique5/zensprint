import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Circle, GameState, COLORS, FOCUS_COLORS, GAME_CONFIG } from '../types/game';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeRemaining: GAME_CONFIG.sessionDuration,
    isPlaying: false,
    missedTaps: 0,
    correctTaps: 0,
    focusColor: COLORS.focus,
    lives: GAME_CONFIG.maxLives,
    level: 1,
    totalScore: 0,
  });

  const [circles, setCircles] = useState<Circle[]>([]);

  // Start game (or level)
  const startGame = (continueLevel = false) => {
    // Pick a random focus color for this session
    const randomFocusColor = FOCUS_COLORS[Math.floor(Math.random() * FOCUS_COLORS.length)];
    
    setGameState(prev => ({
      score: 0,
      timeRemaining: GAME_CONFIG.sessionDuration,
      isPlaying: true,
      missedTaps: 0,
      correctTaps: 0,
      focusColor: randomFocusColor,
      lives: continueLevel ? prev.lives : GAME_CONFIG.maxLives,
      level: continueLevel ? prev.level : 1,
      totalScore: continueLevel ? prev.totalScore : 0,
    }));
    setCircles([]);
  };

  // Advance to next level
  const nextLevel = () => {
    const randomFocusColor = FOCUS_COLORS[Math.floor(Math.random() * FOCUS_COLORS.length)];
    
    setGameState(prev => ({
      ...prev,
      score: 0,
      timeRemaining: GAME_CONFIG.sessionDuration,
      isPlaying: true,
      missedTaps: 0,
      correctTaps: 0,
      focusColor: randomFocusColor,
      level: prev.level + 1,
      lives: GAME_CONFIG.maxLives, // Restore lives for next level
    }));
    setCircles([]);
  };

  // End game
  const endGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    setCircles([]);
  };

  // Timer countdown
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          // Level complete! Add score to total
          const newTotalScore = prev.totalScore + prev.score;
          setGameState(current => ({ 
            ...current, 
            timeRemaining: 0, 
            isPlaying: false,
            totalScore: newTotalScore,
          }));
          return { ...prev, timeRemaining: 0, isPlaying: false, totalScore: newTotalScore };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isPlaying]);

  // Spawn circles
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const difficulty = GAME_CONFIG.getDifficulty(gameState.level);

    const spawner = setInterval(() => {
      if (circles.length >= GAME_CONFIG.maxCircles) return;

      // Get all available colors (focus color + distractors)
      const allColors = FOCUS_COLORS.filter(color => color !== gameState.focusColor);
      allColors.push(gameState.focusColor); // Add focus color to the pool
      
      // Randomly pick a color (with higher chance for focus color)
      const shouldBeFocusColor = Math.random() > 0.6; // 40% chance for focus color
      const color = shouldBeFocusColor 
        ? gameState.focusColor 
        : allColors[Math.floor(Math.random() * (allColors.length - 1))];
      
      const newCircle: Circle = {
        id: Date.now().toString() + Math.random(),
        color: color,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 300) + 150,
        radius: GAME_CONFIG.circleRadius,
        createdAt: Date.now(),
        lifetime: difficulty.circleLifetime,
      };

      setCircles(prev => [...prev, newCircle]);
    }, difficulty.spawnInterval);

    return () => clearInterval(spawner);
  }, [gameState.isPlaying, gameState.focusColor, gameState.level, circles.length]);

  // Remove expired circles
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const remover = setInterval(() => {
      const now = Date.now();
      setCircles(prev => {
        const filtered = prev.filter(circle => {
          const age = now - circle.createdAt;
          if (age > circle.lifetime) {
            // Circle expired - lose a life if it was focus color
            if (circle.color === gameState.focusColor) {
              setGameState(gs => {
                const newLives = gs.lives - 1;
                const newMisses = gs.missedTaps + 1;
                if (newLives <= 0) {
                  endGame();
                }
                return { ...gs, missedTaps: newMisses, lives: newLives };
              });
            }
            return false;
          }
          return true;
        });
        return filtered;
      });
    }, 100);

    return () => clearInterval(remover);
  }, [gameState.isPlaying, gameState.focusColor]);

  // Handle circle tap
  const handleCircleTap = (circle: Circle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const difficulty = GAME_CONFIG.getDifficulty(gameState.level);
    
    if (circle.color === gameState.focusColor) {
      // Correct tap - score multiplied by level
      setGameState(prev => ({
        ...prev,
        score: prev.score + (10 * difficulty.scoreMultiplier),
        correctTaps: prev.correctTaps + 1,
      }));
    } else {
      // Wrong tap - lose a life
      setGameState(prev => {
        const newLives = prev.lives - 1;
        if (newLives <= 0) {
          endGame();
        }
        return {
          ...prev,
          score: Math.max(0, prev.score - 5),
          missedTaps: prev.missedTaps + 1,
          lives: newLives,
        };
      });
    }

    // Remove tapped circle
    setCircles(prev => prev.filter(c => c.id !== circle.id));
  };

  return (
    <View style={styles.container}>
      {/* Header - only show during gameplay */}
      {gameState.isPlaying && (
        <View style={styles.header}>
          <View>
            <Text style={styles.score}>Score: {gameState.score}</Text>
            <Text style={styles.levelText}>Level {gameState.level}</Text>
          </View>
          <View style={styles.livesContainer}>
            {[...Array(GAME_CONFIG.maxLives)].map((_, index) => (
              <Text
                key={index}
                style={[
                  styles.heart,
                  { opacity: index < gameState.lives ? 1 : 0.2 },
                ]}
              >
                ♥
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Countdown Timer */}
      {gameState.isPlaying && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{gameState.timeRemaining}</Text>
          <Text style={styles.timerLabel}>seconds</Text>
        </View>
      )}

      {/* Focus color indicator */}
      {gameState.isPlaying && (
        <View style={styles.focusIndicator}>
          <Text style={styles.focusText}>Tap this color:</Text>
          <View
            style={[
              styles.focusColorBox,
              { backgroundColor: gameState.focusColor },
            ]}
          />
        </View>
      )}

      {/* Game area */}
      <View style={styles.gameArea}>
        {gameState.isPlaying ? (
          circles.map(circle => {
            const age = Date.now() - circle.createdAt;
            const opacity = Math.max(0, 1 - age / circle.lifetime);

            return (
              <Pressable
                key={circle.id}
                onPress={() => handleCircleTap(circle)}
                style={[
                  styles.circle,
                  {
                    left: circle.x,
                    top: circle.y,
                    width: circle.radius * 2,
                    height: circle.radius * 2,
                    borderRadius: circle.radius,
                    backgroundColor: circle.color,
                    opacity,
                  },
                ]}
              />
            );
          })
        ) : (
          <View style={styles.menuContainer}>
            {gameState.timeRemaining === GAME_CONFIG.sessionDuration ? (
              // Home screen - before game starts
              <>
                <Text style={styles.title}>ZenSprint</Text>
                <Text style={styles.subtitle}>Focus Training Tap Game</Text>
              </>
            ) : gameState.lives <= 0 ? (
              // Game Over - lost all lives
              <View style={styles.gameOverContainer}>
                <Text style={styles.gameOverText}>Game Over</Text>
                <Text style={styles.gameOverSubtext}>Mind Drifted...</Text>
                <Text style={styles.finalScore}>{gameState.totalScore + gameState.score}</Text>
                <Text style={styles.scoreLabel}>Total Score</Text>
                <Text style={styles.levelText}>Reached Level {gameState.level}</Text>
                <Text style={styles.stats}>
                  Correct: {gameState.correctTaps} | Missed: {gameState.missedTaps}
                </Text>
              </View>
            ) : (
              // Level Complete - time ran out with lives remaining
              <View style={styles.gameOverContainer}>
                <Text style={styles.levelCompleteText}>Level {gameState.level} Complete! ✨</Text>
                <Text style={styles.finalScore}>{gameState.score}</Text>
                <Text style={styles.scoreLabel}>Level Score</Text>
                <Text style={styles.totalScoreText}>Total: {gameState.totalScore + gameState.score}</Text>
                <Text style={styles.stats}>
                  Correct: {gameState.correctTaps} | Missed: {gameState.missedTaps}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => gameState.lives <= 0 || gameState.timeRemaining === GAME_CONFIG.sessionDuration ? startGame() : nextLevel()}
            >
              <Text style={styles.startButtonText}>
                {gameState.timeRemaining === GAME_CONFIG.sessionDuration
                  ? 'Start Game'
                  : gameState.lives <= 0
                  ? 'Play Again'
                  : `Next Level ${gameState.level + 1}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
  },
  score: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  heart: {
    fontSize: 24,
    color: '#FF6B6B',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.focus,
  },
  timerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: -5,
  },
  timer: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  misses: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  focusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  focusText: {
    color: COLORS.text,
    fontSize: 16,
  },
  focusColorBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 40,
    textAlign: 'center',
  },
  gameOverContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  gameOverText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  gameOverSubtext: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  levelCompleteText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.focus,
    marginBottom: 20,
  },
  finalScore: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 15,
  },
  totalScoreText: {
    fontSize: 18,
    color: COLORS.focus,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stats: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  startButton: {
    backgroundColor: COLORS.focus,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
  },
  startButtonText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
