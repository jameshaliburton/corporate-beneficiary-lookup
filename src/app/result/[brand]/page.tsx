'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ProductResult } from '@/components/ProductResult';
import { AppHeader } from '@/components/AppHeader';
import { transformPipelineData, type PipelineResult } from '@/lib/utils/pipeline-transformer';
import Head from 'next/head';

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const brandSlug = params.brand as string;
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      console.log('🔄 Already processed, skipping...');
      return;
    }
    
    console.log('📄 Result page loaded for brand:', brandSlug);
    console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
    
    const success = searchParams.get('success');
    const errorParam = searchParams.get('error');
    
    if (success === 'false' || errorParam) {
      console.error('❌ Error from URL params:', errorParam);
      setError(errorParam || 'Unknown error occurred');
      setIsLoading(false);
      hasProcessed.current = true;
      return;
    }
    
    if (success === 'true') {
      // Check if we have stored API response in sessionStorage
      const storedPipelineResult = sessionStorage.getItem('pipelineResult');
      
      if (storedPipelineResult) {
        try {
          console.log('📦 Found stored pipeline result in sessionStorage');
          const parsedResult = JSON.parse(storedPipelineResult);
          
          console.log('✅ Retrieved stored pipeline result:', {
            success: parsedResult.success,
            brand: parsedResult.brand,
            confidence: parsedResult.confidence_score,
            hasGeneratedCopy: !!parsedResult.generated_copy,
            generatedCopyKeys: parsedResult.generated_copy ? Object.keys(parsedResult.generated_copy) : []
          });
          
          // Log the actual generated_copy content
          if (parsedResult.generated_copy) {
            console.log('🎨 Retrieved generated copy content:', JSON.stringify(parsedResult.generated_copy, null, 2));
          }
          
          setPipelineResult(parsedResult);
          setIsLoading(false);
          
          // Clear the stored data to prevent reuse
          sessionStorage.removeItem('pipelineResult');
          hasProcessed.current = true;
          return;
        } catch (err) {
          console.error('❌ Error parsing stored pipeline result:', err);
          // Fall back to mock data
        }
      }
      
      // Fall back to mock data if no stored result
      console.log('⚠️ No stored pipeline result found, using mock data');
      const brand = searchParams.get('brand');
      const confidence = searchParams.get('confidence');
      
      console.log('✅ Success params received:', { brand, confidence });
      
      // Use mock data as fallback
      simulatePipelineResult(brand || 'unknown');
    } else {
      console.warn('⚠️ No success parameter found in URL');
      setError('No scan result found. Please try scanning again.');
      setIsLoading(false);
    }
    
    hasProcessed.current = true;
  }, [brandSlug, searchParams]);

  const simulatePipelineResult = async (brand: string) => {
    try {
      console.log('🔄 Simulating pipeline result for brand:', brand);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create mock data based on the brand
      const mockData: PipelineResult = {
        success: true,
        brand: brand,
        financial_beneficiary: getMockOwner(brand),
        confidence_score: 85,
        ownership_flow: getMockOwnershipFlow(brand),
        reasoning: getMockReasoning(brand),
        generated_copy: getMockGeneratedCopy(brand),
        agent_execution_trace: {
          sections: [
            {
              title: "Vision Analysis",
              stages: [
                { stage: "image_processing", status: "success", details: "Image processed successfully" },
                { stage: "ocr_extraction", status: "success", details: "Text extracted from image" }
              ]
            },
            {
              title: "Ownership Research", 
              stages: [
                { stage: "cache_check", status: "success", details: "Cache checked" },
                { stage: "llm_analysis", status: "success", details: "LLM analysis completed" }
              ]
            }
          ]
        }
      };
      
      setPipelineResult(mockData);
    } catch (err) {
      console.error('❌ Error simulating pipeline result:', err);
      setError('Failed to process scan result. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMockOwner = (brand: string): string => {
    const owners: Record<string, string> = {
      'nike': 'Nike Inc.',
      'apple': 'Apple Inc.',
      'coca-cola': 'The Coca-Cola Company',
      'loreal': 'L\'Oréal Group',
      'unknown': 'Unknown Owner'
    };
    return owners[brand.toLowerCase()] || `${brand} Inc.`;
  };

  const getMockOwnershipFlow = (brand: string) => {
    const flows: Record<string, any[]> = {
      'nike': [
        { name: 'Nike', type: 'Brand', country: 'United States', flag: '🇺🇸', ultimate: false },
        { name: 'Nike Inc.', type: 'Ultimate Owner', country: 'United States', flag: '🇺🇸', ultimate: true }
      ],
      'apple': [
        { name: 'Apple', type: 'Brand', country: 'United States', flag: '🇺🇸', ultimate: false },
        { name: 'Apple Inc.', type: 'Ultimate Owner', country: 'United States', flag: '🇺🇸', ultimate: true }
      ],
      'coca-cola': [
        { name: 'Coca-Cola', type: 'Brand', country: 'United States', flag: '🇺🇸', ultimate: false },
        { name: 'The Coca-Cola Company', type: 'Ultimate Owner', country: 'United States', flag: '🇺🇸', ultimate: true }
      ],
      'loreal': [
        { name: 'L\'Oréal Paris', type: 'Brand', country: 'France', flag: '🇫🇷', ultimate: false },
        { name: 'L\'Oréal Group', type: 'Ultimate Owner', country: 'France', flag: '🇫🇷', ultimate: true }
      ]
    };
    return flows[brand.toLowerCase()] || [
      { name: brand, type: 'Brand', country: 'Unknown', flag: '🏳️', ultimate: false },
      { name: `${brand} Inc.`, type: 'Ultimate Owner', country: 'Unknown', flag: '🏳️', ultimate: true }
    ];
  };

  const getMockReasoning = (brand: string): string => {
    const reasoning: Record<string, string> = {
      'nike': 'Nike is a publicly traded company (NYSE: NKE) headquartered in Beaverton, Oregon. The company was founded in 1964 and has maintained its independence as a public company.',
      'apple': 'Apple is one of the most valuable companies in the world, publicly traded on NASDAQ (AAPL). The company was founded in 1976 and maintains its independence.',
      'coca-cola': 'The Coca-Cola Company is a publicly traded company (NYSE: KO) headquartered in Atlanta, Georgia. Founded in 1892, it remains an independent public company.',
      'loreal': 'L\'Oréal Group is a publicly traded company on Euronext Paris. Founded in 1909, it is headquartered in France and maintains its independence.'
    };
    return reasoning[brand.toLowerCase()] || `Analysis of ${brand} ownership structure completed successfully.`;
  };

  const getMockGeneratedCopy = (brand: string) => {
    const copy: Record<string, any> = {
      'nike': {
        headline: 'Nike isn\'t as independent as you think 👀',
        subheadline: 'It\'s owned by Nike Inc. (USA)',
        description: 'Nike is a publicly traded company headquartered in Oregon, USA. The company maintains its independence as a global athletic footwear and apparel leader.',
        countryFact: 'This brand is ultimately controlled from the United States 🇺🇸',
        traceSummary: {
          vision: 'Analyzed the product photo and detected the Nike logo and branding details.',
          retrieval: 'Fetched corporate ownership data from company filings and global databases.',
          mapping: 'Confirmed Nike Inc. (USA) as the ultimate parent company.'
        }
      },
      'apple': {
        headline: 'Apple isn\'t as independent as you think 👀',
        subheadline: 'It\'s owned by Apple Inc. (USA)',
        description: 'Apple is one of the most valuable companies in the world, publicly traded on NASDAQ. The company maintains its independence as a global technology leader.',
        countryFact: 'This brand is ultimately controlled from the United States 🇺🇸',
        traceSummary: {
          vision: 'Analyzed the product photo and detected the Apple logo and packaging details.',
          retrieval: 'Fetched corporate ownership data from company filings and global databases.',
          mapping: 'Confirmed Apple Inc. (USA) as the ultimate parent company.'
        }
      },
      'coca-cola': {
        headline: 'Coca-Cola isn\'t as independent as you think 👀',
        subheadline: 'It\'s owned by The Coca-Cola Company (USA)',
        description: 'The Coca-Cola Company is a publicly traded company headquartered in Atlanta, Georgia. Founded in 1892, it remains an independent public company.',
        countryFact: 'This brand is ultimately controlled from the United States 🇺🇸',
        traceSummary: {
          vision: 'Analyzed the product photo and detected the Coca-Cola logo and packaging details.',
          retrieval: 'Fetched corporate ownership data from company filings and global databases.',
          mapping: 'Confirmed The Coca-Cola Company (USA) as the ultimate parent company.'
        }
      },
      'loreal': {
        headline: 'L\'Oréal isn\'t as independent as you think 👀',
        subheadline: 'It\'s owned by L\'Oréal Group (France)',
        description: 'L\'Oréal Group is a publicly traded company on Euronext Paris. Founded in 1909, it is headquartered in France and maintains its independence.',
        countryFact: 'This brand is ultimately controlled from France 🇫🇷',
        traceSummary: {
          vision: 'Analyzed the product photo and detected the L\'Oréal logo and packaging details.',
          retrieval: 'Fetched corporate ownership data from company filings and global databases.',
          mapping: 'Confirmed L\'Oréal Group (France) as the ultimate parent company.'
        }
      }
    };
    return copy[brand.toLowerCase()] || {
      headline: `${brand} isn't as independent as you think 👀`,
      subheadline: `It's owned by ${brand} Inc. (Unknown)`,
      description: `Analysis of ${brand} ownership structure completed successfully.`,
      countryFact: 'This brand is ultimately controlled from an unknown country',
      traceSummary: {
        vision: `Analyzed the product photo and detected the ${brand} logo and packaging details.`,
        retrieval: 'Fetched corporate ownership data from company filings and global databases.',
        mapping: `Confirmed ${brand} Inc. as the ultimate parent company.`
      }
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark-gradient">
        <AppHeader />
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-body text-muted-foreground">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background dark-gradient">
        <AppHeader />
        <div className="container mx-auto max-w-md px-4 pt-4">
          <div className="text-center">
            <h1 className="text-headline mb-2">Scan Failed</h1>
            <p className="text-body text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!pipelineResult) {
    return (
      <div className="min-h-screen bg-background dark-gradient">
        <AppHeader />
        <div className="container mx-auto max-w-md px-4 pt-4">
          <div className="text-center">
            <h1 className="text-headline mb-2">No Results</h1>
            <p className="text-body text-muted-foreground mb-6">No scan results found. Please try scanning again.</p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-md"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Transform the pipeline data to ProductResult props
  const productResultProps = transformPipelineData(pipelineResult);

  return (
    <>
      <Head>
        <title>{productResultProps.generatedCopy?.headline || `${productResultProps.brand} – Owned by ${productResultProps.owner}`}</title>
        <meta name="description" content={productResultProps.generatedCopy?.description || `Discover who owns ${productResultProps.brand}`} />
        <meta property="og:title" content={productResultProps.generatedCopy?.headline || `${productResultProps.brand} – Owned by ${productResultProps.owner}`} />
        <meta property="og:description" content={productResultProps.generatedCopy?.description || `Discover who owns ${productResultProps.brand}`} />
        <meta property="og:image" content={productResultProps.productImage || '/logo.png'} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={productResultProps.generatedCopy?.headline || `${productResultProps.brand} – Owned by ${productResultProps.owner}`} />
        <meta name="twitter:description" content={productResultProps.generatedCopy?.description || `Discover who owns ${productResultProps.brand}`} />
        <meta name="twitter:image" content={productResultProps.productImage || '/logo.png'} />
      </Head>
      <div className="min-h-screen bg-background dark-gradient">
        <AppHeader />
        <div className="container mx-auto max-w-md px-4 pt-4">
          <ProductResult {...productResultProps} />
        </div>
      </div>
    </>
  );
} 