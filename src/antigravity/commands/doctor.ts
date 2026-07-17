/**
 * Doctor command - diagnostics and troubleshooting
 */

import { getTokenManager } from '../google/token-manager.js'
import { getStorageInfo } from '../google/storage.js'
import { getConfigDir, getPlatform } from '../core/env.js'
import { maskEmail } from '../core/mask.js'
import { version } from '../version.js'

export function doctorCommand(): void {
  console.log()
  console.log('🩺 agy-monitor - Diagnostics')
  console.log('═'.repeat(50))
  console.log()
  
  // Version info
  console.log('📦 Version')
  console.log('─'.repeat(40))
  console.log(`  CLI version: ${version}`)
  console.log(`  Node.js: ${process.version}`)
  console.log(`  Platform: ${getPlatform()}`)
  console.log()
  
  // Config paths
  const storage = getStorageInfo()
  console.log('📁 Configuration')
  console.log('─'.repeat(40))
  console.log(`  Config dir: ${storage.configDir}`)
  console.log(`  Tokens file: ${storage.tokensPath}`)
  console.log(`  Tokens exist: ${storage.exists ? 'Yes' : 'No'}`)
  console.log()
  
  // Auth status
  const tokenManager = getTokenManager()
  console.log('🔐 Authentication')
  console.log('─'.repeat(40))
  
  if (!tokenManager.isLoggedIn()) {
    console.log('  Status: Not logged in')
    console.log()
    console.log('  💡 Run `agy-monitor login` to authenticate.')
  } else {
    console.log('  Status: Logged in')
    
    const email = tokenManager.getEmail()
    if (email) {
      console.log(`  Email: ${maskEmail(email)}`)
    }
    
    const expiresAt = tokenManager.getExpiresAt()
    if (expiresAt) {
      const isExpired = tokenManager.isTokenExpired()
      console.log(`  Token expires: ${expiresAt.toLocaleString()}`)
      console.log(`  Token valid: ${isExpired ? 'No (needs refresh)' : 'Yes'}`)
    }
  }
  
  console.log()
  
  // Environment variables
  console.log('🔧 OAuth Configuration')
  console.log('─'.repeat(40))
  const hasClientId = !!process.env.ANTIGRAVITY_OAUTH_CLIENT_ID
  const hasClientSecret = !!process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET
  
  if (hasClientId && hasClientSecret) {
    console.log('  ✅ Using custom OAuth credentials')
    console.log(`    ANTIGRAVITY_OAUTH_CLIENT_ID: ${hasClientId ? 'Set' : 'Not set'}`)
    console.log(`    ANTIGRAVITY_OAUTH_CLIENT_SECRET: ${hasClientSecret ? 'Set' : 'Not set'}`)
  } else if (hasClientId || hasClientSecret) {
    console.log('  ❌ Custom OAuth override is incomplete')
    console.log(`    ANTIGRAVITY_OAUTH_CLIENT_ID: ${hasClientId ? 'Set' : 'Not set'}`)
    console.log(`    ANTIGRAVITY_OAUTH_CLIENT_SECRET: ${hasClientSecret ? 'Set' : 'Not set'}`)
    console.log('  💡 Set both variables or unset both to use the built-in upstream credentials.')
  } else {
    console.log('  ✅ Using built-in OAuth credentials from antigravity-usage upstream')
    console.log('  💡 Set both environment variables only when overriding the built-in client.')
  }
  
  console.log()
}
