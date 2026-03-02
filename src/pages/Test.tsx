import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useNotification } from '../context/NotificationContext';

const Test: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const testToastSuccess = () => {
    showNotification('success', 'Success notification test!');
    setTestResult('Success notification triggered');
  };

  const testToastError = () => {
    showNotification('error', 'Error notification test!');
    setTestResult('Error notification triggered');
  };

  const testToastInfo = () => {
    showNotification('info', 'Info notification test!');
    setTestResult('Info notification triggered');
  };

  const testLogin = async () => {
    setLoading(true);
    setTestResult('Testing login...');

    try {
      console.log('🧪 Starting test login...');
      const result = await authAPI.login('admin', 'admin123');
      console.log('🧪 Test login result:', result);
      setTestResult(`✅ Login successful: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      console.error('🧪 Test login error:', error);
      setTestResult(`❌ Login failed: ${error.message || JSON.stringify(error, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  const testAPI = async () => {
    setLoading(true);
    setTestResult('Testing API connection...');

    try {
      const response = await fetch('http://localhost:8000/api/health');
      const data = await response.json();
      setTestResult(`✅ API test successful: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      setTestResult(`❌ API test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>BICS Debug Test Page</h1>

      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Info:</h3>
        <pre>
          REACT_APP_API_URL: {process.env.REACT_APP_API_URL || 'undefined'}
          {'\n'}Window Location: {window.location.href}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Toast Notifications Test:</h3>
        <button
          onClick={testToastSuccess}
          style={{ marginRight: '10px', padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Test Success Toast
        </button>

        <button
          onClick={testToastError}
          style={{ marginRight: '10px', padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Test Error Toast
        </button>

        <button
          onClick={testToastInfo}
          style={{ marginRight: '10px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Test Info Toast
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>API Tests:</h3>
        <button
          onClick={testAPI}
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Test API Health
        </button>

        <button
          onClick={testLogin}
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          Test Login
        </button>
      </div>

      <div>
        <h3>Test Result:</h3>
        <pre style={{
          background: '#f5f5f5',
          padding: '10px',
          border: '1px solid #ddd',
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {loading ? 'Loading...' : testResult || 'No test run yet'}
        </pre>
      </div>
    </div>
  );
};

export default Test;