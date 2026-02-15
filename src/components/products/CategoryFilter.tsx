import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { value: "all", label: "All" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "food", label: "Food" },
  { value: "books", label: "Books" },
  { value: "services", label: "Services" },
  { value: "beauty", label: "Beauty" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => (
        <Button
          key={cat.value}
          variant={selected === cat.value ? "default" : "secondary"}
          size="sm"
          onClick={() => onSelect(cat.value)}
          className={cn(
            "whitespace-nowrap rounded-full text-xs",
            selected === cat.value && "shadow-sm"
          )}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
