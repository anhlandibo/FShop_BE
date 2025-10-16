import { Category } from "src/modules/categories/entities/category.entity";

export type CategorySeedItem = Partial<Category> & {
  departmentKey: | "Men" | "Women" | "Kids" | "Accessories" | "Shoes" | "Bags";
};

export const categorySeed: CategorySeedItem[] = [
  // 🧍 MEN
  {
    name: "Men Shirts",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278541/men-shoes_tbn1bl.png",
    publicId: "cat_men_shirts",
    description: "Formal and casual shirts for every occasion.",
    departmentKey: "Men",
  },
  {
    name: "Men T-Shirts",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278543/men-t-shirts_fxw7h7.png",
    publicId: "cat_men_tshirts",
    description: "Graphic and basic T-shirts for men.",
    departmentKey: "Men",
  },
  {
    name: "Men Jeans",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278537/men-jeans_p5qegq.png",
    publicId: "cat_men_jeans",
    description: "Denim jeans in slim, straight, and relaxed fits.",
    departmentKey: "Men",
  },
  {
    name: "Men Jackets",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278513/men-jacket_ahq1u9.png",
    publicId: "cat_men_jackets",
    description: "Stylish jackets and outerwear for men.",
    departmentKey: "Men",
  },
  {
    name: "Men Shoes",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278541/men-shoes_tbn1bl.png",
    publicId: "cat_men_shoes",
    description: "Leather shoes and sneakers for men.",
    departmentKey: "Men",
  },

  // 👩 WOMEN
  {
    name: "Women Dresses",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278611/dress_jieciu.png",
    publicId: "cat_women_dresses",
    description: "Elegant and trendy dresses for women.",
    departmentKey: "Women",
  },
  {
    name: "Women Tops",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278623/tops_drkxin.png",
    publicId: "cat_women_tops",
    description: "Chic tops, blouses, and shirts for women.",
    departmentKey: "Women",
  },
  {
    name: "Women Skirts",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278620/skirts_qxg97d.png",
    publicId: "cat_women_skirts",
    description: "Mini, midi, and maxi skirts.",
    departmentKey: "Women",
  },
  {
    name: "Women Heels",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278619/heels_p1szkx.png",
    publicId: "cat_women_heels",
    description: "High heels and pumps for formal and casual wear.",
    departmentKey: "Women",
  },
  {
    name: "Women Bags",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278610/bags_dw6vws.png",
    publicId: "cat_women_bags",
    description: "Handbags, totes, and crossbody bags for women.",
    departmentKey: "Women",
  },

  // 👧 KIDS
  {
    name: "Kids T-Shirts",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278722/t-shirts_az0m1m.png",
    publicId: "cat_kids_tshirts",
    description: "Colorful and comfortable T-shirts for kids.",
    departmentKey: "Kids",
  },
  {
    name: "Kids Pants",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278717/pants_t0osmv.png",
    publicId: "cat_kids_pants",
    description: "Durable jeans and trousers for kids.",
    departmentKey: "Kids",
  },
  {
    name: "Kids Shoes",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278726/shoes_wsfz84.png",
    publicId: "cat_kids_shoes",
    description: "Shoes designed for comfort and play.",
    departmentKey: "Kids",
  },
  {
    name: "Kids Jackets",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278716/jacket_pst1b0.png",
    publicId: "cat_kids_jackets",
    description: "Cozy jackets and hoodies for kids.",
    departmentKey: "Kids",
  },

  // 🕶️ ACCESSORIES
  {
    name: "Watches",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278771/watch_zdnijm.png",
    publicId: "cat_accessories_watches",
    description: "Stylish wristwatches for men and women.",
    departmentKey: "Accessories",
  },
  {
    name: "Sunglasses",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278771/sun-glasses_vwopx7.png",
    publicId: "cat_accessories_sunglasses",
    description: "Modern and classic sunglasses for all styles.",
    departmentKey: "Accessories",
  },
  {
    name: "Belts",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278768/belt_rglmr3.png",
    publicId: "cat_accessories_belts",
    description: "Premium leather and fabric belts.",
    departmentKey: "Accessories",
  },
  {
    name: "Jewelry",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278770/jelwery_sjmhin.png",
    publicId: "cat_accessories_jewelry",
    description: "Rings, necklaces, and earrings to complete your look.",
    departmentKey: "Accessories",
  },

  // 👟 SHOES
  {
    name: "Sneakers",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278836/sneakers_thx4kc.png",
    publicId: "cat_shoes_sneakers",
    description: "Everyday sneakers for comfort and style.",
    departmentKey: "Shoes",
  },
  {
    name: "Formal Shoes",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278830/formal-shoes_vv14kk.png",
    publicId: "cat_shoes_formal",
    description: "Polished formal shoes for men and women.",
    departmentKey: "Shoes",
  },
  {
    name: "Sandals",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278835/sandals_qfakrb.png",
    publicId: "cat_shoes_sandals",
    description: "Casual sandals for summer days.",
    departmentKey: "Shoes",
  },
  {
    name: "Boots",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278828/boots_kfidal.png",
    publicId: "cat_shoes_boots",
    description: "Durable and fashionable boots for all seasons.",
    departmentKey: "Shoes",
  },

  // 👜 BAGS
  {
    name: "Backpacks",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278886/backpacks_ebyo18.png",
    publicId: "cat_bags_backpacks",
    description: "Functional and trendy backpacks for daily use.",
    departmentKey: "Bags",
  },
  {
    name: "Handbags",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278886/handbag_oak2qd.png",
    publicId: "cat_bags_handbags",
    description: "Elegant handbags and totes for women.",
    departmentKey: "Bags",
  },
  {
    name: "Crossbody Bags",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278885/crossbody-bag_nrx4l1.png",
    publicId: "cat_bags_crossbody",
    description: "Compact crossbody bags for travel and style.",
    departmentKey: "Bags",
  },
  {
    name: "Wallets",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760278888/wallet_r7l9ks.png",
    publicId: "cat_bags_wallets",
    description: "Stylish wallets and purses made from premium leather.",
    departmentKey: "Bags",
  },
];