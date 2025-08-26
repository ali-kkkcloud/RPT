'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Car, AlertTriangle, Zap, Download, RefreshCw } from 'lucide-react'
import OfflineReportsTab from './components/OfflineReportsTab'
import AIAlertsTab from './components/AIAlertsTab'
import SpeedAlarmTab from './components/SpeedAlarmTab'
import { getAvailableDates } from './lib/sheets'

export default function FleetDashboard() {
  const [activeTab, setActiveTab] = useState('offline')
  const [selectedDate, setSelectedDate] = useState('25 August')
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadAvailableDates()
  }, [])

  const loadAvailableDates = async () => {
    try {
      const dates = await getAvailableDates('speed')
      setAvailableDates(dates)
    } catch (error) {
      console.error('Error loading dates:', error)
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    try {
      // Force refresh of current tab data
      setLastUpdated(new Date())
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
    } finally {
      setIsLoading(false)
    }
  }

  const exportReport = () => {
    // Export functionality
    const data = `Fleet Management Report - ${selectedDate}\nGenerated: ${new Date().toLocaleString()}\n\nTab: ${activeTab}`
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fleet-report-${selectedDate.replace(' ', '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'offline', label: 'Offline Reports', icon: Car, color: 'bg-blue-500' },
    { id: 'ai-alerts', label: 'AI Alerts', icon: AlertTriangle, color: 'bg-orange-500' },
    { id: 'speed', label: 'Speed Alarm', icon: Zap, color: 'bg-red-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  G4S Fleet Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Selector */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availableDates.map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={refreshData}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <button
                onClick={exportReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 pb-4">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${isActive 
                      ? `${tab.color} text-white shadow-lg transform scale-105` 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'offline' && (
          <OfflineReportsTab selectedDate={selectedDate} refreshTrigger={lastUpdated} />
        )}
        {activeTab === 'ai-alerts' && (
          <AIAlertsTab selectedDate={selectedDate} refreshTrigger={lastUpdated} />
        )}
        {activeTab === 'speed' && (
          <SpeedAlarmTab selectedDate={selectedDate} refreshTrigger={lastUpdated} />
        )}
      </div>
    </div>
  )
}
