import {
  BarChart3,
  MessageSquare,
  Users,
  Ticket,
  Lightbulb,
  FileText,
  Settings,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-gray-900">Metalic</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-100 w-100%">
        <div className="flex-1 p-4 space-y-6">
          <nav className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">MAIN</h3>
            <Button variant="ghost" className="w-full justify-start px-3 py-2 text-blue-600 bg-blue-50">
              <BarChart3 className="w-5 h-5 mr-3" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <MessageSquare className="w-5 h-5 mr-3" />
              Inbox
            </Button>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <Users className="w-5 h-5 mr-3" />
              Customer
            </Button>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <Ticket className="w-5 h-5 mr-3" />
              Ticket
            </Button>
          </nav>

          <nav className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">TOOLS</h3>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <Lightbulb className="w-5 h-5 mr-3" />
              Insight
            </Button>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <MessageSquare className="w-5 h-5 mr-3" />
              Forum
            </Button>
            <Button variant="ghost" className="w-full justify-start px-3 py-2">
              <FileText className="w-5 h-5 mr-3" />
              Reports
            </Button>
          </nav>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">CONVERSATION</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Main</div>
                    <div className="text-xs text-gray-500">(612) 0998 - 3956</div>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full">15</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Marketing</div>
                    <div className="text-xs text-gray-500">(415) 2357 - 9070</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>



      {/* Bottom */}
      <div className="p-4 border-t space-y-2">
        <Button variant="ghost" className="w-full justify-start px-3 py-2">
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start px-3 py-2">
          <HelpCircle className="w-5 h-5 mr-3" />
          Help & Support
        </Button>
        <div className="bg-blue-50 rounded-lg p-3 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Invitation</div>
              <div className="text-xs text-gray-500">3 invite available now</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}