import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function DebugInfo() {
  const [debugInfo, setDebugInfo] = useState({
    currentPath: '',
    isSupabaseConfigured: false,
    environment: {},
    errors: [] as string[],
  });

  useEffect(() => {
    // Capture any global errors
    const errorHandler = (event: ErrorEvent) => {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, `Error: ${event.message} at ${event.filename}:${event.lineno}`]
      }));
    };

    // Capture unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, `Promise Rejection: ${event.reason}`]
      }));
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    // Collect debug information
    setDebugInfo(prev => ({
      ...prev,
      currentPath: window.location.pathname,
      isSupabaseConfigured: isSupabaseConfigured(),
      environment: {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
      }
    }));

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  const testSupabaseConnection = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.from('sales').select('count').limit(1);
      
      if (error) {
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, `Supabase Error: ${error.message}`]
        }));
      } else {
        setDebugInfo(prev => ({
          ...prev,
          errors: [...prev.errors, 'Supabase Connection: SUCCESS']
        }));
      }
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        errors: [...prev.errors, `Supabase Test Error: ${err}`]
      }));
    }
  };

  const clearErrors = () => {
    setDebugInfo(prev => ({ ...prev, errors: [] }));
  };

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          🐛 Debug Information
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={testSupabaseConnection}>
              Test Supabase
            </Button>
            <Button size="sm" variant="outline" onClick={clearErrors}>
              Clear Errors
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <strong>Current Path:</strong> {debugInfo.currentPath}
          </div>
          <div>
            <strong>Supabase Configured:</strong>{' '}
            <Badge variant={debugInfo.isSupabaseConfigured ? 'default' : 'secondary'}>
              {debugInfo.isSupabaseConfigured ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        <div className="text-xs">
          <strong>Environment Variables:</strong>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>

        {debugInfo.errors.length > 0 && (
          <div className="text-xs">
            <strong>Errors/Messages ({debugInfo.errors.length}):</strong>
            <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
              {debugInfo.errors.map((error, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs ${
                    error.includes('SUCCESS') 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}