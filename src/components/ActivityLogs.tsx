import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AuditLog } from '../types';
import { useSlidingIndicator } from './MotionPrimitives';
import { playClick } from '../services/soundFx';

interface ActivityLogsProps {
  logs: AuditLog[];
  isMobileMode?: boolean;
  isAdmin?: boolean;
  onDeleteLog?: (logId: string) => void;
  onClearLogs?: (mode: 'older30' | 'all') => void;
}

export const ActivityLogs: React.FC<ActivityLogsProps> = ({
  logs,
  isMobileMode = false,
  isAdmin = false,
  onDeleteLog,
  onClearLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'All' | 'Check Out' | 'Check In'>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [visibleLimit, setVisibleLimit] = useState<number>(50);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const { containerRef: actionNavRef, setItemRef: setActionTabRef, indicator: actionIndicator } =
    useSlidingIndicator<'All' | 'Check Out' | 'Check In'>(actionFilter);

  useEffect(() => {
    setVisibleLimit(50);
  }, [searchQuery, actionFilter, teamFilter]);

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
            String(log.itemId || '').toLowerCase().includes(q) ||
            String(log.itemName || '').toLowerCase().includes(q) ||
            String(log.team || '').toLowerCase().includes(q) ||
            String(log.notes || '').toLowerCase().includes(q) ||
            String(log.userEmail || '').toLowerCase().includes(q);
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

  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, visibleLimit);
  }, [filteredLogs, visibleLimit]);

  const exportLogsCSV = () => {
    const headers = ['Timestamp', 'Item ID', 'Action', 'Team', 'Item Name', 'Notes', 'User Email'];
    const rows = filteredLogs.map((l) => [
      String(l.timestamp || ''),
      String(l.itemId || ''),
      String(l.action || ''),
      String(l.team || ''),
      `"${String(l.itemName || '').replace(/"/g, '""')}"`,
      `"${String(l.notes || '').replace(/"/g, '""')}"`,
      String(l.userEmail || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `VEX_Activity_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#27272d]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-sans">
              Activity Log
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              History of every part checked out and returned
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && onClearLogs && logs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    onClearLogs('older30');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-zinc-100 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors font-mono btn-tactile"
                >
                  Prune &gt;30d
                </button>
                {confirmClearAll ? (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="px-2.5 py-2 bg-[#1a1a1f] text-zinc-300 border border-[#27272d] rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        setConfirmClearAll(false);
                        onClearLogs('all');
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                    >
                      Confirm Clear
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setConfirmClearAll(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-[#111114] border border-rose-500/30 rounded-lg transition-colors font-mono btn-tactile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </>
            )}
            <button
              onClick={exportLogsCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors font-mono btn-tactile"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 rounded-xl bg-[#111114] border border-[#27272d] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Part ID, team, notes, email..."
            className="w-full pl-9 pr-8 py-2.5 sm:py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-xl sm:rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 crimson-focus-glow font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter with Spring Sliding Pill */}
          <div
            ref={actionNavRef}
            className="relative flex items-center bg-[#09090b] p-0.5 rounded-lg border border-[#27272d] text-xs font-mono"
          >
            {actionIndicator.ready && (
              <div
                aria-hidden="true"
                style={{
                  transform: `translate3d(${actionIndicator.left}px, ${actionIndicator.top}px, 0)`,
                  width: `${actionIndicator.width}px`,
                  height: `${actionIndicator.height}px`,
                }}
                className={`absolute top-0 left-0 rounded-md pointer-events-none transition-[transform,width,height,background-color,border-color] duration-300 ease-[cubic-bezier(0.34,1.35,0.64,1)] border ${
                  actionFilter === 'Check Out'
                    ? 'bg-amber-500/20 border-amber-500/40'
                    : actionFilter === 'Check In'
                    ? 'bg-zinc-200/15 border-zinc-400/40'
                    : 'bg-[#1a1a1f] border-red-500/40'
                }`}
              />
            )}
            <button
              ref={setActionTabRef('All')}
              onClick={() => {
                playClick();
                setActionFilter('All');
              }}
              className={`relative z-10 px-2.5 py-1 rounded-md transition-colors duration-150 ${
                actionFilter === 'All' ? 'text-zinc-100 font-bold' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              ALL
            </button>
            <button
              ref={setActionTabRef('Check Out')}
              onClick={() => {
                playClick();
                setActionFilter('Check Out');
              }}
              className={`relative z-10 px-2.5 py-1 rounded-md transition-colors duration-150 ${
                actionFilter === 'Check Out' ? 'text-amber-400 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              CHECK OUT
            </button>
            <button
              ref={setActionTabRef('Check In')}
              onClick={() => {
                playClick();
                setActionFilter('Check In');
              }}
              className={`relative z-10 px-2.5 py-1 rounded-md transition-colors duration-150 ${
                actionFilter === 'Check In' ? 'text-zinc-100 font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              CHECK IN
            </button>
          </div>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="min-h-[38px] sm:min-h-0 px-2.5 py-1.5 text-xs bg-[#09090b] border border-[#27272d] rounded-lg text-zinc-300 font-mono focus:outline-none focus:border-red-500"
          >
            <option value="All">All Teams</option>
            {uniqueTeams.map((team) => (
              <option key={team} value={team}>
                Team {team}
              </option>
            ))}
          </select>

          {(searchQuery || actionFilter !== 'All' || teamFilter !== 'All') && (
            <button
              onClick={() => {
                playClick();
                setSearchQuery('');
                setActionFilter('All');
                setTeamFilter('All');
              }}
              className="flex items-center gap-1 min-h-[38px] sm:min-h-0 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 bg-[#1a1a1f] border border-[#27272d] rounded-lg transition-colors btn-tactile"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {isMobileMode ? (
        /* Mobile Audit Timeline Cards */
        <div className="space-y-2.5">
          {filteredLogs.length === 0 ? (
            <div className="p-8 rounded-2xl border border-[#27272d] bg-[#111114] text-center space-y-2.5">
              <p className="font-mono text-xs text-zinc-400">No entries match your filters.</p>
              {(searchQuery || actionFilter !== 'All' || teamFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActionFilter('All');
                    setTeamFilter('All');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-200 bg-[#1a1a1f] border border-[#27272d] rounded-xl"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            displayedLogs.map((log, idx) => {
              const isCheckOut = log.action === 'Check Out';
              const date = new Date(log.timestamp);
              return (
                <div
                  key={`${log.id}-${idx}`}
                  style={idx < 12 ? ({ '--row-idx': idx } as React.CSSProperties) : undefined}
                  className={`p-3.5 rounded-2xl border border-[#27272d] bg-[#111114] space-y-2 ${idx < 12 ? 'animate-row-enter' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                          isCheckOut
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-zinc-200/10 text-zinc-100 border-zinc-400/25'
                        }`}
                      >
                        {isCheckOut ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {log.action}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-100 bg-[#1a1a1f] px-2 py-0.5 rounded border border-zinc-700 truncate">
                        {log.itemId}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                      {isNaN(date.getTime())
                        ? log.timestamp || '—'
                        : `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-zinc-100 truncate">
                      {log.itemName || log.category || 'VEX Part'}
                    </span>
                    {log.team && (
                      <span className="font-mono text-[11px] font-bold text-amber-400 shrink-0">
                        Team {log.team}
                      </span>
                    )}
                  </div>

                  {(log.notes || log.userEmail || (isAdmin && onDeleteLog)) && (
                    <div className="pt-1.5 border-t border-[#1a1a1f] text-[11px] flex items-end justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        {log.notes && <p className="text-zinc-300">{log.notes}</p>}
                        {log.userEmail && <div className="font-mono text-zinc-500 truncate">{log.userEmail}</div>}
                      </div>
                      {isAdmin && onDeleteLog && (
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            onDeleteLog(log.id);
                          }}
                          aria-label="Delete log entry"
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-[#1a1a1f] shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {filteredLogs.length > visibleLimit && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setVisibleLimit((prev) => prev + 50);
                }}
                className="flex-1 min-h-[40px] px-4 py-2 rounded-xl bg-[#111114] hover:bg-[#1a1a1f] border border-[#27272d] text-xs font-semibold text-zinc-100 btn-tactile"
              >
                Show 50 More ({filteredLogs.length - visibleLimit} remaining)
              </button>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setVisibleLimit(filteredLogs.length);
                }}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] text-xs font-mono text-zinc-300 btn-tactile"
              >
                All ({filteredLogs.length})
              </button>
            </div>
          )}
          <div className="px-2 py-1 text-[11px] text-zinc-500 font-mono text-center">
            SHOWING {displayedLogs.length} OF {filteredLogs.length} ENTRIES
          </div>
        </div>
      ) : (
        /* Desktop Logs Table */
        <div className="rounded-xl border border-[#27272d] bg-[#111114] overflow-hidden shadow-none">
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[#09090b] border-b border-[#27272d] text-zinc-400 select-none font-medium">
                <tr>
                  <th className="py-3 px-4 font-semibold">TIME</th>
                  <th className="py-3 px-4 font-semibold">ACTION</th>
                  <th className="py-3 px-4 font-semibold">PART ID</th>
                  <th className="py-3 px-4 font-semibold">PART NAME</th>
                  <th className="py-3 px-4 font-semibold">TEAM</th>
                  <th className="py-3 px-4 font-semibold">NOTES</th>
                  <th className="py-3 px-4 font-semibold">STUDENT EMAIL</th>
                  {isAdmin && onDeleteLog && <th className="py-3 px-4 w-12 text-right font-semibold">DEL</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1f] font-sans">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin && onDeleteLog ? 8 : 7} className="py-12 text-center text-zinc-400">
                      <p className="font-mono text-xs">No entries match your filters.</p>
                      {(searchQuery || actionFilter !== 'All' || teamFilter !== 'All') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setActionFilter('All');
                            setTeamFilter('All');
                          }}
                          className="mt-3 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-[#1a1a1f] hover:bg-[#27272d] border border-[#27272d] rounded-lg transition-colors"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((log, idx) => {
                    const isCheckOut = log.action === 'Check Out';
                    const date = new Date(log.timestamp);
                    return (
                      <tr
                        key={`${log.id}-${idx}`}
                        style={idx < 12 ? ({ '--row-idx': idx } as React.CSSProperties) : undefined}
                        className={`hover:bg-[#1a1a1f] transition-colors ${idx < 12 ? 'animate-row-enter' : ''}`}
                      >
                        {/* Timestamp */}
                        <td className="py-2.5 px-4 text-zinc-400 font-mono tabular-nums whitespace-nowrap">
                          <div className="font-semibold text-zinc-100">
                            {isNaN(date.getTime()) ? log.timestamp || '—' : date.toLocaleDateString()}
                          </div>
                          <div className="text-[11px] text-zinc-500">
                            {isNaN(date.getTime())
                              ? ''
                              : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded border ${
                              isCheckOut
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-zinc-200/10 text-zinc-100 border-zinc-400/25'
                            }`}
                          >
                            {isCheckOut ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            {log.action}
                          </span>
                        </td>

                        {/* Item ID */}
                        <td className="py-2.5 px-4 font-mono font-bold text-zinc-100 whitespace-nowrap">
                          <span className="bg-[#1a1a1f] px-2 py-0.5 rounded border border-zinc-700">
                            {log.itemId}
                          </span>
                        </td>

                        {/* Component Name */}
                        <td className="py-2.5 px-4 text-zinc-100 font-medium">
                          {log.itemName || log.category || 'VEX Part'}
                        </td>

                        {/* Team */}
                        <td className="py-2.5 px-4 font-mono font-bold text-zinc-200 whitespace-nowrap">
                          {log.team ? `Team ${log.team}` : '—'}
                        </td>

                        {/* Notes */}
                        <td className="py-2.5 px-4 text-zinc-300 font-mono text-xs max-w-sm truncate" title={log.notes}>
                          {log.notes || '—'}
                        </td>

                        {/* User Email */}
                        <td className="py-2.5 px-4 text-zinc-400 font-mono text-xs whitespace-nowrap">
                          {log.userEmail || '—'}
                        </td>
                        {isAdmin && onDeleteLog && (
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                playClick();
                                onDeleteLog(log.id);
                              }}
                              title="Delete log entry"
                              aria-label="Delete log entry"
                              className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-[#09090b] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 bg-[#09090b] border-t border-[#27272d] flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                SHOWING <strong className="text-zinc-100">{displayedLogs.length}</strong> OF{' '}
                <strong className="text-zinc-100">{filteredLogs.length}</strong> ENTRIES
                {filteredLogs.length !== logs.length && (
                  <span className="text-zinc-500"> ({logs.length} total)</span>
                )}
              </span>
              {filteredLogs.length > visibleLimit && (
                <div className="flex items-center gap-1.5 ml-1">
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setVisibleLimit((prev) => prev + 50);
                    }}
                    className="px-2 py-0.5 rounded bg-[#1a1a1f] hover:bg-[#27272d] text-zinc-200 border border-[#27272d] text-[11px]"
                  >
                    + Show 50 More
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setVisibleLimit(filteredLogs.length);
                    }}
                    className="px-2 py-0.5 rounded bg-[#1a1a1f] hover:bg-[#27272d] text-zinc-400 border border-[#27272d] text-[11px]"
                  >
                    Show All
                  </button>
                </div>
              )}
            </div>
            <span className="hidden sm:inline text-zinc-500">Newest first</span>
          </div>
        </div>
      )}
    </div>
  );
};
