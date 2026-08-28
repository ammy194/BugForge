import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { api } from '../lib/api';
import {
  Shield,
  Search,
  Download,
  Filter,
  UserCheck,
  Globe,
  Key,
  Database,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';

export type AuditActionType =
  | 'ALL'
  | 'ISSUE_DELETE'
  | 'ROLE_CHANGE'
  | 'WEBHOOK_CREATE'
  | 'EXPORT_DATA'
  | 'AUTH_LOGIN'
  | 'SETTINGS_UPDATE';

export interface AuditLogItem {
  id: string;
  project_id?: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  action: string;
  target_entity: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<AuditActionType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAction !== 'ALL') params.append('action', selectedAction);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await api.get<AuditLogItem[]>(`/audit?${params.toString()}`);
      setLogs(Array.isArray(res) ? res : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCSV = () => {
    window.open(`${api.baseURL}/audit/export?format=csv`, '_blank');
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ROLE_CHANGE':
        return <Badge variant="purple" className="font-mono text-[10px]">ROLE CHANGE</Badge>;
      case 'EXPORT_DATA':
        return <Badge variant="warning" className="font-mono text-[10px]">DATA EXPORT</Badge>;
      case 'WEBHOOK_CREATE':
        return <Badge variant="info" className="font-mono text-[10px]">WEBHOOK CREATED</Badge>;
      case 'AUTH_LOGIN':
        return <Badge variant="success" className="font-mono text-[10px]">AUTH LOGIN</Badge>;
      case 'ISSUE_DELETE':
        return <Badge variant="destructive" className="font-mono text-[10px]">ISSUE DELETED</Badge>;
      default:
        return <Badge variant="secondary" className="font-mono text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Shield className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Security & Audit Center</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable enterprise audit trail tracking permissions, exports, deletions, and authentication events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-8 border-border/70 hover:text-primary font-medium"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export Audit Trail (CSV)</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-card/60">
        {/* Action Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              'ALL',
              'ROLE_CHANGE',
              'EXPORT_DATA',
              'WEBHOOK_CREATE',
              'AUTH_LOGIN',
              'SETTINGS_UPDATE',
            ] as AuditActionType[]
          ).map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => setSelectedAction(act)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedAction === act
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              {act === 'ALL' ? 'All Events' : act.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 sm:w-72">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search user, entity, IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="text-xs h-8 px-3">
            Search
          </Button>
        </form>
      </div>

      {/* Audit Log Table Card */}
      <Card className="border-border/80 bg-card/90 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              SOC2 & ISO Compliant Audit Stream
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
            {logs.length} EVENTS RECORDED
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground font-mono animate-pulse">
              Loading security audit ledger...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              No audit records matching the active filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-secondary/20 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">IP & Network</th>
                    <th className="py-3 px-4 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-normal">
                  {logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Avatar fallback={log.actor_name} size="sm" />
                            <div>
                              <span className="font-semibold text-foreground block">{log.actor_name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{log.actor_email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate font-medium text-foreground">
                          {log.target_entity}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3 w-3 text-primary/70" />
                            <span>{log.ip_address}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>{expandedLogId === log.id ? 'Close' : 'Details'}</span>
                            {expandedLogId === log.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Metadata Row */}
                      {expandedLogId === log.id && (
                        <tr className="bg-black/50">
                          <td colSpan={6} className="p-4 border-b border-border/60">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="font-bold text-foreground">Audit Record ID: {log.id}</span>
                                <span className="font-mono">{log.user_agent}</span>
                              </div>
                              <pre className="p-3 rounded-lg bg-black/60 border border-border/60 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
