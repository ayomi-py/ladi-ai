

# LADI — Multi-Vendor E-Commerce Web App for Babcock University

## Design & Branding
- **Minimalist design** with clean layouts, generous whitespace, and clear typography
- **Color scheme**: Soft neutral palette with a single accent color (e.g., deep teal or warm indigo) for CTAs and highlights
- **Mobile-first responsive** layout that works beautifully on phones, tablets, and desktops
- Modern card-based UI with subtle shadows and rounded corners

## Backend (Supabase via Lovable Cloud)
- **Authentication**: Email/password registration restricted to `@babcock.edu.ng` emails, email verification, password reset
- **Database**: Profiles, products, orders, cart, messages, reviews, coupons, invoices tables with proper RLS policies
- **Storage**: Product images and profile pictures
- **Edge Functions**: Payment webhook handling, monthly invoice generation, commission calculations
- **Roles**: User roles table (admin, user) with security-definer helper functions

---

## Core Features

### 1. Authentication & Onboarding
- Registration with `@babcock.edu.ng` email validation
- Email verification flow
- Login / password reset
- Profile setup (name, matric number, department, profile picture)

### 2. Home / Product Discovery
- Browse all products with category filters
- Search bar with keyword search
- Product cards showing image, name, price, seller info
- Products with zero stock automatically hidden

### 3. Product Detail Page
- Image gallery, description, price, stock status
- Seller info with link to seller profile
- Add to cart button
- Reviews and star ratings from other buyers
- Message seller button

### 4. Seller Features (Any User Can Sell)
- Create product listings (name, description, price, category, stock, images)
- Edit/delete own listings
- Seller dashboard: view active listings, incoming orders, revenue stats
- Seller privileges auto-granted when a listing is created, revoked when no active listings

### 5. Shopping Cart & Checkout
- Add/remove items, adjust quantities
- Apply coupon codes with validation
- Order summary with item prices and delivery fees
- **Paystack integration** for payment processing
- Order confirmation with notifications to buyer and seller

### 6. Order Management
- **Buyer view**: Track order status (Pending → Confirmed → Delivered), confirm delivery
- **Seller view**: Update order status through predefined states
- Notifications on status changes

### 7. Reviews & Ratings
- Buyers can leave star ratings and written reviews after delivery confirmation
- Average rating displayed on product cards and detail pages

### 8. Real-Time Messaging
- In-app messaging between buyers and sellers
- Message history stored per conversation
- New message notifications

### 9. Coupons & Discounts
- Sellers can create coupon codes with expiry dates and usage limits
- Coupon validation at checkout
- Premium features placeholder (e.g., free delivery for subscribed users)

### 10. Vendor Revenue & Platform Billing
- Track monthly revenue per seller
- Auto-calculate 6.5% platform commission
- Generate monthly invoices for sellers
- Notify sellers of new invoices
- Suspend listing privileges if fees unpaid after 7 days

### 11. Admin Dashboard
- View and manage all users (suspend/deactivate accounts)
- Remove inappropriate product listings
- System revenue analytics and charts
- Manage platform-wide coupons

---

## Pages Summary
1. **Landing / Home** — Product browsing, search, categories
2. **Auth pages** — Register, Login, Verify Email, Reset Password
3. **Product Detail** — Full product info, reviews, add to cart
4. **Profile** — View/edit profile, order history, own listings
5. **Seller Dashboard** — Manage listings, orders, revenue, invoices
6. **Cart & Checkout** — Cart items, coupons, Paystack payment
7. **Orders** — Order tracking for buyers, order management for sellers
8. **Messages** — Conversation list and chat view
9. **Admin Panel** — User management, product moderation, analytics

