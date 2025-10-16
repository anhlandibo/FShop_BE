import { Role } from "src/constants/role.enum";
import { User } from "../users/entities/user.entity";
import { ProductImage } from "../products/entities/product-image.entity";
import { Product } from "../products/entities/product.entity";

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
