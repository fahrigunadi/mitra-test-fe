import { NavLink } from "react-router";

export default function Home() {
  return (
    <div>
      <NavLink to={"/login"}>
        Login
      </NavLink>
    </div>
  );
}
