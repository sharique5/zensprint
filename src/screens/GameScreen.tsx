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
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Circle, GameState, COLORS, FOCUS_COLORS, GAME_CONFIG } from '../types/game';
import { soundManager } from '../utils/SoundManager';
import { getTimeBasedQuote } from '../utils/quotes';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

// Animated Circle Component
const AnimatedCircle: React.FC<{
  circle: Circle;
  onPress: (circle: Circle) => void;
  focusColor: string;
}> = React.memo(({ circle, onPress, focusColor }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in and scale up on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for focus color circles
    if (circle.color === focusColor) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, []);

  // Calculate opacity based on lifetime
  const age = Date.now() - circle.createdAt;
  const lifetimeProgress = age / circle.lifetime;
  const opacity = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(0.3, 1 - lifetimeProgress)],
  });

  return (
    <Animated.View
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
          transform: [
            { scale: Animated.multiply(scaleAnim, pulseAnim) },
          ],
        },
      ]}
    >
      <Pressable
        onPress={() => onPress(circle)}
        style={styles.circlePressable}
      />
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Only re-render if circle ID changes
  return prevProps.circle.id === nextProps.circle.id;
});

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
    combo: 0,
    maxCombo: 0,
  });

  const [circles, setCircles] = useState<Circle[]>([]);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [dailyQuote] = useState<string>(getTimeBasedQuote());
  const flashAnim = React.useRef(new Animated.Value(0)).current;

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
      combo: 0,
      maxCombo: continueLevel ? prev.maxCombo : 0,
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
    soundManager.playGameOver();
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
          soundManager.playLevelComplete();
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
    const difficulty = GAME_CONFIG.getDifficulty(gameState.level);
    
    if (circle.color === gameState.focusColor) {
      // Correct tap - success feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      soundManager.playCorrectTap();
      setFlashColor('#4ECDC4'); // Teal flash
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setFlashColor(null));
      
      setGameState(prev => ({
        ...prev,
        score: prev.score + (10 * difficulty.scoreMultiplier) + (prev.combo * 2),
        correctTaps: prev.correctTaps + 1,
        combo: prev.combo + 1,
        maxCombo: Math.max(prev.combo + 1, prev.maxCombo),
      }));
    } else {
      // Wrong tap - error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      soundManager.playWrongTap();
      setFlashColor('#FF6B6B'); // Red flash
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.4,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setFlashColor(null));
      
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
          combo: 0,
        };
      });
    }

    // Remove tapped circle
    setCircles(prev => prev.filter(c => c.id !== circle.id));
  };

  return (
    <View style={styles.container}>
      {/* Flash overlay for feedback */}
      {flashColor && (
        <Animated.View
          style={[
            styles.flashOverlay,
            {
              backgroundColor: flashColor,
              opacity: flashAnim,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Header - only show during gameplay */}
      {gameState.isPlaying && (
        <View style={styles.header}>
          <View>
            <Text style={styles.score}>Score: {gameState.score}</Text>
            <Text style={styles.levelText}>Level {gameState.level}</Text>
          </View>
          {gameState.combo > 2 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboText}>{gameState.combo}x</Text>
              <Text style={styles.comboLabel}>COMBO</Text>
            </View>
          )}
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
          circles.map(circle => (
            <AnimatedCircle
              key={circle.id}
              circle={circle}
              onPress={handleCircleTap}
              focusColor={gameState.focusColor}
            />
          ))
        ) : (
          <View style={styles.menuContainer}>
            {gameState.timeRemaining === GAME_CONFIG.sessionDuration ? (
              // Home screen - before game starts
              <>
                <Text style={styles.title}>ZenSprint</Text>
                <Text style={styles.subtitle}>Focus Training Tap Game</Text>
                <View style={styles.quoteContainer}>
                  <Text style={styles.quoteText}>"{dailyQuote}"</Text>
                </View>
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
                {gameState.maxCombo > 5 && (
                  <Text style={styles.achievementText}>
                    🔥 Best Combo: {gameState.maxCombo}x
                  </Text>
                )}
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
                {gameState.maxCombo > 5 && (
                  <Text style={styles.achievementText}>
                    🔥 Best Combo: {gameState.maxCombo}x
                  </Text>
                )}
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
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
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
  comboContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  comboText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  comboLabel: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  circlePressable: {
    width: '100%',
    height: '100%',
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
  quoteContainer: {
    marginTop: 30,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
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
  achievementText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 10,
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
