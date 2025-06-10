'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Sun, Moon, Sprout, Target, Info, Settings, Zap } from 'lucide-react';
import { 
  generateEvolutionaryProfile, 
  getCurrentEvolutionaryTransits,
  getGalacticCenterInfluence,
  EVOLUTIONARY_THEMES,

  type EvolutionaryProfile,
  type EvolutionaryTransit
} from '@/lib/evolutionary-astrology';

interface ZodiacSign {
  name: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  modality: 'Cardinal' | 'Fixed' | 'Mutable';
  symbol: string;
  dates: string;
  gardeningTraits: string[];
  favoritePlants: string[];
  plantingTiming: string;
  element_description: string;
}

interface AstrologicalProfile {
  sunSign: string;
  moonSign?: string;
  risingSign?: string;
  birthDate: string;
  gardeningPersonality: string;
  planetaryInfluences: string[];
  optimalPlantingTimes: string[];
  personalizedGuidance: string[];
  evolutionary?: EvolutionaryProfile;
  galacticInfluence?: string;
}

const zodiacSigns: { [key: string]: ZodiacSign } = {
  'Aries': {
    name: 'Aries',
    element: 'Fire',
    modality: 'Cardinal',
    symbol: '♈',
    dates: 'March 21 - April 19',
    gardeningTraits: ['Pioneer gardener', 'Loves quick-growing plants', 'Impatient with slow growth', 'Enjoys starting new gardens'],
    favoritePlants: ['Radishes', 'Lettuce', 'Chili peppers', 'Marigolds', 'Sunflowers'],
    plantingTiming: 'New moon in fire signs for maximum energy',
    element_description: 'Fire energy brings enthusiasm and rapid growth to your garden'
  },
  'Taurus': {
    name: 'Taurus',
    element: 'Earth',
    modality: 'Fixed',
    symbol: '♉',
    dates: 'April 20 - May 20',
    gardeningTraits: ['Patient cultivator', 'Loves established gardens', 'Enjoys sensual plants', 'Values beauty and abundance'],
    favoritePlants: ['Roses', 'Herbs', 'Root vegetables', 'Fruit trees', 'Lavender'],
    plantingTiming: 'Waning moon for strong root development',
    element_description: 'Earth energy provides stability and nourishment for lasting growth'
  },
  'Gemini': {
    name: 'Gemini',
    element: 'Air',
    modality: 'Mutable',
    symbol: '♊',
    dates: 'May 21 - June 20',
    gardeningTraits: ['Variety seeker', 'Loves experimental plants', 'Enjoys companion planting', 'Curious about new techniques'],
    favoritePlants: ['Herbs', 'Leafy greens', 'Flowers', 'Climbing plants', 'Companion sets'],
    plantingTiming: 'Waxing moon for leaf and flower development',
    element_description: 'Air energy encourages communication between plants and pollination'
  },
  'Cancer': {
    name: 'Cancer',
    element: 'Water',
    modality: 'Cardinal',
    symbol: '♋',
    dates: 'June 21 - July 22',
    gardeningTraits: ['Nurturing caretaker', 'Intuitive plant care', 'Loves water gardens', 'Emotional connection to plants'],
    favoritePlants: ['Water lilies', 'Cucumber', 'Melons', 'Cabbage', 'Night-blooming flowers'],
    plantingTiming: 'Full moon for maximum water absorption',
    element_description: 'Water energy enhances intuitive plant care and emotional garden connection'
  },
  'Leo': {
    name: 'Leo',
    element: 'Fire',
    modality: 'Fixed',
    symbol: '♌',
    dates: 'July 23 - August 22',
    gardeningTraits: ['Dramatic displays', 'Loves show-stopping plants', 'Generous with garden sharing', 'Sunny disposition gardener'],
    favoritePlants: ['Sunflowers', 'Dahlias', 'Citrus trees', 'Bright flowers', 'Statement plants'],
    plantingTiming: 'Sun in Leo for fruit and seed development',
    element_description: 'Fire energy creates spectacular displays and abundant harvests'
  },
  'Virgo': {
    name: 'Virgo',
    element: 'Earth',
    modality: 'Mutable',
    symbol: '♍',
    dates: 'August 23 - September 22',
    gardeningTraits: ['Meticulous planner', 'Loves organized gardens', 'Health-focused growing', 'Detail-oriented care'],
    favoritePlants: ['Medicinal herbs', 'Vegetables', 'Neat rows', 'Pest-resistant plants', 'Healing gardens'],
    plantingTiming: 'Waning moon in earth signs for practical growth',
    element_description: 'Earth energy supports methodical, health-focused gardening practices'
  },
  'Libra': {
    name: 'Libra',
    element: 'Air',
    modality: 'Cardinal',
    symbol: '♎',
    dates: 'September 23 - October 22',
    gardeningTraits: ['Beauty seeker', 'Loves balanced designs', 'Social gardener', 'Harmony-focused planting'],
    favoritePlants: ['Roses', 'Balanced color schemes', 'Symmetrical designs', 'Partner plants', 'Artistic arrangements'],
    plantingTiming: 'Venus aspects for beauty and harmony',
    element_description: 'Air energy creates beautiful, balanced garden compositions'
  },
  'Scorpio': {
    name: 'Scorpio',
    element: 'Water',
    modality: 'Fixed',
    symbol: '♏',
    dates: 'October 23 - November 21',
    gardeningTraits: ['Deep root grower', 'Loves transformation', 'Intense plant relationships', 'Regenerative gardening'],
    favoritePlants: ['Deep-rooted plants', 'Perennials', 'Compost gardens', 'Mysterious plants', 'Underground crops'],
    plantingTiming: 'Dark moon for deep transformation',
    element_description: 'Water energy facilitates deep transformation and regenerative growth'
  },
  'Sagittarius': {
    name: 'Sagittarius',
    element: 'Fire',
    modality: 'Mutable',
    symbol: '♐',
    dates: 'November 22 - December 21',
    gardeningTraits: ['Adventurous grower', 'Loves exotic plants', 'Big picture gardener', 'Philosophical approach'],
    favoritePlants: ['Exotic varieties', 'Large-scale projects', 'International plants', 'Expansion gardens', 'Teaching gardens'],
    plantingTiming: 'Jupiter aspects for expansion and growth',
    element_description: 'Fire energy encourages adventurous growing and garden expansion. ⭐ GALACTIC CENTER CONNECTION ⭐'
  },
  'Capricorn': {
    name: 'Capricorn',
    element: 'Earth',
    modality: 'Cardinal',
    symbol: '♑',
    dates: 'December 22 - January 19',
    gardeningTraits: ['Long-term planner', 'Loves established systems', 'Goal-oriented growing', 'Traditional methods'],
    favoritePlants: ['Perennial crops', 'Fruit trees', 'Structured gardens', 'Heritage varieties', 'Season-extending'],
    plantingTiming: 'Saturn aspects for long-term establishment',
    element_description: 'Earth energy supports long-term garden planning and sustainable systems'
  },
  'Aquarius': {
    name: 'Aquarius',
    element: 'Air',
    modality: 'Fixed',
    symbol: '♒',
    dates: 'January 20 - February 18',
    gardeningTraits: ['Innovative grower', 'Loves technology', 'Community-focused', 'Future-thinking'],
    favoritePlants: ['Hydroponic systems', 'Unusual varieties', 'Tech-assisted growing', 'Community gardens', 'Sustainable methods'],
    plantingTiming: 'Uranus aspects for innovation and change',
    element_description: 'Air energy supports innovative growing methods and community connections'
  },
  'Pisces': {
    name: 'Pisces',
    element: 'Water',
    modality: 'Mutable',
    symbol: '♓',
    dates: 'February 19 - March 20',
    gardeningTraits: ['Intuitive gardener', 'Loves flowing designs', 'Emotional plant care', 'Spiritual connection'],
    favoritePlants: ['Water features', 'Flowing designs', 'Intuitive planting', 'Medicinal plants', 'Dream gardens'],
    plantingTiming: 'Neptune aspects for spiritual connection',
    element_description: 'Water energy enhances intuitive gardening and spiritual plant connections'
  }
};

export default function AstrologicalProfile() {
  const [profile, setProfile] = useState<AstrologicalProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [currentTransits, setCurrentTransits] = useState<EvolutionaryTransit[]>([]);
  const [galacticInfluence, setGalacticInfluence] = useState<string>('');

  // Load saved profile
  useEffect(() => {
    const savedProfile = localStorage.getItem('almaniac-astrological-profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setShowForm(true);
    }
  }, []);

  // Get current galactic influence
  useEffect(() => {
    const today = new Date();
    setGalacticInfluence(getGalacticCenterInfluence(today));
  }, []);

  // Create evolutionary astrological profile
  const createProfile = () => {
    if (!birthDate) return;
    
    const birthDateObj = new Date(birthDate);
    const evolutionaryProfile = generateEvolutionaryProfile(birthDateObj);
    
    const newProfile: AstrologicalProfile = {
      sunSign: evolutionaryProfile.sunSign,
      birthDate,
      gardeningPersonality: EVOLUTIONARY_THEMES[evolutionaryProfile.sunSign as keyof typeof EVOLUTIONARY_THEMES]?.gardeningMission || 'Evolutionary Gardener',
      planetaryInfluences: [
        `Sun in ${evolutionaryProfile.sunSign}: ${EVOLUTIONARY_THEMES[evolutionaryProfile.sunSign as keyof typeof EVOLUTIONARY_THEMES]?.soulPurpose}`,
        `North Node in ${evolutionaryProfile.northNode}: Future evolutionary direction`,
        `South Node in ${evolutionaryProfile.southNode}: Past life patterns to transform`,
        `Galactic alignment: ${evolutionaryProfile.galacticAlignment.toFixed(1)}° from Galactic Center`
      ],
      optimalPlantingTimes: [
        'New moon for evolutionary intentions',
        'Full moon for harvesting peak energy',
        'Galactic Center transits for cosmic downloads',
        'Personal evolutionary timing based on your chart'
      ],
      personalizedGuidance: [
        `Soul Purpose: ${evolutionaryProfile.soulPurpose}`,
        `Gardening Mission: ${evolutionaryProfile.gardeningMission}`,
        `Karmatic Pattern: ${evolutionaryProfile.karmaticPattern}`,
        `Evolutionary Theme: ${evolutionaryProfile.evolutionaryTheme}`,
        evolutionaryProfile.sunSign === 'Sagittarius' ? 
          '🌌 SPECIAL: You carry direct Galactic Center energy - you are a cosmic wisdom keeper in gardening!' :
          `🌌 Your ${evolutionaryProfile.galacticAlignment.toFixed(0)}° connection to Galactic Center brings cosmic perspective to your garden work`
      ],
      evolutionary: evolutionaryProfile,
      galacticInfluence: getGalacticCenterInfluence(birthDateObj)
    };
    
    setProfile(newProfile);
    localStorage.setItem('almaniac-astrological-profile', JSON.stringify(newProfile));
    setShowForm(false);
  };

  // Get current evolutionary transits
  const getEvolutionaryTransits = useCallback(() => {
    const transits = getCurrentEvolutionaryTransits();
    setCurrentTransits(transits);
  }, []);

  useEffect(() => {
    getEvolutionaryTransits();
  }, [getEvolutionaryTransits]);

  const resetProfile = () => {
    localStorage.removeItem('almaniac-astrological-profile');
    setProfile(null);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <div className="flex items-center mb-6">
            <Star className="w-6 h-6 mr-2 text-purple-400" />
            <h2 className="text-2xl font-semibold text-white">Create Your Evolutionary Garden Profile</h2>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-purple-400">Evolutionary & Tropical Astrology</h3>
                <p className="text-sm text-gray-300 mt-1">
                  This system uses <strong>tropical astrology</strong> (seasonal/equinox-based) combined with <strong>evolutionary astrology</strong> principles. 
                  The Galactic Center is positioned at <strong>27° Sagittarius</strong>, connecting your garden practice to cosmic evolution and soul purpose.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Birth Date *</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used for tropical sun sign and evolutionary calculations</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Birth Time (Optional)</label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">For more precise moon, rising, and house calculations</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Birth Location (Optional)</label>
              <input
                type="text"
                value={birthLocation}
                onChange={(e) => setBirthLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">For accurate rising sign and evolutionary timing</p>
            </div>

            <button
              onClick={createProfile}
              disabled={!birthDate}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
            >
              Generate Evolutionary Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentSign = zodiacSigns[profile.sunSign];
  const evolutionaryData = profile.evolutionary;

  return (
    <div className="space-y-6">
      {/* Galactic Center Influence Banner */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-yellow-400">Current Galactic Center Influence</h3>
        </div>
        <p className="text-yellow-200 text-sm">{galacticInfluence}</p>
      </div>

      {/* Evolutionary Profile Overview */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{currentSign?.symbol}</span>
            <div>
              <h2 className="text-2xl font-semibold text-white">{profile.sunSign} Evolutionary Gardener</h2>
              <p className="text-purple-400">{evolutionaryData?.evolutionaryTheme}</p>
              {profile.sunSign === 'Sagittarius' && (
                <p className="text-yellow-400 text-sm font-medium">🌌 Galactic Center Guardian</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Sun className="w-5 h-5 text-yellow-400 mr-2" />
              <span className="text-sm text-gray-400">Soul Purpose</span>
            </div>
            <p className="text-white font-medium">{evolutionaryData?.soulPurpose}</p>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-emerald-400 mr-2" />
              <span className="text-sm text-gray-400">Garden Mission</span>
            </div>
            <p className="text-white font-medium">{evolutionaryData?.gardeningMission}</p>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Zap className="w-5 h-5 text-purple-400 mr-2" />
              <span className="text-sm text-gray-400">Galactic Alignment</span>
            </div>
            <p className="text-white font-medium">{evolutionaryData?.galacticAlignment.toFixed(1)}° from Galactic Center</p>
            <p className="text-xs text-gray-500 mt-1">27° Sagittarius</p>
          </div>
        </div>
      </div>

      {/* Lunar Nodes */}
      {evolutionaryData?.northNode && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Moon className="w-5 h-5 mr-2 text-blue-400" />
            Evolutionary Lunar Nodes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="font-medium text-green-400 mb-2">North Node in {evolutionaryData.northNode}</h4>
              <p className="text-green-200 text-sm">Future evolutionary direction - grow toward these qualities in your garden practice</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="font-medium text-orange-400 mb-2">South Node in {evolutionaryData.southNode}</h4>
              <p className="text-orange-200 text-sm">Past life gifts to transform - use but don&apos;t over-rely on these patterns</p>
            </div>
          </div>
        </div>
      )}

      {/* Evolutionary Guidance */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-purple-400" />
          Evolutionary Garden Guidance
        </h3>
        <div className="space-y-3">
          {profile.personalizedGuidance.map((guidance, index) => (
            <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-purple-200">{guidance}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Evolutionary Transits */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-orange-400" />
          Current Evolutionary Transits
        </h3>
        <div className="space-y-3">
          {currentTransits.map((transit, index) => (
            <div key={index} className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-orange-400">{transit.planet} in {transit.currentSign} ({transit.degree.toFixed(1)}°)</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-gray-300 text-sm mb-1">{transit.evolutionarySignificance}</p>
              <p className="text-orange-200 text-sm mb-1"><strong>Garden Guidance:</strong> {transit.gardeningGuidance}</p>
              <p className="text-purple-200 text-sm mb-1"><strong>Karmatic Lesson:</strong> {transit.karmaticLesson}</p>
              <p className="text-yellow-200 text-sm"><strong>Galactic Influence:</strong> {transit.galacticInfluence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Plants */}
      {currentSign?.favoritePlants && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Sprout className="w-5 h-5 mr-2 text-green-400" />
            Plants That Resonate With Your Evolution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {currentSign.favoritePlants.map((plant, index) => (
              <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <span className="text-green-400 text-sm">{plant}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-3">
            These plants align with your {currentSign.element} element and {currentSign.modality} modality for evolutionary growth.
          </p>
        </div>
      )}

      <div className="flex justify-center space-x-4">
        <button
          onClick={resetProfile}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Reset Profile
        </button>
        <span className="text-gray-600">•</span>
        <span className="text-xs text-gray-500">
          Tropical Astrology • Galactic Center @ 27° ♐
        </span>
      </div>
    </div>
  );
} 