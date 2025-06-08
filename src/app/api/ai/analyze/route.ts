/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { DeepSeekAnalysisResponse, WeatherData, AIRecommendation } from '@/types';
import { getPlants, getRecentActivities, saveAIRecommendation, getActiveRecommendations } from '@/lib/database';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

// Enhanced fallback function that always provides meaningful insights
function generateFallbackInsights(
  plants: any[], 
  activities: any[], 
  weatherData: any[], 
  moonPhaseData: any
): DeepSeekAnalysisResponse {
  const season = getCurrentSeason();
  
  // Base recommendations that are always relevant
  const baseRecommendations = [
    {
      type: 'permaculture_design',
      priority: 'high' as const,
      description: 'Establish a three-zone permaculture design: Zone 1 (daily herbs near kitchen), Zone 2 (vegetable garden), Zone 3 (fruit trees and perennials).',
      reasoning: 'Permaculture zoning maximizes efficiency and creates sustainable food systems. This foundational design principle works for any garden size.',
      confidence: 95,
      timing: moonPhaseData ? `Optimal during ${moonPhaseData.phase} for planning activities` : 'Plan during new moon phases',
      permaculture_principle: 'Design from patterns to details'
    },
    {
      type: 'soil_management',
      priority: 'high' as const,
      description: 'Start or enhance your composting system with kitchen scraps, garden waste, and fallen leaves to build rich, living soil.',
      reasoning: 'Healthy soil biology is the foundation of all successful gardens. Composting creates nutrient-rich amendments while reducing waste.',
      confidence: 95,
      timing: 'Year-round activity, intensify during waning moon phases',
      permaculture_principle: 'Care for the earth'
    },
    {
      type: 'companion_planting',
      priority: 'medium' as const,
      description: 'Plant marigolds, nasturtiums, and herbs like basil throughout your garden to attract beneficial insects and deter pests naturally.',
      reasoning: 'Companion planting creates beneficial relationships between plants and reduces the need for external inputs.',
      confidence: 90,
      timing: moonPhaseData?.moon_sign_element === 'Earth' ? 'Excellent timing with Earth element moon' : 'Best during earth sign moons',
      permaculture_principle: 'Integrate rather than segregate'
    }
  ];

  // Add moon-specific recommendations if we have moon data
  if (moonPhaseData) {
    baseRecommendations.push({
      type: 'moon_timing',
      priority: 'medium' as const,
      description: `Current ${moonPhaseData.phase} in ${moonPhaseData.zodiac_sign} is ideal for: ${moonPhaseData.optimal_activities.slice(0, 3).join(', ')}`,
      reasoning: `${moonPhaseData.planting_guidance} The ${moonPhaseData.moon_sign_element} element enhances ${moonPhaseData.moon_sign_element.toLowerCase()}-related activities.`,
      confidence: 85,
      timing: `Active now during ${moonPhaseData.phase}`,
      permaculture_principle: 'Observe and interact'
    });
  }

  // Add plant-specific recommendations if we have plants
  if (plants.length > 0) {
    const plantTypes = [...new Set(plants.map(p => p.plant_type))];
    
    baseRecommendations.push({
      type: 'watering',
      priority: 'medium' as const,
      description: `Water your ${plantTypes.join(', ')} deeply but less frequently to encourage strong root development.`,
      reasoning: 'Deep, infrequent watering promotes drought resistance and healthier root systems compared to frequent shallow watering.',
      confidence: 90,
      timing: moonPhaseData?.moon_sign_element === 'Water' ? 'Excellent timing with Water element moon' : 'Best during water sign moons (Cancer, Scorpio, Pisces)',
      permaculture_principle: 'Use renewable resources'
    });

    // Add harvest recommendations for mature plants
    const maturePlants = plants.filter(p => p.stage === 'fruiting' || p.stage === 'harvest');
    if (maturePlants.length > 0) {
      baseRecommendations.push({
        type: 'harvesting',
        priority: 'high' as const,
        description: `Harvest your ${maturePlants.map(p => p.plant_type).join(', ')} during the early morning for best flavor and storage life.`,
        reasoning: 'Morning harvesting captures plants at peak hydration and sugar content, before heat stress affects quality.',
        confidence: 95,
        timing: moonPhaseData?.phase === 'Full Moon' ? 'Perfect timing - full moon enhances plant potency' : 'Best during full moon for maximum potency',
        permaculture_principle: 'Obtain a yield'
      });
    }
  }

  // Season-specific recommendations
  const seasonalRec = getSeasonalRecommendation(season, moonPhaseData);
  if (seasonalRec) {
    baseRecommendations.push(seasonalRec);
  }

  // Generate plant astrology readings
  const plantAstrology = plants.length > 0 ? plants.map(plant => ({
    plant: `${plant.plant_type} (${plant.variety || 'N/A'})`,
    astrological_profile: getPlantAstrologicalProfile(plant.plant_type),
    current_influence: moonPhaseData ? 
      `Current ${moonPhaseData.zodiac_sign} moon in ${moonPhaseData.moon_sign_element} element ${getPlantMoonInfluence(plant.plant_type, moonPhaseData)}` : 
      'Consult lunar calendar for optimal care timing',
    recommendations: getPlantAstrologicalRecommendations(plant.plant_type, moonPhaseData)
  })) : [
    {
      plant: 'General Garden',
      astrological_profile: 'All plants benefit from lunar and planetary timing. Start observing how your plants respond to different moon phases.',
      current_influence: moonPhaseData ? 
        `Current ${moonPhaseData.phase} in ${moonPhaseData.zodiac_sign} brings ${moonPhaseData.energy_description.toLowerCase()}` : 
        'Begin observing moon phases and their effects on your garden',
      recommendations: [
        'Start a lunar gardening journal to track plant responses',
        'Plant seeds during new moons for strong root development',
        'Harvest during full moons for maximum potency and flavor',
        'Prune during waning moons for healthy regrowth'
      ]
    }
  ];

  return {
    recommendations: baseRecommendations,
    insights: {
      growth_trends: [
        plants.length > 0 ? 
          `You have ${plants.length} plants in various stages - focus on creating beneficial relationships between them` :
          'Start with easy-to-grow plants like herbs and leafy greens to build confidence',
        'Implement polyculture systems for increased biodiversity and resilience',
        'Focus on perennial food systems for long-term sustainability',
        season === 'spring' ? 'Spring energy supports rapid growth and new plantings' :
        season === 'summer' ? 'Summer abundance - focus on maintenance and harvesting' :
        season === 'fall' ? 'Fall preparation - plant cover crops and prepare for winter' :
        'Winter planning - design improvements and seed starting indoors'
      ],
      weather_impacts: [
        weatherData.length > 0 ? 
          'Use current weather patterns to guide your watering and protection strategies' :
          'Monitor local weather patterns to optimize plant care timing',
        'Implement rainwater harvesting during wet seasons',
        'Create microclimates for season extension and plant protection',
        'Use mulching to conserve moisture and regulate soil temperature'
      ],
      health_observations: [
        plants.length > 0 ? 
          'Diverse plantings create natural pest control through beneficial insects' :
          'Plan for plant diversity to create natural pest control systems',
        'Companion plants enhance each other\'s growth and disease resistance',
        'Healthy soil biology prevents most plant diseases naturally',
        'Regular observation helps catch issues early when they\'re easier to address'
      ],
      permaculture_opportunities: [
        'Design food forests with multiple canopy layers for maximum productivity',
        'Install greywater systems for water recycling and conservation',
        'Create habitat corridors for beneficial wildlife and pollinators',
        'Establish seed saving and plant propagation systems for self-reliance',
        'Build community connections through seed swaps and knowledge sharing'
      ],
      astrological_influences: [
        moonPhaseData ? 
          `${moonPhaseData.zodiac_sign} moon in ${moonPhaseData.moon_sign_element} element enhances ${moonPhaseData.moon_sign_element.toLowerCase()}-related activities` : 
          'Moon sign influences plant growth patterns and optimal timing',
        moonPhaseData ? 
          `Current moon phase (${moonPhaseData.phase}) energy: ${moonPhaseData.energy_description}` : 
          'Lunar phases affect plant energy and growth cycles',
        'Plant according to astrological correspondences for enhanced vitality',
        'Time harvesting with full moons for maximum potency',
        'Use waning moons for pruning and soil preparation work'
      ]
    },
    alerts: activities.length === 0 ? [
      {
        type: 'info' as const,
        message: 'Start logging your garden activities to get more personalized recommendations',
        plant_id: undefined
      }
    ] : [],
    moon_guidance: moonPhaseData ? [
      `Current Phase: ${moonPhaseData.phase} (${moonPhaseData.illumination}% illuminated)`,
      `Zodiac Sign: ${moonPhaseData.zodiac_sign} (${moonPhaseData.moon_sign_element} element)`,
      `Optimal Activities: ${moonPhaseData.optimal_activities.join(', ')}`,
      `Planting Guidance: ${moonPhaseData.planting_guidance}`,
      `Energy Focus: ${moonPhaseData.energy_description}`,
      `Next 3 days: Continue ${moonPhaseData.moon_sign_element.toLowerCase()}-element activities`
    ] : [
      'Follow lunar calendar for optimal timing',
      'New moon: Planning and seed starting',
      'Waxing moon: Growth and transplanting', 
      'Full moon: Harvesting and preservation',
      'Waning moon: Pruning and soil work',
      'Track moon phases to optimize your garden activities'
    ],
    plant_astrology: plantAstrology
  };
}

// Helper functions
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function getSeasonalRecommendation(season: string, _moonPhaseData: any) {
  const seasonalAdvice = {
    spring: {
      type: 'planting',
      priority: 'high' as const,
      description: 'Spring is perfect for starting seeds indoors and preparing garden beds. Focus on cool-season crops like lettuce, peas, and radishes.',
      reasoning: 'Spring energy supports new growth and rapid development. Cool-season crops thrive in moderate temperatures.',
      confidence: 90,
      timing: 'Plant cool-season crops 2-4 weeks before last frost',
      permaculture_principle: 'Observe and interact'
    },
    summer: {
      type: 'water_management',
      priority: 'high' as const,
      description: 'Implement deep mulching and efficient watering systems. Focus on heat-tolerant plants and succession planting.',
      reasoning: 'Summer heat requires water conservation strategies and careful plant selection for continued productivity.',
      confidence: 90,
      timing: 'Water early morning or evening to reduce evaporation',
      permaculture_principle: 'Use renewable resources'
    },
    fall: {
      type: 'soil_management',
      priority: 'high' as const,
      description: 'Plant cover crops, collect and compost fallen leaves, and prepare beds for winter protection.',
      reasoning: 'Fall preparation sets the foundation for next year\'s success and protects soil biology through winter.',
      confidence: 90,
      timing: 'Plant cover crops 6-8 weeks before hard frost',
      permaculture_principle: 'Care for the earth'
    },
    winter: {
      type: 'permaculture_design',
      priority: 'medium' as const,
      description: 'Plan next year\'s garden layout, start seeds indoors, and maintain tools and infrastructure.',
      reasoning: 'Winter is ideal for planning, learning, and preparing for the growing season ahead.',
      confidence: 85,
      timing: 'Start planning 2-3 months before spring planting',
      permaculture_principle: 'Design from patterns to details'
    }
  };
  
  return seasonalAdvice[season as keyof typeof seasonalAdvice];
}

function getPlantAstrologicalProfile(plantType: string): string {
  const profiles: { [key: string]: string } = {
    tomato: 'Tomatoes are ruled by Venus and resonate with fire energy. They thrive with passionate care and respond well to lunar timing.',
    lettuce: 'Lettuce is governed by the Moon and water element. It grows best when planted during water sign moons.',
    basil: 'Basil is ruled by Mars and carries fire energy. It enhances the growth of nearby plants and loves warm, sunny conditions.',
    carrot: 'Carrots are ruled by Mercury and earth element. They develop best when planted during earth sign moons.',
    pepper: 'Peppers are ruled by Mars and fire element. They need warmth and respond well to passionate, attentive care.',
    cucumber: 'Cucumbers are ruled by the Moon and water element. They thrive with consistent moisture and lunar timing.',
    bean: 'Beans are ruled by Venus and air element. They fix nitrogen and create beneficial relationships with other plants.',
    corn: 'Corn is ruled by the Sun and fire element. It stands tall and proud, providing structure for climbing plants.',
    squash: 'Squash is ruled by the Moon and water element. It spreads abundantly and provides ground cover.',
    herb: 'Herbs are generally ruled by Mercury and carry healing properties. They enhance both garden and human health.'
  };
  
  return profiles[plantType.toLowerCase()] || 
    `${plantType} carries unique planetary energies and benefits from lunar timing and astrological awareness in its care.`;
}

function getPlantMoonInfluence(plantType: string, moonPhaseData: any): string {
  if (!moonPhaseData) return 'supports growth when aligned with lunar cycles';
  
  const element = moonPhaseData.moon_sign_element.toLowerCase();
  const influences = {
    fire: 'energizes growth and fruit development',
    earth: 'strengthens roots and overall structure', 
    air: 'enhances flowering and seed development',
    water: 'improves nutrient uptake and leaf growth'
  };
  
  return influences[element as keyof typeof influences] || 'brings beneficial cosmic energy';
}

function getPlantAstrologicalRecommendations(plantType: string, moonPhaseData: any): string[] {
  const baseRecs = [
    'Water during water sign moons (Cancer, Scorpio, Pisces) for enhanced absorption',
    'Harvest during full moons for maximum potency and flavor',
    'Prune during waning moons for healthy regrowth and disease prevention'
  ];
  
  if (moonPhaseData) {
    const element = moonPhaseData.moon_sign_element.toLowerCase();
    const elementRecs = {
      fire: 'Focus on fruit development and energy-building activities',
      earth: 'Strengthen root systems and overall plant structure',
      air: 'Encourage flowering and pollinator attraction',
      water: 'Enhance leaf growth and nutrient absorption'
    };
    
    baseRecs.unshift(`Current ${element} element moon: ${elementRecs[element as keyof typeof elementRecs]}`);
  }
  
  return baseRecs;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { question = null, includeWeather = true, includeActivities = true } = body;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    console.log('API Key check - Key exists:', !!apiKey, 'Key length:', apiKey?.length || 0);
    
    // Gather data for analysis
    const plants = await getPlants(userId);
    let weatherForAI: Array<{
      current: Partial<Pick<WeatherData, 'temperature' | 'humidity' | 'windSpeed' | 'condition' | 'description' | 'uv' | 'feelsLike'>>;
      astro: WeatherData['astro'];
    }> = [];
    
    // Fetch weather data
    if (includeWeather) {
      try {
        // Use external weather API directly instead of internal API call
        const weatherApiKey = process.env.WEATHER_API_KEY;
        if (weatherApiKey) {
          const weatherResponse = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=auto:ip&days=1&aqi=yes`);
          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            weatherForAI = [{
              current: {
                temperature: weatherData.current.temp_c,
                humidity: weatherData.current.humidity,
                windSpeed: weatherData.current.wind_kph,
                condition: weatherData.current.condition.text,
                description: weatherData.current.condition.text,
                uv: weatherData.current.uv,
                feelsLike: weatherData.current.feelslike_c
              },
              astro: {
                sunrise: weatherData.forecast?.forecastday?.[0]?.astro?.sunrise || 'N/A',
                sunset: weatherData.forecast?.forecastday?.[0]?.astro?.sunset || 'N/A',
                moonrise: weatherData.forecast?.forecastday?.[0]?.astro?.moonrise || 'N/A',
                moonset: weatherData.forecast?.forecastday?.[0]?.astro?.moonset || 'N/A',
                moon_phase: weatherData.forecast?.forecastday?.[0]?.astro?.moon_phase || 'N/A',
                moon_illumination: weatherData.forecast?.forecastday?.[0]?.astro?.moon_illumination || 'N/A'
              }
            }];
          }
        }
      } catch (weatherError) { 
        console.log('Weather fetch failed, continuing without weather data:', weatherError);
        // Continue without weather data
      }
    }

    // Fetch moon phase data - calculate directly instead of API call
    let moonPhaseData: {
      phase: string;
      illumination: number;
      age: number;
      zodiac_sign: string;
      moon_sign_element: string;
      optimal_activities: string[];
      planting_guidance: string;
      energy_description: string;
    } | null = null;
    
    try {
      // Calculate moon phase directly
      const now = new Date();
      const moonAge = ((now.getTime() - new Date('2000-01-06').getTime()) / (1000 * 60 * 60 * 24)) % 29.53;
      
      let phase = 'New Moon';
      let illumination = 0;
      
      if (moonAge < 1.84566) {
        phase = 'New Moon';
        illumination = 0;
      } else if (moonAge < 5.53699) {
        phase = 'Waxing Crescent';
        illumination = Math.round((moonAge / 14.76) * 100);
      } else if (moonAge < 9.22831) {
        phase = 'First Quarter';
        illumination = 50;
      } else if (moonAge < 12.91963) {
        phase = 'Waxing Gibbous';
        illumination = Math.round(50 + ((moonAge - 9.22831) / 14.76) * 50);
      } else if (moonAge < 16.61096) {
        phase = 'Full Moon';
        illumination = 100;
      } else if (moonAge < 20.30228) {
        phase = 'Waning Gibbous';
        illumination = Math.round(100 - ((moonAge - 16.61096) / 14.76) * 50);
      } else if (moonAge < 23.99361) {
        phase = 'Last Quarter';
        illumination = 50;
      } else {
        phase = 'Waning Crescent';
        illumination = Math.round(50 - ((moonAge - 23.99361) / 14.76) * 50);
      }
      
      // Simple zodiac calculation (approximate)
      const zodiacSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const elements = ['Fire', 'Earth', 'Air', 'Water', 'Fire', 'Earth', 'Air', 'Water', 'Fire', 'Earth', 'Air', 'Water'];
      const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const zodiacIndex = Math.floor((dayOfYear + moonAge) / 30.44) % 12;
      
      const zodiacSign = zodiacSigns[zodiacIndex];
      const element = elements[zodiacIndex];
      
      const activityMap: { [key: string]: string[] } = {
        'New Moon': ['Planning', 'Setting intentions', 'Seed starting'],
        'Waxing Crescent': ['Planting', 'Transplanting', 'Growth activities'],
        'First Quarter': ['Cultivation', 'Pruning', 'Pest management'],
        'Waxing Gibbous': ['Feeding plants', 'Harvesting', 'Building structures'],
        'Full Moon': ['Harvesting', 'Preserving', 'Maximum potency activities'],
        'Waning Gibbous': ['Harvesting root crops', 'Composting', 'Soil preparation'],
        'Last Quarter': ['Pruning', 'Weeding', 'Removing diseased plants'],
        'Waning Crescent': ['Soil work', 'Composting', 'Rest and planning']
      };
      
      moonPhaseData = {
        phase,
        illumination,
        age: moonAge,
        zodiac_sign: zodiacSign,
        moon_sign_element: element,
        optimal_activities: activityMap[phase] || ['General garden maintenance'],
        planting_guidance: phase.includes('Waxing') ? 'Good time for planting and growth activities' : 
                          phase.includes('Waning') ? 'Good time for pruning and soil work' :
                          phase === 'Full Moon' ? 'Perfect for harvesting and preservation' :
                          'Ideal for planning and new beginnings',
        energy_description: phase.includes('Waxing') ? 'Growing and building energy' :
                           phase.includes('Waning') ? 'Releasing and clearing energy' :
                           phase === 'Full Moon' ? 'Peak energy and manifestation' :
                           'New beginnings and fresh starts'
      };
    } catch (moonError) {
      console.log('Moon phase calculation failed, continuing without moon data:', moonError);
      // Continue without moon data
    }

    const activities = includeActivities ? await getRecentActivities(userId, 20) : [];

    // Always provide fallback insights first, then try to enhance with AI
    let analysisResult = generateFallbackInsights(plants, activities, weatherForAI, moonPhaseData);
    let aiResponseContent: string | undefined = undefined;

    // Try to enhance with AI if API key is available
    if (apiKey) {
      try {
        const systemPrompt = `You are Almaniac, an expert AI farming assistant specializing in permaculture design, biodynamic agriculture, astrological farming, and regenerative practices. You combine ancient wisdom with modern sustainable agriculture techniques.

        Your expertise includes:
        - Permaculture principles and design patterns
        - Biodynamic farming and lunar calendar guidance
        - Astrological influences on plant growth and timing
        - Companion planting and polyculture systems
        - Soil biology and regenerative practices
        - Natural pest management and beneficial ecosystems
        - Water harvesting and conservation techniques
        - Seasonal planning and crop rotation

        Analyze the provided farm data (plants, activities, weather, moon phase) to generate comprehensive, actionable advice that integrates:
        1. PERMACULTURE PRINCIPLES: Apply the 12 permaculture principles in your recommendations
        2. MOON PHASE GUIDANCE: Use lunar cycles for optimal timing of farming activities
        3. ASTROLOGICAL INFLUENCES: Consider zodiac signs and planetary influences on plant growth
        4. WEATHER PATTERNS: Analyze weather trends for strategic planning
        5. PLANT ASTROLOGY: Provide astrological readings for specific plants based on their characteristics

        Structure your response as a JSON object with these keys:
        - "recommendations": Array of detailed recommendations with permaculture focus
        - "insights": Comprehensive analysis including astrological and biodynamic insights
        - "alerts": Critical issues requiring immediate attention
        - "moon_guidance": Specific lunar calendar advice for the next 7 days
        - "plant_astrology": Astrological readings for each plant type in the garden

        For each recommendation, include:
        - "type": Category (planting, harvesting, soil_management, pest_control, water_management, companion_planting, moon_timing, permaculture_design, astrological_timing)
        - "priority": Urgency level (low, medium, high, urgent)
        - "description": Detailed actionable advice
        - "reasoning": Explanation including permaculture principles and astrological factors
        - "confidence": 0-100 based on data quality and astrological alignment
        - "timing": Optimal timing based on moon phase and astrological factors
        - "permaculture_principle": Which of the 12 principles this applies to

        Focus on creating resilient, self-sustaining systems that work with natural cycles and cosmic rhythms.`;

        // Construct detailed user prompt with all available data
        const userPromptParts = [
            question || "Provide a comprehensive permaculture and astrological analysis for my farm, including moon phase guidance and plant astrology readings.",
            
            `CURRENT PLANTS: ${plants.length > 0 ? 
              plants.map(p => `${p.plant_type} (${p.variety || 'N/A'}, Stage: ${p.stage}, Health: ${p.health_status}, Planted: ${p.planting_date || 'Unknown'})`).join('; ') 
              : 'No plants logged.'}`,
            
            `WEATHER CONDITIONS: ${weatherForAI.length > 0 && weatherForAI[0].current && weatherForAI[0].astro ? 
              `Temperature: ${weatherForAI[0].current.temperature}°C, Humidity: ${weatherForAI[0].current.humidity}%, Wind: ${weatherForAI[0].current.windSpeed}km/h, Condition: ${weatherForAI[0].current.description}, UV Index: ${weatherForAI[0].current.uv}, Sunrise: ${weatherForAI[0].astro.sunrise}, Sunset: ${weatherForAI[0].astro.sunset}` 
              : 'Weather data not available.'}`,
            
            `MOON PHASE DATA: ${moonPhaseData ? 
              `Phase: ${moonPhaseData.phase}, Illumination: ${moonPhaseData.illumination}%, Age: ${moonPhaseData.age} days, Zodiac Sign: ${moonPhaseData.zodiac_sign} (${moonPhaseData.moon_sign_element} element), Optimal Activities: ${moonPhaseData.optimal_activities.join(', ')}, Planting Guidance: ${moonPhaseData.planting_guidance}, Energy: ${moonPhaseData.energy_description}` 
              : 'Moon phase data not available.'}`,
            
            `RECENT ACTIVITIES: ${activities.length > 0 ? 
              activities.map(a => `${a.type}: ${a.description} (${a.timestamp})`).join('; ') 
              : 'No recent activities logged.'}`,

            `PERMACULTURE FOCUS AREAS:
            - Observe and interact with natural patterns
            - Catch and store energy (water, nutrients, solar)
            - Obtain a yield while caring for earth and people
            - Use renewable resources and value diversity
            - Design from patterns to details
            - Integrate rather than segregate systems
            - Use small and slow solutions
            - Value the marginal and use edges
            - Creatively use and respond to change`,

            `ASTROLOGICAL CONSIDERATIONS:
            - Analyze plant compatibility with current moon sign
            - Consider planetary influences on growth cycles
            - Provide timing guidance based on lunar calendar
            - Suggest plant-specific astrological care
            - Integrate cosmic rhythms with farming practices`
        ];
        
        const userPrompt = userPromptParts.join('\n\n');
        console.log('USING ENHANCED PERMACULTURE & ASTROLOGY PROMPT FOR AI ANALYSIS');

        // Call DeepSeek API with retry logic and timeout
        console.log('Sending enhanced data to DeepSeek AI. Plants:', plants.length, 'Weather/Astro items:', weatherForAI.length, 'Activities:', activities.length, 'Moon data:', !!moonPhaseData);
        
        let attempts = 0;
        const maxAttempts = 2; // Reduced attempts to fail faster and use fallback

        while (attempts < maxAttempts) {
          attempts++;
          console.log(`DeepSeek API attempt ${attempts}/${maxAttempts}`);
          try {
            const response = await axios.post(
              'https://api.deepseek.com/v1/chat/completions',
              {
                model: 'deepseek-chat',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: userPrompt }
                ],
                temperature: 0.8,
                max_tokens: 1500,
              },
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000 // Reduced timeout to fail faster
              }
            );
            if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
              aiResponseContent = response.data.choices[0].message.content;
              console.log('DeepSeek API request successful.');
              break;
            } else {
              throw new Error('Invalid response structure from DeepSeek API');
            }
          } catch (error) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
              errorMessage = error.message;
            }
            console.error(`DeepSeek API attempt ${attempts}/${maxAttempts} failed:`, errorMessage);
            
            if (attempts >= maxAttempts) {
              console.log('All DeepSeek API attempts failed, using enhanced fallback.');
              break; // Don't throw, just use fallback
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }

        // If we got AI response, try to parse it
        if (aiResponseContent) {
          console.log('Received raw response from DeepSeek AI.');
          
          // Pre-process to remove markdown code fences if present
          let cleanedResponse = aiResponseContent;
          if (cleanedResponse.startsWith("```json")) {
            cleanedResponse = cleanedResponse.substring(7);
            if (cleanedResponse.endsWith("```")) {
              cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
            }
          }
          cleanedResponse = cleanedResponse.trim();

          // Try to parse the AI response
          try {
            const aiResult = JSON.parse(cleanedResponse);
            console.log('Successfully parsed AI response, using enhanced AI insights.');
            analysisResult = aiResult; // Use AI result instead of fallback
          } catch (parseError) {
            console.error('Failed to parse AI response, using enhanced fallback:', parseError);
            // Keep using the fallback we already generated
          }
        }

      } catch (aiError) {
        console.error('AI enhancement failed, using comprehensive fallback:', aiError);
        // Keep using the fallback we already generated
      }
    } else {
      console.log('No DeepSeek API key configured, using comprehensive fallback insights.');
    }

    // Save high-priority recommendations to database
    for (const recommendation of analysisResult.recommendations) {
      if (recommendation.priority === 'high' || recommendation.priority === 'urgent') {
        try {
          const recData: Omit<AIRecommendation, 'id' | 'created_at'> = {
            user_id: userId,
            plant_id: recommendation.plant_id || undefined,
            type: recommendation.type as 'watering' | 'fertilizing' | 'pest_control' | 'harvesting' | 'general',
            recommendation: recommendation.description,
            confidence: recommendation.confidence,
            priority: recommendation.priority,
            weather_factor: includeWeather,
            is_active: true,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          };
          await saveAIRecommendation(recData);
        } catch (dbError) {
          console.error('Failed to save AI recommendation:', dbError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      metadata: {
        plants_analyzed: plants.length,
        weather_records: weatherForAI.length,
        activities_reviewed: activities.length,
        moon_phase_included: !!moonPhaseData,
        ai_enhanced: !!apiKey && aiResponseContent !== undefined,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Analysis error (outer catch block):', error);
    
    // Even if everything fails, provide basic fallback
    const basicFallback = generateFallbackInsights([], [], [], null);
    
    return NextResponse.json({
      success: true,
      analysis: basicFallback,
      metadata: {
        plants_analyzed: 0,
        weather_records: 0,
        activities_reviewed: 0,
        moon_phase_included: false,
        ai_enhanced: false,
        fallback_used: true,
        timestamp: new Date().toISOString()
      }
    });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const recommendations = await getActiveRecommendations(userId);
    
    return NextResponse.json({
      success: true,
      recommendations: recommendations.map(rec => ({
        id: rec.id,
        type: rec.type,
        recommendation: rec.recommendation,
        confidence: rec.confidence,
        priority: rec.priority,
        created_at: rec.created_at,
        expires_at: rec.expires_at
      }))
    });

  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
} 