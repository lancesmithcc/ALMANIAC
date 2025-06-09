'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink, CheckCircle, Clock, CloudRain } from 'lucide-react';
import { DashboardStats } from '@/types';

interface Alert {
  id: string;
  type: 'plant_health' | 'weather' | 'harvest' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionRequired: string;
  actionSteps: string[];
  learnMoreUrl?: string;
  plantId?: string;
  plantName?: string;
  estimatedTime?: string;
  dueDate?: string;
}

interface AlertsDetailProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats;
}

const AlertsDetail: React.FC<AlertsDetailProps> = ({ isOpen, onClose, stats }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      generateAlerts();
    }
  }, [isOpen, stats]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateAlerts = async () => {
    setLoading(true);
    
    // Generate alerts based on stats
    const generatedAlerts: Alert[] = [];

    // Plant health alerts
    if (stats.plants_needing_attention > 0) {
      generatedAlerts.push({
        id: 'plant-health-1',
        type: 'plant_health',
        severity: stats.plants_needing_attention > 3 ? 'high' : 'medium',
        title: `${stats.plants_needing_attention} Plants Need Attention`,
        description: `You have ${stats.plants_needing_attention} plants with fair or poor health status that require immediate care.`,
        actionRequired: 'Inspect and treat affected plants',
        actionSteps: [
          'Go to Plants & Land tab to view all plants',
          'Check plants marked as "fair" or "poor" health',
          'Look for signs of pests, disease, or nutrient deficiency',
          'Adjust watering schedule if soil is too dry or wet',
          'Consider adding organic fertilizer or compost',
          'Remove any dead or diseased plant material'
        ],
        estimatedTime: '15-30 minutes per plant',
        dueDate: 'Within 24 hours'
      });
    }

    // Weather alerts
    if (stats.weather_alerts > 0) {
      generatedAlerts.push({
        id: 'weather-1',
        type: 'weather',
        severity: 'high',
        title: 'Extreme Weather Conditions',
        description: 'Recent weather data shows extreme conditions that may affect your plants.',
        actionRequired: 'Protect plants from weather stress',
        actionSteps: [
          'Check current weather in the Weather tab',
          'Move potted plants to sheltered areas if needed',
          'Install shade cloth for extreme heat (>90°F)',
          'Cover sensitive plants before frost (<32°F)',
          'Ensure proper drainage for heavy rain',
          'Adjust watering schedule based on conditions'
        ],
        learnMoreUrl: '#weather',
        estimatedTime: '20-45 minutes',
        dueDate: 'Before next weather event'
      });
    }

    // Harvest alerts
    if (stats.next_harvest_days <= 7 && stats.total_plants > 0) {
      generatedAlerts.push({
        id: 'harvest-1',
        type: 'harvest',
        severity: stats.next_harvest_days <= 3 ? 'high' : 'medium',
        title: `Harvest Ready in ${stats.next_harvest_days} Days`,
        description: 'Some of your plants are approaching harvest time and need monitoring.',
        actionRequired: 'Monitor and prepare for harvest',
        actionSteps: [
          'Check plants in fruiting/flowering stage daily',
          'Look for signs of ripeness (color, size, firmness)',
          'Prepare harvesting tools (clean scissors, baskets)',
          'Plan storage or preservation methods',
          'Harvest in early morning for best quality',
          'Start succession planting for continuous harvest'
        ],
        estimatedTime: '10-20 minutes daily',
        dueDate: `In ${stats.next_harvest_days} days`
      });
    }

    // Low activity alert
    if (stats.recent_activities < 3 && stats.total_plants > 0) {
      generatedAlerts.push({
        id: 'maintenance-1',
        type: 'maintenance',
        severity: 'low',
        title: 'Low Garden Activity',
        description: 'You have had minimal garden activity in the past week. Regular care is important for plant health.',
        actionRequired: 'Increase garden maintenance',
        actionSteps: [
          'Schedule daily 10-minute garden walks',
          'Check soil moisture levels',
          'Look for pest or disease signs',
          'Remove weeds and dead plant material',
          'Log observations in Plants & Land tab',
          'Take photos to track plant progress'
        ],
        estimatedTime: '10-15 minutes daily',
        dueDate: 'Start today'
      });
    }

    // No plants alert
    if (stats.total_plants === 0) {
      generatedAlerts.push({
        id: 'getting-started-1',
        type: 'maintenance',
        severity: 'medium',
        title: 'No Plants Registered',
        description: 'Start your gardening journey by adding your first plants to track their growth and health.',
        actionRequired: 'Add your first plants',
        actionSteps: [
          'Go to Plants & Land tab',
          'Click "Add New Plant" button',
          'Enter plant details (type, variety, location)',
          'Set up garden locations if needed',
          'Take initial photos for progress tracking',
          'Set up a regular care schedule'
        ],
        learnMoreUrl: '#plants',
        estimatedTime: '5-10 minutes per plant',
        dueDate: 'Start today'
      });
    }

    setAlerts(generatedAlerts);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'plant_health': return <AlertTriangle className="w-5 h-5" />;
      case 'weather': return <CloudRain className="w-5 h-5" />;
      case 'harvest': return <CheckCircle className="w-5 h-5" />;
      case 'maintenance': return <Clock className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const handleActionClick = (alert: Alert) => {
    if (alert.learnMoreUrl) {
      // Navigate to specific tab or section
      if (alert.learnMoreUrl === '#weather') {
        // This would trigger navigation to weather tab
        onClose();
        // You could emit an event or use a callback to change the active tab
      } else if (alert.learnMoreUrl === '#plants') {
        // Navigate to plants tab
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Garden Alerts & Actions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-700/50 rounded-lg p-4">
                  <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-emerald-400 mb-2">All Clear!</h3>
              <p className="text-gray-400">No alerts at this time. Your garden is in good shape!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-6 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(alert.type)}
                      <div>
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <p className="text-sm opacity-80 capitalize">{alert.severity} Priority</p>
                      </div>
                    </div>
                    <div className="text-right text-sm opacity-80">
                      <div>Due: {alert.dueDate}</div>
                      <div>Time: {alert.estimatedTime}</div>
                    </div>
                  </div>

                  <p className="text-gray-200 mb-4">{alert.description}</p>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Action Required: {alert.actionRequired}
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300 ml-6">
                      {alert.actionSteps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {alert.learnMoreUrl && (
                    <button
                      onClick={() => handleActionClick(alert)}
                      className="inline-flex items-center text-sm bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Take Action Now
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-900/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>💡 Tip: Regular garden maintenance prevents most issues</span>
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsDetail; 