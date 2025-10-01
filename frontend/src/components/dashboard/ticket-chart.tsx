import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { dashboardApi } from '@/services/dashboard';
import type { TicketDataPoint } from '@/services/dashboard';
import { Loader2 } from 'lucide-react';

export function TicketChart() {
  const [data, setData] = useState<TicketDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const ticketData = await dashboardApi.getTicketData();
        setData(ticketData);
      } catch (err) {
        setError('Failed to load ticket data');
        console.error('Error loading ticket data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm mt-6 h-64 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading ticket data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm mt-6 h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Avg. Ticket Created</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span className="text-gray-600">Created</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Solved</span>
          </div>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm">
            <option>Yearly</option>
          </select>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="created" fill="#93C5FD" radius={[4, 4, 0, 0]} />
            <Bar dataKey="solved" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}