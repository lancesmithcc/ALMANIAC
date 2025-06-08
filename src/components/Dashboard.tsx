'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Leaf, Cloud, UserCircle, LogIn, LogOut, UserPlus, CalendarDays, Brain, Users, Settings, HelpCircle, AreaChart } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import WeatherWidget from './WeatherWidget';
import PlantEntryForm from '@/components/PlantEntryForm';
import AnalyticsCards from './AnalyticsCards';
import RecentEntries from './RecentEntries';
import AIInsights from './AIInsights';
import WeatherTrendsChart from './WeatherTrendsChart';
import ThreeDayForecast from '@/components/ThreeDayForecast';

const navItems = [
  { name: 'Overview', icon: AreaChart },
  { name: 'Plants & Land', icon: Leaf },
  { name: 'Weather', icon: Cloud },
  { name: 'Analytics', icon: BarChart2 },
  { name: 'Insights', icon: Brain },
  { name: 'Community', icon: Users, comingSoon: true },
  { name: 'Calendar', icon: CalendarDays, comingSoon: true },
  { name: 'Settings', icon: Settings, comingSoon: true },
  { name: 'Help & Support', icon: HelpCircle, comingSoon: true },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [currentDate, setCurrentDate] = useState('');
  const { data: session, status } = useSession();
  const isLoadingSession = status === 'loading';

  useEffect(() => {
    const today = new Date();
    setCurrentDate(today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AnalyticsCards />
              <ThreeDayForecast /> 
            </div>
            <div className="lg:col-span-1 space-y-6">
              <WeatherWidget />
              <RecentEntries />
            </div>
          </div>
        );
      case 'Plants & Land':
        return <PlantEntryForm />;
      case 'Weather':
        return (
          <div className="space-y-6">
            <WeatherWidget detailed={true} /> 
            <ThreeDayForecast expanded />
          </div>
        );
      case 'Analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-emerald-400">Farm Analytics</h2>
            <WeatherTrendsChart />
          </div>
        );
      case 'Insights':
        return <AIInsights />;
      default:
        return <p>Welcome to Almaniac! Select a tab to get started.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-gray-100 flex flex-col items-center p-4 md:p-6 selection:bg-emerald-500 selection:text-white">
      <header className="w-full max-w-7xl mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Leaf className="h-10 w-10 text-emerald-400" />
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-500">
            Almaniac
          </h1>
        </div>
        <div className="text-right">
          <p className="text-base md:text-lg text-gray-300 mb-1">{currentDate}</p>
          <div className="mt-1 flex items-center justify-end space-x-3 text-sm">
            {isLoadingSession ? (
              <p className="text-gray-400">Loading user...</p>
            ) : session?.user ? (
              <>
                <UserCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-gray-200">Hi, {session.user.username || session.user.name}</span>
                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })} 
                  className="text-red-400 hover:text-red-300 flex items-center transition-colors duration-150"
                  title="Log Out"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 flex items-center transition-colors duration-150">
                  <LogIn className="h-4 w-4 mr-1" />
                  Log In
                </Link>
                <Link href="/signup" className="text-sky-400 hover:text-sky-300 flex items-center transition-colors duration-150">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="w-full max-w-7xl bg-gray-800/30 backdrop-blur-md shadow-lg rounded-xl mb-6 md:mb-8 overflow-x-auto">
        <div className="flex space-x-1 p-2 min-w-max">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => !item.comingSoon && setActiveTab(item.name)}
              className={`flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out 
                ${item.comingSoon ? 'text-gray-500 cursor-not-allowed' : 
                  activeTab === item.name 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'text-gray-300 hover:bg-gray-700/60 hover:text-emerald-300'}
              `}
              title={item.comingSoon ? `${item.name} (Coming Soon)` : item.name}
              disabled={item.comingSoon}
            >
              <item.icon className={`h-5 w-5 mr-2 ${item.comingSoon ? '' : activeTab === item.name ? '' : 'text-emerald-400'}`} />
              {item.name}
              {item.comingSoon && <span className="ml-2 text-xs bg-gray-600 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl flex-grow">
        {renderContent()}
      </main>

      <footer className="w-full max-w-7xl mt-8 py-6 text-center text-gray-500 text-sm border-t border-gray-700/50">
        <p>&copy; {new Date().getFullYear()} Almaniac. Cultivating Intelligence.</p>
      </footer>
    </div>
  );
} 