import { checkBarcodeExists, insertProduct, getProductByBarcode, logScan } from './src/lib/database/products.js'

async function runTests() {
  try {
    // 1. Check for non-existent barcode
    const barcode = '4902201746640'
    const exists = await checkBarcodeExists(barcode)
    console.log(`Barcode ${barcode} exists?`, exists)

    // 2. Insert test product
    if (!exists) {
      const product = {
        barcode: barcode,
        product_name: 'Kit Kat Japan',
        brand: 'Nestlé',
        financial_beneficiary: 'Nestlé S.A.',
        beneficiary_country: 'Switzerland',
        confidence_score: 98,
        ownership_structure_type: 'direct',
      }
      const inserted = await insertProduct(product)
      console.log('Inserted product:', inserted)
    }

    // 3. Retrieve the product
    const retrieved = await getProductByBarcode(barcode)
    console.log('Retrieved product:', retrieved)

    // 4. Log a scan
    const scan = await logScan(barcode, 'cached')
    console.log('Logged scan:', scan)
  } catch (err) {
    console.error('Test error:', err)
  }
}

runTests() 