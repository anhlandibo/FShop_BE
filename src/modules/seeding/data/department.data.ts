import { Department } from "src/modules/departments/entities/department.entity";

export const departmentSeed: Partial<Department>[] = [
  {
    name: "Men",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760273938/man_vfkzwn.png",
    publicId: "department_men",
    description:
      "Men’s modern fashion collection — from shirts, jeans, and jackets to sporty sneakers and casual wear.",
    isActive: true,
  },
  {
    name: "Women",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760274088/women_erjpwp.png",
    publicId: "department_women",
    description:
      "Elegant and trendy women’s fashion — dresses, blouses, handbags, high heels, and chic accessories.",
    isActive: true,
  },
  {
    name: "Kids",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760274163/kids_xm52rh.png",
    publicId: "department_kids",
    description:
      "Adorable and comfortable kids’ clothing — playful outfits, cozy shoes, and soft materials for every season.",
    isActive: true,
  },
  {
    name: "Accessories",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760274394/accessories_kawz03.png",
    publicId: "department_accessories",
    description:
      "Complete your look with stylish accessories — watches, wallets, belts, hats, and sunglasses.",
    isActive: true,
  },
  {
    name: "Shoes",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760274394/shoes_yyhn3w.png",
    publicId: "department_shoes",
    description:
      "Discover a wide range of shoes — sneakers, dress shoes, heels, sandals, and trendy footwear for all occasions.",
    isActive: true,
  },
  {
    name: "Bags",
    imageUrl: "https://res.cloudinary.com/dtkbbwmg4/image/upload/v1760274511/bags_zubjqg.png",
    publicId: "department_bags",
    description:
      "Fashionable bags for every lifestyle — backpacks, totes, crossbody bags, and premium leather wallets.",
    isActive: true,
  },
];