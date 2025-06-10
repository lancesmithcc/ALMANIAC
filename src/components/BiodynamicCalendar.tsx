'use client';

import { useState, useEffect } from 'react';
import { Calendar, Moon, Sun, Leaf, TreePine, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { 
  getMoonEvolutionaryMessage, 
  getGalacticCenterInfluence,
  TROPICAL_ZODIAC,
} from '@/lib/evolutionary-astrology';

interface BiodynamicDay {
  date: string;
  moonPhase: string;
  moonSign: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  biodynamicType: 'Root' | 'Leaf' | 'Flower' | 'Fruit/Seed';
  activities: string[];
  avoid: string[];
  energy: string;
  planetaryInfluences: string[];
  evolutionaryMessage?: string;
  galacticInfluence?: string;
}

interface PlantCareSchedule {
  plantName: string;
  nextAction: string;
  timing: string;
  moonPhase: string;
  astrologicalGuidance: string;
  evolutionaryPurpose?: string;
}

interface Plant {
  plant_type?: string;
  stage?: string;
  [key: string]: unknown;
}

export default function BiodynamicCalendar() {
  const [currentWeek, setCurrentWeek] = useState<BiodynamicDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<BiodynamicDay | null>(null);
  const [plantSchedules, setPlantSchedules] = useState<PlantCareSchedule[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [galacticCenterMessage, setGalacticCenterMessage] = useState<string>('');

  // Calculate biodynamic day using tropical astrology and evolutionary principles
  const calculateBiodynamicDay = (date: Date): BiodynamicDay => {
    // Moon phase calculation (simplified)
    const baseNewMoon = new Date('2024-01-11'); // Known new moon date
    const daysDifference = Math.floor((date.getTime() - baseNewMoon.getTime()) / (1000 * 60 * 60 * 24));
    const lunarCycle = 29.53058867; // Average lunar month in days
    const daysSinceNewMoon = daysDifference % lunarCycle;

    let moonPhase = '';
    if (daysSinceNewMoon < 1) moonPhase = "New Moon";
    else if (daysSinceNewMoon < 7) moonPhase = "Waxing Crescent";
    else if (daysSinceNewMoon < 8) moonPhase = "First Quarter";
    else if (daysSinceNewMoon < 14) moonPhase = "Waxing Gibbous";
    else if (daysSinceNewMoon < 15.5) moonPhase = "Full Moon";
    else if (daysSinceNewMoon < 22) moonPhase = "Waning Gibbous";
    else if (daysSinceNewMoon < 23) moonPhase = "Last Quarter";
    else moonPhase = "Waning Crescent";

    // Tropical zodiac moon sign calculation (more accurate)
    const zodiacSigns = Object.keys(TROPICAL_ZODIAC);
    const moonSignIndex = Math.floor((daysSinceNewMoon * 12) / 29.53058867) % 12;
    const moonSign = zodiacSigns[moonSignIndex];

    // Get element and modality from tropical zodiac
    const signData = TROPICAL_ZODIAC[moonSign as keyof typeof TROPICAL_ZODIAC];
    const element = signData.element as 'Fire' | 'Earth' | 'Air' | 'Water';

    // Biodynamic type based on tropical zodiac elements
    const biodynamicMap: { [key: string]: 'Root' | 'Leaf' | 'Flower' | 'Fruit/Seed' } = {
      'Taurus': 'Root', 'Virgo': 'Root', 'Capricorn': 'Root',          // Earth signs = Root days
      'Cancer': 'Leaf', 'Scorpio': 'Leaf', 'Pisces': 'Leaf',           // Water signs = Leaf days  
      'Gemini': 'Flower', 'Libra': 'Flower', 'Aquarius': 'Flower',     // Air signs = Flower days
      'Aries': 'Fruit/Seed', 'Leo': 'Fruit/Seed', 'Sagittarius': 'Fruit/Seed'  // Fire signs = Fruit/Seed days
    };

    const biodynamicType = biodynamicMap[moonSign];

    // Get evolutionary moon message
    const moonMessage = getMoonEvolutionaryMessage(date);
    
    // Get galactic center influence
    const galacticInfluence = getGalacticCenterInfluence(date);

    // Activities and guidance based on biodynamic type and evolutionary principles
    let activities: string[] = [];
    let avoid: string[] = [];
    let energy: string = '';
    let planetaryInfluences: string[] = [];

    switch (biodynamicType) {
      case 'Root':
        activities = [
          'Plant root vegetables (carrots, radishes, potatoes, onions)',
          'Harvest root crops for maximum nutrition',
          'Transplant trees and perennials for strong foundation',
          'Work with compost and soil building',
          'Focus on plant stability and grounding'
        ];
        avoid = ['Watering leaves excessively', 'Aerial fertilizing', 'Working with sensitive flowers'];
        energy = `${element} energy supports deep root development and earthly connection`;
        planetaryInfluences = [
          'Saturn influence for structure and longevity',
          `${element} element for ${element === 'Earth' ? 'grounding and stability' : 'foundational growth'}`,
          'Evolutionary focus: Building sustainable systems'
        ];
        break;

      case 'Leaf':
        activities = [
          'Plant leafy greens (lettuce, spinach, kale, herbs)',
          'Harvest leaves and herbs for culinary/medicinal use',
          'Watering and liquid fertilizer application',
          'Pruning for leaf growth',
          'Focus on plant nourishment and expansion'
        ];
        avoid = ['Root disturbance', 'Heavy soil work', 'Stress-inducing activities'];
        energy = `${element} energy enhances leaf growth and emotional plant connection`;
        planetaryInfluences = [
          'Moon influence for intuitive growth patterns',
          `${element} element for ${element === 'Water' ? 'emotional nourishment' : 'flowing development'}`,
          'Evolutionary focus: Nurturing and emotional intelligence'
        ];
        break;

      case 'Flower':
        activities = [
          'Plant flowering plants and ornamentals',
          'Harvest flowers for beauty and medicine',
          'Support pollination and bee activity',
          'Aesthetic garden design work',
          'Focus on plant beauty and harmony'
        ];
        avoid = ['Heavy pruning', 'Root transplanting', 'Disturbing delicate blooms'];
        energy = `${element} energy promotes flowering, beauty, and social connections`;
        planetaryInfluences = [
          'Venus influence for beauty and harmony',
          `${element} element for ${element === 'Air' ? 'communication and lightness' : 'social connections'}`,
          'Evolutionary focus: Creating beauty and balanced relationships'
        ];
        break;

      case 'Fruit/Seed':
        activities = [
          'Plant fruit trees and seed-bearing plants',
          'Harvest fruits and seeds at peak potency',
          'Seed collection, drying, and storage',
          'Pruning for fruit production',
          'Focus on plant creative expression and future potential'
        ];
        avoid = ['Disturbing developing seeds', 'Excessive watering', 'Stressing fruiting plants'];
        energy = `${element} energy concentrates life force in fruits and seeds`;
        planetaryInfluences = [
          'Sun influence for ripening and maturation',
          `${element} element for ${element === 'Fire' ? 'creative expression and vitality' : 'dynamic growth'}`,
          'Evolutionary focus: Creative manifestation and future visioning'
        ];
        break;
    }

    // Modify activities based on moon phase and evolutionary timing
    if (moonPhase.includes('New')) {
      activities.unshift('Set evolutionary garden intentions', 'Start new plantings with cosmic purpose');
      energy += ' - New moon energy for conscious new beginnings and soul-aligned intentions';
      
      // Special Galactic Center new moon
      if (galacticInfluence.includes('PEAK')) {
        activities.unshift('🌌 GALACTIC NEW MOON: Download cosmic garden wisdom and set revolutionary intentions');
      }
    } else if (moonPhase.includes('Full')) {
      activities.unshift('Harvest with gratitude and awareness', 'Celebrate garden abundance');
      energy += ' - Full moon energy for conscious completion and manifestation';
      
      // Special Galactic Center full moon  
      if (galacticInfluence.includes('PEAK')) {
        activities.unshift('🌌 GALACTIC FULL MOON: Receive cosmic downloads and honor garden wisdom');
      }
    } else if (moonPhase.includes('Waxing')) {
      activities.unshift('Support growth with evolutionary awareness', 'Expand garden consciousness');
      energy += ' - Waxing energy for conscious expansion and development';
    } else {
      activities.unshift('Release old patterns', 'Prepare soil and consciousness for new growth');
      energy += ' - Waning energy for conscious release and preparation';
    }

    // Add Sagittarius special guidance (Galactic Center sign)
    if (moonSign === 'Sagittarius') {
      activities.unshift('🏹 SAGITTARIUS MOON: Connect with galactic wisdom and higher garden purpose');
      planetaryInfluences.push('🌌 Galactic Center influence: Direct cosmic guidance available');
    }

    return {
      date: date.toISOString().split('T')[0],
      moonPhase,
      moonSign,
      element,
      biodynamicType,
      activities,
      avoid,
      energy,
      planetaryInfluences,
      evolutionaryMessage: moonMessage.evolutionaryMessage,
      galacticInfluence: moonMessage.galacticConnection
    };
  };

  // Generate current week's biodynamic calendar
  useEffect(() => {
    const today = new Date();
    const week: BiodynamicDay[] = [];
    
    // Get start of week (Sunday) with offset
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(calculateBiodynamicDay(date));
    }
    
    setCurrentWeek(week);
    
    // Select today if in current week, otherwise first day
    const todayString = today.toISOString().split('T')[0];
    const todayInWeek = week.find(day => day.date === todayString);
    setSelectedDay(todayInWeek || week[0]);
  }, [weekOffset]);

  // Update galactic center message
  useEffect(() => {
    const today = new Date();
    setGalacticCenterMessage(getGalacticCenterInfluence(today));
  }, []);

  // Generate plant care schedules based on user's plants and evolutionary timing
  useEffect(() => {
    // Load user's plants from localStorage or API
    const savedPlants = localStorage.getItem('almaniac-plants');
    if (savedPlants) {
      const plants: Plant[] = JSON.parse(savedPlants);
      const schedules: PlantCareSchedule[] = plants.slice(0, 5).map((plant: Plant) => {
        const today = new Date();
        const biodynamicDay = calculateBiodynamicDay(today);
        
        return {
          plantName: plant.plant_type || 'Unknown Plant',
          nextAction: getNextEvolutionaryAction(plant, biodynamicDay),
          timing: getEvolutionaryTiming(plant, biodynamicDay),
          moonPhase: biodynamicDay.moonPhase,
          astrologicalGuidance: getEvolutionaryGuidance(plant, biodynamicDay),
          evolutionaryPurpose: getEvolutionaryPurpose(plant, biodynamicDay)
        };
      });
      setPlantSchedules(schedules);
    }
  }, []);

  const getNextEvolutionaryAction = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    const stage = plant.stage || 'growing';
    const plantType = plant.plant_type?.toLowerCase() || '';
    
    if (stage === 'seedling' && biodynamicDay.biodynamicType === 'Root') {
      return 'Transplant with evolutionary intention for strong foundation';
    } else if (stage === 'flowering' && biodynamicDay.biodynamicType === 'Flower') {
      return 'Support flowering with awareness of beauty and pollinator relationships';
    } else if (stage === 'fruiting' && biodynamicDay.biodynamicType === 'Fruit/Seed') {
      return 'Prepare for harvest while honoring the creative cycle';
    } else if (plantType.includes('herb') && biodynamicDay.biodynamicType === 'Leaf') {
      return 'Harvest leaves with gratitude for plant medicine';
    } else {
      return `General care with ${biodynamicDay.element.toLowerCase()} element awareness`;
    }
  };

  const getEvolutionaryTiming = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    if (biodynamicDay.moonPhase.includes('New')) {
      return 'New moon energy for setting plant intentions and new beginnings';
    } else if (biodynamicDay.moonPhase.includes('Full')) {
      return 'Full moon peak time for harvesting maximum plant essence';
    } else if (biodynamicDay.moonPhase.includes('Waxing')) {
      return 'Growth phase - support expansion with conscious care';
    } else {
      return 'Release phase - time for pruning and conscious preparation';
    }
  };

  const getEvolutionaryGuidance = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    const element = biodynamicDay.element;
    switch (element) {
      case 'Fire':
        return 'Fire energy enhances creative expression and fruit development - work with passion and vision';
      case 'Earth':
        return 'Earth energy strengthens roots and practical manifestation - focus on grounding and stability';
      case 'Air':
        return 'Air energy promotes communication and pollination - encourage social connections and lightness';
      case 'Water':
        return 'Water energy supports emotional nourishment and intuitive care - trust your feelings';
      default:
        return 'Follow natural rhythms with evolutionary awareness';
    }
  };

  const getEvolutionaryPurpose = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    return `This plant supports your evolutionary journey by teaching ${biodynamicDay.element.toLowerCase()} element lessons through garden practice.`;
  };

  // Week navigation
  const goToPreviousWeek = () => setWeekOffset(weekOffset - 1);
  const goToNextWeek = () => setWeekOffset(weekOffset + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const getBiodynamicColor = (type: string) => {
    switch (type) {
      case 'Root': return 'text-amber-400 bg-amber-400/20';
      case 'Leaf': return 'text-green-400 bg-green-400/20';
      case 'Flower': return 'text-pink-400 bg-pink-400/20';
      case 'Fruit/Seed': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getElementIcon = (element: string) => {
    switch (element) {
      case 'Fire': return '🔥';
      case 'Earth': return '🌍';
      case 'Air': return '💨';
      case 'Water': return '💧';
      default: return '✨';
    }
  };

  return (
    <div className="space-y-6">
      {/* Galactic Center Influence */}
      <div className="bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border border-purple-500/30 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-purple-400">Galactic Center Influence (27° Sagittarius)</h3>
        </div>
        <p className="text-purple-200 text-sm">{galacticCenterMessage}</p>
      </div>

      {/* Week Navigation */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-purple-400" />
            Evolutionary Biodynamic Calendar
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1 text-sm bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
            >
              This Week
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week View */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {currentWeek.map((day) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(day)}
              className={`p-3 rounded-lg text-center transition-all hover:bg-gray-700/50 ${
                selectedDay?.date === day.date 
                  ? 'bg-purple-500/20 border border-purple-500/50' 
                  : 'bg-gray-800/30 border border-gray-700/50'
              } ${isToday(day.date) ? 'ring-2 ring-yellow-400/50' : ''}`}
            >
              <div className="text-sm text-gray-400">{formatDate(day.date)}</div>
              <div className="text-xs mt-1 space-y-1">
                <div className={`px-2 py-1 rounded text-xs ${getBiodynamicColor(day.biodynamicType)}`}>
                  {day.biodynamicType}
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-lg">{getElementIcon(day.element)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                {formatDate(selectedDay.date)}
                {isToday(selectedDay.date) && (
                  <span className="ml-2 text-sm text-yellow-400">(Today)</span>
                )}
              </h3>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm ${getBiodynamicColor(selectedDay.biodynamicType)}`}>
                  {selectedDay.biodynamicType} Day
                </span>
                <span className="text-2xl">{getElementIcon(selectedDay.element)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-purple-400 mb-2 flex items-center">
                    <Moon className="w-4 h-4 mr-2" />
                    Lunar Information
                  </h4>
                  <div className="bg-purple-500/10 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-gray-300">
                      <span className="text-purple-400">Phase:</span> {selectedDay.moonPhase}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="text-purple-400">Sign:</span> Moon in {selectedDay.moonSign} ({selectedDay.element})
                    </p>
                    {selectedDay.evolutionaryMessage && (
                      <p className="text-sm text-purple-200">
                        <span className="text-purple-400">Evolutionary Message:</span> {selectedDay.evolutionaryMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-green-400 mb-2 flex items-center">
                    <Leaf className="w-4 h-4 mr-2" />
                    Recommended Activities
                  </h4>
                  <div className="space-y-2">
                    {selectedDay.activities.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-green-400 mt-1 text-xs">•</span>
                        <span className="text-sm text-gray-300">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-red-400 mb-2">What to Avoid</h4>
                  <div className="space-y-2">
                    {selectedDay.avoid.map((item, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-red-400 mt-1 text-xs">•</span>
                        <span className="text-sm text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-400 mb-2 flex items-center">
                    <Sun className="w-4 h-4 mr-2" />
                    Energy & Influences
                  </h4>
                  <div className="bg-blue-500/10 rounded-lg p-3 space-y-2">
                    <p className="text-sm text-blue-200">{selectedDay.energy}</p>
                    {selectedDay.galacticInfluence && (
                      <p className="text-sm text-yellow-200">
                        <span className="text-yellow-400">🌌 Galactic:</span> {selectedDay.galacticInfluence}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-orange-400 mb-2">Planetary Influences</h4>
                  <div className="space-y-1">
                    {selectedDay.planetaryInfluences.map((influence, index) => (
                      <p key={index} className="text-sm text-orange-200">{influence}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plant Care Schedules */}
      {plantSchedules.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TreePine className="w-5 h-5 mr-2 text-emerald-400" />
            Evolutionary Plant Care Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plantSchedules.map((schedule, index) => (
              <div key={index} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <h4 className="font-medium text-emerald-400 mb-2">{schedule.plantName}</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-emerald-400">Next Action:</span> {schedule.nextAction}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-emerald-400">Timing:</span> {schedule.timing}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-emerald-400">Guidance:</span> {schedule.astrologicalGuidance}
                  </p>
                  {schedule.evolutionaryPurpose && (
                    <p className="text-emerald-200 text-xs mt-2 italic">
                      🌱 {schedule.evolutionaryPurpose}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 