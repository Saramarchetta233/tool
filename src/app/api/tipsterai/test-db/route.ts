import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  console.log('🧪 Testing database insertion...')
  
  try {
    const today = new Date().toISOString().split('T')[0]
    
    const testData = {
      tip_type: 'singola',
      matches: [{
        fixture_id: 123456,
        match: "Test vs Test",
        league: "Test League",
        prediction: "1",
        odds: 2.00,
        confidence: 75,
        reasoning: "Test reasoning"
      }],
      odds: 2.00,
      confidence: 'ALTA',
      reasoning: 'Test strategy reasoning',
      valid_until: today,
      result: 'pending',
      created_at: new Date().toISOString()
    }
    
    console.log('📝 Inserting test data:', JSON.stringify(testData, null, 2))
    
    const { data, error } = await supabaseAdmin
      .from('tips')
      .insert(testData)
      .select()
    
    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        testData
      }, { status: 500 })
    }
    
    console.log('✅ Test data inserted successfully:', data)
    
    // Verifica lettura
    const { data: readData, error: readError } = await supabaseAdmin
      .from('tips')
      .select('*')
      .eq('tip_type', 'singola')
      .eq('valid_until', today)
    
    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      insertedData: data,
      readData,
      readError
    })
    
  } catch (error: any) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}