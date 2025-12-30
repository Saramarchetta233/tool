import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date()
  
  // Comprehensive timestamp logging for timezone debugging
  const timeInfo = {
    utc: timestamp.toISOString(),
    utcTimestamp: timestamp.getTime(),
    localString: timestamp.toString(),
    timezone: timestamp.getTimezoneOffset(),
    timezoneHours: timestamp.getTimezoneOffset() / 60,
    italyTime: new Intl.DateTimeFormat('it-IT', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'long'
    }).format(timestamp)
  }
  
  console.log('🧪 CRON TEST ENDPOINT CALLED')
  console.log('⏰ Execution Time Info:', JSON.stringify(timeInfo, null, 2))
  
  // Check request source and headers
  const requestInfo = {
    userAgent: request.headers.get('user-agent') || 'Not provided',
    xForwardedFor: request.headers.get('x-forwarded-for') || 'Not provided',
    xRealIp: request.headers.get('x-real-ip') || 'Not provided',
    referer: request.headers.get('referer') || 'Not provided',
    host: request.headers.get('host') || 'Not provided',
    vercelRegion: request.headers.get('x-vercel-deployment-url') || 'Not provided',
    cronHeader: request.headers.get('x-vercel-cron') || 'Not provided'
  }
  
  console.log('📡 Request Info:', JSON.stringify(requestInfo, null, 2))
  
  // Environment info
  const envInfo = {
    vercelUrl: process.env.VERCEL_URL || 'Not set',
    nodeEnv: process.env.NODE_ENV || 'Not set',
    vercelEnv: process.env.VERCEL_ENV || 'Not set',
    hasCronSecret: !!process.env.CRON_SECRET,
    cronSecretLength: process.env.CRON_SECRET?.length || 0
  }
  
  console.log('🌍 Environment Info:', JSON.stringify(envInfo, null, 2))
  
  // CRON Secret verification
  const cronSecret = request.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET
  
  const secretInfo = {
    hasProvidedSecret: !!cronSecret,
    hasExpectedSecret: !!expectedSecret,
    providedSecretLength: cronSecret?.length || 0,
    expectedSecretLength: expectedSecret?.length || 0,
    secretsMatch: cronSecret === expectedSecret,
    secretValidationPassed: false
  }
  
  console.log('🔐 Secret Validation Info:', {
    ...secretInfo,
    providedSecretPreview: cronSecret ? `${cronSecret.substring(0, 4)}...${cronSecret.substring(cronSecret.length - 4)}` : 'None',
    expectedSecretPreview: expectedSecret ? `${expectedSecret.substring(0, 4)}...${expectedSecret.substring(expectedSecret.length - 4)}` : 'None'
  })
  
  // Validate secret unless we're in development mode
  if (process.env.NODE_ENV === 'production') {
    if (!expectedSecret) {
      console.error('❌ CRON_SECRET not configured in production!')
      return NextResponse.json({
        error: 'CRON_SECRET not configured',
        timestamp: timeInfo,
        environment: envInfo
      }, { status: 500 })
    }
    
    if (cronSecret !== expectedSecret) {
      console.error('❌ CRON authentication failed in production!')
      return NextResponse.json({
        error: 'Unauthorized - Invalid CRON secret',
        secretInfo: {
          hasProvidedSecret: !!cronSecret,
          providedSecretLength: cronSecret?.length || 0
        },
        timestamp: timeInfo
      }, { status: 401 })
    }
  }
  
  secretInfo.secretValidationPassed = true
  
  // Test the primary CRON schedule (00:01 UTC)
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setUTCDate(now.getUTCDate() + 1)
  nextMidnight.setUTCHours(0, 1, 0, 0) // 00:01 UTC
  
  const timeTo0001UTC = nextMidnight.getTime() - now.getTime()
  const hoursTo0001 = Math.floor(timeTo0001 / (1000 * 60 * 60))
  const minutesTo0001 = Math.floor((timeTo0001 % (1000 * 60 * 60)) / (1000 * 60))
  
  // Italy timezone calculations (UTC+1 or UTC+2)
  const italyNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }))
  const nextMidnightItaly = new Date(italyNow)
  nextMidnightItaly.setDate(italyNow.getDate() + 1)
  nextMidnightItaly.setHours(0, 1, 0, 0)
  
  const scheduleInfo = {
    currentUTC: now.toISOString(),
    currentItaly: italyNow.toLocaleString('it-IT'),
    next0001UTC: nextMidnight.toISOString(),
    next0001Italy: nextMidnightItaly.toLocaleString('it-IT'),
    timeUntilNext0001: `${hoursTo0001}h ${minutesTo0001}m`,
    isCurrently0001UTC: now.getUTCHours() === 0 && now.getUTCMinutes() === 1,
    currentUTCHour: now.getUTCHours(),
    currentUTCMinute: now.getUTCMinutes()
  }
  
  console.log('📅 Schedule Info:', JSON.stringify(scheduleInfo, null, 2))
  
  // Check if this might be a real CRON execution
  const isPossibleCronExecution = 
    requestInfo.userAgent.includes('vercel') || 
    requestInfo.cronHeader !== 'Not provided' ||
    (now.getUTCHours() === 0 && now.getUTCMinutes() <= 5) // Within 5 minutes of midnight UTC
  
  // Simulated work to test timeout handling
  console.log('🔄 Starting simulated work...')
  await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
  
  const executionTime = Date.now() - startTime
  console.log(`✅ CRON test completed in ${executionTime}ms`)
  
  const result = {
    success: true,
    message: 'CRON test endpoint executed successfully',
    executionTime: `${executionTime}ms`,
    timestamp: timeInfo,
    request: requestInfo,
    environment: envInfo,
    secretValidation: secretInfo,
    schedule: scheduleInfo,
    isPossibleCronExecution,
    vercelCronHeaders: {
      hasCronHeader: requestInfo.cronHeader !== 'Not provided',
      cronHeaderValue: requestInfo.cronHeader
    },
    troubleshooting: {
      timezone: 'Vercel CRONs run in UTC. Your 00:01 CRON runs at 01:01 Italy time (UTC+1) or 02:01 during DST (UTC+2)',
      cronActive: 'CRONs only work in production deployment on Vercel, not in preview or development',
      secretRequired: 'CRON_SECRET must be set in Vercel environment variables and match the URL parameter',
      logs: 'Check Vercel Function Logs for CRON execution traces'
    }
  }
  
  console.log('📤 CRON Test Result:', JSON.stringify(result, null, 2))
  
  return NextResponse.json(result)
}

// Manual test endpoint (no auth required for debugging)
export async function POST(request: NextRequest) {
  console.log('🧪 MANUAL CRON TEST CALLED')
  
  try {
    const body = await request.json()
    const testSecret = body.secret
    
    if (!testSecret) {
      return NextResponse.json({
        error: 'Please provide a secret in the request body to test authentication',
        example: { secret: 'your-cron-secret' }
      }, { status: 400 })
    }
    
    // Test the secret against the environment
    const expectedSecret = process.env.CRON_SECRET
    const secretMatch = testSecret === expectedSecret
    
    console.log('🔐 Manual secret test:', {
      hasExpectedSecret: !!expectedSecret,
      testSecretLength: testSecret.length,
      expectedSecretLength: expectedSecret?.length || 0,
      match: secretMatch
    })
    
    return NextResponse.json({
      success: true,
      message: 'Manual CRON test completed',
      secretTest: {
        provided: testSecret.substring(0, 4) + '...' + testSecret.substring(testSecret.length - 4),
        match: secretMatch,
        recommendation: secretMatch ? 'Secret is correct' : 'Secret does not match CRON_SECRET environment variable'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Manual CRON test failed:', error)
    return NextResponse.json({
      error: 'Failed to parse request body',
      expected: { secret: 'your-cron-secret' }
    }, { status: 400 })
  }
}