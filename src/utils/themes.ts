export interface Theme {
  name: string;
  background: string;
  text: string;
  textSecondary: string;
  accent: string;
  focusColors: string[];
}

export const THEMES: { [key: string]: Theme } = {
  midnight: {
    name: 'Midnight',
    background: '#0a0a0a',
    text: '#ffffff',
    textSecondary: '#888888',
    accent: '#4ECDC4',
    focusColors: [
      '#4ECDC4', '#FF6B6B', '#FFE66D', '#A8E6CF',
      '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3',
    ],
  },
  ocean: {
    name: 'Ocean',
    background: '#0a1929',
    text: '#E3F2FD',
    textSecondary: '#90CAF9',
    accent: '#00B4D8',
    focusColors: [
      '#00B4D8', '#0077B6', '#90E0EF', '#48CAE4',
      '#ADE8F4', '#CAF0F8', '#023E8A', '#03045E',
    ],
  },
  forest: {
    name: 'Forest',
    background: '#1a2f1a',
    text: '#E8F5E9',
    textSecondary: '#81C784',
    accent: '#66BB6A',
    focusColors: [
      '#66BB6A', '#4CAF50', '#81C784', '#A5D6A7',
      '#C8E6C9', '#388E3C', '#2E7D32', '#1B5E20',
    ],
  },
  sunset: {
    name: 'Sunset',
    background: '#2d1b2e',
    text: '#FFF3E0',
    textSecondary: '#FFB74D',
    accent: '#FF7043',
    focusColors: [
      '#FF7043', '#FFA726', '#FFB74D', '#FFCC80',
      '#FFE0B2', '#FF6F00', '#F57C00', '#E65100',
    ],
  },
  lavender: {
    name: 'Lavender',
    background: '#1a1625',
    text: '#F3E5F5',
    textSecondary: '#CE93D8',
    accent: '#BA68C8',
    focusColors: [
      '#BA68C8', '#AB47BC', '#CE93D8', '#E1BEE7',
      '#F3E5F5', '#8E24AA', '#7B1FA2', '#6A1B9A',
    ],
  },
};

export const getTheme = (themeName: string): Theme => {
  return THEMES[themeName] || THEMES.midnight;
};

export const getThemeNames = (): string[] => {
  return Object.keys(THEMES);
};
