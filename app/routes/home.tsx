import { NavLink } from "react-router";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Button>
        <NavLink to={"/login"}>Login</NavLink>
      </Button>
    </div>
  );
}
