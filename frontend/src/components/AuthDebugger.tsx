import React, { useEffect } from 'react';
import { useAuth } from '../services/auth-context';
import { testAuthFlow, logTokenInfo } from '../utils/authTest';

const AuthDebugger: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Make test functions available globally for debugging
    (window as any).testAuth = testAuthFlow;
    (window as any).logTokenInfo = logTokenInfo;
    
    console.log('🔧 Auth Debugger loaded. Available functions:');
    console.log('- testAuth() - Test authentication flow');
    console.log('- logTokenInfo() - Log current token information');
  }, []);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Auth Debug Info:</strong></div>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.username : 'None'}</div>
      <div style={{ marginTop: '5px', fontSize: '10px' }}>
        Open console and run <code>testAuth()</code> or <code>logTokenInfo()</code>
      </div>
    </div>
  );
};

export default AuthDebugger;