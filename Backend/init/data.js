const sampleListings = [
  {
    title: "Cozy Beachfront Cottage",
    description: "Relax by the sea with stunning ocean views.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=60",
    },
    price: 1500,
    location: "Malibu",
    country: "United States",
    category: "beach",
  },

  {
    title: "Modern City Loft",
    description: "Perfect stay in the heart of the city.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=60",
    },
    price: 1200,
    location: "New York City",
    country: "United States",
    category: "urban",
  },

  {
    title: "Mountain Retreat Cabin",
    description: "Peaceful cabin surrounded by mountains.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=60",
    },
    price: 1000,
    location: "Aspen",
    country: "United States",
    category: "mountain",
  },

  {
    title: "Historic Castle Stay",
    description: "Live like royalty in a historic castle.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?auto=format&fit=crop&w=800&q=60",
    },
    price: 4000,
    location: "Scottish Highlands",
    country: "United Kingdom",
    category: "castles",
  },

  {
    title: "Luxury Villa with Pool",
    description: "Private pool and luxury living.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1470165301023-58dab8118cc9?auto=format&fit=crop&w=800&q=60",
    },
    price: 3000,
    location: "Phuket",
    country: "Thailand",
    category: "pools",
  },

  {
    title: "Forest Treehouse",
    description: "Eco-friendly treehouse deep in the forest.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=60",
    },
    price: 800,
    location: "Portland",
    country: "United States",
    category: "forest",
  },

  {
    title: "Camping Tent Stay",
    description: "Experience nature with modern camping.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=60",
    },
    price: 600,
    location: "Banff",
    country: "Canada",
    category: "camping",
  },

  {
    title: "Arctic Igloo Experience",
    description: "Sleep under northern lights in an igloo.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=60",
    },
    price: 2200,
    location: "Lapland",
    country: "Finland",
    category: "arctic",
  },

  {
    title: "Lakefront Wooden Cabin",
    description: "Calm lake views and cozy evenings.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?auto=format&fit=crop&w=800&q=60",
    },
    price: 1200,
    location: "New Hampshire",
    country: "United States",
    category: "lakefront",
  },

  {
    title: "Houseboat Stay",
    description: "Unique living experience on water.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60",
    },
    price: 1800,
    location: "Alleppey",
    country: "India",
    category: "boats",
  },

  {
    title: "Luxury Farm Stay",
    description: "Enjoy countryside life with luxury.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?auto=format&fit=crop&w=800&q=60",
    },
    price: 900,
    location: "Nashik",
    country: "India",
    category: "farms",
  },

  {
    title: "Trending Glass Dome Stay",
    description: "Instagram-famous dome stay.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1602088113235-229c19758e9f?auto=format&fit=crop&w=800&q=60",
    },
    price: 2500,
    location: "Iceland",
    country: "Iceland",
    category: "domes",
  },
  {
    title: "Iconic Paris Apartment",
    description:
      "Stay near the Eiffel Tower in this iconic Parisian apartment.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=60",
    },
    price: 2200,
    location: "Paris",
    country: "France",
    category: "iconic",
  },

  {
    title: "Luxury Room in Heritage Haveli",
    description: "Traditional haveli room with modern comfort.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=60",
    },
    price: 1300,
    location: "Jaipur",
    country: "India",
    category: "rooms",
  },

  {
    title: "Trending Cliffside Villa",
    description: "Viral cliffside stay with panoramic ocean views.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1501117716987-c8e1ecb2101c?auto=format&fit=crop&w=800&q=60",
    },
    price: 4500,
    location: "Amalfi Coast",
    country: "Italy",
    category: "trending",
  },

  {
    title: "Snowy Arctic Glass Igloo",
    description: "Watch the Northern Lights from your bed.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1543877087-ebf71fde2be1?auto=format&fit=crop&w=800&q=60",
    },
    price: 3200,
    location: "Lapland",
    country: "Finland",
    category: "arctic",
  },

  {
    title: "Mountain Wooden Chalet",
    description: "Warm wooden chalet with stunning mountain views.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1517821365201-1faadb940caa?auto=format&fit=crop&w=800&q=60",
    },
    price: 1800,
    location: "Manali",
    country: "India",
    category: "mountain",
  },

  {
    title: "Beach Hut Escape",
    description: "Minimal beach hut steps away from the sea.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=800&q=60",
    },
    price: 900,
    location: "Goa",
    country: "India",
    category: "beach",
  },

  {
    title: "Luxury Houseboat",
    description: "Premium houseboat with sunset lake views.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60",
    },
    price: 2400,
    location: "Alleppey",
    country: "India",
    category: "boats",
  },

  {
    title: "Farm Stay Vineyard Retreat",
    description: "Stay amidst vineyards with fresh farm food.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=60",
    },
    price: 1100,
    location: "Napa Valley",
    country: "United States",
    category: "farms",
  },

  {
    title: "Urban Studio Apartment",
    description: "Compact modern studio in city center.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=60",
    },
    price: 1400,
    location: "Berlin",
    country: "Germany",
    category: "urban",
  },

  {
    title: "Countryside Stone Cottage",
    description: "Quiet countryside stay surrounded by greenery.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=800&q=60",
    },
    price: 1000,
    location: "Yorkshire",
    country: "United Kingdom",
    category: "countryside",
  },

  {
    title: "Luxury Infinity Pool Villa",
    description: "Infinity pool overlooking tropical jungle.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=60",
    },
    price: 5000,
    location: "Ubud",
    country: "Indonesia",
    category: "pools",
  },

  {
    title: "Forest Cabin Hideaway",
    description: "Deep forest cabin with complete privacy.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2b8f?auto=format&fit=crop&w=800&q=60",
    },
    price: 950,
    location: "Black Forest",
    country: "Germany",
    category: "forest",
  },
  {
    title: "Iconic New York Skyline Loft",
    description: "Stylish loft with breathtaking Manhattan skyline views.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=60",
    },
    price: 2600,
    location: "New York City",
    country: "United States",
    category: "iconic",
  },

  {
    title: "Luxury Private Room in Palace",
    description: "Royal palace room with heritage interiors.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1582719478181-2f8f6b5d71f2?auto=format&fit=crop&w=800&q=60",
    },
    price: 1700,
    location: "Udaipur",
    country: "India",
    category: "rooms",
  },

  {
    title: "Trending Desert Dome Stay",
    description: "Instagram-famous dome stay in the desert.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=60",
    },
    price: 3900,
    location: "Dubai",
    country: "United Arab Emirates",
    category: "trending",
  },

  {
    title: "Arctic Snow Cabin Experience",
    description: "Cozy snow cabin under the Arctic sky.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=800&q=60",
    },
    price: 2800,
    location: "Tromsø",
    country: "Norway",
    category: "arctic",
  },

  {
    title: "Hillside Mountain Stone Lodge",
    description: "Stone lodge with panoramic valley views.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=800&q=60",
    },
    price: 2000,
    location: "Kasol",
    country: "India",
    category: "mountain",
  },

  {
    title: "Beachfront Bamboo Cottage",
    description: "Eco bamboo cottage directly on the beach.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1499696786230-29e6a3f0b2a0?auto=format&fit=crop&w=800&q=60",
    },
    price: 1200,
    location: "Gokarna",
    country: "India",
    category: "beach",
  },

  {
    title: "Classic Venetian Houseboat",
    description: "Romantic houseboat stay on Venetian canals.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1500534314209-a26db0f5a23f?auto=format&fit=crop&w=800&q=60",
    },
    price: 3100,
    location: "Venice",
    country: "Italy",
    category: "boats",
  },

  {
    title: "Organic Countryside Farm Villa",
    description: "Luxury villa inside an organic farm.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=800&q=60",
    },
    price: 1400,
    location: "Tuscany",
    country: "Italy",
    category: "farms",
  },

  {
    title: "Urban High-Rise Apartment",
    description: "Modern high-rise apartment in business district.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=60",
    },
    price: 1900,
    location: "Singapore",
    country: "Singapore",
    category: "urban",
  },

  {
    title: "Countryside Lakeview Cottage",
    description: "Quiet lakeview cottage in the countryside.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1600585153924-ecb0a9f42a9f?auto=format&fit=crop&w=800&q=60",
    },
    price: 1100,
    location: "Lake District",
    country: "United Kingdom",
    category: "countryside",
  },

  {
    title: "Private Infinity Pool Cliff Villa",
    description: "Cliffside villa with private infinity pool.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=60",
    },
    price: 6200,
    location: "Santorini",
    country: "Greece",
    category: "pools",
  },

  {
    title: "Deep Forest Wooden Lodge",
    description: "Secluded wooden lodge deep inside forest.",
    image: {
      filename: "listingimage",
      url: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2b8f?auto=format&fit=crop&w=800&q=60",
    },
    price: 1050,
    location: "Redwood Forest",
    country: "United States",
    category: "forest",
  },
];

module.exports = { data: sampleListings };
