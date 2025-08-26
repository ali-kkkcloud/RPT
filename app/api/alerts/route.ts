import { NextRequest, NextResponse } from 'next/server'
import { fetchAIAlerts } from '../../lib/sheets'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || '25 August'

    const data = await fetchAIAlerts(date)
    
    // Calculate analytics
    const totalAlerts = data.length
    const uniqueVehicles = new Set(data.map(alert => alert.plateNo)).size
    
    // Vehicle alert counts
    const vehicleAlerts = data.reduce((acc, alert) => {
      acc[alert.plateNo] = (acc[alert.plateNo] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    const topVehicle = Object.entries(vehicleAlerts)
      .sort((a, b) => b[1] - a[1])[0]
    const leastAlertVehicle = Object.entries(vehicleAlerts)
      .sort((a, b) => a[1] - b[1])[0]

    // Alert type distribution
    const alertTypes = data.reduce((acc, alert) => {
      const type = alert.alarmType || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    // Company distribution
    const companyDistribution = data.reduce((acc, alert) => {
      acc[alert.company] = (acc[alert.company] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    // Hourly distribution
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const alertsInHour = data.filter(alert => {
        const time = alert.startingTime
        const alertHour = parseInt(time?.split(':')[0] || '0')
        return alertHour === hour
      }).length
      return { hour, alerts: alertsInHour }
    })

    return NextResponse.json({
      success: true,
      data,
      date,
      analytics: {
        totalAlerts,
        uniqueVehicles,
        topVehicle: topVehicle ? { vehicle: topVehicle[0], count: topVehicle[1] } : null,
        leastAlertVehicle: leastAlertVehicle ? { vehicle: leastAlertVehicle[0], count: leastAlertVehicle[1] } : null,
        alertTypes,
        companyDistribution,
        hourlyDistribution: hourlyDistribution.filter(h => h.alerts > 0),
        avgAlertsPerVehicle: uniqueVehicles > 0 ? Math.round(totalAlerts / uniqueVehicles) : 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in alerts API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch AI alerts data',
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
