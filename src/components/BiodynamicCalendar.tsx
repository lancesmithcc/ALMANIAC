'use client';

import { useState, useEffect } from 'react';
import { Calendar, Moon, Sun, Droplets, Wind, Leaf } from 'lucide-react';

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
}

interface PlantCareSchedule {
  plantName: string;
  nextAction: string;
  timing: string;
  moonPhase: string;
  astrologicalGuidance: string;
}

interface Plant {
  plant_type?: string;
  stage?: string;
  [key: string]: unknown;
}

const elementColors = {
  'Fire': 'from-red-500/20 to-orange-500/20 border-red-500/30',
  'Earth': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'Air': 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
  'Water': 'from-purple-500/20 to-indigo-500/20 border-purple-500/30'
};

const elementIcons = {
  'Fire': Sun,
  'Earth': Leaf,
  'Air': Wind,
  'Water': Droplets
};

export default function BiodynamicCalendar() {
  const [currentWeek, setCurrentWeek] = useState<BiodynamicDay[]>([]);
  const [plantSchedules, setPlantSchedules] = useState<PlantCareSchedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<BiodynamicDay | null>(null);

  // Calculate biodynamic properties for a date
  const calculateBiodynamicDay = (date: Date): BiodynamicDay => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Julian day calculation for moon phase
    const a = Math.floor((14 - month) / 12);
    const y = year - a;
    const m = month + 12 * a - 3;
    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
    
    let daysSinceNewMoon = (jd - 2451549.5) % 29.53058867;
    if (daysSinceNewMoon < 0) daysSinceNewMoon += 29.53058867;
    
    // Determine moon phase
    let moonPhase: string;
    if (daysSinceNewMoon < 1.84566) moonPhase = "New Moon";
    else if (daysSinceNewMoon < 5.53699) moonPhase = "Waxing Crescent";
    else if (daysSinceNewMoon < 9.22831) moonPhase = "First Quarter";
    else if (daysSinceNewMoon < 12.91963) moonPhase = "Waxing Gibbous";
    else if (daysSinceNewMoon < 16.61096) moonPhase = "Full Moon";
    else if (daysSinceNewMoon < 20.30228) moonPhase = "Waning Gibbous";
    else if (daysSinceNewMoon < 23.99361) moonPhase = "Last Quarter";
    else moonPhase = "Waning Crescent";

    // Simplified moon sign calculation (cycles through zodiac)
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];
    const moonSignIndex = Math.floor((daysSinceNewMoon * 12) / 29.53058867) % 12;
    const moonSign = zodiacSigns[moonSignIndex];

    // Determine element and biodynamic type
    const elementMap: { [key: string]: 'Fire' | 'Earth' | 'Air' | 'Water' } = {
      'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
      'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
      'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
      'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
    };

    const biodynamicMap: { [key: string]: 'Root' | 'Leaf' | 'Flower' | 'Fruit/Seed' } = {
      'Taurus': 'Root', 'Virgo': 'Root', 'Capricorn': 'Root',
      'Cancer': 'Leaf', 'Scorpio': 'Leaf', 'Pisces': 'Leaf',
      'Gemini': 'Flower', 'Libra': 'Flower', 'Aquarius': 'Flower',
      'Aries': 'Fruit/Seed', 'Leo': 'Fruit/Seed', 'Sagittarius': 'Fruit/Seed'
    };

    const element = elementMap[moonSign];
    const biodynamicType = biodynamicMap[moonSign];

    // Activities and guidance based on biodynamic type and moon phase
    let activities: string[] = [];
    let avoid: string[] = [];
    let energy: string = '';
    let planetaryInfluences: string[] = [];

    switch (biodynamicType) {
      case 'Root':
        activities = [
          'Plant root vegetables (carrots, radishes, onions)',
          'Harvest root crops',
          'Transplant perennials',
          'Work with compost and soil'
        ];
        avoid = ['Watering leaves', 'Aerial fertilizing'];
        energy = 'Earth energy supports strong root development';
        planetaryInfluences = ['Saturn influence for structure', 'Earth element for grounding'];
        break;

      case 'Leaf':
        activities = [
          'Plant leafy greens (lettuce, spinach, kale)',
          'Harvest leaves and herbs',
          'Watering and irrigation',
          'Liquid fertilizer application'
        ];
        avoid = ['Root disturbance', 'Heavy soil work'];
        energy = 'Water energy enhances leaf growth and moisture absorption';
        planetaryInfluences = ['Moon influence for growth', 'Water element for nourishment'];
        break;

      case 'Flower':
        activities = [
          'Plant flowering plants',
          'Harvest flowers for drying',
          'Pollination support',
          'Aesthetic garden work'
        ];
        avoid = ['Heavy pruning', 'Root transplanting'];
        energy = 'Air energy promotes flowering and beauty';
        planetaryInfluences = ['Venus influence for beauty', 'Air element for lightness'];
        break;

      case 'Fruit/Seed':
        activities = [
          'Plant fruit trees and seed crops',
          'Harvest fruits and seeds',
          'Seed collection and storage',
          'Pruning for fruit production'
        ];
        avoid = ['Disturbing seed beds', 'Excessive watering'];
        energy = 'Fire energy concentrates in fruits and seeds';
        planetaryInfluences = ['Sun influence for ripening', 'Fire element for maturation'];
        break;
    }

    // Modify activities based on moon phase
    if (moonPhase.includes('New')) {
      activities.unshift('Start new plantings', 'Seed germination');
      energy += ' - New moon energy for new beginnings';
    } else if (moonPhase.includes('Full')) {
      activities.unshift('Harvest at peak potency', 'Seed collection');
      energy += ' - Full moon energy for completion';
    } else if (moonPhase.includes('Waxing')) {
      activities.unshift('Transplanting', 'Growth promotion');
      energy += ' - Waxing energy for expansion';
    } else {
      activities.unshift('Pruning', 'Soil preparation');
      energy += ' - Waning energy for release and preparation';
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
      planetaryInfluences
    };
  };

  // Generate current week's biodynamic calendar
  useEffect(() => {
    const today = new Date();
    const week: BiodynamicDay[] = [];
    
    // Get start of week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(calculateBiodynamicDay(date));
    }
    
    setCurrentWeek(week);
    setSelectedDay(week.find(day => day.date === today.toISOString().split('T')[0]) || week[0]);
  }, []);

  // Generate plant care schedules based on user's plants and astrological timing
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
          nextAction: getNextAction(plant, biodynamicDay),
          timing: getOptimalTiming(plant, biodynamicDay),
          moonPhase: biodynamicDay.moonPhase,
          astrologicalGuidance: getAstrologicalGuidance(plant, biodynamicDay)
        };
      });
      setPlantSchedules(schedules);
    }
  }, []);

  const getNextAction = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    const stage = plant.stage || 'growing';
    const plantType = plant.plant_type?.toLowerCase() || '';
    
    if (stage === 'seedling' && biodynamicDay.biodynamicType === 'Root') {
      return 'Transplant to larger container';
    } else if (stage === 'flowering' && biodynamicDay.biodynamicType === 'Flower') {
      return 'Support flowering with phosphorus';
    } else if (stage === 'fruiting' && biodynamicDay.biodynamicType === 'Fruit/Seed') {
      return 'Prepare for harvest';
    } else if (plantType.includes('herb') && biodynamicDay.biodynamicType === 'Leaf') {
      return 'Harvest leaves for maximum potency';
    } else {
      return 'General care and observation';
    }
  };

  const getOptimalTiming = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    if (biodynamicDay.moonPhase.includes('New')) {
      return 'Best time for new beginnings';
    } else if (biodynamicDay.moonPhase.includes('Full')) {
      return 'Peak time for harvesting';
    } else if (biodynamicDay.moonPhase.includes('Waxing')) {
      return 'Growth and expansion phase';
    } else {
      return 'Time for pruning and preparation';
    }
  };

  const getAstrologicalGuidance = (plant: Plant, biodynamicDay: BiodynamicDay): string => {
    const element = biodynamicDay.element;
    switch (element) {
      case 'Fire':
        return 'Fire energy enhances fruit development and seed formation';
      case 'Earth':
        return 'Earth energy strengthens roots and overall plant structure';
      case 'Air':
        return 'Air energy promotes flowering and pollination';
      case 'Water':
        return 'Water energy supports leaf growth and moisture absorption';
      default:
        return 'Follow natural rhythms for best results';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const ElementIcon = selectedDay ? elementIcons[selectedDay.element] : Sun;

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="flex items-center mb-6">
          <Calendar className="w-6 h-6 mr-2 text-purple-400" />
          <h2 className="text-2xl font-semibold text-white">Biodynamic Garden Calendar</h2>
        </div>

        {/* Weekly Overview */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {currentWeek.map((day) => {
            const ElementIcon = elementIcons[day.element];
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={`
                  p-3 rounded-lg border transition-all duration-200
                  ${selectedDay?.date === day.date 
                    ? `bg-gradient-to-b ${elementColors[day.element]} scale-105` 
                    : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/50'
                  }
                  ${isToday(day.date) ? 'ring-2 ring-purple-400' : ''}
                `}
              >
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">
                    {formatDate(day.date)}
                  </div>
                  <ElementIcon className="w-5 h-5 mx-auto mb-1 text-white" />
                  <div className="text-xs font-medium text-white">
                    {day.biodynamicType}
                  </div>
                  <div className="text-xs text-gray-400">
                    {day.moonSign}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className={`bg-gradient-to-r ${elementColors[selectedDay.element]} rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <ElementIcon className="w-8 h-8 text-white" />
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {selectedDay.biodynamicType} Day
                  </h3>
                  <p className="text-gray-300">
                    Moon in {selectedDay.moonSign} • {selectedDay.moonPhase}
                  </p>
                </div>
              </div>
              <Moon className="w-6 h-6 text-gray-300" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recommended Activities */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Recommended Activities</h4>
                <div className="space-y-2">
                  {selectedDay.activities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-200 text-sm">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avoid Today */}
              <div>
                <h4 className="text-lg font-medium text-white mb-3">Avoid Today</h4>
                <div className="space-y-2">
                  {selectedDay.avoid.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-red-400">×</span>
                      <span className="text-gray-200 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-black/20 rounded-lg">
              <h4 className="text-sm font-medium text-white mb-2">Energy & Influences</h4>
              <p className="text-gray-200 text-sm mb-3">{selectedDay.energy}</p>
              <div className="space-y-1">
                {selectedDay.planetaryInfluences.map((influence, index) => (
                  <div key={index} className="text-xs text-gray-300">
                    • {influence}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plant Care Schedules */}
      {plantSchedules.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Leaf className="w-5 h-5 mr-2 text-green-400" />
            Personalized Plant Care Schedule
          </h3>
          <div className="space-y-4">
            {plantSchedules.map((schedule, index) => (
              <div key={index} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-white">{schedule.plantName}</h4>
                  <span className="text-xs text-gray-400">{schedule.moonPhase}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400 text-sm">Next Action:</span>
                    <span className="text-gray-300 text-sm">{schedule.nextAction}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 text-sm">Timing:</span>
                    <span className="text-gray-300 text-sm">{schedule.timing}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {schedule.astrologicalGuidance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 