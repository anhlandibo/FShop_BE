import { AttributeCategory } from "src/modules/attributes/entities/attribute-category.entity";
import { Attribute } from "src/modules/attributes/entities/attribute.entity";

/** ---------- ATTRIBUTE MASTER ---------- */
export const attributeSeed: Partial<Attribute>[] = [
  { name: "Size", isActive: true },
  { name: "Color", isActive: true },
  { name: "Material", isActive: true },
  { name: "Style", isActive: true },
  { name: "Fit", isActive: true },
  { name: "Length", isActive: true },
  { name: "Heel Height", isActive: true },
];

/** ---------- ATTRIBUTE BY CATEGORY ---------- */
export type AttributeCategorySeedItem = Partial<AttributeCategory> & {
  categoryKey: string;
  attributeKey: string;
};

export const attributeCategorySeed: AttributeCategorySeedItem[] = [
  // 🧍 MEN
  { categoryKey: "Men Shirts", attributeKey: "Size", value: "S,M,L,XL" },
  { categoryKey: "Men Shirts", attributeKey: "Color", value: "White,Blue,Black,Gray" },
  { categoryKey: "Men Shirts", attributeKey: "Fit", value: "Regular,Slim,Loose" },

  { categoryKey: "Men T-Shirts", attributeKey: "Size", value: "S,M,L,XL" },
  { categoryKey: "Men T-Shirts", attributeKey: "Color", value: "Black,White,Gray,Red" },
  { categoryKey: "Men T-Shirts", attributeKey: "Style", value: "Round Neck,V-Neck,Polo" },

  { categoryKey: "Men Jeans", attributeKey: "Size", value: "28,30,32,34,36" },
  { categoryKey: "Men Jeans", attributeKey: "Fit", value: "Slim,Regular,Relaxed" },
  { categoryKey: "Men Jeans", attributeKey: "Color", value: "Blue,Dark Blue,Black" },

  { categoryKey: "Men Jackets", attributeKey: "Size", value: "S,M,L,XL" },
  { categoryKey: "Men Jackets", attributeKey: "Material", value: "Leather,Denim,Polyester" },
  { categoryKey: "Men Jackets", attributeKey: "Color", value: "Black,Brown,Gray" },

  { categoryKey: "Men Shoes", attributeKey: "Size", value: "39,40,41,42,43,44" },
  { categoryKey: "Men Shoes", attributeKey: "Color", value: "Black,Brown,White" },
  { categoryKey: "Men Shoes", attributeKey: "Material", value: "Leather,Mesh,Synthetic" },

  // 👩 WOMEN
  { categoryKey: "Women Dresses", attributeKey: "Size", value: "XS,S,M,L,XL" },
  { categoryKey: "Women Dresses", attributeKey: "Color", value: "Black,Red,Blue,White,Beige" },
  { categoryKey: "Women Dresses", attributeKey: "Length", value: "Mini,Midi,Maxi" },

  { categoryKey: "Women Tops", attributeKey: "Size", value: "XS,S,M,L,XL" },
  { categoryKey: "Women Tops", attributeKey: "Color", value: "White,Beige,Pink,Blue" },
  { categoryKey: "Women Tops", attributeKey: "Style", value: "Casual,Formal,Crop" },

  { categoryKey: "Women Skirts", attributeKey: "Size", value: "XS,S,M,L,XL" },
  { categoryKey: "Women Skirts", attributeKey: "Length", value: "Mini,Midi,Maxi" },
  { categoryKey: "Women Skirts", attributeKey: "Color", value: "Black,Blue,Beige" },

  { categoryKey: "Women Heels", attributeKey: "Size", value: "35,36,37,38,39,40" },
  { categoryKey: "Women Heels", attributeKey: "Color", value: "Black,Beige,Red,White" },
  { categoryKey: "Women Heels", attributeKey: "Heel Height", value: "5cm,7cm,9cm" },

  { categoryKey: "Women Bags", attributeKey: "Color", value: "Black,Brown,Beige,Red" },
  { categoryKey: "Women Bags", attributeKey: "Material", value: "Leather,Canvas,PU" },
  { categoryKey: "Women Bags", attributeKey: "Style", value: "Tote,Crossbody,Shoulder" },

  // 👧 KIDS
  { categoryKey: "Kids T-Shirts", attributeKey: "Size", value: "2Y,4Y,6Y,8Y,10Y" },
  { categoryKey: "Kids T-Shirts", attributeKey: "Color", value: "Blue,Red,Yellow,Green" },

  { categoryKey: "Kids Pants", attributeKey: "Size", value: "2Y,4Y,6Y,8Y,10Y" },
  { categoryKey: "Kids Pants", attributeKey: "Color", value: "Blue,Gray,Black" },

  { categoryKey: "Kids Shoes", attributeKey: "Size", value: "28,30,32,34,36" },
  { categoryKey: "Kids Shoes", attributeKey: "Color", value: "White,Blue,Pink,Black" },

  { categoryKey: "Kids Jackets", attributeKey: "Size", value: "2Y,4Y,6Y,8Y,10Y" },
  { categoryKey: "Kids Jackets", attributeKey: "Material", value: "Cotton,Wool,Polyester" },

  // 🕶️ ACCESSORIES
  { categoryKey: "Watches", attributeKey: "Material", value: "Leather,Metal,Silicone" },
  { categoryKey: "Watches", attributeKey: "Color", value: "Black,Silver,Gold,Brown" },

  { categoryKey: "Sunglasses", attributeKey: "Style", value: "Aviator,Square,Round" },
  { categoryKey: "Sunglasses", attributeKey: "Color", value: "Black,Brown,Gray" },

  { categoryKey: "Belts", attributeKey: "Length", value: "90,100,110,120" },
  { categoryKey: "Belts", attributeKey: "Color", value: "Black,Brown,Beige" },
  { categoryKey: "Belts", attributeKey: "Material", value: "Leather,Canvas,Fabric" },

  { categoryKey: "Jewelry", attributeKey: "Material", value: "Gold,Silver,Rose Gold" },
  { categoryKey: "Jewelry", attributeKey: "Style", value: "Minimal,Classic,Statement" },

  // 👟 SHOES
  { categoryKey: "Sneakers", attributeKey: "Size", value: "38,39,40,41,42,43,44" },
  { categoryKey: "Sneakers", attributeKey: "Color", value: "White,Black,Gray,Blue" },

  { categoryKey: "Formal Shoes", attributeKey: "Size", value: "39,40,41,42,43,44" },
  { categoryKey: "Formal Shoes", attributeKey: "Color", value: "Black,Brown,Beige" },
  { categoryKey: "Formal Shoes", attributeKey: "Material", value: "Leather,Patent" },

  { categoryKey: "Sandals", attributeKey: "Size", value: "36,37,38,39,40,41" },
  { categoryKey: "Sandals", attributeKey: "Color", value: "Beige,White,Black" },

  { categoryKey: "Boots", attributeKey: "Size", value: "36,37,38,39,40,41" },
  { categoryKey: "Boots", attributeKey: "Color", value: "Brown,Black,Beige" },
  { categoryKey: "Boots", attributeKey: "Material", value: "Leather,Suede" },

  // 👜 BAGS
  { categoryKey: "Backpacks", attributeKey: "Material", value: "Canvas,Leather,Polyester" },
  { categoryKey: "Backpacks", attributeKey: "Color", value: "Black,Gray,Navy,Beige" },

  { categoryKey: "Handbags", attributeKey: "Material", value: "Leather,PU" },
  { categoryKey: "Handbags", attributeKey: "Color", value: "Black,Red,Brown,Beige" },

  { categoryKey: "Crossbody Bags", attributeKey: "Material", value: "Canvas,Leather" },
  { categoryKey: "Crossbody Bags", attributeKey: "Color", value: "Black,Gray,Beige" },

  { categoryKey: "Wallets", attributeKey: "Material", value: "Leather,Fabric" },
  { categoryKey: "Wallets", attributeKey: "Color", value: "Black,Brown,Gray" },
];
