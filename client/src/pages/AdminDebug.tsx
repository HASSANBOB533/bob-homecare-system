import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { selfHealing, ErrorLog, PerformanceLog } from '@/lib/selfHealing';
import { apiCircuitBreaker } from '@/lib/apiRetry';
import { RefreshCw, Download, Trash2, Bug, Zap, AlertTriangle } from 'lucide-react';

export default function AdminDebug() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [performanceLogs, setPerformanceLogs] = useState<PerformanceLog[]>([]);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [perfStats, setPerfStats] = useState<any>(null);
  const [circuitState, setCircuitState] = useState<any>(null);
  const [debugMode, setDebugMode] = useState(false);

  const refreshLogs = () => {
    setErrorLogs(selfHealing.getErrorLogs());
    setPerformanceLogs(selfHealing.getPerformanceLogs());
    setErrorStats(selfHealing.getErrorStats());
    setPerfStats(selfHealing.getPerformanceStats());
    setCircuitState(apiCircuitBreaker.getState());
    setDebugMode(selfHealing.isDebugMode());
  };

  useEffect(() => {
    refreshLogs();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(refreshLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDebug = () => {
    const newMode = !debugMode;
    selfHealing.setDebugMode(newMode);
    setDebugMode(newMode);
  };

  const handleClearLogs = () => {
    if (confirm('Clear all logs?')) {
      selfHealing.clearLogs();
      refreshLogs();
    }
  };

  const handleExportLogs = () => {
    const data = selfHealing.exportLogs();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetCircuit = () => {
    apiCircuitBreaker.reset();
    refreshLogs();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="w-8 h-8" />
            Debug Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time error monitoring and performance tracking
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={debugMode ? 'default' : 'outline'}
            onClick={handleToggleDebug}
          >
            {debugMode ? 'Debug Mode ON' : 'Debug Mode OFF'}
          </Button>
          <Button variant="outline" onClick={refreshLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="destructive" onClick={handleClearLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Error Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold">Errors</h3>
              <p className="text-2xl font-bold">{errorStats?.total || 0}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recovered:</span>
              <span className="font-medium">{errorStats?.recovered || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recovery Rate:</span>
              <span className="font-medium">{errorStats?.recoveryRate?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </Card>

        {/* Performance Stats */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Performance</h3>
              <p className="text-2xl font-bold">{perfStats?.total || 0}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slow Ops:</span>
              <span className="font-medium">{perfStats?.slow || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Duration:</span>
              <span className="font-medium">{perfStats?.avgDuration?.toFixed(0) || 0}ms</span>
            </div>
          </div>
        </Card>

        {/* Circuit Breaker */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              circuitState?.state === 'closed' ? 'bg-green-100' :
              circuitState?.state === 'half-open' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <div className={`w-6 h-6 rounded-full ${
                circuitState?.state === 'closed' ? 'bg-green-600' :
                circuitState?.state === 'half-open' ? 'bg-yellow-600' : 'bg-red-600'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold">Circuit Breaker</h3>
              <Badge variant={
                circuitState?.state === 'closed' ? 'default' :
                circuitState?.state === 'half-open' ? 'secondary' : 'destructive'
              }>
                {circuitState?.state?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failures:</span>
              <span className="font-medium">{circuitState?.failureCount || 0}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetCircuit}
              className="w-full mt-2"
            >
              Reset Circuit
            </Button>
          </div>
        </Card>
      </div>

      {/* Error Logs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Error Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {errorLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No errors logged</p>
          ) : (
            errorLogs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={log.recovered ? 'default' : 'destructive'}>
                        {log.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.recovered && (
                        <Badge variant="outline" className="text-green-600">
                          Recovered: {log.recoveryMethod}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{log.message}</p>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>{log.page}</span>
                      {log.component && <span> • {log.component}</span>}
                      <span> • {log.browser}</span>
                    </div>
                  </div>
                </div>
                {log.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                      {log.stack}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Performance Logs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {performanceLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No performance data logged</p>
          ) : (
            performanceLogs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className={`border rounded-lg p-4 ${log.slow ? 'border-yellow-500 bg-yellow-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {log.slow && (
                        <Badge variant="secondary" className="bg-yellow-200 text-yellow-900">
                          SLOW
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium">{log.operation}</p>
                    <div className="text-sm text-muted-foreground">
                      <span>{log.page}</span>
                      <span> • {log.duration.toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
