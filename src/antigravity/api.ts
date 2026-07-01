import { getAccountManager, saveCache, isCacheValid, loadCache, getCacheAge } from './accounts/index.js';
import { fetchQuota, type QuotaMethod } from './quota/service.js';
import { resetTokenManager } from './google/token-manager.js';
import type { QuotaSnapshot } from './quota/types.js';

export type { ModelQuotaInfo, QuotaMethod, QuotaSnapshot, QuotaWindow } from './quota/types.js';

export type AccountQuotaResult =
  | { email: string; isActive: boolean; status: 'success'; snapshot: QuotaSnapshot }
  | { email: string; isActive: boolean; status: 'cached'; snapshot: QuotaSnapshot; cacheAge: number }
  | { email: string; isActive: boolean; status: 'error'; error: string };

export type FetchQuotaOptions = {
  method?: QuotaMethod;
  accountEmail?: string;
  refresh?: boolean;
};

export async function fetchQuotaSnapshot(options: FetchQuotaOptions = {}): Promise<QuotaSnapshot> {
  const manager = getAccountManager();
  const originalActiveEmail = manager.getActiveEmail();
  const targetEmail = options.accountEmail;
  let accountSwitched = false;

  if (targetEmail && targetEmail !== originalActiveEmail) {
    manager.setActiveAccount(targetEmail);
    resetTokenManager();
    accountSwitched = true;
  }

  try {
    const method = targetEmail && options.method !== 'google' ? 'google' : options.method ?? 'auto';
    const snapshot = await fetchQuota(method);
    if (targetEmail || snapshot.email) saveCache(targetEmail ?? snapshot.email ?? '', snapshot);
    return snapshot;
  } finally {
    if (accountSwitched && originalActiveEmail) {
      manager.setActiveAccount(originalActiveEmail);
      resetTokenManager();
    }
  }
}

export async function fetchAllQuotaSnapshots(options: FetchQuotaOptions = {}): Promise<AccountQuotaResult[]> {
  const manager = getAccountManager();
  const emails = options.accountEmail ? [options.accountEmail] : manager.getAccountEmails();
  const activeEmail = manager.getActiveEmail();

  if (emails.length === 0) {
    return [{ email: options.accountEmail ?? 'global', isActive: false, status: 'error', error: 'No accounts found. Run auth flow before watching real quota.' }];
  }

  const results: AccountQuotaResult[] = [];
  for (const email of emails) {
    const isActive = email === activeEmail;
    try {
      if (!options.refresh && isCacheValid(email)) {
        const cached = loadCache(email);
        if (cached) {
          results.push({ email, isActive, status: 'cached', snapshot: cached, cacheAge: getCacheAge(email) ?? 0 });
          continue;
        }
      }

      const snapshot = await fetchQuotaSnapshot({ method: options.method, accountEmail: email, refresh: options.refresh });
      saveCache(email, snapshot);
      results.push({ email, isActive, status: 'success', snapshot });
    } catch (error) {
      const cached = loadCache(email);
      if (cached) {
        results.push({ email, isActive, status: 'cached', snapshot: cached, cacheAge: getCacheAge(email) ?? 0 });
      } else {
        results.push({
          email,
          isActive,
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  return results;
}
