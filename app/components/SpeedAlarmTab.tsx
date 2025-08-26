'use client'

import React, { useState, useEffect } from 'react'
import { Zap, TrendingUp, AlertTriangle, Trophy, Gauge } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts'
import { fetchSpeedAlarms, SpeedAlarmData } from '../lib/sheets'

interface SpeedAlarmTabProps {
  selectedDate: string
  refreshTrigger: Date
}

// Speed categories
const getSpeedCategory = (speed: number) => {
  if (speed >= 90) return { category: 'Alarm', color: '#EF4444', icon: '🚨' }
  if (speed >= 75) return { category: 'Warning', color: '#F59E0B', icon: '⚠️' }
  return { category: 'Normal', color: '#10B981', icon: '✅' }
}

export default function SpeedAlarmTab({ selectedDate, refreshTrigger }: SpeedAlarmTabProps) {
  const [data, setData] = useState<SpeedAlarmData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate, refreshTrigger])

  const loadData = async () => {
    setLoading(true)
    try {
      const speedData = await fetchSpeedAlarms(selectedDate)
      setData(speedData)
    } catch (error) {
      console.error('Error loading speed alarms:', error)
    } finally {
      setLoading(false)
    }
  }

  // Analytics calculations
  const totalViolations = data.length
  const warnings = data.filter(item => item.speed >= 75 && item.speed < 90).length
  const alarms = data.filter(item => item.speed >= 90).length
  const maxSpeed = Math.max(...data.map(item => item.speed), 0)
  const highestSpeedVehicle = data.find(item => item.speed === maxSpeed)

  // Vehicle-wise overspeeding
  const vehicleStats = data.reduce((acc, item) => {
    const vehicle = item.plateNo
    if (!acc[vehicle]) {
      acc[vehicle] = { 
        vehicle: vehicle.slice(-6),
        fullVehicle: vehicle,
        warnings: 0, 
        alarms: 0, 
        maxSpeed: 0, 
        totalViolations: 0,
        company: item.company 
      }
    }
    
    acc[vehicle].totalViolations++
    acc[vehicle].maxSpeed = Math.max(acc[vehicle].maxSpeed, item.speed)
    
    if (item.speed >= 90) acc[vehicle].alarms++
    else if (item.speed >= 75) acc[vehicle].warnings++
    
    return acc
  }, {} as { [key: string]: any })

  const vehicleChartData = Object.values(vehicleStats)
    .sort((a: any, b: any) => b.totalViolations - a.totalViolations)
    .slice(0, 10) // Top 10 vehicles

  // Speed distribution for pie chart
  const speedDistribution = [
    { name: '75-84 km/h (Warning)', value: data.filter(item => item.speed >= 75 && item.speed < 85).length, color: '#F59E0B' },
    { name: '85-89 km/h (High Warning)', value: data.filter(item => item.speed >= 85 && item.speed < 90).length, color: '#FB7185' },
    { name: '90+ km/h (Alarm)', value: data.filter(item => item.speed >= 90).length, color: '#EF4444' }
  ].filter(item => item.value > 0)

  // Company-wise violations
  const companyStats = data.reduce((acc, item) => {
    acc[item.company] = (acc[item.company] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const companyChartData = Object.entries(companyStats).map(([company, count]) => ({
    company,
    violations: count
  }))

  // Hourly speed pattern
  const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
    const violations = data.filter(item => {
      const time = item.startingTime
      const itemHour = parseInt(time?.split(':')[0] || '0')
      return itemHour === hour
    }).length
    
    const avgSpeed = data
      .filter(item => {
        const time = item.startingTime
        const itemHour = parseInt(time?.split(':')[0] || '0')
        return itemHour === hour
      })
      .reduce((sum, item, _, arr) => sum + item.speed / arr.length, 0) || 0

    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      violations,
      avgSpeed: Math.round(avgSpeed)
    }
  })

  // Speed ranges for histogram
  const speedRanges = [
    { range: '75-79', count: data.filter(item => item.speed >= 75 && item.speed < 80).length },
    { range: '80-84', count: data.filter(item => item.speed >= 80 && item.speed < 85).length },
    { range: '85-89', count: data.filter(item => item.speed >= 85 && item.speed < 90).length },
    { range: '90-94', count: data.filter(item => item.speed >= 90 && item.speed < 95).length },
    { range: '95-99', count: data.filter(item => item.speed >= 95 && item.speed < 100).length },
    { range: '100+', count: data.filter(item => item.speed >= 100).length }
  ].filter(item => item.count > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Total Violations</p>
              <p className="text-3xl font-bold">{totalViolations}</p>
            </div>
            <Zap className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Warnings</p>
              <p className="text-3xl font-bold">{warnings}</p>
              <p className="text-xs text-orange-200">75-89 km/h</p>
            </div>
            <AlertTriangle className="h-12 w-12 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Alarms</p>
              <p className="text-3xl font-bold">{alarms}</p>
              <p className="text-xs text-red-200">90+ km/h</p>
            </div>
            <Gauge className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Highest Speed</p>
              <p className="text-3xl font-bold">{maxSpeed}</p>
              <p className="text-xs text-purple-200">km/h</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">Top Violator</p>
              <p className="text-lg font-bold">{highestSpeedVehicle?.plateNo.slice(-6) || 'N/A'}</p>
              <p className="text-xs text-indigo-200">{highestSpeedVehicle?.speed} km/h</p>
            </div>
            <Trophy className="h-12 w-12 text-indigo-200" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle-wise Violations */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 10 Vehicles by Violations</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="vehicle" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Vehicle: ${label}`}
                />
                <Bar dataKey="warnings" stackId="a" fill="#F59E0B" name="Warnings" />
                <Bar dataKey="alarms" stackId="a" fill="#EF4444" name="Alarms" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Speed Category Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={speedDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value, percent }) => `${(percent * 100).toFixed(1)}%`}
                >
                  {speedDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Pattern */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hourly Violation Pattern</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyPattern}>
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
                  dataKey="violations" 
                  stroke="#EF4444" 
                  fill="#EF4444" 
                  fillOpacity={0.3}
                  name="Violations"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed Range Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Speed Range Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={speedRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="count" 
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                  name="Violations"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Company Performance */}
      {companyChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company-wise Violations</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="company" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="violations" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Vehicle Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Speed Violations Details ({totalViolations} total)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Speed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Warnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alarms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Violations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {Object.values(vehicleStats)
                .sort((a: any, b: any) => b.totalViolations - a.totalViolations)
                .map((vehicle: any, index) => {
                  const speedCat = getSpeedCategory(vehicle.maxSpeed)
                  
                  return (
                    <tr key={vehicle.fullVehicle} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {vehicle.fullVehicle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {vehicle.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: speedCat.color }}
                        >
                          {vehicle.maxSpeed} km/h
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          {vehicle.warnings}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {vehicle.alarms}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {vehicle.totalViolations}
                        </span>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
