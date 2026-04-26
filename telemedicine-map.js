const map = L.map('mapid').setView([20.5937, 78.9629], 5); // India default
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

let userMarker = null;
let poiMarkers = [];
let routingControl = null;
let userLocation = null;

const statusText = document.getElementById('statusText');
const locateBtn = document.getElementById('locateBtn');
const findBtn = document.getElementById('findBtn');
const clearBtn = document.getElementById('clearBtn');
const placeType = document.getElementById('placeType');
const transportMode = document.getElementById('transportMode');
const radiusSelect = document.getElementById('radiusSelect');

function setStatus(msg) {
  statusText.textContent = `Status: ${msg}`;
}

function setUserLocation(lat, lng) {
  userLocation = { lat, lng };
  if (userMarker) map.removeLayer(userMarker);
  userMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    }),
  })
    .addTo(map)
    .bindPopup('You are here')
    .openPopup();
  map.setView([lat, lng], 14);
  setStatus('Location found. Now find nearby places.');
}

function clearPOIMarkers() {
  poiMarkers.forEach((m) => map.removeLayer(m));
  poiMarkers = [];
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }
  setStatus('Cleared POIs and route');
}

function overpassQuery(lat, lng, types = ['hospital', 'pharmacy'], radius = 5000) {
  const typeFilter = types
    .map((t) => `node[\"amenity\"=\"${t}\"](around:${radius},${lat},${lng});way[\"amenity\"=\"${t}\"](around:${radius},${lat},${lng});relation[\"amenity\"=\"${t}\"](around:${radius},${lat},${lng});`)
    .join('');
  return `
    [out:json][timeout:30];
    (
      ${typeFilter}
    );
    out center;
  `;
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

async function fetchNearbyPlaces() {
  if (!userLocation) {
    setStatus('Use Find My Location first');
    return;
  }

  setStatus('Fetching places...');
  clearPOIMarkers();

  const types = placeType.value.split(',').map((v) => v.trim());
  const radius = Number(radiusSelect.value || 5000);
  const query = overpassQuery(userLocation.lat, userLocation.lng, types, radius);

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams({ data: query }),
    });

    if (response.status === 429) {
      setStatus('Rate limit exceeded on Overpass API. Please wait and try again in 30 seconds.');
      return;
    }

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.elements || data.elements.length === 0) {
      setStatus('No places found in radius 5 km. Try increasing radius or location.');
      return;
    }

    const parsed = data.elements
      .map((e) => {
        const lat = e.lat ?? e.center?.lat;
        const lng = e.lon ?? e.center?.lon;
        const name = e.tags?.name || '(unknown)';
        const tag = e.tags?.amenity || 'unknown';
        return lat && lng ? { id: e.id, lat, lng, tag, name } : null;
      })
      .filter(Boolean);

    if (!parsed.length) {
      setStatus('No valid place coordinates found (OSM response had no coordinates).');
      return;
    }

    const sorted = parsed
      .map((place) => ({ ...place, dist: haversineDistance(userLocation, place) }))
      .sort((a, b) => a.dist - b.dist);

    sorted.slice(0, 25).forEach((place) => {
      const iconUrl = place.tag === 'pharmacy'
        ? 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png'
        : 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png';

      const marker = L.marker([place.lat, place.lng], {
        icon: L.icon({
          iconUrl,
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
        }),
      }).addTo(map);

      marker.bindPopup(`
        <strong>${place.name}</strong><br/>
        ${place.tag} (${place.dist.toFixed(2)} km)<br/>
        <button onclick="planRoute(${place.lat}, ${place.lng}, '${escape(place.name)}', ${place.dist.toFixed(2)})">
          Route here
        </button>
      `);

      poiMarkers.push(marker);
    });

    setStatus(`${sorted.length} place(s) found (top 25 shown).`);
    if (sorted.length === 0) {
      setStatus('No places found within 5 km. Try increasing the radius or moving location.');
    }
  } catch (err) {
    console.error('fetchNearbyPlaces', err);
    if (err.name === 'TypeError') {
      setStatus('Network or CORS error from Overpass API. Please try again.');
    } else {
      setStatus('Error fetching places: ' + err.message);
    }
  }
}

function getRouterOptions() {
  const mode = transportMode.value || 'car';
  const profiles = { car: 'driving', bike: 'cycling', foot: 'foot' };
  const profile = profiles[mode] || 'driving';

  return L.Routing.osrmv1({
    serviceUrl: 'https://router.project-osrm.org/route/v1',
    profile,
    timeout: 30 * 1000,
  });
}

function planRoute(destLat, destLng, destName = 'destination', dist = null) {
  if (!userLocation) {
    setStatus('Locate yourself first');
    return;
  }

  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  const modeLabel = transportMode.options[transportMode.selectedIndex]?.text || 'Driving';

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(userLocation.lat, userLocation.lng),
      L.latLng(destLat, destLng),
    ],
    router: getRouterOptions(),
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    createMarker: (i, wp) => i === 0
      ? L.marker(wp.latLng, { icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] }) }).bindPopup('Start')
      : L.marker(wp.latLng),
    lineOptions: { styles: [{ color: '#2B7AE4', weight: 6 }] },
    showAlternatives: false,
  })
    .on('routesfound', (e) => {
      const route = e.routes[0];
      const km = (route.summary.totalDistance / 1000).toFixed(2);
      const time = route.summary.totalTime;
      const min = Math.round(time / 60);
      const eta = `${min} min`;
      const dVal = dist ? `${dist.toFixed(2)} km` : `${km} km`;
      setStatus(`Route to ${unescape(destName)}: ${dVal}, ${eta} by ${modeLabel}`);
    })
    .on('routingerror', () => {
      setStatus('Routing failed. Try another mode or destination.');
    })
    .addTo(map);
}

function locateUser() {
  if (!navigator.geolocation) {
    setStatus('Geolocation is not available in this browser.');
    return;
  }
  setStatus('Locating...');
  navigator.geolocation.getCurrentPosition(
    (pos) => setUserLocation(pos.coords.latitude, pos.coords.longitude),
    (err) => setStatus('Location permission denied or unavailable')
  );
}

window.planRoute = planRoute;
locateBtn.addEventListener('click', locateUser);
findBtn.addEventListener('click', fetchNearbyPlaces);
clearBtn.addEventListener('click', clearPOIMarkers);
