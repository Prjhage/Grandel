const axios = require("axios");

module.exports.getNearbyPlaces = async (lat, lng) => {
  try {
    const query = `
      [out:json][timeout:25];
      (
        node"tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium|artwork";
        node"historic";
        node"leisure"~"park|garden|nature_reserve|water_park";
        node"amenity"~"place_of_worship|theatre|arts_centre|planetarium";
        
        way"tourism"~"attraction|museum|viewpoint|zoo|theme_park|gallery|aquarium|artwork";
        way"historic";
        way"leisure"~"park|garden|nature_reserve|water_park";
      );
      out center 20;
    `;

    const url = "https://overpass-api.de/api/interpreter";

    const response = await axios.post(
      url,
      `data=${encodeURIComponent(query)}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("Overpass results count:", response.data.elements.length);

    if (!response.data.elements || response.data.elements.length === 0) {
      return [];
    }

    // Filter duplicates and map to clean object
    const uniquePlaces = new Map();

    response.data.elements.forEach((el) => {
      if (el.tags && el.tags.name) {
        if (!uniquePlaces.has(el.tags.name)) {
          uniquePlaces.set(el.tags.name, {
            name: el.tags.name,
            type: el.tags.tourism || el.tags.historic || el.tags.leisure || el.tags.amenity || "attraction",
            lat: el.lat || (el.center && el.center.lat),
            lng: el.lon || (el.center && el.center.lon),
          });
        }
      }
    });

    return Array.from(uniquePlaces.values()).slice(0, 5);
  } catch (err) {
    console.error("Overpass API Error:", err.message);
    return [];
  }
};
