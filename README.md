 LADI - Multi‑Vendor Campus Marketplace

LADI is a multi‑vendor e‑commerce web app designed for Babcock University students.  
Any authenticated student can buy and sell items on campus: electronics, fashion, food, books, services, and more.

The stack is **React + TypeScript + Vite**, with **Supabase** providing authentication, database, RLS, and storage, and **shadcn‑ui + Tailwind** for the UI.

---

 Core Features

 1. Authentication & Profiles

- Email/password registration restricted to Babcock emails.
- Login and password reset via Supabase Auth.
- Profile page with:
  - Full name, matric number, department.
  - Avatar upload (stored in the `avatars` bucket).
  - Quick links to orders, seller dashboard, cart, and messages.
- `profiles` table with RLS and triggers to auto‑create profiles for new users.

 2. Product Browsing & Home

- Landing page showing all active products with `stock > 0`.
- Category chips using `product_category` enum (electronics, fashion, food, etc.).
- Search bar in the navbar:
  - Free‑text search across product name and description.
- Price range filters (min / max) on the home page.
- Product cards show:
  - Image, name, price, seller name, and average rating (where available).

 3. Product Detail & Reviews

- Product detail page with:
  - Image gallery and thumbnails.
  - Category, description, price, and stock status.
  - Seller info with avatar and link to message the seller.
  - “Add to cart” with quantity controls.
- Reviews:
  - Logged‑in buyers can add ratings (1–5 stars) and review text.
  - **Gated reviews**: only users who have at least one **delivered** order that includes this product can review.
  - Average rating is computed and shown at the top.

 4. Seller Dashboard (Multi‑Vendor)

- Any authenticated student can sell.
- Seller dashboard includes:
  - **My Products** tab:
    - Create new product listings with name, description, price, category, stock, and images.
    - Uploads product images to the `product-images` bucket.
    - See cards for each listing with image, price, stock, category, and status (Active/Inactive).
    - **Edit** existing products (reuses the create dialog to edit fields).
    - Delete products.
  - **Orders** tab:
    - View all orders where the current user is the seller.
    - For each order, see buyer name, items, quantities, and totals.
    - Update order status through the standard lifecycle:
      `pending → confirmed → shipped → delivered → cancelled`.

 5. Cart & Checkout

- Cart page:
  - Lists items with image, name, unit price, quantity, and line total.
  - Increment/decrement quantity and remove items.
  - Shows a sticky order summary with subtotal and CTA to checkout.
- Checkout page:
  - Groups cart items by seller (each seller becomes a separate order).
  - Applies a per‑seller delivery fee.
  - Supports coupon codes with:
    - Percentage discount.
    - Expiry date.
    - Usage limit and usage count.
    - Eligibility check so coupons only apply to the correct seller’s items.
  - Computes subtotal, delivery total, discount amount, and grand total.
  - **Simulated payments**:
    - On “Pay (Simulated)”, creates `orders` and `order_items`, increments coupon usage, and clears the cart.
    - Ready to be wired to a real Paystack flow (Paystack script is already included in `index.html`).

 6. Orders & Delivery

- Buyer `Orders` page:
  - Shows all orders where the user is the buyer.
  - Displays seller name, items, quantities, status, and total.
  - Buyers can **mark an order as delivered**, which:
    - Updates `orders.status` to `delivered`.
    - Unlocks the ability to review the product.
- Seller `Orders` tab (in dashboard):
  - See all incoming orders and change status for each order.

 7. Messaging

- In‑app messaging between buyers and sellers backed by the `messages` table and Supabase Realtime.
- `Messages` page:
  - Conversations grouped by peer, with last message and unread count.
  - Real‑time updates when new messages arrive.
  - Message composer at the bottom of the chat.
- Product detail page links to messaging with `?to=<seller_id>` for starting a conversation with the seller.

 8. Coupons

- `coupons` table with expiry, usage limit, usage count, and active flag.
- Validation and application of coupons on checkout.
- Admin coupons view:
  - Admin dashboard has a **Coupons** tab, listing all coupons with:
    - Code, discount percent.
    - Usage count vs limit.
    - Expiry date and active status.

 9. Admin Dashboard

- Admins are users with `role = 'admin'` in the `user_roles` table.
- Accessed at `/admin`.
- Features:
  - Summary cards for:
    - Total revenue across all orders.
    - Platform commission (6.5% of revenue).
    - Active listings count.
  - **Users** tab:
    - List all profiles with full name, department, matric number, and join date.
  - **Products** tab:
    - View all products.
    - Activate/deactivate listings.
  - **Analytics** tab:
    - Textual summary of total orders, revenue, and commission.
  - **Coupons** tab:
    - Overview of all coupons and their status.

---

 Tech Stack

- Frontend
  - React 18 + TypeScript
  - Vite
  - shadcn‑ui component library
  - Tailwind CSS
  - React Router
  - React Query (`@tanstack/react-query`)

- Backend / Data
  - Supabase:
    - Auth (email/password, sessions).
    - Postgres database with Row Level Security.
    - Storage buckets (`avatars`, `product-images`).
    - Realtime for messaging.
  - SQL migrations in `supabase/migrations`.

---

 Getting Started (Clone & Run Locally)

 1. Prerequisites

- Node.js (LTS) and npm installed.  
  Check with:

```bash
node -v
npm -v
```


 2. Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd ladi
```

 3. Install dependencies

```bash
npm install
```

4. Run the dev server

```bash
npm run dev
```

