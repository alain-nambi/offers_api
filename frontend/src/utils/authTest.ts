// Utility functions to test authentication functionality
import { authApi, tokenManager } from '../services/auth';

export const testAuthFlow = async () => {
  console.log('🧪 Testing authentication flow...');
  
  try {
    // Test 1: Check if tokens exist
    const tokens = tokenManager.getTokens();
    console.log('📋 Current tokens:', {
      hasAccess: !!tokens.access,
      hasRefresh: !!tokens.refresh,
      isAuthenticated: tokenManager.isAuthenticated()
    });

    // Test 2: Check token expiration
    if (tokens.access) {
      const isExpired = tokenManager.isTokenExpired(tokens.access);
      console.log('⏰ Access token expired:', isExpired);
      
      if (!isExpired) {
        // Test 3: Try to get profile
        try {
          const profile = await authApi.profile();
          console.log('👤 Profile retrieved:', profile.username);
        } catch (error) {
          console.log('❌ Profile retrieval failed:', error);
        }
      }
    }

    // Test 4: Try token refresh if we have a refresh token
    if (tokens.refresh) {
      try {
        console.log('🔄 Testing token refresh...');
        const refreshResponse = await authApi.refresh({ refresh: tokens.refresh });
        console.log('✅ Token refresh successful');
        
        // Update tokens
        tokenManager.setTokens(refreshResponse.access, refreshResponse.refresh || tokens.refresh);
      } catch (error) {
        console.log('❌ Token refresh failed:', error);
      }
    }

  } catch (error) {
    console.error('🚨 Auth test failed:', error);
  }
};

// Function to decode JWT payload (for debugging)
export const decodeToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.user_id,
      username: payload.username,
      exp: new Date(payload.exp * 1000),
      iat: new Date(payload.iat * 1000),
      timeUntilExpiry: Math.max(0, payload.exp - (Date.now() / 1000))
    };
  } catch {
    return null;
  }
};

// Function to log token information
export const logTokenInfo = () => {
  const { access, refresh } = tokenManager.getTokens();
  
  console.log('🔑 Token Information:');
  
  if (access) {
    const accessInfo = decodeToken(access);
    console.log('📱 Access Token:', accessInfo);
  } else {
    console.log('📱 Access Token: Not found');
  }
  
  if (refresh) {
    const refreshInfo = decodeToken(refresh);
    console.log('🔄 Refresh Token:', refreshInfo);
  } else {
    console.log('🔄 Refresh Token: Not found');
  }
};