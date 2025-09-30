import { NextRequest, NextResponse } from 'next/server';
import { GeminiOwnershipAnalysisAgent, isGeminiOwnershipAnalysisAvailable, testGeminiV1Endpoint } from '@/lib/agents/gemini-ownership-analysis-agent.js';
import { ClaudeVerificationAgent, isClaudeVerificationAvailable } from '@/lib/agents/claude-verification-agent.js';

/**
 * Debug route for testing Gemini-Claude fallback system
 * Internal development use only - not linked in UI
 */
export async function GET(request: NextRequest) {
  try {
    // Simple authentication gate for debug route
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.DEBUG_AUTH_TOKEN;
    
    if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - debug route requires authentication'
      }, { status: 401 });
    }
    
    console.log('[DEBUG_GEMINI] Starting Gemini fallback system test');
    
    // Test environment detection
    const environmentCheck = {
      geminiAvailable: isGeminiOwnershipAnalysisAvailable(),
      claudeAvailable: isClaudeVerificationAvailable(),
      geminiSafeMode: process.env.GEMINI_SAFE_MODE || 'false',
      geminiApiKey: process.env.GEMINI_API_KEY ? 'Present' : 'Missing',
      googleApiKey: process.env.GOOGLE_API_KEY ? 'Present' : 'Missing',
      anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'Present' : 'Missing',
      geminiFlashV1Enabled: process.env.GEMINI_FLASH_V1_ENABLED === 'true'
    };

    console.log('[DEBUG_GEMINI] Environment check:', environmentCheck);

    // Test Gemini v1 endpoint first
    console.log('[DEBUG_GEMINI] Testing Gemini v1 endpoint...');
    let v1TestResult = null;
    try {
      v1TestResult = await testGeminiV1Endpoint();
      console.log('[DEBUG_GEMINI] V1 endpoint test result:', v1TestResult);
    } catch (error) {
      console.error('[DEBUG_GEMINI] V1 endpoint test failed:', error);
      v1TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test cases
    const testCases = [
      {
        name: 'Non-Medical Brand (Should use Gemini)',
        brand: 'Pop-Tarts',
        product: 'Frosted Cookies & Crème',
        expectedAgent: 'gemini',
        expectedLog: 'gemini_analysis_success'
      },
      {
        name: 'Medical Brand (Should use Claude)',
        brand: 'Sudafed',
        product: 'Cold Medicine',
        expectedAgent: 'claude',
        expectedLog: 'claude_fallback_success'
      },
      {
        name: 'Medical Brand - Boots Pharmacy (Should use Claude)',
        brand: 'Boots Pharmacy',
        product: 'Boots Pharmacy',
        expectedAgent: 'claude',
        expectedLog: 'claude_fallback_success'
      }
    ];

    const results = [];
    const complianceLogs = [];

    // Capture console logs for compliance tracking
    const originalLog = console.log;
    const capturedLogs: string[] = [];
    
    console.log = (...args) => {
      const logMessage = args.join(' ');
      capturedLogs.push(logMessage);
      originalLog(...args);
    };

    for (const testCase of testCases) {
      console.log(`\n[DEBUG_GEMINI] Testing: ${testCase.name}`);
      
      try {
        // Create mock existing result for testing
        const mockExistingResult = {
          financial_beneficiary: 'Test Company',
          confidence_score: 75,
          result_type: 'test',
          sources: ['test_source'],
          agent_path: ['test_agent']
        };

        // Test the agent
        const geminiAgent = new GeminiOwnershipAnalysisAgent();
        const startTime = Date.now();
        
        const result = await geminiAgent.analyze(
          testCase.brand,
          testCase.product,
          mockExistingResult
        );
        
        const duration = Date.now() - startTime;
        
        // Determine which agent was used
        const usedGemini = result.verification_method?.includes('gemini');
        const usedClaude = result.verification_method?.includes('claude');
        const actualAgent = usedGemini ? 'gemini' : usedClaude ? 'claude' : 'unknown';
        
        // Check if expected agent was used
        const agentCorrect = actualAgent === testCase.expectedAgent;
        
        // Check for expected compliance logs
        const relevantLogs = capturedLogs.filter(log => 
          log.includes(testCase.expectedLog) || 
          log.includes('COMPLIANCE_LOG') ||
          log.includes('GEMINI_ROUTE_SKIPPED') ||
          log.includes('FALLBACK_TRIGGERED')
        );

        const testResult = {
          testCase: testCase.name,
          brand: testCase.brand,
          product: testCase.product,
          expectedAgent: testCase.expectedAgent,
          actualAgent,
          agentCorrect,
          verificationMethod: result.verification_method,
          verificationStatus: result.verification_status,
          agentPath: result.agent_path,
          duration: `${duration}ms`,
          complianceLogs: relevantLogs,
          success: agentCorrect && relevantLogs.length > 0
        };

        results.push(testResult);
        
        console.log(`[DEBUG_GEMINI] ${testCase.name}: ${agentCorrect ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   Expected: ${testCase.expectedAgent}, Got: ${actualAgent}`);
        console.log(`   Method: ${result.verification_method}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Compliance Logs: ${relevantLogs.length}`);

      } catch (error) {
        console.error(`[DEBUG_GEMINI] Error testing ${testCase.name}:`, error);
        results.push({
          testCase: testCase.name,
          brand: testCase.brand,
          product: testCase.product,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    // Restore original console.log
    console.log = originalLog;

    // Collect all compliance logs
    const allComplianceLogs = capturedLogs.filter(log => 
      log.includes('COMPLIANCE_LOG') ||
      log.includes('GEMINI_ROUTE_SKIPPED') ||
      log.includes('FALLBACK_TRIGGERED') ||
      log.includes('gemini_analysis_success') ||
      log.includes('claude_fallback_success')
    );

    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      environment: environmentCheck,
      v1EndpointTest: v1TestResult,
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      successRate: Math.round((results.filter(r => r.success).length / results.length) * 100),
      complianceLogsFound: allComplianceLogs.length,
      geminiFallbackSystem: {
        working: results.filter(r => r.actualAgent === 'gemini').length > 0,
        claudeFallbackWorking: results.filter(r => r.actualAgent === 'claude').length > 0,
        medicalBrandDetection: results.filter(r => r.brand.includes('Sudafed') || r.brand.includes('Boots')).every(r => r.actualAgent === 'claude'),
        v1EndpointWorking: v1TestResult?.success === true
      }
    };

    console.log('[DEBUG_GEMINI] Test summary:', summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      v1EndpointTest: v1TestResult,
      complianceLogs: allComplianceLogs,
      environment: environmentCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG_GEMINI] Debug route error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
