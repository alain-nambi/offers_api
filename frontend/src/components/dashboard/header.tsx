import { Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

// Header component for the dashboard
export function Header() {

  return (
    <header className="border-b px-6 py-3 sticky top-0 z-4 bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-3">
          {/* Date range selector */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>21 Oct - 21 Nov</span>
          </div>
          {/* Time period selector */}
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none">
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          {/* Export button */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1" size="sm">
            Export CSV
          </Button>
          <div className="flex items-center space-x-3">
            {/* Notification icon */}
            <Bell className="w-5 h-5 text-gray-400 cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
}