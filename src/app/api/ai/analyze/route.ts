/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";

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

    // Generate basic fallback immediately to ensure we always have a response
    const basicFallback = {
      recommendations: [
        {
          type: 'permaculture_design',
          priority: 'high' as const,
          description: 'Start with a simple three-zone garden design: herbs near kitchen, vegetables in main area, fruit trees in back.',
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
          description: 'Plant herbs like basil and marigolds throughout your garden for natural pest control.',
          reasoning: 'Companion plants create beneficial relationships and reduce pest problems.',
          confidence: 90,
          timing: 'Plant during growing season',
          permaculture_principle: 'Integrate rather than segregate'
        }
      ],
      insights: {
        growth_trends: [
          'Focus on building healthy soil biology for long-term success',
          'Start with easy-to-grow plants to build confidence',
          'Observe your garden daily to learn its patterns'
        ],
        weather_impacts: [
          'Monitor local weather patterns for optimal timing',
          'Use mulch to protect plants from weather extremes',
          'Plan for seasonal changes in your garden'
        ],
        health_observations: [
          'Diverse plantings create natural pest control',
          'Regular observation prevents most problems',
          'Healthy soil prevents most plant diseases'
        ],
        permaculture_opportunities: [
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
      moon_guidance: [
        'Follow lunar calendar for optimal timing',
        'New moon: Planning and seed starting',
        'Full moon: Harvesting and preservation',
        'Waning moon: Pruning and soil work'
      ],
      plant_astrology: [
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

    console.log('Basic fallback generated successfully');

    // Return the basic fallback immediately
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