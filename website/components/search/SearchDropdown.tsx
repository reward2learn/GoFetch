"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useMemo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { fetchRequests, normalizeQuery, getRequestLabel } from "./server";
import type { Request } from "./Request";

export default function SearchDropdown() {
  const router = useRouter();
  const [queryInputValue, setQueryInputValue] = useState("");
  const [options, setOptions] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedQuery = useMemo(
    () => normalizeQuery(queryInputValue),
    [queryInputValue]
  );

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setQueryInputValue(newInputValue);
    },
    []
  );

  React.useEffect(() => {
    if (normalizedQuery.trim().length === 0) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetchRequests(normalizedQuery, 0, new AbortController().signal)
      .then((data) => {
        if (!cancelled) {
          setOptions(data.items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [normalizedQuery]);

  const handleSelect = (
    event: React.SyntheticEvent,
    request: Request | null
  ) => {
    if (request) {
      router.push(`/app/requests/${request.id}`);
    }
    setQueryInputValue("");
    setOptions([]);
  };

  return (
    <Autocomplete<Request>
      disablePortal
      options={options}
      sx={{ width: "100%" }}
      getOptionLabel={getRequestLabel}
      isOptionEqualToValue={(option, candidate) => option.id === candidate.id}
      loading={isLoading}
      onChange={handleSelect}
      onInputChange={handleInputChange}
      renderInput={(params) => (
        <TextField {...params} label="Search requests..." placeholder="Search perfume, sneakers, tech..." />
      )}
    />
  );
}
