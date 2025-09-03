import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import AppPagination from "~/components/app-pagination";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import debounce from "lodash.debounce";
import useApi from "~/hooks/use-api";
import type { Pagination, Project, Task, User } from "~/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Label } from "~/components/ui/label";
import InputError from "~/components/input-error";
import { format, set } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Select } from "~/components/select";
import useAuthStore from "~/store/auth.store";

const statuses = [
  {
    value: "todo",
    label: "To Do",
    color: "bg-gray-200 text-gray-800",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-yellow-200 text-yellow-800",
  },
  {
    value: "done",
    label: "Done",
    color: "bg-green-200 text-green-800",
  },
];

export default function Index() {
  const [params, setSearchParams] = useSearchParams();
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project>();
  const [tasks, setTasks] = useState<Pagination<Task>>();
  const { get } = useApi({});
  const { get: getProject } = useApi({});
  const { get: getUsers } = useApi({});
  const [search, setSearch] = useState(params.get("search") || "");
  const [users, setUsers] = useState<User[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(
    params.get("status") || ""
  );

  useEffect(() => {
    getProject(`/projects/${projectId}`, {
      onSuccess: (res) => {
        setProject(res.data.data);
      },
      onError: (err, res) => {
        if (res.status === 404) {
          console.log(err);
        }
      },
    });
  }, [projectId]);

  const getTasks = (
    page: string,
    search: string,
    status: string = "",
    assigned_to_id: string = ""
  ) => {
    get(
      `/projects/${projectId}/tasks?per_page=10&page=${page}&search=${search}&status=${status}&assigned_to_id=${assigned_to_id}`,
      {
        onStart: () => {
          setTasks(undefined);
        },
        onSuccess: (res) => {
          setTasks(res.data);
        },
      }
    );
  };

  useEffect(() => {
    const page = params.get("page") || "1";
    const search = params.get("search") || "";
    const status = params.get("status") || "";
    const assigned_to_id = params.get("assigned_to_id") || "";

    getTasks(page, search, status, assigned_to_id);
  }, [params]);

  useEffect(() => {
    getTasks("1", search, filterStatus, params.get("assigned_to_id") || "");

    getUsers("/users?per_page=1000", {
      onSuccess: (res) => {
        setUsers(res.data.data);
      },
    });
  }, []);

  useEffect(() => {
    if (params.get("status") || filterStatus) {
      params.set("status", filterStatus || "");
      setSearchParams(params);
    }
  }, [filterStatus]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        params.set("search", value);
        setSearchParams(params);
      }, 300),
    [params, setSearchParams]
  );

  const clearFilter = () => {
    params.delete("search");
    params.delete("status");
    params.delete("assigned_to_id");
    setSearchParams(params);
    setSearch("");
    setFilterStatus("");
  };

  return (
    <div className="p-2 md:p-6">
      {project && <ProjectCard project={project!} />}
      <div className="flex justify-between mb-3">
        <div className="block md:flex gap-4">
          <div>
            <Input
              value={search}
              onChange={handleSearch}
              placeholder="Search tasks"
            />
          </div>

          <div className="inline-flex gap-2">
            <Label htmlFor="status">Status:</Label>

            <div className="w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-start justify-start"
                  >
                    {statuses.find((status) => status.value === filterStatus)
                      ?.label || "All"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-max" align="start">
                  <DropdownMenuLabel>Select a status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={filterStatus}
                    onValueChange={(value) => setFilterStatus(value)}
                  >
                    {statuses.map((status) => (
                      <DropdownMenuRadioItem
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="inline-flex gap-2 w-full">
            <Label htmlFor="assigned_to_id">Assigned:</Label>

            <Select
              value={params.get("assigned_to_id") || ""}
              onValueChange={(value) => {
                params.set("assigned_to_id", value);
                setSearchParams(params);
              }}
              placeholder="Select a user"
              options={users.map((user) => ({
                value: user.id.toString(),
                label: user.name,
              }))}
            />
          </div>

          <Button
            onClick={clearFilter}
            variant="outline"
            className="cursor-pointer"
          >
            Clear
          </Button>
        </div>
        <AddDialog users={users} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.data.map((task) => (
          <TaskCard key={task.id} task={task} users={users} />
        ))}
      </div>
      <div className="mt-2">
        <AppPagination pagination={tasks} />
      </div>
    </div>
  );
}

function ProjectCard({
  project: { id, title, description, start_date, end_date },
}: {
  project: Project;
}) {
  return (
    <Card className="w-full shadow-sm mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Start:</span>{" "}
          {format(start_date || new Date(), "PP")}
        </p>
        <p>
          <span className="font-medium text-foreground">End:</span>{" "}
          {format(end_date || new Date(), "PP")}
        </p>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, users }: { task: Task; users: User[] }) {
  const { isRoleAdmin, user } = useAuthStore();

  const statusColor = {
    todo: "bg-gray-200 text-gray-800",
    in_progress: "bg-yellow-200 text-yellow-800",
    done: "bg-green-200 text-green-800",
  }[task.status];

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{task.title}</CardTitle>
        <CardDescription>Assigned to: {task.assigned_to?.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          <div>
            <span
              className={`px-3 py-1 rounded-md text-sm font-medium ${statusColor}`}
            >
              {task.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex gap-2">
            {isRoleAdmin ||
              (task.assigned_to?.id === user?.id && (
                <EditDialog task={task} users={users} />
              ))}
            {isRoleAdmin && <DeleteDialog task={task} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddDialog({ users }: { users: User[] }) {
  const { projectId } = useParams<{ projectId: string }>();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [params, setSearchParams] = useSearchParams();

  const { post, data, setData, errors, reset, processing } = useApi({
    title: "",
    status: "todo",
    assigned_to_id: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(`/projects/${projectId}/tasks`, {
      onSuccess: () => {
        reset();
        params.set("page", "1");
        params.set("a", Math.random().toString());
        setSearchParams(params);
        toast.success("Task created successfully");
        cancelRef.current?.click();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={submit}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                autoFocus
                tabIndex={1}
                autoComplete="title"
                onChange={(e) => setData("title", e.target.value)}
                value={data.title}
                placeholder="New Task"
              />
              <InputError message={errors.title as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-start justify-start"
                  >
                    {
                      statuses.find((status) => status.value === data.status)
                        ?.label
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-max" align="start">
                  <DropdownMenuLabel>Select a status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={data.status}
                    onValueChange={(value) => setData("status", value)}
                  >
                    {statuses.map((status) => (
                      <DropdownMenuRadioItem
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <InputError message={errors.status as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assigned_to_id">Assigned to</Label>

              <Select
                name="assigned_to_id"
                onValueChange={(value) => setData("assigned_to_id", value)}
                value={data.assigned_to_id}
                options={users.map((user) => ({
                  value: user.id.toString(),
                  label: user.name,
                }))}
                placeholder="Select a user"
              />

              <InputError message={errors.assigned_to_id as string} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button ref={cancelRef} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={submit}
              className="cursor-pointer"
              disabled={processing}
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({ task, users }: { task: Task; users: User[] }) {
  const { isRoleAdmin } = useAuthStore();
  const { projectId } = useParams<{ projectId: string }>();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [params, setSearchParams] = useSearchParams();

  const { put, data, setData, errors, reset, processing } = useApi({
    title: task.title,
    status: task.status,
    assigned_to_id: task.assigned_to?.id.toString() || "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/projects/${projectId}/tasks/${task.id}`, {
      onSuccess: () => {
        reset();
        params.set("e", Math.random().toString());
        setSearchParams(params);
        toast.success("Task updated successfully");
        cancelRef.current?.click();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={submit}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                autoFocus
                tabIndex={1}
                autoComplete="title"
                onChange={(e) => setData("title", e.target.value)}
                value={data.title}
                placeholder="New Task"
              />
              <InputError message={errors.title as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full text-start justify-start"
                  >
                    {
                      statuses.find((status) => status.value === data.status)
                        ?.label
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-max" align="start">
                  <DropdownMenuLabel>Select a status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={data.status}
                    onValueChange={(value) =>
                      setData(
                        "status",
                        value as "todo" | "in_progress" | "done"
                      )
                    }
                  >
                    {statuses.map((status) => (
                      <DropdownMenuRadioItem
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <InputError message={errors.status as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assigned_tos">Assigned to</Label>

              <Select
                disabled={!isRoleAdmin}
                name="assigned_to_id"
                onValueChange={(value) => setData("assigned_to_id", value)}
                value={data.assigned_to_id}
                options={users.map((user) => ({
                  value: user.id.toString(),
                  label: user.name,
                }))}
                placeholder="Select a user"
              />

              <InputError message={errors.assigned_to_id as string} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button ref={cancelRef} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={submit}
              className="cursor-pointer"
              disabled={processing}
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({ task }: { task: Task }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [params, setSearchParams] = useSearchParams();
  const { projectId } = useParams<{ projectId: string }>();

  const { delete: deleteTask, processing } = useApi({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    deleteTask(`/projects/${projectId}/tasks/${task.id}`, {
      onSuccess: () => {
        params.set("page", "1");
        params.set("deleted", "1");
        setSearchParams(params);
        toast.success("Task deleted successfully");
        cancelRef.current?.click();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="cursor-pointer">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={submit}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this Task? This action cannot be
              undone.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button ref={cancelRef} variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              onClick={submit}
              className="cursor-pointer"
              variant="destructive"
              disabled={processing}
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
