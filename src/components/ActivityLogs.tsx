import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { AuditLog } from '../types';

interface ActivityLogsProps {
  logs: AuditLog[];
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'All' | 'Check Out' | 'Check In'>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');

  // Discover all unique teams
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    logs.forEach((l) => {
      if (l.team) teams.add(l.team);
    });
    return Array.from(teams).sort();
  }, [logs]);

  // Filter logs sorted newest first
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (actionFilter !== 'All' && log.action !== actionFilter) return false;
        if (teamFilter !== 'All' && log.team !== teamFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            log.itemId.toLowerCase().includes(q) ||
            (log.itemName && log.itemName.toLowerCase().includes(q)) ||
            log.team.toLowerCase().includes(q) ||
            (log.notes && log.notes.toLowerCase().includes(q)) ||
            (log.userEmail && log.userEmail.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      });
  }, [logs, actionFilter, teamFilter, searchQuery]);

  const exportLogsCSV = () => {
    const headers = ['Timestamp', 'Item ID', 'Action', 'Team', 'Item Name', 'Notes', 'User Email'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.itemId,
      l.action,
      l.team || '',
      `"${(l.itemName || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      l.userEmail || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VEX_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-none uppercase">
                [IMMUTABLE_TRAIL]
              </span>
              <span className="text-xs font-mono text-slate-500">SYSTEM_AUDIT_LOGS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Activity & Audit Logs
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Immutable historical record of every checkout, check-in, and equipment movement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportLogsCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-sm transition-colors font-mono"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>[EXPORT_CSV]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 rounded-sm bg-white border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Part ID, team, notes, email..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-sm border border-slate-200 text-xs font-mono">
            <button
              onClick={() => setActionFilter('All')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                actionFilter === 'All' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActionFilter('Check Out')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                actionFilter === 'Check Out' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CHECK OUT
            </button>
            <button
              onClick={() => setActionFilter('Check In')}
              className={`px-2.5 py-1 rounded-sm transition-colors ${
                actionFilter === 'Check In' ? 'bg-emerald-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              CHECK IN
            </button>
          </div>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-sm text-slate-800 font-mono focus:outline-none focus:border-amber-600"
          >
            <option value="All">All Teams</option>
            {uniqueTeams.map((team) => (
              <option key={team} value={team}>
                Team {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-700 select-none font-mono">
              <tr>
                <th className="py-2.5 px-3 font-bold">[TIMESTAMP]</th>
                <th className="py-2.5 px-3 font-bold">[ACTION]</th>
                <th className="py-2.5 px-3 font-bold">[PART_ID]</th>
                <th className="py-2.5 px-3 font-bold">[COMPONENT_NAME]</th>
                <th className="py-2.5 px-3 font-bold">[TEAM]</th>
                <th className="py-2.5 px-3 font-bold">[NOTES_/_PURPOSE]</th>
                <th className="py-2.5 px-3 font-bold">[OPERATOR_EMAIL]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCheckOut = log.action === 'Check Out';
                  const date = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      {/* Timestamp */}
                      <td className="py-2 px-3 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {isNaN(date.getTime()) ? log.timestamp || '—' : date.toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isNaN(date.getTime())
                            ? ''
                            : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                            isCheckOut
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {isCheckOut ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {isCheckOut ? '[OUT]' : '[IN]'} {log.action}
                        </span>
                      </td>

                      {/* Item ID */}
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                          {log.itemId}
                        </span>
                      </td>

                      {/* Component Name */}
                      <td className="py-2 px-3 text-slate-900 font-medium">
                        {log.itemName || log.category || 'VEX Hardware Item'}
                      </td>

                      {/* Team */}
                      <td className="py-2 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {log.team ? `Team ${log.team}` : '—'}
                      </td>

                      {/* Notes */}
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px] max-w-sm truncate" title={log.notes}>
                        {log.notes || '—'}
                      </td>

                      {/* User Email */}
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {log.userEmail || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
