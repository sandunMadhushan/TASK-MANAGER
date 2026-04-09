import crypto from 'crypto'

import { env } from '../config/env.js'

export function createNovuSubscriberHash(subscriberId) {
  if (!env.novuSecretKey || !subscriberId) return null

  return crypto
    .createHmac('sha256', env.novuSecretKey)
    .update(String(subscriberId))
    .digest('hex')
}
