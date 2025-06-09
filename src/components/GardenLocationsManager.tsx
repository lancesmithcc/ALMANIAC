'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus,
  X,
  Save,
  Edit,
  MapPin,
  Users
} from 'lucide-react';

interface LocationEntry {
  id?: string;
  name: string;
  description: string;
  notes: string;
  size: string;
  soil_type: string;
  light_conditions: 'full_sun' | 'partial_sun' | 'partial_shade' | 'full_shade';
  irrigation_type: 'manual' | 'drip' | 'sprinkler' | 'none';
  microclimate_notes: string;
  created_at?: string;
  updated_at?: string;
}

export default function GardenLocationsManager() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationEntry | null>(null);

  const [formData, setFormData] = useState<Omit<LocationEntry, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    description: '',
    notes: '',
    size: '',
    soil_type: '',
    light_conditions: 'full_sun',
    irrigation_type: 'manual',
    microclimate_notes: ''
  });

  // Load locations from API when component mounts
  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/garden-locations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch garden locations');
      }
      
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error('Error fetching garden locations:', err);
      setError('Failed to load garden locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const url = editingLocation ? `/api/garden-locations/${editingLocation.id}` : '/api/garden-locations';
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingLocation ? 'update' : 'save'} garden location`);
      }

      const result = await response.json();
      if (result.success) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          notes: '',
          size: '',
          soil_type: '',
          light_conditions: 'full_sun',
          irrigation_type: 'manual',
          microclimate_notes: ''
        });
        setIsFormOpen(false);
        setEditingLocation(null);
        
        // Refresh the locations list
        await fetchLocations();
      }
    } catch (err) {
      console.error('Error saving garden location:', err);
      setError(err instanceof Error ? err.message : 'Failed to save garden location');
    } finally {
      setSaving(false);
    }
  };

  const deleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this garden location?')) {
      return;
    }

    try {
      const response = await fetch(`/api/garden-locations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete garden location');
      }

      // Refresh the locations list
      await fetchLocations();
    } catch (err) {
      console.error('Error deleting garden location:', err);
      setError('Failed to delete garden location');
    }
  };

  const editLocation = (location: LocationEntry) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description,
      notes: location.notes,
      size: location.size,
      soil_type: location.soil_type,
      light_conditions: location.light_conditions,
      irrigation_type: location.irrigation_type,
      microclimate_notes: location.microclimate_notes
    });
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      notes: '',
      size: '',
      soil_type: '',
      light_conditions: 'full_sun',
      irrigation_type: 'manual',
      microclimate_notes: ''
    });
    setIsFormOpen(false);
  };

  const getLightIcon = (lightCondition: string) => {
    switch (lightCondition) {
      case 'full_sun': return '☀️';
      case 'partial_sun': return '⛅';
      case 'partial_shade': return '🌤️';
      case 'full_shade': return '☁️';
      default: return '☀️';
    }
  };

  const getIrrigationIcon = (irrigationType: string) => {
    switch (irrigationType) {
      case 'drip': return '💧';
      case 'sprinkler': return '🚿';
      case 'manual': return '🪣';
      case 'none': return '🌵';
      default: return '🪣';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🗺️ Garden Locations</h2>
            <p className="text-gray-400 mt-1">Manage your garden areas and microclimates</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">🗺️ Garden Locations</h2>
          <p className="text-gray-400 mt-1">Manage your garden areas and microclimates</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-200 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingLocation ? 'Edit Garden Location' : 'Add New Garden Location'}
              </h3>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white"
                disabled={saving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., North Garden Bed, Greenhouse A"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., 4x8 feet, 20 sq meters"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Light Conditions
                  </label>
                  <select
                    value={formData.light_conditions}
                    onChange={(e) => setFormData({ ...formData, light_conditions: e.target.value as 'full_sun' | 'partial_sun' | 'partial_shade' | 'full_shade' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    <option value="full_sun">Full Sun (6+ hours)</option>
                    <option value="partial_sun">Partial Sun (4-6 hours)</option>
                    <option value="partial_shade">Partial Shade (2-4 hours)</option>
                    <option value="full_shade">Full Shade (&lt;2 hours)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Irrigation Type
                  </label>
                  <select
                    value={formData.irrigation_type}
                    onChange={(e) => setFormData({ ...formData, irrigation_type: e.target.value as 'manual' | 'drip' | 'sprinkler' | 'none' })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    <option value="manual">Manual Watering</option>
                    <option value="drip">Drip Irrigation</option>
                    <option value="sprinkler">Sprinkler System</option>
                    <option value="none">No Irrigation</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Soil Type
                  </label>
                  <input
                    type="text"
                    value={formData.soil_type}
                    onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Clay, Sandy loam, Compost-rich"
                    disabled={saving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Brief description of this location..."
                  rows={2}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Growing Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Notes about what grows well here, challenges, etc..."
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Microclimate Notes
                </label>
                <textarea
                  value={formData.microclimate_notes}
                  onChange={(e) => setFormData({ ...formData, microclimate_notes: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Wind patterns, temperature variations, moisture levels, etc..."
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? (editingLocation ? 'Updating...' : 'Saving...') : (editingLocation ? 'Update Location' : 'Save Location')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {locations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No garden locations yet</h3>
            <p className="text-gray-500 mb-4">Create locations to organize your garden and track microclimates!</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Your First Location
            </button>
          </div>
        ) : (
          locations.map((location) => (
            <div key={location.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-emerald-400" />
                    {location.name}
                  </h3>
                  {location.description && (
                    <p className="text-sm text-gray-400 mt-1">{location.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => router.push(`/garden/${location.id}/members`)}
                    className="text-green-400 hover:text-green-300 transition-colors p-1"
                    title="Manage members"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => editLocation(location)}
                    className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                    title="Edit location"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteLocation(location.id!)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Delete location"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getLightIcon(location.light_conditions)}</span>
                    <span className="text-gray-400">Light:</span>
                    <span className="capitalize">{location.light_conditions.replace('_', ' ')}</span>
                  </div>
                  {location.size && (
                    <div className="text-gray-400">
                      Size: <span className="text-white">{location.size}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getIrrigationIcon(location.irrigation_type)}</span>
                    <span className="text-gray-400">Water:</span>
                    <span className="capitalize">{location.irrigation_type.replace('_', ' ')}</span>
                  </div>
                  {location.soil_type && (
                    <div className="text-gray-400">
                      Soil: <span className="text-white">{location.soil_type}</span>
                    </div>
                  )}
                </div>

                {location.notes && (
                  <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-300 mb-1"><strong>Growing Notes:</strong></p>
                    <p className="text-sm text-gray-300">{location.notes}</p>
                  </div>
                )}

                {location.microclimate_notes && (
                  <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                    <p className="text-sm text-blue-300 mb-1"><strong>Microclimate:</strong></p>
                    <p className="text-sm text-blue-200">{location.microclimate_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 