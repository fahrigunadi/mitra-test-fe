import type { NavLinkProps } from "react-router";

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: Date;
    role: string;
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