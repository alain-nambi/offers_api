import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  Ticket, 
  BarChart3, 
  Settings, 
  LogOut,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/services/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sidebar component for navigation
export function Sidebar() {
  // Get current location for active link highlighting
  const location = useLocation();
  // Get logout function from auth context
  const { logout } = useAuth();

  // Navigation items
  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Offers',
      href: '/offers',
      icon: ShoppingBag,
    },
    {
      title: 'Subscriptions',
      href: '/subscriptions',
      icon: CreditCard,
    },
    {
      title: 'Tickets',
      href: '/tickets',
      icon: Ticket,
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: BarChart3,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="flex flex-col flex-grow border-r bg-sidebar text-sidebar-foreground">
        <div className="flex items-center h-16 px-4 border-b">
          <h1 className="text-xl font-bold">Offer Manager</h1>
        </div>
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          
          {/* Navigation */}
          <ScrollArea className="h-100 w-100%">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.title}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          </ScrollArea>
        </div>

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
          <Button 
            variant="ghost" 
            className="w-full justify-start px-3 py-2 hover:bg-red-50 hover:text-red-600 cursor-pointer" 
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}