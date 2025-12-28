import { OrderStatus } from 'src/constants';

export interface OverviewResponseDto {
  revenue: number;
  totalOrders: number;
  productsSold: number;
  newCustomers: number;
  lowStockVariants: number;
}

export interface RevenueDataDto {
  date: string;
  total: number;
}

export interface OrderStatusDataDto {
  status: OrderStatus;
  count: number;
}

export interface TopProductDto {
  productId: number;
  name: string;
  sold: number;
  revenue: number;
}

export interface RecentOrderDto {
  id: number;
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  itemsCount: number;
}

export interface HomePageStatsDto {
  totalProducts: number;
  totalCustomers: number;
  rating: {
    averageRating: number;
    totalRatings: number;
  };
  satisfactionRate: number;
}
