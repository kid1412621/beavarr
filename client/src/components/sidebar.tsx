import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";

interface NavItem {
  title: string;
  to: string;
  icon?: React.ReactNode;
}

const defaultIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

interface SidebarProps {
  items: NavItem[];
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ items, className, onItemClick }: SidebarProps) {
  const location = useLocation();

  return (
    <nav className={cn("flex flex-col w-full flex-1 shrink-0", className)}>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-2 px-3 h-[40px] text-base font-normal transition-colors border-l-2",
            location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to))
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-transparent"
          )}
        >
          {item.icon || defaultIcon}
          {item.title}
        </Link>
      ))}

      <div className="mt-auto pt-4">
        <ModeToggle />
      </div>
    </nav>
  );
}
