import { authApi, tokenManager } from '../services/auth';

class TokenRefreshManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  start() {
    // Clear any existing interval
    this.stop();

    // Set up periodic token refresh
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, this.REFRESH_INTERVAL);

    // Also check immediately
    this.checkAndRefreshToken();
  }

  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async checkAndRefreshToken() {
    try {
      const { access, refresh } = tokenManager.getTokens();
      
      if (!access || !refresh) {
        return;
      }

      // Check if token needs refresh (within threshold of expiry)
      if (this.shouldRefreshToken(access)) {
        console.log('Refreshing token proactively...');
        const response = await authApi.refresh({ refresh });
        
        // Update tokens
        tokenManager.setTokens(response.access, response.refresh || refresh);
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
      // Don't clear tokens here, let the API interceptor handle it
    }
  }

  private shouldRefreshToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // Refresh if token expires within the threshold
      return timeUntilExpiry < (this.REFRESH_THRESHOLD / 1000);
    } catch {
      return true; // If we can't parse the token, assume it needs refresh
    }
  }
}

export const tokenRefreshManager = new TokenRefreshManager();