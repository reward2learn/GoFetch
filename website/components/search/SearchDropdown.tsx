"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { fetchRequests, normalizeQuery, getRequestLabel } from "./server";
import type { Request } from "./Request";

const ITEM_HEIGHT_PX = 48;
const MAX_LISTBOX_HEIGHT_PX = 8 * ITEM_HEIGHT_PX;
const OVERSCAN = 5;
const PAGE_SIZE = 20;

type OptionTuple = readonly [React.HTMLAttributes<HTMLLIElement> & { key: React.Key }, Request];

/**
 * Virtualized listbox component for the Autocomplete dropdown.
 * Uses @tanstack/react-virtual for efficient rendering of 10,000+ options.
 */
const VirtualListbox = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement> & { resetScrollKey?: string }>(
  function VirtualListbox(props, forwardedRef) {
    const { children, style, resetScrollKey, ...listboxProps } = props;
    const items = children as OptionTuple[];
    const scrollContainerRef = useRef<HTMLUListElement | null>(null);
    const setScrollContainerRef = useRef<HTMLUListElement | null>(null);

    const virtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: () => ITEM_HEIGHT_PX,
      overscan: OVERSCAN,
      useFlushSync: false,
    });

    // Keep forwarded ref and scroll ref in sync
    useEffect(() => {
      scrollContainerRef.current = setScrollContainerRef.current;
    }, []);

    // Scroll to top when query changes
    useEffect(() => {
      scrollContainerRef.current?.scrollTo({ top: 0 });
      virtualizer.scrollToOffset(0);
    }, [resetScrollKey, virtualizer]);

    const virtualItems = virtualizer.getVirtualItems();

    return (
      <ul
        ref={setScrollContainerRef}
        {...listboxProps}
        style={{
          ...style,
          boxSizing: "border-box",
          maxHeight: MAX_LISTBOX_HEIGHT_PX,
          overflow: "auto",
          paddingBlock: 0,
          paddingInline: 0,
          margin: 0,
          position: "relative",
          listStyle: "none",
        }}
      >
        <li
          aria-hidden
          role="presentation"
          style={{
            height: virtualizer.getTotalSize(),
            pointerEvents: "none",
          }}
        />
        {virtualItems.map((virtualItem) => {
          const [optionProps, option] = items[virtualItem.index];
          const { key: _optionKey, ...restOptionProps } = optionProps;
          return (
            <li
              key={String(virtualItem.index)}
              {...restOptionProps}
              style={{
                ...optionProps.style,
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <span className="block truncate text-sm px-2 py-1">
                {getRequestLabel(option)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
);

/**
 * Inner autocomplete that uses TanStack Query + virtualized listbox for 10,000+ options.
 */
function RequestsAutocomplete() {
  const router = useRouter();
  const [queryInputValue, setQueryInputValue] = useState("");

  const normalizedQuery = React.useMemo(
    () => normalizeQuery(queryInputValue),
    [queryInputValue]
  );

  const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["requests", normalizedQuery],
      queryFn: ({ pageParam, signal }) =>
        fetchRequests(normalizedQuery, pageParam, signal),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      enabled: queryInputValue.trim().length > 0,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: false,
    });

  const options = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setQueryInputValue(newInputValue);
    },
    []
  );

  const handleSelect = (event: React.SyntheticEvent, request: Request | null) => {
    if (request) {
      router.push(`/app/requests/${request.id}`);
    }
    setQueryInputValue("");
  };

  return (
    <Autocomplete<Request>
      sx={{ width: "100%" }}
      open
      options={options}
      getOptionLabel={getRequestLabel}
      isOptionEqualToValue={(option, candidate) => option.id === candidate.id}
      loading={isFetching}
      loadingText="Loading requests…"
      disableListWrap
      filterOptions={(x) => x}
      onChange={handleSelect}
      onInputChange={handleInputChange}
      renderInput={(params) => {
        const { endAdornment, ...inputSlotProps } = params.slotProps.input;

        return (
          <TextField
            {...params}
            label="Search requests..."
            placeholder="Search perfume, sneakers, tech..."
            slotProps={{
              ...params.slotProps,
              input: {
                ...inputSlotProps,
                endAdornment: (
                  <React.Fragment>
                    {isFetching ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {endAdornment}
                  </React.Fragment>
                ),
              },
            }}
          />
        );
      }}
      slotProps={{
        listbox: {
          component: VirtualListbox,
          resetScrollKey: normalizedQuery,
        } as any,
      }}
    />
  );
}

const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
};

export default function SearchDropdown() {
  const [queryClient] = React.useState(
    () => new QueryClient(queryClientOptions)
  );

  return (
    <QueryClientProvider client={queryClient}>
      <RequestsAutocomplete />
    </QueryClientProvider>
  );
}
