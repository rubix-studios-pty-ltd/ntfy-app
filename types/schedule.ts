export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ScheduleConfig = {
  enabled: boolean
  startTime: string
  endTime: string
}

export type ScheduleDays = Record<DayKey, ScheduleConfig>

export interface Schedule {
  scheduleEnabled: boolean
  days: ScheduleDays
}
