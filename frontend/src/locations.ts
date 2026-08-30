// Countries and their cities that have international airports.
// Curated for TrustMule route selection. Bali is listed as "Denpasar (Bali)".

export type CountryLocations = { country: string; cities: string[] };

export const LOCATIONS: CountryLocations[] = [
  { country: "Indonesia", cities: ["Jakarta", "Denpasar (Bali)", "Surabaya", "Medan", "Yogyakarta", "Makassar", "Balikpapan", "Lombok"] },
  { country: "Singapore", cities: ["Singapore"] },
  { country: "Malaysia", cities: ["Kuala Lumpur", "Penang", "Kota Kinabalu", "Kuching", "Langkawi", "Johor Bahru"] },
  { country: "Thailand", cities: ["Bangkok", "Phuket", "Chiang Mai", "Krabi", "Koh Samui", "Pattaya"] },
  { country: "Vietnam", cities: ["Ho Chi Minh City", "Hanoi", "Da Nang", "Nha Trang", "Phu Quoc"] },
  { country: "Philippines", cities: ["Manila", "Cebu", "Clark", "Davao", "Boracay (Caticlan)"] },
  { country: "Japan", cities: ["Tokyo (Narita)", "Tokyo (Haneda)", "Osaka", "Nagoya", "Fukuoka", "Sapporo", "Okinawa"] },
  { country: "South Korea", cities: ["Seoul (Incheon)", "Busan", "Jeju", "Daegu"] },
  { country: "China", cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Hangzhou", "Xi'an"] },
  { country: "Hong Kong", cities: ["Hong Kong"] },
  { country: "Taiwan", cities: ["Taipei", "Kaohsiung", "Taichung"] },
  { country: "India", cities: ["Mumbai", "New Delhi", "Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Kochi", "Goa"] },
  { country: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { country: "Qatar", cities: ["Doha"] },
  { country: "Saudi Arabia", cities: ["Riyadh", "Jeddah", "Dammam"] },
  { country: "Turkey", cities: ["Istanbul", "Antalya", "Ankara", "Izmir"] },
  { country: "Australia", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Gold Coast", "Adelaide", "Cairns"] },
  { country: "New Zealand", cities: ["Auckland", "Christchurch", "Wellington", "Queenstown"] },
  { country: "United States", cities: ["New York (JFK)", "Los Angeles", "San Francisco", "Chicago", "Miami", "Seattle", "Boston", "Dallas", "Atlanta", "Las Vegas"] },
  { country: "Canada", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"] },
  { country: "Mexico", cities: ["Mexico City", "Cancún", "Guadalajara", "Monterrey"] },
  { country: "Brazil", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Recife"] },
  { country: "Argentina", cities: ["Buenos Aires", "Córdoba", "Mendoza"] },
  { country: "United Kingdom", cities: ["London (Heathrow)", "London (Gatwick)", "Manchester", "Edinburgh", "Birmingham", "Glasgow"] },
  { country: "Ireland", cities: ["Dublin", "Cork", "Shannon"] },
  { country: "France", cities: ["Paris (CDG)", "Paris (Orly)", "Nice", "Lyon", "Marseille", "Toulouse"] },
  { country: "Germany", cities: ["Frankfurt", "Munich", "Berlin", "Hamburg", "Düsseldorf", "Cologne"] },
  { country: "Netherlands", cities: ["Amsterdam", "Rotterdam", "Eindhoven"] },
  { country: "Belgium", cities: ["Brussels", "Antwerp"] },
  { country: "Spain", cities: ["Madrid", "Barcelona", "Málaga", "Valencia", "Palma de Mallorca", "Seville"] },
  { country: "Portugal", cities: ["Lisbon", "Porto", "Faro"] },
  { country: "Italy", cities: ["Rome", "Milan", "Venice", "Naples", "Florence", "Bologna"] },
  { country: "Switzerland", cities: ["Zurich", "Geneva", "Basel"] },
  { country: "Austria", cities: ["Vienna", "Salzburg", "Innsbruck"] },
  { country: "Greece", cities: ["Athens", "Thessaloniki", "Santorini", "Mykonos"] },
  { country: "Sweden", cities: ["Stockholm", "Gothenburg", "Malmö"] },
  { country: "Norway", cities: ["Oslo", "Bergen", "Stavanger"] },
  { country: "Denmark", cities: ["Copenhagen", "Billund"] },
  { country: "Finland", cities: ["Helsinki"] },
  { country: "Poland", cities: ["Warsaw", "Kraków", "Gdańsk"] },
  { country: "Czech Republic", cities: ["Prague"] },
  { country: "Russia", cities: ["Moscow", "Saint Petersburg"] },
  { country: "Egypt", cities: ["Cairo", "Hurghada", "Sharm El Sheikh"] },
  { country: "South Africa", cities: ["Johannesburg", "Cape Town", "Durban"] },
  { country: "Kenya", cities: ["Nairobi", "Mombasa"] },
  { country: "Nigeria", cities: ["Lagos", "Abuja"] },
  { country: "Morocco", cities: ["Casablanca", "Marrakesh", "Rabat"] },
  { country: "Israel", cities: ["Tel Aviv"] },
  { country: "Sri Lanka", cities: ["Colombo"] },
  { country: "Bangladesh", cities: ["Dhaka", "Chittagong"] },
  { country: "Pakistan", cities: ["Karachi", "Lahore", "Islamabad"] },
  { country: "Nepal", cities: ["Kathmandu"] },
  { country: "Cambodia", cities: ["Phnom Penh", "Siem Reap"] },
  { country: "Myanmar", cities: ["Yangon"] },
];

export const ALL_COUNTRIES: string[] = LOCATIONS.map((l) => l.country);

export function citiesFor(country: string | null | undefined): string[] {
  if (!country) return [];
  return LOCATIONS.find((l) => l.country === country)?.cities ?? [];
}

export function formatRoute(country?: string | null, city?: string | null): string {
  if (city && country) return `${city}, ${country}`;
  return country || "";
}
