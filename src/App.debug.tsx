import React from 'react';

const DebugApp = () => {
  console.log('🎯 DebugApp component rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ color: '#2563eb', marginBottom: '20px' }}>
        🚀 WiFi Voucher Management - Debug Mode
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h2>✅ App is Loading Successfully!</h2>
        <p>If you can see this message, the basic React app is working.</p>
        
        <div style={{ marginTop: '20px' }}>
          <h3>🔍 Debug Information:</h3>
          <ul>
            <li>✅ React is working</li>
            <li>✅ TypeScript is compiling</li>
            <li>✅ Vite build is successful</li>
            <li>✅ Vercel deployment is serving files</li>
          </ul>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px' 
        }}>
          <strong>Next Steps:</strong>
          <p>1. Check browser console for any errors</p>
          <p>2. Verify all imports are working</p>
          <p>3. Test individual components</p>
        </div>
        
        <button 
          onClick={() => {
            console.log('🔄 Test button clicked!');
            alert('Debug app is working!');
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🧪 Test Interaction
        </button>
      </div>
    </div>
  );
};

export default DebugApp;