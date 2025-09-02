import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router";
import AppPagination from "~/components/app-pagination";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import debounce from "lodash.debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import useApi from "~/hooks/use-api";
import type { Pagination, Project } from "~/types";
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
import { Textarea } from "~/components/ui/textarea";
import { DatePicker } from "~/components/date-picker";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Index() {
  const [projects, setProjects] = useState<Pagination<Project>>();
  const { get } = useApi({});
  const [search, setSearch] = useState("");

  const [params, setSearchParams] = useSearchParams();

  useEffect(() => {
    const page = params.get("page") || 1;
    const search = params.get("search") || "";

    get(`/projects?per_page=10&page=${page}&search=${search}`, {
      onStart: () => {
        setProjects(undefined);
      },
      onSuccess: (res) => {
        setProjects(res.data);
      },
    });
  }, [params]);

  useEffect(() => {
    setSearch(params.get("search") || "");
  }, [params]);

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

  return (
    <div className="p-2 md:p-6">
      <div className="flex justify-between mb-3">
        <div className="flex gap-2">
          <Input
            value={search}
            onChange={handleSearch}
            placeholder="Search Projects"
          />
        </div>
        <AddDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!projects && (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {projects?.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No projects found
              </TableCell>
            </TableRow>
          )}
          {projects?.data.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.title}</TableCell>
              <TableCell className="max-w-[25vw] truncate">
                {project.description}
              </TableCell>
              <TableCell className="flex gap-1 flex-nowrap">
                <Button className="cursor-pointer" size="sm">
                  <NavLink to={`/dashboard/projects/${project.id}`}>
                    Task
                  </NavLink>
                </Button>
                <EditDialog project={project} />
                <DeleteDialog project={project} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="mt-2">
        <AppPagination pagination={projects} />
      </div>
    </div>
  );
}

export function AddDialog() {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [params, setSearchParams] = useSearchParams();

  const { post, data, setData, errors, reset, processing } = useApi({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post("/projects", {
      onSuccess: () => {
        reset();
        params.set("page", "1");
        params.set("added", "1");
        setSearchParams(params);
        toast.success("Project created successfully");
        cancelRef.current?.click();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={submit}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
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
                placeholder="New Project"
              />
              <InputError message={errors.title as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                tabIndex={1}
                autoComplete="description"
                onChange={(e) => setData("description", e.target.value)}
                value={data.description}
                placeholder="Description"
              />
              <InputError message={errors.description as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <DatePicker
                tabIndex={1}
                onChange={(date: any) =>
                  setData("start_date", format(date, "yyyy-MM-dd"))
                }
                value={data.start_date}
              />
              <InputError message={errors.start_date as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <DatePicker
                tabIndex={1}
                onChange={(date: any) =>
                  setData("end_date", format(date, "yyyy-MM-dd"))
                }
                value={data.end_date}
              />
              <InputError message={errors.end_date as string} />
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

export function EditDialog({ project }: { project: Project }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [params, setSearchParams] = useSearchParams();

  const { put, data, setData, errors, reset, processing } = useApi({
    title: project.title,
    description: project.description,
    start_date: project.start_date,
    end_date: project.end_date,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/projects/${project.id}`, {
      onSuccess: () => {
        reset();
        params.set("page", "1");
        params.set("edited", "1");
        setSearchParams(params);
        toast.success("Project updated successfully");
        cancelRef.current?.click();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="cursor-pointer">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={submit}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
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
                placeholder="New Project"
              />
              <InputError message={errors.title as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                required
                tabIndex={1}
                autoComplete="description"
                onChange={(e) => setData("description", e.target.value)}
                value={data.description}
                placeholder="Description"
              />
              <InputError message={errors.description as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <DatePicker
                tabIndex={1}
                onChange={(date: any) =>
                  setData("start_date", format(date, "yyyy-MM-dd"))
                }
                value={data.start_date}
              />
              <InputError message={errors.start_date as string} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <DatePicker
                tabIndex={1}
                onChange={(date: any) =>
                  setData("end_date", format(date, "yyyy-MM-dd"))
                }
                value={data.end_date}
              />
              <InputError message={errors.end_date as string} />
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

export function DeleteDialog({ project }: { project: Project }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [params, setSearchParams] = useSearchParams();

  const { delete: deleteProject, processing } = useApi({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    deleteProject(`/projects/${project.id}`, {
      onSuccess: () => {
        params.set("page", "1");
        params.set("deleted", "1");
        setSearchParams(params);
        toast.success("Project deleted successfully");
        cancelRef.current?.click();
      },
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" className="cursor-pointer">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={submit}
          className="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this project? This action cannot be
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
