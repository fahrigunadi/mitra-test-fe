import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import { UserInfo } from "~/components/user-info";
import { useMobileNavigation } from "~/hooks/use-mobile-navigation";
import { LogOut, Settings } from "lucide-react";
import useAuthStore from "~/store/auth.store";
import { Button } from "./ui/button";
import type { User } from "~/types";

interface UserMenuContentProps {
  user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
  const cleanup = useMobileNavigation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    cleanup();
    logout();
  };

  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <UserInfo user={user} showEmail={true} />
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <button className="block w-full cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2" />
          Log out
        </button>
      </DropdownMenuItem>
    </>
  );
}
