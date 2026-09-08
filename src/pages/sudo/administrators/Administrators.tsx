import {
  Search,
  Plus,
  Users,
  Building2,
  Mail,
  ShieldCheck,
  MoreVertical,
  RefreshCw,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import type {
  AdministratorDetails,
  AdministratorStatus,
} from "../../../types/administrator";

const administrators: AdministratorDetails[] =
  [];


function StatusBadge({
  status,
}: {
  status: AdministratorStatus;
}) {
  const statusStyles = {
    active:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    inactive:
      "bg-gray-100 text-gray-600 border-gray-200",

    suspended:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

function RoleBadge({
  role,
}: {
  role: "admin" | "staff";
}) {
  return (
    <span
      className={
        role === "admin"
          ? "inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-brand-purple"
          : "inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600"
      }
    >
      {role === "admin"
        ? "Administrator"
        : "Staff"}
    </span>
  );
}

export default function Administrators() {
  const navigate = useNavigate();

 
  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | AdministratorStatus>(
      "all",
    );


  const filteredAdministrators =
    useMemo(() => {
      return administrators.filter((admin) => {
        const matchesSearch =
          admin.name
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase(),
            ) ||
          admin.email
            .toLowerCase()
            .includes(
              searchQuery.toLowerCase(),
            ) ||
          admin.institution_name
            ?.toLowerCase()
            .includes(
              searchQuery.toLowerCase(),
            );

        const matchesStatus =
          statusFilter === "all" ||
          admin.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      });
    }, [
      searchQuery,
      statusFilter,
    ]);

 
  const handleCreateAdministrator = () => {
    navigate("/sudo/admins/create");
  };

  return (
    <div className="space-y-8">

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Administrators
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage institution administrators
            and staff access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateAdministrator}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="mr-2 h-5 w-5" />

          Add Administrator
        </button>

      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <Users className="h-6 w-6 text-brand-purple" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total Administrators
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                {administrators.length}
              </h3>
            </div>

          </div>

        </div>

        {/* ACTIVE */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Active
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                {
                  administrators.filter(
                    (admin) =>
                      admin.status ===
                      "active",
                  ).length
                }
              </h3>
            </div>

          </div>

        </div>

        {/* INSTITUTIONS */}

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Building2 className="h-6 w-6 text-brand-purple" />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Institutions
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                {
                  new Set(
                    administrators.map(
                      (admin) =>
                        admin.institution_id,
                    ),
                  ).size
                }
              </h3>
            </div>

          </div>

        </div>

      </div>

      {/* ====================================== */}
      {/* ADMINISTRATOR MANAGEMENT */}
      {/* ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* ====================================== */}
        {/* TOOLBAR */}
        {/* ====================================== */}

        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">

          {/* SEARCH */}

          <div className="relative w-full lg:max-w-md">

            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value,
                )
              }
              placeholder="Search administrators..."
              className="h-11 w-full rounded-full border border-gray-200 pl-11 pr-4 text-sm outline-none transition focus:border-brand-purple "
            />

          </div>

          {/* FILTER */}

          <div className="flex items-center gap-3">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "all"
                    | AdministratorStatus,
                )
              }
              className="h-11 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none transition focus:border-brand-purple"
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="suspended">
                Suspended
              </option>
            </select>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />

              Refresh
            </button>

          </div>

        </div>

        {/* ====================================== */}
        {/* TABLE */}
        {/* ====================================== */}

        {filteredAdministrators.length >
        0 ? (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-gray-100 bg-gray-50/70">

                <tr>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Administrator
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Institution
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredAdministrators.map(
                  (admin) => (

                    <tr
                      key={admin.id}
                      className="transition hover:bg-gray-50/70"
                    >

                      {/* ADMIN */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-brand-purple">

                            {admin.name
                              .charAt(0)
                              .toUpperCase()}

                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
                              {admin.name}
                            </p>

                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">

                              <Mail className="h-3.5 w-3.5" />

                              {admin.email}

                            </div>

                          </div>

                        </div>

                      </td>

                      {/* INSTITUTION */}

                      <td className="px-6 py-5">

                        <div>

                          <p className="font-medium text-gray-800">
                            {admin.institution_name ||
                              "—"}
                          </p>

                          {admin.institution_code && (
                            <p className="mt-1 text-xs text-gray-500">
                              {
                                admin.institution_code
                              }
                            </p>
                          )}

                        </div>

                      </td>

                      {/* ROLE */}

                      <td className="px-6 py-5">

                        <RoleBadge
                          role={admin.role}
                        />

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">

                        <StatusBadge
                          status={admin.status}
                        />

                      </td>

                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/sudo/admins/${admin.id}`,
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-brand-purple"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                      </td>

                    </tr>

                  ),
                )}

              </tbody>

            </table>

          </div>

        ) : (

          /* ====================================== */
          /* EMPTY STATE */
          /* ====================================== */

          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50">

              <Users className="h-8 w-8 text-brand-purple" />

            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              No administrators found
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Create an administrator for an
              institution to give them access to
              the institution management portal.
            </p>

            <button
              type="button"
              onClick={
                handleCreateAdministrator
              }
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-brand-purple px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus className="mr-2 h-5 w-5" />

              Add Administrator
            </button>

          </div>

        )}

      </div>

    </div>
  );
}