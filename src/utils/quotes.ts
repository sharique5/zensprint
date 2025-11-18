export const FOCUS_QUOTES = [
  "Breathe in clarity, breathe out distraction.",
  "Every tap is a moment of presence.",
  "Focus is the art of knowing what to ignore.",
  "In stillness, the mind finds its sharpest edge.",
  "Small moments of focus create lasting calm.",
  "Your attention is your greatest gift.",
  "Practice patience, one tap at a time.",
  "Clarity comes from consistent practice.",
  "The journey to focus begins with a single breath.",
  "Let go of perfection, embrace the present.",
  "Your mind is powerful when it's still.",
  "Every moment is a chance to refocus.",
  "Calm is a superpower you can cultivate.",
  "Focus flows when you stop forcing it.",
  "Be here now, fully and completely.",
  "The present moment is all you need.",
  "Gentle focus, powerful results.",
  "Your best work happens in the quiet.",
  "Distraction is temporary, focus is forever.",
  "One breath, one tap, one moment.",
];

export const getRandomQuote = (): string => {
  return FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)];
};

export const getTimeBasedQuote = (): string => {
  const hour = new Date().getHours();
  
  const morningQuotes = [
    "Start your day with focused intention.",
    "Morning clarity sets the tone for the day.",
    "A calm morning creates a productive day.",
  ];
  
  const afternoonQuotes = [
    "Refresh your focus, renew your energy.",
    "Midday reset: breathe and refocus.",
    "Take a moment to center yourself.",
  ];
  
  const eveningQuotes = [
    "Wind down with gentle practice.",
    "Evening calm prepares tomorrow's clarity.",
    "Let go of the day, one tap at a time.",
  ];
  
  if (hour >= 5 && hour < 12) {
    return morningQuotes[Math.floor(Math.random() * morningQuotes.length)];
  } else if (hour >= 12 && hour < 18) {
    return afternoonQuotes[Math.floor(Math.random() * afternoonQuotes.length)];
  } else {
    return eveningQuotes[Math.floor(Math.random() * eveningQuotes.length)];
  }
};
