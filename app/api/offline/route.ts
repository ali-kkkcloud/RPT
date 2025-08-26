import { NextRequest, NextResponse } from 'next/server'
import { fetchOfflineReports } from '../../lib/sheets'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long' 
    })

    const data = await fetchOfflineReports()
    
    return NextResponse.json({
      success: true,
      data,
      date,
      timestamp: new Date().toISOString(),
      count: data.length
    })
  } catch (error) {
    console.error('Error in offline API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch offline reports',
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
