// Common makes and models per vehicle type, so a shop picks what a part fits
// instead of typing it. Not exhaustive — the picker has an "Other" option for
// anything missing. Keys match the VEHICLES ids in i18n.js.
export const VEHICLE_CATALOG = {
  TWO_WHEELER: [
    { make: "Hero", models: ["Splendor", "HF Deluxe", "Passion", "Glamour", "Xtreme"] },
    { make: "Honda", models: ["Activa", "Shine", "Unicorn", "Dio", "SP 125"] },
    { make: "Bajaj", models: ["Pulsar", "Platina", "CT 100", "Avenger", "Dominar"] },
    { make: "TVS", models: ["Apache", "Jupiter", "Star City", "XL100", "Ntorq"] },
    { make: "Royal Enfield", models: ["Classic 350", "Bullet 350", "Hunter 350", "Meteor"] },
    { make: "Yamaha", models: ["FZ", "R15", "MT-15", "Fascino"] },
    { make: "Suzuki", models: ["Access", "Gixxer", "Burgman"] },
    { make: "KTM", models: ["Duke 200", "RC 200"] },
  ],
  FOUR_WHEELER: [
    { make: "Maruti Suzuki", models: ["Alto", "WagonR", "Swift", "Dzire", "Baleno", "Ertiga", "Brezza", "Celerio", "Eeco"] },
    { make: "Hyundai", models: ["i10", "i20", "Creta", "Venue", "Verna", "Santro"] },
    { make: "Tata", models: ["Tiago", "Tigor", "Altroz", "Nexon", "Punch", "Harrier", "Safari"] },
    { make: "Mahindra", models: ["Bolero", "Scorpio", "XUV300", "XUV700", "Thar", "Marazzo"] },
    { make: "Honda", models: ["City", "Amaze", "Jazz", "WR-V"] },
    { make: "Toyota", models: ["Innova", "Fortuner", "Etios", "Glanza"] },
    { make: "Kia", models: ["Seltos", "Sonet", "Carens"] },
    { make: "Renault", models: ["Kwid", "Triber", "Duster"] },
    { make: "Ford", models: ["EcoSport", "Figo", "Endeavour"] },
    { make: "Volkswagen", models: ["Polo", "Vento"] },
    { make: "Skoda", models: ["Rapid", "Octavia"] },
  ],
  THREE_WHEELER: [
    { make: "Bajaj", models: ["RE", "Maxima", "Compact"] },
    { make: "Piaggio", models: ["Ape City", "Ape Xtra"] },
    { make: "Mahindra", models: ["Alfa", "Treo"] },
    { make: "TVS", models: ["King"] },
    { make: "Atul", models: ["Gem", "Shakti"] },
  ],
  COMMERCIAL: [
    { make: "Tata", models: ["Ace", "407", "709", "Intra", "Prima"] },
    { make: "Ashok Leyland", models: ["Dost", "Bada Dost", "Boss", "Ecomet"] },
    { make: "Mahindra", models: ["Bolero Pickup", "Jeeto", "Supro"] },
    { make: "Eicher", models: ["Pro 2049", "Pro 3015"] },
    { make: "Maruti Suzuki", models: ["Super Carry"] },
    { make: "BharatBenz", models: ["1015R", "1617R"] },
    { make: "Force", models: ["Traveller"] },
  ],
  EV: [
    { make: "Tata", models: ["Tiago EV", "Nexon EV", "Punch EV"] },
    { make: "MG", models: ["Comet EV", "ZS EV"] },
    { make: "Mahindra", models: ["eVerito", "XUV400"] },
    { make: "Ola Electric", models: ["S1 Pro", "S1 Air"] },
    { make: "Ather", models: ["450X", "Rizta"] },
    { make: "TVS", models: ["iQube"] },
    { make: "Bajaj", models: ["Chetak"] },
    { make: "Hero Electric", models: ["Optima", "Photon"] },
  ],
};

export const makesFor = (category) => VEHICLE_CATALOG[category] || [];
