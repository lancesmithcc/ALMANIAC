import { NextRequest, NextResponse } from 'next/server';

interface MoonPhaseData {
  phase: string;
  illumination: number;
  age: number;
  distance: number;
  angular_diameter: number;
  sun_distance: number;
  sun_angular_diameter: number;
  zodiac_sign: string;
  moon_sign_element: string;
  optimal_activities: string[];
  planting_guidance: string;
  energy_description: string;
}

// Calculate moon phase based on date
function calculateMoonPhase(date: Date): MoonPhaseData {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Julian day calculation
  const a = Math.floor((14 - month) / 12);
  const y = year - a;
  const m = month + 12 * a - 3;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1721119;
  
  // Moon phase calculation
  let daysSinceNewMoon = (jd - 2451549.5) % 29.53058867;
  if (daysSinceNewMoon < 0) daysSinceNewMoon += 29.53058867;
  
  const illumination = (1 - Math.cos(2 * Math.PI * daysSinceNewMoon / 29.53058867)) / 2;
  
  // Determine phase name
  let phase: string;
  if (daysSinceNewMoon < 1.84566) phase = "New Moon";
  else if (daysSinceNewMoon < 5.53699) phase = "Waxing Crescent";
  else if (daysSinceNewMoon < 9.22831) phase = "First Quarter";
  else if (daysSinceNewMoon < 12.91963) phase = "Waxing Gibbous";
  else if (daysSinceNewMoon < 16.61096) phase = "Full Moon";
  else if (daysSinceNewMoon < 20.30228) phase = "Waning Gibbous";
  else if (daysSinceNewMoon < 23.99361) phase = "Last Quarter";
  else phase = "Waning Crescent";
  
  // Calculate zodiac sign (simplified)
  const zodiacSigns = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  // Approximate moon sign calculation (simplified)
  const moonSignIndex = Math.floor((daysSinceNewMoon * 12) / 29.53058867) % 12;
  const zodiacSign = zodiacSigns[moonSignIndex];
  
  // Element mapping
  const elementMap: { [key: string]: string } = {
    "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
    "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
    "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
    "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water"
  };
  
  const moonSignElement = elementMap[zodiacSign];
  
  // Phase-specific guidance
  let optimalActivities: string[] = [];
  let plantingGuidance: string = "";
  let energyDescription: string = "";
  
  switch (phase) {
    case "New Moon":
      optimalActivities = ["Planning", "Seed starting", "Soil preparation", "Composting", "Setting intentions"];
      plantingGuidance = "Ideal time for planting seeds, especially leafy greens and herbs. Root development is favored.";
      energyDescription = "New beginnings, fresh starts, and setting intentions. Energy is building from within.";
      break;
    case "Waxing Crescent":
      optimalActivities = ["Transplanting", "Grafting", "Fertilizing", "Watering", "Growth promotion"];
      plantingGuidance = "Excellent for transplanting seedlings and promoting leaf growth. Above-ground crops thrive.";
      energyDescription = "Growth and expansion. Energy is building and moving upward.";
      break;
    case "First Quarter":
      optimalActivities = ["Pruning", "Harvesting leaves", "Pest control", "Strengthening plants"];
      plantingGuidance = "Good for plants that need strong stems and branches. Focus on structural growth.";
      energyDescription = "Action and decision-making. Time to overcome obstacles and push forward.";
      break;
    case "Waxing Gibbous":
      optimalActivities = ["Feeding plants", "Harvesting", "Preserving", "Building garden structures"];
      plantingGuidance = "Perfect for fruit and flower development. Plants are at peak growth energy.";
      energyDescription = "Refinement and adjustment. Energy is nearly at its peak.";
      break;
    case "Full Moon":
      optimalActivities = ["Harvesting", "Seed collection", "Medicinal plant gathering", "Celebration"];
      plantingGuidance = "Harvest time! Plants are at maximum potency. Avoid planting new seeds.";
      energyDescription = "Culmination and completion. Maximum energy and illumination.";
      break;
    case "Waning Gibbous":
      optimalActivities = ["Pruning", "Weeding", "Pest removal", "Soil amendment"];
      plantingGuidance = "Good for root crops and bulbs. Focus on underground development.";
      energyDescription = "Gratitude and sharing. Energy is decreasing but still powerful.";
      break;
    case "Last Quarter":
      optimalActivities = ["Deep pruning", "Composting", "Breaking bad habits", "Clearing land"];
      plantingGuidance = "Ideal for removing unwanted plants and preparing soil. Root division works well.";
      energyDescription = "Release and letting go. Time to clear away what no longer serves.";
      break;
    case "Waning Crescent":
      optimalActivities = ["Rest", "Planning", "Soil testing", "Tool maintenance", "Reflection"];
      plantingGuidance = "Rest period for most planting. Focus on soil health and garden maintenance.";
      energyDescription = "Rest and reflection. Energy is at its lowest, preparing for renewal.";
      break;
  }
  
  // Add element-specific guidance
  switch (moonSignElement) {
    case "Fire":
      optimalActivities.push("Fruit trees", "Spicy herbs", "Quick-growing crops");
      break;
    case "Earth":
      optimalActivities.push("Root vegetables", "Grains", "Perennial planting");
      break;
    case "Air":
      optimalActivities.push("Flowering plants", "Herbs", "Seed collection");
      break;
    case "Water":
      optimalActivities.push("Leafy greens", "Watering", "Moisture-loving plants");
      break;
  }
  
  return {
    phase,
    illumination: Math.round(illumination * 100),
    age: Math.round(daysSinceNewMoon * 10) / 10,
    distance: 384400, // Average distance in km
    angular_diameter: 0.52, // Average angular diameter in degrees
    sun_distance: 149597870, // Average distance in km
    sun_angular_diameter: 0.53, // Average angular diameter in degrees
    zodiac_sign: zodiacSign,
    moon_sign_element: moonSignElement,
    optimal_activities: optimalActivities,
    planting_guidance: plantingGuidance,
    energy_description: energyDescription
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }
    
    const moonData = calculateMoonPhase(targetDate);
    
    return NextResponse.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      moon: moonData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Moon phase calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate moon phase' },
      { status: 500 }
    );
  }
} 