import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { lookupProduct } from '@/lib/apis/barcode-lookup.js';
import { getOwnershipKnowledge } from '@/lib/agents/knowledge-agent.js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const barcode = body.barcode;
    if (!barcode || typeof barcode !== 'string') {
      return NextResponse.json({ success: false, error: 'Barcode is required.' }, { status: 400 });
    }

    // 1. Check Supabase for cached result
    const { data: cached, error: cacheError } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();
    if (cacheError) {
      return NextResponse.json({ success: false, error: cacheError.message }, { status: 500 });
    }
    if (cached) {
      return NextResponse.json({
        success: true,
        ...cached,
        result_type: 'cached',
      });
    }

    // 2. Product lookup
    console.log('[lookup] Looking up product metadata for barcode:', barcode);
    const product = await lookupProduct(barcode);
    console.log('[lookup] Product metadata result:', product);
    if (!product || !product.success) {
      return NextResponse.json({
        success: false,
        error: 'No product found for this barcode and pipeline is not ready.',
      }, { status: 404 });
    }

    // 3. Ownership resolution
    console.log('[ownership] Resolving ownership for:', product.product_name, product.brand);
    let ownership;
    try {
      ownership = await getOwnershipKnowledge(
        product.product_name,
        product.brand,
        product.source,
        product.region_hint
      );
      console.log('[ownership] Ownership agent result:', ownership);
    } catch (err) {
      console.error('[ownership] Ownership agent error:', err);
      return NextResponse.json({
        success: false,
        error: 'Ownership agent failed: ' + (err.message || err),
      }, { status: 500 });
    }

    // 4. Combine product and ownership
    const newProduct = {
      barcode,
      product_name: product.product_name || null,
      brand: product.brand || null,
      financial_beneficiary: ownership.financial_beneficiary || null,
      beneficiary_country: ownership.beneficiary_country || null,
      confidence_score: ownership.confidence_score || null,
      ownership_structure_type: ownership.ownership_structure_type || null,
    };

    // 5. Upsert into Supabase
    const { data: upserted, error: upsertError } = await supabase
      .from('products')
      .upsert([newProduct], { onConflict: 'barcode' })
      .select()
      .maybeSingle();
    if (upsertError) {
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...upserted,
      result_type: 'ai',
    });
  } catch (err: any) {
    console.error('[pipeline] Fatal error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
} 