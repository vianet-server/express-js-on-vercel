import {
  Home,
  LayoutDashboard,
  Bell,
  Package,
  BookOpen,
  Receipt,
  Warehouse,
  Share2,
  BarChart3,
  Upload,
  Settings,
  LogOut,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const basicItems = [
  { title: "Home", url: "/employ/home", icon: Home },
  { title: "Dashboard", url: "/employ/dashboard", icon: LayoutDashboard },
  { title: "Notification", url: "/employ/notification", icon: Bell },
]

const tallyItems = [
  { title: "Stock", url: "/employ/tally/stock", icon: Package },
  { title: "Ledger", url: "/employ/tally/ledger", icon: BookOpen },
  { title: "Voucher", url: "/employ/tally/voucher", icon: Receipt },
  { title: "Godown", url: "/employ/tally/godown", icon: Warehouse },
]

const socialItems = [
  { title: "Home", url: "/employ/social/home", icon: Share2 },
  { title: "Analytics", url: "/employ/social/analytics", icon: BarChart3 },
  { title: "Upload", url: "/employ/social/upload", icon: Upload },
]

const settingItems = [
  { title: "Setting", url: "/employ/setting", icon: Settings },
]

export function EmploySidebar() {
  const location = useLocation()

  const renderItems = (items: { title: string; url: string; icon: any }[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          render={<Link to={item.url} />}
          isActive={location.pathname === item.url}
          tooltip={item.title}
        >
          <item.icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/employ/home" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Home className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Employ</span>
                <span className="text-xs">Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Basic</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(basicItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tally</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(tallyItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Social Media</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(socialItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Setting</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(settingItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/" />} tooltip="Landing">
              <LogOut />
              <span>Back to Site</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}