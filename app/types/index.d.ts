import type { NavLinkProps } from "react-router";

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: Date;
    role: "admin" | "member";
    created_at: Date;
    updated_at: Date;
}

export interface BreadcrumbItem {
    title: string;
    to: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    to: NonNullable<NavLinkProps['to']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface PaginationMetaLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    links: PaginationMetaLink[];
    path: string;
    per_page: number;
    to: number | null;
    total: number;
}

export interface PaginationLink {
    first: string | null;
    last: string | null;
    next: string | null;
    preb: string | null;
}

export interface Pagination<T> {
    data: T[];
    links: PaginationLink[];
    meta: PaginationMeta;
}

export interface Project {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    created_at: Date;
    updated_at: Date;
}

export interface Task {
    id: number;
    title: string;
    status: "todo" | "in_progress" | "done";
    assigned_to: User | null;
    project_id: number;
    created_at: Date;
    updated_at: Date;
}