"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useMemo, useEffect, useRef } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { fetchRequests, normalizeQuery, getRequestLabel } from "./server";
import type { Request } from "./Request";

export default function SearchDropdown() {
  const router = useRouter();
  const [queryInputValue, setQueryInputValue] = useState("");
  const [allOptions, setAllOptions] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const normalizedQuery = useMemo(
    () => normalizeQuery(queryInputValue),
    [queryInputValue]
  );

  // Fetch all requests when dropdown opens
  useEffect(() => {
    if (!isOpen) return;

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    fetchRequests("", 0, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setAllOptions(data.items);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => { controller.abort(); };
  }, [isOpen]);

  // Client-side filter based on input
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery.trim()) return allOptions;
    const q = normalizedQuery.toLowerCase();
    return allOptions.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.outletName || "").toLowerCase().includes(q) ||
        (r.fromCity || "").toLowerCase().includes(q) ||
        (r.toCity || "").toLowerCase().includes(q)
    );
  }, [allOptions, normalizedQuery]);

  const handleInputChange = useCallback(
    (_event: React.SyntheticEvent, newInputValue: string) => {
      setQueryInputValue(newInputValue);
    },
    []
  );

  const handleSelect = (
    event: React.SyntheticEvent,
    request: Request | null
  ) => {
    if (request) {
      router.push(`/app/requests/${request.id}`);
    }
    setQueryInputValue("");
    setIsOpen(false);
  };

  return (
    <Autocomplete<Request>
      disablePortal
      options={filteredOptions}
      sx={{ width: "100%" }}
      getOptionLabel={getRequestLabel}
      isOptionEqualToValue={(option, candidate) => option.id === candidate.id}
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      onChange={handleSelect}
      onInputChange={handleInputChange}
      renderInput={(params) => (
        <TextField {...params} label="Search requests..." placeholder="Search perfume, sneakers, tech..." />
      )}
    />
  );
}
