import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const KEYS = {
  LEADERBOARD: '@zensprint_leaderboard',
  SESSION_HISTORY: '@zensprint_sessions',
  USER_STATS: '@zensprint_stats',
  STREAK: '@zensprint_streak',
};

// Types
export interface LeaderboardEntry {
  score: number;
  level: number;
  date: string;
  difficulty: 'easy' | 'medium' | 'hard';
  maxCombo: number;
}

export interface SessionRecord {
  id: string;
  score: number;
  level: number;
  difficulty: 'easy' | 'medium' | 'hard';
  correctTaps: number;
  missedTaps: number;
  maxCombo: number;
  duration: number; // seconds played
  accuracy: number; // percentage
  date: string;
  timestamp: number;
}

export interface UserStats {
  totalGamesPlayed: number;
  totalScore: number;
  highestLevel: number;
  bestCombo: number;
  totalCorrectTaps: number;
  totalMissedTaps: number;
  averageAccuracy: number;
  favoriteTime: string; // 'morning', 'afternoon', 'evening'
  lastPlayedDate: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
}

class StorageManager {
  // === LEADERBOARD ===
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LEADERBOARD);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  }

  async addToLeaderboard(entry: LeaderboardEntry): Promise<void> {
    try {
      const leaderboard = await this.getLeaderboard();
      leaderboard.push(entry);
      
      // Sort by score (descending) and keep top 10
      leaderboard.sort((a, b) => b.score - a.score);
      const top10 = leaderboard.slice(0, 10);
      
      await AsyncStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(top10));
    } catch (error) {
      console.error('Error saving to leaderboard:', error);
    }
  }

  async isTopScore(score: number): Promise<boolean> {
    const leaderboard = await this.getLeaderboard();
    if (leaderboard.length < 10) return true;
    return score > leaderboard[leaderboard.length - 1].score;
  }

  // === SESSION HISTORY ===
  async getSessionHistory(limit: number = 50): Promise<SessionRecord[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SESSION_HISTORY);
      const sessions: SessionRecord[] = data ? JSON.parse(data) : [];
      return sessions.slice(0, limit);
    } catch (error) {
      console.error('Error loading session history:', error);
      return [];
    }
  }

  async addSession(session: SessionRecord): Promise<void> {
    try {
      const history = await this.getSessionHistory(100);
      history.unshift(session); // Add to beginning
      
      // Keep last 100 sessions
      const trimmed = history.slice(0, 100);
      
      await AsyncStorage.setItem(KEYS.SESSION_HISTORY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  // === USER STATS ===
  async getUserStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_STATS);
      return data ? JSON.parse(data) : this.getDefaultStats();
    } catch (error) {
      console.error('Error loading user stats:', error);
      return this.getDefaultStats();
    }
  }

  async updateUserStats(session: SessionRecord): Promise<void> {
    try {
      const stats = await this.getUserStats();
      
      stats.totalGamesPlayed += 1;
      stats.totalScore += session.score;
      stats.highestLevel = Math.max(stats.highestLevel, session.level);
      stats.bestCombo = Math.max(stats.bestCombo, session.maxCombo);
      stats.totalCorrectTaps += session.correctTaps;
      stats.totalMissedTaps += session.missedTaps;
      stats.lastPlayedDate = session.date;
      
      // Recalculate average accuracy
      const totalTaps = stats.totalCorrectTaps + stats.totalMissedTaps;
      stats.averageAccuracy = totalTaps > 0 
        ? Math.round((stats.totalCorrectTaps / totalTaps) * 100)
        : 0;
      
      // Determine favorite time of day
      stats.favoriteTime = await this.calculateFavoriteTime();
      
      await AsyncStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  private getDefaultStats(): UserStats {
    return {
      totalGamesPlayed: 0,
      totalScore: 0,
      highestLevel: 1,
      bestCombo: 0,
      totalCorrectTaps: 0,
      totalMissedTaps: 0,
      averageAccuracy: 0,
      favoriteTime: 'morning',
      lastPlayedDate: new Date().toISOString(),
    };
  }

  private async calculateFavoriteTime(): Promise<string> {
    const sessions = await this.getSessionHistory(20);
    const timeScores = { morning: 0, afternoon: 0, evening: 0 };
    
    sessions.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      if (hour >= 5 && hour < 12) timeScores.morning += session.score;
      else if (hour >= 12 && hour < 18) timeScores.afternoon += session.score;
      else timeScores.evening += session.score;
    });
    
    const best = Object.entries(timeScores).reduce((a, b) => a[1] > b[1] ? a : b);
    return best[0];
  }

  // === STREAK TRACKING ===
  async getStreak(): Promise<StreakData> {
    try {
      const data = await AsyncStorage.getItem(KEYS.STREAK);
      return data ? JSON.parse(data) : this.getDefaultStreak();
    } catch (error) {
      console.error('Error loading streak:', error);
      return this.getDefaultStreak();
    }
  }

  async updateStreak(): Promise<StreakData> {
    try {
      const streak = await this.getStreak();
      const today = new Date().toDateString();
      const lastPlayed = new Date(streak.lastPlayedDate).toDateString();
      
      if (today === lastPlayed) {
        // Already played today, no change
        return streak;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (lastPlayed === yesterdayStr) {
        // Consecutive day - increment streak
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      } else {
        // Streak broken - reset to 1
        streak.currentStreak = 1;
      }
      
      streak.lastPlayedDate = new Date().toISOString();
      await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streak));
      
      return streak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return this.getDefaultStreak();
    }
  }

  private getDefaultStreak(): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: new Date().toISOString(),
    };
  }

  // === INSIGHTS ===
  async getPerformanceInsights(): Promise<{
    trend: 'improving' | 'steady' | 'declining';
    trendPercentage: number;
    bestTimeOfDay: string;
    recentAvgScore: number;
    recentAvgAccuracy: number;
  }> {
    try {
      const sessions = await this.getSessionHistory(20);
      if (sessions.length < 5) {
        return {
          trend: 'steady',
          trendPercentage: 0,
          bestTimeOfDay: 'morning',
          recentAvgScore: 0,
          recentAvgAccuracy: 0,
        };
      }
      
      // Calculate recent vs older performance
      const recent = sessions.slice(0, 5);
      const older = sessions.slice(5, 10);
      
      const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
      const olderAvg = older.length > 0 
        ? older.reduce((sum, s) => sum + s.score, 0) / older.length
        : recentAvg;
      
      const change = recentAvg - olderAvg;
      const changePercent = olderAvg > 0 ? Math.round((change / olderAvg) * 100) : 0;
      
      let trend: 'improving' | 'steady' | 'declining' = 'steady';
      if (changePercent > 10) trend = 'improving';
      else if (changePercent < -10) trend = 'declining';
      
      // Calculate recent accuracy
      const recentAccuracy = recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
      
      // Determine best time
      const timeScores = { morning: [] as number[], afternoon: [] as number[], evening: [] as number[] };
      sessions.forEach(session => {
        const hour = new Date(session.timestamp).getHours();
        if (hour >= 5 && hour < 12) timeScores.morning.push(session.score);
        else if (hour >= 12 && hour < 18) timeScores.afternoon.push(session.score);
        else timeScores.evening.push(session.score);
      });
      
      const timeAvgs = {
        morning: timeScores.morning.length > 0 
          ? timeScores.morning.reduce((a, b) => a + b, 0) / timeScores.morning.length 
          : 0,
        afternoon: timeScores.afternoon.length > 0 
          ? timeScores.afternoon.reduce((a, b) => a + b, 0) / timeScores.afternoon.length 
          : 0,
        evening: timeScores.evening.length > 0 
          ? timeScores.evening.reduce((a, b) => a + b, 0) / timeScores.evening.length 
          : 0,
      };
      
      const bestTime = Object.entries(timeAvgs).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      return {
        trend,
        trendPercentage: Math.abs(changePercent),
        bestTimeOfDay: bestTime,
        recentAvgScore: Math.round(recentAvg),
        recentAvgAccuracy: Math.round(recentAccuracy),
      };
    } catch (error) {
      console.error('Error calculating insights:', error);
      return {
        trend: 'steady',
        trendPercentage: 0,
        bestTimeOfDay: 'morning',
        recentAvgScore: 0,
        recentAvgAccuracy: 0,
      };
    }
  }

  // === UTILITIES ===
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const storageManager = new StorageManager();
