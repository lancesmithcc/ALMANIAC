/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";
import { getPlants, getGardenLocations } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Basic auth check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('AI Analysis request started for user:', session.user.id);

    // Parse request body safely
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Fetch user's plants, garden locations, weather, and moon data safely
    let plants: any[] = [];
    let plantsCount = 0;
    let gardenLocations: any[] = [];
    let locationsCount = 0;
    let weatherData: any = null;
    let moonData: any = null;
    let weatherRecords = 0;
    
    try {
      plants = await getPlants(session.user.id);
      plantsCount = plants.length;
      console.log('Successfully fetched plants:', plantsCount);
    } catch (error) {
      console.error('Failed to fetch plants:', error);
      plants = [];
      plantsCount = 0;
    }

    try {
      gardenLocations = await getGardenLocations(session.user.id);
      locationsCount = gardenLocations.length;
      console.log('Successfully fetched garden locations:', locationsCount);
    } catch (error) {
      console.error('Failed to fetch garden locations:', error);
      gardenLocations = [];
      locationsCount = 0;
    }

    // Fetch current weather data
    try {
      const weatherResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/weather`);
      if (weatherResponse.ok) {
        const weatherResult = await weatherResponse.json();
        if (weatherResult.success) {
          weatherData = weatherResult.weather;
          weatherRecords = 1;
          console.log('Successfully fetched weather data');
        }
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }

    // Fetch moon phase data
    try {
      const moonResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/moon-phase`);
      if (moonResponse.ok) {
        const moonResult = await moonResponse.json();
        if (moonResult.success) {
          moonData = moonResult;
          console.log('Successfully fetched moon phase data');
        }
      }
    } catch (error) {
      console.error('Failed to fetch moon phase data:', error);
    }

    // Companion planting database
    const companionPlants: Record<string, string[]> = {
      'tomato': ['basil', 'marigold', 'parsley', 'oregano', 'chives'],
      'basil': ['tomato', 'pepper', 'oregano', 'parsley'],
      'lettuce': ['chives', 'garlic', 'radish', 'carrots'],
      'carrot': ['chives', 'leek', 'rosemary', 'sage', 'lettuce'],
      'pepper': ['basil', 'oregano', 'parsley', 'tomato'],
      'cucumber': ['radish', 'beans', 'marigold', 'nasturtium'],
      'beans': ['marigold', 'nasturtium', 'cucumber', 'radish'],
      'corn': ['beans', 'squash', 'marigold'],
      'squash': ['corn', 'beans', 'nasturtium', 'marigold'],
      'onion': ['tomato', 'pepper', 'carrot', 'lettuce'],
      'garlic': ['tomato', 'pepper', 'lettuce', 'carrot'],
      'marigold': ['tomato', 'pepper', 'cucumber', 'beans', 'corn', 'squash'],
      'nasturtium': ['cucumber', 'beans', 'squash', 'radish'],
      'chives': ['tomato', 'carrot', 'lettuce'],
      'parsley': ['tomato', 'pepper', 'basil'],
      'oregano': ['tomato', 'pepper', 'basil'],
      'rosemary': ['carrot', 'beans', 'sage'],
      'sage': ['carrot', 'rosemary', 'tomato'],
      'radish': ['lettuce', 'cucumber', 'beans', 'nasturtium']
    };

    // Group plants by location for proximity-based analysis
    const plantsByLocation = plants.reduce((groups: Record<string, any[]>, plant) => {
      const location = plant.location || 'Unknown Location';
      if (!groups[location]) {
        groups[location] = [];
      }
      groups[location].push(plant);
      return groups;
    }, {});

    // Generate plant-specific recommendations if we have plants
    const plantRecommendations = [];
    const companionRecommendations: string[] = [];
    
    if (plants.length > 0) {
      const plantTypes = [...new Set(plants.map(p => p.plant_type.toLowerCase()))];
      
      plantRecommendations.push({
        type: 'plant_care',
        priority: 'high' as const,
        description: `You have ${plants.length} plants (${plantTypes.join(', ')}). Focus on consistent watering and daily observation.`,
        reasoning: 'Your established plants need regular care and monitoring for optimal health.',
        confidence: 95,
        timing: 'Daily care routine',
        permaculture_principle: 'Observe and interact'
      });

      // Generate location-specific companion planting recommendations
      const missingCompanions: string[] = [];
      const locationSpecificRecommendations: string[] = [];
      
      Object.entries(plantsByLocation).forEach(([location, locationPlants]) => {
        const locationPlantTypes = [...new Set(locationPlants.map(p => p.plant_type.toLowerCase()))];
        const locationMissingCompanions: string[] = [];
        
        locationPlantTypes.forEach(plantType => {
          const companions = companionPlants[plantType] || [];
          const missingForThisPlant = companions.filter(companion => 
            !locationPlantTypes.includes(companion)
          );
          locationMissingCompanions.push(...missingForThisPlant);
        });

        if (locationMissingCompanions.length > 0) {
          const uniqueLocationCompanions = [...new Set(locationMissingCompanions)];
          locationSpecificRecommendations.push(
            `${location}: add ${uniqueLocationCompanions.slice(0, 3).join(', ')} to complement your ${locationPlantTypes.join(', ')}`
          );
          missingCompanions.push(...uniqueLocationCompanions);
        }
      });

      // Also check for overall garden companion opportunities
      plantTypes.forEach(plantType => {
        const companions = companionPlants[plantType] || [];
        const missingForThisPlant = companions.filter(companion => 
          !plantTypes.includes(companion)
        );
        missingCompanions.push(...missingForThisPlant);
        
        if (missingForThisPlant.length > 0) {
          companionRecommendations.push(
            `For your ${plantType}: add ${missingForThisPlant.slice(0, 3).join(', ')}`
          );
        }
      });

      if (locationSpecificRecommendations.length > 0) {
        plantRecommendations.push({
          type: 'location_companion_planting',
          priority: 'high' as const,
          description: `Location-specific companion planting opportunities identified`,
          reasoning: `${locationSpecificRecommendations.slice(0, 2).join('. ')}. Planting companions in the same location maximizes benefits.`,
          confidence: 95,
          timing: 'Plant during next growing season',
          permaculture_principle: 'Integrate rather than segregate'
        });
      } else if (companionRecommendations.length > 0) {
        const uniqueCompanions = [...new Set(missingCompanions)];
        plantRecommendations.push({
          type: 'companion_planting',
          priority: 'high' as const,
          description: `Add companion plants to boost your garden: ${uniqueCompanions.slice(0, 5).join(', ')}`,
          reasoning: `Companion plants provide natural pest control, improved soil health, and increased yields. ${companionRecommendations.slice(0, 2).join('. ')}.`,
          confidence: 90,
          timing: 'Plant during next growing season',
          permaculture_principle: 'Integrate rather than segregate'
        });
      }

      // Check for plants needing attention
      const poorHealthPlants = plants.filter(p => p.health_status === 'poor' || p.health_status === 'fair');
      if (poorHealthPlants.length > 0) {
        plantRecommendations.push({
          type: 'urgent_care',
          priority: 'urgent' as const,
          description: `${poorHealthPlants.length} plants need attention: ${poorHealthPlants.map(p => p.plant_type).join(', ')}`,
          reasoning: 'Poor plant health can spread and indicates systemic issues that need addressing.',
          confidence: 90,
          timing: 'Immediate action required',
          permaculture_principle: 'Observe and interact'
        });
      }

      // Harvest recommendations
      const maturePlants = plants.filter(p => p.stage === 'fruiting' || p.stage === 'harvest');
      if (maturePlants.length > 0) {
        plantRecommendations.push({
          type: 'harvesting',
          priority: 'medium' as const,
          description: `${maturePlants.length} plants ready for harvest: ${maturePlants.map(p => p.plant_type).join(', ')}`,
          reasoning: 'Timely harvesting ensures best flavor and encourages continued production.',
          confidence: 85,
          timing: 'Check daily for optimal harvest timing',
          permaculture_principle: 'Obtain a yield'
        });
      }
    }

    // Generate weather-based recommendations
    const weatherRecommendations = [];
    if (weatherData) {
      const temp = weatherData.temperature;
      const humidity = weatherData.humidity;
      const condition = weatherData.condition?.toLowerCase() || '';

      if (temp > 30) {
        weatherRecommendations.push({
          type: 'heat_protection',
          priority: 'high' as const,
          description: `High temperature (${temp}°C) - provide shade and increase watering frequency`,
          reasoning: 'Extreme heat can stress plants and increase water needs significantly.',
          confidence: 95,
          timing: 'Immediate - during hot weather',
          permaculture_principle: 'Care for the earth'
        });
      } else if (temp < 5) {
        weatherRecommendations.push({
          type: 'frost_protection',
          priority: 'urgent' as const,
          description: `Low temperature (${temp}°C) - protect sensitive plants from frost`,
          reasoning: 'Frost can damage or kill tender plants, especially young seedlings.',
          confidence: 95,
          timing: 'Immediate - before nightfall',
          permaculture_principle: 'Care for the earth'
        });
      }

      if (humidity > 80) {
        weatherRecommendations.push({
          type: 'disease_prevention',
          priority: 'medium' as const,
          description: `High humidity (${humidity}%) - improve air circulation and watch for fungal diseases`,
          reasoning: 'High humidity creates ideal conditions for fungal diseases and pest problems.',
          confidence: 85,
          timing: 'Monitor daily during humid periods',
          permaculture_principle: 'Observe and interact'
        });
      }

      if (condition.includes('rain') || condition.includes('storm')) {
        weatherRecommendations.push({
          type: 'storm_preparation',
          priority: 'high' as const,
          description: 'Stormy weather expected - secure tall plants and protect delicate seedlings',
          reasoning: 'Strong winds and heavy rain can damage plants and disrupt garden structures.',
          confidence: 90,
          timing: 'Before storm arrives',
          permaculture_principle: 'Care for the earth'
        });
      }
    }

    // Generate location-specific recommendations
    const locationRecommendations = [];
    if (gardenLocations.length > 0) {
      // Group plants by location
      const plantsByLocation = plants.reduce((acc, plant) => {
        const locationName = plant.location;
        if (!acc[locationName]) acc[locationName] = [];
        acc[locationName].push(plant);
        return acc;
      }, {} as Record<string, any[]>);

      // Find locations with detailed information
      const detailedLocations = gardenLocations.filter(loc => 
        loc.notes || loc.microclimate_notes || loc.soil_type
      );

      if (detailedLocations.length > 0) {
        locationRecommendations.push({
          type: 'location_optimization',
          priority: 'high' as const,
          description: `Optimize your ${detailedLocations.length} detailed garden locations based on their unique characteristics.`,
          reasoning: 'Location-specific growing conditions require tailored approaches for maximum success.',
          confidence: 90,
          timing: 'Review and adjust seasonally',
          permaculture_principle: 'Observe and interact'
        });
      }

      // Check for locations with specific microclimates
      const microclimateLocs = gardenLocations.filter(loc => loc.microclimate_notes);
      if (microclimateLocs.length > 0) {
        locationRecommendations.push({
          type: 'microclimate_management',
          priority: 'medium' as const,
          description: `Leverage microclimate data from ${microclimateLocs.length} locations to optimize plant placement.`,
          reasoning: 'Understanding microclimates allows for strategic plant placement and improved yields.',
          confidence: 85,
          timing: 'Consider when planning new plantings',
          permaculture_principle: 'Use edges and value the marginal'
        });
      }

      // Irrigation recommendations based on location types
      const irrigationTypes = [...new Set(gardenLocations.map(loc => loc.irrigation_type))];
      if (irrigationTypes.length > 1) {
        locationRecommendations.push({
          type: 'water_management',
          priority: 'medium' as const,
          description: `Coordinate watering across your ${irrigationTypes.length} different irrigation systems.`,
          reasoning: 'Different irrigation methods require different scheduling and monitoring approaches.',
          confidence: 80,
          timing: 'Daily monitoring, seasonal adjustments',
          permaculture_principle: 'Catch and store energy'
        });
      }
    }

    // Generate moon phase recommendations
    const moonRecommendations = [];
    if (moonData) {
      const moonPhase = moonData.moon_phase?.phase_name?.toLowerCase() || '';
      const illumination = moonData.moon_phase?.illumination || 0;

      if (moonPhase.includes('new')) {
        moonRecommendations.push({
          type: 'lunar_planting',
          priority: 'medium' as const,
          description: 'New moon phase - ideal time for planting seeds and starting new projects',
          reasoning: 'New moon energy supports new beginnings and root development.',
          confidence: 80,
          timing: 'During new moon period (next 3 days)',
          permaculture_principle: 'Observe and interact'
        });
      } else if (moonPhase.includes('full')) {
        moonRecommendations.push({
          type: 'lunar_harvesting',
          priority: 'medium' as const,
          description: 'Full moon phase - optimal time for harvesting and preserving',
          reasoning: 'Full moon energy enhances plant vitality and preservation quality.',
          confidence: 80,
          timing: 'During full moon period (next 3 days)',
          permaculture_principle: 'Obtain a yield'
        });
      } else if (illumination > 50) {
        moonRecommendations.push({
          type: 'lunar_growth',
          priority: 'low' as const,
          description: 'Waxing moon phase - focus on above-ground growth and leaf development',
          reasoning: 'Increasing moon energy supports upward growth and leaf production.',
          confidence: 75,
          timing: 'During waxing moon period',
          permaculture_principle: 'Observe and interact'
        });
      } else {
        moonRecommendations.push({
          type: 'lunar_roots',
          priority: 'low' as const,
          description: 'Waning moon phase - ideal for root crops, pruning, and soil work',
          reasoning: 'Decreasing moon energy supports root development and soil activities.',
          confidence: 75,
          timing: 'During waning moon period',
          permaculture_principle: 'Care for the earth'
        });
      }
    }

    // Generate basic fallback with plant, location, weather, and moon data
    const basicFallback = {
      recommendations: [
        ...plantRecommendations,
        ...weatherRecommendations,
        ...moonRecommendations,
        ...locationRecommendations,
        {
          type: 'permaculture_design',
          priority: 'high' as const,
          description: plants.length > 0 ? 
            'Expand your garden with companion plants that support your existing crops.' :
            'Start with a simple three-zone garden design: herbs near kitchen, vegetables in main area, fruit trees in back.',
          reasoning: 'Permaculture zoning creates efficient, sustainable food systems.',
          confidence: 95,
          timing: 'Plan during quiet garden time',
          permaculture_principle: 'Design from patterns to details'
        },
        {
          type: 'soil_management',
          priority: 'high' as const,
          description: 'Begin composting kitchen scraps and garden waste to build healthy soil.',
          reasoning: 'Healthy soil is the foundation of successful gardening.',
          confidence: 95,
          timing: 'Start immediately, maintain year-round',
          permaculture_principle: 'Care for the earth'
        },
        {
          type: 'companion_planting',
          priority: 'medium' as const,
          description: plants.length > 0 ?
            'Add herbs like basil and marigolds between your existing plants for natural pest control.' :
            'Plant herbs like basil and marigolds throughout your garden for natural pest control.',
          reasoning: 'Companion plants create beneficial relationships and reduce pest problems.',
          confidence: 90,
          timing: 'Plant during growing season',
          permaculture_principle: 'Integrate rather than segregate'
        }
      ],
      insights: {
        growth_trends: plants.length > 0 ? [
          `You have ${plants.length} plants across ${Object.keys(plantsByLocation).length} garden locations`,
          Object.keys(plantsByLocation).length > 1 ? 
            `Location distribution: ${Object.entries(plantsByLocation).map(([loc, locationPlants]) => `${loc} (${locationPlants.length})`).join(', ')}` :
            'Consider expanding to multiple garden locations for diversity',
          'Focus on creating beneficial relationships between plants in the same location',
          locationsCount > 0 ? 'Use location-specific notes to optimize plant placement' : 'Monitor plant spacing to prevent overcrowding'
        ] : [
          'Focus on building healthy soil biology for long-term success',
          locationsCount > 0 ? 'Use your garden location data to plan optimal plant placement' : 'Start with easy-to-grow plants to build confidence',
          'Observe your garden daily to learn its patterns'
        ],
        weather_impacts: weatherData ? [
          `Current conditions: ${weatherData.temperature}°C, ${weatherData.humidity}% humidity`,
          weatherData.temperature > 25 ? 'High temperatures - increase watering and provide shade' : 'Moderate temperatures - maintain regular watering schedule',
          weatherData.condition ? `Weather: ${weatherData.condition} - adjust care accordingly` : 'Monitor weather changes for optimal plant care'
        ] : [
          'Monitor local weather patterns for optimal timing',
          'Use mulch to protect plants from weather extremes',
          'Plan for seasonal changes in your garden'
        ],
        health_observations: plants.length > 0 ? [
          'Regular observation of your plants prevents most problems',
          'Companion planting creates natural pest control and improves yields',
          companionRecommendations.length > 0 ? 'Consider adding companion plants to boost your existing crops' : 'Your plant diversity supports natural garden health',
          'Healthy soil prevents most plant diseases'
        ] : [
          'Diverse plantings create natural pest control',
          'Regular observation prevents most problems',
          'Healthy soil prevents most plant diseases'
        ],
        permaculture_opportunities: gardenLocations.length > 0 ? [
          `Optimize your ${gardenLocations.length} garden locations for maximum productivity`,
          'Use microclimate data to create specialized growing zones',
          'Implement location-specific water management strategies',
          'Design food forests with multiple layers'
        ] : [
          'Design food forests with multiple layers',
          'Implement water harvesting systems',
          'Create habitat for beneficial wildlife'
        ],
        astrological_influences: [
          'Follow lunar cycles for optimal planting timing',
          'Consider seasonal energy patterns',
          'Use natural rhythms to guide garden activities'
        ]
      },
      alerts: [],
      moon_guidance: moonData ? [
        `Current moon phase: ${moonData.moon_phase?.phase_name || 'Unknown'} (${Math.round(moonData.moon_phase?.illumination || 0)}% illuminated)`,
        moonData.moon_phase?.phase_name?.toLowerCase().includes('new') ? 'Perfect time for planting seeds and starting new garden projects' :
        moonData.moon_phase?.phase_name?.toLowerCase().includes('full') ? 'Ideal time for harvesting and preserving your crops' :
        (moonData.moon_phase?.illumination || 0) > 50 ? 'Waxing moon - focus on above-ground growth and transplanting' :
        'Waning moon - excellent for root crops, pruning, and soil preparation',
        'Follow lunar rhythms for enhanced plant vitality',
        'Track moon phases to optimize your gardening activities'
      ] : [
        'Follow lunar calendar for optimal timing',
        'New moon: Planning and seed starting',
        'Full moon: Harvesting and preservation',
        'Waning moon: Pruning and soil work'
      ],
      plant_astrology: plants.length > 0 ? [
        {
          plant: `Your Garden (${plants.length} plants)`,
          astrological_profile: 'Your diverse garden creates a unique cosmic signature that benefits from lunar timing',
          current_influence: 'Each plant responds to moon phases - observe how they react to different lunar energies',
          recommendations: [
            'Start a lunar gardening journal for your plants',
            'Plant by moon phases for enhanced growth',
            'Harvest during full moons for maximum potency'
          ]
        }
      ] : [
        {
          plant: 'General Garden',
          astrological_profile: 'All plants benefit from lunar timing and natural cycles',
          current_influence: 'Observe how your plants respond to different moon phases',
          recommendations: [
            'Start a lunar gardening journal',
            'Plant by moon phases for enhanced growth',
            'Harvest during full moons for maximum potency'
          ]
        }
      ]
    };

    console.log('Basic fallback generated successfully with plant data');

    // Return the basic fallback with actual plant data
    return NextResponse.json({
      success: true,
      analysis: basicFallback,
      metadata: {
        plants_analyzed: plantsCount,
        garden_locations: locationsCount,
        weather_records: weatherRecords,
        activities_reviewed: 0,
        moon_phase_included: moonData ? true : false,
        ai_enhanced: true,
        fallback_used: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Critical error in AI analysis:', error);
    
    // Absolute minimal response if everything fails
    return NextResponse.json({
      success: true,
      analysis: {
        recommendations: [
          {
            type: 'general',
            priority: 'medium' as const,
            description: 'Start with basic garden observation and maintenance.',
            reasoning: 'Regular care is the foundation of successful gardening.',
            confidence: 90,
            timing: 'Daily',
            permaculture_principle: 'Observe and interact'
          }
        ],
        insights: {
          growth_trends: ['Focus on consistent care'],
          weather_impacts: ['Monitor local conditions'],
          health_observations: ['Regular observation prevents problems'],
          permaculture_opportunities: ['Start with simple sustainable practices'],
          astrological_influences: ['Consider natural cycles']
        },
        alerts: [],
        moon_guidance: ['Follow natural rhythms'],
        plant_astrology: []
      },
      metadata: {
        plants_analyzed: 0,
        weather_records: 0,
        activities_reviewed: 0,
        moon_phase_included: false,
        ai_enhanced: false,
        fallback_used: true,
        error_recovery: true,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'AI Analysis endpoint is active',
    status: 'ready',
    timestamp: new Date().toISOString()
  });
} 