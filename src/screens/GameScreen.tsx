import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Circle, GameState, COLORS, GAME_CONFIG } from '../types/game';

const { width, height } = Dimensions.get('window');

export default function GameScreen() {
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    timeRemaining: GAME_CONFIG.sessionDuration,
    isPlaying: false,
    missedTaps: 0,
    correctTaps: 0,
    focusColor: COLORS.focus,
  });

  const [circles, setCircles] = useState<Circle[]>([]);

  // Start game
  const startGame = () => {
    setGameState({
      score: 0,
      timeRemaining: GAME_CONFIG.sessionDuration,
      isPlaying: true,
      missedTaps: 0,
      correctTaps: 0,
      focusColor: COLORS.focus,
    });
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
          endGame();
          return { ...prev, timeRemaining: 0, isPlaying: false };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isPlaying]);

  // Spawn circles
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const spawner = setInterval(() => {
      if (circles.length >= GAME_CONFIG.maxCircles) return;

      const colors = [
        COLORS.focus,
        COLORS.distractor1,
        COLORS.distractor2,
        COLORS.distractor3,
      ];
      
      const newCircle: Circle = {
        id: Date.now().toString() + Math.random(),
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 300) + 150,
        radius: GAME_CONFIG.circleRadius,
        createdAt: Date.now(),
        lifetime: GAME_CONFIG.circleLifetime,
      };

      setCircles(prev => [...prev, newCircle]);
    }, GAME_CONFIG.spawnInterval);

    return () => clearInterval(spawner);
  }, [gameState.isPlaying, circles.length]);

  // Remove expired circles
  useEffect(() => {
    if (!gameState.isPlaying) return;

    const remover = setInterval(() => {
      const now = Date.now();
      setCircles(prev => {
        const filtered = prev.filter(circle => {
          const age = now - circle.createdAt;
          if (age > circle.lifetime) {
            // Circle expired - count as miss if it was focus color
            if (circle.color === gameState.focusColor) {
              setGameState(gs => {
                const newMisses = gs.missedTaps + 1;
                if (newMisses >= GAME_CONFIG.maxMisses) {
                  endGame();
                }
                return { ...gs, missedTaps: newMisses };
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
    
    if (circle.color === gameState.focusColor) {
      // Correct tap
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10,
        correctTaps: prev.correctTaps + 1,
      }));
    } else {
      // Wrong tap
      setGameState(prev => ({
        ...prev,
        score: Math.max(0, prev.score - 5),
        missedTaps: prev.missedTaps + 1,
      }));
    }

    // Remove tapped circle
    setCircles(prev => prev.filter(c => c.id !== circle.id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.score}>Score: {gameState.score}</Text>
        <Text style={styles.timer}>{gameState.timeRemaining}s</Text>
        <Text style={styles.misses}>
          Misses: {gameState.missedTaps}/{GAME_CONFIG.maxMisses}
        </Text>
      </View>

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
            <Text style={styles.title}>ZenSprint</Text>
            <Text style={styles.subtitle}>Focus Training Tap Game</Text>
            
            {gameState.timeRemaining === 0 && (
              <View style={styles.gameOverContainer}>
                <Text style={styles.gameOverText}>Session Complete!</Text>
                <Text style={styles.finalScore}>Final Score: {gameState.score}</Text>
                <Text style={styles.stats}>
                  Correct: {gameState.correctTaps} | Missed: {gameState.missedTaps}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>
                {gameState.timeRemaining === 0 ? 'Play Again' : 'Start Session'}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  score: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.focus,
    marginBottom: 15,
  },
  finalScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
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
