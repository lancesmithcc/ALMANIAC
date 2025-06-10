'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Sun, Moon, Calendar, Sprout, Target, Info, Settings } from 'lucide-react';

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
}

interface PlanetaryTransit {
  planet: string;
  sign: string;
  effect: string;
  gardening_advice: string;
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
    element_description: 'Fire energy encourages adventurous growing and garden expansion'
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
  const [currentTransits, setCurrentTransits] = useState<PlanetaryTransit[]>([]);

  // Load saved profile
  useEffect(() => {
    const savedProfile = localStorage.getItem('almaniac-astrological-profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    } else {
      setShowForm(true);
    }
  }, []);

  // Calculate sun sign from birth date
  const calculateSunSign = (date: string): string => {
    const birthDate = new Date(date);
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
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
  };

  // Generate personalized guidance based on zodiac sign
  const generatePersonalizedGuidance = (sunSign: string): string[] => {
    const sign = zodiacSigns[sunSign];
    if (!sign) return [];

    return [
      `As a ${sign.name}, you naturally ${sign.gardeningTraits[0].toLowerCase()}`,
      `Your ${sign.element} energy ${sign.element_description.toLowerCase()}`,
      `Best planting time: ${sign.plantingTiming}`,
      `Focus on ${sign.favoritePlants?.[0] || 'your favorite plants'} for best results`,
      `Your ${sign.modality} nature means you ${sign.modality === 'Cardinal' ? 'initiate new garden projects' : sign.modality === 'Fixed' ? 'maintain established gardens' : 'adapt to changing garden conditions'}`
    ];
  };

  // Create astrological profile
  const createProfile = () => {
    if (!birthDate) return;
    
    const sunSign = calculateSunSign(birthDate);
    const newProfile: AstrologicalProfile = {
      sunSign,
      birthDate,
      gardeningPersonality: zodiacSigns[sunSign]?.gardeningTraits[0] || 'Intuitive Gardener',
      planetaryInfluences: [
        'Sun in ' + sunSign + ' influences your core gardening style',
        'Moon phases affect your planting intuition',
        'Venus transits enhance garden beauty and harvest'
      ],
      optimalPlantingTimes: [
        zodiacSigns[sunSign]?.plantingTiming || 'Follow lunar calendar',
        'New moon for new plantings',
        'Full moon for harvesting'
      ],
      personalizedGuidance: generatePersonalizedGuidance(sunSign)
    };
    
    setProfile(newProfile);
    localStorage.setItem('almaniac-astrological-profile', JSON.stringify(newProfile));
    setShowForm(false);
  };

  // Get current planetary transits (simplified)
  const getCurrentTransits = useCallback(() => {
    const today = new Date();
    const month = today.getMonth() + 1;
    
    // Simplified transit calculations (in real app, use ephemeris data)
    const transits: PlanetaryTransit[] = [
      {
        planet: 'Sun',
        sign: calculateSunSign(today.toISOString().split('T')[0]),
        effect: 'Core energy and vitality in garden work',
        gardening_advice: 'Focus on plants that match current solar energy'
      },
      {
        planet: 'Moon',
        sign: ['Cancer', 'Taurus', 'Virgo', 'Capricorn'][Math.floor(month / 3)],
        effect: 'Emotional connection and nurturing energy',
        gardening_advice: 'Trust your intuition with plant care timing'
      },
      {
        planet: 'Venus',
        sign: ['Libra', 'Taurus', 'Pisces', 'Cancer'][Math.floor(month / 3)],
        effect: 'Beauty, harmony, and abundance in garden',
        gardening_advice: 'Perfect time for aesthetic garden improvements'
      }
    ];
    
    setCurrentTransits(transits);
  }, []);

  useEffect(() => {
    getCurrentTransits();
  }, [getCurrentTransits]);

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
            <h2 className="text-2xl font-semibold text-white">Create Your Astrological Garden Profile</h2>
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
              <p className="text-xs text-gray-500 mt-1">Used to determine your sun sign and gardening personality</p>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Birth Time (Optional)</label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">For more precise moon and rising sign calculations</p>
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
              <p className="text-xs text-gray-500 mt-1">For accurate rising sign and house calculations</p>
            </div>

            <button
              onClick={createProfile}
              disabled={!birthDate}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
            >
              Create Astrological Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const currentSign = zodiacSigns[profile.sunSign];

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{currentSign?.symbol}</span>
            <div>
              <h2 className="text-2xl font-semibold text-white">{profile.sunSign} Gardener</h2>
              <p className="text-purple-400">{profile.gardeningPersonality}</p>
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
              <span className="text-sm text-gray-400">Element</span>
            </div>
            <p className="text-white font-medium">{currentSign?.element}</p>
            <p className="text-xs text-gray-500 mt-1">{currentSign?.element_description}</p>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-emerald-400 mr-2" />
              <span className="text-sm text-gray-400">Modality</span>
            </div>
            <p className="text-white font-medium">{currentSign?.modality}</p>
            <p className="text-xs text-gray-500 mt-1">
              {currentSign?.modality === 'Cardinal' ? 'Initiative and leadership' :
               currentSign?.modality === 'Fixed' ? 'Stability and persistence' :
               'Adaptability and flexibility'}
            </p>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-sm text-gray-400">Dates</span>
            </div>
            <p className="text-white font-medium">{currentSign?.dates}</p>
          </div>
        </div>
      </div>

      {/* Gardening Traits */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Sprout className="w-5 h-5 mr-2 text-green-400" />
          Your Gardening Traits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentSign?.gardeningTraits.map((trait, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-green-400">•</span>
              <span className="text-gray-300">{trait}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Guidance */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2 text-purple-400" />
          Personalized Guidance
        </h3>
        <div className="space-y-3">
          {profile.personalizedGuidance.map((guidance, index) => (
            <div key={index} className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <p className="text-purple-200">{guidance}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Planetary Transits */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Moon className="w-5 h-5 mr-2 text-blue-400" />
          Current Planetary Influences
        </h3>
        <div className="space-y-3">
          {currentTransits.map((transit, index) => (
            <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-400">{transit.planet} in {transit.sign}</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-gray-300 text-sm mb-1">{transit.effect}</p>
              <p className="text-blue-200 text-sm font-medium">{transit.gardening_advice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Plants */}
      {currentSign?.favoritePlants && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Sprout className="w-5 h-5 mr-2 text-green-400" />
            Plants That Resonate With You
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {currentSign.favoritePlants.map((plant, index) => (
              <div key={index} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <span className="text-green-400 text-sm">{plant}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={resetProfile}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Reset Profile
        </button>
      </div>
    </div>
  );
} 