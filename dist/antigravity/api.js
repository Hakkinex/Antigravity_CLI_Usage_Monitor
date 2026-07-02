import { getAccountManager, saveCache, isCacheValid, loadCache, getCacheAge } from './accounts/index.js';
import { fetchQuota } from './quota/service.js';
import { resetTokenManager } from './google/token-manager.js';
function expectedSourceForMethod(method) {
    if (method === 'google')
        return 'google';
    if (method === 'local')
        return 'local';
    return undefined;
}
export async function fetchQuotaSnapshot(options = {}) {
    const manager = getAccountManager();
    const originalActiveEmail = manager.getActiveEmail();
    const targetEmail = options.accountEmail;
    const requestedMethod = options.method ?? 'auto';
    let accountSwitched = false;
    if (requestedMethod !== 'local' && targetEmail && targetEmail !== originalActiveEmail) {
        manager.setActiveAccount(targetEmail);
        resetTokenManager();
        accountSwitched = true;
    }
    try {
        const method = targetEmail && requestedMethod !== 'google' && requestedMethod !== 'local' ? 'google' : requestedMethod;
        const snapshot = await fetchQuota(method);
        if (targetEmail || snapshot.email)
            saveCache(targetEmail ?? snapshot.email ?? '', snapshot);
        return snapshot;
    }
    finally {
        if (accountSwitched && originalActiveEmail) {
            manager.setActiveAccount(originalActiveEmail);
            resetTokenManager();
        }
    }
}
export async function fetchAllQuotaSnapshots(options = {}) {
    const manager = getAccountManager();
    const method = options.method ?? 'auto';
    const emails = options.accountEmail ? [options.accountEmail] : manager.getAccountEmails();
    const activeEmail = manager.getActiveEmail() ?? undefined;
    if (emails.length === 0) {
        return [{ email: options.accountEmail ?? 'global', isActive: false, status: 'error', error: 'No accounts found. Run auth flow before watching real quota.' }];
    }
    if (method === 'local') {
        return fetchLocalQuotaSnapshots(options, activeEmail);
    }
    const results = [];
    for (const email of emails) {
        const isActive = email === activeEmail;
        try {
            if (!options.refresh && isCacheValid(email, { method, source: expectedSourceForMethod(method) })) {
                const cached = loadCache(email);
                if (cached) {
                    results.push({ email, isActive, status: 'cached', snapshot: cached, cacheAge: getCacheAge(email) ?? 0 });
                    continue;
                }
            }
            const snapshot = await fetchQuotaSnapshot({ method: options.method, accountEmail: email, refresh: options.refresh });
            saveCache(email, snapshot);
            results.push({ email, isActive, status: 'success', snapshot });
        }
        catch (error) {
            const cached = loadCache(email);
            if (cached) {
                results.push({ email, isActive, status: 'cached', snapshot: cached, cacheAge: getCacheAge(email) ?? 0 });
            }
            else {
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
async function fetchLocalQuotaSnapshots(options, activeEmail) {
    const requestedEmail = options.accountEmail;
    if (requestedEmail && activeEmail && requestedEmail !== activeEmail) {
        return [
            {
                email: requestedEmail,
                isActive: false,
                status: 'error',
                error: `Local method only exposes the active IDE session account (${activeEmail}). Use --method google for other accounts.`
            }
        ];
    }
    try {
        const snapshot = await fetchQuotaSnapshot({ method: 'local', refresh: options.refresh });
        const email = snapshot.email ?? requestedEmail ?? activeEmail ?? 'local';
        const isActive = email === activeEmail;
        saveCache(email, snapshot);
        return [{ email, isActive, status: 'success', snapshot }];
    }
    catch (error) {
        const email = requestedEmail ?? activeEmail ?? 'local';
        const cached = isCacheValid(email, { method: 'local', source: 'local' }) ? loadCache(email) : null;
        if (cached) {
            return [{ email, isActive: email === activeEmail, status: 'cached', snapshot: cached, cacheAge: getCacheAge(email) ?? 0 }];
        }
        return [
            {
                email,
                isActive: email === activeEmail,
                status: 'error',
                error: error instanceof Error ? error.message : String(error)
            }
        ];
    }
}
//# sourceMappingURL=api.js.map