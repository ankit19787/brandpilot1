// Simple test to verify frontend-backend API connection
import React, { useState } from 'react';

const APIConnectionTest: React.FC = () => {
  const [result, setResult] = useState<string>('Not tested yet');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test basic server connection
      console.log('🧪 Testing API connection...');
      const response = await fetch('/api/test-connection', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Connected! Server response: ${JSON.stringify(data)}`);
        console.log('✅ API connection successful:', data);
      } else {
        setResult(`❌ Connection failed: ${response.status} ${response.statusText}`);
        console.log('❌ API connection failed:', response.status);
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
      console.error('❌ API connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testMonetization = async () => {
    setLoading(true);
    setResult('Testing monetization...');
    
    try {
      const testDNA = {
        voice: "Professional test",
        personality: ["Test"],
        contentPillars: ["Test"],
        audienceType: "Test audience",
        writingStyle: "Test style"
      };
      
      console.log('🧪 Testing monetization API...');
      const response = await fetch('/api/monetization-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dna: testDNA,
          metrics: { currentFollowers: 1000, engagement: 3.0 },
          userId: 'test-frontend-connection'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Monetization API works! Generated ${data.length} ideas`);
        console.log('✅ Monetization API successful:', data);
      } else {
        const errorText = await response.text();
        setResult(`❌ Monetization API failed: ${response.status} - ${errorText}`);
        console.log('❌ Monetization API failed:', response.status, errorText);
      }
    } catch (error: any) {
      setResult(`❌ Monetization API error: ${error.message}`);
      console.error('❌ Monetization API error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">API Connection Test</h3>
      
      <div className="space-y-3">
        <button 
          onClick={testConnection}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Basic Connection'}
        </button>
        
        <button 
          onClick={testMonetization}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Monetization API'}
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <strong>Result:</strong>
        <div className="mt-1">{result}</div>
      </div>
      
      <div className="mt-2 text-xs text-gray-600">
        Check browser console (F12) for detailed logs
      </div>
    </div>
  );
};

export default APIConnectionTest;