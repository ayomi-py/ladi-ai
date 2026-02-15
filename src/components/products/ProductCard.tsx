import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  sellerName?: string;
  rating?: number;
  reviewCount?: number;
}

const ProductCard = ({ id, name, price, image, sellerName, rating, reviewCount }: ProductCardProps) => {
  return (
    <Link to={`/product/${id}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="aspect-square overflow-hidden bg-muted">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-sm line-clamp-2 mb-1">{name}</h3>
          {sellerName && (
            <p className="text-xs text-muted-foreground mb-2">{sellerName}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">₦{price.toLocaleString()}</span>
            {rating !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span>{rating.toFixed(1)}</span>
                {reviewCount !== undefined && <span>({reviewCount})</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
