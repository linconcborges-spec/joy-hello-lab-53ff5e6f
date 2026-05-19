import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts } from "@/hooks/useProducts";
import { useAddons } from "@/hooks/useAddons";
import { useCategories } from "@/hooks/useCategories";
import { ProductsTab } from "@/components/products/ProductsTab";
import { AddonsTab } from "@/components/products/AddonsTab";
import { CategoriesTab } from "@/components/products/CategoriesTab";

interface ProductsPageProps {
  onBack: () => void;
}

export function ProductsPage({ onBack }: ProductsPageProps) {
  const { data: products = [] } = useProducts();
  const { data: addons = [] } = useAddons();
  const { data: categories = [] } = useCategories();
  const [activeTab, setActiveTab] = useState("products");
  const [productNewTrigger, setProductNewTrigger] = useState(0);
  const [addonNewTrigger, setAddonNewTrigger] = useState(0);
  const [categoryNewTrigger, setCategoryNewTrigger] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (activeTab === "products") setProductNewTrigger(t => t + 1);
        else if (activeTab === "addons") setAddonNewTrigger(t => t + 1);
        else if (activeTab === "categories") setCategoryNewTrigger(t => t + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">Produtos ({products.length})</TabsTrigger>
            <TabsTrigger value="addons">Adicionais ({addons.length})</TabsTrigger>
            <TabsTrigger value="categories">Categorias ({categories.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <ProductsTab newTrigger={productNewTrigger} />
          </TabsContent>

          <TabsContent value="addons" className="space-y-4">
            <AddonsTab newTrigger={addonNewTrigger} />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoriesTab newTrigger={categoryNewTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
