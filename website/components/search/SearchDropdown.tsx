"use client";

import * as React from "react";
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
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [queryInputValue, setQueryInputValue] = React.useState("");
  const virtualizerRef = React.useRef<HTMLUListElement | null>(null);

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
      enabled: open,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    });

  const options = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const handleInputChange = React.useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setInputValue(newInputValue);
      if (newInputValue.trim().length > 0) {
        setQueryInputValue(newInputValue);
      } else {
        setQueryInputValue("");
      }
    },
    []
  );

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
