// Google Sheets Data Fetching Utilities

export interface OfflineReportData {
  client: string
  vehicleNumber: string
  lastOnline: string
  offlineSince: number
  rn: string
  remarks: string
}

export interface SpeedAlarmData {
  plateNo: string
  company: string
  startingTime: string
  speed: number
}

export interface AIAlertData {
  plateNo: string
  company: string
  alarmType: string
  startingTime: string
  imageLink: string
}

// Convert Google Sheets URL to CSV URL
function getSheetCSVUrl(sheetId: string, gid: string = '0'): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
}

// Parse CSV data
function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n')
  return lines.map(line => {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

// Fetch Offline Reports Data
export async function fetchOfflineReports(): Promise<OfflineReportData[]> {
  try {
    const sheetId = process.env.OFFLINE_SHEET_ID || '180CqEujgBjJPjP9eU8C--xMj-VTBSrRUrM_98-S0gjo'
    const url = getSheetCSVUrl(sheetId)
    
    const response = await fetch(url)
    const csvText = await response.text()
    const rows = parseCSV(csvText)
    
    // Skip header row
    const dataRows = rows.slice(1)
    
    return dataRows
      .filter(row => {
        const client = row[0]?.toLowerCase() || ''
        const offlineHours = parseFloat(row[3]) || 0
        return client.includes('g4s') && offlineHours >= 24
      })
      .map(row => ({
        client: row[0] || '',
        vehicleNumber: row[1] || '',
        lastOnline: row[2] || '',
        offlineSince: parseFloat(row[3]) || 0,
        rn: row[4] || '',
        remarks: row[5] || ''
      }))
  } catch (error) {
    console.error('Error fetching offline reports:', error)
    return []
  }
}

// Get available sheet tabs (dates)
export async function getAvailableDates(sheetId: string): Promise<string[]> {
  try {
    // This would require Google Sheets API to get sheet names
    // For now, return some sample dates
    const today = new Date()
    const dates = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long' 
      }))
    }
    return dates
  } catch (error) {
    console.error('Error getting available dates:', error)
    return ['25 August', '24 August', '23 August']
  }
}

// Fetch Speed Alarm Data
export async function fetchSpeedAlarms(date: string = '25 August'): Promise<SpeedAlarmData[]> {
  try {
    const sheetId = process.env.SPEED_SHEET_ID || '1y499rxvnlTY8JSp5eyI_ZEm_4c2rDm7hNim3VFH8PSk'
    
    // For demo purposes, using default gid. In reality, you'd need to map date to gid
    const gidMap: { [key: string]: string } = {
      '25 August': '293366971',
      '24 August': '0',
      '23 August': '1'
    }
    
    const gid = gidMap[date] || '293366971'
    const url = getSheetCSVUrl(sheetId, gid)
    
    const response = await fetch(url)
    const csvText = await response.text()
    const rows = parseCSV(csvText)
    
    return rows.slice(1).map(row => ({
      plateNo: row[1] || '',
      company: row[2] || '',
      startingTime: row[3] || '',
      speed: parseFloat(row[6]) || 0
    })).filter(item => item.plateNo && item.speed > 0)
    
  } catch (error) {
    console.error('Error fetching speed alarms:', error)
    return []
  }
}

// Fetch AI Alerts Data
export async function fetchAIAlerts(date: string = '25 August'): Promise<AIAlertData[]> {
  try {
    const sheetId = process.env.AI_ALERTS_SHEET_ID || '1Et8hgNDrZDuQbAHh7jvFpi0bsebVBcPsnZELPAYMu6U'
    
    // Similar gid mapping for AI alerts
    const gidMap: { [key: string]: string } = {
      '25 August': '1378822335',
      '24 August': '0',
      '23 August': '1'
    }
    
    const gid = gidMap[date] || '1378822335'
    const url = getSheetCSVUrl(sheetId, gid)
    
    const response = await fetch(url)
    const csvText = await response.text()
    const rows = parseCSV(csvText)
    
    return rows.slice(1).map(row => ({
      plateNo: row[1] || '',
      company: row[2] || '',
      alarmType: row[3] || '',
      startingTime: row[4] || '',
      imageLink: row[8] || ''
    })).filter(item => item.plateNo && item.alarmType)
    
  } catch (error) {
    console.error('Error fetching AI alerts:', error)
    return []
  }
}
