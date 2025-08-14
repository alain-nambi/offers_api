import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { name: "Jan", created: 45, solved: 38 },
  { name: "Feb", created: 52, solved: 48 },
  { name: "Mar", created: 38, solved: 42 },
  { name: "Apr", created: 65, solved: 55 },
  { name: "May", created: 48, solved: 50 },
  { name: "Jun", created: 55, solved: 60 },
];

export function TicketChart() {
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