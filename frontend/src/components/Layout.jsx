import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  House,
  Users,
  ChartBar,
  CloudArrowUp,
  Calendar,
  Dna,
  List,
  X,
  Bell,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", label: "Dashboard", icon: House },
  { path: "/patients", label: "Patients", icon: Users },
  { path: "/reports", label: "Reports", icon: ChartBar },
  { path: "/upload", label: "Upload Data", icon: CloudArrowUp },
  { path: "/schedule", label: "Schedule", icon: Calendar },
];

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-zinc-200 flex flex-col transition-all duration-200`}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-sm flex items-center justify-center">
              <Dna className="text-white" size={24} weight="duotone" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-heading text-lg font-bold tracking-tight text-zinc-900">
                  XAI Pharma
                </h1>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                  Genomic Analysis
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm font-mono text-sm transition-colors duration-200 ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t border-zinc-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full justify-center rounded-sm"
            data-testid="toggle-sidebar"
          >
            {sidebarOpen ? (
              <X size={18} weight="bold" />
            ) : (
              <List size={18} weight="bold" />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <Input
                type="search"
                placeholder="Search patients, reports..."
                className="pl-10 w-80 rounded-sm border-zinc-200 font-mono text-sm"
                data-testid="global-search"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-sm"
                  data-testid="notifications-btn"
                >
                  <Bell size={20} weight="regular" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-sm">
                <div className="p-3 border-b border-zinc-100">
                  <p className="font-heading font-bold text-sm">Notifications</p>
                </div>
                <DropdownMenuItem className="p-3">
                  <div>
                    <p className="font-mono text-sm">New prediction completed</p>
                    <p className="text-xs text-zinc-500 mt-1">2 minutes ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3">
                  <div>
                    <p className="font-mono text-sm">CSV upload successful</p>
                    <p className="text-xs text-zinc-500 mt-1">15 minutes ago</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-sm"
                  data-testid="profile-dropdown"
                >
                  <div className="w-8 h-8 bg-zinc-900 rounded-sm flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-sm">
                      DR
                    </span>
                  </div>
                  {sidebarOpen && (
                    <span className="font-mono text-sm">Dr. Research</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-sm">
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem className="text-rose-500">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-[#F4F4F5]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
