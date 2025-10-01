import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  ShoppingBag,
  HelpCircle,
  Receipt,
  FileText,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/services/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from './sidebar-context';

// Sidebar component for navigation
export function Sidebar() {
  // Get current location for active link highlighting
  const location = useLocation();
  // Get logout function and user from auth context
  const { logout, user } = useAuth();
  // Get sidebar state and toggle function from context
  const { isCollapsed, toggleSidebar } = useSidebar();

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
      title: 'Transactions',
      href: '/transactions',
      icon: Receipt,
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: FileText,
    },
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 fixed h-screen z-50 transition-all duration-300`}>
      <div className="flex flex-col flex-grow border-r bg-sidebar text-sidebar-foreground h-full">
        <div className="flex items-center h-16 px-4 border-b">
          {!isCollapsed && <h1 className="text-xl font-bold">Offer Manager</h1>}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
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
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                      ? 'bg-primary text-white'
                      : 'text-sidebar-foreground hover:bg-primary/10 hover:text-primary'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                    {!isCollapsed && <span className="ml-3">{item.title}</span>}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
        </div>

        {/* User Avatar Dropdown */}
        <div className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                title={user?.username || 'User'}
                variant="outline" 
                className={`cursor-pointer w-full h-auto ${isCollapsed ? 'justify-center p-2 border-none hover:bg-transparent bg-transparent' : 'justify-start px-3 py-2'}`}
              >
                <div className="flex items-center">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="https://csspicker.dev/api/image/?q=profile+avatar&image_type=photo" />
                    <AvatarFallback className="text-xs">
                      {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="ml-3 flex flex-col items-start">
                      <div className="text-sm font-medium">{user?.username || 'User'}</div>
                      <div className="text-xs text-muted-foreground">Free Plan</div>
                    </div>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.username || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}