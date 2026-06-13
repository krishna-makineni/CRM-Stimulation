import mongoose from 'mongoose';
import { faker } from '@faker-js/faker/locale/en_IN';
import { mongodbUri } from '../config/db';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Segment } from '../models/Segment';
import { logger } from '../utils/logger';
import { LoyaltyTier, SegmentCriteria } from '../types';

// ─── Nykaa Cosmetics Brand Data ──────────────────────────────────────────────

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane',
  'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
  'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad',
];

const NYKAA_PRODUCTS = {
  skincare: [
    'Nykaa Naturals Vitamin C Serum',
    'Nykaa Skin Secrets Argan Oil',
    'Dot & Key Watermelon Cooling Moisturizer',
    'Minimalist 10% Niacinamide Serum',
    'The Ordinary AHA 30% + BHA 2% Peeling Solution',
    'Plum Green Tea Pore Cleansing Face Wash',
    'Lakme 9to5 Primer + Matte Perfect Cover Foundation',
    'Biotique Bio Papaya Face Wash',
    'WOW Skin Science Retinol Face Cream',
    'Mamaearth Vitamin C Sleeping Mask',
    'Forest Essentials Facial Tonic Mist Rose',
    'Kama Ayurveda Kumkumadi Tailam',
    'Re\'equil Oxybenzone Free Sunscreen SPF 50',
    'La Shield Sunscreen SPF 40',
    'Cetaphil Moisturizing Cream',
  ],
  makeup: [
    'Maybelline Fit Me Matte Foundation',
    'L\'Oreal Paris True Match Concealer',
    'NYX Professional Makeup Setting Spray',
    'MAC Ruby Woo Lipstick',
    'Charlotte Tilbury Pillow Talk Lipstick',
    'Lakme Eyeconic Kajal',
    'Colorbar Sinful Matte Lipstick',
    'Faces Canada Ultime Pro Eyeshadow Palette',
    'Swiss Beauty All In One Eyeshadow',
    'Sugar Cosmetics Fool No More Waterproof Eyeliner',
    'Nykaa Eyes On Me Kajal',
    'Blue Heaven Blush On',
    'Elle 18 Cheek Pop Blush',
    'Revlon Ultra HD Lipstick',
    'Chambor Extreme Wear Transferproof Lipstick',
  ],
  haircare: [
    'Nykaa Naturals Argan Oil Hair Serum',
    'L\'Oreal Paris Total Repair 5 Shampoo',
    'Schwarzkopf Gliss Hair Repair Conditioner',
    'Tresemme Keratin Smooth Shampoo',
    'OGX Biotin & Collagen Shampoo',
    'Pantene Pro-V Hair Fall Control Shampoo',
    'Biotique Bio Kelp Fresh Growth Protein Shampoo',
    'Dove Intense Repair Conditioner',
    'Mamaearth Onion Hair Mask for Hair Fall',
    'WOW Skin Science Apple Cider Vinegar Shampoo',
    'StBotanica Moroccan Argan Oil Shampoo',
    'Streax Hair Serum with Walnut Oil',
    'Indulekha Bringha Hair Oil',
    'Parachute Advansed Jasmine Non-Sticky Coconut Hair Oil',
    'Garnier Ultra Blends Honey & Cream Shampoo',
  ],
  fragrance: [
    'Davidoff Cool Water Perfume',
    'Fogg Scent Xpressio Body Spray',
    'Park Avenue Good Morning Perfume',
    'Engage Cologne Spray',
    'Versace Bright Crystal Perfume',
    'Calvin Klein Eternity Perfume',
    'Wild Stone Classic Musk Perfume',
    'Denver Caliber Perfume',
    'AXON Signature Perfume',
    'Bella Vita Luxury CEO Eau De Perfume',
    'Nykaa Wanderlust EDP Perfume',
    'Skinn By Titan Nude EDP',
    'The Man Company Eau De Parfum',
    'Bombay Shaving Company Eau De Parfum',
    'Ajmal Witr Al Oud EDP',
  ],
  bodycare: [
    'Nykaa Naturals Body Butter Mango',
    'Vaseline Intensive Care Body Lotion',
    'Himalaya Herbals Nourishing Body Lotion',
    'St. Ives Naturally Smooth Shea Butter Body Lotion',
    'The Body Shop Shea Butter Body Scrub',
    'Dove Body Love Lotion',
    'Mamaearth Ubtan Body Wash',
    'Fiama Di Wills Gel Bar',
    'Lux Velvet Touch Beauty Bar Soap',
    'WOW Skin Science Aloe Vera Gel',
    'Forest Essentials Sugar Body Scrub',
    'Kama Ayurveda Rose Jasmine Face & Body Oil',
    'Plum Bodylovin Hawaiian Rumba Body Butter',
    'Dot & Key Ceramide Recovery Moisturizer',
    'MCaffeine Naked & Raw Coffee Body Scrub',
  ],
};

const ALL_PRODUCTS = [
  ...NYKAA_PRODUCTS.skincare,
  ...NYKAA_PRODUCTS.makeup,
  ...NYKAA_PRODUCTS.haircare,
  ...NYKAA_PRODUCTS.fragrance,
  ...NYKAA_PRODUCTS.bodycare,
];

function getProductCategory(product: string): string {
  if (NYKAA_PRODUCTS.skincare.includes(product)) return 'skincare';
  if (NYKAA_PRODUCTS.makeup.includes(product)) return 'makeup';
  if (NYKAA_PRODUCTS.haircare.includes(product)) return 'haircare';
  if (NYKAA_PRODUCTS.fragrance.includes(product)) return 'fragrance';
  return 'bodycare';
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getLoyaltyTier(spend: number): LoyaltyTier {
  if (spend >= 50000) return 'Platinum';
  if (spend >= 25000) return 'Gold';
  if (spend >= 10000) return 'Silver';
  return 'Bronze';
}

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(mongodbUri);
  logger.info('Connected to MongoDB for seeding');

  // Clean previous data
  await Promise.all([
    Customer.deleteMany({}),
    Order.deleteMany({}),
    Segment.deleteMany({}),
  ]);
  logger.info('Cleared existing data');

  // ── 1. Create 5000 Nykaa Customers ──────────────────────────────────────────
  const TOTAL_CUSTOMERS = 5000;
  const BATCH_SIZE = 500;
  const customers: any[] = [];
  const emailSet = new Set<string>();

  logger.info(`Creating ${TOTAL_CUSTOMERS} Nykaa customers...`);

  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    let email: string;
    do {
      email = faker.internet.email().toLowerCase();
    } while (emailSet.has(email));
    emailSet.add(email);

    customers.push({
      name: faker.person.fullName(),
      email,
      phone: `+91${randomInt(7000000000, 9999999999)}`,
      city: randomFrom(INDIAN_CITIES),
      totalSpend: 0,
      loyaltyTier: 'Bronze' as LoyaltyTier,
      createdAt: faker.date.between({ from: '2022-01-01', to: new Date() }),
    });
  }

  // Insert customers in batches
  const insertedCustomers: any[] = [];
  for (let b = 0; b < customers.length; b += BATCH_SIZE) {
    const batch = customers.slice(b, b + BATCH_SIZE);
    const inserted = await Customer.insertMany(batch, { ordered: false });
    insertedCustomers.push(...inserted);
    logger.info(`  Inserted customers ${b + 1}–${Math.min(b + BATCH_SIZE, TOTAL_CUSTOMERS)}`);
  }

  logger.info(`✓ Created ${insertedCustomers.length} customers`);

  // ── 2. Create Orders (Nykaa products) ───────────────────────────────────────
  logger.info('Creating orders for all customers...');

  const spendMap: Record<string, number> = {};
  const ordersBatch: any[] = [];

  for (const customer of insertedCustomers) {
    // Weight order count so that ~20% are heavy buyers (realistic for Nykaa)
    const customerType = Math.random();
    let orderCount: number;
    if (customerType < 0.05) {
      orderCount = randomInt(20, 50); // VIP buyers
    } else if (customerType < 0.20) {
      orderCount = randomInt(10, 20); // Regular buyers
    } else if (customerType < 0.55) {
      orderCount = randomInt(3, 9);   // Occasional buyers
    } else {
      orderCount = randomInt(1, 3);   // One-time buyers
    }

    let totalSpend = 0;
    const cid = customer._id.toString();
    spendMap[cid] = 0;

    for (let j = 0; j < orderCount; j++) {
      // Pick 1–4 products per order, biased toward skincare/makeup
      const productCount = randomInt(1, 4);
      const orderProducts = Array.from({ length: productCount }, () => {
        const categoryRoll = Math.random();
        if (categoryRoll < 0.35) return randomFrom(NYKAA_PRODUCTS.skincare);
        if (categoryRoll < 0.65) return randomFrom(NYKAA_PRODUCTS.makeup);
        if (categoryRoll < 0.80) return randomFrom(NYKAA_PRODUCTS.haircare);
        if (categoryRoll < 0.90) return randomFrom(NYKAA_PRODUCTS.fragrance);
        return randomFrom(NYKAA_PRODUCTS.bodycare);
      });

      const orderAmount = randomInt(299, 8999);
      const daysAgo = randomInt(1, 730); // up to 2 years
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      ordersBatch.push({
        customerId: customer._id,
        products: orderProducts,
        orderAmount,
        orderDate,
      });

      totalSpend += orderAmount;
    }
    spendMap[cid] = totalSpend;
  }

  // Insert orders in batches of 1000
  const ORDER_BATCH = 1000;
  for (let b = 0; b < ordersBatch.length; b += ORDER_BATCH) {
    await Order.insertMany(ordersBatch.slice(b, b + ORDER_BATCH), { ordered: false });
    logger.info(`  Inserted orders ${b + 1}–${Math.min(b + ORDER_BATCH, ordersBatch.length)}`);
  }
  logger.info(`✓ Created ${ordersBatch.length} total orders`);

  // ── 3. Update Customer totalSpend & loyaltyTier ──────────────────────────────
  logger.info('Updating customer spend & loyalty tiers...');
  const bulkOps = insertedCustomers.map((c) => {
    const spend = spendMap[c._id.toString()] || 0;
    return {
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { totalSpend: spend, loyaltyTier: getLoyaltyTier(spend) } },
      },
    };
  });

  for (let b = 0; b < bulkOps.length; b += BATCH_SIZE) {
    await Customer.bulkWrite(bulkOps.slice(b, b + BATCH_SIZE));
  }
  logger.info('✓ Updated all customer spend and loyalty tiers');

  // ── 4. Compute Segment Revenue Stats & Create Nykaa Segments ─────────────────
  logger.info('Computing segment revenue and creating Nykaa segments...');

  interface NykaaSegment {
    name: string;
    criteria: SegmentCriteria;
    naturalLanguageQuery: string;
    description: string;
  }

  const nykaaSegments: NykaaSegment[] = [
    {
      name: 'Nykaa Platinum VIPs',
      criteria: { loyaltyTier: 'Platinum', totalSpend: { operator: '>=', value: 50000 } },
      naturalLanguageQuery: 'Platinum tier customers who have spent ₹50,000 or more on Nykaa',
      description: 'Top-spending loyal Nykaa customers',
    },
    {
      name: 'Skincare Enthusiasts',
      criteria: { productCategory: 'Vitamin C Serum' },
      naturalLanguageQuery: 'Customers who purchased skincare serums or vitamin C products',
      description: 'Customers with skincare product purchases',
    },
    {
      name: 'Makeup Lovers – Gold Tier',
      criteria: { loyaltyTier: 'Gold', productCategory: 'Foundation' },
      naturalLanguageQuery: 'Gold tier customers who bought makeup products like foundation',
      description: 'Gold-tier makeup product purchasers',
    },
    {
      name: 'Dormant High Spenders',
      criteria: { totalSpend: { operator: '>', value: 10000 }, inactiveDays: 90 },
      naturalLanguageQuery: 'Customers who spent more than ₹10,000 but have been inactive for 90+ days',
      description: 'High-value but dormant Nykaa customers',
    },
    {
      name: 'Mumbai & Delhi Beauty Buyers',
      criteria: { city: 'Mumbai' },
      naturalLanguageQuery: 'Customers from Mumbai who are active beauty buyers',
      description: 'Metropolitan city customers in Mumbai',
    },
    {
      name: 'Frequent Buyers – 10+ Orders',
      criteria: { minOrders: 10 },
      naturalLanguageQuery: 'Customers who have placed more than 10 orders on Nykaa',
      description: 'Highly engaged repeat purchasers',
    },
    {
      name: 'Silver Tier – Haircare Buyers',
      criteria: { loyaltyTier: 'Silver', productCategory: 'Shampoo' },
      naturalLanguageQuery: 'Silver tier customers who purchase haircare products regularly',
      description: 'Silver-tier haircare product buyers',
    },
    {
      name: 'New Customers – Last 30 Days',
      criteria: { inactiveDays: 0, minOrders: 1 },
      naturalLanguageQuery: 'Customers who recently joined and placed their first order within 30 days',
      description: 'Newly acquired Nykaa customers',
    },
    {
      name: 'Fragrance Buyers',
      criteria: { productCategory: 'Perfume' },
      naturalLanguageQuery: 'Customers who purchased perfumes or fragrances from Nykaa',
      description: 'Fragrance and perfume category shoppers',
    },
    {
      name: 'Bronze Tier – Reactivation',
      criteria: { loyaltyTier: 'Bronze', inactiveDays: 60 },
      naturalLanguageQuery: 'Bronze tier customers inactive for 60+ days who need to be re-engaged',
      description: 'Lapsed Bronze-tier customers for win-back campaigns',
    },
  ];

  // For each segment, count customers and calculate revenue
  for (const seg of nykaaSegments) {
    const { countCustomersByCriteria, findCustomersByCriteria } = await import('../utils/mongoQueryBuilder');

    // Get matching customers
    const matchingCustomers = await findCustomersByCriteria(seg.criteria);
    const customerCount = matchingCustomers.length;
    const customerIds = matchingCustomers.map((c: any) => c._id);

    // Calculate revenue: sum of all orders for matching customers
    const revenueResult = await Order.aggregate([
      { $match: { customerId: { $in: customerIds } } },
      { $group: { _id: null, totalRevenue: { $sum: '$orderAmount' }, totalOrders: { $sum: 1 } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalOrders = revenueResult[0]?.totalOrders || 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const avgSpend = customerCount > 0 ? Math.round(totalRevenue / customerCount) : 0;

    // Tier breakdown for insights
    const tierBreakdown = await Customer.aggregate([
      { $match: { _id: { $in: customerIds } } },
      { $group: { _id: '$loyaltyTier', count: { $sum: 1 } } },
      { $project: { tier: '$_id', count: 1, _id: 0 } },
    ]);

    // Top cities for insights
    const topCities = await Customer.aggregate([
      { $match: { _id: { $in: customerIds } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { city: '$_id', count: 1, _id: 0 } },
    ]);

    await Segment.create({
      name: seg.name,
      criteria: seg.criteria,
      customerCount,
      naturalLanguageQuery: seg.naturalLanguageQuery,
      status: 'approved',
      insights: {
        topCities,
        tierBreakdown,
        avgSpend,
        totalRevenue,
        totalOrders,
        avgOrderValue,
        summary: `${seg.description}. Segment contains ${customerCount} customers generating ₹${totalRevenue.toLocaleString('en-IN')} in total revenue (avg ₹${avgSpend.toLocaleString('en-IN')} per customer, avg order ₹${avgOrderValue.toLocaleString('en-IN')}).`,
      },
    });

    logger.info(
      `  ✓ Segment "${seg.name}": ${customerCount} customers | Revenue ₹${totalRevenue.toLocaleString('en-IN')} | Avg spend ₹${avgSpend.toLocaleString('en-IN')}`
    );
  }

  logger.info('✓ All Nykaa segments created with revenue metrics');

  // ── 5. Summary ───────────────────────────────────────────────────────────────
  const totalCustomers = await Customer.countDocuments();
  const totalOrders = await Order.countDocuments();
  const totalSegments = await Segment.countDocuments();

  const revenueByTier = await Customer.aggregate([
    {
      $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'customerId',
        as: 'orders',
      },
    },
    {
      $group: {
        _id: '$loyaltyTier',
        customerCount: { $sum: 1 },
        totalRevenue: { $sum: { $sum: '$orders.orderAmount' } },
        avgSpend: { $avg: '$totalSpend' },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  logger.info('\n========== NYKAA SEED SUMMARY ==========');
  logger.info(`Total Customers : ${totalCustomers.toLocaleString('en-IN')}`);
  logger.info(`Total Orders    : ${totalOrders.toLocaleString('en-IN')}`);
  logger.info(`Total Segments  : ${totalSegments}`);
  logger.info('\nRevenue by Loyalty Tier:');
  for (const tier of revenueByTier) {
    logger.info(
      `  ${tier._id.padEnd(10)} | ${String(tier.customerCount).padStart(5)} customers | ₹${Math.round(tier.totalRevenue).toLocaleString('en-IN').padStart(15)} revenue | Avg spend ₹${Math.round(tier.avgSpend).toLocaleString('en-IN')}`
    );
  }
  logger.info('=========================================\n');

  logger.info('Seed completed successfully ✓');
  await mongoose.disconnect();
}

seed().catch((error) => {
  logger.error('Seed failed', { error });
  process.exit(1);
});
