import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { DeepSeekAnalysisResponse, WeatherData } from '@/types';
import { getPlants, getRecentActivities, saveAIRecommendation, getActiveRecommendations } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, includeWeather = true, includeActivities = true } = body;

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    // Gather data for analysis
    const plants = await getPlants();
    // Fetch weather data including astro for the current day from our /api/weather endpoint
    let weatherForAI: Array<{
      current: Partial<Pick<WeatherData, 'temperature' | 'humidity' | 'windSpeed' | 'condition' | 'description' | 'uv' | 'feelsLike'>>;
      astro: WeatherData['astro'];
    }> = [];
    if (includeWeather) {
      try {
        const weatherResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather?location=auto:ip&forecast=true`);
        if (weatherResponse.ok) {
          const weatherData: WeatherData = await weatherResponse.json();
          // We want current conditions and moon phase for the AI
          weatherForAI = [{
            current: {
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              windSpeed: weatherData.windSpeed,
              condition: weatherData.condition,
              description: weatherData.description,
              uv: weatherData.uv,
              feelsLike: weatherData.feelsLike,
            },
            astro: weatherData.astro // This now includes moon phase, illumination etc.
          }];
        } else {
          console.error('Failed to fetch detailed weather for AI');
        }
      } catch (fetchErr) {
        console.error('Error fetching weather for AI:', fetchErr);
      }
    }
    const activities = includeActivities ? await getRecentActivities(20) : [];

    // Prepare the analysis prompt
    const systemPrompt = `You are an expert agricultural AI assistant specializing in sustainable farming, permaculture, and garden management. 
    Analyze the provided data about plants, current weather conditions (including moon phase), and recent activities to provide intelligent recommendations.
    Focus on permaculture principles such as working with nature, observing patterns, and creating resilient systems.
    Consider the current moon phase and its potential influence on planting, harvesting, and other activities, if applicable to permaculture practices.
    
    Your response should be in JSON format with the following structure:
    {
      "recommendations": [
        {
          "type": "watering|fertilizing|pest_control|harvesting|general",
          "priority": "low|medium|high|urgent",
          "description": "Clear, actionable recommendation",
          "reasoning": "Explanation of why this recommendation is made",
          "confidence": 85
        }
      ],
      "insights": {
        "growth_trends": ["observation about plant growth patterns"],
        "weather_impacts": ["how weather affects the plants"],
        "health_observations": ["plant health insights"]
      },
      "alerts": [
        {
          "type": "warning|info|success",
          "message": "Important alert message",
          "plant_id": "optional plant ID if specific to a plant"
        }
      ]
    }`;

    const userPrompt = `
    Please analyze the following farm/garden data and provide recommendations, focusing on permaculture and considering the moon phase:

    PLANTS DATA:
    ${JSON.stringify(plants, null, 2)}

    CURRENT WEATHER & ASTROLOGICAL DATA (MOON PHASE):
    ${JSON.stringify(weatherForAI, null, 2)} 

    RECENT ACTIVITIES:
    ${JSON.stringify(activities, null, 2)}

    ${question ? `SPECIFIC QUESTION: ${question}` : ''}

    Please provide actionable recommendations based on this data, incorporating permaculture principles, plant health, weather patterns (including moon phase), and recent care activities.
    `;

    // Call DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    // Pre-process to remove markdown code fences if present
    let cleanedResponse = aiResponse;
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.substring(7);
      if (cleanedResponse.endsWith("```")) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
      }
    }
    cleanedResponse = cleanedResponse.trim(); // Remove any leading/trailing whitespace

    // Parse the AI response
    let analysisResult: DeepSeekAnalysisResponse;
    try {
      analysisResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Original AI Response:', aiResponse); // Log the original response for debugging
      // Fallback response if parsing fails
      analysisResult = {
        recommendations: [
          {
            type: 'general',
            priority: 'medium',
            description: 'Continue monitoring your plants and maintain regular care routines.',
            reasoning: 'Based on the current data, your plants appear to be in good condition.',
            confidence: 70
          }
        ],
        insights: {
          growth_trends: ['Regular monitoring recommended'],
          weather_impacts: ['Weather conditions appear favorable'],
          health_observations: ['Plants showing good overall health']
        },
        alerts: []
      };
    }

    // Save high-priority recommendations to database
    for (const recommendation of analysisResult.recommendations) {
      if (recommendation.priority === 'high' || recommendation.priority === 'urgent') {
        try {
          await saveAIRecommendation({
            type: recommendation.type as 'watering' | 'fertilizing' | 'pest_control' | 'harvesting' | 'general',
            recommendation: recommendation.description,
            confidence: recommendation.confidence,
            priority: recommendation.priority,
            weather_factor: includeWeather,
            is_active: true,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          });
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
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Analysis error:', error);
    
    if (axios.isAxiosError(error)) {
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
  try {
    // Get recent AI recommendations
    const recommendations = await getActiveRecommendations();
    
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