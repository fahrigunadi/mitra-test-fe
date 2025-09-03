import { LoaderCircle } from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { toast } from "sonner";
import InputError from "~/components/input-error";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import useApi from "~/hooks/use-api";

export default function Login() {
  const navigate = useNavigate();
  const { errors, processing, post, data, setData } = useApi({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/auth/register", {
      onSuccess: (res) => {
        navigate("/login");
        toast.success("Account created successfully");
        toast.success("Please login to continue");
      },
    });
  };

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-10 pt-8 pb-0 text-center">
        <CardTitle className="text-xl">Register</CardTitle>
      </CardHeader>
      <CardContent className="px-10 py-8">
        <form onSubmit={submit} className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              autoFocus
              tabIndex={1}
              autoComplete="name"
              onChange={(e) => setData("name", e.target.value)}
              value={data.name}
              placeholder="My name"
            />
            <InputError message={errors.name as string} />
          </div>

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
              autoComplete="new-password"
              onChange={(e) => setData("password", e.target.value)}
              value={data.password}
              placeholder="Password"
            />
            <InputError message={errors.password as string} />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password_confirmation">Password Confirmation</Label>
            </div>
            <Input
              id="password_confirmation"
              type="password"
              name="password_confirmation"
              required
              tabIndex={2}
              autoComplete="new-password"
              onChange={(e) => setData("password_confirmation", e.target.value)}
              value={data.password_confirmation}
            />
            <InputError message={errors.password_confirmation as string} />
          </div>

          <Button
            type="submit"
            className="mt-4 w-full cursor-pointer"
            tabIndex={4}
            disabled={processing}
          >
            {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Register
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-4">
          Already have an account? {" "}
          <NavLink to={"/login"} tabIndex={5}>
            Login
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
