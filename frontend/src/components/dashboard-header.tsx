import type { ReactNode } from "react";
import { Bell, LogOut } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Check localStorage first (remembered), then sessionStorage (not remembered)
function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function getUserFromStorage(): { name: string; role: string } {
  const storedName = getStorageItem("name");
  const storedRole = getStorageItem("role");
  if (storedName) return { name: storedName, role: storedRole ?? "" };

  // Fallback: decode from JWT
  try {
    const token = getStorageItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        name: payload.name ?? payload.sub ?? "User",
        role: payload.role ?? "",
      };
    }
  } catch { }

  return { name: "User", role: "" };
}

export function DashboardHeader({ leading }: { leading?: ReactNode }) {
  const navigate = useNavigate();
  const { name, role } = getUserFromStorage();
  const initials = getInitials(name || "U");
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  const handleLogout = () => {
    ["token", "role", "name", "rememberMe"].forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <SidebarTrigger className="text-foreground" />
      <Separator orientation="vertical" className="h-6" />
      {leading ?? <h1 className="text-base font-semibold tracking-tight">SDS Manager</h1>}

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <Button variant="ghost" size="icon" className="relative rounded-lg">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg border bg-card px-2 py-1 pr-3 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-xs font-medium">{name}</span>
                <span className="text-[10px] text-muted-foreground">{displayRole}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
