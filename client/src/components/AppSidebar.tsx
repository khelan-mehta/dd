import { 
  LayoutDashboard, 
  Receipt, 
  CheckSquare, 
  Users, 
  Settings, 
  Building2,
  LogOut
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const user = AuthService.getUser();
  const collapsed = state === 'collapsed';

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const employeeItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'My Expenses', url: '/expenses', icon: Receipt },
    { title: 'Submit Expense', url: '/expenses/new', icon: Receipt },
  ];

  const managerItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'My Expenses', url: '/expenses', icon: Receipt },
    { title: 'Submit Expense', url: '/expenses/new', icon: Receipt },
    { title: 'Approvals', url: '/approvals', icon: CheckSquare },
    { title: 'Team Expenses', url: '/team-expenses', icon: Building2 },
  ];

  const adminItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'All Expenses', url: '/expenses', icon: Receipt },
    { title: 'Approvals', url: '/approvals', icon: CheckSquare },
    { title: 'Users', url: '/users', icon: Users },
    { title: 'Approval Rules', url: '/settings/approval-rules', icon: Settings },
  ];

  let items = employeeItems;
  if (user?.role === 'manager') items = managerItems;
  if (user?.role === 'admin') items = adminItems;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'hover:bg-sidebar-accent/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'}>
      <SidebarContent>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            {!collapsed && <h1 className="font-bold text-lg">ExpenseFlow</h1>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
