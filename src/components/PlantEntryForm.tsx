'use client';

import { useState, useEffect } from 'react';
import { Plant, GardenLocation, Garden } from '@/types';
import { 
  Plus,
  X,
  Save,
  Edit,
  Camera,
  MapPin,
  Leaf,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PlantEntry {
  id?: string;
  plant_type: string;
  variety: string;
  planting_date: string;
  location: string;
  location_id?: string;
  notes: string;
  health_status: 'excellent' | 'good' | 'fair' | 'poor';
  stage: 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  created_at?: string;
  updated_at?: string;
}

interface PlantEntryFormProps {
  plant?: Plant;
  onFormSubmit: () => void;
}

export default function PlantEntryForm({ plant, onFormSubmit }: PlantEntryFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [entries, setEntries] = useState<PlantEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlant, setEditingPlant] = useState<PlantEntry | null>(null);
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [locations, setLocations] = useState<GardenLocation[]>([]);
  const [selectedGardenId, setSelectedGardenId] = useState<string>('');
  const [formData, setFormData] = useState<Omit<PlantEntry, 'id' | 'created_at' | 'updated_at'>>({
    plant_type: plant?.plant_type || '',
    variety: plant?.variety || '',
    planting_date: plant?.planting_date ? (new Date(plant.planting_date)).toISOString().split('T')[0] : '',
    location: plant?.location || '',
    location_id: plant?.location_id || '',
    notes: plant?.notes || '',
    health_status: plant?.health_status || 'good',
    stage: plant?.stage || 'seed'
  });

  const fetchGardens = async () => {
    try {
      const response = await fetch('/api/gardens');
      if (response.ok) {
        const data: Garden[] = await response.json();
        setGardens(data);
        if (data.length > 0) {
          // If editing a plant with a location, try to find its parent garden
          if (plant?.location_id) {
            // This is a bit tricky without a direct garden_id on the plant.
            // For now, we'll just pre-select the first garden and let the user change it.
            // A better approach would be an API endpoint to get a location's details, including its garden.
            setSelectedGardenId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch gardens", err);
    }
  };

  useEffect(() => {
    fetchGardens();
  }, [plant]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedGardenId) {
        setLocations([]);
        return;
      }
      try {
        const response = await fetch(`/api/gardens/${selectedGardenId}/locations`);
        if (response.ok) {
          const data: GardenLocation[] = await response.json();
          setLocations(data);
        } else {
          setLocations([]);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
        setLocations([]);
      }
    };

    fetchLocations();
  }, [selectedGardenId]);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/plants');
      
      if (!response.ok) {
        throw new Error('Failed to fetch plants');
      }
      
      const data = await response.json();
      if (data.success) {
        // Transform database format to component format
        const transformedPlants = data.plants.map((plant: Plant) => {
          // Ensure planting_date is properly formatted as YYYY-MM-DD
          let formattedDate = '';
          // Cast planting_date to avoid 'never' type issue
          const plantingDate = plant.planting_date as unknown as (string | Date);
          
          if (typeof plantingDate === 'string') {
            formattedDate = plantingDate.split('T')[0];
          } else if (plantingDate instanceof Date) {
            formattedDate = plantingDate.toISOString().split('T')[0];
          } else {
            // Fallback in case the date is in an unexpected format
            formattedDate = new Date(String(plantingDate)).toISOString().split('T')[0];
          }
          
          return {
            id: plant.id,
            plant_type: plant.plant_type,
            variety: plant.variety || '',
            planting_date: formattedDate,
            location: plant.location,
            location_id: plant.location_id || '',
            notes: plant.notes || '',
            health_status: plant.health_status,
            stage: plant.stage,
            created_at: plant.created_at,
            updated_at: plant.updated_at
          };
        });
        setEntries(transformedPlants);
      }
    } catch (err) {
      console.error('Error fetching plants:', err);
      setError('Failed to load plants');
      // Keep existing entries if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (type: string, description: string, location?: string) => {
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          description,
          location: location || formData.location,
        }),
      });
    } catch (err) {
      console.error('Error logging activity:', err);
      // Don't throw - activity logging shouldn't break the main flow
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const url = editingPlant ? `/api/plants/${editingPlant.id}` : '/api/plants';
      const method = editingPlant ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingPlant ? 'update' : 'save'} plant`);
      }

      const result = await response.json();
      if (result.success) {
        // Log activity
        const plantName = formData.variety ? `${formData.plant_type} (${formData.variety})` : formData.plant_type;
        if (editingPlant) {
          await logActivity('observation', `Updated ${plantName} details`);
        } else {
          await logActivity('planting', `Added new ${plantName} to garden`);
        }

        // Reset form
        setFormData({
          plant_type: '',
          variety: '',
          planting_date: '',
          location: '',
          location_id: '',
          notes: '',
          health_status: 'good',
          stage: 'seed'
        });
        setIsFormOpen(false);
        setEditingPlant(null);
        
        // Refresh the plants list
        await fetchPlants();
      }
    } catch (err) {
      console.error('Error saving plant:', err);
      setError(err instanceof Error ? err.message : 'Failed to save plant');
    } finally {
      setSaving(false);
    }
  };

  const deletePlant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plant?')) {
      return;
    }

    try {
      // Find the plant to get its details for logging
      const plantToDelete = entries.find((p: PlantEntry) => p.id === id);
      
      const response = await fetch(`/api/plants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete plant');
      }

      // Log activity
      if (plantToDelete) {
        const plantName = plantToDelete.variety ? `${plantToDelete.plant_type} (${plantToDelete.variety})` : plantToDelete.plant_type;
        await logActivity('observation', `Removed ${plantName} from garden`, plantToDelete.location);
      }

      // Refresh the plants list
      await fetchPlants();
    } catch (err) {
      console.error('Error deleting plant:', err);
      setError('Failed to delete plant');
    }
  };

  const editPlant = (plant: PlantEntry) => {
    setEditingPlant(plant);
    setFormData({
      plant_type: plant.plant_type,
      variety: plant.variety,
      planting_date: plant.planting_date,
      location: plant.location,
      location_id: plant.location_id || '',
      notes: plant.notes,
      health_status: plant.health_status,
      stage: plant.stage
    });
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingPlant(null);
    setFormData({
      plant_type: '',
      variety: '',
      planting_date: '',
      location: '',
      location_id: '',
      notes: '',
      health_status: 'good',
      stage: 'seed'
    });
    setIsFormOpen(false);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'good': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'fair': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'poor': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStageEmoji = (stage: string) => {
    switch (stage) {
      case 'seed': return '🌱';
      case 'seedling': return '🌿';
      case 'vegetative': return '🍃';
      case 'flowering': return '🌸';
      case 'fruiting': return '🍇';
      case 'harvest': return '🌾';
      default: return '🌱';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGardenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gardenId = e.target.value;
    setSelectedGardenId(gardenId);
    // Reset location when garden changes
    setFormData(prev => ({ ...prev, location_id: '', location: '' }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const locationId = e.target.value;
    const location = locations.find(l => l.id === locationId);
    setFormData(prev => ({
      ...prev,
      location_id: locationId,
      location: location?.name || ''
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🌱 Plants & Land Management</h2>
            <p className="text-gray-400 mt-1">Track your plants, crops, and land conditions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
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
          <h2 className="text-2xl font-bold">🌱 Plants & Land Management</h2>
          <p className="text-gray-400 mt-1">Track your plants, crops, and land conditions</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Entry</span>
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
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingPlant ? 'Edit Plant Entry' : 'Add New Plant Entry'}
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
                    Plant Type *
                  </label>
                  <input
                    type="text"
                    value={formData.plant_type}
                    onChange={handleInputChange}
                    name="plant_type"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Tomato, Basil, Corn"
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Variety
                  </label>
                  <input
                    type="text"
                    value={formData.variety}
                    onChange={handleInputChange}
                    name="variety"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g., Cherokee Purple, Sweet Genovese"
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Planting Date *
                  </label>
                  <input
                    type="date"
                    value={formData.planting_date}
                    onChange={handleInputChange}
                    name="planting_date"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="col-span-1">
                  <label htmlFor="garden" className="block text-sm font-medium text-gray-300 mb-1">
                    Garden *
                  </label>
                  <select
                    id="garden"
                    name="garden"
                    value={selectedGardenId}
                    onChange={handleGardenChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a Garden</option>
                    {gardens.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label htmlFor="location_id" className="block text-sm font-medium text-gray-300 mb-1">
                    Location *
                  </label>
                  <select
                    id="location_id"
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleLocationChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={!selectedGardenId || locations.length === 0}
                  >
                    <option value="">Select a Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Health Status
                  </label>
                  <select
                    value={formData.health_status}
                    onChange={handleInputChange}
                    name="health_status"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Growth Stage
                  </label>
                  <select
                    value={formData.stage}
                    onChange={handleInputChange}
                    name="stage"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    disabled={saving}
                  >
                    <option value="seed">Seed</option>
                    <option value="seedling">Seedling</option>
                    <option value="vegetative">Vegetative</option>
                    <option value="flowering">Flowering</option>
                    <option value="fruiting">Fruiting</option>
                    <option value="harvest">Harvest</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={handleInputChange}
                  name="notes"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Any observations, care notes, or remarks..."
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
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
                  <span>{saving ? (editingPlant ? 'Updating...' : 'Saving...') : (editingPlant ? 'Update Entry' : 'Save Entry')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entries List - Grouped by Location */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No plants yet</h3>
          <p className="text-gray-500 mb-4">Start your farming journey by adding your first plant!</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Add Your First Plant
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Group plants by location */}
          {Object.entries(
            entries.reduce((groups: Record<string, PlantEntry[]>, entry) => {
              const location = entry.location || 'Unknown Location';
              if (!groups[location]) {
                groups[location] = [];
              }
              groups[location].push(entry);
              return groups;
            }, {})
          )
            .sort(([a], [b]) => a.localeCompare(b)) // Sort locations alphabetically
            .map(([location, locationPlants]) => {
              // Find matching garden location for additional info
              const gardenLocation = locations.find(gl => gl.name === location);
              
              return (
                <div key={location} className="space-y-4">
                  {/* Location Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <h3 className="text-xl font-semibold text-emerald-400">
                          📍 {location}
                        </h3>
                      </div>
                      <div className="text-sm text-gray-400">
                        ({locationPlants.length} plant{locationPlants.length !== 1 ? 's' : ''})
                      </div>
                    </div>
                    {gardenLocation && (
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        {gardenLocation.light_conditions && (
                          <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400">
                            {gardenLocation.light_conditions.replace('_', ' ')}
                          </span>
                        )}
                        {gardenLocation.irrigation_type && gardenLocation.irrigation_type !== 'none' && (
                          <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400">
                            {gardenLocation.irrigation_type}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location Description */}
                  {gardenLocation?.description && (
                    <div className="text-sm text-gray-400 ml-5 mb-4">
                      {gardenLocation.description}
                    </div>
                  )}

                  {/* Plants in this location */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 ml-5">
                    {locationPlants.map((entry) => (
                      <div key={entry.id} className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800/50">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold flex items-center">
                              {getStageEmoji(entry.stage)} {entry.plant_type}
                              {entry.variety && <span className="text-gray-400 ml-2">({entry.variety})</span>}
                            </h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded text-xs font-medium border ${getHealthColor(entry.health_status)}`}>
                              {entry.health_status}
                            </div>
                            <button
                              onClick={() => editPlant(entry)}
                              className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                              title="Edit plant"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deletePlant(entry.id!)}
                              className="text-red-400 hover:text-red-300 transition-colors p-1"
                              title="Delete plant"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Planted:</span>
                            <span>{new Date(entry.planting_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Stage:</span>
                            <span className="capitalize">{entry.stage}</span>
                          </div>
                          {entry.notes && (
                            <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                              <p className="text-sm text-gray-300">{entry.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
} 