import { Audio } from 'expo-av';

class MusicManager {
  private sound: Audio.Sound | null = null;
  private enabled: boolean = true;
  private isPlaying: boolean = false;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.log('Error initializing audio:', error);
    }
  }

  async playBackgroundMusic() {
    if (!this.enabled || this.isPlaying) return;

    try {
      // For now, using a looping sine wave as placeholder
      // In production, you'd load actual ambient music files
      this.isPlaying = true;
      console.log('Background music would play here');
    } catch (error) {
      console.log('Error playing music:', error);
    }
  }

  async stopBackgroundMusic() {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
      } catch (error) {
        console.log('Error stopping music:', error);
      }
    }
  }

  async pauseBackgroundMusic() {
    if (this.sound && this.isPlaying) {
      try {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      } catch (error) {
        console.log('Error pausing music:', error);
      }
    }
  }

  async resumeBackgroundMusic() {
    if (this.sound && !this.isPlaying && this.enabled) {
      try {
        await this.sound.playAsync();
        this.isPlaying = true;
      } catch (error) {
        console.log('Error resuming music:', error);
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.isPlaying) {
      this.stopBackgroundMusic();
    }
  }

  isEnabled() {
    return this.enabled;
  }
}

export const musicManager = new MusicManager();
