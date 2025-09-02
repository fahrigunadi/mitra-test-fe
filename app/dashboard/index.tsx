import type { BreadcrumbItem } from "~/types";

type LayoutContext = {
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
};

export default function Index() {
  return <div></div>;
}
