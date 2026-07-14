/**
 * Login command - authenticate with Google
 * 
 * This is kept for backward compatibility.
 * For multi-account management, use `agy-monitor accounts add`
 */

import { startOAuthFlow } from '../google/oauth.js'
import { getAccountManager } from '../accounts/index.js'
import { success, error as logError, info } from '../core/logger.js'
import { resetTokenManager } from '../google/token-manager.js'

interface LoginOptions {
  noBrowser?: boolean
  port?: number
  manual?: boolean
}

export async function loginCommand(options: LoginOptions): Promise<void> {
  const manager = getAccountManager()
  const existingAccounts = manager.getAccountEmails()
  
  if (existingAccounts.length > 0) {
    info(`You have ${existingAccounts.length} account(s). Adding another account...`)
  }
  
  let result
  try {
    result = await startOAuthFlow({
      noBrowser: options.noBrowser,
      port: options.port,
      manual: options.manual
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logError(`Login failed: ${message}`)
    if (message.includes('ANTIGRAVITY_OAUTH_CLIENT_ID') || message.includes('ANTIGRAVITY_OAUTH_CLIENT_SECRET')) {
      info('')
      info('Set `ANTIGRAVITY_OAUTH_CLIENT_ID` and `ANTIGRAVITY_OAUTH_CLIENT_SECRET`, then log in again.')
    }
    process.exit(1)
  }
  
  if (result.success) {
    // Reset token manager to pick up new active account
    resetTokenManager()
    
    success(`Logged in successfully${result.email ? ` as ${result.email}` : ''}!`)
    
    const accounts = manager.getAccountEmails()
    if (accounts.length > 1) {
      info(`\nYou now have ${accounts.length} accounts. Use \`agy-monitor accounts list\` to see all.`)
    }
    
    process.exit(0)
  } else {
    logError(`Login failed: ${result.error}`)
    process.exit(1)
  }
}
