'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProductResult } from '@/components/ProductResult';
import { AppHeader } from '@/components/AppHeader';

interface PipelineResult {
  success: boolean;
  product_name?: string;
  brand?: string;
  barcode?: string;
  financial_beneficiary?: string;
  beneficiary_country?: string;
  beneficiary_flag?: string;
  confidence_score?: number;
  confidence_level?: string;
  confidence_factors?: Record<string, number>;
  confidence_breakdown?: Record<string, number>;
  confidence_reasoning?: string;
  ownership_structure_type?: string;
  ownership_flow?: Array<{
    name: string;
    type?: string;
    country?: string;
    flag?: string;
    ultimate?: boolean;
  }>;
  sources?: string[];
  reasoning?: string;
  agent_execution_trace?: {
    sections?: Array<{
      id?: string;
      title?: string;
      label?: string;
      stages: Array<{
        id?: string;
        stage?: string;
        status?: string;
        details?: string;
        duration?: number;
        durationMs?: number;
        output?: any;
        notes?: string;
        variables?: any;
        intermediate?: any;
        model?: string;
        promptTemplate?: string;
        completionSample?: string;
      }>;
    }>;
    stages?: Array<{
      stage: string;
      status: string;
      details: string;
      duration?: number;
    }>;
  };
  result_type?: string;
  user_contributed?: boolean;
}

interface OwnershipNode {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
}

interface TraceData {
  stage: "vision" | "retrieval" | "ownership";
  status: "success" | "partial" | "failed";
  details: string;
  sources?: string[];
  duration?: number;
}

export default function TestSimplePipelinePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const router = useRouter();

  const testMockPipeline = async (testCase: string) => {
    setIsLoading(true);
    
    try {
      console.log(`🧪 Testing mock pipeline with: ${testCase}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create realistic mock data based on test case
      let mockResult: PipelineResult;
      
      switch (testCase) {
        case 'nike':
          mockResult = {
            success: true,
            product_name: 'Nike Air Max 270',
            brand: 'Nike',
            barcode: '1234567890123',
            financial_beneficiary: 'Nike, Inc.',
            beneficiary_country: 'United States',
            beneficiary_flag: '🇺🇸',
            confidence_score: 95,
            confidence_level: 'high',
            confidence_factors: {
              "official_sources": 95,
              "recent_data": 90,
              "cross_verification": 95
            },
            confidence_breakdown: {
              "ownership_evidence": 95,
              "source_quality": 90,
              "data_recency": 95
            },
            confidence_reasoning: "Multiple high-quality sources confirm Nike, Inc. as the ultimate parent company. Official company filings and recent financial reports provide strong evidence of ownership structure.",
            ownership_structure_type: 'Public Company',
            ownership_flow: [
              {
                name: 'Nike',
                type: 'Brand',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: false
              },
              {
                name: 'Nike, Inc.',
                type: 'Ultimate Owner',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: true
              }
            ],
            sources: [
              'Nike, Inc. Annual Report 2023',
              'SEC Filings - Nike, Inc.',
              'Bloomberg Company Profile'
            ],
            reasoning: 'Nike is a consumer brand owned by Nike, Inc. The company is publicly traded on the NYSE and headquartered in Oregon, USA. The ownership structure is well-documented through official filings and financial reports.',
            agent_execution_trace: {
              sections: [
                {
                  title: 'Data Retrieval',
                  stages: [
                    {
                      stage: 'cache_check',
                      status: 'completed',
                      details: 'Checked database for existing ownership data',
                      duration: 150,
                      output: { success: true, hit: false }
                    },
                    {
                      stage: 'ownership_mappings',
                      status: 'completed',
                      details: 'Located ownership mapping for Nike brand',
                      duration: 200,
                      output: { success: true, mapping_found: true }
                    }
                  ]
                },
                {
                  title: 'Ownership Research',
                  stages: [
                    {
                      stage: 'llm_first_analysis',
                      status: 'completed',
                      details: 'AI analysis confirmed Nike, Inc. as ultimate owner with 95% confidence',
                      duration: 3000,
                      output: { success: true, confidence: 95 }
                    },
                    {
                      stage: 'web_research',
                      status: 'completed',
                      details: 'Verified ownership through official company filings and financial reports',
                      duration: 2500,
                      output: { success: true, sources_verified: 3 }
                    },
                    {
                      stage: 'database_save',
                      status: 'completed',
                      details: 'Saved ownership result to database for future lookups',
                      duration: 300,
                      output: { success: true, saved: true }
                    }
                  ]
                }
              ]
            },
            result_type: 'llm-rag-success',
            user_contributed: false
          };
          break;
          
        case 'apple':
          mockResult = {
            success: true,
            product_name: 'iPhone 15 Pro',
            brand: 'Apple',
            barcode: '1234567890124',
            financial_beneficiary: 'Apple Inc.',
            beneficiary_country: 'United States',
            beneficiary_flag: '🇺🇸',
            confidence_score: 98,
            confidence_level: 'high',
            confidence_factors: {
              "official_sources": 98,
              "recent_data": 95,
              "cross_verification": 98
            },
            confidence_breakdown: {
              "ownership_evidence": 98,
              "source_quality": 95,
              "data_recency": 98
            },
            confidence_reasoning: "Apple Inc. is a publicly traded company with clear ownership structure. Official SEC filings and financial reports provide definitive evidence of ownership.",
            ownership_structure_type: 'Public Company',
            ownership_flow: [
              {
                name: 'Apple',
                type: 'Brand',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: false
              },
              {
                name: 'Apple Inc.',
                type: 'Ultimate Owner',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: true
              }
            ],
            sources: [
              'Apple Inc. Annual Report 2023',
              'SEC Filings - Apple Inc.',
              'Bloomberg Company Profile'
            ],
            reasoning: 'Apple is a consumer brand owned by Apple Inc. The company is publicly traded on the NASDAQ and headquartered in California, USA. The ownership structure is well-documented through official filings and financial reports.',
            agent_execution_trace: {
              sections: [
                {
                  title: 'Data Retrieval',
                  stages: [
                    {
                      stage: 'cache_check',
                      status: 'completed',
                      details: 'Checked database for existing ownership data',
                      duration: 120,
                      output: { success: true, hit: false }
                    },
                    {
                      stage: 'ownership_mappings',
                      status: 'completed',
                      details: 'Located ownership mapping for Apple brand',
                      duration: 180,
                      output: { success: true, mapping_found: true }
                    }
                  ]
                },
                {
                  title: 'Ownership Research',
                  stages: [
                    {
                      stage: 'llm_first_analysis',
                      status: 'completed',
                      details: 'AI analysis confirmed Apple Inc. as ultimate owner with 98% confidence',
                      duration: 2800,
                      output: { success: true, confidence: 98 }
                    },
                    {
                      stage: 'web_research',
                      status: 'completed',
                      details: 'Verified ownership through official company filings and financial reports',
                      duration: 2200,
                      output: { success: true, sources_verified: 3 }
                    },
                    {
                      stage: 'database_save',
                      status: 'completed',
                      details: 'Saved ownership result to database for future lookups',
                      duration: 250,
                      output: { success: true, saved: true }
                    }
                  ]
                }
              ]
            },
            result_type: 'llm-rag-success',
            user_contributed: false
          };
          break;
          
        case 'coca-cola':
          mockResult = {
            success: true,
            product_name: 'Coca-Cola Classic',
            brand: 'Coca-Cola',
            barcode: '1234567890125',
            financial_beneficiary: 'The Coca-Cola Company',
            beneficiary_country: 'United States',
            beneficiary_flag: '🇺🇸',
            confidence_score: 92,
            confidence_level: 'high',
            confidence_factors: {
              "official_sources": 92,
              "recent_data": 88,
              "cross_verification": 92
            },
            confidence_breakdown: {
              "ownership_evidence": 92,
              "source_quality": 88,
              "data_recency": 92
            },
            confidence_reasoning: "The Coca-Cola Company is a publicly traded company with well-documented ownership structure. Official filings and financial reports provide strong evidence of ownership.",
            ownership_structure_type: 'Public Company',
            ownership_flow: [
              {
                name: 'Coca-Cola',
                type: 'Brand',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: false
              },
              {
                name: 'The Coca-Cola Company',
                type: 'Ultimate Owner',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: true
              }
            ],
            sources: [
              'The Coca-Cola Company Annual Report 2023',
              'SEC Filings - The Coca-Cola Company',
              'Bloomberg Company Profile'
            ],
            reasoning: 'Coca-Cola is a consumer brand owned by The Coca-Cola Company. The company is publicly traded on the NYSE and headquartered in Georgia, USA. The ownership structure is well-documented through official filings and financial reports.',
            agent_execution_trace: {
              sections: [
                {
                  title: 'Data Retrieval',
                  stages: [
                    {
                      stage: 'cache_check',
                      status: 'completed',
                      details: 'Checked database for existing ownership data',
                      duration: 140,
                      output: { success: true, hit: false }
                    },
                    {
                      stage: 'ownership_mappings',
                      status: 'completed',
                      details: 'Located ownership mapping for Coca-Cola brand',
                      duration: 190,
                      output: { success: true, mapping_found: true }
                    }
                  ]
                },
                {
                  title: 'Ownership Research',
                  stages: [
                    {
                      stage: 'llm_first_analysis',
                      status: 'completed',
                      details: 'AI analysis confirmed The Coca-Cola Company as ultimate owner with 92% confidence',
                      duration: 3200,
                      output: { success: true, confidence: 92 }
                    },
                    {
                      stage: 'web_research',
                      status: 'completed',
                      details: 'Verified ownership through official company filings and financial reports',
                      duration: 2400,
                      output: { success: true, sources_verified: 3 }
                    },
                    {
                      stage: 'database_save',
                      status: 'completed',
                      details: 'Saved ownership result to database for future lookups',
                      duration: 280,
                      output: { success: true, saved: true }
                    }
                  ]
                }
              ]
            },
            result_type: 'llm-rag-success',
            user_contributed: false
          };
          break;
          
        case 'loreal':
          mockResult = {
            success: true,
            product_name: "L'Oréal Paris Excellence Hair Color",
            brand: "L'Oréal",
            barcode: '1234567890126',
            financial_beneficiary: "L'Oréal Group",
            beneficiary_country: 'France',
            beneficiary_flag: '🇫🇷',
            confidence_score: 85,
            confidence_level: 'high',
            confidence_factors: {
              "official_sources": 90,
              "recent_data": 85,
              "cross_verification": 80
            },
            confidence_breakdown: {
              "ownership_evidence": 90,
              "source_quality": 85,
              "data_recency": 80
            },
            confidence_reasoning: "Multiple high-quality sources confirm L'Oréal Group as the ultimate parent company. Official company filings and recent financial reports provide strong evidence of ownership structure.",
            ownership_structure_type: 'Public Company',
            ownership_flow: [
              {
                name: "L'Oréal Paris",
                type: 'Brand',
                country: 'France',
                flag: '🇫🇷',
                ultimate: false
              },
              {
                name: "L'Oréal USA",
                type: 'Regional Subsidiary',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: false
              },
              {
                name: "L'Oréal Group",
                type: 'Ultimate Owner',
                country: 'France',
                flag: '🇫🇷',
                ultimate: true
              }
            ],
            sources: [
              "L'Oréal Group Annual Report 2023",
              "SEC Filings - L'Oréal USA",
              "Bloomberg Company Profile"
            ],
            reasoning: "L'Oréal Paris is a consumer brand owned by L'Oréal USA, which is a subsidiary of L'Oréal Group. The company is publicly traded on the Euronext Paris exchange and headquartered in France. The ownership structure is well-documented through official filings and financial reports.",
            agent_execution_trace: {
              sections: [
                {
                  title: 'Data Retrieval',
                  stages: [
                    {
                      stage: 'cache_check',
                      status: 'completed',
                      details: 'Checked database for existing ownership data',
                      duration: 160,
                      output: { success: true, hit: false }
                    },
                    {
                      stage: 'ownership_mappings',
                      status: 'completed',
                      details: "Located ownership mapping for L'Oréal brand",
                      duration: 210,
                      output: { success: true, mapping_found: true }
                    }
                  ]
                },
                {
                  title: 'Ownership Research',
                  stages: [
                    {
                      stage: 'llm_first_analysis',
                      status: 'completed',
                      details: "AI analysis confirmed L'Oréal Group as ultimate owner with 85% confidence",
                      duration: 3500,
                      output: { success: true, confidence: 85 }
                    },
                    {
                      stage: 'web_research',
                      status: 'completed',
                      details: 'Verified ownership through official company filings and financial reports',
                      duration: 2600,
                      output: { success: true, sources_verified: 3 }
                    },
                    {
                      stage: 'database_save',
                      status: 'completed',
                      details: 'Saved ownership result to database for future lookups',
                      duration: 320,
                      output: { success: true, saved: true }
                    }
                  ]
                }
              ]
            },
            result_type: 'llm-rag-success',
            user_contributed: false
          };
          break;
          
        default:
          mockResult = {
            success: true,
            product_name: 'Test Product',
            brand: 'Test Brand',
            barcode: '1234567890127',
            financial_beneficiary: 'Test Company Inc.',
            beneficiary_country: 'United States',
            beneficiary_flag: '🇺🇸',
            confidence_score: 75,
            confidence_level: 'medium',
            confidence_factors: {
              "official_sources": 75,
              "recent_data": 70,
              "cross_verification": 75
            },
            confidence_breakdown: {
              "ownership_evidence": 75,
              "source_quality": 70,
              "data_recency": 75
            },
            confidence_reasoning: "Test data for demonstration purposes.",
            ownership_structure_type: 'Private Company',
            ownership_flow: [
              {
                name: 'Test Brand',
                type: 'Brand',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: false
              },
              {
                name: 'Test Company Inc.',
                type: 'Ultimate Owner',
                country: 'United States',
                flag: '🇺🇸',
                ultimate: true
              }
            ],
            sources: [
              'Test Company Filings',
              'Financial Reports',
              'Corporate Registry'
            ],
            reasoning: 'Test data for demonstration purposes.',
            agent_execution_trace: {
              sections: [
                {
                  title: 'Data Retrieval',
                  stages: [
                    {
                      stage: 'cache_check',
                      status: 'completed',
                      details: 'Checked database for existing ownership data',
                      duration: 100,
                      output: { success: true, hit: false }
                    }
                  ]
                },
                {
                  title: 'Ownership Research',
                  stages: [
                    {
                      stage: 'llm_first_analysis',
                      status: 'completed',
                      details: 'AI analysis completed for test data',
                      duration: 2000,
                      output: { success: true, confidence: 75 }
                    }
                  ]
                }
              ]
            },
            result_type: 'test-data',
            user_contributed: false
          };
      }

      console.log('📥 Generated mock pipeline result:', mockResult);
      
      setPipelineResult(mockResult);
      
      // Store in sessionStorage for results page testing
      sessionStorage.setItem('scanResult', JSON.stringify(mockResult));
      
    } catch (err) {
      console.error('❌ Mock pipeline test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Transform pipeline data to ProductResult props (same logic as results page)
  const transformPipelineData = (pipelineResult: PipelineResult) => {
    console.log('🔄 Transforming pipeline data:', {
      brand: pipelineResult.brand,
      financial_beneficiary: pipelineResult.financial_beneficiary,
      confidence_score: pipelineResult.confidence_score,
      ownership_flow: pipelineResult.ownership_flow?.length || 0,
      agent_execution_trace: pipelineResult.agent_execution_trace ? 'present' : 'missing'
    });

    // Transform ownership_flow to OwnershipNode[]
    const ownershipChain: OwnershipNode[] = pipelineResult.ownership_flow?.map((node, index) => {
      console.log(`🏢 Processing ownership node ${index}:`, node);
      return {
        name: node.name,
        country: node.country || 'Unknown',
        countryFlag: node.flag || '🏳️',
        avatar: `data:image/svg+xml;base64,${btoa(`
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="44" height="44" rx="22" fill="${index === 0 ? '#FF6B6B' : '#4ECDC4'}"/>
            <text x="22" y="28" text-anchor="middle" fill="white" font-family="Inter" font-size="16" font-weight="600">
              ${node.name.charAt(0).toUpperCase()}
            </text>
          </svg>
        `)}`
      };
    }) || [];

    // Transform agent_execution_trace to TraceData[]
    const traces: TraceData[] = [];
    if (pipelineResult.agent_execution_trace?.sections) {
      console.log('📊 Processing agent execution trace sections:', pipelineResult.agent_execution_trace.sections.length);
      
      pipelineResult.agent_execution_trace.sections.forEach((section, sectionIndex) => {
        console.log(`📋 Section ${sectionIndex}:`, section.title || section.id);
        
        section.stages.forEach((stage, stageIndex) => {
          console.log(`  Stage ${stageIndex}:`, stage.stage || stage.id, 'Status:', stage.status);
          
          // Map stage names to ProductResult stage types
          let stageType: "vision" | "retrieval" | "ownership" = "ownership";
          const stageName = stage.stage || stage.id || '';
          
          if (stageName.includes('vision') || stageName.includes('image') || stageName.includes('ocr') || stageName.includes('image_processing')) {
            stageType = "vision";
          } else if (stageName.includes('cache') || stageName.includes('lookup') || stageName.includes('api') || stageName.includes('retrieval')) {
            stageType = "retrieval";
          }

          // Map status
          let status: "success" | "partial" | "failed" = "success";
          const stageStatus = stage.status || 'completed';
          
          if (stageStatus === 'failed' || stageStatus === 'error') {
            status = "failed";
          } else if (stageStatus === 'partial' || stageStatus === 'incomplete') {
            status = "partial";
          }

          // Get details from stage output or use a default
          const details = stage.output?.details || stage.notes || stage.output?.success ? 'Completed successfully' : 'Processing...';

          traces.push({
            stage: stageType,
            status,
            details,
            duration: stage.durationMs || stage.duration
          });
        });
      });
    } else if (pipelineResult.agent_execution_trace?.stages) {
      // Handle legacy trace format
      console.log('📊 Processing legacy agent execution trace stages:', pipelineResult.agent_execution_trace.stages.length);
      
      pipelineResult.agent_execution_trace.stages.forEach((stage, index) => {
        console.log(`  Stage ${index}:`, stage.stage, 'Status:', stage.status);
        
        let stageType: "vision" | "retrieval" | "ownership" = "ownership";
        if (stage.stage.includes('vision') || stage.stage.includes('image') || stage.stage.includes('ocr')) {
          stageType = "vision";
        } else if (stage.stage.includes('cache') || stage.stage.includes('lookup') || stage.stage.includes('api')) {
          stageType = "retrieval";
        }

        let status: "success" | "partial" | "failed" = "success";
        if (stage.status === 'failed' || stage.status === 'error') {
          status = "failed";
        } else if (stage.status === 'partial' || stage.status === 'incomplete') {
          status = "partial";
        }

        traces.push({
          stage: stageType,
          status,
          details: stage.details || 'Completed successfully',
          duration: stage.duration
        });
      });
    } else {
      console.log('⚠️ No agent execution trace found in pipeline result');
    }

    const transformedData = {
      brand: pipelineResult.brand || 'Unknown Brand',
      owner: pipelineResult.financial_beneficiary || 'Unknown Owner',
      confidence: pipelineResult.confidence_score || 0,
      productImage: `data:image/svg+xml;base64,${btoa(`
        <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="128" height="128" rx="64" fill="#FF6B6B"/>
          <text x="64" y="80" text-anchor="middle" fill="white" font-family="Inter" font-size="48" font-weight="600">
            ${(pipelineResult.brand || 'P').charAt(0).toUpperCase()}
          </text>
        </svg>
      `)}`,
      ownershipChain,
      structureType: pipelineResult.ownership_structure_type,
      analysisText: pipelineResult.reasoning,
      traces,
      // Optional props
      acquisitionYear: undefined, // Not available in pipeline
      publicTicker: undefined // Not available in pipeline
    };

    console.log('✅ Transformed data:', {
      brand: transformedData.brand,
      owner: transformedData.owner,
      confidence: transformedData.confidence,
      ownershipChainLength: transformedData.ownershipChain.length,
      tracesLength: transformedData.traces.length
    });

    return transformedData;
  };

  return (
    <div className="min-h-screen bg-background dark-gradient">
      <AppHeader />
      <div className="container mx-auto max-w-md px-4 pt-4">
        <div className="text-center mb-8">
          <h1 className="text-headline mb-2">Simple Pipeline Test</h1>
          <p className="text-body text-muted-foreground">Test with realistic mock data (no API calls)</p>
        </div>
        
        {/* Test Controls */}
        <div className="space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => testMockPipeline('nike')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Nike
            </Button>
            <Button
              onClick={() => testMockPipeline('apple')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Apple
            </Button>
            <Button
              onClick={() => testMockPipeline('coca-cola')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test Coca-Cola
            </Button>
            <Button
              onClick={() => testMockPipeline('loreal')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Test L'Oréal
            </Button>
          </div>
          
          {isLoading && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-body text-muted-foreground">Generating mock data...</p>
            </div>
          )}
        </div>
        
        {/* Results */}
        {pipelineResult && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-subheadline mb-2">Pipeline Result</h2>
              <p className="text-body text-muted-foreground">
                Mock data: {pipelineResult.brand} → {pipelineResult.financial_beneficiary} ({pipelineResult.confidence_score}% confidence)
              </p>
            </div>
            
            <ProductResult {...transformPipelineData(pipelineResult)} />
            
            <div className="text-center">
              <Button
                onClick={() => router.push('/results')}
                variant="outline"
                size="sm"
              >
                Test Results Page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 