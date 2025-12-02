import { useState, useEffect } from "react";
import { errorLogger, type ErrorLog } from "@/lib/errorLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, Trash2, Bug } from "lucide-react";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<ErrorLog['type'] | 'all'>('all');

  useEffect(() => {
    // Check if debug mode is enabled
    if (!errorLogger.isDebugMode()) {
      return;
    }

    // Update logs every second
    const interval = setInterval(() => {
      setLogs(errorLogger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!errorLogger.isDebugMode()) {
    return null;
  }

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.type === filter);

  const errorCount = logs.filter(l => l.type === 'error').length;
  const warningCount = logs.filter(l => l.type === 'warning').length;

  const handleDownload = () => {
    const dataStr = errorLogger.exportLogs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    errorLogger.clearLogs();
    setLogs([]);
  };

  const getTypeColor = (type: ErrorLog['type']): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'secondary';
      case 'click': return 'default';
      case 'navigation': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <>
      {/* Floating debug button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] rounded-full w-14 h-14 shadow-lg"
        variant="destructive"
        size="icon"
      >
        <Bug className="h-6 w-6" />
        {errorCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center"
          >
            {errorCount}
          </Badge>
        )}
      </Button>

      {/* Debug panel */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-[9998] w-[600px] max-h-[600px] shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Panel
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownload} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button onClick={handleClear} size="sm" variant="outline">
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button onClick={() => setIsOpen(false)} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Stats */}
            <div className="flex gap-2 mb-4">
              <Badge 
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                All ({logs.length})
              </Badge>
              <Badge 
                variant={filter === 'error' ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('error')}
              >
                Errors ({errorCount})
              </Badge>
              <Badge 
                variant={filter === 'warning' ? 'secondary' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('warning')}
              >
                Warnings ({warningCount})
              </Badge>
              <Badge 
                variant={filter === 'click' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('click')}
              >
                Clicks ({logs.filter(l => l.type === 'click').length})
              </Badge>
              <Badge 
                variant={filter === 'navigation' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('navigation')}
              >
                Nav ({logs.filter(l => l.type === 'navigation').length})
              </Badge>
            </div>

            {/* Logs */}
            <ScrollArea className="h-[400px]">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs to display
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.slice().reverse().map((log, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-muted rounded-lg text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant={getTypeColor(log.type)}>
                          {log.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-medium">{log.message}</div>
                      {log.source && (
                        <div className="text-xs text-muted-foreground">
                          {log.source}:{log.lineNumber}:{log.columnNumber}
                        </div>
                      )}
                      {log.userAction && (
                        <div className="text-xs text-blue-600">
                          Action: {log.userAction}
                        </div>
                      )}
                      {log.stack && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Stack trace</summary>
                          <pre className="mt-1 overflow-x-auto">{log.stack}</pre>
                        </details>
                      )}
                      {log.additionalData && Object.keys(log.additionalData).length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Additional data</summary>
                          <pre className="mt-1 overflow-x-auto">
                            {JSON.stringify(log.additionalData, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </>
  );
}
