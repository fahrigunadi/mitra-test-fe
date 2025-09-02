import { NavMain } from "~/components/nav-main";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "~/components/ui/sidebar";
import { LayoutGrid } from "lucide-react";
import type { NavItem } from "~/types";

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    to: "dashboard",
    icon: LayoutGrid,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarContent>
        <NavMain items={mainNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
