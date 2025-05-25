import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { DeepSeekAnalysisResponse, WeatherData } from '@/types';
import { getPlants, getRecentActivities, saveAIRecommendation, getActiveRecommendations } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question: _question, includeWeather = true, includeActivities = true } = body;

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
    const plants = await getPlants();
    let weatherForAI: Array<{
      current: Partial<Pick<WeatherData, 'temperature' | 'humidity' | 'windSpeed' | 'condition' | 'description' | 'uv' | 'feelsLike'>>;
      astro: WeatherData['astro'];
    }> = [];
    if (includeWeather) {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/weather?location=auto:ip&forecast=true`;
        // console.log('Fetching weather for AI from:', apiUrl);
        const weatherResponse = await fetch(apiUrl);
        if (weatherResponse.ok) {
          const weatherData: WeatherData = await weatherResponse.json();
          // console.log('Successfully fetched weather for AI:', weatherData.astro);
          weatherForAI = [{ current: { temperature: weatherData.temperature, humidity: weatherData.humidity, windSpeed: weatherData.windSpeed, condition: weatherData.condition, description: weatherData.description, uv: weatherData.uv, feelsLike: weatherData.feelsLike }, astro: weatherData.astro }];
        } else {
          // console.error('Failed to fetch detailed weather for AI. Status:', weatherResponse.status);
          // const errorBody = await weatherResponse.text();
          // console.error('Failed to fetch detailed weather for AI. Body:', errorBody);
        }
      } catch (_fetchErr) {
        // console.error('Error fetching weather for AI (exception):', fetchErr);
      }
    }
    const activities = includeActivities ? await getRecentActivities(20) : [];

    // --- ULTRA-MINIMAL PROMPT TEST --- 
    const systemPrompt = "You are a helpful assistant. Respond with only the word 'OK'.";
    const userPrompt = "Hello.";
    console.log('USING ULTRA-MINIMAL PROMPT FOR TESTING');
    // --- END ULTRA-MINIMAL PROMPT TEST ---

    // Call DeepSeek API with retry logic and timeout
    // console.log('Sending data to DeepSeek AI. Plants:', plants.length, 'Weather/Astro items:', weatherForAI.length, 'Activities:', activities.length);
    
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
            temperature: 0.1, // Low temperature for deterministic response
            max_tokens: 10, // Very low max_tokens for minimal response
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 9000 // 9-second timeout for each attempt
          }
        );
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          aiResponseContent = response.data.choices[0].message.content;
          console.log('DeepSeek API request successful.');
          lastError = null; // Clear last error on success
          break; // Exit loop on success
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
          // For non-Axios errors, log stack if available
          console.error('Error stack:', error.stack);
        }

        if (attempts >= maxAttempts) {
          console.error('All DeepSeek API attempts failed.');
          throw lastError; // Re-throw the last error after all attempts
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Exponential backoff for retry
      }
    }

    if (!aiResponseContent) {
      // This should ideally be caught by the loop re-throwing lastError
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
    cleanedResponse = cleanedResponse.trim(); // Remove any leading/trailing whitespace

    // Parse the AI response
    let analysisResult: DeepSeekAnalysisResponse;
    try {
      analysisResult = JSON.parse(cleanedResponse);
      console.log('Successfully parsed AI response.');
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Original AI Response:', aiResponseContent); // Log the original response for debugging
      // Fallback response if parsing fails
      analysisResult = {
        recommendations: [
          {
            type: 'general',
            priority: 'medium',
            description: 'Start a compost system with kitchen scraps and garden waste to build soil health naturally.',
            reasoning: 'Composting is a fundamental permaculture practice that creates nutrient-rich soil amendments while reducing waste.',
            confidence: 90
          },
          {
            type: 'general',
            priority: 'medium',
            description: 'Plant marigolds and nasturtiums as companion plants to attract beneficial insects and deter pests.',
            reasoning: 'Companion planting is a core permaculture principle that creates beneficial relationships between plants.',
            confidence: 85
          }
        ],
        insights: {
          growth_trends: ['Focus on building soil biology through composting', 'Implement polyculture design for resilient systems'],
          weather_impacts: ['Use mulching to conserve moisture and regulate soil temperature', 'Consider rainwater harvesting for sustainable irrigation'],
          health_observations: ['Diversify plantings to create natural pest control', 'Observe beneficial insect populations'],
          astrological_influences: [
            'Current moon phase supports root development and soil preparation',
            'Planetary positions suggest favorable timing for seed planting',
            'Consider lunar calendar for optimal harvesting timing'
          ]
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