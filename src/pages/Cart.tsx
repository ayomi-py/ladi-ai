import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

const Cart = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, products(name, price, images, stock, seller_id)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity < 1) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Item removed" });
    },
  });

  const total = cartItems?.reduce((sum, item: any) => sum + Number(item.products?.price || 0) * item.quantity, 0) || 0;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <h1 className="text-2xl font-display font-bold mb-6">Shopping Cart</h1>

        {cartItems && cartItems.length > 0 ? (
          <div className="space-y-4">
            {cartItems.map((item: any) => {
              const images: string[] = Array.isArray(item.products?.images) ? item.products.images : [];
              return (
                <Card key={item.id}>
                  <CardContent className="p-4 flex gap-4">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {images.length > 0 ? (
                        <img src={images[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                          No img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${item.product_id}`}>
                        <h3 className="font-medium text-sm truncate hover:underline">{item.products?.name}</h3>
                      </Link>
                      <p className="text-sm font-semibold mt-1">₦{Number(item.products?.price || 0).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity.mutate({
                                id: item.id,
                                quantity: Math.min(item.products?.stock || 99, item.quantity + 1),
                              })
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem.mutate(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-semibold text-sm whitespace-nowrap">
                      ₦{(Number(item.products?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}

            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-bold">₦{total.toLocaleString()}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <Link to="/">
              <Button variant="link" className="mt-2">Browse products</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
