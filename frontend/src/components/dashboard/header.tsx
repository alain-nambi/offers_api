import { Bell, HelpCircle, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="border-b px-6 py-4 sticky top-0 z-4 bg-background/70 backdrop-blur">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>21 Oct - 21 Nov</span>
          </div>
          <select className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none">
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <Button className="bg-blue-600 hover:bg-blue-700">Export CSV</Button>
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-gray-400 cursor-pointer" />
            <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer" />
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://csspicker.dev/api/image/?q=profile+avatar&image_type=photo" />
                <AvatarFallback>YA</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Young Alaska</div>
                <div className="text-gray-500">Free Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}