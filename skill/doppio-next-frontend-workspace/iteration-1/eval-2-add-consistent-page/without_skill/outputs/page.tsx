"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  useFrappeGetDocList,
  useFrappeDocTypeEventListener,
} from "frappe-react-sdk";

interface Supplier {
  name: string;
  supplier_name: string;
  supplier_group?: string;
  supplier_type?: string;
  country?: string;
  disabled: 0 | 1;
  on_hold: 0 | 1;
  modified: string;
}

type SupplierStatus = "Active" | "On Hold" | "Disabled";

function getStatus(supplier: Supplier): SupplierStatus {
  if (supplier.disabled) return "Disabled";
  if (supplier.on_hold) return "On Hold";
  return "Active";
}

const STATUS_STYLES: Record<SupplierStatus, string> = {
  Active: "bg-green-100 text-green-800",
  "On Hold": "bg-amber-100 text-amber-800",
  Disabled: "bg-gray-100 text-gray-600",
};

function StatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error, mutate } = useFrappeGetDocList<Supplier>(
    "Supplier",
    {
      fields: [
        "name",
        "supplier_name",
        "supplier_group",
        "supplier_type",
        "country",
        "disabled",
        "on_hold",
        "modified",
      ],
      orderBy: { field: "modified", order: "desc" },
      limit: 100,
    }
  );

  // Realtime: refetch the list whenever any Supplier document is
  // created, updated or deleted on the server (socket.io event).
  useFrappeDocTypeEventListener("Supplier", () => {
    mutate();
  });

  const suppliers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (s) =>
        s.supplier_name?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.supplier_group?.toLowerCase().includes(q) ||
        s.country?.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data ? `${suppliers.length} of ${data.length} suppliers` : " "}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            aria-label="Search suppliers"
            className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load suppliers: {error.message ?? "Unknown error"}
          <button
            onClick={() => mutate()}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <ul className="animate-pulse space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="h-16 rounded-lg bg-gray-100" />
          ))}
        </ul>
      )}

      {/* Empty state */}
      {!isLoading && !error && suppliers.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-500">
            {search
              ? `No suppliers match "${search}".`
              : "No suppliers found."}
          </p>
        </div>
      )}

      {/* Supplier list */}
      {!isLoading && !error && suppliers.length > 0 && (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {suppliers.map((supplier) => {
            const status = getStatus(supplier);
            return (
              <li key={supplier.name}>
                <Link
                  href={`/suppliers/${encodeURIComponent(supplier.name)}`}
                  className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-gray-50 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {supplier.supplier_name || supplier.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {[supplier.supplier_group, supplier.country]
                        .filter(Boolean)
                        .join(" · ") || supplier.name}
                    </p>
                  </div>
                  <StatusBadge status={status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
