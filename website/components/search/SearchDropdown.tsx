"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
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

const PAGE_SIZE = 20;

/**
 * Inner autocomplete that uses TanStack Query for infinite search results.
 */
function RequestsAutocomplete() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [queryInputValue, setQueryInputValue] = React.useState("");
  const debouncedQueryRef = React.useRef("");

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
      enabled: open && queryInputValue.trim().length > 0,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: false,
    });

  const options = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleInputChange = React.useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setQueryInputValue(newInputValue);
    },
    []
  );

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelect = (event: React.SyntheticEvent, request: Request | null) => {
    if (request) {
      router.push(`/app/requests/${request.id}`);
    }
    setOpen(false);
    setQueryInputValue("");
  };

  return (
    <Autocomplete<Request>
      sx={{ width: "100%" }}
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      options={options}
      getOptionLabel={getRequestLabel}
      isOptionEqualToValue={(option, candidate) => option.id === candidate.id}
      loading={isFetching}
      loadingText="Loading requests…"
      disableListWrap
      filterOptions={(x) => x}
      onChange={handleSelect}
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
          component: "ul",
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
