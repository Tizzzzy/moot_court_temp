import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function UserProfileButton() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initial = user.username.charAt(0).toUpperCase();

  const avatar = (
    <div className="w-9 h-9 rounded-full bg-[#0088FF] flex items-center justify-center text-white font-medium text-[15px] cursor-pointer select-none hover:opacity-90 transition-opacity">
      {initial}
    </div>
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDashboard = () => {
    // Navigates to the dashboard. (Your DashboardPage already handles 
    // appending the userId automatically based on our previous setup!)
    navigate('/dashboard'); 
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {avatar}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* User Info Section */}
        <div className="px-3 py-2 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0088FF] flex items-center justify-center text-white font-medium text-[15px] flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[14px] text-[#0a0a0a] truncate">
              {user.username}
            </p>
            <p className="text-[12px] text-[#4a5565] truncate">
              {user.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleDashboard} variant="default" className="cursor-pointer">
          <LayoutDashboard className="w-4 h-4" />
          My Dashboard
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleLogout} variant="default">
          <LogOut className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
