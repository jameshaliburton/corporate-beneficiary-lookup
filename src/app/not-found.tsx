import Link from "next/link";
import { Search, Home, TrendingUp } from "lucide-react";

export default function NotFound() {
  const popularBrands = [
    { name: "Nike", href: "/result/nike" },
    { name: "Delta", href: "/result/delta" },
    { name: "IKEA", href: "/result/ikea" },
    { name: "Apple", href: "/result/apple" },
    { name: "Google", href: "/result/google" },
    { name: "Amazon", href: "/result/amazon" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-aqua-50 to-aqua-100 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        {/* 404 Icon */}
        <div className="text-6xl mb-4">🔍</div>
        
        {/* Main Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            We couldn't find the page you're looking for. Let's help you discover who owns your favorite brands instead!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
          >
            <Search className="w-4 h-4" />
            Search Brands
          </Link>
        </div>

        {/* Popular Brands */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-center text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Try a popular brand:</span>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {popularBrands.map((brand) => (
              <Link
                key={brand.name}
                href={brand.href}
                className="px-4 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-lg text-sm font-medium text-foreground hover:shadow-sm transition-all"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-sm text-muted-foreground max-w-md mx-auto">
          <p>
            Can't find what you're looking for? Try searching for a brand name or check out our popular searches above.
          </p>
        </div>
      </div>
    </div>
  );
}
