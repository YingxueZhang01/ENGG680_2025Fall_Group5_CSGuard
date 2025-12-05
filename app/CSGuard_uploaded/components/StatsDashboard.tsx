import React, { useState, useMemo } from 'react';
import { LogEntry, TimeRange } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ShieldCheck, AlertOctagon, Activity, Calendar } from 'lucide-react';

interface StatsDashboardProps {
  logs: LogEntry[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ logs }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('TODAY');

  // Filter logs based on Time Range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      if (timeRange === 'TODAY') {
        return logDate.toDateString() === now.toDateString();
      } else if (timeRange === 'WEEK') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      } else if (timeRange === 'MONTH') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return logDate >= monthAgo;
      }
      return true;
    });
  }, [logs, timeRange]);

  // Process data for charts
  const violationCount = filteredLogs.filter(l => l.type === 'VIOLATION').length;
  // Simulating total checks for percentage calculation (since we don't log every safe frame)
  // Assuming ~5 checks per log entry as a baseline for activity
  const totalActivity = Math.max(filteredLogs.length * 5, violationCount); 
  
  const violationTypes = [
    { name: 'No Hardhat', value: filteredLogs.filter(l => l.message.toLowerCase().includes('hardhat')).length },
    { name: 'No Vest', value: filteredLogs.filter(l => l.message.toLowerCase().includes('vest')).length },
    { name: 'Other', value: filteredLogs.filter(l => l.type === 'VIOLATION' && !l.message.toLowerCase().includes('hardhat') && !l.message.toLowerCase().includes('vest')).length }
  ].filter(i => i.value > 0);

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    name: `${i}:00`,
    violations: filteredLogs.filter(l => {
        const d = new Date(l.timestamp);
        return l.type === 'VIOLATION' && d.getHours() === i;
    }).length
  }));

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6'];

  return (
    <div className="space-y-6 h-full overflow-y-auto pr-2 pb-10">
      {/* Date Filter */}
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-white">Safety Analytics</h2>
         <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  timeRange === range 
                    ? 'bg-blue-600 text-white shadow' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {range}
              </button>
            ))}
         </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Total Violations</p>
              <h3 className="text-3xl font-bold text-white mt-1">{violationCount}</h3>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <AlertOctagon className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500 gap-1">
            <Calendar className="w-3 h-3"/>
            <span>In selected period</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Compliance Rate</p>
              <h3 className="text-3xl font-bold text-white mt-1">
                {totalActivity > 0 ? (100 - (violationCount / totalActivity * 100)).toFixed(1) : 100}%
              </h3>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-green-400">
            <span className="font-medium">Calculated based on detected events</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm">Total Activity</p>
              <h3 className="text-3xl font-bold text-white mt-1">{filteredLogs.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-500" />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-blue-400">
            <span className="font-medium">Events Logged</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hourly Trend */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">Violations Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="violations" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-6">Violation Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {violationTypes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={violationTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {violationTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} itemStyle={{ color: '#fff' }} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="text-slate-500">No violations recorded in this period</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};