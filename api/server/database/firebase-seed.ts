import { FirebaseModels } from './firebase';

// Function to create user-specific data
export async function createUserData(userId: string, userInfo: {
  email: string;
  displayName?: string;
  businessName?: string;
  businessType?: string;
  location?: string;
}) {
  try {
    console.log(`🌱 Creating user data for: ${userId}`);
    
    // Create user profile
    const userProfile = {
      id: userId,
      email: userInfo.email,
      display_name: userInfo.displayName || userInfo.email.split('@')[0],
      business_name: userInfo.businessName || `${userInfo.displayName || 'User'}'s Business`,
      business_type: userInfo.businessType || 'artisan',
      location: userInfo.location || 'Unknown',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await FirebaseModels.users.create(userProfile);
    console.log(`✅ Created user profile for ${userId}`);
    
    // Create business profile
    const businessProfile = {
      id: `business_${userId}`,
      user_id: userId,
      business_name: userProfile.business_name,
      business_type: userProfile.business_type,
      location: userProfile.location,
      description: `Welcome to ${userProfile.business_name}! We create beautiful ${userProfile.business_type} products.`,
      website: '',
      social_media: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await FirebaseModels.businessProfiles.create(businessProfile);
    console.log(`✅ Created business profile for ${userId}`);
    
    // Create sample insights for this user
    const userInsights = sampleInsights.map(insight => ({
      ...insight,
      id: `insight_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    for (const insight of userInsights) {
      await FirebaseModels.aiInsights.create(insight);
    }
    console.log(`✅ Created ${userInsights.length} insights for ${userId}`);
    
    // Create sample business metrics
    const userMetrics = sampleBusinessMetrics.map(metric => ({
      ...metric,
      id: `metric_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    for (const metric of userMetrics) {
      await FirebaseModels.businessMetrics.create(metric);
    }
    console.log(`✅ Created ${userMetrics.length} business metrics for ${userId}`);
    
    // Create sample recommendations
    const userRecommendations = sampleRecommendations.map(rec => ({
      ...rec,
      id: `rec_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    for (const recommendation of userRecommendations) {
      await FirebaseModels.recommendations.create(recommendation);
    }
    console.log(`✅ Created ${userRecommendations.length} recommendations for ${userId}`);
    
    console.log(`🎉 Successfully created user data for ${userId}`);
    return { success: true, userId };
    
  } catch (error) {
    console.error(`❌ Error creating user data for ${userId}:`, error);
    throw error;
  }
}

// Sample data for Firebase seeding
const sampleUsers = [
  {
    email: 'sarah@artisan.com',
    name: 'Sarah Johnson',
    business_name: 'Sarah\'s Ceramic Studio',
    business_type: 'ceramics',
    location: 'Portland, OR'
  },
  {
    email: 'mike@handmade.com',
    name: 'Mike Chen',
    business_name: 'Handwoven Treasures',
    business_type: 'textiles',
    location: 'Seattle, WA'
  }
];

const sampleInsights = [
  {
    type: 'trend',
    title: 'Handmade Ceramics Trending',
    description: 'Ceramic home decor items are seeing 40% increased demand in your region. Consider expanding your pottery collection.',
    detailed_description: 'Market analysis shows ceramic vases, bowls, and decorative pieces are trending strongly in urban areas. Social media mentions increased 65% in the past month. Target demographic: 25-45 year olds with disposable income.',
    priority: 'high',
    actionable: true,
    category: 'marketing',
    confidence: 87,
    source: 'market_data',
    tags: ['ceramics', 'home-decor', 'trending', 'pottery'],
    suggested_actions: [
      'Create a new ceramic collection',
      'Update product photography',
      'Target Instagram marketing',
      'Partner with home decor influencers'
    ],
    estimated_impact: 'high',
    timeframe: 'short_term',
    status: 'active'
  },
  {
    type: 'opportunity',
    title: 'Local Craft Fair Application',
    description: 'Spring Artisan Market opens applications next week. High foot traffic and perfect for your target audience.',
    detailed_description: 'The Spring Artisan Market at Central Park attracts 5,000+ visitors over 3 days. Previous vendors report 200-500 sales per event. Application fee: $150. Deadline: March 15th.',
    priority: 'high',
    actionable: true,
    category: 'sales',
    confidence: 92,
    source: 'external_trends',
    tags: ['craft-fair', 'local-market', 'sales-opportunity', 'spring'],
    suggested_actions: [
      'Prepare application materials',
      'Plan booth layout and display',
      'Create special event pricing',
      'Order business cards and signage'
    ],
    estimated_impact: 'high',
    timeframe: 'immediate',
    status: 'active'
  },
  {
    type: 'pricing',
    title: 'Pricing Optimization Opportunity',
    description: 'Your handwoven scarves are priced 20% below market average. Consider increasing prices by 15-25%.',
    detailed_description: 'Competitor analysis shows similar handwoven scarves sell for $45-65. Your current price of $38 leaves room for 20-30% increase while maintaining competitiveness.',
    priority: 'medium',
    actionable: true,
    category: 'finance',
    confidence: 78,
    source: 'ai_analysis',
    tags: ['pricing', 'scarf', 'revenue-optimization', 'market-analysis'],
    suggested_actions: [
      'Research competitor pricing',
      'Test price increase on 2-3 items',
      'Update pricing strategy',
      'Communicate value proposition'
    ],
    estimated_impact: 'medium',
    timeframe: 'short_term',
    status: 'active'
  },
  {
    type: 'inventory',
    title: 'Inventory Replenishment Alert',
    description: 'Running low on popular items: ceramic bowls (3 left), handwoven scarves (1 left).',
    detailed_description: 'Your best-selling ceramic bowls and handwoven scarves are nearly out of stock. These items account for 35% of your monthly revenue.',
    priority: 'medium',
    actionable: true,
    category: 'operations',
    confidence: 95,
    source: 'user_behavior',
    tags: ['inventory', 'restock', 'popular-items', 'revenue-critical'],
    suggested_actions: [
      'Order ceramic bowl materials',
      'Weave additional scarves',
      'Update inventory tracking',
      'Consider bulk ordering'
    ],
    estimated_impact: 'high',
    timeframe: 'immediate',
    status: 'active'
  },
  {
    type: 'recommendation',
    title: 'Social Media Strategy Enhancement',
    description: 'Your Instagram engagement increased 30% this month. Double down on video content and behind-the-scenes posts.',
    detailed_description: 'Video posts receive 3x more engagement than static images. Behind-the-scenes content showing your creative process gets 40% more saves and shares.',
    priority: 'medium',
    actionable: true,
    category: 'marketing',
    confidence: 82,
    source: 'user_behavior',
    tags: ['social-media', 'instagram', 'video-content', 'engagement'],
    suggested_actions: [
      'Create weekly process videos',
      'Post behind-the-scenes content',
      'Use trending hashtags',
      'Engage with artisan community'
    ],
    estimated_impact: 'medium',
    timeframe: 'short_term',
    status: 'active'
  },
  {
    type: 'market',
    title: 'Seasonal Opportunity: Wedding Season',
    description: 'Wedding season starts in 2 months. Custom ceramic gifts and decorations are in high demand.',
    detailed_description: 'March-June is peak wedding season. Custom ceramic centerpieces, guest favors, and decorative items see 200% demand increase. Average order value: $300-800.',
    priority: 'high',
    actionable: true,
    category: 'sales',
    confidence: 89,
    source: 'market_data',
    tags: ['wedding', 'seasonal', 'custom-orders', 'high-value'],
    suggested_actions: [
      'Create wedding collection',
      'Update website with custom options',
      'Reach out to wedding planners',
      'Prepare sample packages'
    ],
    estimated_impact: 'high',
    timeframe: 'short_term',
    status: 'active'
  }
];

const sampleMetrics = [
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 2500.00, unit: 'USD', date_recorded: new Date('2024-01-15') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 2800.00, unit: 'USD', date_recorded: new Date('2024-01-22') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 3200.00, unit: 'USD', date_recorded: new Date('2024-01-29') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 3500.00, unit: 'USD', date_recorded: new Date('2024-02-05') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 3800.00, unit: 'USD', date_recorded: new Date('2024-02-12') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 4200.00, unit: 'USD', date_recorded: new Date('2024-02-19') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 4500.00, unit: 'USD', date_recorded: new Date('2024-02-26') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 4800.00, unit: 'USD', date_recorded: new Date('2024-03-05') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 5200.00, unit: 'USD', date_recorded: new Date('2024-03-12') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 5500.00, unit: 'USD', date_recorded: new Date('2024-03-19') },
  { metric_type: 'revenue', metric_name: 'Monthly Revenue', value: 5800.00, unit: 'USD', date_recorded: new Date('2024-03-26') },
  { metric_type: 'orders', metric_name: 'Daily Orders', value: 12, unit: 'count', date_recorded: new Date('2024-01-29') },
  { metric_type: 'orders', metric_name: 'Daily Orders', value: 15, unit: 'count', date_recorded: new Date('2024-02-15') },
  { metric_type: 'orders', metric_name: 'Daily Orders', value: 18, unit: 'count', date_recorded: new Date('2024-03-10') },
  { metric_type: 'customers', metric_name: 'New Customers', value: 8, unit: 'count', date_recorded: new Date('2024-01-29') },
  { metric_type: 'customers', metric_name: 'New Customers', value: 12, unit: 'count', date_recorded: new Date('2024-02-15') },
  { metric_type: 'customers', metric_name: 'New Customers', value: 15, unit: 'count', date_recorded: new Date('2024-03-10') },
  { metric_type: 'social', metric_name: 'Instagram Followers', value: 2847, unit: 'count', date_recorded: new Date('2024-03-26') },
  { metric_type: 'social', metric_name: 'Instagram Engagement Rate', value: 4.2, unit: 'percent', date_recorded: new Date('2024-03-26') },
  { metric_type: 'website', metric_name: 'Monthly Visitors', value: 2340, unit: 'count', date_recorded: new Date('2024-03-26') },
  { metric_type: 'website', metric_name: 'Conversion Rate', value: 2.8, unit: 'percent', date_recorded: new Date('2024-03-26') },
  { metric_type: 'website', metric_name: 'Average Order Value', value: 85.50, unit: 'USD', date_recorded: new Date('2024-03-26') }
];

const sampleRecommendations = [
  {
    title: 'Apply for Spring Artisan Market',
    description: 'Submit application for the upcoming Spring Artisan Market to increase local visibility and sales.',
    category: 'sales',
    priority: 'high',
    timeframe: 'immediate',
    status: 'pending',
    estimated_effort: 'medium',
    estimated_impact: 'high',
    suggested_actions: ['Prepare application materials', 'Plan booth layout', 'Create event pricing']
  },
  {
    title: 'Restock Popular Inventory Items',
    description: 'Order materials and create additional ceramic bowls and handwoven scarves to meet demand.',
    category: 'operations',
    priority: 'high',
    timeframe: 'immediate',
    status: 'pending',
    estimated_effort: 'high',
    estimated_impact: 'high',
    suggested_actions: ['Order ceramic materials', 'Schedule weaving time', 'Update inventory system']
  },
  {
    title: 'Update Pricing Strategy',
    description: 'Research competitor pricing and implement price increases for handwoven scarves.',
    category: 'finance',
    priority: 'medium',
    timeframe: 'short_term',
    status: 'pending',
    estimated_effort: 'low',
    estimated_impact: 'medium',
    suggested_actions: ['Research competitor prices', 'Test price increases', 'Update website pricing']
  },
  {
    title: 'Create Wedding Season Collection',
    description: 'Develop a specialized collection of ceramic items for wedding season demand.',
    category: 'sales',
    priority: 'high',
    timeframe: 'short_term',
    status: 'pending',
    estimated_effort: 'high',
    estimated_impact: 'high',
    suggested_actions: ['Design wedding items', 'Create samples', 'Update website', 'Contact wedding planners']
  },
  {
    title: 'Enhance Social Media Video Content',
    description: 'Increase video content production to boost engagement and reach.',
    category: 'marketing',
    priority: 'medium',
    timeframe: 'short_term',
    status: 'pending',
    estimated_effort: 'medium',
    estimated_impact: 'medium',
    suggested_actions: ['Plan video content', 'Create behind-the-scenes videos', 'Use trending hashtags']
  },
  {
    title: 'Develop Wholesale Partnerships',
    description: 'Establish relationships with local retailers and online marketplaces for wholesale distribution.',
    category: 'growth',
    priority: 'low',
    timeframe: 'long_term',
    status: 'pending',
    estimated_effort: 'high',
    estimated_impact: 'high',
    suggested_actions: ['Research potential partners', 'Create wholesale catalog', 'Develop pricing structure']
  }
];

const sampleMarketTrends = [
  {
    trend_type: 'product',
    title: 'Ceramic Home Decor Trending',
    description: 'Handmade ceramic home decor items are experiencing significant growth in urban markets.',
    impact_level: 'high',
    confidence_score: 85,
    source: 'Social Media Analytics',
    region: 'North America',
    category: 'products',
    tags: ['ceramics', 'home-decor', 'handmade', 'trending'],
    valid_from: new Date('2024-01-01'),
    valid_until: new Date('2024-06-30')
  },
  {
    trend_type: 'seasonal',
    title: 'Wedding Season Demand',
    description: 'Custom ceramic and textile items for weddings show 200% increase in demand during spring months.',
    impact_level: 'high',
    confidence_score: 90,
    source: 'Market Research',
    region: 'North America',
    category: 'seasonal',
    tags: ['wedding', 'seasonal', 'custom', 'ceramics'],
    valid_from: new Date('2024-03-01'),
    valid_until: new Date('2024-06-30')
  },
  {
    trend_type: 'competitor',
    title: 'Local Artisan Pricing Increase',
    description: 'Local artisans in the region have increased pricing by 15% on average due to material cost increases.',
    impact_level: 'medium',
    confidence_score: 75,
    source: 'Competitor Analysis',
    region: 'Pacific Northwest',
    category: 'competitor',
    tags: ['pricing', 'competitor', 'market-analysis'],
    valid_from: new Date('2024-01-15'),
    valid_until: new Date('2024-12-31')
  },
  {
    trend_type: 'product',
    title: 'Sustainable Textiles Rising',
    description: 'Eco-friendly and sustainable textile products are gaining popularity among conscious consumers.',
    impact_level: 'medium',
    confidence_score: 80,
    source: 'Consumer Research',
    region: 'Global',
    category: 'products',
    tags: ['sustainable', 'textiles', 'eco-friendly', 'conscious-consumer'],
    valid_from: new Date('2024-02-01'),
    valid_until: new Date('2024-12-31')
  },
  {
    trend_type: 'seasonal',
    title: 'Holiday Gift Season Preparation',
    description: 'Artisan gifts see 300% demand increase during November-December holiday season.',
    impact_level: 'high',
    confidence_score: 88,
    source: 'Historical Sales Data',
    region: 'North America',
    category: 'seasonal',
    tags: ['holiday', 'gifts', 'seasonal', 'high-demand'],
    valid_from: new Date('2024-11-01'),
    valid_until: new Date('2024-12-31')
  }
];

export async function seedFirebaseDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting Firebase database seeding...');
    
    // Create sample users
    const users = [];
    for (const userData of sampleUsers) {
      const user = await FirebaseModels.users.create(userData);
      users.push(user);
      console.log(`✅ Created user: ${user.name}`);
    }
    
    // Use the first user for sample data
    const userId = users[0].id;
    
    // Create sample insights
    for (const insightData of sampleInsights) {
      await FirebaseModels.aiInsights.create({ ...insightData, user_id: userId });
    }
    console.log(`✅ Created ${sampleInsights.length} AI insights`);
    
    // Create sample business metrics
    for (const metricData of sampleMetrics) {
      await FirebaseModels.businessMetrics.create({ ...metricData, user_id: userId });
    }
    console.log(`✅ Created ${sampleMetrics.length} business metrics`);
    
    // Create sample recommendations
    for (const recData of sampleRecommendations) {
      await FirebaseModels.recommendations.create({ ...recData, user_id: userId });
    }
    console.log(`✅ Created ${sampleRecommendations.length} recommendations`);
    
    // Create sample market trends
    for (const trendData of sampleMarketTrends) {
      await FirebaseModels.marketTrends.create(trendData);
    }
    console.log(`✅ Created ${sampleMarketTrends.length} market trends`);
    
    console.log('🎉 Firebase database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Firebase database seeding failed:', error);
    throw error;
  }
}

