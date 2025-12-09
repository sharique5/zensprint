import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import { storageManager, LeaderboardEntry, SessionRecord, UserStats, StreakData } from '../utils/StorageManager';
import { THEMES } from '../utils/themes';

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface StatsScreenProps {
  onClose: () => void;
  theme: string;
}

export default function StatsScreen({ onClose, theme }: StatsScreenProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history' | 'insights'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [sessionHistory, setSessionHistory] = useState<SessionRecord[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [insights, setInsights] = useState<any>(null);
  
  const currentTheme = THEMES[theme];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [lb, sessions, stats, streakData, insightsData] = await Promise.all([
      storageManager.getLeaderboard(),
      storageManager.getSessionHistory(20),
      storageManager.getUserStats(),
      storageManager.getStreak(),
      storageManager.getPerformanceInsights(),
    ]);
    
    setLeaderboard(lb);
    setSessionHistory(sessions);
    setUserStats(stats);
    setStreak(streakData);
    setInsights(insightsData);
  };

  const shareScore = async () => {
    if (!userStats) return;
    
    const message = `🎯 ZenSprint Stats\n\n` +
      `🏆 Highest Level: ${userStats.highestLevel}\n` +
      `📊 Total Score: ${userStats.totalScore.toLocaleString()}\n` +
      `🔥 Best Combo: ${userStats.bestCombo}x\n` +
      `🎮 Games Played: ${userStats.totalGamesPlayed}\n` +
      `✨ Accuracy: ${userStats.averageAccuracy}%\n\n` +
      `Can you beat my focus? 🧘‍♂️`;
    
    try {
      await Share.share({ message });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderLeaderboard = () => (
    <ScrollView style={styles.tabContent}>
      {leaderboard.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            No scores yet. Play a game to get started!
          </Text>
        </View>
      ) : (
        leaderboard.map((entry, index) => (
          <View key={index} style={[styles.leaderboardItem, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.rankContainer}>
              <Text style={[styles.rank, { color: index < 3 ? '#FFD700' : currentTheme.text }]}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </Text>
            </View>
            <View style={styles.leaderboardInfo}>
              <Text style={[styles.leaderboardScore, { color: currentTheme.text }]}>
                {entry.score.toLocaleString()}
              </Text>
              <Text style={[styles.leaderboardDetails, { color: currentTheme.textSecondary }]}>
                Level {entry.level} • {entry.difficulty} • {entry.maxCombo}x combo
              </Text>
              <Text style={[styles.leaderboardDate, { color: currentTheme.textSecondary }]}>
                {formatDate(entry.date)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView style={styles.tabContent}>
      {sessionHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            No session history yet.
          </Text>
        </View>
      ) : (
        sessionHistory.map((session) => (
          <View key={session.id} style={[styles.historyItem, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyScore, { color: currentTheme.accent }]}>
                {session.score.toLocaleString()}
              </Text>
              <Text style={[styles.historyDate, { color: currentTheme.textSecondary }]}>
                {formatDate(session.date)}
              </Text>
            </View>
            <View style={styles.historyStats}>
              <Text style={[styles.historyDetail, { color: currentTheme.text }]}>
                Level {session.level} • {session.difficulty}
              </Text>
              <Text style={[styles.historyDetail, { color: currentTheme.text }]}>
                Accuracy: {session.accuracy}% • {session.maxCombo}x combo
              </Text>
              <Text style={[styles.historyDetail, { color: currentTheme.textSecondary }]}>
                {session.correctTaps} correct, {session.missedTaps} missed • {session.duration}s
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );

  const renderInsights = () => (
    <ScrollView style={styles.tabContent}>
      {!userStats || userStats.totalGamesPlayed === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: currentTheme.textSecondary }]}>
            Play more games to unlock insights!
          </Text>
        </View>
      ) : (
        <>
          {/* Streak Card */}
          {streak && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
              <Text style={[styles.insightTitle, { color: currentTheme.text }]}>🔥 Current Streak</Text>
              <Text style={[styles.insightValue, { color: '#FFD700' }]}>
                {streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}
              </Text>
              <Text style={[styles.insightSubtext, { color: currentTheme.textSecondary }]}>
                Longest: {streak.longestStreak} days
              </Text>
            </View>
          )}

          {/* Overall Stats */}
          <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
            <Text style={[styles.insightTitle, { color: currentTheme.text }]}>📊 Overall Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                  {userStats.totalGamesPlayed}
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Games</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                  {userStats.highestLevel}
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Best Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                  {userStats.bestCombo}x
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Best Combo</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: currentTheme.accent }]}>
                  {userStats.averageAccuracy}%
                </Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Accuracy</Text>
              </View>
            </View>
          </View>

          {/* Performance Trend */}
          {insights && userStats.totalGamesPlayed >= 5 && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Text style={[styles.insightTitle, { color: currentTheme.text }]}>📈 Performance Trend</Text>
              <Text style={[styles.trendText, { 
                color: insights.trend === 'improving' ? '#4CAF50' : 
                       insights.trend === 'declining' ? '#F44336' : currentTheme.text 
              }]}>
                {insights.trend === 'improving' && `⬆️ Improving by ${insights.trendPercentage}%`}
                {insights.trend === 'declining' && `⬇️ Down ${insights.trendPercentage}%`}
                {insights.trend === 'steady' && '➡️ Steady performance'}
              </Text>
              <Text style={[styles.insightSubtext, { color: currentTheme.textSecondary }]}>
                Recent avg: {insights.recentAvgScore} points ({insights.recentAvgAccuracy}% accuracy)
              </Text>
            </View>
          )}

          {/* Best Time of Day */}
          {insights && (
            <View style={[styles.insightCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Text style={[styles.insightTitle, { color: currentTheme.text }]}>⏰ Best Performance</Text>
              <Text style={[styles.insightValue, { color: currentTheme.accent }]}>
                {insights.bestTimeOfDay === 'morning' && '🌅 Morning Sessions'}
                {insights.bestTimeOfDay === 'afternoon' && '☀️ Afternoon Sessions'}
                {insights.bestTimeOfDay === 'evening' && '🌙 Evening Sessions'}
              </Text>
              <Text style={[styles.insightSubtext, { color: currentTheme.textSecondary }]}>
                You perform best during {insights.bestTimeOfDay}
              </Text>
            </View>
          )}

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: currentTheme.accent }]}
            onPress={shareScore}
          >
            <Text style={[styles.shareButtonText, { color: currentTheme.background }]}>
              Share Your Stats 🚀
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Stats & Insights</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && { borderBottomColor: currentTheme.accent }]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'leaderboard' ? currentTheme.accent : currentTheme.textSecondary }
          ]}>
            🏆 Top Scores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: currentTheme.accent }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'history' ? currentTheme.accent : currentTheme.textSecondary }
          ]}>
            📜 History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'insights' && { borderBottomColor: currentTheme.accent }]}
          onPress={() => setActiveTab('insights')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'insights' ? currentTheme.accent : currentTheme.textSecondary }
          ]}>
            💡 Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'leaderboard' && renderLeaderboard()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'insights' && renderInsights()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  // Leaderboard styles
  leaderboardItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  rankContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardScore: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leaderboardDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  leaderboardDate: {
    fontSize: 12,
  },
  // History styles
  historyItem: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyScore: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  historyDate: {
    fontSize: 12,
  },
  historyStats: {
    gap: 4,
  },
  historyDetail: {
    fontSize: 14,
  },
  // Insights styles
  insightCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  insightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  insightSubtext: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 10,
  },
  statItem: {
    width: '45%',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  trendText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  shareButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
