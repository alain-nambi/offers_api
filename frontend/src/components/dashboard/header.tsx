import { Bell, HelpCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/services/auth-context';

// Header component for the dashboard
export function Header() {
  // Get user and logout function from auth context
  const { user } = useAuth();

  return (
    <header className="border-b px-6 py-4 sticky top-0 z-4 bg-background/80 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
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
          <Button className="bg-blue-600 hover:bg-blue-700">Export CSV</Button>
          <div className="flex items-center space-x-3">
            {/* Notification icons */}
            <Bell className="w-5 h-5 text-gray-400 cursor-pointer" />
            <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer" />
            {/* User profile section */}
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://csspicker.dev/api/image/?q=profile+avatar&image_type=photo" />
                {/* Display user's first initial as fallback */}
                <AvatarFallback>
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                {/* Display username */}
                <div className="font-medium text-gray-900">{user?.username || 'User'}</div>
                <div className="text-gray-500">Free Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}