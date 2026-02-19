import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";
import { Loader2, Package } from "lucide-react";

const Index = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialMin = searchParams.get("minPrice") || "";
  const initialMax = searchParams.get("maxPrice") || "";

  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const search = searchParams.get("q")?.trim() || "";

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category, search, minPrice, maxPrice],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });

      if (category !== "all") {
        query = query.eq("category", category as any);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!Number.isNaN(min)) {
        query = query.gte("price", min);
      }
      if (!Number.isNaN(max)) {
        query = query.lte("price", max);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch seller names
      const sellerIds = [...new Set(data.map((p) => p.seller_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", sellerIds);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      return data.map((p) => ({ ...p, seller_name: profileMap.get(p.seller_id) || "Unknown Seller" }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-6">
        {/* Hero */}
        <section className="mb-8 text-center py-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-3">
            Buy & Sell on Campus
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            LADI is Babcock University's trusted marketplace. Discover great deals from fellow students.
          </p>
        </section>

        {/* Categories */}
        <section className="mb-6 space-y-3">
          <CategoryFilter selected={category} onSelect={setCategory} />
          <div className="flex flex-wrap gap-3 items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Price:</span>
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="h-9 w-24 rounded-md border bg-background px-2 text-xs outline-none"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="h-9 w-24 rounded-md border bg-background px-2 text-xs outline-none"
              />
            </div>
            {search && (
              <span className="text-xs text-muted-foreground">
                Showing results for <span className="font-medium">{search}</span>
              </span>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <section>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.price)}
                  image={
                    Array.isArray(product.images) && product.images.length > 0
                      ? product.images[0]
                      : undefined
                  }
                  sellerName={product.seller_name}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No products yet</p>
              <p className="text-sm">Be the first to list something!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
