import { RequestHandler } from "express";
import { Client } from "@googlemaps/google-maps-services-js";

interface LocationSearchRequest {
  query: string;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  radius?: number; // in meters, default 50000 (50km)
  type?: string; // e.g., 'wholesaler', 'supplier', 'market'
}

interface PlaceResult {
  name: string;
  address: string;
  distance: number; // in km
  rating?: number;
  phone?: string;
  website?: string;
  types: string[];
  place_id: string;
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photos?: string[];
}

// Initialize Google Maps client
const mapsClient = new Client({});

export const handleLocationSearch: RequestHandler = async (req, res) => {
  try {
    const { query, location, radius = 50000, type }: LocationSearchRequest = req.body;

    if (!query || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: 'Missing required fields: query, location (lat, lng)',
        fallback: {
          content: "I need your location to find nearby businesses. Please enable location access or tell me your city name."
        }
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return res.status(500).json({
        error: 'Google Maps API not configured',
        fallback: {
          content: "Location services are temporarily unavailable. Please try again later or contact support."
        }
      });
    }

    // Search for places using Google Places API
    const placesResults = await searchPlaces(query, location, radius, apiKey);
    
    // Get detailed information for each place
    const detailedResults = await getPlaceDetails(placesResults, apiKey, location);
    
    // Use Gemini to generate intelligent response
    const aiResponse = await generateAIResponse(query, location, detailedResults);

    res.json({
      content: aiResponse,
      locationData: {
        userLocation: location,
        searchQuery: query,
        resultsCount: detailedResults.length,
        searchRadius: radius
      },
      rawResults: detailedResults
    });

  } catch (error) {
    console.error('Location search error:', error);
    
    // Fallback response
    const fallbackContent = `I'm having trouble searching for "${req.body.query}" in your area. Here are some general suggestions:

🔍 How to find local suppliers:
- Check local business directories
- Visit wholesale markets in your city
- Join artisan groups on social media
- Contact local trade associations
- Ask other artisans for recommendations

📍 Popular wholesale areas in India:
- Delhi: Chandni Chowk, Karol Bagh
- Mumbai: Crawford Market, Zaveri Bazaar
- Bangalore: Commercial Street, Chickpet
- Chennai: T. Nagar, Parry's Corner

Would you like me to help you with specific search strategies for your craft?`;

    res.json({
      content: fallbackContent,
      error: 'Location search temporarily unavailable'
    });
  }
};

// Search for places using Google Places API
async function searchPlaces(
  query: string, 
  location: {lat: number, lng: number, city: string}, 
  radius: number,
  apiKey: string
): Promise<any[]> {
  try {
    // Determine search type based on query
    const searchType = determineSearchType(query);
    
    const response = await mapsClient.placesNearby({
      params: {
        location: { lat: location.lat, lng: location.lng },
        radius: radius,
        keyword: query,
        type: searchType,
        key: apiKey,
      },
    });

    return response.data.results || [];
  } catch (error) {
    console.error('Places API error:', error);
    throw error;
  }
}

// Get detailed information for each place
async function getPlaceDetails(places: any[], apiKey: string, userLocation: {lat: number, lng: number}): Promise<PlaceResult[]> {
  const detailedResults: PlaceResult[] = [];
  
  for (const place of places.slice(0, 10)) { // Limit to 10 results
    try {
      const detailsResponse = await mapsClient.placeDetails({
        params: {
          place_id: place.place_id,
          fields: ['name', 'formatted_address', 'rating', 'formatted_phone_number', 'website', 'types', 'opening_hours', 'photos'],
          key: apiKey,
        },
      });

      const details = detailsResponse.data.result;
      
      // Calculate distance using user's actual location
      const distance = calculateDistance(
        { lat: place.geometry.location.lat, lng: place.geometry.location.lng },
        userLocation
      );

      detailedResults.push({
        name: details.name || 'Unknown',
        address: details.formatted_address || 'Address not available',
        distance: distance,
        rating: details.rating,
        phone: details.formatted_phone_number,
        website: details.website,
        types: details.types || [],
        place_id: place.place_id,
        opening_hours: details.opening_hours,
        photos: details.photos?.map((photo: any) => photo.photo_reference) || []
      });
    } catch (error) {
      console.error(`Error getting details for place ${place.place_id}:`, error);
      // Continue with other places
    }
  }

  return detailedResults.sort((a, b) => a.distance - b.distance);
}

// Determine search type based on query keywords
function determineSearchType(query: string): string {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('market') || queryLower.includes('fair') || queryLower.includes('bazaar')) {
    return 'shopping_mall';
  } else if (queryLower.includes('supplier') || queryLower.includes('wholesaler')) {
    return 'store';
  } else if (queryLower.includes('exhibition') || queryLower.includes('center')) {
    return 'establishment';
  } else {
    return 'establishment';
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance(point1: {lat: number, lng: number}, point2: {lat: number, lng: number}): number {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Generate AI response using Gemini
async function generateAIResponse(
  query: string, 
  location: {lat: number, lng: number, city: string}, 
  results: PlaceResult[]
): Promise<string> {
  try {
    // Import Vertex AI
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    // Prepare context for Gemini
    const context = {
      query,
      city: location.city,
      resultsCount: results.length,
      places: results.map(place => ({
        name: place.name,
        address: place.address,
        distance: place.distance,
        rating: place.rating,
        phone: place.phone,
        types: place.types
      }))
    };

    const prompt = `You are ArtisAI, an AI-powered marketplace assistant for Indian artisans. 

The user searched for: "${query}" in ${location.city}

Found ${results.length} places:
${JSON.stringify(context.places, null, 2)}

Generate a helpful, conversational response that:
1. Acknowledges the search and location
2. Lists the top 5 most relevant places with key details
3. Provides specific tips based on the query type (markets vs suppliers)
4. Suggests next steps for the artisan
5. Uses an encouraging, supportive tone
6. Keeps response under 300 words
7. Uses bullet points for easy reading

Remember: You're helping artisans grow their business, so be practical and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    // Fallback to basic formatting
    return formatBasicResponse(query, location, results);
  }
}

// Basic response formatting as fallback
function formatBasicResponse(
  query: string, 
  location: {lat: number, lng: number, city: string}, 
  results: PlaceResult[]
): string {
  if (results.length === 0) {
    return `I couldn't find any ${query} in ${location.city}. Here are some alternative suggestions:

🔍 Try these search strategies:
- Expand your search radius
- Use different keywords (e.g., "suppliers" instead of "wholesalers")
- Check online directories and marketplaces
- Join local artisan groups for recommendations

Would you like me to help you with a different search or provide general guidance?`;
  }

  let response = `📍 Found ${results.length} ${query} near ${location.city}:\n\n`;

  results.slice(0, 5).forEach((result, index) => {
    response += `${index + 1}. ${result.name} (${result.distance.toFixed(1)} km away)\n`;
    response += `📍 ${result.address}\n`;
    if (result.rating) {
      response += `⭐ ${result.rating}/5 rating\n`;
    }
    if (result.phone) {
      response += `📞 ${result.phone}\n`;
    }
    response += `🏷️ ${result.types.slice(0, 3).join(', ')}\n\n`;
  });

  // Add specific tips based on query type
  const queryLower = query.toLowerCase();
  if (queryLower.includes('market') || queryLower.includes('fair') || queryLower.includes('selling')) {
    response += `💡 Tips for selling at these markets:
- Contact organizers to check availability and booth fees
- Ask about foot traffic and target audience
- Inquire about setup requirements and timing
- Check payment processing options (cash, card, UPI)

Would you like me to help you prepare a vendor application or pricing strategy?`;
  } else {
    response += `💡 Tips for contacting suppliers:
- Call during business hours (10 AM - 6 PM)
- Ask about minimum order quantities
- Inquire about bulk pricing and delivery
- Check payment terms and credit options

Would you like me to help you prepare questions to ask these suppliers?`;
  }

  return response;
}

// Generate location-specific insights for business nodes
export const generateLocationInsights: RequestHandler = async (req, res) => {
  try {
    const { location, coordinates, craftType, nodeTitle, nodeType } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Import Vertex AI for insights generation
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT_ID,
      location: 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      },
    });

    const prompt = `You are ArtisAI, an AI assistant for Indian artisans. Generate location-specific business insights and suggest relevant ArtisAI services.

Context:
- Location: ${location}
- Coordinates: ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'Not available'}
- Craft Type: ${craftType || 'handicrafts'}
- Node Title: ${nodeTitle}
- Node Type: ${nodeType}

Generate location-specific insights as bullet points:
- Local market opportunities in ${location}
- Regional suppliers and wholesalers
- Local festivals and events for sales
- Cultural context and traditions
- Regional pricing strategies
- Local government schemes and support
- Location-specific marketing channels
- Seasonal opportunities
- Local competition insights
- Transportation and logistics tips
- Nearby business districts and commercial areas
- Local customer preferences and buying patterns

IMPORTANT: Include suggestions for ArtisAI services where relevant:
- "Use our AI Image Generator to create product photos for local market listings"
- "Try our AI Marketing Assistant to create social media content for local festivals"
- "Use our Business Plan Builder to create a detailed strategy for this location"
- "Generate product descriptions with our AI to attract local customers"
- "Create promotional videos with our AI Video Generator for local events"
- "Use our Pricing Calculator to set competitive prices for this market"

CRITICAL FORMATTING RULES:
- Use ONLY dash (-) for bullet points, NO asterisks (*) anywhere
- NO markdown formatting like **bold** or *italic*
- NO special characters except dashes for bullets
- Each line should start with a dash and space: "- Your content here"
- Do not use any other formatting symbols

Format as bullet points (-) with 6-8 specific, actionable insights for ${location}, including 2-3 ArtisAI service suggestions where relevant.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    let text: string;
    if (typeof response.text === 'function') {
      text = response.text().trim();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      text = response.candidates[0].content.parts[0].text.trim();
    } else {
      throw new Error('Unexpected response structure from Gemini');
    }

    // Clean up any remaining markdown formatting
    text = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1') // Remove *italic*
      .replace(/^\s*\*\s+/gm, '- ') // Replace * with - at start of lines
      .replace(/^\s*•\s+/gm, '- ') // Replace • with - at start of lines
      .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
      .trim();

    res.json({ insights: text });
  } catch (error) {
    console.error('Error generating location insights:', error);
    res.status(500).json({ error: 'Failed to generate location insights' });
  }
};

// Reverse geocoding to get city name from coordinates
export const reverseGeocode: RequestHandler = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const client = new Client({});

    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    const results = response.data.results;
    if (results.length === 0) {
      return res.json({ city: 'Unknown Location' });
    }

    // Find the most specific location (city level)
    let city = 'Unknown Location';
    for (const result of results) {
      const addressComponents = result.address_components;
      for (const component of addressComponents) {
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
          city = component.long_name;
          break;
        }
      }
      if (city !== 'Unknown Location') break;
    }

    res.json({ city });
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    res.status(500).json({ error: 'Failed to get location information' });
  }
};