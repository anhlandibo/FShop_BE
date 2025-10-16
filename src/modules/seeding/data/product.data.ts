import { Product } from "src/modules/products/entities";

export const productSeed: Partial<Product>[] = [
  // =========================
  // MEN
  // =========================

  // Men Shirts (Zara, Uniqlo, H&M)
  {
    name: "Oxford Slim Shirt - White",
    description: "Classic Oxford shirt with button-down collar and slim fit.",
    price: 36.90,
    category: { name: "Men Shirts" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Easy Care Formal Shirt",
    description: "Wrinkle-resistant shirt ideal for office and formal occasions.",
    price: 39.50,
    category: { name: "Men Shirts" } as any,
    brand: { name: "Uniqlo" } as any,
  },
  {
    name: "Cotton Poplin Shirt - Blue",
    description: "Lightweight poplin shirt for everyday smart-casual looks.",
    price: 29.99,
    category: { name: "Men Shirts" } as any,
    brand: { name: "H&M" } as any,
  },

  // Men T-Shirts (Uniqlo, H&M, Adidas)
  {
    name: "Supima Cotton Crewneck Tee",
    description: "Soft-touch Supima cotton T-shirt with a classic silhouette.",
    price: 15.99,
    category: { name: "Men T-Shirts" } as any,
    brand: { name: "Uniqlo" } as any,
  },
  {
    name: "Graphic Print Tee - Retro",
    description: "Bold graphic print tee for a streetwear-inspired style.",
    price: 18.50,
    category: { name: "Men T-Shirts" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Adidas Essentials Tee",
    description: "Lightweight athletic T-shirt for training and daily wear.",
    price: 22.00,
    category: { name: "Men T-Shirts" } as any,
    brand: { name: "Adidas" } as any,
  },

  // Men Jeans (Levi's, H&M, Zara)
  {
    name: "Levi’s 511 Slim Jeans",
    description: "Modern slim fit with stretch denim for all-day comfort.",
    price: 59.90,
    category: { name: "Men Jeans" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Relaxed Fit Denim - Washed",
    description: "Relaxed jeans with washed effect for casual vibes.",
    price: 39.99,
    category: { name: "Men Jeans" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Zara Ripped Skinny Jeans",
    description: "Distressed skinny denim for a contemporary street look.",
    price: 49.95,
    category: { name: "Men Jeans" } as any,
    brand: { name: "Zara" } as any,
  },

  // Men Jackets (Levi's, Zara, H&M)
  {
    name: "Levi’s Trucker Jacket",
    description: "Iconic denim trucker with durable stitching and timeless cut.",
    price: 79.00,
    category: { name: "Men Jackets" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Faux Leather Biker Jacket",
    description: "Biker-inspired jacket with zip closure and quilted panels.",
    price: 69.90,
    category: { name: "Men Jackets" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Lightweight Bomber - Black",
    description: "Versatile bomber jacket with ribbed trims.",
    price: 54.99,
    category: { name: "Men Jackets" } as any,
    brand: { name: "H&M" } as any,
  },

  // Men Shoes (Zara, Adidas, New Balance)
  {
    name: "Leather Derby Shoes",
    description: "Polished leather derbies for office and formal outfits.",
    price: 74.00,
    category: { name: "Men Shoes" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Adidas Court Sneakers",
    description: "Clean tennis-inspired sneakers for daily wear.",
    price: 58.00,
    category: { name: "Men Shoes" } as any,
    brand: { name: "Adidas" } as any,
  },
  {
    name: "New Balance 574 Classic",
    description: "Retro runner silhouette with cushioned midsole.",
    price: 79.00,
    category: { name: "Men Shoes" } as any,
    brand: { name: "New Balance" } as any,
  },

  // =========================
  // WOMEN
  // =========================

  // Women Dresses (Zara, H&M, Uniqlo)
  {
    name: "Floral Midi Dress",
    description: "Flowy floral midi dress with adjustable straps.",
    price: 45.00,
    category: { name: "Women Dresses" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Pleated Chiffon Dress",
    description: "Elegant pleated dress made from soft chiffon.",
    price: 42.00,
    category: { name: "Women Dresses" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Simple Jersey Dress",
    description: "Minimal jersey dress with relaxed fit.",
    price: 29.90,
    category: { name: "Women Dresses" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Women Tops (Zara, H&M, Uniqlo)
  {
    name: "Silk Blend Blouse",
    description: "Refined blouse with soft drape and V-neck.",
    price: 49.99,
    category: { name: "Women Tops" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Ribbed Crop Top",
    description: "Trendy ribbed crop top for casual styling.",
    price: 19.99,
    category: { name: "Women Tops" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Airism Comfort Tee",
    description: "Breathable tee with quick-dry comfort technology.",
    price: 16.90,
    category: { name: "Women Tops" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Women Skirts (Zara, Uniqlo, H&M)
  {
    name: "Pleated Midi Skirt",
    description: "Classic pleated midi with elastic waistband.",
    price: 32.50,
    category: { name: "Women Skirts" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Denim A-Line Skirt",
    description: "A-line denim skirt with front buttons.",
    price: 27.99,
    category: { name: "Women Skirts" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Satin Slip Skirt",
    description: "Satin slip skirt with subtle sheen.",
    price: 35.90,
    category: { name: "Women Skirts" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Women Heels (Zara, H&M, Zara)
  {
    name: "Classic Beige Pumps 7cm",
    description: "Timeless beige pumps with cushioned insole.",
    price: 65.00,
    category: { name: "Women Heels" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Block Heels - Black",
    description: "Comfortable block heels for everyday elegance.",
    price: 58.00,
    category: { name: "Women Heels" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Pointed Toe Heels",
    description: "Sharp pointed toe for a sleek silhouette.",
    price: 62.00,
    category: { name: "Women Heels" } as any,
    brand: { name: "Zara" } as any,
  },

  // Women Bags (Zara, H&M, Uniqlo)
  {
    name: "Mini Shoulder Bag",
    description: "Compact shoulder bag with flap closure.",
    price: 35.00,
    category: { name: "Women Bags" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Tote Bag - Everyday",
    description: "Spacious tote bag for work and shopping.",
    price: 29.99,
    category: { name: "Women Bags" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Nylon Cross Tote",
    description: "Lightweight nylon tote for daily use.",
    price: 26.50,
    category: { name: "Women Bags" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // =========================
  // KIDS
  // =========================

  // Kids T-Shirts (H&M, Nike, Adidas)
  {
    name: "Kids Soft Cotton Tee",
    description: "Comfortable cotton tee with playful print.",
    price: 11.50,
    category: { name: "Kids T-Shirts" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Kids Sports Tee - Nike",
    description: "Light athletic tee for active kids.",
    price: 16.00,
    category: { name: "Kids T-Shirts" } as any,
    brand: { name: "Nike" } as any,
  },
  {
    name: "Kids Logo Tee - Adidas",
    description: "Adidas logo T-shirt in soft jersey.",
    price: 15.00,
    category: { name: "Kids T-Shirts" } as any,
    brand: { name: "Adidas" } as any,
  },

  // Kids Pants (Levi's, H&M, Uniqlo)
  {
    name: "Kids Stretch Denim",
    description: "Stretch denim jeans built for playtime.",
    price: 22.00,
    category: { name: "Kids Pants" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Kids Jogger Pants",
    description: "Soft joggers with elastic cuffs and waistband.",
    price: 17.50,
    category: { name: "Kids Pants" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Kids Ultra Light Pants",
    description: "Lightweight pants for comfort all-day.",
    price: 19.90,
    category: { name: "Kids Pants" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Kids Shoes (Nike, Adidas, New Balance)
  {
    name: "Kids Runner - Nike",
    description: "Breathable mesh upper with cushioned sole.",
    price: 29.90,
    category: { name: "Kids Shoes" } as any,
    brand: { name: "Nike" } as any,
  },
  {
    name: "Kids Court - Adidas",
    description: "Everyday sneakers with grippy outsole.",
    price: 27.00,
    category: { name: "Kids Shoes" } as any,
    brand: { name: "Adidas" } as any,
  },
  {
    name: "Kids 237 - New Balance",
    description: "Retro-inspired runner for kids’ comfort.",
    price: 34.00,
    category: { name: "Kids Shoes" } as any,
    brand: { name: "New Balance" } as any,
  },

  // Kids Jackets (H&M, Uniqlo, Levi's)
  {
    name: "Kids Hoodie Jacket",
    description: "Cozy hoodie with front pockets.",
    price: 24.50,
    category: { name: "Kids Jackets" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Kids Ultra Light Down",
    description: "Warm and lightweight down jacket.",
    price: 39.90,
    category: { name: "Kids Jackets" } as any,
    brand: { name: "Uniqlo" } as any,
  },
  {
    name: "Kids Denim Jacket",
    description: "Durable denim jacket for everyday wear.",
    price: 32.00,
    category: { name: "Kids Jackets" } as any,
    brand: { name: "Levi's" } as any,
  },

  // =========================
  // ACCESSORIES
  // =========================

  // Watches (Zara, H&M, Uniqlo)
  {
    name: "Leather Strap Watch",
    description: "Minimal analog watch with leather strap.",
    price: 49.00,
    category: { name: "Watches" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Metal Mesh Watch",
    description: "Sleek metal mesh bracelet with clean dial.",
    price: 39.99,
    category: { name: "Watches" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Everyday Casual Watch",
    description: "Lightweight casual watch for daily use.",
    price: 35.90,
    category: { name: "Watches" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Sunglasses (H&M, Zara, Converse)
  {
    name: "Aviator Sunglasses",
    description: "Classic aviator frame with UV protection.",
    price: 24.00,
    category: { name: "Sunglasses" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Square Frame Shades",
    description: "Chic square frame sunglasses for modern looks.",
    price: 27.50,
    category: { name: "Sunglasses" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Round Retro Sunglasses",
    description: "Round frames with a retro vibe.",
    price: 22.00,
    category: { name: "Sunglasses" } as any,
    brand: { name: "Converse" } as any,
  },

  // Belts (Levi's, Zara, H&M)
  {
    name: "Levi’s Leather Belt",
    description: "Premium leather belt with metal buckle.",
    price: 29.90,
    category: { name: "Belts" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Reversible Belt - Black/Brown",
    description: "Two-tone reversible belt for versatility.",
    price: 26.00,
    category: { name: "Belts" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Canvas Belt",
    description: "Casual canvas belt with metal tip.",
    price: 18.99,
    category: { name: "Belts" } as any,
    brand: { name: "H&M" } as any,
  },

  // Jewelry (H&M, Zara, Uniqlo)
  {
    name: "Gold-Tone Chain Necklace",
    description: "Delicate chain with polished finish.",
    price: 21.00,
    category: { name: "Jewelry" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Pearl Stud Earrings",
    description: "Minimal pearl studs for elegant looks.",
    price: 19.50,
    category: { name: "Jewelry" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Minimal Ring Set",
    description: "Set of slim rings in matte finish.",
    price: 17.99,
    category: { name: "Jewelry" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // =========================
  // SHOES
  // =========================

  // Sneakers (Nike, Adidas, Converse)
  {
    name: "Nike Air Zoom Runner",
    description: "Lightweight running shoe with responsive cushioning.",
    price: 89.00,
    category: { name: "Sneakers" } as any,
    brand: { name: "Nike" } as any,
  },
  {
    name: "Adidas Court Classic",
    description: "Heritage court silhouette with durable outsole.",
    price: 69.90,
    category: { name: "Sneakers" } as any,
    brand: { name: "Adidas" } as any,
  },
  {
    name: "Converse Chuck Taylor High",
    description: "Iconic canvas high-tops with rubber toe cap.",
    price: 59.00,
    category: { name: "Sneakers" } as any,
    brand: { name: "Converse" } as any,
  },

  // Formal Shoes (Zara, Levi's, H&M)
  {
    name: "Cap-Toe Oxford",
    description: "Polished oxford shoes with cap-toe design.",
    price: 78.00,
    category: { name: "Formal Shoes" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Leather Brogues",
    description: "Classic brogue detailing for refined style.",
    price: 72.00,
    category: { name: "Formal Shoes" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Formal Derby Shoes",
    description: "Derby construction with cushioned insole.",
    price: 64.00,
    category: { name: "Formal Shoes" } as any,
    brand: { name: "H&M" } as any,
  },

  // Sandals (H&M, Zara, Uniqlo)
  {
    name: "Flat Strappy Sandals",
    description: "Minimal straps with comfy footbed.",
    price: 28.00,
    category: { name: "Sandals" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Platform Sandals",
    description: "Trendy platform sole for extra height.",
    price: 35.00,
    category: { name: "Sandals" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Comfort Slide Sandals",
    description: "Cushioned slides for effortless comfort.",
    price: 24.90,
    category: { name: "Sandals" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Boots (Levi's, Zara, H&M)
  {
    name: "Chelsea Boots - Brown",
    description: "Smooth leather Chelsea boots with elastic side panels.",
    price: 88.00,
    category: { name: "Boots" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Lace-Up Work Boots",
    description: "Rugged boots with durable outsole.",
    price: 79.50,
    category: { name: "Boots" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Suede Ankle Boots",
    description: "Soft suede boots with side zip.",
    price: 69.00,
    category: { name: "Boots" } as any,
    brand: { name: "H&M" } as any,
  },

  // =========================
  // BAGS
  // =========================

  // Backpacks (Nike, Adidas, New Balance)
  {
    name: "Nike Everyday Backpack",
    description: "Durable backpack with multiple compartments.",
    price: 39.00,
    category: { name: "Backpacks" } as any,
    brand: { name: "Nike" } as any,
  },
  {
    name: "Adidas Classic Backpack",
    description: "Lightweight pack with side pockets.",
    price: 32.00,
    category: { name: "Backpacks" } as any,
    brand: { name: "Adidas" } as any,
  },
  {
    name: "NB Heritage Backpack",
    description: "Retro-inspired backpack with padded straps.",
    price: 35.50,
    category: { name: "Backpacks" } as any,
    brand: { name: "New Balance" } as any,
  },

  // Handbags (Zara, H&M, Uniqlo)
  {
    name: "Structured Handbag",
    description: "Firm structure with top handle and detachable strap.",
    price: 59.00,
    category: { name: "Handbags" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Soft Tote Handbag",
    description: "Soft tote with magnetic closure.",
    price: 45.00,
    category: { name: "Handbags" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Minimal Shoulder Handbag",
    description: "Understated shoulder bag with clean lines.",
    price: 49.90,
    category: { name: "Handbags" } as any,
    brand: { name: "Uniqlo" } as any,
  },

  // Crossbody Bags (Zara, H&M, Levi's)
  {
    name: "Compact Crossbody - Black",
    description: "Compact size with inner zip pocket.",
    price: 35.90,
    category: { name: "Crossbody Bags" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Quilted Crossbody",
    description: "Quilted texture with chain strap.",
    price: 33.00,
    category: { name: "Crossbody Bags" } as any,
    brand: { name: "H&M" } as any,
  },
  {
    name: "Levi’s Crossbody Pouch",
    description: "Durable pouch with iconic branding.",
    price: 38.00,
    category: { name: "Crossbody Bags" } as any,
    brand: { name: "Levi's" } as any,
  },

  // Wallets (Levi's, Zara, H&M)
  {
    name: "Levi’s Leather Wallet",
    description: "Classic bifold wallet in genuine leather.",
    price: 29.00,
    category: { name: "Wallets" } as any,
    brand: { name: "Levi's" } as any,
  },
  {
    name: "Slim Card Holder",
    description: "Minimal card holder for essential cards.",
    price: 19.99,
    category: { name: "Wallets" } as any,
    brand: { name: "Zara" } as any,
  },
  {
    name: "Zip-Around Wallet",
    description: "Secure zip-around design with multiple slots.",
    price: 24.50,
    category: { name: "Wallets" } as any,
    brand: { name: "H&M" } as any,
  },

  
];