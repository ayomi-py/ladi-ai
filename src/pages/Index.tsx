import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/products/ProductCard";
import CategoryFilter from "@/components/products/CategoryFilter";
import { Loader2, Package } from "lucide-react";

const Index = () => {
  const [category, setCategory] = useState("all");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, profiles!products_seller_id_fkey(full_name)")
        .eq("is_active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });

      if (category !== "all") {
        query = query.eq("category", category as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
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
        <section className="mb-6">
          <CategoryFilter selected={category} onSelect={setCategory} />
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
                  sellerName={product.profiles?.full_name || "Unknown Seller"}
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
