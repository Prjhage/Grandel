let apiKey = mapToken;

let lat = 28.6139;
let lng = 77.209;
if (listing.geometry && listing.geometry.coordinates) {
  lng = listing.geometry.coordinates[0];
  lat = listing.geometry.coordinates[1];
}

const map = L.map("map").setView([lat, lng], 13);

L.tileLayer(
  `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=${apiKey}`,
  {
    attribution: "&copy; MapTiler",
  }
).addTo(map);

L.marker([lat, lng]).addTo(map).bindPopup(listing.location).openPopup();
