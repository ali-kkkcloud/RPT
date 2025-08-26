'use client'

import React, { useState, useEffect } from 'react'
import { Car, Clock, MapPin, Edit3, Save, X } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { fetchOfflineReports, OfflineReportData } from '../lib/sheets'
import { supabase, OfflineStatus } from '../lib/supabase'

interface OfflineReportsTabProps {
  selectedDate: string
  refreshTrigger: Date
}

const statusOptions = [
  { value: 'Online', label: '✅ Online', color: '#10B981' },
  { value: 'Parking/Garage', label: '🚗 Parking/Garage', color: '#3B82F6' },
  { value: 'Dashcam Issue', label: '🔴 Dashcam Issue', color: '#EF4444' },
  { value: 'Technical Problem', label: '⚠️ Technical Problem', color: '#F59E0B' }
]

export default function OfflineReportsTab({ selectedDate, refreshTrigger }: OfflineReportsTabProps) {
  const [data, setData] = useState<OfflineReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null)
  const [statusUpdates, setStatusUpdates] = useState<{ [key: string]: OfflineStatus }>({})

  useEffect(() => {
    loadData()
    loadStatusUpdates()
  }, [selectedDate, refreshTrigger])

  const loadData = async () => {
    setLoading(true)
    try {
      const reports = await fetchOfflineReports()
      setData(reports)
    } catch (error) {
      console.error('Error loading offline reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatusUpdates = async () => {
    try {
      const { data: statusData, error } = await supabase
        .from('offline_status')
        .select('*')
      
      if (error) throw error
      
      const statusMap: { [key: string]: OfflineStatus } = {}
      statusData?.forEach(status => {
        statusMap[status.vehicle_number] = status
      })
      setStatusUpdates(statusMap)
    } catch (error) {
      console.error('Error loading status updates:', error)
    }
  }

  const updateVehicleStatus = async (vehicleNumber: string, status: string, reason: string = '') => {
    try {
      const { data, error } = await supabase
        .from('offline_status')
        .upsert({
          vehicle_number: vehicleNumber,
          current_status: status,
          reason,
          updated_at: new Date().toISOString(),
          updated_by: 'Admin'
        })
        .select()
        .single()

      if (error) throw error

      setStatusUpdates(prev => ({
        ...prev,
        [vehicleNumber]: data
      }))
      
      setEditingVehicle(null)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status. Please try again.')
    }
  }

  // Analytics Data
  const totalOffline = data.length
  const statusDistribution = statusOptions.map(status => ({
    name: status.label,
    value: data.filter(item => statusUpdates[item.vehicleNumber]?.current_status === status.value).length,
    color: status.color
  }))

  const regionDistribution = data.reduce((acc, item) => {
    const region = item.vehicleNumber.substring(0, 2) // Extract region from vehicle number
    acc[region] = (acc[region] || 0) + 1
    return acc
  }, {} as { [key: string]: number })

  const regionChartData = Object.entries(regionDistribution).map(([region, count]) => ({
    region,
    count
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Offline</p>
              <p className="text-3xl font-bold text-red-600">{totalOffline}</p>
            </div>
            <Car className="h-12 w-12 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Parking/Garage</p>
              <p className="text-3xl font-bold text-blue-600">
                {statusDistribution.find(s => s.name.includes('Parking'))?.value || 0}
              </p>
            </div>
            <MapPin className="h-12 w-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Technical Issues</p>
              <p className="text-3xl font-bold text-orange-600">
                {statusDistribution.find(s => s.name.includes('Technical'))?.value || 0}
              </p>
            </div>
            <Clock className="h-12 w-12 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Offline</p>
              <p className="text-3xl font-bold text-purple-600">
                {totalOffline > 0 ? Math.round(data.reduce((sum, item) => sum + item.offlineSince, 0) / totalOffline) : 0}h
              </p>
            </div>
            <Clock className="h-12 w-12 text-purple-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Offline Vehicles ({totalOffline})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Online</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Offline Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {data.map((vehicle, index) => {
                const currentStatus = statusUpdates[vehicle.vehicleNumber]
                const isEditing = editingVehicle === vehicle.vehicleNumber
                
                return (
                  <tr key={vehicle.vehicleNumber} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {vehicle.vehicleNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {vehicle.lastOnline}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        vehicle.offlineSince > 48 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {vehicle.offlineSince}h
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <select
                          defaultValue={currentStatus?.current_status || 'Parking/Garage'}
                          className="px-2 py-1 border rounded-md text-sm"
                          onChange={(e) => {
                            const reason = prompt('Reason (optional):') || ''
                            updateVehicleStatus(vehicle.vehicleNumber, e.target.value, reason)
                          }}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          currentStatus?.current_status === 'Online' ? 'bg-green-100 text-green-800' :
                          currentStatus?.current_status === 'Parking/Garage' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {statusOptions.find(s => s.value === currentStatus?.current_status)?.label || '🔴 Offline'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {currentStatus?.reason || vehicle.remarks || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingVehicle(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingVehicle(vehicle.vehicleNumber)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
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
