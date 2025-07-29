import React, { useState, useEffect } from 'react';
import { findCompanyLogoWithTimeout } from '@/lib/services/logo-finder';

interface ProductHeaderProps {
  product: {
    name: string;
    brand: string;
    barcode: string;
  };
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ product }) => {
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);

  // Async logo fetching for the brand
  useEffect(() => {
    const fetchBrandLogo = async () => {
      if (!product.brand || brandLogo !== null) return;
      
      setIsLoadingLogo(true);
      try {
        console.log(`🔍 Fetching brand logo for: ${product.brand}`);
        const logoUrl = await findCompanyLogoWithTimeout(product.brand, 1000);
        
        if (logoUrl) {
          console.log(`✅ Found brand logo for ${product.brand}: ${logoUrl}`);
        } else {
          console.log(`⏰ Timeout or no brand logo found for ${product.brand}`);
        }
        
        setBrandLogo(logoUrl);
      } catch (error) {
        console.warn(`⚠️ Brand logo fetch failed for ${product.brand}:`, error);
        setBrandLogo(null);
      } finally {
        setIsLoadingLogo(false);
      }
    };

    fetchBrandLogo();
  }, [product.brand, brandLogo]);

  return (
    <div className="flex flex-col items-start gap-1 mb-4">
      <div className="flex items-center gap-2">
        {/* Brand Logo or Loading Spinner */}
        <div className="flex items-center justify-center w-8 h-8">
          {brandLogo ? (
            <img 
              src={brandLogo} 
              alt={`${product.brand} logo`}
              className="w-8 h-8 object-contain rounded-full"
              onError={() => {
                // Fallback if logo fails to load
                setBrandLogo(null);
              }}
            />
          ) : isLoadingLogo ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
              {product.brand.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500">{product.brand}</div>
      </div>
      <div className="text-lg font-bold leading-tight">{product.name}</div>
      <div className="text-xs text-gray-400">Barcode: {product.barcode}</div>
    </div>
  );
};

export default ProductHeader; 