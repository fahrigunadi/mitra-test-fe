import { useInitials } from "~/hooks/use-initials";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Avatar } from "./ui/avatar";
import type { User } from "~/types";

export function UserInfo({
  user,
  showEmail = false,
}: {
  user: User | null;
  showEmail?: boolean;
}) {
  const getInitials = useInitials();

  return (
    <>
      <Avatar className="h-8 w-8 overflow-hidden rounded-full flex justify-center align-middle">
        <AvatarImage src={undefined} alt={user?.name || ""} />
        <AvatarFallback className="w-full text-center align-middle h-full pt-1.5 rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
          {getInitials(user?.name || "")}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user?.name}</span>
        {showEmail && (
          <span className="truncate text-xs text-muted-foreground">
            {user?.email || ""}
          </span>
        )}
      </div>
    </>
  );
}
