import React from 'react';

interface ProductHeaderProps {
  product: {
    name: string;
    brand: string;
    barcode: string;
  };
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ product }) => {
  return (
    <div className="flex flex-col items-start gap-1 mb-4">
      <div className="text-xs text-gray-500">{product.brand}</div>
      <div className="text-lg font-bold leading-tight">{product.name}</div>
      <div className="text-xs text-gray-400">Barcode: {product.barcode}</div>
    </div>
  );
};

export default ProductHeader; 