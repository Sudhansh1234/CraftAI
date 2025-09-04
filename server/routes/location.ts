import { RequestHandler } from "express";

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
}

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

    // For now, we'll simulate the Google Places API response
    // In production, you would integrate with Google Places API
    const mockResults: PlaceResult[] = await simulatePlacesSearch(query, location, radius, type);

    // Format the response for the AI
    const formattedResults = formatResultsForAI(mockResults, location.city, query);

    res.json({
      content: formattedResults,
      locationData: {
        userLocation: location,
        searchQuery: query,
        resultsCount: mockResults.length,
        searchRadius: radius
      },
      rawResults: mockResults
    });

  } catch (error) {
    console.error('Location search error:', error);
    
    // Fallback response
    const fallbackContent = `I'm having trouble searching for "${req.body.query}" in your area. Here are some general suggestions:

🔍 How to find local suppliers:
• Check local business directories
• Visit wholesale markets in your city
• Join artisan groups on social media
• Contact local trade associations
• Ask other artisans for recommendations

📍 Popular wholesale areas in India:
• Delhi: Chandni Chowk, Karol Bagh
• Mumbai: Crawford Market, Zaveri Bazaar
• Bangalore: Commercial Street, Chickpet
• Chennai: T. Nagar, Parry's Corner

Would you like me to help you with specific search strategies for your craft?`;

    res.json({
      content: fallbackContent,
      error: 'Location search temporarily unavailable'
    });
  }
};

// Simulate Google Places API search
async function simulatePlacesSearch(
  query: string, 
  location: {lat: number, lng: number, city: string}, 
  radius: number,
  type?: string
): Promise<PlaceResult[]> {
  // This is a mock implementation
  // In production, replace with actual Google Places API calls
  
  const mockBusinesses = [
    {
      name: "Raj Textile Traders",
      address: "123 Market Street, " + location.city,
      distance: 2.5,
      rating: 4.2,
      phone: "+91 98765 43210",
      types: ["wholesaler", "textile", "fabric"],
      place_id: "mock_place_1"
    },
    {
      name: "Heritage Craft Supplies",
      address: "456 Craft Lane, " + location.city,
      distance: 5.8,
      rating: 4.5,
      phone: "+91 98765 43211",
      types: ["supplier", "craft", "materials"],
      place_id: "mock_place_2"
    },
    {
      name: "Local Artisan Market",
      address: "789 Artisan Road, " + location.city,
      distance: 8.2,
      rating: 4.0,
      phone: "+91 98765 43212",
      types: ["market", "retail", "craft"],
      place_id: "mock_place_3"
    },
    {
      name: "Traditional Weaving Center",
      address: "321 Weaving Street, " + location.city,
      distance: 12.5,
      rating: 4.7,
      phone: "+91 98765 43213",
      types: ["wholesaler", "textile", "weaving"],
      place_id: "mock_place_4"
    },
    {
      name: "Craft Material Hub",
      address: "654 Material Avenue, " + location.city,
      distance: 15.3,
      rating: 4.1,
      phone: "+91 98765 43214",
      types: ["supplier", "materials", "tools"],
      place_id: "mock_place_5"
    },
    {
      name: "Weekend Craft Fair",
      address: "City Center Plaza, " + location.city,
      distance: 3.2,
      rating: 4.3,
      phone: "+91 98765 43215",
      types: ["market", "craft fair", "weekend", "selling"],
      place_id: "mock_place_6"
    },
    {
      name: "Artisan Bazaar",
      address: "Heritage Square, " + location.city,
      distance: 6.8,
      rating: 4.6,
      phone: "+91 98765 43216",
      types: ["market", "bazaar", "handmade", "selling"],
      place_id: "mock_place_7"
    },
    {
      name: "Festival Market Ground",
      address: "Festival Grounds, " + location.city,
      distance: 9.5,
      rating: 4.4,
      phone: "+91 98765 43217",
      types: ["market", "festival", "seasonal", "selling"],
      place_id: "mock_place_8"
    },
    {
      name: "Handicraft Exhibition Center",
      address: "Exhibition Road, " + location.city,
      distance: 11.2,
      rating: 4.8,
      phone: "+91 98765 43218",
      types: ["exhibition", "handicraft", "selling", "premium"],
      place_id: "mock_place_9"
    },
    {
      name: "Local Farmers & Craft Market",
      address: "Green Park, " + location.city,
      distance: 7.1,
      rating: 4.2,
      phone: "+91 98765 43219",
      types: ["market", "farmers", "craft", "organic", "selling"],
      place_id: "mock_place_10"
    }
  ];

  // Filter results based on query and type
  let filteredResults = mockBusinesses;
  
  // Smart filtering based on query keywords
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('market') || queryLower.includes('fair') || queryLower.includes('selling') || queryLower.includes('bazaar')) {
    // Filter for markets, fairs, and selling venues
    filteredResults = mockBusinesses.filter(business => 
      business.types.some(t => ['market', 'craft fair', 'bazaar', 'exhibition', 'selling', 'weekend', 'festival'].includes(t))
    );
  } else if (queryLower.includes('supplier') || queryLower.includes('wholesaler') || queryLower.includes('material')) {
    // Filter for suppliers and wholesalers
    filteredResults = mockBusinesses.filter(business => 
      business.types.some(t => ['supplier', 'wholesaler', 'materials', 'tools'].includes(t))
    );
  } else if (type) {
    filteredResults = mockBusinesses.filter(business => 
      business.types.some(t => t.toLowerCase().includes(type.toLowerCase()))
    );
  }

  // Filter by distance (radius)
  filteredResults = filteredResults.filter(business => business.distance <= (radius / 1000));

  // Sort by distance
  return filteredResults.sort((a, b) => a.distance - b.distance);
}

function formatResultsForAI(results: PlaceResult[], city: string, query: string): string {
  if (results.length === 0) {
    return `I couldn't find any ${query} in ${city}. Here are some alternative suggestions:

🔍 **Try these search strategies:**
• Expand your search radius
• Use different keywords (e.g., "suppliers" instead of "wholesalers")
• Check online directories and marketplaces
• Join local artisan groups for recommendations

Would you like me to help you with a different search or provide general guidance?`;
  }

  let response = `📍 Found ${results.length} ${query} near ${city}:\n\n`;

  results.forEach((result, index) => {
    response += `${index + 1}. ${result.name} (${result.distance} km away)\n`;
    response += `📍 ${result.address}\n`;
    if (result.rating) {
      response += `⭐ ${result.rating}/5 rating\n`;
    }
    if (result.phone) {
      response += `📞 ${result.phone}\n`;
    }
    response += `🏷️ ${result.types.join(', ')}\n\n`;
  });

  // Add specific tips based on query type
  const queryLower = query.toLowerCase();
  if (queryLower.includes('market') || queryLower.includes('fair') || queryLower.includes('selling')) {
    response += `💡 Tips for selling at these markets:
• Contact organizers to check availability and booth fees
• Ask about foot traffic and target audience
• Inquire about setup requirements and timing
• Check if they provide tables, tents, or if you need to bring your own
• Ask about payment processing options (cash, card, UPI)
• Find out about parking and loading/unloading facilities

📅 Best times to contact:
• Weekdays 10 AM - 5 PM for market inquiries
• Some markets require advance booking (1-2 weeks ahead)

Would you like me to help you prepare a vendor application or pricing strategy for these markets?`;
  } else {
    response += `💡 Tips for contacting them:
• Call during business hours (usually 10 AM - 6 PM)
• Ask about minimum order quantities
• Inquire about bulk pricing
• Check if they offer delivery services
• Ask about payment terms and credit options

Would you like me to help you prepare questions to ask these suppliers?`;
  }

  return response;
}
