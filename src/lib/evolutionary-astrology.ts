// Evolutionary Astrology and Tropical Astrology System
// Aligned with Galactic Center at 27° Sagittarius

export interface EvolutionaryProfile {
  sunSign: string;
  moonSign?: string;
  risingSign?: string;
  northNode?: string;
  southNode?: string;
  plutoSign?: string;
  galacticAlignment: number; // Degrees from Galactic Center
  evolutionaryTheme: string;
  karmaticPattern: string;
  soulPurpose: string;
  gardeningMission: string;
}

export interface PlanetaryPosition {
  planet: string;
  sign: string;
  degree: number;
  retrograde: boolean;
  house?: number;
}

export interface EvolutionaryTransit {
  planet: string;
  currentSign: string;
  degree: number;
  evolutionarySignificance: string;
  gardeningGuidance: string;
  karmaticLesson: string;
  galacticInfluence: string;
}

// Galactic Center position in tropical zodiac
export const GALACTIC_CENTER = {
  sign: 'Sagittarius',
  degree: 27,
  minute: 0,
  absoluteDegree: 267 // 9 signs * 30° + 27°
};

// Tropical zodiac boundaries (based on equinoxes/solstices)
export const TROPICAL_ZODIAC = {
  'Aries': { start: 0, end: 30, element: 'Fire', modality: 'Cardinal' },
  'Taurus': { start: 30, end: 60, element: 'Earth', modality: 'Fixed' },
  'Gemini': { start: 60, end: 90, element: 'Air', modality: 'Mutable' },
  'Cancer': { start: 90, end: 120, element: 'Water', modality: 'Cardinal' },
  'Leo': { start: 120, end: 150, element: 'Fire', modality: 'Fixed' },
  'Virgo': { start: 150, end: 180, element: 'Earth', modality: 'Mutable' },
  'Libra': { start: 180, end: 210, element: 'Air', modality: 'Cardinal' },
  'Scorpio': { start: 210, end: 240, element: 'Water', modality: 'Fixed' },
  'Sagittarius': { start: 240, end: 270, element: 'Fire', modality: 'Mutable' },
  'Capricorn': { start: 270, end: 300, element: 'Earth', modality: 'Cardinal' },
  'Aquarius': { start: 300, end: 330, element: 'Air', modality: 'Fixed' },
  'Pisces': { start: 330, end: 360, element: 'Water', modality: 'Mutable' }
};

// Evolutionary astrology themes for each sign
export const EVOLUTIONARY_THEMES = {
  'Aries': {
    theme: 'Pioneering Independence',
    soulPurpose: 'To develop courage and individual identity',
    gardeningMission: 'Pioneer new growing methods and lead by example',
    karmaticPattern: 'Learning to act without being impulsive',
    galacticLessons: 'Channel pioneering spirit toward collective garden wisdom'
  },
  'Taurus': {
    theme: 'Stabilizing Resources',
    soulPurpose: 'To create security and appreciate natural beauty',
    gardeningMission: 'Build sustainable, beautiful garden systems',
    karmaticPattern: 'Releasing attachment to material security',
    galacticLessons: 'Share abundance and stability with garden community'
  },
  'Gemini': {
    theme: 'Communicating Knowledge',
    soulPurpose: 'To gather and share information',
    gardeningMission: 'Document and teach gardening wisdom',
    karmaticPattern: 'Moving from superficial to meaningful communication',
    galacticLessons: 'Connect diverse gardening communities through knowledge'
  },
  'Cancer': {
    theme: 'Nurturing Emotional Security',
    soulPurpose: 'To provide care and emotional nourishment',
    gardeningMission: 'Create healing gardens that nurture community',
    karmaticPattern: 'Balancing self-care with caring for others',
    galacticLessons: 'Nurture collective emotional wellbeing through garden spaces'
  },
  'Leo': {
    theme: 'Creative Self-Expression',
    soulPurpose: 'To shine authentically and inspire others',
    gardeningMission: 'Create spectacular gardens that inspire joy',
    karmaticPattern: 'Moving from ego-driven to heart-centered expression',
    galacticLessons: 'Use creative gifts to elevate collective garden consciousness'
  },
  'Virgo': {
    theme: 'Perfecting Service',
    soulPurpose: 'To serve through practical improvement',
    gardeningMission: 'Perfect sustainable growing techniques for all',
    karmaticPattern: 'Releasing perfectionism while maintaining standards',
    galacticLessons: 'Serve the greater good through detailed garden mastery'
  },
  'Libra': {
    theme: 'Creating Harmony',
    soulPurpose: 'To bring balance and beauty to relationships',
    gardeningMission: 'Design balanced ecosystems and collaborative gardens',
    karmaticPattern: 'Finding balance between self and others',
    galacticLessons: 'Create harmony between human needs and natural systems'
  },
  'Scorpio': {
    theme: 'Transforming Power',
    soulPurpose: 'To transform through depth and intensity',
    gardeningMission: 'Regenerate damaged ecosystems and soil',
    karmaticPattern: 'Learning to transform rather than control',
    galacticLessons: 'Channel transformative power for planetary healing'
  },
  'Sagittarius': {
    theme: 'Seeking Higher Truth',
    soulPurpose: 'To explore meaning and share wisdom',
    gardeningMission: 'Connect gardening to spiritual and philosophical truth',
    karmaticPattern: 'Grounding higher wisdom in practical application',
    galacticLessons: 'Align garden practices with galactic and cosmic wisdom (key sign - contains Galactic Center)'
  },
  'Capricorn': {
    theme: 'Mastering Responsibility',
    soulPurpose: 'To achieve mastery through disciplined effort',
    gardeningMission: 'Build lasting agricultural systems and institutions',
    karmaticPattern: 'Balancing ambition with genuine service',
    galacticLessons: 'Use mastery to create sustainable systems for collective benefit'
  },
  'Aquarius': {
    theme: 'Innovating for Humanity',
    soulPurpose: 'To bring innovative solutions for collective benefit',
    gardeningMission: 'Develop revolutionary growing technologies and methods',
    karmaticPattern: 'Balancing individuality with group consciousness',
    galacticLessons: 'Channel innovative vision toward planetary garden regeneration'
  },
  'Pisces': {
    theme: 'Dissolving Boundaries',
    soulPurpose: 'To connect with universal consciousness',
    gardeningMission: 'Create intuitive, spiritually-connected garden practices',
    karmaticPattern: 'Grounding spiritual insights in earthly service',
    galacticLessons: 'Bridge earthly gardening with cosmic consciousness'
  }
};

// Calculate sun sign using tropical zodiac
export function calculateTropicalSunSign(birthDate: Date): string {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
  // Tropical zodiac boundaries (approximately - exact dates vary by year)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// Calculate galactic alignment (simplified - how close birth date is to Galactic Center)
export function calculateGalacticAlignment(birthDate: Date): number {
  const sunSign = calculateTropicalSunSign(birthDate);
  
  if (sunSign === 'Sagittarius') {
    // Calculate proximity to 27° Sagittarius (around December 19th)
    // Simplified: if born in Sagittarius, calculate distance from the 27th degree
    const sagittariusStart = new Date(birthDate.getFullYear(), 10, 22); // Nov 22
    const daysSinceStart = Math.floor((birthDate.getTime() - sagittariusStart.getTime()) / (1000 * 60 * 60 * 24));
    const approximateDegree = daysSinceStart; // Rough approximation
    return Math.abs(27 - approximateDegree);
  }
  
  // For other signs, calculate distance from Galactic Center
  const signOrder = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
  const sunSignIndex = signOrder.indexOf(sunSign);
  const sagittariusIndex = signOrder.indexOf('Sagittarius');
  
  // Distance in signs from Sagittarius, then add/subtract based on degree
  let signDistance = Math.abs(sunSignIndex - sagittariusIndex);
  if (signDistance > 6) signDistance = 12 - signDistance; // Shorter path around zodiac
  
  return signDistance * 30 + 27; // Convert to degrees
}

// Generate evolutionary moon guidance based on current moon sign
export function getEvolutionaryMoonGuidance(moonSign: string, moonPhase: string): string {
  const evolutionaryTheme = EVOLUTIONARY_THEMES[moonSign as keyof typeof EVOLUTIONARY_THEMES];
  
  if (!evolutionaryTheme) return 'Follow lunar wisdom for garden timing';
  
  const phaseGuidance = moonPhase.includes('New') ? 'initiate' :
                       moonPhase.includes('Full') ? 'culminate' :
                       moonPhase.includes('Waxing') ? 'develop' : 'release';
  
  return `${phaseGuidance} activities aligned with ${evolutionaryTheme.theme.toLowerCase()}. ${evolutionaryTheme.galacticLessons}`;
}

// Calculate current planetary transits with evolutionary significance
export function getCurrentEvolutionaryTransits(): EvolutionaryTransit[] {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  
  // Simplified transit calculations (in production, use Swiss Ephemeris or similar)
  return [
    {
      planet: 'Pluto',
      currentSign: 'Aquarius', // Pluto in Aquarius 2023-2044
      degree: 1 + (today.getFullYear() - 2023) * 1.5, // Approximate progression
      evolutionarySignificance: 'Collective transformation through innovation',
      gardeningGuidance: 'Embrace revolutionary growing methods that serve community',
      karmaticLesson: 'Transform power structures in agriculture',
      galacticInfluence: 'Aligning with Aquarian age consciousness and galactic wisdom'
    },
    {
      planet: 'Jupiter',
      currentSign: ['Taurus', 'Gemini', 'Cancer', 'Leo'][Math.floor(currentMonth / 3)],
      degree: (currentMonth % 3) * 10 + 5,
      evolutionarySignificance: 'Expansion of wisdom and abundance',
      gardeningGuidance: 'Expand garden projects with optimism and philosophical understanding',
      karmaticLesson: 'Share abundance generously',
      galacticInfluence: 'Channel expansive energy toward collective garden evolution'
    },
    {
      planet: 'Saturn',
      currentSign: 'Pisces', // Saturn in Pisces 2023-2026
      degree: 15 + (today.getFullYear() - 2023) * 10,
      evolutionarySignificance: 'Disciplined spiritual practice',
      gardeningGuidance: 'Build sustainable systems with spiritual awareness',
      karmaticLesson: 'Ground spiritual insights in practical garden mastery',
      galacticInfluence: 'Structure aligned with cosmic consciousness'
    }
  ];
}

// Generate evolutionary gardening profile
export function generateEvolutionaryProfile(
  birthDate: Date
): EvolutionaryProfile {
  const sunSign = calculateTropicalSunSign(birthDate);
  const galacticAlignment = calculateGalacticAlignment(birthDate);
  const evolutionaryTheme = EVOLUTIONARY_THEMES[sunSign as keyof typeof EVOLUTIONARY_THEMES];
  
  // Calculate lunar nodes (simplified - in production use ephemeris)
  const yearsSince1900 = birthDate.getFullYear() - 1900;
  const nodeIndex = Math.floor((yearsSince1900 * 12) / 18.6) % 12; // 18.6 year node cycle
  const signs = Object.keys(TROPICAL_ZODIAC);
  const northNode = signs[nodeIndex];
  const southNode = signs[(nodeIndex + 6) % 12]; // Opposite sign
  
  return {
    sunSign,
    northNode,
    southNode,
    galacticAlignment,
    evolutionaryTheme: evolutionaryTheme?.theme || 'Evolutionary Growth',
    karmaticPattern: evolutionaryTheme?.karmaticPattern || 'Learning through experience',
    soulPurpose: evolutionaryTheme?.soulPurpose || 'Spiritual evolution through earthly service',
    gardeningMission: evolutionaryTheme?.gardeningMission || 'Cultivate consciousness through plants'
  };
}

// Get galactic center influence for specific date
export function getGalacticCenterInfluence(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Galactic Center is most active around December 19-21 (27° Sagittarius)
  if (month === 12 && day >= 17 && day <= 23) {
    return 'PEAK GALACTIC CENTER INFLUENCE: Direct connection to galactic wisdom and cosmic consciousness. Powerful time for setting evolutionary garden intentions.';
  }
  
  // Also active when moon or planets transit 27° Sagittarius
  if (month === 12 && day >= 10 && day <= 30) {
    return 'Strong galactic center influence: Enhanced intuition and cosmic perspective for garden planning.';
  }
  
  return 'Subtle galactic center influence: Stay open to cosmic guidance in garden decisions.';
}

// Calculate moon's evolutionary message based on tropical position
export function getMoonEvolutionaryMessage(date: Date): {
  moonSign: string;
  evolutionaryMessage: string;
  galacticConnection: string;
} {
  // Simplified moon sign calculation (in production, use precise ephemeris)
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const moonCycle = Math.floor((dayOfYear * 12) / 365) % 12;
  const signs = Object.keys(TROPICAL_ZODIAC);
  const moonSign = signs[moonCycle];
  
  const evolutionaryTheme = EVOLUTIONARY_THEMES[moonSign as keyof typeof EVOLUTIONARY_THEMES];
  
  return {
    moonSign,
    evolutionaryMessage: evolutionaryTheme?.karmaticPattern || 'Emotional evolution through garden practice',
    galacticConnection: evolutionaryTheme?.galacticLessons || 'Connect with cosmic wisdom through earth connection'
  };
} 