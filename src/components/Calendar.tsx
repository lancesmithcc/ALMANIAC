'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bell, Target, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'harvest' | 'planting' | 'watering' | 'fertilizing' | 'pruning' | 'other';
  time?: string;
  plant?: string;
  location?: string;
  notes?: string;
  alarm?: boolean;
  completed?: boolean;
}

interface MoonPhaseData {
  phase: string;
  illumination: number;
  emoji: string;
}

const getMoonPhaseEmoji = (phase: string): string => {
  const phaseMap: { [key: string]: string } = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
  };
  return phaseMap[phase] || '🌙';
};

const getEventEmoji = (type: string): string => {
  const eventMap: { [key: string]: string } = {
    'harvest': '🌾',
    'planting': '🌱',
    'watering': '💧',
    'fertilizing': '🌿',
    'pruning': '✂️',
    'other': '📝'
  };
  return eventMap[type] || '📝';
};

const getEventColor = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    'harvest': 'bg-orange-500/20 border-orange-500/40 text-orange-400',
    'planting': 'bg-green-500/20 border-green-500/40 text-green-400',
    'watering': 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    'fertilizing': 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    'pruning': 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    'other': 'bg-gray-500/20 border-gray-500/40 text-gray-400'
  };
  return colorMap[type] || 'bg-gray-500/20 border-gray-500/40 text-gray-400';
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    type: 'other',
    alarm: false
  });
  const [moonPhases, setMoonPhases] = useState<{ [key: string]: MoonPhaseData }>({});

  // Calculate moon phase for a given date
  const calculateMoonPhase = (date: Date): MoonPhaseData => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Julian day calculation
    const a = Math.floor((14 - month) / 12);
    const y = year - a;
    const m = month + 12 * a - 3;
    const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
    
    // Moon phase calculation
    let daysSinceNewMoon = (jd - 2451549.5) % 29.53058867;
    if (daysSinceNewMoon < 0) daysSinceNewMoon += 29.53058867;
    
    const illumination = (1 - Math.cos(2 * Math.PI * daysSinceNewMoon / 29.53058867)) / 2;
    
    // Determine phase name
    let phase: string;
    if (daysSinceNewMoon < 1.84566) phase = "New Moon";
    else if (daysSinceNewMoon < 5.53699) phase = "Waxing Crescent";
    else if (daysSinceNewMoon < 9.22831) phase = "First Quarter";
    else if (daysSinceNewMoon < 12.91963) phase = "Waxing Gibbous";
    else if (daysSinceNewMoon < 16.61096) phase = "Full Moon";
    else if (daysSinceNewMoon < 20.30228) phase = "Waning Gibbous";
    else if (daysSinceNewMoon < 23.99361) phase = "Last Quarter";
    else phase = "Waning Crescent";
    
    return {
      phase,
      illumination: Math.round(illumination * 100),
      emoji: getMoonPhaseEmoji(phase)
    };
  };

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('almaniac-calendar-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('almaniac-calendar-events', JSON.stringify(events));
  }, [events]);

  // Calculate moon phases for the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const phases: { [key: string]: MoonPhaseData } = {};
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];
      phases[dateKey] = calculateMoonPhase(date);
    }
    
    setMoonPhases(phases);
  }, [currentDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const addEvent = () => {
    if (!selectedDate || !newEvent.title) return;
    
    const event: CalendarEvent = {
      id: Date.now().toString(),
      date: selectedDate.toISOString().split('T')[0],
      title: newEvent.title,
      type: newEvent.type || 'other',
      time: newEvent.time,
      plant: newEvent.plant,
      location: newEvent.location,
      notes: newEvent.notes,
      alarm: newEvent.alarm || false,
      completed: false
    };
    
    setEvents([...events, event]);
    setShowEventModal(false);
    setNewEvent({ type: 'other', alarm: false });
  };

  const toggleEventCompletion = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, completed: !event.completed }
        : event
    ));
  };

  const deleteEvent = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2 text-emerald-400" />
            Garden Calendar
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
            >
              Today
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-medium text-white min-w-[180px] text-center">
                {formatMonthYear(currentDate)}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            const dateString = date?.toISOString().split('T')[0];
            const moonPhase = dateString ? moonPhases[dateString] : null;
            const dayEvents = getEventsForDate(date);
            
            return (
              <div
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`
                  relative p-2 min-h-[80px] border border-gray-700/50 cursor-pointer
                  transition-all duration-200 rounded-lg
                  ${date ? 'hover:bg-gray-700/30' : ''}
                  ${isToday(date) ? 'bg-emerald-500/20 border-emerald-500/50' : ''}
                  ${isSelected(date) ? 'bg-blue-500/20 border-blue-500/50' : ''}
                `}
              >
                {date && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        isToday(date) ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {date.getDate()}
                      </span>
                      {moonPhase && (
                        <span className="text-lg" title={`${moonPhase.phase} (${moonPhase.illumination}%)`}>
                          {moonPhase.emoji}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border ${getEventColor(event.type)} 
                            ${event.completed ? 'opacity-50 line-through' : ''}`}
                          title={`${event.title} ${event.time ? `at ${event.time}` : ''}`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{getEventEmoji(event.type)}</span>
                            {event.alarm && <Bell className="w-3 h-3" />}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-semibold text-white">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              {(() => {
                const dateString = selectedDate.toISOString().split('T')[0];
                const moonPhase = moonPhases[dateString];
                return moonPhase && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span className="text-lg">{moonPhase.emoji}</span>
                    <span>{moonPhase.phase} ({moonPhase.illumination}%)</span>
                  </div>
                );
              })()}
            </div>
            <button
              onClick={() => setShowEventModal(true)}
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          </div>

          <div className="space-y-3">
            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No events scheduled for this day</p>
              </div>
            ) : (
              getEventsForDate(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={`border rounded-lg p-4 ${getEventColor(event.type)} 
                    ${event.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getEventEmoji(event.type)}</span>
                      <span className={`font-medium ${event.completed ? 'line-through' : ''}`}>
                        {event.title}
                      </span>
                      {event.alarm && <Bell className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleEventCompletion(event.id)}
                        className={`p-1 rounded ${
                          event.completed 
                            ? 'text-green-400 hover:text-green-300' 
                            : 'text-gray-400 hover:text-green-400'
                        } transition-colors`}
                      >
                        <Target className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    {event.time && (
                      <p><span className="text-gray-400">Time:</span> {event.time}</p>
                    )}
                    {event.plant && (
                      <p><span className="text-gray-400">Plant:</span> {event.plant}</p>
                    )}
                    {event.location && (
                      <p><span className="text-gray-400">Location:</span> {event.location}</p>
                    )}
                    {event.notes && (
                      <p><span className="text-gray-400">Notes:</span> {event.notes}</p>
                    )}
                    <p><span className="text-gray-400">Type:</span> {event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Add Garden Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., Harvest tomatoes"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select
                  value={newEvent.type || 'other'}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="harvest">🌾 Harvest</option>
                  <option value="planting">🌱 Planting</option>
                  <option value="watering">💧 Watering</option>
                  <option value="fertilizing">🌿 Fertilizing</option>
                  <option value="pruning">✂️ Pruning</option>
                  <option value="other">📝 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Time</label>
                <input
                  type="time"
                  value={newEvent.time || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Plant</label>
                <input
                  type="text"
                  value={newEvent.plant || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, plant: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., Tomatoes, Basil"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="e.g., Greenhouse, Garden bed A"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea
                  value={newEvent.notes || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="alarm"
                  checked={newEvent.alarm || false}
                  onChange={(e) => setNewEvent({ ...newEvent, alarm: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="alarm" className="text-sm text-gray-300 flex items-center">
                  <Bell className="w-4 h-4 mr-1" />
                  Set alarm reminder
                </label>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEventModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEvent}
                disabled={!newEvent.title}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 