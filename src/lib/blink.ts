import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'minimal-budget-management-system-2cc4wxqd',
  auth: {
    mode: 'managed'
  }
})
