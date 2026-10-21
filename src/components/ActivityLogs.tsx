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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Activity & Audit Logs
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Immutable historical record of every checkout, check-in, and equipment movement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportLogsCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export Audit Trail</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Item ID, team, notes, email..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter */}
          <div className="flex items-center bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setActionFilter('All')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                actionFilter === 'All' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Actions
            </button>
            <button
              onClick={() => setActionFilter('Check Out')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                actionFilter === 'Check Out' ? 'bg-amber-950 text-amber-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Check Outs
            </button>
            <button
              onClick={() => setActionFilter('Check In')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                actionFilter === 'Check In' ? 'bg-emerald-950 text-emerald-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Check Ins
            </button>
          </div>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:border-zinc-400"
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
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 text-zinc-400 select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Item ID</th>
                <th className="py-2.5 px-3 font-semibold">Component Name</th>
                <th className="py-2.5 px-3 font-semibold">Team</th>
                <th className="py-2.5 px-3 font-semibold">Notes / Purpose</th>
                <th className="py-2.5 px-3 font-semibold">User Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCheckOut = log.action === 'Check Out';
                  const date = new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                      {/* Timestamp */}
                      <td className="py-2.5 px-3 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                        <div>
                          {isNaN(date.getTime()) ? log.timestamp || '—' : date.toLocaleDateString()}
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {isNaN(date.getTime())
                            ? ''
                            : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isCheckOut ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {isCheckOut ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                          {log.action}
                        </span>
                      </td>

                      {/* Item ID */}
                      <td className="py-2.5 px-3 font-mono font-medium text-zinc-200 whitespace-nowrap">
                        {log.itemId}
                      </td>

                      {/* Component Name */}
                      <td className="py-2.5 px-3 text-zinc-200">
                        {log.itemName || log.category || 'VEX Hardware Item'}
                      </td>

                      {/* Team */}
                      <td className="py-2.5 px-3 font-mono font-semibold text-zinc-300 whitespace-nowrap">
                        {log.team ? `Team ${log.team}` : '—'}
                      </td>

                      {/* Notes */}
                      <td className="py-2.5 px-3 text-zinc-400 max-w-sm truncate" title={log.notes}>
                        {log.notes || '—'}
                      </td>

                      {/* User Email */}
                      <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px] whitespace-nowrap">
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
