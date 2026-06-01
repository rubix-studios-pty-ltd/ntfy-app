import { type DayKey, type ScheduleDays } from '@/types/schedule'

export const DaysOfWeek: Array<{
  key: DayKey
  label: string
}> = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
]

export const defaultSchedule: ScheduleDays = {
  monday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
  tuesday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
  wednesday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
  thursday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
  friday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
  saturday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
  sunday: {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
  },
}
