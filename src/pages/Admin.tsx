import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck, Users, PackageSearch, BarChart3 } from "lucide-react";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, department, matric_number, created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, status, created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const toggleProductActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Product updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (e: any) =>
      toast({
        title: "Update failed",
        description: e.message,
        variant: "destructive",
      }),
  });

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-xl py-10 text-center">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="mb-2 text-2xl font-display font-bold">Admin access only</h1>
          <p className="text-sm text-muted-foreground">
            You need an admin role to view this dashboard.
          </p>
        </main>
      </div>
    );
  }

  const totalRevenue =
    orders?.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0) || 0;
  const commission = totalRevenue * 0.065;
  const orderCount = orders?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Platform-wide users, listings, and revenue overview.
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Admin
          </Badge>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                ₦{totalRevenue.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Across {orderCount} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Platform commission (6.5%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                ₦{commission.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimated, based on order totals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Active listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {products?.filter((p: any) => p.is_active).length ?? 0}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {products?.length ?? 0} total products
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger
              value="users"
              className="flex-1 justify-center gap-1"
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="flex-1 justify-center gap-1"
            >
              <PackageSearch className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex-1 justify-center gap-1"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!profiles?.length && (
                  <p className="text-sm text-muted-foreground">
                    No users found.
                  </p>
                )}
                {profiles?.map((p: any) => (
                  <div
                    key={p.user_id}
                    className="flex items-center justify-between text-sm border-b last:border-b-0 pb-2 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {p.full_name || "Unnamed user"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.department || "No department"} ·{" "}
                        {p.matric_number || "No matric"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Product moderation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!products?.length && (
                  <p className="text-sm text-muted-foreground">
                    No products found.
                  </p>
                )}
                {products?.map((prod: any) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{prod.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₦{Number(prod.price).toLocaleString()} ·{" "}
                        {prod.category} · Stock {prod.stock}
                      </p>
                    </div>
                    <Badge
                      variant={prod.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {prod.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleProductActive.mutate({
                          id: prod.id,
                          is_active: !prod.is_active,
                        })
                      }
                    >
                      {prod.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  Simple textual analytics are shown here. You can wire this to
                  the existing `chart` components for full visual charts later.
                </p>
                <p>
                  - Total orders:{" "}
                  <strong>{orderCount}</strong>
                </p>
                <p>
                  - Total revenue:{" "}
                  <strong>₦{totalRevenue.toLocaleString()}</strong>
                </p>
                <p>
                  - Platform commission (6.5%):{" "}
                  <strong>₦{commission.toLocaleString()}</strong>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

