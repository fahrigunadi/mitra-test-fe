import type { Pagination as PaginationResponse } from "~/types";
import React from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

type AppPaginationProps<T = any> = {
  pagination?: PaginationResponse<T>;
};

const AppPagination = <T,>({ pagination }: AppPaginationProps<T>) => {
  const pageLinks = (pagination?.meta?.links ?? []).slice(1, -1);
  const prevLink = (pagination?.meta?.links ?? [])[0];
  const nextLink = (pagination?.meta?.links ?? [])[
    pagination?.meta?.links?.length ? pagination?.meta?.links.length - 1 : 0
  ];

  if ((pagination?.meta?.total ?? 0) <= (pagination?.meta?.per_page ?? 0)) {
    return null;
  }

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious to={prevLink?.url!} />
        </PaginationItem>
        {pageLinks?.map((link, index) => (
          <PaginationItem key={index}>
            {link.url ? (
              <PaginationLink isActive={link.active} to={new URL(link.url).pathname.replace("/api", "") + new URL(link.url).search + new URL(link.url).hash}>
                <span dangerouslySetInnerHTML={{ __html: link.label }} />
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext to={nextLink?.url!} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default AppPagination;
