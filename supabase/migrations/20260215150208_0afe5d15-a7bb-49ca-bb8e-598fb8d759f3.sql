
-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Enum for invoice status
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue');

-- Enum for product category
CREATE TYPE public.product_category AS ENUM (
  'electronics', 'fashion', 'food', 'books', 'services', 'beauty', 'sports', 'other'
);

-- =====================
-- USER ROLES TABLE
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================
-- SECURITY DEFINER: has_role
-- =====================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  matric_number TEXT,
  department TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================
-- PRODUCTS TABLE
-- =====================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category product_category NOT NULL DEFAULT 'other',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================
-- ORDERS TABLE
-- =====================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_ref TEXT,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- =====================
-- ORDER ITEMS TABLE
-- =====================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- =====================
-- CART ITEMS TABLE
-- =====================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- =====================
-- MESSAGES TABLE
-- =====================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =====================
-- REVIEWS TABLE
-- =====================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================
-- COUPONS TABLE
-- =====================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5,2) NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  expires_at TIMESTAMPTZ,
  usage_limit INTEGER DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- =====================
-- INVOICES TABLE
-- =====================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  commission NUMERIC(10,2) NOT NULL,
  status invoice_status NOT NULL DEFAULT 'pending',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- =====================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- AUTO-CREATE PROFILE & DEFAULT ROLE ON SIGNUP
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- RLS POLICIES: user_roles
-- =====================
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: profiles
-- =====================
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Also allow viewing profiles for product seller info
CREATE POLICY "Anyone can view profiles for seller info" ON public.profiles FOR SELECT TO authenticated USING (true);

-- =====================
-- RLS POLICIES: products
-- =====================
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true AND stock > 0);
CREATE POLICY "Sellers can view own products" ON public.products FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can view all products" ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create products" ON public.products FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Sellers can delete own products" ON public.products FOR DELETE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: orders
-- =====================
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Sellers can view orders for them" ON public.orders FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers can update own orders" ON public.orders FOR UPDATE TO authenticated USING (buyer_id = auth.uid());
CREATE POLICY "Sellers can update their orders" ON public.orders FOR UPDATE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: order_items
-- =====================
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid() OR seller_id = auth.uid()));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));
CREATE POLICY "Admins can manage all order items" ON public.order_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: cart_items
-- =====================
CREATE POLICY "Users can manage own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================
-- RLS POLICIES: messages
-- =====================
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Admins can manage messages" ON public.messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: reviews
-- =====================
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: coupons
-- =====================
CREATE POLICY "Sellers can view own coupons" ON public.coupons FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Anyone can view active coupons for validation" ON public.coupons FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Sellers can create coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own coupons" ON public.coupons FOR UPDATE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Sellers can delete own coupons" ON public.coupons FOR DELETE TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- RLS POLICIES: invoices
-- =====================
CREATE POLICY "Sellers can view own invoices" ON public.invoices FOR SELECT TO authenticated USING (seller_id = auth.uid());
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for product images
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
