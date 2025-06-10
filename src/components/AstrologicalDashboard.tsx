'use client';

import { useState } from 'react';
import { Star, Calendar, User, Bell } from 'lucide-react';
import AstrologicalProfile from './AstrologicalProfile';
import BiodynamicCalendar from './BiodynamicCalendar';

type AstrologicalTab = 'profile' | 'calendar' | 'transits' | 'notifications';

export default function AstrologicalDashboard() {
  const [activeTab, setActiveTab] = useState<AstrologicalTab>('profile');

  const tabs = [
    { id: 'profile' as AstrologicalTab, name: 'Your Profile', icon: User },
    { id: 'calendar' as AstrologicalTab, name: 'Biodynamic Calendar', icon: Calendar },
    { id: 'transits' as AstrologicalTab, name: 'Planetary Transits', icon: Star },
    { id: 'notifications' as AstrologicalTab, name: 'Astrological Alerts', icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <AstrologicalProfile />;
      case 'calendar':
        return <BiodynamicCalendar />;
      case 'transits':
        return <PlanetaryTransits />;
      case 'notifications':
        return <AstrologicalNotifications />;
      default:
        return <AstrologicalProfile />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="flex items-center mb-6">
          <Star className="w-6 h-6 mr-2 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Astrological Garden System</h1>
        </div>
        
        <p className="text-gray-300 mb-6">
          Harness the power of cosmic cycles to optimize your garden timing, understand your gardening personality, 
          and align your plant care with celestial rhythms for enhanced growth and abundance.
        </p>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {renderContent()}
    </div>
  );
}

// Planetary Transits Component
function PlanetaryTransits() {
  const [currentTransits] = useState([
    {
      planet: 'Sun',
      currentSign: 'Capricorn',
      effect: 'Goal-oriented energy for garden planning',
      gardeningGuidance: 'Focus on long-term garden structures and perennial plantings',
      duration: 'Until January 20',
      intensity: 'High'
    },
    {
      planet: 'Moon',
      currentSign: 'Cancer',
      effect: 'Nurturing energy for plant care',
      gardeningGuidance: 'Excellent time for watering, transplanting, and emotional plant connection',
      duration: '2-3 days',
      intensity: 'Medium'
    },
    {
      planet: 'Venus',
      currentSign: 'Pisces',
      effect: 'Beauty and harmony in garden design',
      gardeningGuidance: 'Perfect for aesthetic improvements and flowering plant care',
      duration: 'Until February 15',
      intensity: 'Medium'
    },
    {
      planet: 'Mars',
      currentSign: 'Gemini',
      effect: 'Active energy for garden work',
      gardeningGuidance: 'Great time for pruning, weeding, and high-energy garden tasks',
      duration: 'Until March 10',
      intensity: 'High'
    },
    {
      planet: 'Jupiter',
      currentSign: 'Taurus',
      effect: 'Expansion and abundance',
      gardeningGuidance: 'Favorable for starting new garden projects and expanding growing areas',
      duration: 'Until May 2025',
      intensity: 'Low'
    },
    {
      planet: 'Saturn',
      currentSign: 'Pisces',
      effect: 'Structure and discipline in gardening',
      gardeningGuidance: 'Time to establish sustainable systems and long-term garden plans',
      duration: 'Until 2026',
      intensity: 'Low'
    }
  ]);

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'Medium': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'Low': return 'bg-green-500/20 border-green-500/40 text-green-400';
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
    }
  };

  const getPlanetEmoji = (planet: string) => {
    const planetEmojis: { [key: string]: string } = {
      'Sun': '☉',
      'Moon': '☽',
      'Mercury': '☿',
      'Venus': '♀',
      'Mars': '♂',
      'Jupiter': '♃',
      'Saturn': '♄'
    };
    return planetEmojis[planet] || '★';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <Star className="w-6 h-6 mr-2 text-purple-400" />
          Current Planetary Transits
        </h2>
        <p className="text-gray-300 mb-6">
          Track how planetary movements influence your garden work and timing decisions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentTransits.map((transit, index) => (
            <div key={index} className={`border rounded-xl p-4 ${getIntensityColor(transit.intensity)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getPlanetEmoji(transit.planet)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{transit.planet} in {transit.currentSign}</h3>
                    <span className="text-xs opacity-75">Intensity: {transit.intensity}</span>
                  </div>
                </div>
                <span className="text-xs opacity-75">{transit.duration}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium opacity-90">Effect:</span>
                  <p className="text-sm opacity-75">{transit.effect}</p>
                </div>
                <div>
                  <span className="text-sm font-medium opacity-90">Garden Guidance:</span>
                  <p className="text-sm opacity-75">{transit.gardeningGuidance}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4">Upcoming Important Transits</h3>
        <div className="space-y-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-medium">New Moon in Aquarius</span>
              <span className="text-sm text-gray-400">January 29</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Perfect time for innovative garden planning and starting experimental growing projects.
            </p>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">Venus enters Aries</span>
              <span className="text-sm text-gray-400">February 4</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Energetic boost for garden beautification and quick-growing flowering plants.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-purple-400 font-medium">Full Moon in Leo</span>
              <span className="text-sm text-gray-400">February 12</span>
            </div>
            <p className="text-sm text-gray-300 mt-1">
              Optimal harvesting time, especially for fruits and seeds. Peak potency for medicinal herbs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Astrological Notifications Component
function AstrologicalNotifications() {
  const [notifications] = useState([
    {
      type: 'urgent',
      title: 'Full Moon Harvest Window',
      message: 'Peak time for harvesting herbs and collecting seeds. Maximum potency available for the next 48 hours.',
      action: 'Plan harvest activities',
      time: 'Now - Next 2 days'
    },
    {
      type: 'timing',
      title: 'Root Day Optimal',
      message: 'Moon in Capricorn creates perfect conditions for planting root vegetables and transplanting perennials.',
      action: 'Plant carrots, radishes, onions',
      time: 'Today'
    },
    {
      type: 'planning',
      title: 'Venus Transit Beginning',
      message: 'Venus entering your garden sector brings 3 weeks of enhanced beauty and flowering. Perfect for aesthetic projects.',
      action: 'Plan garden beautification',
      time: 'This week'
    },
    {
      type: 'avoid',
      title: 'Mercury Retrograde Caution',
      message: 'Avoid starting new garden projects. Focus on maintenance, review, and planning instead.',
      action: 'Maintain existing plants',
      time: 'Next 3 weeks'
    },
    {
      type: 'beneficial',
      title: 'Jupiter Aspect Active',
      message: 'Expansive Jupiter energy supports growth and abundance. Excellent time for fertilizing and growth promotion.',
      action: 'Apply organic fertilizers',
      time: 'This month'
    }
  ]);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-500/20 border-red-500/40 text-red-400';
      case 'timing': return 'bg-green-500/20 border-green-500/40 text-green-400';
      case 'planning': return 'bg-blue-500/20 border-blue-500/40 text-blue-400';
      case 'avoid': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400';
      case 'beneficial': return 'bg-purple-500/20 border-purple-500/40 text-purple-400';
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-400';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'timing': return '⏰';
      case 'planning': return '📋';
      case 'avoid': return '⚠️';
      case 'beneficial': return '✨';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
          <Bell className="w-6 h-6 mr-2 text-purple-400" />
          Astrological Garden Alerts
        </h2>
        <p className="text-gray-300 mb-6">
          Receive timely notifications about optimal gardening windows based on planetary movements and lunar cycles.
        </p>

        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <div key={index} className={`border rounded-xl p-4 ${getNotificationColor(notification.type)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                  <div>
                    <h3 className="font-semibold text-white">{notification.title}</h3>
                    <span className="text-xs opacity-75">{notification.time}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm opacity-90 mb-3">{notification.message}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">
                  Recommended Action: {notification.action}
                </span>
                <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors">
                  Add to Calendar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-gray-300">Moon phase notifications (New/Full Moon alerts)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-gray-300">Planetary transit alerts (Major planetary movements)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-gray-300">Biodynamic timing (Root/Leaf/Flower/Fruit day notifications)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span className="text-gray-300">Mercury retrograde warnings</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" className="rounded" />
            <span className="text-gray-300">Plant-specific astrological care reminders</span>
          </label>
        </div>
      </div>
    </div>
  );
} 