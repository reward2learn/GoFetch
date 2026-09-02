export interface Airport {
  code: string; // IATA code
  city: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
  // ── Australia ──────────────────────────────────────────────────────────────
  { code: "SYD", city: "Sydney", country: "Australia" },
  { code: "MEL", city: "Melbourne", country: "Australia" },
  { code: "BNE", city: "Brisbane", country: "Australia" },
  { code: "PER", city: "Perth", country: "Australia" },
  { code: "ADL", city: "Adelaide", country: "Australia" },

  // ── Austria ────────────────────────────────────────────────────────────────
  { code: "VIE", city: "Vienna", country: "Austria" },
  { code: "SZG", city: "Salzburg", country: "Austria" },
  { code: "INN", city: "Innsbruck", country: "Austria" },
  { code: "GRZ", city: "Graz", country: "Austria" },

  // ── Bahrain ────────────────────────────────────────────────────────────────
  { code: "BAH", city: "Manama", country: "Bahrain" },

  // ── Bangladesh ─────────────────────────────────────────────────────────────
  { code: "DAC", city: "Dhaka", country: "Bangladesh" },
  { code: "CXB", city: "Cox's Bazar", country: "Bangladesh" },
  { code: "CGP", city: "Chittagong", country: "Bangladesh" },

  // ── Belgium ────────────────────────────────────────────────────────────────
  { code: "BRU", city: "Brussels", country: "Belgium" },
  { code: "ANR", city: "Antwerp", country: "Belgium" },
  { code: "LGG", city: "Liège", country: "Belgium" },

  // ── Brazil ─────────────────────────────────────────────────────────────────
  { code: "GRU", city: "São Paulo", country: "Brazil" },
  { code: "GIG", city: "Rio de Janeiro", country: "Brazil" },
  { code: "BSB", city: "Brasília", country: "Brazil" },
  { code: "CNF", city: "Belo Horizonte", country: "Brazil" },
  { code: "SSA", city: "Salvador", country: "Brazil" },
  { code: "REC", city: "Recife", country: "Brazil" },

  // ── Cambodia ───────────────────────────────────────────────────────────────
  { code: "PNH", city: "Phnom Penh", country: "Cambodia" },
  { code: "REP", city: "Siem Reap", country: "Cambodia" },

  // ── Canada ─────────────────────────────────────────────────────────────────
  { code: "YYZ", city: "Toronto", country: "Canada" },
  { code: "YVR", city: "Vancouver", country: "Canada" },
  { code: "YUL", city: "Montreal", country: "Canada" },
  { code: "YYC", city: "Calgary", country: "Canada" },
  { code: "YEG", city: "Edmonton", country: "Canada" },
  { code: "YOW", city: "Ottawa", country: "Canada" },
  { code: "YWG", city: "Winnipeg", country: "Canada" },
  { code: "YHZ", city: "Halifax", country: "Canada" },

  // ── China ──────────────────────────────────────────────────────────────────
  { code: "PEK", city: "Beijing", country: "China" },
  { code: "PVG", city: "Shanghai", country: "China" },
  { code: "CAN", city: "Guangzhou", country: "China" },
  { code: "SZX", city: "Shenzhen", country: "China" },
  { code: "CTU", city: "Chengdu", country: "China" },
  { code: "KMG", city: "Kunming", country: "China" },
  { code: "XIY", city: "Xi'an", country: "China" },
  { code: "HGH", city: "Hangzhou", country: "China" },

  // ── Colombia ───────────────────────────────────────────────────────────────
  { code: "BOG", city: "Bogotá", country: "Colombia" },
  { code: "MDE", city: "Medellín", country: "Colombia" },
  { code: "CLO", city: "Cali", country: "Colombia" },
  { code: "CTG", city: "Cartagena", country: "Colombia" },

  // ── Costa Rica ─────────────────────────────────────────────────────────────
  { code: "SJO", city: "San José", country: "Costa Rica" },
  { code: "LIR", city: "Liberia", country: "Costa Rica" },

  // ── Croatia ────────────────────────────────────────────────────────────────
  { code: "ZAG", city: "Zagreb", country: "Croatia" },
  { code: "DBV", city: "Dubrovnik", country: "Croatia" },
  { code: "SPU", city: "Split", country: "Croatia" },

  // ── Cuba ───────────────────────────────────────────────────────────────────
  { code: "HAV", city: "Havana", country: "Cuba" },

  // ── Czech Republic ────────────────────────────────────────────────────────
  { code: "PRG", city: "Prague", country: "Czech Republic" },
  { code: "BRQ", city: "Brno", country: "Czech Republic" },

  // ── Denmark ────────────────────────────────────────────────────────────────
  { code: "CPH", city: "Copenhagen", country: "Denmark" },
  { code: "AAR", city: "Aarhus", country: "Denmark" },

  // ── Dominican Republic ────────────────────────────────────────────────────
  { code: "SDQ", city: "Santo Domingo", country: "Dominican Republic" },
  { code: "PUJ", city: "Punta Cana", country: "Dominican Republic" },

  // ── Ecuador ────────────────────────────────────────────────────────────────
  { code: "UIO", city: "Quito", country: "Ecuador" },
  { code: "GYE", city: "Guayaquil", country: "Ecuador" },

  // ── Egypt ──────────────────────────────────────────────────────────────────
  { code: "CAI", city: "Cairo", country: "Egypt" },
  { code: "HBE", city: "Alexandria", country: "Egypt" },
  { code: "HRG", city: "Hurghada", country: "Egypt" },
  { code: "SSH", city: "Sharm el-Sheikh", country: "Egypt" },

  // ── Estonia ────────────────────────────────────────────────────────────────
  { code: "TLL", city: "Tallinn", country: "Estonia" },

  // ── Finland ────────────────────────────────────────────────────────────────
  { code: "HEL", city: "Helsinki", country: "Finland" },
  { code: "TMP", city: "Tampere", country: "Finland" },
  { code: "TKU", city: "Turku", country: "Finland" },

  // ── France ─────────────────────────────────────────────────────────────────
  { code: "CDG", city: "Paris", country: "France" },
  { code: "LYS", city: "Lyon", country: "France" },
  { code: "MRS", city: "Marseille", country: "France" },
  { code: "NCE", city: "Nice", country: "France" },
  { code: "TLS", city: "Toulouse", country: "France" },
  { code: "BOD", city: "Bordeaux", country: "France" },
  { code: "NTE", city: "Nantes", country: "France" },

  // ── Germany ────────────────────────────────────────────────────────────────
  { code: "FRA", city: "Frankfurt", country: "Germany" },
  { code: "MUC", city: "Munich", country: "Germany" },
  { code: "TXL", city: "Berlin", country: "Germany" },
  { code: "DUS", city: "Düsseldorf", country: "Germany" },
  { code: "HAM", city: "Hamburg", country: "Germany" },
  { code: "STR", city: "Stuttgart", country: "Germany" },
  { code: "CGN", city: "Cologne", country: "Germany" },

  // ── Greece ─────────────────────────────────────────────────────────────────
  { code: "ATH", city: "Athens", country: "Greece" },
  { code: "SKG", city: "Thessaloniki", country: "Greece" },
  { code: "HER", city: "Heraklion", country: "Greece" },
  { code: "RHO", city: "Rhodes", country: "Greece" },

  // ── Guatemala ──────────────────────────────────────────────────────────────
  { code: "GUA", city: "Guatemala City", country: "Guatemala" },

  // ── Hong Kong ──────────────────────────────────────────────────────────────
  { code: "HKG", city: "Hong Kong", country: "Hong Kong" },

  // ── Hungary ────────────────────────────────────────────────────────────────
  { code: "BUD", city: "Budapest", country: "Hungary" },
  { code: "DEB", city: "Debrecen", country: "Hungary" },

  // ── Iceland ────────────────────────────────────────────────────────────────
  { code: "KEF", city: "Reykjavik", country: "Iceland" },

  // ── India ──────────────────────────────────────────────────────────────────
  { code: "DEL", city: "Delhi", country: "India" },
  { code: "BOM", city: "Mumbai", country: "India" },
  { code: "BLR", city: "Bangalore", country: "India" },
  { code: "MAA", city: "Chennai", country: "India" },
  { code: "CCU", city: "Kolkata", country: "India" },
  { code: "HYD", city: "Hyderabad", country: "India" },
  { code: "COK", city: "Kochi", country: "India" },
  { code: "GOI", city: "Goa", country: "India" },

  // ── Indonesia ──────────────────────────────────────────────────────────────
  { code: "CGK", city: "Jakarta", country: "Indonesia" },
  { code: "DPS", city: "Bali", country: "Indonesia" },
  { code: "SUB", city: "Surabaya", country: "Indonesia" },
  { code: "SOC", city: "Yogyakarta", country: "Indonesia" },

  // ── Ireland ────────────────────────────────────────────────────────────────
  { code: "DUB", city: "Dublin", country: "Ireland" },
  { code: "ORK", city: "Cork", country: "Ireland" },
  { code: "SNN", city: "Shannon", country: "Ireland" },

  // ── Israel ─────────────────────────────────────────────────────────────────
  { code: "TLV", city: "Tel Aviv", country: "Israel" },
  { code: "JRS", city: "Jerusalem", country: "Israel" },
  { code: "ETH", city: "Eilat", country: "Israel" },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { code: "FCO", city: "Rome", country: "Italy" },
  { code: "MXP", city: "Milan", country: "Italy" },
  { code: "VCE", city: "Venice", country: "Italy" },
  { code: "NAP", city: "Naples", country: "Italy" },
  { code: "FLR", city: "Florence", country: "Italy" },
  { code: "PSA", city: "Pisa", country: "Italy" },
  { code: "CAG", city: "Cagliari", country: "Italy" },

  // ── Jamaica ────────────────────────────────────────────────────────────────
  { code: "KIN", city: "Kingston", country: "Jamaica" },
  { code: "MBJ", city: "Montego Bay", country: "Jamaica" },

  // ── Japan ──────────────────────────────────────────────────────────────────
  { code: "NRT", city: "Tokyo", country: "Japan" },
  { code: "KIX", city: "Osaka", country: "Japan" },
  { code: "NGO", city: "Nagoya", country: "Japan" },
  { code: "FUK", city: "Fukuoka", country: "Japan" },
  { code: "CTS", city: "Sapporo", country: "Japan" },
  { code: "OKA", city: "Okinawa", country: "Japan" },

  // ── Jordan ─────────────────────────────────────────────────────────────────
  { code: "AMM", city: "Amman", country: "Jordan" },
  { code: "AQJ", city: "Aqaba", country: "Jordan" },

  // ── Kenya ──────────────────────────────────────────────────────────────────
  { code: "NBO", city: "Nairobi", country: "Kenya" },
  { code: "MBA", city: "Mombasa", country: "Kenya" },

  // ── Kuwait ─────────────────────────────────────────────────────────────────
  { code: "KWI", city: "Kuwait City", country: "Kuwait" },

  // ── Latvia ─────────────────────────────────────────────────────────────────
  { code: "RIX", city: "Riga", country: "Latvia" },

  // ── Lithuania ──────────────────────────────────────────────────────────────
  { code: "VNO", city: "Vilnius", country: "Lithuania" },
  { code: "KUN", city: "Kaunas", country: "Lithuania" },

  // ── Luxembourg ─────────────────────────────────────────────────────────────
  { code: "LUX", city: "Luxembourg City", country: "Luxembourg" },

  // ── Malaysia ───────────────────────────────────────────────────────────────
  { code: "KUL", city: "Kuala Lumpur", country: "Malaysia" },
  { code: "PEN", city: "Penang", country: "Malaysia" },
  { code: "BKI", city: "Kota Kinabalu", country: "Malaysia" },
  { code: "JHB", city: "Johor Bahru", country: "Malaysia" },

  // ── Maldives ───────────────────────────────────────────────────────────────
  { code: "MLE", city: "Malé", country: "Maldives" },

  // ── Malta ──────────────────────────────────────────────────────────────────
  { code: "MLA", city: "Valletta", country: "Malta" },

  // ── Mauritius ──────────────────────────────────────────────────────────────
  { code: "MRU", city: "Port Louis", country: "Mauritius" },

  // ── Mexico ─────────────────────────────────────────────────────────────────
  { code: "MEX", city: "Mexico City", country: "Mexico" },
  { code: "CUN", city: "Cancún", country: "Mexico" },
  { code: "GDL", city: "Guadalajara", country: "Mexico" },
  { code: "MTY", city: "Monterrey", country: "Mexico" },
  { code: "PVR", city: "Puerto Vallarta", country: "Mexico" },
  { code: "SJD", city: "San José del Cabo", country: "Mexico" },

  // ── Morocco ────────────────────────────────────────────────────────────────
  { code: "CMN", city: "Casablanca", country: "Morocco" },
  { code: "RAK", city: "Marrakech", country: "Morocco" },
  { code: "FEZ", city: "Fez", country: "Morocco" },
  { code: "TNG", city: "Tangier", country: "Morocco" },

  // ── Myanmar ────────────────────────────────────────────────────────────────
  { code: "RGN", city: "Yangon", country: "Myanmar" },
  { code: "MDL", city: "Mandalay", country: "Myanmar" },

  // ── Nepal ──────────────────────────────────────────────────────────────────
  { code: "KTM", city: "Kathmandu", country: "Nepal" },
  { code: "PKR", city: "Pokhara", country: "Nepal" },

  // ── Netherlands ────────────────────────────────────────────────────────────
  { code: "AMS", city: "Amsterdam", country: "Netherlands" },
  { code: "RTM", city: "Rotterdam", country: "Netherlands" },
  { code: "EIN", city: "Eindhoven", country: "Netherlands" },

  // ── New Zealand ────────────────────────────────────────────────────────────
  { code: "AKL", city: "Auckland", country: "New Zealand" },
  { code: "WLG", city: "Wellington", country: "New Zealand" },
  { code: "CHC", city: "Christchurch", country: "New Zealand" },
  { code: "ZQN", city: "Queenstown", country: "New Zealand" },

  // ── Nigeria ────────────────────────────────────────────────────────────────
  { code: "LOS", city: "Lagos", country: "Nigeria" },
  { code: "ABV", city: "Abuja", country: "Nigeria" },
  { code: "KAN", city: "Kano", country: "Nigeria" },

  // ── Norway ─────────────────────────────────────────────────────────────────
  { code: "OSL", city: "Oslo", country: "Norway" },
  { code: "BGO", city: "Bergen", country: "Norway" },
  { code: "TRD", city: "Trondheim", country: "Norway" },
  { code: "TOS", city: "Tromsø", country: "Norway" },

  // ── Oman ───────────────────────────────────────────────────────────────────
  { code: "MCT", city: "Muscat", country: "Oman" },

  // ── Pakistan ───────────────────────────────────────────────────────────────
  { code: "KHI", city: "Karachi", country: "Pakistan" },
  { code: "LHE", city: "Lahore", country: "Pakistan" },
  { code: "ISB", city: "Islamabad", country: "Pakistan" },
  { code: "PEW", city: "Peshawar", country: "Pakistan" },

  // ── Panama ─────────────────────────────────────────────────────────────────
  { code: "PTY", city: "Panama City", country: "Panama" },

  // ── Peru ───────────────────────────────────────────────────────────────────
  { code: "LIM", city: "Lima", country: "Peru" },
  { code: "CUZ", city: "Cusco", country: "Peru" },
  { code: "AQP", city: "Arequipa", country: "Peru" },

  // ── Philippines ────────────────────────────────────────────────────────────
  { code: "MNL", city: "Manila", country: "Philippines" },
  { code: "CEB", city: "Cebu", country: "Philippines" },
  { code: "DVO", city: "Davao", country: "Philippines" },

  // ── Poland ─────────────────────────────────────────────────────────────────
  { code: "WAW", city: "Warsaw", country: "Poland" },
  { code: "KRK", city: "Kraków", country: "Poland" },
  { code: "GDN", city: "Gdańsk", country: "Poland" },
  { code: "WRO", city: "Wrocław", country: "Poland" },

  // ── Portugal ───────────────────────────────────────────────────────────────
  { code: "LIS", city: "Lisbon", country: "Portugal" },
  { code: "OPO", city: "Porto", country: "Portugal" },
  { code: "FNC", city: "Funchal", country: "Portugal" },
  { code: "FAO", city: "Faro", country: "Portugal" },

  // ── Qatar ──────────────────────────────────────────────────────────────────
  { code: "DOH", city: "Doha", country: "Qatar" },

  // ── Romania ────────────────────────────────────────────────────────────────
  { code: "OTP", city: "Bucharest", country: "Romania" },
  { code: "CLJ", city: "Cluj-Napoca", country: "Romania" },
  { code: "TSR", city: "Timișoara", country: "Romania" },

  // ── Russia ─────────────────────────────────────────────────────────────────
  { code: "SVO", city: "Moscow", country: "Russia" },
  { code: "LED", city: "Saint Petersburg", country: "Russia" },
  { code: "OVB", city: "Novosibirsk", country: "Russia" },
  { code: "KZN", city: "Kazan", country: "Russia" },

  // ── Saudi Arabia ───────────────────────────────────────────────────────────
  { code: "RUH", city: "Riyadh", country: "Saudi Arabia" },
  { code: "JED", city: "Jeddah", country: "Saudi Arabia" },
  { code: "DMM", city: "Dammam", country: "Saudi Arabia" },
  { code: "MED", city: "Medina", country: "Saudi Arabia" },

  // ── Senegal ────────────────────────────────────────────────────────────────
  { code: "DSS", city: "Dakar", country: "Senegal" },

  // ── Singapore ──────────────────────────────────────────────────────────────
  { code: "SIN", city: "Singapore", country: "Singapore" },

  // ── Slovakia ───────────────────────────────────────────────────────────────
  { code: "BTS", city: "Bratislava", country: "Slovakia" },
  { code: "KSC", city: "Košice", country: "Slovakia" },

  // ── Slovenia ───────────────────────────────────────────────────────────────
  { code: "LJU", city: "Ljubljana", country: "Slovenia" },

  // ── South Africa ───────────────────────────────────────────────────────────
  { code: "JNB", city: "Johannesburg", country: "South Africa" },
  { code: "CPT", city: "Cape Town", country: "South Africa" },
  { code: "DUR", city: "Durban", country: "South Africa" },
  { code: "PLZ", city: "Port Elizabeth", country: "South Africa" },

  // ── South Korea ────────────────────────────────────────────────────────────
  { code: "ICN", city: "Seoul", country: "South Korea" },
  { code: "PUS", city: "Busan", country: "South Korea" },
  { code: "CJU", city: "Jeju", country: "South Korea" },
  { code: "TAE", city: "Daegu", country: "South Korea" },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { code: "MAD", city: "Madrid", country: "Spain" },
  { code: "BCN", city: "Barcelona", country: "Spain" },
  { code: "AGP", city: "Málaga", country: "Spain" },
  { code: "VLC", city: "Valencia", country: "Spain" },
  { code: "SVQ", city: "Seville", country: "Spain" },
  { code: "LPA", city: "Las Palmas", country: "Spain" },
  { code: "PMI", city: "Palma de Mallorca", country: "Spain" },

  // ── Sri Lanka ──────────────────────────────────────────────────────────────
  { code: "CMB", city: "Colombo", country: "Sri Lanka" },
  { code: "TRR", city: "Trincomalee", country: "Sri Lanka" },

  // ── Sweden ─────────────────────────────────────────────────────────────────
  { code: "ARN", city: "Stockholm", country: "Sweden" },
  { code: "GOT", city: "Gothenburg", country: "Sweden" },
  { code: "MMX", city: "Malmö", country: "Sweden" },

  // ── Switzerland ────────────────────────────────────────────────────────────
  { code: "ZRH", city: "Zurich", country: "Switzerland" },
  { code: "GVA", city: "Geneva", country: "Switzerland" },
  { code: "BSL", city: "Basel", country: "Switzerland" },
  { code: "BRN", city: "Bern", country: "Switzerland" },

  // ── Taiwan ─────────────────────────────────────────────────────────────────
  { code: "TPE", city: "Taipei", country: "Taiwan" },
  { code: "KHH", city: "Kaohsiung", country: "Taiwan" },
  { code: "RMQ", city: "Taichung", country: "Taiwan" },

  // ── Tanzania ───────────────────────────────────────────────────────────────
  { code: "DAR", city: "Dar es Salaam", country: "Tanzania" },
  { code: "JRO", city: "Kilimanjaro", country: "Tanzania" },

  // ── Thailand ───────────────────────────────────────────────────────────────
  { code: "BKK", city: "Bangkok", country: "Thailand" },
  { code: "CNX", city: "Chiang Mai", country: "Thailand" },
  { code: "HKT", city: "Phuket", country: "Thailand" },
  { code: "USM", city: "Koh Samui", country: "Thailand" },
  { code: "DMK", city: "Bangkok (Don Mueang)", country: "Thailand" },

  // ── Trinidad and Tobago ────────────────────────────────────────────────────
  { code: "POS", city: "Port of Spain", country: "Trinidad and Tobago" },

  // ── Turkey ─────────────────────────────────────────────────────────────────
  { code: "IST", city: "Istanbul", country: "Turkey" },
  { code: "ESB", city: "Ankara", country: "Turkey" },
  { code: "ADB", city: "Izmir", country: "Turkey" },
  { code: "AYT", city: "Antalya", country: "Turkey" },
  { code: "DLM", city: "Dalaman", country: "Turkey" },

  // ── UAE ────────────────────────────────────────────────────────────────────
  { code: "DXB", city: "Dubai", country: "UAE" },
  { code: "AUH", city: "Abu Dhabi", country: "UAE" },
  { code: "SHJ", city: "Sharjah", country: "UAE" },

  // ── Uganda ─────────────────────────────────────────────────────────────────
  { code: "EBB", city: "Entebbe", country: "Uganda" },

  // ── Ukraine ────────────────────────────────────────────────────────────────
  { code: "KBP", city: "Kyiv", country: "Ukraine" },
  { code: "ODS", city: "Odesa", country: "Ukraine" },
  { code: "LWO", city: "Lviv", country: "Ukraine" },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  { code: "LHR", city: "London", country: "United Kingdom" },
  { code: "MAN", city: "Manchester", country: "United Kingdom" },
  { code: "EDI", city: "Edinburgh", country: "United Kingdom" },
  { code: "BHX", city: "Birmingham", country: "United Kingdom" },
  { code: "GLA", city: "Glasgow", country: "United Kingdom" },
  { code: "BRS", city: "Bristol", country: "United Kingdom" },
  { code: "LBA", city: "Leeds", country: "United Kingdom" },

  // ── United States ──────────────────────────────────────────────────────────
  { code: "JFK", city: "New York", country: "United States" },
  { code: "LAX", city: "Los Angeles", country: "United States" },
  { code: "ORD", city: "Chicago", country: "United States" },
  { code: "ATL", city: "Atlanta", country: "United States" },
  { code: "DFW", city: "Dallas", country: "United States" },
  { code: "SFO", city: "San Francisco", country: "United States" },
  { code: "SEA", city: "Seattle", country: "United States" },
  { code: "MIA", city: "Miami", country: "United States" },
  { code: "BOS", city: "Boston", country: "United States" },
  { code: "IAD", city: "Washington D.C.", country: "United States" },
  { code: "DEN", city: "Denver", country: "United States" },
  { code: "PHX", city: "Phoenix", country: "United States" },
  { code: "IAH", city: "Houston", country: "United States" },
  { code: "MSP", city: "Minneapolis", country: "United States" },
  { code: "DTW", city: "Detroit", country: "United States" },
  { code: "PHL", city: "Philadelphia", country: "United States" },
  { code: "CLT", city: "Charlotte", country: "United States" },
  { code: "SAN", city: "San Diego", country: "United States" },
  { code: "TPA", city: "Tampa", country: "United States" },
  { code: "PDX", city: "Portland", country: "United States" },
  { code: "HNL", city: "Honolulu", country: "United States" },
  { code: "LAS", city: "Las Vegas", country: "United States" },
  { code: "FLL", city: "Fort Lauderdale", country: "United States" },
  { code: "BWI", city: "Baltimore", country: "United States" },

  // ── Uruguay ────────────────────────────────────────────────────────────────
  { code: "MVD", city: "Montevideo", country: "Uruguay" },
  { code: "PDP", city: "Punta del Este", country: "Uruguay" },

  // ── Uzbekistan ─────────────────────────────────────────────────────────────
  { code: "TAS", city: "Tashkent", country: "Uzbekistan" },

  // ── Vietnam ────────────────────────────────────────────────────────────────
  { code: "SGN", city: "Ho Chi Minh City", country: "Vietnam" },
  { code: "HAN", city: "Hanoi", country: "Vietnam" },
  { code: "DAD", city: "Da Nang", country: "Vietnam" },
  { code: "CXR", city: "Nha Trang", country: "Vietnam" },

  // ── Zimbabwe ───────────────────────────────────────────────────────────────
  { code: "HRE", city: "Harare", country: "Zimbabwe" },
];

// ── Derived exports ──────────────────────────────────────────────────────────

export const COUNTRIES = Array.from(
  new Set(AIRPORTS.map((a) => a.country)),
).sort();

export function getCitiesForCountry(country: string): string[] {
  return AIRPORTS.filter((a) => a.country === country)
    .map((a) => a.city)
    .sort();
}
