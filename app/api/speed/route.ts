import { NextRequest, NextResponse } from 'next/server'
import { fetchSpeedAlarms } from '../../lib/sheets'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || '25 August'

    const data = await fetchSpeedAlarms(date)
    
    // Calculate analytics
    const totalViolations = data.length
    const warnings = data.filter(item => item.speed >= 75 && item.speed < 90).length
    const alarms = data.filter(item => item.speed >= 90).length
    const maxSpeed = Math.max(...data.map(item => item.speed), 0)
    const avgSpeed = data.length > 0 
      ? Math.round(data.reduce((sum, item) => sum + item.speed, 0) / data.length)
      : 0

    // Vehicle stats
    const vehicleStats = data.reduce((acc, item) => {
      const vehicle = item.plateNo
      if (!acc[vehicle]) {
        acc[vehicle] = { violations: 0, maxSpeed: 0, warnings: 0, alarms: 0 }
      }
      acc[vehicle].violations++
      acc[vehicle].maxSpeed = Math.max(acc[vehicle].maxSpeed, item.speed)
      if (item.speed >= 90) acc[vehicle].alarms++
      else if (item.speed >= 75) acc[vehicle].warnings++
      return acc
    }, {} as any)

    return NextResponse.json({
      success: true,
      data,
      date,
      analytics: {
        totalViolations,
        warnings,
        alarms,
        maxSpeed,
        avgSpeed,
        uniqueVehicles: Object.keys(vehicleStats).length,
        topViolator: Object.entries(vehicleStats)
          .sort(([,a]: any, [,b]: any) => b.violations - a.violations)[0]?.[0] || null
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in speed API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch speed alarm data',
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
