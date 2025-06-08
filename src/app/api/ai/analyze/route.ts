import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { DeepSeekAnalysisResponse, WeatherData, AIRecommendation } from '@/types';
import { getPlants, getRecentActivities, saveAIRecommendation, getActiveRecommendations } from '@/lib/database';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

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
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY environment variable not configured');
      return NextResponse.json(
        { error: 'DeepSeek API key not configured. Please set DEEPSEEK_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Gather data for analysis
    const plants = await getPlants(userId);
    let weatherForAI: Array<{
      current: Partial<Pick<WeatherData, 'temperature' | 'humidity' | 'windSpeed' | 'condition' | 'description' | 'uv' | 'feelsLike'>>;
      astro: WeatherData['astro'];
    }> = [];
    
    // Fetch weather data
    if (includeWeather) {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather?location=auto:ip&forecast=true`;
        const weatherResponse = await fetch(apiUrl);
        if (weatherResponse.ok) {
          const weatherData: WeatherData = await weatherResponse.json();
          weatherForAI = [{ current: { temperature: weatherData.temperature, humidity: weatherData.humidity, windSpeed: weatherData.windSpeed, condition: weatherData.condition, description: weatherData.description, uv: weatherData.uv, feelsLike: weatherData.feelsLike }, astro: weatherData.astro }];
        }
      } catch { 
        // Weather fetch failed, continue without weather data
      }
    }

    // Fetch moon phase data
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
      const moonApiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/moon-phase`;
      const moonResponse = await fetch(moonApiUrl);
      if (moonResponse.ok) {
        const moonData = await moonResponse.json();
        moonPhaseData = moonData.moon;
      }
    } catch {
      // Moon phase fetch failed, continue without moon data
    }

    const activities = includeActivities ? await getRecentActivities(userId, 20) : [];

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
    - "permaculture_opportunities": Specific design improvements and system integrations

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
    
    let aiResponseContent;
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

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
            temperature: 0.8, // Slightly higher for more creative astrological insights
            max_tokens: 1500, // Increased for more detailed responses
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 12000 // Increased timeout for more complex analysis
          }
        );
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          aiResponseContent = response.data.choices[0].message.content;
          console.log('DeepSeek API request successful.');
          lastError = null;
          break;
        } else {
          throw new Error('Invalid response structure from DeepSeek API');
        }
      } catch (error) {
        lastError = error;
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        console.error(`DeepSeek API attempt ${attempts}/${maxAttempts} failed:`, errorMessage);
        
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNABORTED') {
            console.error('Axios request timed out.');
          } else {
            console.error('Axios error details:', error.response?.status, error.response?.data);
          }
        } else if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }

        if (attempts >= maxAttempts) {
          console.error('All DeepSeek API attempts failed.');
          throw lastError;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    if (!aiResponseContent) {
      throw new Error('Failed to get a response from DeepSeek API after multiple attempts.');
    }
    
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

    // Parse the AI response
    let analysisResult: DeepSeekAnalysisResponse;
    try {
      analysisResult = JSON.parse(cleanedResponse);
      console.log('Successfully parsed AI response.');
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Original AI Response:', aiResponseContent);
      
      // Enhanced fallback response with permaculture and astrological guidance
      analysisResult = {
        recommendations: [
          {
            type: 'permaculture_design',
            priority: 'high',
            description: 'Establish a three-zone permaculture design: Zone 1 (daily herbs near kitchen), Zone 2 (vegetable garden), Zone 3 (fruit trees and perennials).',
            reasoning: 'Permaculture zoning maximizes efficiency and creates sustainable food systems. Current moon phase supports planning and design work.',
            confidence: 95,
            timing: moonPhaseData ? `Optimal during ${moonPhaseData.phase} for planning activities` : 'Plan during new moon phases',
            permaculture_principle: 'Design from patterns to details'
          },
          {
            type: 'companion_planting',
            priority: 'high',
            description: 'Plant the "Three Sisters" (corn, beans, squash) together to create a mutually beneficial polyculture system.',
            reasoning: 'This indigenous companion planting technique demonstrates permaculture principles of beneficial relationships and maximizes yield in small spaces.',
            confidence: 90,
            timing: moonPhaseData?.moon_sign_element === 'Earth' ? 'Excellent timing with Earth element moon' : 'Best during earth sign moons',
            permaculture_principle: 'Integrate rather than segregate'
          },
          {
            type: 'moon_timing',
            priority: 'medium',
            description: moonPhaseData ? `Current ${moonPhaseData.phase} is ideal for: ${moonPhaseData.optimal_activities.join(', ')}` : 'Follow lunar calendar for optimal planting and harvesting times',
            reasoning: 'Lunar cycles influence plant growth, water uptake, and energy flow. Aligning activities with moon phases enhances plant vitality.',
            confidence: 85,
            timing: moonPhaseData ? `Active now during ${moonPhaseData.phase}` : 'Follow lunar calendar',
            permaculture_principle: 'Observe and interact'
          },
          {
            type: 'soil_management',
            priority: 'high',
            description: 'Create a living soil ecosystem with compost, mycorrhizal fungi, and beneficial microorganisms.',
            reasoning: 'Healthy soil biology is the foundation of permaculture. Living soil sequesters carbon, retains water, and provides optimal nutrition.',
            confidence: 95,
            timing: 'Year-round activity, intensify during waning moon phases',
            permaculture_principle: 'Care for the earth'
          }
        ],
        insights: {
          growth_trends: [
            'Implement polyculture systems for increased biodiversity and resilience',
            'Focus on perennial food systems for long-term sustainability',
            'Develop water-wise gardening techniques for climate adaptation'
          ],
          weather_impacts: [
            'Use weather patterns to guide planting schedules and crop selection',
            'Implement rainwater harvesting during wet seasons',
            'Create microclimates for season extension'
          ],
          health_observations: [
            'Diverse plantings create natural pest control through beneficial insects',
            'Companion plants enhance each other\'s growth and disease resistance',
            'Healthy soil biology prevents most plant diseases naturally'
          ],
          permaculture_opportunities: [
            'Design food forests with multiple canopy layers',
            'Install greywater systems for water recycling',
            'Create habitat corridors for beneficial wildlife',
            'Establish seed saving and plant propagation systems'
          ],
          astrological_influences: [
            moonPhaseData ? `${moonPhaseData.zodiac_sign} moon in ${moonPhaseData.moon_sign_element} element enhances ${moonPhaseData.moon_sign_element.toLowerCase()}-related activities` : 'Moon sign influences plant growth patterns',
            moonPhaseData ? `Current moon phase (${moonPhaseData.phase}) energy: ${moonPhaseData.energy_description}` : 'Lunar phases affect plant energy and growth cycles',
            'Plant according to astrological correspondences for enhanced vitality',
            'Time harvesting with full moons for maximum potency'
          ]
        },
        alerts: [],
        moon_guidance: moonPhaseData ? [
          `Current Phase: ${moonPhaseData.phase} (${moonPhaseData.illumination}% illuminated)`,
          `Zodiac Sign: ${moonPhaseData.zodiac_sign} (${moonPhaseData.moon_sign_element} element)`,
          `Optimal Activities: ${moonPhaseData.optimal_activities.join(', ')}`,
          `Planting Guidance: ${moonPhaseData.planting_guidance}`,
          `Energy Focus: ${moonPhaseData.energy_description}`
        ] : [
          'Follow lunar calendar for optimal timing',
          'New moon: Planning and seed starting',
          'Waxing moon: Growth and transplanting',
          'Full moon: Harvesting and preservation',
          'Waning moon: Pruning and soil work'
        ],
        plant_astrology: plants.length > 0 ? plants.map(plant => ({
          plant: `${plant.plant_type} (${plant.variety || 'N/A'})`,
          astrological_profile: `${plant.plant_type} resonates with specific planetary energies and benefits from lunar timing`,
          current_influence: moonPhaseData ? `Current ${moonPhaseData.zodiac_sign} moon supports ${plant.plant_type} growth` : 'Consult lunar calendar for optimal care timing',
          recommendations: [
            'Water during water sign moons for enhanced absorption',
            'Harvest during full moons for maximum potency',
            'Prune during waning moons for healthy regrowth'
          ]
        })) : [
          {
            plant: 'General Garden',
            astrological_profile: 'All plants benefit from lunar and planetary timing',
            current_influence: 'Begin observing moon phases and their effects on your garden',
            recommendations: [
              'Start a lunar gardening journal',
              'Plant by moon signs for enhanced growth',
              'Harvest medicinal plants during full moons'
            ]
          }
        ]
      };
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
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Analysis error (outer catch block):', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || 'Failed to analyze data with AI';
      return NextResponse.json({ error: message }, { status });
    }

    return NextResponse.json(
      { error: 'Internal server error during AI analysis' },
      { status: 500 }
    );
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