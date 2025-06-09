'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Leaf, 
  MapPin, 
  Heart, 
  Sprout, 
  Users,
  ArrowLeft,
  UserPlus,
  LogIn 
} from 'lucide-react';
import { Garden, GardenLocation, Plant } from '@/types';

interface GardenWithData extends Garden {
  locations: GardenLocation[];
  plants: Plant[];
  total_plants: number;
  unique_types: number;
  member_count?: number;
}

export default function GardenViewPage() {
  const params = useParams();
  const { data: session } = useSession();
  const gardenId = params.id as string;
  
  const [garden, setGarden] = useState<GardenWithData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingAccess, setRequestingAccess] = useState(false);

  const fetchGarden = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gardens/${gardenId}/public`);
      
      if (response.ok) {
        const data = await response.json();
        setGarden(data);
      } else if (response.status === 404) {
        setError('Garden not found or is private');
      } else if (response.status === 403) {
        setError('You need permission to view this garden');
      } else {
        setError('Failed to load garden');
      }
    } catch (error) {
      console.error('Error fetching garden:', error);
      setError('Failed to load garden');
    } finally {
      setLoading(false);
    }
  }, [gardenId]);

  useEffect(() => {
    if (gardenId) {
      fetchGarden();
    }
  }, [gardenId, fetchGarden]);

  const requestAccess = async () => {
    if (!session?.user?.email) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }

    setRequestingAccess(true);
    try {
      const response = await fetch('/api/garden-access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gardenId, 
          message: `Hi! I'd like to collaborate on your garden "${garden?.name}". I found it through your shared link.` 
        }),
      });

      if (response.ok) {
        alert('Access request sent! The garden owner will be notified.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to send access request');
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      alert('Failed to send access request');
    } finally {
      setRequestingAccess(false);
    }
  };

  const getStageEmoji = (stage: string) => {
    const stages = {
      'seed': '🌰',
      'seedling': '🌱',
      'vegetative': '🌿',
      'flowering': '🌸',
      'fruiting': '🍅',
      'harvest': '🏆'
    };
    return stages[stage as keyof typeof stages] || '🌱';
  };

  const getHealthColor = (status: string) => {
    const colors = {
      'excellent': 'text-green-400 bg-green-400/20',
      'good': 'text-emerald-400 bg-emerald-400/20',
      'fair': 'text-yellow-400 bg-yellow-400/20',
      'poor': 'text-red-400 bg-red-400/20'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400 bg-gray-400/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading garden...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-4">
            <p className="text-red-400 mb-4">{error}</p>
            {!session && (
              <div className="space-y-3">
                <p className="text-gray-300 text-sm">Sign in to request access to this garden</p>
                <Link 
                  href={`/login?callbackUrl=${encodeURIComponent(window.location.href)}`}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!garden) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Image 
                src="/almaniaclogo.svg" 
                alt="Almaniac" 
                width={32}
                height={32}
              />
              <h1 className="text-xl font-bold text-emerald-400">Almaniac</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {!session ? (
                <Link 
                  href={`/login?callbackUrl=${encodeURIComponent(window.location.href)}`}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In to Collaborate
                </Link>
              ) : (
                <button
                  onClick={requestAccess}
                  disabled={requestingAccess}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  {requestingAccess ? 'Requesting...' : 'Request Access'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Garden Header */}
        <div className="bg-gray-800/30 backdrop-blur-md rounded-xl p-6 mb-8 border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{garden.name}</h1>
              {garden.description && (
                <p className="text-gray-300 mb-4">{garden.description}</p>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  {garden.total_plants} plants
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4" />
                  {garden.unique_types} varieties
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {garden.locations.length} locations
                </div>
                {garden.member_count && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {garden.member_count} members
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Garden Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/30 backdrop-blur-md rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Leaf className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Plants</p>
                <p className="text-xl font-bold text-white">{garden.total_plants}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-md rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Sprout className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Plant Types</p>
                <p className="text-xl font-bold text-white">{garden.unique_types}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-md rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Locations</p>
                <p className="text-xl font-bold text-white">{garden.locations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-md rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Heart className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Health Avg</p>
                <p className="text-xl font-bold text-white">
                  {garden.plants.length > 0 
                    ? Math.round((garden.plants.reduce((sum, plant) => {
                        const healthValues = { excellent: 4, good: 3, fair: 2, poor: 1 };
                        return sum + (healthValues[plant.health_status as keyof typeof healthValues] || 0);
                      }, 0) / garden.plants.length) * 25)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Garden Locations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {garden.locations.map((location) => {
              const locationPlants = garden.plants.filter(p => p.location_id === location.id);
              return (
                <div key={location.id} className="bg-gray-800/30 backdrop-blur-md rounded-lg p-4 border border-gray-700">
                  <h3 className="font-semibold text-white mb-2">{location.name}</h3>
                  {location.description && (
                    <p className="text-gray-300 text-sm mb-3">{location.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      {locationPlants.length} plants
                    </span>
                    <div className="flex gap-1">
                      {locationPlants.slice(0, 3).map((plant, idx) => (
                        <span key={idx} className="text-lg" title={plant.plant_type}>
                          {getStageEmoji(plant.stage)}
                        </span>
                      ))}
                      {locationPlants.length > 3 && (
                        <span className="text-xs text-gray-400 ml-1">
                          +{locationPlants.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Plants */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Plants in Garden</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {garden.plants.map((plant) => (
              <div key={plant.id} className="bg-gray-800/30 backdrop-blur-md rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{plant.plant_type}</h3>
                    {plant.variety && (
                      <p className="text-sm text-gray-400">{plant.variety}</p>
                    )}
                  </div>
                  <span className="text-2xl">{getStageEmoji(plant.stage)}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Health:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(plant.health_status)}`}>
                      {plant.health_status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Stage:</span>
                    <span className="text-gray-300 capitalize">{plant.stage}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Planted:</span>
                    <span className="text-gray-300">
                      {new Date(plant.planting_date as string).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-gray-300">{plant.location}</span>
                  </div>
                </div>
                
                {plant.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400">{plant.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 