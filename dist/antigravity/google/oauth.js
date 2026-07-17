/**
 * OAuth configuration and flow
 */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { URL, URLSearchParams } from 'node:url';
import open from 'open';
import inquirer from 'inquirer';
import { debug, info } from '../core/logger.js';
import { getAccountManager } from '../accounts/index.js';
// OAuth configuration
const BUILT_IN_OAUTH_CLIENT_ID = '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
const BUILT_IN_OAUTH_CLIENT_SECRET = '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';
const OAUTH_CONFIG = {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/userinfo.email'
    ]
};
const GOOGLE_REQUEST_TIMEOUT_MS = 30_000;
function getOAuthCredentials() {
    const clientId = process.env.ANTIGRAVITY_OAUTH_CLIENT_ID;
    const clientSecret = process.env.ANTIGRAVITY_OAUTH_CLIENT_SECRET;
    if (Boolean(clientId) !== Boolean(clientSecret)) {
        throw new Error('Custom Google OAuth credentials are incomplete. Set both ANTIGRAVITY_OAUTH_CLIENT_ID and ANTIGRAVITY_OAUTH_CLIENT_SECRET, or unset both to use the built-in upstream credentials.');
    }
    return {
        clientId: clientId || BUILT_IN_OAUTH_CLIENT_ID,
        clientSecret: clientSecret || BUILT_IN_OAUTH_CLIENT_SECRET
    };
}
// Cloud Code API configuration
const CLOUDCODE_CONFIG = {
    baseUrl: 'https://cloudcode-pa.googleapis.com',
    userAgent: 'antigravity',
    metadata: {
        ideType: 'ANTIGRAVITY',
        platform: 'PLATFORM_UNSPECIFIED',
        pluginType: 'GEMINI'
    },
    onboardAttempts: 5,
    onboardDelayMs: 2000
};
/**
 * Generate a random state parameter for CSRF protection
 */
function generateState() {
    return randomBytes(32).toString('hex');
}
function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
/**
 * Get available port for callback server
 */
async function getAvailablePort(preferredPort) {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.listen(preferredPort || 0, '127.0.0.1', () => {
            const address = server.address();
            if (address && typeof address === 'object') {
                const port = address.port;
                server.close(() => resolve(port));
            }
            else {
                reject(new Error('Failed to get server address'));
            }
        });
        server.on('error', reject);
    });
}
/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code, redirectUri) {
    debug('oauth', 'Exchanging code for tokens');
    const credentials = getOAuthCredentials();
    const params = new URLSearchParams({
        code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
    });
    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) {
        debug('oauth', `Token exchange failed: ${response.status}`);
        throw new Error(`Token exchange failed: ${response.status}`);
    }
    const data = await response.json();
    debug('oauth', 'Token exchange successful');
    return data;
}
/**
 * Get user email from access token
 */
async function getUserEmail(accessToken) {
    debug('oauth', 'Fetching user info');
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS)
        });
        if (response.ok) {
            const data = await response.json();
            return data.email;
        }
    }
    catch (err) {
        debug('oauth', 'Failed to get user info', err);
    }
    return undefined;
}
/**
 * Extract project ID from cloudaicompanionProject field
 * Handles both string and object { id: string } formats
 */
export function extractProjectId(value) {
    // Case 1: Non-empty string
    if (typeof value === 'string' && value.length > 0) {
        return value;
    }
    // Case 2: Object with 'id' property that is a non-empty string
    if (value && typeof value === 'object' && 'id' in value) {
        const id = value.id;
        if (typeof id === 'string' && id.length > 0) {
            return id;
        }
    }
    // Case 3: Missing or invalid
    return undefined;
}
/**
 * Pick the tier ID to use for onboarding
 * Priority: default tier from allowedTiers > first tier from allowedTiers > 'LEGACY' > tierIdFromLoad
 */
export function pickOnboardTier(allowedTiers, tierIdFromLoad) {
    if (!allowedTiers || allowedTiers.length === 0) {
        return tierIdFromLoad;
    }
    // Find default tier
    const defaultTier = allowedTiers.find(t => t.isDefault === true && t.id && t.id.length > 0);
    if (defaultTier?.id) {
        return defaultTier.id;
    }
    // Find first tier with valid ID
    const firstTier = allowedTiers.find(t => t.id && t.id.length > 0);
    if (firstTier?.id) {
        return firstTier.id;
    }
    // If tiers exist but have no IDs, use LEGACY
    if (allowedTiers.length > 0) {
        return 'LEGACY';
    }
    return tierIdFromLoad;
}
/**
 * Sleep helper for retry delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Try to onboard user with retry logic
 * Calls onboardUser endpoint until done=true or max attempts reached
 */
async function tryOnboardUser(accessToken, tierId) {
    debug('oauth', `Starting onboard flow with tierId: ${tierId}`);
    const payload = {
        tierId,
        metadata: CLOUDCODE_CONFIG.metadata
    };
    for (let attempt = 1; attempt <= CLOUDCODE_CONFIG.onboardAttempts; attempt++) {
        debug('oauth', `Onboard attempt ${attempt}/${CLOUDCODE_CONFIG.onboardAttempts}`);
        try {
            const response = await fetch(`${CLOUDCODE_CONFIG.baseUrl}/v1internal:onboardUser`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': CLOUDCODE_CONFIG.userAgent
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS)
            });
            if (!response.ok) {
                debug('oauth', `Onboard request failed: ${response.status}`);
                // Don't retry on 403/401 - these are permanent failures
                if (response.status === 401 || response.status === 403) {
                    debug('oauth', 'Onboarding forbidden or unauthorized, stopping retries');
                    return undefined;
                }
            }
            else {
                const data = await response.json();
                debug('oauth', `Onboard response: done=${data.done}`);
                if (data.done === true) {
                    const projectId = extractProjectId(data.response?.cloudaicompanionProject);
                    if (projectId) {
                        debug('oauth', `Onboarding complete, projectId: ${projectId}`);
                        return projectId;
                    }
                    debug('oauth', 'Onboarding done but no projectId in response');
                    return undefined;
                }
            }
        }
        catch (err) {
            debug('oauth', `Onboard attempt ${attempt} error:`, err);
        }
        // Wait before next attempt (unless this is the last attempt)
        if (attempt < CLOUDCODE_CONFIG.onboardAttempts) {
            debug('oauth', `Waiting ${CLOUDCODE_CONFIG.onboardDelayMs}ms before next attempt`);
            await sleep(CLOUDCODE_CONFIG.onboardDelayMs);
        }
    }
    debug('oauth', 'Onboarding attempts exhausted');
    return undefined;
}
/**
 * Resolve project ID from Cloud Code API
 * First tries loadCodeAssist, if no projectId then initiates onboarding
 */
export async function resolveProjectId(accessToken) {
    debug('oauth', 'Resolving project ID from Cloud Code API');
    try {
        // Step 1: Call loadCodeAssist
        const response = await fetch(`${CLOUDCODE_CONFIG.baseUrl}/v1internal:loadCodeAssist`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'User-Agent': CLOUDCODE_CONFIG.userAgent
            },
            body: JSON.stringify({ metadata: CLOUDCODE_CONFIG.metadata }),
            signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS)
        });
        if (!response.ok) {
            debug('oauth', `loadCodeAssist failed: ${response.status}`);
            return { projectId: undefined, tierId: undefined };
        }
        const data = await response.json();
        // Step 2: Extract project ID and tier
        const projectId = extractProjectId(data.cloudaicompanionProject);
        const tierId = data.paidTier?.id || data.currentTier?.id;
        // Step 3: If we have projectId, return immediately
        if (projectId) {
            debug('oauth', `Got projectId from loadCodeAssist: ${projectId}`);
            return { projectId, tierId };
        }
        // Step 4: No projectId - need to onboard
        debug('oauth', 'No projectId in loadCodeAssist response, initiating onboarding');
        const onboardTier = pickOnboardTier(data.allowedTiers, tierId);
        if (!onboardTier) {
            debug('oauth', 'Cannot determine tier for onboarding');
            return { projectId: undefined, tierId };
        }
        // Step 5: Try onboarding
        const onboardedProjectId = await tryOnboardUser(accessToken, onboardTier);
        return {
            projectId: onboardedProjectId,
            tierId: onboardTier
        };
    }
    catch (err) {
        debug('oauth', 'Error resolving project ID', err);
        return { projectId: undefined, tierId: undefined };
    }
}
/**
 * Complete login process: exchange code for tokens, get user info, resolve project ID
 */
async function completeLogin(code, redirectUri) {
    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code, redirectUri);
    // Get user email
    const email = await getUserEmail(tokenResponse.access_token);
    // Resolve project ID from Cloud Code API (may trigger onboarding if needed)
    let projectId;
    try {
        const projectResult = await resolveProjectId(tokenResponse.access_token);
        projectId = projectResult.projectId;
        if (projectId) {
            debug('oauth', `Project ID resolved: ${projectId}`);
        }
        else {
            debug('oauth', 'No project ID obtained (will fetch on demand)');
        }
    }
    catch (err) {
        debug('oauth', 'Failed to resolve project ID during login (will fetch on demand)', err);
        // Continue without project ID - it will be fetched on demand
    }
    // Save tokens using account manager
    const tokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || '',
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
        email,
        projectId
    };
    // Add/update account via account manager
    if (email) {
        getAccountManager().addAccount(tokens, email);
    }
    return { success: true, email };
}
/**
 * Start OAuth login flow
 */
export async function startOAuthFlow(options = {}) {
    const credentials = getOAuthCredentials();
    const port = await getAvailablePort(options.port);
    const redirectUri = `http://127.0.0.1:${port}/callback`;
    const state = generateState();
    debug('oauth', `Starting OAuth flow on port ${port}`);
    // Build authorization URL
    const authParams = new URLSearchParams({
        client_id: credentials.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: OAUTH_CONFIG.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state
    });
    const authUrl = `${OAUTH_CONFIG.authUrl}?${authParams.toString()}`;
    // Manual flow check
    if (options.manual) {
        info('');
        info('MANUAL LOGIN MODE');
        info('1. Copy this URL and open it in your browser:');
        info(authUrl);
        info('');
        info('2. Login with your Google account.');
        info('3. You will be redirected to a localhost URL (which may fail to load).');
        info('4. Copy that ENTIRE localhost URL and paste it below.');
        info('');
        const { pastedUrl } = await inquirer.prompt([
            {
                type: 'input',
                name: 'pastedUrl',
                message: 'Paste the full redirect URL here:',
                validate: (input) => input.trim().length > 0 ? true : 'Please paste the URL'
            }
        ]);
        try {
            const url = new URL(pastedUrl.trim());
            const code = url.searchParams.get('code');
            const returnedState = url.searchParams.get('state');
            const errorParam = url.searchParams.get('error');
            if (errorParam) {
                return { success: false, error: errorParam };
            }
            if (!code || returnedState !== state) {
                return { success: false, error: 'Invalid URL: Missing code or state mismatch' };
            }
            return await completeLogin(code, redirectUri);
        }
        catch (err) {
            if (err instanceof Error) {
                return { success: false, error: err.message };
            }
            return { success: false, error: 'Invalid URL format' };
        }
    }
    return new Promise((resolve) => {
        let resolved = false;
        const server = createServer(async (req, res) => {
            if (resolved)
                return;
            const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
            if (url.pathname === '/callback') {
                const code = url.searchParams.get('code');
                const returnedState = url.searchParams.get('state');
                const errorParam = url.searchParams.get('error');
                if (errorParam) {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Login Failed</h1><p>You can close this window.</p></body></html>');
                    resolved = true;
                    server.close();
                    resolve({ success: false, error: errorParam });
                    return;
                }
                if (!code || returnedState !== state) {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Invalid Request</h1><p>State mismatch or missing code.</p></body></html>');
                    resolved = true;
                    server.close();
                    resolve({ success: false, error: 'Invalid callback' });
                    return;
                }
                try {
                    // Use common login logic
                    const result = await completeLogin(code, redirectUri);
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Login Successful!</h1>
                <p>You are now logged in${result.email ? ` as <strong>${escapeHtml(result.email)}</strong>` : ''}.</p>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);
                    resolved = true;
                    server.close();
                    resolve(result);
                }
                catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end('<html><body><h1>Login Failed</h1><p>Token exchange failed.</p></body></html>');
                    resolved = true;
                    server.close();
                    resolve({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
                }
            }
        });
        server.listen(port, '127.0.0.1', async () => {
            info('');
            info('Opening browser for Google login...');
            info('');
            if (options.noBrowser) {
                info('Open this URL in your browser:');
                info(authUrl);
            }
            else {
                try {
                    await open(authUrl);
                    info('If the browser did not open, visit this URL:');
                    info(authUrl);
                }
                catch (err) {
                    debug('oauth', 'Failed to open browser', err);
                    info('Could not open browser. Please visit this URL:');
                    info(authUrl);
                }
            }
            info('');
            info('Waiting for authentication...');
        });
        // Timeout after 2 minutes
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                server.close();
                resolve({ success: false, error: 'Login timed out' });
            }
        }, 2 * 60 * 1000);
    });
}
/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
    debug('oauth', 'Refreshing access token');
    const credentials = getOAuthCredentials();
    const params = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'refresh_token'
    });
    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        signal: AbortSignal.timeout(GOOGLE_REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) {
        debug('oauth', `Token refresh failed: ${response.status}`);
        throw new Error(`Token refresh failed: ${response.status}`);
    }
    const data = await response.json();
    debug('oauth', 'Token refresh successful');
    return data;
}
//# sourceMappingURL=oauth.js.map