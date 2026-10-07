/**
 * Master pre-populated administrative divisions of India:
 * States & Union Territories -> Districts -> Major Cities & Towns
 */

export interface DistrictEntry {
  name: string;
  cities: string[];
}

export interface StateEntry {
  state: string;
  code: string;
  districts: DistrictEntry[];
}

export const INDIA_LOCATIONS: StateEntry[] = [
  {
    state: "Maharashtra",
    code: "MH",
    districts: [
      {
        name: "Nagpur",
        cities: ["Nagpur", "Kamptee", "Umred", "Katol", "Ramtek", "Narkhed", "Kalmeshwar", "Saoner"]
      },
      {
        name: "Pune",
        cities: ["Pune", "Pimpri-Chinchwad", "Baramati", "Lonavala", "Daund", "Shirur", "Talegaon Dabhade", "Saswad"]
      },
      {
        name: "Mumbai Suburban",
        cities: ["Andheri", "Bandra", "Borivali", "Goregaon", "Juhu", "Kurla", "Malad", "Mulund", "Powai"]
      },
      {
        name: "Mumbai City",
        cities: ["Colaba", "Dadar", "Fort", "Marine Lines", "Parel", "Worli", "Byculla", "Nariman Point"]
      },
      {
        name: "Thane",
        cities: ["Thane", "Navi Mumbai", "Kalyan-Dombivli", "Mira-Bhayandar", "Ulhasnagar", "Bhiwandi", "Badlapur"]
      },
      {
        name: "Nashik",
        cities: ["Nashik", "Malegaon", "Deolali", "Sinnar", "Yeola", "Manmad", "Igatpuri"]
      },
      {
        name: "Chhatrapati Sambhaji Nagar (Aurangabad)",
        cities: ["Chhatrapati Sambhaji Nagar", "Aurangabad", "Paithan", "Vaijapur", "Gangapur", "Kannad"]
      },
      {
        name: "Amravati",
        cities: ["Amravati", "Achalpur", "Badnera", "Warud", "Morshi", "Anjangaon Surji"]
      },
      {
        name: "Kolhapur",
        cities: ["Kolhapur", "Ichalkaranji", "Jaysingpur", "Kagal", "Gadhinglaj"]
      },
      {
        name: "Solapur",
        cities: ["Solapur", "Pandharpur", "Barshi", "Akkalkot", "Sangola", "Karmala"]
      },
      {
        name: "Akola",
        cities: ["Akola", "Akot", "Balapur", "Murtijapur", "Telhara"]
      },
      {
        name: "Wardha",
        cities: ["Wardha", "Hinganghat", "Arvi", "Deoli", "Pulgaon"]
      },
      {
        name: "Chandrapur",
        cities: ["Chandrapur", "Ballarpur", "Warora", "Rajura", "Bhadravati"]
      },
      {
        name: "Jalgaon",
        cities: ["Jalgaon", "Bhusawal", "Chalisgaon", "Amalner", "Pachora"]
      },
      {
        name: "Satara",
        cities: ["Satara", "Karad", "Wai", "Mahabaleshwar", "Phaltan", "Panchgani"]
      },
      {
        name: "Sangli",
        cities: ["Sangli", "Miraj", "Kupwad", "Islampur", "Vita"]
      },
      {
        name: "Nanded",
        cities: ["Nanded", "Mukhed", "Degloor", "Hadgaon", "Loha"]
      },
      {
        name: "Yavatmal",
        cities: ["Yavatmal", "Pusad", "Umarkhed", "Wani", "Digras"]
      },
      {
        name: "Ahmednagar (Ahilyanagar)",
        cities: ["Ahmednagar", "Shirdi", "Sangamner", "Kopargaon", "Shrirampur"]
      },
      {
        name: "Raigad",
        cities: ["Panvel", "Alibaug", "Karjat", "Khopoli", "Mahad", "Roha"]
      }
    ]
  },
  {
    state: "Delhi (NCT)",
    code: "DL",
    districts: [
      {
        name: "New Delhi",
        cities: ["Connaught Place", "Chanakyapuri", "Barakhamba", "Parliament Street", "Gole Market"]
      },
      {
        name: "Central Delhi",
        cities: ["Karol Bagh", "Pahar Ganj", "Daryaganj", "Rajinder Nagar", "Chandni Chowk"]
      },
      {
        name: "South Delhi",
        cities: ["Hauz Khas", "Saket", "Greater Kailash", "Malviya Nagar", "Mehrauli", "Defence Colony"]
      },
      {
        name: "South West Delhi",
        cities: ["Dwarka", "Vasant Kunj", "Delhi Cantt", "Najafgarh", "Vasant Vihar"]
      },
      {
        name: "West Delhi",
        cities: ["Janakpuri", "Rajouri Garden", "Punjabi Bagh", "Patel Nagar", "Tilak Nagar"]
      },
      {
        name: "North Delhi",
        cities: ["Civil Lines", "Model Town", "Kotwali", "Sadar Bazar", "Kashmere Gate"]
      },
      {
        name: "North West Delhi",
        cities: ["Rohini", "Pitampura", "Shalimar Bagh", "Saraswati Vihar", "Kanjhawala"]
      },
      {
        name: "East Delhi",
        cities: ["Preet Vihar", "Mayur Vihar", "Laxmi Nagar", "Gandhi Nagar", "Shakarpur"]
      }
    ]
  },
  {
    state: "Karnataka",
    code: "KA",
    districts: [
      {
        name: "Bengaluru Urban",
        cities: ["Bengaluru", "Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "Jayanagar", "Electronic City", "Yelahanka"]
      },
      {
        name: "Bengaluru Rural",
        cities: ["Devanahalli", "Doddaballapura", "Hosakote", "Nelamangala"]
      },
      {
        name: "Mysuru",
        cities: ["Mysuru", "Nanjangud", "Hunsur", "T. Narasipura", "K.R. Nagar"]
      },
      {
        name: "Dakshina Kannada (Mangaluru)",
        cities: ["Mangaluru", "Bantwal", "Puttur", "Belthangady", "Sullia"]
      },
      {
        name: "Hubballi-Dharwad",
        cities: ["Hubballi", "Dharwad", "Kundgol", "Navalgund", "Kalghatgi"]
      },
      {
        name: "Belagavi",
        cities: ["Belagavi", "Gokak", "Chikkodi", "Bailhongal", "Athani"]
      },
      {
        name: "Kalaburagi (Gulbarga)",
        cities: ["Kalaburagi", "Sedam", "Chittapur", "Afzalpur", "Aland"]
      },
      {
        name: "Ballari (Bellary)",
        cities: ["Ballari", "Sandur", "Siruguppa", "Kampli"]
      },
      {
        name: "Shivamogga (Shimoga)",
        cities: ["Shivamogga", "Bhadravati", "Sagar", "Shikaripura", "Thirthahalli"]
      },
      {
        name: "Tumakuru (Tumkur)",
        cities: ["Tumakuru", "Tiptur", "Sira", "Madhugiri", "Kunigal"]
      },
      {
        name: "Udupi",
        cities: ["Udupi", "Manipal", "Kundapura", "Karkala", "Kaup"]
      }
    ]
  },
  {
    state: "Gujarat",
    code: "GJ",
    districts: [
      {
        name: "Ahmedabad",
        cities: ["Ahmedabad", "Sanand", "Dholka", "Dhandhuka", "Viramgam", "Bavla"]
      },
      {
        name: "Surat",
        cities: ["Surat", "Bardoli", "Mandvi", "Kamrej", "Olpad", "Palsana"]
      },
      {
        name: "Vadodara",
        cities: ["Vadodara", "Padra", "Dabhoi", "Savli", "Waghodia", "Karjan"]
      },
      {
        name: "Rajkot",
        cities: ["Rajkot", "Gondal", "Jetpur", "Dhoraji", "Upleta", "Morbi"]
      },
      {
        name: "Gandhinagar",
        cities: ["Gandhinagar", "Kalol", "Dehgam", "Mansa"]
      },
      {
        name: "Bhavnagar",
        cities: ["Bhavnagar", "Palitana", "Mahuva", "Sihor", "Talaja"]
      },
      {
        name: "Jamnagar",
        cities: ["Jamnagar", "Dhrol", "Kalavad", "Lalpur", "Jodiya"]
      },
      {
        name: "Anand",
        cities: ["Anand", "Nadiad", "Khambhat", "Petlad", "Borsad", "Umreth"]
      },
      {
        name: "Kutch",
        cities: ["Bhuj", "Gandhidham", "Anjar", "Mandvi", "Mundra"]
      },
      {
        name: "Valsad",
        cities: ["Valsad", "Vapi", "Pardi", "Dharampur", "Umbergaon"]
      }
    ]
  },
  {
    state: "Telangana",
    code: "TG",
    districts: [
      {
        name: "Hyderabad",
        cities: ["Hyderabad", "Secunderabad", "Banjara Hills", "Jubilee Hills", "Charminar", "Gachibowli", "HITEC City", "Kukatpally"]
      },
      {
        name: "Medchal-Malkajgiri",
        cities: ["Medchal", "Malkajgiri", "Alwal", "Kompally", "Uppal", "Ghatkesar"]
      },
      {
        name: "Rangareddy",
        cities: ["Shamshabad", "Rajendranagar", "Serilingampally", "Maheshwaram", "Ibrahimpatnam"]
      },
      {
        name: "Warangal",
        cities: ["Warangal", "Hanamkonda", "Kazipet", "Narsampet", "Wardhannapet"]
      },
      {
        name: "Nizamabad",
        cities: ["Nizamabad", "Bodhan", "Armoor", "Bheemgal"]
      },
      {
        name: "Karimnagar",
        cities: ["Karimnagar", "Huzurabad", "Jammikunta", "Choppadandi"]
      },
      {
        name: "Khammam",
        cities: ["Khammam", "Madhira", "Sathupalli", "Wyra"]
      }
    ]
  },
  {
    state: "Tamil Nadu",
    code: "TN",
    districts: [
      {
        name: "Chennai",
        cities: ["Chennai", "T. Nagar", "Anna Nagar", "Adyar", "Velachery", "Mylapore", "Tambaram", "Guindy"]
      },
      {
        name: "Coimbatore",
        cities: ["Coimbatore", "Pollachi", "Mettupalayam", "Sulur", "Valparai"]
      },
      {
        name: "Madurai",
        cities: ["Madurai", "Melur", "Thirumangalam", "Usilampatti", "Vadipatti"]
      },
      {
        name: "Tiruchirappalli",
        cities: ["Tiruchirappalli", "Srirangam", "Manapparai", "Thuraiyur", "Lalgudi"]
      },
      {
        name: "Salem",
        cities: ["Salem", "Attur", "Mettur", "Edappadi", "Omalur"]
      },
      {
        name: "Tiruppur",
        cities: ["Tiruppur", "Avinashi", "Dharapuram", "Kangeyam", "Udumalaipettai"]
      },
      {
        name: "Erode",
        cities: ["Erode", "Gobichettipalayam", "Bhavani", "Perundurai", "Sathyamangalam"]
      },
      {
        name: "Vellore",
        cities: ["Vellore", "Katpadi", "Gudiyatham", "Anaicut"]
      },
      {
        name: "Kanchipuram",
        cities: ["Kanchipuram", "Sriperumbudur", "Walajabad", "Kundrathur"]
      },
      {
        name: "Chengalpattu",
        cities: ["Chengalpattu", "Tambaram", "Pallavaram", "Maraimalai Nagar", "Mahabalipuram"]
      }
    ]
  },
  {
    state: "Uttar Pradesh",
    code: "UP",
    districts: [
      {
        name: "Lucknow",
        cities: ["Lucknow", "Hazratganj", "Gomti Nagar", "Alambagh", "Indira Nagar", "Malihabad"]
      },
      {
        name: "Gautam Buddha Nagar (Noida)",
        cities: ["Noida", "Greater Noida", "Dadri", "Jewar"]
      },
      {
        name: "Ghaziabad",
        cities: ["Ghaziabad", "Indirapuram", "Vaishali", "Modinagar", "Muradnagar", "Loni"]
      },
      {
        name: "Kanpur Nagar",
        cities: ["Kanpur", "Kalyanpur", "Govind Nagar", "Ghatampur", "Bilhaur"]
      },
      {
        name: "Varanasi",
        cities: ["Varanasi", "Kashi", "Sarnath", "Ramnagar", "Pindra"]
      },
      {
        name: "Agra",
        cities: ["Agra", "Fatehabad", "Kheragarh", "Etmadpur", "Bah"]
      },
      {
        name: "Prayagraj (Allahabad)",
        cities: ["Prayagraj", "Phulpur", "Koraon", "Meja", "Soraon"]
      },
      {
        name: "Meerut",
        cities: ["Meerut", "Sardhana", "Mawana", "Hastinapur"]
      },
      {
        name: "Bareilly",
        cities: ["Bareilly", "Aonla", "Faridpur", "Baheri", "Nawabganj"]
      },
      {
        name: "Gorakhpur",
        cities: ["Gorakhpur", "Sahjanwa", "Chauri Chaura", "Campierganj", "Bansgaon"]
      },
      {
        name: "Aligarh",
        cities: ["Aligarh", "Khair", "Atrauli", "Iglas"]
      },
      {
        name: "Mathura",
        cities: ["Mathura", "Vrindavan", "Goverdhan", "Chhata", "Barsana"]
      }
    ]
  },
  {
    state: "Madhya Pradesh",
    code: "MP",
    districts: [
      {
        name: "Indore",
        cities: ["Indore", "Mhow (Dr. Ambedkar Nagar)", "Sanwer", "Depalpur", "Rau"]
      },
      {
        name: "Bhopal",
        cities: ["Bhopal", "Berasia", "Kolar", "Bairagarh"]
      },
      {
        name: "Jabalpur",
        cities: ["Jabalpur", "Sihora", "Patan", "Panagar", "Majholi"]
      },
      {
        name: "Gwalior",
        cities: ["Gwalior", "Dabra", "Bhitarwar", "Morar"]
      },
      {
        name: "Ujjain",
        cities: ["Ujjain", "Nagda", "Mahidpur", "Tarana", "Khachrod"]
      },
      {
        name: "Sagar",
        cities: ["Sagar", "Bina", "Khurai", "Deori", "Rehli"]
      },
      {
        name: "Dewas",
        cities: ["Dewas", "Sonkatch", "Bagli", "Kannod", "Khategaon"]
      },
      {
        name: "Satna",
        cities: ["Satna", "Maihar", "Nagod", "Amarpatan", "Ramnagar"]
      },
      {
        name: "Ratlam",
        cities: ["Ratlam", "Jaora", "Sailana", "Alot", "Piploda"]
      },
      {
        name: "Rewa",
        cities: ["Rewa", "Mauganj", "Mangawan", "Teonthar", "Sirmaur"]
      }
    ]
  },
  {
    state: "Rajasthan",
    code: "RJ",
    districts: [
      {
        name: "Jaipur",
        cities: ["Jaipur", "Mansarovar", "Malviya Nagar", "Vaishali Nagar", "Amer", "Chomu", "Sanganer"]
      },
      {
        name: "Jodhpur",
        cities: ["Jodhpur", "Piparcity", "Bilara", "Phalodi", "Bhopalgarh"]
      },
      {
        name: "Udaipur",
        cities: ["Udaipur", "Fatehnagar", "Mavli", "Salumbar", "Kherwara"]
      },
      {
        name: "Kota",
        cities: ["Kota", "Ramganj Mandi", "Sangod", "Pipalda"]
      },
      {
        name: "Ajmer",
        cities: ["Ajmer", "Kishangarh", "Beawar", "Nasirabad", "Pushkar"]
      },
      {
        name: "Bikaner",
        cities: ["Bikaner", "Nokha", "Lunkaransar", "Dungargarh", "Kolayat"]
      },
      {
        name: "Alwar",
        cities: ["Alwar", "Bhiwadi", "Tijara", "Neemrana", "Behror", "Rajgarh"]
      },
      {
        name: "Bhilwara",
        cities: ["Bhilwara", "Shahpura", "Mandalgarh", "Asind", "Gulabpura"]
      }
    ]
  },
  {
    state: "West Bengal",
    code: "WB",
    districts: [
      {
        name: "Kolkata",
        cities: ["Kolkata", "Park Street", "Salt Lake", "New Town", "Ballygunge", "Alipore", "Dum Dum"]
      },
      {
        name: "North 24 Parganas",
        cities: ["Barasat", "Barrackpore", "Bidhannagar", "Habra", "Basirhat", "Naihati", "Kanchrapara"]
      },
      {
        name: "South 24 Parganas",
        cities: ["Alipore", "Baruipur", "Sonarpur", "Diamond Harbour", "Canning", "Budge Budge"]
      },
      {
        name: "Howrah",
        cities: ["Howrah", "Bally", "Uluberia", "Amta", "Domjur"]
      },
      {
        name: "Paschim Bardhaman",
        cities: ["Asansol", "Durgapur", "Raniganj", "Kulti", "Jamuria"]
      },
      {
        name: "Darjeeling",
        cities: ["Darjeeling", "Siliguri", "Kurseong", "Mirik"]
      }
    ]
  },
  {
    state: "Kerala",
    code: "KL",
    districts: [
      {
        name: "Ernakulam",
        cities: ["Kochi", "Ernakulam", "Kakkanad", "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha"]
      },
      {
        name: "Thiruvananthapuram",
        cities: ["Thiruvananthapuram", "Neyyattinkara", "Attingal", "Nedumangad", "Varkala"]
      },
      {
        name: "Kozhikode",
        cities: ["Kozhikode", "Vadakara", "Koyilandy", "Feroke", "Ramanattukara"]
      },
      {
        name: "Thrissur",
        cities: ["Thrissur", "Guruvayur", "Chalakudy", "Kodungallur", "Kunnamkulam"]
      },
      {
        name: "Kollam",
        cities: ["Kollam", "Karunagappally", "Paravur", "Punalur", "Kottarakkara"]
      },
      {
        name: "Kannur",
        cities: ["Kannur", "Thalassery", "Payyanur", "Taliparamba", "Mattannur"]
      },
      {
        name: "Kottayam",
        cities: ["Kottayam", "Changanassery", "Pala", "Vaikom", "Ettumanoor"]
      }
    ]
  },
  {
    state: "Punjab",
    code: "PB",
    districts: [
      {
        name: "Ludhiana",
        cities: ["Ludhiana", "Khanna", "Jagraon", "Samrala", "Raikot"]
      },
      {
        name: "Amritsar",
        cities: ["Amritsar", "Ajnala", "Attari", "Majitha", "Rayya"]
      },
      {
        name: "Jalandhar",
        cities: ["Jalandhar", "Nakodar", "Phillaur", "Kartarpur", "Shahkot"]
      },
      {
        name: "SAS Nagar (Mohali)",
        cities: ["Mohali", "Kharar", "Zirakpur", "Dera Bassi", "Kurali"]
      },
      {
        name: "Patiala",
        cities: ["Patiala", "Nabha", "Rajpura", "Samana", "Patran"]
      },
      {
        name: "Bathinda",
        cities: ["Bathinda", "Rampura Phul", "Talwandi Sabo", "Goniana", "Bhucho Mandi"]
      }
    ]
  },
  {
    state: "Haryana",
    code: "HR",
    districts: [
      {
        name: "Gurugram",
        cities: ["Gurugram", "Cyber City", "Sohna", "Pataudi", "Manesar", "Badshahpur"]
      },
      {
        name: "Faridabad",
        cities: ["Faridabad", "Ballabhgarh", "Old Faridabad", "NIT Faridabad", "Tigaon"]
      },
      {
        name: "Panipat",
        cities: ["Panipat", "Samalkha", "Israna", "Madlauda"]
      },
      {
        name: "Ambala",
        cities: ["Ambala", "Ambala Cantt", "Ambala City", "Naraingarh", "Barara"]
      },
      {
        name: "Karnal",
        cities: ["Karnal", "Gharaunda", "Assandh", "Nilokheri", "Indri"]
      },
      {
        name: "Panchkula",
        cities: ["Panchkula", "Kalka", "Pinjore", "Raipur Rani"]
      },
      {
        name: "Sonipat",
        cities: ["Sonipat", "Ganaur", "Gohana", "Kharkhoda", "Kundli"]
      },
      {
        name: "Hisar",
        cities: ["Hisar", "Hansi", "Barwala", "Narnaund"]
      },
      {
        name: "Rohtak",
        cities: ["Rohtak", "Meham", "Sampla", "Kalanaur"]
      }
    ]
  },
  {
    state: "Andhra Pradesh",
    code: "AP",
    districts: [
      {
        name: "Visakhapatnam",
        cities: ["Visakhapatnam", "Gajuwaka", "Anakapalle", "Bheemunipatnam", "Pendurthi"]
      },
      {
        name: "NTR (Vijayawada)",
        cities: ["Vijayawada", "Ibrahimpatnam", "Nandigama", "Jaggayyapeta", "Tiruvuru"]
      },
      {
        name: "Guntur",
        cities: ["Guntur", "Tenali", "Mangalagiri", "Ponnur", "Tadikonda"]
      },
      {
        name: "Tirupati",
        cities: ["Tirupati", "Srikalahasti", "Chandragiri", "Gudur", "Venkatagiri"]
      },
      {
        name: "Kurnool",
        cities: ["Kurnool", "Adoni", "Yemmiganur", "Nandyal", "Dhone"]
      },
      {
        name: "SPSR Nellore",
        cities: ["Nellore", "Kavali", "Gudur", "Atmakur", "Kovur"]
      }
    ]
  },
  {
    state: "Bihar",
    code: "BR",
    districts: [
      {
        name: "Patna",
        cities: ["Patna", "Danapur", "Phulwari Sharif", "Barh", "Mokama", "Fatuha", "Bihta"]
      },
      {
        name: "Gaya",
        cities: ["Gaya", "Bodh Gaya", "Sherghati", "Tekari", "Manpur"]
      },
      {
        name: "Bhagalpur",
        cities: ["Bhagalpur", "Kahalgaon", "Naugachhia", "Sultanganj"]
      },
      {
        name: "Muzaffarpur",
        cities: ["Muzaffarpur", "Kanti", "Motipur", "Sahebganj", "Marwan"]
      },
      {
        name: "Darbhanga",
        cities: ["Darbhanga", "Benipur", "Baheri", "Keoti"]
      },
      {
        name: "Purnia",
        cities: ["Purnia", "Kasba", "Banmankhi", "Dhamdaha"]
      }
    ]
  },
  {
    state: "Goa",
    code: "GA",
    districts: [
      {
        name: "North Goa",
        cities: ["Panaji", "Mapusa", "Calangute", "Candolim", "Bicholim", "Pernem", "Ponda"]
      },
      {
        name: "South Goa",
        cities: ["Margao", "Vasco da Gama", "Curchorem", "Quepem", "Canacona", "Sanguem"]
      }
    ]
  },
  {
    state: "Odisha",
    code: "OR",
    districts: [
      {
        name: "Khordha",
        cities: ["Bhubaneswar", "Khordha", "Jatni", "Banapur", "Balipatna"]
      },
      {
        name: "Cuttack",
        cities: ["Cuttack", "Choudwar", "Athagarh", "Banki", "Salipur"]
      },
      {
        name: "Sundargarh",
        cities: ["Rourkela", "Sundargarh", "Rajgangpur", "Biramitrapur"]
      },
      {
        name: "Puri",
        cities: ["Puri", "Konark", "Pipili", "Nimapada"]
      }
    ]
  },
  {
    state: "Jharkhand",
    code: "JH",
    districts: [
      {
        name: "Ranchi",
        cities: ["Ranchi", "Kanke", "Hatia", "Ormanjhi", "Bundu"]
      },
      {
        name: "East Singhbhum",
        cities: ["Jamshedpur", "Mango", "Jugsalai", "Ghatshila", "Musabani"]
      },
      {
        name: "Dhanbad",
        cities: ["Dhanbad", "Jharia", "Katras", "Sindri", "Nirsa"]
      },
      {
        name: "Bokaro",
        cities: ["Bokaro Steel City", "Chas", "Bermo", "Phusro", "Gomia"]
      }
    ]
  },
  {
    state: "Chhattisgarh",
    code: "CG",
    districts: [
      {
        name: "Raipur",
        cities: ["Raipur", "Nava Raipur", "Birgaon", "Abhanpur", "Tilda"]
      },
      {
        name: "Durg",
        cities: ["Durg", "Bhilai", "Kumhari", "Patan", "Dhamdha"]
      },
      {
        name: "Bilaspur",
        cities: ["Bilaspur", "Kota", "Takhatpur", "Ratanpur", "Bilha"]
      }
    ]
  },
  {
    state: "Uttarakhand",
    code: "UK",
    districts: [
      {
        name: "Dehradun",
        cities: ["Dehradun", "Rishikesh", "Mussoorie", "Vikasnagar", "Doiwala"]
      },
      {
        name: "Haridwar",
        cities: ["Haridwar", "Roorkee", "Laksar", "Manglaur", "Bhagwanpur"]
      },
      {
        name: "Nainital",
        cities: ["Nainital", "Haldwani", "Ramnagar", "Bhimtal", "Kashipur"]
      }
    ]
  },
  {
    state: "Assam",
    code: "AS",
    districts: [
      {
        name: "Kamrup Metropolitan",
        cities: ["Guwahati", "Dispur", "North Guwahati", "Chandrapur", "Sonapur"]
      },
      {
        name: "Dibrugarh",
        cities: ["Dibrugarh", "Chabua", "Naharkatiya", "Moranhat"]
      },
      {
        name: "Cachar",
        cities: ["Silchar", "Lakhipur", "Sonai", "Dholai"]
      }
    ]
  },
  {
    state: "Chandigarh",
    code: "CH",
    districts: [
      {
        name: "Chandigarh",
        cities: ["Chandigarh", "Sector 17", "Sector 35", "Manimajra", "Industrial Area"]
      }
    ]
  }
];

/**
 * Returns all pre-configured state names sorted alphabetically.
 */
export const getAllStates = (): string[] => {
  return INDIA_LOCATIONS.map((s) => s.state).sort();
};

/**
 * Returns all districts for a given state name.
 */
export const getDistrictsForState = (stateName: string): string[] => {
  if (!stateName) return [];
  const found = INDIA_LOCATIONS.find(
    (s) => s.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  if (!found) return [];
  return found.districts.map((d) => d.name).sort();
};

/**
 * Returns cities for a given state and optional district.
 */
export const getCitiesForDistrictOrState = (
  stateName: string,
  districtName?: string
): string[] => {
  if (!stateName) return [];
  const foundState = INDIA_LOCATIONS.find(
    (s) => s.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  if (!foundState) return [];

  if (districtName) {
    const foundDistrict = foundState.districts.find(
      (d) => d.name.toLowerCase() === districtName.trim().toLowerCase()
    );
    if (foundDistrict && foundDistrict.cities.length > 0) {
      return [...foundDistrict.cities].sort();
    }
  }

  // Fallback: return all cities from all districts in this state
  const allCities: string[] = [];
  foundState.districts.forEach((d) => {
    d.cities.forEach((c) => {
      if (!allCities.includes(c)) allCities.push(c);
    });
  });
  return allCities.sort();
};

/**
 * Smart matching for reverse-geocoded or typed location strings.
 * Attempts to resolve State, District, and City from raw strings.
 */
export const matchIndiaLocation = (raw: {
  state?: string;
  district?: string;
  city?: string;
  county?: string;
  address?: string;
}): {
  matchedState?: string;
  matchedDistrict?: string;
  matchedCity?: string;
} => {
  const normalize = (s?: string) => (s ? s.toLowerCase().trim() : "");
  const rawState = normalize(raw.state);
  const rawDistrict = normalize(raw.district || raw.county);
  const rawCity = normalize(raw.city);

  let matchedState: string | undefined;
  let matchedDistrict: string | undefined;
  let matchedCity: string | undefined;

  // 1. Match State
  if (rawState) {
    const stateObj = INDIA_LOCATIONS.find(
      (s) =>
        normalize(s.state) === rawState ||
        normalize(s.state).includes(rawState) ||
        rawState.includes(normalize(s.state))
    );
    if (stateObj) {
      matchedState = stateObj.state;

      // 2. Match District within State
      if (rawDistrict) {
        const distObj = stateObj.districts.find(
          (d) =>
            normalize(d.name) === rawDistrict ||
            rawDistrict.includes(normalize(d.name)) ||
            normalize(d.name).includes(rawDistrict)
        );
        if (distObj) {
          matchedDistrict = distObj.name;

          // 3. Match City within District
          if (rawCity) {
            const cityObj = distObj.cities.find(
              (c) =>
                normalize(c) === rawCity ||
                rawCity.includes(normalize(c)) ||
                normalize(c).includes(rawCity)
            );
            if (cityObj) matchedCity = cityObj;
          }
        }
      }

      // If city still not matched, check entire state
      if (!matchedCity && rawCity) {
        for (const dist of stateObj.districts) {
          const cityObj = dist.cities.find(
            (c) =>
              normalize(c) === rawCity ||
              rawCity.includes(normalize(c)) ||
              normalize(c).includes(rawCity)
          );
          if (cityObj) {
            matchedCity = cityObj;
            if (!matchedDistrict) matchedDistrict = dist.name;
            break;
          }
        }
      }
    }
  }

  // 4. Fallback search across all states if State wasn't given or matched
  if (!matchedState && rawCity) {
    for (const st of INDIA_LOCATIONS) {
      for (const dist of st.districts) {
        const cityObj = dist.cities.find(
          (c) =>
            normalize(c) === rawCity ||
            rawCity.includes(normalize(c)) ||
            normalize(c).includes(rawCity)
        );
        if (cityObj) {
          matchedState = st.state;
          matchedDistrict = dist.name;
          matchedCity = cityObj;
          break;
        }
      }
      if (matchedState) break;
    }
  }

  return {
    matchedState,
    matchedDistrict,
    matchedCity: matchedCity || raw.city,
  };
};
