import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Manual CRON test endpoint
 * This endpoint allows you to manually test CRON functionality without waiting for scheduled execution
 * 
 * Usage:
 * GET /api/cron/manual-test?secret=YOUR_CRON_SECRET - Test with secret
 * POST /api/cron/manual-test - Test with secret in body
 */

export async function GET(request: NextRequest) {
  console.log('🔧 Manual CRON test started (GET)')
  
  const secret = request.nextUrl.searchParams.get('secret')
  return await testCronExecution(secret, 'GET')
}

export async function POST(request: NextRequest) {
  console.log('🔧 Manual CRON test started (POST)')
  
  try {
    const body = await request.json()
    const secret = body.secret
    return await testCronExecution(secret, 'POST')
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid JSON in request body',
      expected: { secret: 'your-cron-secret' },
      example: 'curl -X POST /api/cron/manual-test -H "Content-Type: application/json" -d \'{"secret":"your-cron-secret"}\''
    }, { status: 400 })
  }
}

async function testCronExecution(providedSecret: string | null, method: string) {
  const startTime = Date.now()
  const timestamp = new Date()
  
  // Environment and timing info
  const info = {
    method,
    timestamp: timestamp.toISOString(),
    italyTime: new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(timestamp),
    utcTime: timestamp.toUTCString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL
  }
  
  console.log('📊 Test Info:', info)
  
  // Secret validation
  const expectedSecret = process.env.CRON_SECRET
  const hasExpectedSecret = !!expectedSecret
  const hasProvidedSecret = !!providedSecret
  const secretMatch = providedSecret === expectedSecret
  
  const secretInfo = {
    hasExpectedSecret,
    expectedSecretLength: expectedSecret?.length || 0,
    hasProvidedSecret,
    providedSecretLength: providedSecret?.length || 0,
    secretMatch,
    secretPreview: providedSecret ? 
      `${providedSecret.substring(0, 4)}...${providedSecret.substring(Math.max(4, providedSecret.length - 4))}` : 
      'Not provided'
  }
  
  console.log('🔐 Secret validation:', secretInfo)
  
  // If no secret provided, return instructions
  if (!hasProvidedSecret) {
    return NextResponse.json({
      error: 'No secret provided',
      instructions: {
        get: '/api/cron/manual-test?secret=YOUR_CRON_SECRET',
        post: 'Send POST with JSON body: {"secret": "YOUR_CRON_SECRET"}',
        curl: 'curl -X POST /api/cron/manual-test -H "Content-Type: application/json" -d \'{"secret":"YOUR_CRON_SECRET"}\''
      },
      info
    }, { status: 400 })
  }
  
  // Environment secret check
  if (!hasExpectedSecret) {
    console.error('❌ CRON_SECRET not set in environment!')
    return NextResponse.json({
      error: 'CRON_SECRET not configured in environment variables',
      fix: 'Set CRON_SECRET in Vercel Dashboard > Settings > Environment Variables',
      info,
      secretInfo: { hasExpectedSecret: false }
    }, { status: 500 })
  }
  
  // Secret authentication
  if (!secretMatch) {
    console.error('❌ Secret mismatch!')
    return NextResponse.json({
      error: 'Secret does not match CRON_SECRET',
      info,
      secretInfo: {
        expectedLength: expectedSecret.length,
        providedLength: providedSecret.length,
        match: false
      }
    }, { status: 401 })
  }
  
  console.log('✅ Secret validation passed!')
  
  // Simulate CRON work - test the actual sync-week endpoint
  let testResults = {
    syncWeek: { success: false, error: 'Not tested' },
    completeSync: { success: false, error: 'Not tested' },
    generateTips: { success: false, error: 'Not tested' }
  }
  
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    console.log('🧪 Testing sync-week endpoint...')
    const syncResponse = await fetch(`${baseUrl}/api/cron/sync-week?secret=${expectedSecret}`, {
      method: 'GET',
      headers: { 'User-Agent': 'Manual-CRON-Test' }
    })
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json()
      testResults.syncWeek = { success: true, data: syncData }
      console.log('✅ sync-week test passed')
    } else {
      const errorText = await syncResponse.text()
      testResults.syncWeek = { success: false, error: `${syncResponse.status}: ${errorText}` }
      console.log('❌ sync-week test failed:', syncResponse.status)
    }
    
  } catch (error) {
    testResults.syncWeek = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
    console.error('❌ Error testing sync-week:', error)
  }
  
  const executionTime = Date.now() - startTime
  
  const result = {
    success: true,
    message: 'Manual CRON test completed successfully',
    executionTime: `${executionTime}ms`,
    info,
    secretValidation: {
      passed: true,
      secretLength: providedSecret.length
    },
    tests: testResults,
    nextSteps: [
      'If sync-week test passed, your CRON endpoints are working correctly',
      'Check Vercel Function Logs to see if scheduled CRONs are being triggered',
      'Verify CRON_SECRET is set in Vercel Dashboard environment variables',
      'Remember: CRONs only work in production, not preview deployments'
    ],
    timezone: {
      utc: timestamp.toISOString(),
      italy: info.italyTime,
      note: 'Vercel CRONs run in UTC. 00:01 UTC = 01:01/02:01 Italy time'
    }
  }
  
  console.log(`✅ Manual test completed in ${executionTime}ms`)
  
  return NextResponse.json(result)
}