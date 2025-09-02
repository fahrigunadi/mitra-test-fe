import { LoaderCircle } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import InputError from "~/components/input-error";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useApi from "~/hooks/use-api";
import useAuthStore from "~/store/auth.store";

export default function Login() {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUser } = useAuthStore();
  const { errors, processing, post, data, setData } = useApi({
    email: "",
    password: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/auth/login", {
      onSuccess: (res) => {
        setIsAuthenticated(true);
        setUser(res.data.user);
        localStorage.setItem("authToken", res.data.token);
        navigate("/dashboard");
      },
    });
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-10 pt-8 pb-0 text-center">
        <CardTitle className="text-xl">Login</CardTitle>
      </CardHeader>
      <CardContent className="px-10 py-8">
        <form onSubmit={submit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              name="email"
              required
              autoFocus
              tabIndex={1}
              autoComplete="email"
              onChange={(e) => setData("email", e.target.value)}
              value={data.email}
              placeholder="email@example.com"
            />
            <InputError message={errors.email as string} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              name="password"
              required
              tabIndex={2}
              autoComplete="current-password"
              onChange={(e) => setData("password", e.target.value)}
              value={data.password}
              placeholder="Password"
            />
            <InputError message={errors.password as string} />
          </div>

          <Button
            type="submit"
            className="mt-4 w-full cursor-pointer"
            tabIndex={4}
            disabled={processing}
          >
            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <NavLink to={"/register"} tabIndex={5}>
            Register
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
