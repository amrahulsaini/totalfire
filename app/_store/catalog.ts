export type StoreCategory =
  | "Peripherals"
  | "Streaming"
  | "Furniture"
  | "Merch"
  | "Digital";

export interface StoreProduct {
  slug: string;
  name: string;
  category: StoreCategory;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  stock: number;
  badge?: string;
  heroLabel: string;
  shortDescription: string;
  description: string;
  features: string[];
  specs: string[];
  imageUrl: string;
}

export const storeProducts: StoreProduct[] = [
  {
    slug: "ignition-pro-75-keyboard",
    name: "Ignition Pro 75 Mechanical Keyboard",
    category: "Peripherals",
    price: 6999,
    mrp: 8999,
    rating: 4.8,
    reviews: 1820,
    stock: 42,
    badge: "Best Seller",
    heroLabel: "Rapid Trigger",
    shortDescription: "Tournament-grade 75% board with hot-swap sockets and low-latency firmware.",
    description: "Built for clutch moments, Ignition Pro 75 combines tactile stability with rapid actuation. The gasket-mounted chassis absorbs vibration while per-key tuning keeps movement crisp in BR and CS endgames.",
    features: [
      "0.1 ms response firmware",
      "South-facing RGB with 18 effects",
      "Three profile memory with onboard macro recording",
      "PBT fireproof-texture keycaps",
    ],
    specs: [
      "Layout: 75% ANSI",
      "Connection: Wired Type-C",
      "Switch Support: 3-pin/5-pin hot swap",
      "Weight: 1.1 kg",
    ],
    imageUrl: "/new-frontned/keyboard-only.png",
  },
  {
    slug: "ember-x3-wireless-mouse",
    name: "Ember X3 Wireless Esports Mouse",
    category: "Peripherals",
    price: 3999,
    mrp: 5499,
    rating: 4.7,
    reviews: 1360,
    stock: 67,
    badge: "Top Rated",
    heroLabel: "59g Ultra Light",
    shortDescription: "Precision sensor tuned for flick-heavy battle royale and arena duels.",
    description: "The Ember X3 is tuned for control under pressure. With tri-mode support and high-polling wireless, it balances long-session comfort with tight tracking and recoil consistency.",
    features: [
      "PAW3395 flagship sensor",
      "Up to 26,000 DPI tracking",
      "2.4 GHz + Bluetooth + USB-C wired",
      "95 hour battery life",
    ],
    specs: [
      "Weight: 59 g",
      "Switches: TTC Gold 80M",
      "Polling: 1K default, 4K optional dongle",
      "Feet: PTFE skates",
    ],
    imageUrl: "/new-frontned/mouse-only.png",
  },
  {
    slug: "pro-bundle-keyboard-mouse",
    name: "Pro Bundle: Keyboard & Mouse",
    category: "Peripherals",
    price: 9999,
    mrp: 13999,
    rating: 4.9,
    reviews: 2140,
    stock: 120,
    badge: "Value Pack",
    heroLabel: "Ultimate Duo",
    shortDescription: "Combined forces of our Ignition Pro 75 and Ember X3 at a heavy discount.",
    description: "Gear up instantly with our top-tier peripherals combined into the ultimate bundle. Get the precision of the Ember X3 and the rapid actuation of the Ignition Pro 75.",
    features: [
      "0.1 ms response firmware keyboard",
      "PAW3395 flagship sensor mouse",
      "Synchronized RGB effects",
      "Unified software control",
    ],
    specs: [
      "Layout: 75% ANSI",
      "Mouse Weight: 59 g",
      "Connection: Wired & Wireless",
      "Compatibility: PC, Mac, Linux",
    ],
    imageUrl: "/new-frontned/keyboard+mouse.png",
  },
  {
    slug: "phoenix-7-1-headset",
    name: "Phoenix 7.1 Tournament Headset",
    category: "Peripherals",
    price: 4599,
    mrp: 6299,
    rating: 4.5,
    reviews: 1135,
    stock: 58,
    badge: "Limited Drop",
    heroLabel: "Spatial Audio",
    shortDescription: "Immersive directional audio for footsteps, utility cues, and comms clarity.",
    description: "Phoenix 7.1 brings tuned virtual surround and an anti-clipping boom mic so your squad calls stay audible in chaotic circles. Balanced for marathon scrim nights.",
    features: [
      "50 mm neodymium drivers",
      "Detachable broadcast-grade mic",
      "ENC voice isolation",
      "Memory foam ear cushions",
    ],
    specs: [
      "Connection: USB + 3.5 mm",
      "Frequency Response: 20 Hz - 20 kHz",
      "Mic Pickup: Cardioid",
      "Weight: 295 g",
    ],
    imageUrl: "/new-frontned/headset-onlyh.png",
  },
  {
    slug: "signalforge-stream-mic",
    name: "SignalForge USB Streaming Mic",
    category: "Streaming",
    price: 5799,
    mrp: 7499,
    rating: 4.7,
    reviews: 520,
    stock: 29,
    heroLabel: "Studio Voice",
    shortDescription: "Content-grade microphone for streamers, casters, and post-match creators.",
    description: "SignalForge delivers rich vocal capture with low self-noise and direct monitor support. Ideal for highlight commentary, community casts, and creator collabs.",
    features: [
      "24-bit/96kHz capture",
      "Cardioid and omnidirectional modes",
      "Tap-to-mute touch plate",
      "Integrated shock mount",
    ],
    specs: [
      "Output: USB-C",
      "Monitoring: 3.5 mm jack",
      "Controls: Gain, pattern, mute",
      "Mount: Boom-arm compatible",
    ],
    imageUrl: "/new-frontned/mic-only.png",
  },
  {
    slug: "fireline-pro-jersey",
    name: "Fireline Pro Match Jersey",
    category: "Merch",
    price: 1899,
    mrp: 2499,
    rating: 4.6,
    reviews: 870,
    stock: 210,
    badge: "New Arrival",
    heroLabel: "Team Drop",
    shortDescription: "Lightweight esports jersey inspired by TotalFire arena kits.",
    description: "The Fireline Pro Jersey uses breathable moisture-wick fabric and reinforced seams for intense LAN and online sessions. Designed around TotalFire signature colorways.",
    features: [
      "Breathable mesh panels",
      "Sublimation print that resists fade",
      "Athletic fit with stretch",
      "Available in XS to XXL",
    ],
    specs: [
      "Material: Polyester blend",
      "Fit: Athletic regular",
      "Wash: Machine cold",
      "Origin: India",
    ],
    imageUrl: "/new-frontned/player-id-tshirt.png",
  },
  {
    slug: "ergo-x1-gaming-chair",
    name: "Ergo X1 Gaming Chair",
    category: "Furniture",
    price: 14999,
    mrp: 18999,
    rating: 4.8,
    reviews: 430,
    stock: 15,
    heroLabel: "Posture Perfect",
    shortDescription: "Premium ergonomic support for marathon gaming sessions and deep focus.",
    description: "Engineered for spine alignment and cooling comfort. Features a 4D armrest setup and magnetic memory foam pillows, ensuring absolute stability.",
    features: [
      "Class 4 gas lift",
      "4D adjustable armrests",
      "Magnetic neck and lumbar pillows",
      "165-degree recline",
    ],
    specs: [
      "Material: Premium PU Leather",
      "Base: Aluminum Alloy",
      "Max weight: 150 kg",
      "Warranty: 3 years",
    ],
    imageUrl: "/new-frontned/chair.png",
  }
];

export const formatINR = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getProductBySlug = (slug: string) => {
  return storeProducts.find((p) => p.slug === slug);
};

export const getRelatedProducts = (slug: string, limit = 3) => {
  const current = getProductBySlug(slug);
  if (!current) return [];
  return storeProducts
    .filter((p) => p.category === current.category && p.slug !== slug)
    .slice(0, limit);
};

export const storeCategories = [
  ...Array.from(new Set(storeProducts.map((p) => p.category))),
];

export const complianceHighlights = [
  { icon: "ShieldCheck", label: "Secure Payment" },
  { icon: "Truck", label: "Fast Shipping" },
  { icon: "RefreshCw", label: "7-Day Returns" },
];

export const storefrontStats = [
  { label: "Happy Gamers", value: "50K+" },
  { label: "Products Sold", value: "100K+" },
];

