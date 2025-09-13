import { Role } from "src/constants/role.enum";
import { Brand } from "src/modules/brands/entities/brand.entity";
import { Category } from "src/modules/categories/entities/category.entity";
import { User } from "../users/entities/user.entity";
import { ProductImage } from "../products/entities/product-image.entity";
import { ProductVariant } from "../products/entities/product-variant.entity";
import { Product } from "../products/entities/product.entity";

export const brandSeed: Partial<Brand>[] = [
  {
    name: "Nike",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
    publicId: "brand_nike",
    description: "Nike – global sportswear and footwear brand.",
  },
  {
    name: "Adidas",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg",
    publicId: "brand_adidas",
    description: "Adidas – sportswear and fashion brand from Germany.",
  },
  {
    name: "Puma",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Puma_Logo.svg",
    publicId: "brand_puma",
    description: "Puma – popular German athletic and casual footwear brand.",
  },
  {
    name: "Zara",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg",
    publicId: "brand_zara",
    description: "Zara – Spanish fast-fashion retailer.",
  },
  {
    name: "H&M",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg",
    publicId: "brand_hm",
    description: "H&M – Swedish multinational clothing-retail company.",
  },
  {
    name: "Uniqlo",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Uniqlo_logo_Japanese.svg",
    publicId: "brand_uniqlo",
    description: "Uniqlo – Japanese casual wear designer and retailer.",
  },
  {
    name: "Gucci",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Gucci_Logo.svg",
    publicId: "brand_gucci",
    description: "Gucci – Italian luxury fashion house.",
  },
  {
    name: "Louis Vuitton",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Louis_Vuitton_Logo_and_wordmark.svg",
    publicId: "brand_lv",
    description: "Louis Vuitton – French luxury fashion brand.",
  },
];

export const categorySeed: Partial<Category>[] = [
  {
    name: "Men",
    imageUrl: "https://images.unsplash.com/photo-1528701800489-20be9c1a02e3?w=800",
    publicId: "cat_men",
    description: "Men's fashion",
    parentId: null,
  },
  {
    name: "Women",
    imageUrl: "https://images.unsplash.com/photo-1520975922071-a6a9e06f7f33?w=800",
    publicId: "cat_women",
    description: "Women's fashion",
    parentId: null,
  },
  {
    name: "Kids",
    imageUrl: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800",
    publicId: "cat_kids",
    description: "Kids fashion",
    parentId: null,
  },
  // Men subcategories
  {
    name: "Shirts",
    imageUrl: "https://images.unsplash.com/photo-1520975695917-58a6d1e4e6e0?w=800",
    publicId: "cat_men_shirts",
    description: "Men's shirts",
    parentId: 1,
  },
  {
    name: "T-Shirts",
    imageUrl: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800",
    publicId: "cat_men_tshirts",
    description: "Men's T-shirts",
    parentId: 1,
  },
  {
    name: "Jeans",
    imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
    publicId: "cat_men_jeans",
    description: "Men's jeans",
    parentId: 1,
  },
  // Women subcategories
  {
    name: "Dresses",
    imageUrl: "https://images.unsplash.com/photo-1520975732215-7c7e2dbe4a1d?w=800",
    publicId: "cat_women_dresses",
    description: "Women's dresses",
    parentId: 2,
  },
  {
    name: "Skirts",
    imageUrl: "https://images.unsplash.com/photo-1602810318383-ea5a94f5f7cf?w=800",
    publicId: "cat_women_skirts",
    description: "Women's skirts",
    parentId: 2,
  },
  {
    name: "Handbags",
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    publicId: "cat_women_handbags",
    description: "Women's handbags",
    parentId: 2,
  },
  // Kids subcategories
  {
    name: "T-Shirts Kids",
    imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800",
    publicId: "cat_kids_tshirts",
    description: "Kids' T-shirts",
    parentId: 3,
  },
  {
    name: "Shoes Kids",
    imageUrl: "https://images.unsplash.com/photo-1606813902798-5a7219bbd8e9?w=800",
    publicId: "cat_kids_shoes",
    description: "Kids' shoes",
    parentId: 3,
  },
];

export const userSeed: Partial<User>[] = [
  {
    fullName: "Admin User",
    email: "admin@example.com",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    publicId: "user_admin",
    role: Role.Admin,
  },
  {
    fullName: "John Doe",
    email: "john@example.com",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    publicId: "user_john",
    role: Role.User,
  },
  {
    fullName: "Jane Smith",
    email: "jane@example.com",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    publicId: "user_jane",
    role: Role.User,
  },
  {
    fullName: "Michael Brown",
    email: "michael@example.com",
    password: "123456",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    publicId: "user_michael",
    role: Role.User,
  },
];

export const productSeed: Partial<Product>[] = [
  {
    id: 1,
    name: 'Nike Air Force 1',
    description: 'Classic basketball-inspired sneakers with a timeless design.',
    price: 120.0,
    brand: { id: 1 } as any, // Nike
    category: { id: 3 } as any, // Shoes
    isActive: true,
  },
  {
    id: 2,
    name: 'Nike Dunk Low Retro',
    description: 'Low-top sneakers with bold colors and premium leather.',
    price: 130.0,
    brand: { id: 1 } as any,
    category: { id: 3 } as any,
    isActive: true,
  },
  {
    id: 3,
    name: 'Adidas Ultraboost',
    description: 'Running shoes with Boost cushioning for ultimate comfort.',
    price: 180.0,
    brand: { id: 2 } as any,
    category: { id: 3 } as any,
    isActive: true,
  },
  {
    id: 4,
    name: 'Adidas Samba Classic',
    description: 'Iconic indoor soccer shoes with retro vibes.',
    price: 95.0,
    brand: { id: 2 } as any,
    category: { id: 3 } as any,
    isActive: true,
  },
  {
    id: 5,
    name: 'Levi’s 501 Original Jeans',
    description: 'Iconic straight-fit jeans with a classic style.',
    price: 90.0,
    brand: { id: 3 } as any,
    category: { id: 4 } as any, // Pants
    isActive: true,
  },
  {
    id: 6,
    name: 'Levi’s Trucker Jacket',
    description: 'Classic denim jacket, rugged and stylish.',
    price: 110.0,
    brand: { id: 3 } as any,
    category: { id: 7 } as any, // Jackets
    isActive: true,
  },
  {
    id: 7,
    name: 'Zara Casual T-Shirt',
    description: 'Soft cotton t-shirt, perfect for everyday wear.',
    price: 25.0,
    brand: { id: 4 } as any,
    category: { id: 2 } as any, // T-Shirts
    isActive: true,
  },
  {
    id: 8,
    name: 'Zara Slim Fit Blazer',
    description: 'Modern blazer tailored for a sharp look.',
    price: 150.0,
    brand: { id: 4 } as any,
    category: { id: 8 } as any, // Suits / Blazers
    isActive: true,
  },
  {
    id: 9,
    name: 'H&M Summer Dress',
    description: 'Lightweight floral dress, perfect for summer.',
    price: 45.0,
    brand: { id: 5 } as any,
    category: { id: 6 } as any, // Dresses
    isActive: true,
  },
  {
    id: 10,
    name: 'H&M Winter Coat',
    description: 'Warm and stylish coat for cold days.',
    price: 120.0,
    brand: { id: 5 } as any,
    category: { id: 7 } as any,
    isActive: true,
  },
  {
    id: 11,
    name: 'Uniqlo Ultra Light Down Jacket',
    description: 'Lightweight yet warm down jacket, packable and versatile.',
    price: 70.0,
    brand: { id: 6 } as any, // Uniqlo
    category: { id: 7 } as any,
    isActive: true,
  },
  {
    id: 12,
    name: 'Uniqlo Heattech Long Sleeve',
    description: 'Thermal wear designed to retain body heat in cold weather.',
    price: 25.0,
    brand: { id: 6 } as any,
    category: { id: 2 } as any,
    isActive: true,
  },
  {
    id: 13,
    name: 'Gucci Ace Sneakers',
    description: 'Luxury leather sneakers with signature Gucci stripes.',
    price: 650.0,
    brand: { id: 7 } as any, // Gucci
    category: { id: 3 } as any,
    isActive: true,
  },
  {
    id: 14,
    name: 'Gucci GG Marmont Bag',
    description: 'Designer leather crossbody bag with GG logo.',
    price: 2200.0,
    brand: { id: 7 } as any,
    category: { id: 9 } as any, // Accessories
    isActive: true,
  },
  {
    id: 15,
    name: 'Prada Nylon Backpack',
    description: 'Signature nylon backpack with luxury finish.',
    price: 1800.0,
    brand: { id: 8 } as any, // Prada
    category: { id: 9 } as any,
    isActive: true,
  },
];

// ✅ Variants
export const productVariantSeed: Partial<ProductVariant>[] = [
  // Nike Air Force 1
  { size: 'US 9', color: 'White', imageUrl: 'https://static.nike.com/a/images/af1-white.jpg', publicId: "product_variant_nike_af1_white", quantity: 100, remaining: 95, price: 120.0, product: { id: 1 } as any },
  { size: 'US 10', color: 'Black', imageUrl: 'https://static.nike.com/a/images/af1-black.jpg', publicId: "product_variant_nike_af1_black", quantity: 80, remaining: 75, price: 120.0, product: { id: 1 } as any },

  // Adidas Ultraboost
  { size: 'US 9', color: 'Blue', imageUrl: 'https://assets.adidas.com/ultraboost-blue.jpg', publicId: "product_variant_adidas_ultraboost_blue", quantity: 50, remaining: 48, price: 180.0, product: { id: 3 } as any },
  { size: 'US 10', color: 'White', imageUrl: 'https://assets.adidas.com/ultraboost-white.jpg', publicId: "product_variant_adidas_ultraboost_white", quantity: 60, remaining: 59, price: 180.0, product: { id: 3 } as any }, 

  // Levi’s Jeans
  { size: '32', color: 'Denim Blue', imageUrl: 'https://lsco.scene7.com/501-jeans.jpg', publicId: "product_variant_levis_jeans_blue", quantity: 60, remaining: 58, price: 90.0, product: { id: 5 } as any },
  { size: '34', color: 'Black Denim', imageUrl: 'https://lsco.scene7.com/501-black.jpg', publicId: "product_variant_levis_jeans_black", quantity: 50, remaining: 47, price: 95.0, product: { id: 5 } as any },

  // Zara T-Shirt
  { size: 'M', color: 'Gray', imageUrl: 'https://static.zara.net/tshirt-gray.jpg', publicId: "product_variant_zara_tshirt_gray", quantity: 150, remaining: 145, price: 25.0, product: { id: 7 } as any },
  { size: 'L', color: 'White', imageUrl: 'https://static.zara.net/tshirt-white.jpg', publicId: "product_variant_zara_tshirt_white", quantity: 120, remaining: 118, price: 25.0, product: { id: 7 } as any },

  // Gucci Ace Sneakers
  { size: 'EU 42', color: 'White/Green', imageUrl: 'https://media.gucci.com/ace-white-green.jpg', publicId: "product_variant_gucci_ace_white_green", quantity: 20, remaining: 18, price: 650.0, product: { id: 13 } as any },
];

// ✅ Images
export const productImageSeed: Partial<ProductImage>[] = [
  { imageUrl: 'https://static.nike.com/a/images/af1-white.jpg', publicId: "product_image_nike_af1_white", product: { id: 1 } as any },
  { imageUrl: 'https://static.nike.com/a/images/af1-black.jpg', publicId: "product_image_nike_af1_black", product: { id: 1 } as any },

  { imageUrl: 'https://assets.adidas.com/ultraboost-blue.jpg', publicId: "product_image_adidas_ultraboost_blue", product: { id: 3 } as any },
  { imageUrl: 'https://assets.adidas.com/ultraboost-white.jpg', publicId: "product_image_adidas_ultraboost_white", product: { id: 3 } as any },

  { imageUrl: 'https://lsco.scene7.com/501-jeans.jpg', publicId: "product_image_levis_jeans_blue", product: { id: 5 } as any },
  { imageUrl: 'https://lsco.scene7.com/501-black.jpg', publicId: "product_image_levis_jeans_black", product: { id: 5 } as any },

  { imageUrl: 'https://static.zara.net/tshirt-gray.jpg', publicId: "product_image_zara_tshirt_gray", product: { id: 7 } as any },
  { imageUrl: 'https://static.zara.net/tshirt-white.jpg', publicId: "product_image_zara_tshirt_white", product: { id: 7 } as any },

  { imageUrl: 'https://media.gucci.com/ace-white-green.jpg', publicId: "product_image_gucci_ace_white_green", product: { id: 13 } as any },
  { imageUrl: 'https://media.gucci.com/gg-marmont-bag.jpg', publicId: "product_image_gucci_gg_marmont_bag", product: { id: 14 } as any },
  { imageUrl: 'https://media.prada.com/nylon-backpack.jpg', publicId: "product_image_prada_nylon_backpack", product: { id: 15 } as any },
];
