"use client";

import { ProductResult } from "./ProductResult";

type Props = any;
// This wrapper simply forwards props to the existing client component.
export default function ProductResultClient(props: Props) {
  return <ProductResult {...props} />;
}
