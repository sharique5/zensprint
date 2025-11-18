// Simple sound effects using haptics
// For a zen game, subtle haptic feedback is often preferred over audio
import * as Haptics from 'expo-haptics';

class SoundManager {
  private enabled: boolean = true;

  async playCorrectTap() {
    if (!this.enabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async playWrongTap() {
    if (!this.enabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  async playLevelComplete() {
    if (!this.enabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async playGameOver() {
    if (!this.enabled) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();

