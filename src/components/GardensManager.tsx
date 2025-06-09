'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, MapPin, Settings, Trash2 } from 'lucide-react';
import { Garden, GardenLocation, GardenWithLocations } from '@/types';

interface GardensManagerProps {
  userId: string;
}

export default function GardensManager({ userId }: GardensManagerProps) {
  const [gardens, setGardens] = useState<GardenWithLocations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGarden, setNewGarden] = useState({
    name: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    fetchGardens();
  }, []);

  const fetchGardens = async () => {
    try {
      const response = await fetch('/api/gardens');
      if (response.ok) {
        const gardensData: Garden[] = await response.json();
        
        // Fetch locations for each garden
        const gardensWithLocations = await Promise.all(
          gardensData.map(async (garden) => {
            try {
              const locationsResponse = await fetch(`/api/gardens/${garden.id}/locations`);
              const locations: GardenLocation[] = locationsResponse.ok ? await locationsResponse.json() : [];
              return {
                ...garden,
                locations,
                memberCount: 1, // TODO: Fetch actual member count
                userRole: 'owner' as const // TODO: Fetch actual user role
              };
            } catch (error) {
              console.error(`Error fetching locations for garden ${garden.id}:`, error);
              return {
                ...garden,
                locations: [],
                memberCount: 1,
                userRole: 'owner' as const
              };
            }
          })
        );
        
        setGardens(gardensWithLocations);
      }
    } catch (error) {
      console.error('Error fetching gardens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGarden = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/gardens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGarden),
      });

      if (response.ok) {
        setNewGarden({ name: '', description: '', notes: '' });
        setShowCreateForm(false);
        fetchGardens();
      } else {
        console.error('Failed to create garden');
      }
    } catch (error) {
      console.error('Error creating garden:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Gardens</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Garden
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Garden</h3>
          <form onSubmit={handleCreateGarden} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Garden Name *
              </label>
              <input
                type="text"
                value={newGarden.name}
                onChange={(e) => setNewGarden({ ...newGarden, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newGarden.description}
                onChange={(e) => setNewGarden({ ...newGarden, description: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={newGarden.notes}
                onChange={(e) => setNewGarden({ ...newGarden, notes: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Create Garden
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {gardens.map((garden) => (
          <div key={garden.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{garden.name}</h3>
                {garden.description && (
                  <p className="text-gray-400 text-sm mt-1">{garden.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {/* TODO: Navigate to garden members */}}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  title="Manage Members"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {/* TODO: Navigate to garden settings */}}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                  title="Garden Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Locations:</span>
                <span className="text-white">{garden.locations.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Members:</span>
                <span className="text-white">{garden.memberCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Your Role:</span>
                <span className="text-green-400 capitalize">{garden.userRole}</span>
              </div>
            </div>

            {garden.locations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Locations:</h4>
                <div className="space-y-1">
                  {garden.locations.slice(0, 3).map((location) => (
                    <div key={location.id} className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{location.name}</span>
                    </div>
                  ))}
                  {garden.locations.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{garden.locations.length - 3} more locations
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => {/* TODO: Navigate to garden details */}}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors text-sm"
              >
                Manage Garden
              </button>
            </div>
          </div>
        ))}
      </div>

      {gardens.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No gardens yet</p>
            <p className="text-sm">Create your first garden to get started</p>
          </div>
        </div>
      )}
    </div>
  );
} 