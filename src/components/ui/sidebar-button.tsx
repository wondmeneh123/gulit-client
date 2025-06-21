import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUser } from '@/context/UserContext'
import {
  Home,
  Users,
  
  Settings,
  LogOut,
  UserPlus,
  DollarSign,
  BarChart,
  ClipboardList,
  Building2,
  Shield,
  Wallet
} from 'lucide-react'

interface SidebarButtonProps {
  to: string
  icon: React.ReactNode
  children: React.ReactNode
  isActive?: boolean
}

const SidebarButton = ({ to, icon, children, isActive }: SidebarButtonProps) => {
  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-2',
        isActive && 'bg-accent'
      )}
      asChild
    >
      <Link to={to}>
        {icon}
        {children}
      </Link>
    </Button>
  )
}

export function SidebarNav() {
  const location = useLocation()
  const { userData, signOut } = useUser()

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Home className="h-4 w-4" />,
      path: '/',
      roles: ['admin', 'cashier']
    },
    {
      title: 'Loans',
      icon: <Wallet className="h-4 w-4" />,
      path: '/loans',
      roles: ['admin', 'cashier']
    },
    {
      title: 'New Loan',
      icon: <DollarSign className="h-4 w-4" />,
      path: '/loans/new',
      roles: ['admin', 'cashier']
    },
    {
      title: 'Payments',
      icon: <ClipboardList className="h-4 w-4" />,
      path: '/payments',
      roles: ['admin', 'cashier']
    },
    {
      title: 'Members',
      icon: <Users className="h-4 w-4" />,
      path: '/members',
      roles: ['admin', 'cashier']
    },
    {
      title: 'New Member',
      icon: <UserPlus className="h-4 w-4" />,
      path: '/members/new',
      roles: ['admin', 'cashier']
    },
    {
      title: 'Reports',
      icon: <BarChart className="h-4 w-4" />,
      path: '/reports',
      roles: ['admin']
    },
    {
      title: 'Organization',
      icon: <Building2 className="h-4 w-4" />,
      path: '/organization',
      roles: ['admin']
    },
    {
      title: 'User Management',
      icon: <Shield className="h-4 w-4" />,
      path: '/users',
      roles: ['admin']
    },
    {
      title: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      path: '/settings',
      roles: ['admin']
    }
  ]

  return (
    <div className="flex flex-col gap-2 p-4">
      {menuItems
        .filter(item => item.roles.includes(userData?.role || ''))
        .map((item) => (
          <SidebarButton
            key={item.path}
            to={item.path}
            icon={item.icon}
            isActive={isActive(item.path)}
          >
            {item.title}
          </SidebarButton>
        ))}
      
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
} 