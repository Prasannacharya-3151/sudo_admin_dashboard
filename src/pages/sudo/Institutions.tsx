import {
  useEffect,
  useState,
} from "react";

import {
  Plus,
  Search,
  Building2,
  MoreHorizontal,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { toast } from "sonner";

import { useSudoAuth } from "../../context/SudoAuthContext";

import {
  createInstitution,
  createInstitutionAdmin,
  getInstitutions,
} from "../../api/institutionApi";

import type {
  CreateInstitutionPayload,
  Institution,
  InstitutionStatus,
} from "../../types/institution";

// ==========================================
// STATUS STYLES
// ==========================================

const statusStyles: Record<
  InstitutionStatus,
  string
> = {
  onboarding:
    "bg-yellow-100 text-yellow-700",

  active:
    "bg-green-100 text-green-700",

  suspended:
    "bg-red-100 text-red-700",

  inactive:
    "bg-gray-100 text-gray-700",
};

// ==========================================
// COMPONENT
// ==========================================

export default function InstitutionsPage() {
  const { accessToken } =
    useSudoAuth();

  // ==========================================
  // STATE
  // ==========================================

  const [institutions, setInstitutions] =
    useState<Institution[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  // ==========================================
  // LOAD INSTITUTIONS
  // ==========================================

  const loadInstitutions =
    async () => {
      if (!accessToken) return;

      try {
        setIsLoading(true);

        const data =
          await getInstitutions(
            accessToken,
          );

        setInstitutions(data);
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load institutions",
        );
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    void loadInstitutions();
  }, [accessToken]);

  // ==========================================
  // CREATE INSTITUTION
  // ==========================================

  const handleCreateInstitution =
    async (
      event: React.FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (!accessToken) {
        toast.error(
          "Unauthorized. Please login again.",
        );

        return;
      }

      const formData =
        new FormData(event.currentTarget);

      const institutionPayload:
        CreateInstitutionPayload = {
          name:
            String(
              formData.get(
                "institutionName",
              ),
            ),

          code:
            String(
              formData.get(
                "institutionCode",
              ),
            ),

          status:
            formData.get(
              "status",
            ) as InstitutionStatus,

          contact_email:
            String(
              formData.get(
                "contactEmail",
              ),
            ),

          contact_phone:
            String(
              formData.get(
                "contactPhone",
              ),
            ),
        };

      const adminName =
        String(
          formData.get("adminName"),
        );

      const adminEmail =
        String(
          formData.get("adminEmail"),
        );

      const adminPassword =
        String(
          formData.get("adminPassword"),
        );

      try {
        setIsCreating(true);

        // ======================================
        // STEP 1
        // CREATE INSTITUTION
        // ======================================

        const institution =
          await createInstitution(
            institutionPayload,
            accessToken,
          );

        // ======================================
        // STEP 2
        // CREATE INSTITUTION ADMIN
        // ======================================

        await createInstitutionAdmin(
          institution.id,
          {
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: "admin",
          },
          accessToken,
        );

        toast.success(
          "Institution and administrator created successfully",
        );

        setIsCreateOpen(false);

        await loadInstitutions();
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to create institution",
        );
      } finally {
        setIsCreating(false);
      }
    };

  // ==========================================
  // FILTER INSTITUTIONS
  // ==========================================

  const filteredInstitutions =
    institutions.filter(
      (institution) => {
        const query =
          search.toLowerCase();

        return (
          institution.name
            .toLowerCase()
            .includes(query) ||
          institution.code
            .toLowerCase()
            .includes(query) ||
          institution.contact_email
            .toLowerCase()
            .includes(query)
        );
      },
    );

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-8">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Institutions
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage institutions and their
            administrators.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsCreateOpen(true)
          }
          className="flex items-center justify-center gap-2 rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus className="h-5 w-5" />

          Add Institution
        </button>
      </div>

      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search institutions..."
            className="w-full rounded-full border border-gray-200 py-3 pl-12 pr-4 text-sm outline-none transition focus:border-brand-purple"
          />
        </div>

        <button
          type="button"
          onClick={() =>
            void loadInstitutions()
          }
          className="flex items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />

          Refresh
        </button>
      </div>

      {/* ======================================
          INSTITUTIONS LIST
      ====================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <Building2 className="h-12 w-12 text-gray-300" />

            <h3 className="mt-4 font-semibold text-gray-900">
              No institutions found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first institution
              to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInstitutions.map(
              (institution) => (
                <div
                  key={institution.id}
                  className="flex items-center justify-between gap-4 px-6 py-5 transition hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                      <Building2 className="h-6 w-6 text-brand-purple" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {
                          institution.name
                        }
                      </h3>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>
                          {
                            institution.code
                          }
                        </span>

                        <span>
                          •
                        </span>

                        <span>
                          {
                            institution.contact_email
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        statusStyles[
                          institution
                            .status
                        ]
                      }`}
                    >
                      {
                        institution.status
                      }
                    </span>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* ======================================
          CREATE MODAL
      ====================================== */}

      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6">
            {/* HEADER */}

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Create Institution
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Create the institution and
                its administrator account.
              </p>
            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreateInstitution
              }
              className="mt-6 space-y-6"
            >
              {/* INSTITUTION */}

              <div>
                <h3 className="font-semibold text-gray-900">
                  Institution Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    name="institutionName"
                    placeholder="Institution Name"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple"
                  />

                  <input
                    required
                    name="institutionCode"
                    placeholder="Institution Code"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm uppercase outline-none focus:border-brand-purple"
                  />

                  <input
                    required
                    type="email"
                    name="contactEmail"
                    placeholder="Contact Email"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple"
                  />

                  <input
                    name="contactPhone"
                    placeholder="Contact Phone"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple"
                  />

                  <select
                    name="status"
                    defaultValue="onboarding"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple"
                  >
                    <option value="onboarding">
                      Onboarding
                    </option>

                    <option value="active">
                      Active
                    </option>

                    <option value="suspended">
                      Suspended
                    </option>

                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </div>
              </div>

              {/* ADMIN */}

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900">
                  Institution Administrator
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <input
                    required
                    name="adminName"
                    placeholder="Administrator Name"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple"
                  />

                  <input
                    required
                    type="email"
                    name="adminEmail"
                    placeholder="Administrator Email"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple"
                  />

                  <input
                    required
                    type="password"
                    name="adminPassword"
                    minLength={8}
                    placeholder="Password"
                    className="rounded-full border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-purple sm:col-span-2"
                  />
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() =>
                    setIsCreateOpen(false)
                  }
                  disabled={isCreating}
                  className="rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 rounded-full bg-brand-purple px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isCreating && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {isCreating
                    ? "Creating..."
                    : "Create Institution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}