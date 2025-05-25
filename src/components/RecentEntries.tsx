'use client';

import { useState, useEffect } from 'react';
import { Droplets, Target, Clock, Sprout, Scissors } from 'lucide-react';
import { ActivityLog } from '@/types';

export default function RecentEntries() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/activities?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load recent activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return <Droplets className="w-4 h-4" />;
      case 'pruning':
        return <Scissors className="w-4 h-4" />;
      case 'planting':
        return <Sprout className="w-4 h-4" />;
      case 'harvest':
        return <Target className="w-4 h-4" />;
      case 'observation':
        return <Clock className="w-4 h-4" />;
      case 'fertilizing':
        return <Target className="w-4 h-4" />;
      case 'pest_control':
        return <Target className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'watering':
        return 'text-blue-400 bg-blue-500/10';
      case 'pruning':
        return 'text-orange-400 bg-orange-500/10';
      case 'planting':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'harvest':
        return 'text-purple-400 bg-purple-500/10';
      case 'observation':
        return 'text-cyan-400 bg-cyan-500/10';
      case 'fertilizing':
        return 'text-green-400 bg-green-500/10';
      case 'pest_control':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getActivityEmoji = (type: string) => {
    switch (type) {
      case 'watering': return '💧';
      case 'pruning': return '✂️';
      case 'planting': return '🌱';
      case 'harvest': return '🌾';
      case 'observation': return '👁️';
      case 'fertilizing': return '🌿';
      case 'pest_control': return '🛡️';
      default: return '📝';
    }
  };

  const formatTimeAgo = (date: Date | string) => {
    const activityDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          📋 Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          📋 Recent Activity
        </h3>
        <div className="text-center py-4">
          <p className="text-red-400 mb-2">{error}</p>
          <button 
            onClick={fetchActivities}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          📋 Recent Activity
        </h3>
        <button 
          onClick={fetchActivities}
          className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Refresh
        </button>
      </div>
      
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">No recent activities</p>
          <p className="text-gray-500 text-sm">Start by adding some plants or logging activities</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity) => {
            const colorClass = getActivityColor(activity.type);
            const Icon = getActivityIcon(activity.type);
            const emoji = getActivityEmoji(activity.type);
            
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  {Icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{emoji}</span>
                    <p className="font-medium text-white truncate">
                      {activity.description}
                    </p>
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    {activity.location && (
                      <p className="text-sm text-gray-400">
                        📍 {activity.location}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 capitalize">
                        {activity.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {activity.notes && (
                    <p className="text-xs text-gray-400 mt-2 italic">
                      "{activity.notes}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 