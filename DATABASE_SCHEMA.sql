-- ============================================================================
-- FShop Database Schema
-- Auto-generated from NestJS TypeORM Entities
-- Database: PostgreSQL
-- ============================================================================

-- ============================================================================
-- ENUMS (Enum Types in PostgreSQL)
-- ============================================================================

CREATE TYPE role_enum AS ENUM ('admin', 'user');
CREATE TYPE order_status_enum AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_method_enum AS ENUM ('cod', 'paypal', 'stripe');
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE shipping_method_enum AS ENUM ('standard', 'express', 'overnight');
CREATE TYPE coupon_status_enum AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');
CREATE TYPE address_type_enum AS ENUM ('home', 'work', 'other');
CREATE TYPE notification_type_enum AS ENUM ('order', 'review', 'post', 'chat', 'system');
CREATE TYPE review_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE livestream_status_enum AS ENUM ('scheduled', 'live', 'ended');
CREATE TYPE reaction_type_enum AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY');
CREATE TYPE target_type_enum AS ENUM ('all', 'category', 'brand', 'product');
CREATE TYPE stock_log_type_enum AS ENUM ('import', 'export', 'adjust', 'return');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  avatar VARCHAR(255),
  "publicId" VARCHAR(255),
  "fullName" VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role role_enum DEFAULT 'user',
  "isVerified" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments Table
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  "imageUrl" VARCHAR(255) NOT NULL,
  "publicId" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(255),
  "imageUrl" VARCHAR(255) NOT NULL,
  "publicId" VARCHAR(255) NOT NULL,
  "departmentId" INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands Table
CREATE TABLE brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description VARCHAR(255),
  "imageUrl" VARCHAR(255) NOT NULL,
  "publicId" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRODUCT TABLES
-- ============================================================================

-- Products Table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  "averageRating" DECIMAL(2, 1) DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "categoryId" INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  "brandId" INTEGER REFERENCES brands(id) ON DELETE SET NULL,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Variants Table
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  "imageUrl" VARCHAR(255),
  "publicId" VARCHAR(255),
  quantity INTEGER DEFAULT 0,
  remaining INTEGER DEFAULT 0,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Images Table
CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  "imageUrl" VARCHAR(255) NOT NULL,
  "publicId" VARCHAR(255),
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT true
);

-- Attributes Table
CREATE TABLE attributes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  "isActive" BOOLEAN DEFAULT true
);

-- Attribute Categories Table
CREATE TABLE attribute_categories (
  id SERIAL PRIMARY KEY,
  "attributeId" INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
  "categoryId" INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true
);

-- Variant Attribute Values Table
CREATE TABLE variant_attribute_values (
  id SERIAL PRIMARY KEY,
  "productVariantId" INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  "attributeCategoryId" INTEGER NOT NULL REFERENCES attribute_categories(id) ON DELETE CASCADE
);

-- ============================================================================
-- SHOPPING CART TABLES
-- ============================================================================

-- Carts Table
CREATE TABLE carts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  quantity INTEGER NOT NULL,
  "cartId" INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  "variantId" INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- WISHLIST TABLES
-- ============================================================================

-- Wishlists Table
CREATE TABLE wishlists (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ADDRESS TABLES
-- ============================================================================

-- Addresses Table
CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  "recipientName" VARCHAR(255) NOT NULL,
  "recipientPhone" VARCHAR(255) NOT NULL,
  "detailAddress" VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  commune VARCHAR(255) NOT NULL,
  type address_type_enum DEFAULT 'home',
  "isDefault" BOOLEAN DEFAULT false,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ORDER TABLES
-- ============================================================================

-- Orders Table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  "recipientName" VARCHAR(255) NOT NULL,
  "recipientPhone" VARCHAR(255) NOT NULL,
  "detailAddress" VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  district VARCHAR(255) NOT NULL,
  commune VARCHAR(255) NOT NULL,
  status order_status_enum DEFAULT 'pending',
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  note TEXT,
  "paymentMethod" payment_method_enum DEFAULT 'cod',
  "paymentStatus" payment_status_enum DEFAULT 'pending',
  "shippingMethod" shipping_method_enum DEFAULT 'standard',
  "shippingFee" DECIMAL(10, 2) DEFAULT 0,
  "discountAmount" DECIMAL(10, 2) DEFAULT 0,
  "couponCode" VARCHAR(255),
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  "orderId" INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "variantId" INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PAYMENT TABLES
-- ============================================================================

-- Payments Table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  "orderId" INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  method payment_method_enum DEFAULT 'paypal',
  status payment_status_enum DEFAULT 'pending',
  "providerPaymentId" VARCHAR(255),
  "providerPayerId" VARCHAR(255),
  amount DECIMAL(10, 2) NOT NULL,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- COUPON TABLES
-- ============================================================================

-- Coupons Table
CREATE TABLE coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  "discountType" discount_type_enum DEFAULT 'percentage',
  "discountValue" DECIMAL(10, 2),
  "minOrderAmount" DECIMAL(10, 2) DEFAULT 0,
  "usageLimit" INTEGER DEFAULT 0,
  "usageCount" INTEGER,
  "usageLimitPerUser" INTEGER DEFAULT 0,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  status coupon_status_enum DEFAULT 'active',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_coupon_code_active ON coupons(code) WHERE "isActive" = true;

-- Coupon Targets Table
CREATE TABLE coupon_targets (
  id SERIAL PRIMARY KEY,
  "targetType" target_type_enum DEFAULT 'all',
  "targetId" INTEGER,
  "couponId" INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE
);

-- Coupon Redemptions Table
CREATE TABLE coupon_redemptions (
  id SERIAL PRIMARY KEY,
  "couponId" INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "orderId" INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "isRedeemed" BOOLEAN DEFAULT false,
  "appliedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "redeemedAt" TIMESTAMP,
  UNIQUE("couponId", "orderId")
);

CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions("userId");

-- ============================================================================
-- REVIEW TABLES
-- ============================================================================

-- Reviews Table
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  rating DECIMAL(2, 1) DEFAULT 5.0,
  comment TEXT,
  status review_status_enum DEFAULT 'pending',
  "isActive" BOOLEAN DEFAULT true,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "orderId" INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "variantId" INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Images Table
CREATE TABLE review_images (
  id SERIAL PRIMARY KEY,
  "imageUrl" VARCHAR(255) NOT NULL,
  "publicId" VARCHAR(255),
  "reviewId" INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review Votes Table
CREATE TABLE review_votes (
  id SERIAL PRIMARY KEY,
  "isHelpful" BOOLEAN DEFAULT true,
  "reviewId" INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("reviewId", "userId")
);

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type notification_type_enum NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "userId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read_created ON notifications("userId", "isRead", "createdAt");

-- ============================================================================
-- SOCIAL POSTS TABLES
-- ============================================================================

-- Posts Table
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  "totalComments" INTEGER DEFAULT 0,
  "totalShares" INTEGER DEFAULT 0,
  "totalReactions" INTEGER DEFAULT 0,
  "reactionCounts" JSONB DEFAULT '{"LIKE": 0, "LOVE": 0, "HAHA": 0, "WOW": 0, "SAD": 0, "ANGRY": 0}',
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Images Table
CREATE TABLE post_images (
  id SERIAL PRIMARY KEY,
  "imageUrl" VARCHAR(255) NOT NULL,
  "publicId" VARCHAR(255),
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Products Table (Tags products in posts)
CREATE TABLE post_products (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Comments Table (Threaded comments)
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  "parentCommentId" INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
  "replyCount" INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Likes Table
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("postId", "userId")
);

-- Post Reactions Table
CREATE TABLE post_reactions (
  id SERIAL PRIMARY KEY,
  type reaction_type_enum NOT NULL,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("postId", "userId")
);

-- Post Bookmarks Table
CREATE TABLE post_bookmarks (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("postId", "userId")
);

-- Post Shares Table
CREATE TABLE post_shares (
  id SERIAL PRIMARY KEY,
  "postId" INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CHAT TABLES
-- ============================================================================

-- Conversations Table
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  "customerId" INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "assignedAdminId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'OPEN',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "lastMessageAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  content TEXT,
  "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "senderRole" VARCHAR(50) NOT NULL,
  attachments JSONB,
  "isDelivered" BOOLEAN DEFAULT false,
  "isSeen" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LIVESTREAM TABLES
-- ============================================================================

-- Livestreams Table
CREATE TABLE livestreams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  "streamKey" VARCHAR(255) UNIQUE NOT NULL,
  status livestream_status_enum DEFAULT 'scheduled',
  "isActive" BOOLEAN DEFAULT false,
  "scheduledAt" TIMESTAMP,
  "startedAt" TIMESTAMP,
  "endedAt" TIMESTAMP,
  "currentViewers" INTEGER DEFAULT 0,
  "peakViewers" INTEGER DEFAULT 0,
  "totalViews" INTEGER DEFAULT 0,
  "thumbnailUrl" VARCHAR(255),
  "recordingUrl" VARCHAR(255),
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Livestream Products Join Table
CREATE TABLE livestream_products (
  "livestreamId" INTEGER NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY("livestreamId", "productId")
);

-- Livestream Messages Table
CREATE TABLE livestream_messages (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  "isPinned" BOOLEAN DEFAULT false,
  "isDeleted" BOOLEAN DEFAULT false,
  "livestreamId" INTEGER NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Livestream Views Table
CREATE TABLE livestream_views (
  id SERIAL PRIMARY KEY,
  "livestreamId" INTEGER NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "guestId" VARCHAR(255),
  "joinedAt" TIMESTAMP NOT NULL,
  "leftAt" TIMESTAMP,
  "watchDuration" INTEGER DEFAULT 0,
  "lastActivityAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Livestream Pinned Products Table
CREATE TABLE livestream_pinned_products (
  id SERIAL PRIMARY KEY,
  "livestreamId" INTEGER NOT NULL REFERENCES livestreams(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "clickCount" INTEGER DEFAULT 0,
  "addToCartCount" INTEGER DEFAULT 0,
  "pinnedAt" TIMESTAMP NOT NULL,
  "unpinnedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- STOCK MANAGEMENT TABLES
-- ============================================================================

-- Stock Logs Table
CREATE TABLE stock_logs (
  id SERIAL PRIMARY KEY,
  type stock_log_type_enum NOT NULL,
  note TEXT,
  "createdById" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_logs_type_created ON stock_logs(type, "createdAt");

-- Stock Log Items Table
CREATE TABLE stock_log_items (
  id SERIAL PRIMARY KEY,
  quantity INTEGER NOT NULL,
  "stockLogId" INTEGER NOT NULL REFERENCES stock_logs(id) ON DELETE CASCADE,
  "variantId" INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================

-- User Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users("createdAt");

-- Product Indexes
CREATE INDEX idx_products_category ON products("categoryId");
CREATE INDEX idx_products_brand ON products("brandId");
CREATE INDEX idx_products_active ON products("isActive");
CREATE INDEX idx_product_variants_product ON product_variants("productId");

-- Order Indexes
CREATE INDEX idx_orders_user ON orders("userId");
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders("createdAt");
CREATE INDEX idx_order_items_order ON order_items("orderId");

-- Review Indexes
CREATE INDEX idx_reviews_user ON reviews("userId");
CREATE INDEX idx_reviews_variant ON reviews("variantId");
CREATE INDEX idx_reviews_status ON reviews(status);

-- Post Indexes
CREATE INDEX idx_posts_user ON posts("userId");
CREATE INDEX idx_posts_active ON posts("isActive");
CREATE INDEX idx_posts_created ON posts("createdAt");
CREATE INDEX idx_post_comments_post ON post_comments("postId");
CREATE INDEX idx_post_comments_user ON post_comments("userId");
CREATE INDEX idx_post_comments_parent ON post_comments("parentCommentId");

-- Chat Indexes
CREATE INDEX idx_conversations_customer ON conversations("customerId");
CREATE INDEX idx_messages_conversation ON messages("conversationId");
CREATE INDEX idx_messages_sender ON messages("senderId");

-- Livestream Indexes
CREATE INDEX idx_livestreams_user ON livestreams("userId");
CREATE INDEX idx_livestreams_status ON livestreams(status);
CREATE INDEX idx_livestream_messages_livestream ON livestream_messages("livestreamId");
CREATE INDEX idx_livestream_messages_user ON livestream_messages("userId");
CREATE INDEX idx_livestream_views_livestream ON livestream_views("livestreamId");

-- Wishlist Indexes
CREATE INDEX idx_wishlists_user ON wishlists("userId");
CREATE INDEX idx_wishlists_product ON wishlists("productId");

-- Address Indexes
CREATE INDEX idx_addresses_user ON addresses("userId");

-- Cart Indexes
CREATE INDEX idx_cart_items_cart ON cart_items("cartId");

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
