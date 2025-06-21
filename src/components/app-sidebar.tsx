import * as React from "react"
import {
  Bot, DollarSign, GalleryVerticalEnd,
  LogOut, ReceiptPoundSterlingIcon, SquareTerminal
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { Link, useLocation } from "react-router-dom"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Gulit Sacco",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
}

const menu = [
  { label: "Dashboard", icon: <SquareTerminal />, to: "/home" },
  { label: "Employees", icon: <Bot />, to: "/cashier", roles: ["ADMIN"] },
  { label: "Loans", icon: <DollarSign />, to: "/loans" },
  { label: "Reports", icon: <ReceiptPoundSterlingIcon />, to: "/reports" },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await localStorage.removeItem('token')
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      
      <SidebarContent>
        <div className="flex items-center gap-2 px-6 py-6 border-b">
          <span className="font-bold text-xl text-yellow-500">Gulit SACCO</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {user && menu.filter(item => !item.roles || item.roles.includes(user.role)).map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                location.pathname === item.to
                  ? "bg-yellow-400 text-black shadow"
                  : "text-gray-700 hover:bg-yellow-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-2 items-start px-2 pb-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 px-2 py-1 text-xs"
            onClick={handleLogout}
            style={{ alignSelf: 'flex-start' }}
          >
            <LogOut className="h-3 w-3" />
            <span>Logout</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
