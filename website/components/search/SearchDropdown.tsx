"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
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

  const normalizedQuery = useMemo(
    () => normalizeQuery(queryInputValue),
    [queryInputValue]
  );

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsLoading(true);
    fetchRequests("", 0)
      .then((data) => {
        setAllOptions(data.items);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

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

  const handleInputChange = (_event: React.SyntheticEvent, newInputValue: string) => {
    setQueryInputValue(newInputValue);
  };

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
      options={filteredOptions}
      sx={{ width: "100%" }}
      getOptionLabel={getRequestLabel}
      isOptionEqualToValue={(option, candidate) => option.id === candidate.id}
      open={isOpen}
      onOpen={handleOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      onChange={handleSelect}
      onInputChange={handleInputChange}
      renderInput={(params) => (
        <TextField
          {...params}
          slotProps={{
            input: {
              ...params.slotProps?.input,
              className: "bg-surface-2 border border-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-colors",
              endAdornment: params.slotProps?.input?.endAdornment,
            },
          }}
          label="Search requests..."
          placeholder="Search perfume, sneakers, tech..."
        />
      )}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "10px 10px 0px 0px",
          },
        },
        listbox: {
          sx: {
            backgroundColor: "#1a1a2e",
            color: "#fff",
            maxHeight: 384,
          },
        },
      }}
    />
  );
}
