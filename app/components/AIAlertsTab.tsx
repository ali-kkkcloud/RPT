'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Eye, Camera, Shield, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts'
import { fetchAIAlerts, AIAlertData } from '../lib/sheets'

interface AIAlertsTabProps {
  selectedDate: string
  refreshTrigger: Date
}

const alertTypeColors: { [key: string]: string } = {
  'Distracted Driving Alarm Level One': '#EF4444',
  'Call Alarm Level One': '#F59E0B',
  'Unfastened Seat Belt Level One': '#8B5CF6',
  'Drowsiness Detection': '#EC4899',
  'Smoking Detection': '#6B7280',
  'Phone Usage': '#10B981',
  'Unknown': '#6B7280'
}

const alertTypeIcons: { [key: string]: React.ComponentType<any> } = {
  'Distracted Driving Alarm Level One': Eye,
  'Call Alarm Level One': Camera,
  'Unfastened Seat Belt Level One': Shield,
  'Drowsiness Detection': AlertTriangle,
  'Smoking Detection': AlertTriangle,
  'Phone Usage': Camera,
  'Unknown': AlertTriangle
}

export default function AIAlertsTab({ selectedDate, refreshTrigger }: AIAlertsTabProps) {
  const [data, setData] = useState<AIAlertData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate, refreshTrigger])

  const loadData = async () => {
    setLoading(true)
    try {
      const alerts = await fetchAIAlerts(selectedDate)
      setData(alerts)
    } catch (error) {
      console.error('Error loading AI alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Analytics calculations
  const totalAlerts = data.length
  const uniqueVehicles = new Set(data.map(alert => alert.plateNo)).size
  const mostAlertVehicle = data.reduce((acc, alert) => {
    acc[alert.plateNo] = (acc[alert.plateNo] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const topVehicle = Object.entries(mostAlertVehicle).sort((a, b) => b[1] - a[1])[0]
  const leastAlertVehicle = Object.entries(mostAlertVehicle).sort((a, b) => a[1] - b[1])[0]

  // Vehicle-wise alerts for bar chart
  const vehicleAlerts = Object.entries(mostAlertVehicle)
    .map(([vehicle, count]) => ({ vehicle: vehicle.slice(-6), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10 vehicles

  // Alert type distribution for pie chart
  const alertTypeDistribution = data.reduce((acc, alert) => {
    const type = alert.alarmType || 'Unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const alertTypeChartData = Object.entries(alertTypeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
    color: alertTypeColors[type] || '#6B7280'
  }))

  // Company-wise distribution
  const companyDistribution = data.reduce((acc, alert) => {
    acc[alert.company] = (acc[alert.company] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const companyChartData = Object.entries(companyDistribution).map(([company, count]) => ({
    company,
    count
  }))

  // Hourly trend (mock data based on starting times)
  const hourlyTrend = Array.from({ length: 24 }, (_, hour) => {
    const alertsInHour = data.filter(alert => {
      const time = alert.startingTime
      const alertHour = parseInt(time?.split(':')[0] || '0')
      return alertHour === hour
    }).length
    
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      alerts: alertsInHour
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total AI Alerts</p>
              <p className="text-3xl font-bold">{totalAlerts}</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Vehicles with Alerts</p>
              <p className="text-3xl font-bold">{uniqueVehicles}</p>
            </div>
            <Camera className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Highest Alerts</p>
              <p className="text-2xl font-bold">{topVehicle?.[0]?.slice(-6) || 'N/A'}</p>
              <p className="text-sm text-green-200">{topVehicle?.[1] || 0} alerts</p>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Lowest Alerts</p>
              <p className="text-2xl font-bold">{leastAlertVehicle?.[0]?.slice(-6) || 'N/A'}</p>
              <p className="text-sm text-purple-200">{leastAlertVehicle?.[1] || 0} alerts</p>
            </div>
            <Shield className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle-wise Alerts Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Vehicles by Alerts</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleAlerts} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="vehicle" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Type Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alert Type Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertTypeChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}`}
                >
                  {alertTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Alert Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={10}
                  interval={2}
                />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="alerts" 
                  stroke="#F59E0B" 
                  fill="#F59E0B" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company-wise Alerts</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="company" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alert Details Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent AI Alerts ({totalAlerts} total)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alert Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {data.slice(0, 20).map((alert, index) => {
                const IconComponent = alertTypeIcons[alert.alarmType] || AlertTriangle
                const color = alertTypeColors[alert.alarmType] || '#6B7280'
                
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {alert.plateNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {alert.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="h-4 w-4" style={{ color }} />
                        <span 
                          className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: color }}
                        >
                          {alert.alarmType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {alert.startingTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {alert.imageLink ? (
                        <a 
                          href={alert.imageLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <Camera className="h-4 w-4" />
                          <span>View Image</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {data.length > 20 && (
          <div className="p-4 text-center text-gray-500">
            Showing 20 of {totalAlerts} alerts. Use export function to download complete data.
          </div>
        )}
      </div>
    </div>
  )
}
