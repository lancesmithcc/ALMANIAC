'use client';

import { useState, useEffect } from 'react';
import { Sprout, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { DashboardStats } from '@/types';

export default function AnalyticsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10',
          border: 'border-emerald-500/20',
          icon: 'text-emerald-400',
          text: 'text-emerald-400'
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
          border: 'border-blue-500/20',
          icon: 'text-blue-400',
          text: 'text-blue-400'
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10',
          border: 'border-purple-500/20',
          icon: 'text-purple-400',
          text: 'text-purple-400'
        };
      case 'orange':
        return {
          bg: 'bg-gradient-to-r from-orange-500/10 to-red-500/10',
          border: 'border-orange-500/20',
          icon: 'text-orange-400',
          text: 'text-orange-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-gray-500/10 to-slate-500/10',
          border: 'border-gray-500/20',
          icon: 'text-gray-400',
          text: 'text-gray-400'
        };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-700 rounded-lg"></div>
                <div>
                  <div className="h-3 bg-gray-700 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-700 rounded w-12"></div>
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-700 rounded w-8 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50">
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <p className="text-orange-400 mb-2">{error || 'Failed to load analytics'}</p>
          <button 
            onClick={fetchAnalytics}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const analyticsData = [
    {
      title: 'Total Plants',
      value: stats.total_plants.toString(),
      change: `${stats.active_plants} active`,
      changeType: stats.active_plants > 0 ? 'positive' as const : 'neutral' as const,
      icon: Sprout,
      color: 'emerald'
    },
    {
      title: 'Health Score',
      value: `${stats.average_health_score}%`,
      change: `${stats.plants_needing_attention} need attention`,
      changeType: stats.plants_needing_attention === 0 ? 'positive' as const : 'warning' as const,
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Recent Activity',
      value: stats.recent_activities.toString(),
      change: 'past 7 days',
      changeType: 'neutral' as const,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Alerts',
      value: (stats.plants_needing_attention + stats.weather_alerts).toString(),
      change: stats.weather_alerts > 0 ? 'weather alerts' : 'no issues',
      changeType: (stats.plants_needing_attention + stats.weather_alerts) === 0 ? 'positive' as const : 'warning' as const,
      icon: AlertTriangle,
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-4">
      {analyticsData.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        const Icon = stat.icon;
        
        return (
          <div
            key={index}
            className={`${colors.bg} ${colors.border} border rounded-xl p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${colors.bg} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${colors.icon}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-medium flex items-center ${
                  stat.changeType === 'positive' 
                    ? 'text-emerald-400' 
                    : stat.changeType === 'warning' 
                      ? 'text-orange-400' 
                      : 'text-gray-400'
                }`}>
                  {stat.change}
                </div>
                <p className="text-xs text-gray-500">status</p>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Summary Card */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800/50 mt-6">
        <h4 className="font-semibold mb-3 flex items-center">
          📊 Quick Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Plants:</span>
            <span className="text-emerald-400">{stats.total_plants}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Health Score:</span>
            <span className={stats.average_health_score >= 80 ? 'text-emerald-400' : stats.average_health_score >= 60 ? 'text-yellow-400' : 'text-red-400'}>
              {stats.average_health_score}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Next Harvest:</span>
            <span className="text-blue-400">{stats.next_harvest_days} days</span>
          </div>
        </div>
      </div>
    </div>
  );
} 