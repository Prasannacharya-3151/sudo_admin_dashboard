import {
  Building2,
  Monitor,
  Users,
  Activity,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";

const stats = [
  {
    title: "Total Institutions",
    value: "0",
    description: "Registered institutions",
    icon: Building2,
  },
  {
    title: "Active Kiosks",
    value: "0",
    description: "Connected kiosk machines",
    icon: Monitor,
  },
  {
    title: "Institution Admins",
    value: "0",
    description: "Platform administrators",
    icon: Users,
  },
  {
    title: "Platform Status",
    value: "Active",
    description: "All systems operational",
    icon: Activity,
  },
];

export default function SudoDashboard() {
  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>

          <h1 className="mt-1 text-3xl font-bold text-[#1A1426] lg:text-4xl">
            Sudo Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Monitor and manage the complete PrintPoint
            platform from one place.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7E49F2]/10">
                  <Icon className="h-6 w-6 text-brand-purple" />
                </div>

                <ArrowUpRight className="h-5 w-5 text-gray-400" />

              </div>

              <div className="mt-5">

                <p className="text-sm text-gray-500">
                  {stat.title}
                </p>

                <h3 className="mt-2 text-3xl font-bold text-brand-dark">
                  {stat.value}
                </h3>

                <p className="mt-2 text-xs text-gray-400">
                  {stat.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

      {/* MAIN GRID */}

      <div className="grid gap-6 xl:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">

            <div>

              <h2 className="text-lg font-bold text-brand-dark">
                Recent Institutions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Recently registered organizations
              </p>

            </div>
            <button
              type="button"
              className="text-sm font-semibold text-brand-purple"
            >
              View all
            </button>
          </div>

          <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-purple/10">
              <Building2 className="h-8 w-8 text-brand-purple" />
            </div>

            <h3 className="mt-5 font-semibold text-brand-dark">
              No institutions yet
            </h3>

            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Registered institutions will appear here
              once they are created.
            </p>
          </div>
        </div>

        {/* Quick Actions */}

        <div className="rounded-2xl border border-gray-200 bg-white p-6">

          <h2 className="text-lg font-bold text-brand-dark">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Frequently used platform actions
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-purple/30 hover:bg-brand-purple/5"
            >

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple/10">
                  <Building2 className="h-5 w-5 text-brand-purple" />
                </div>

                <span className="text-sm font-semibold text-brand-dark">
                  Create Institution
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-purple/30 hover:bg-brand-purple/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple/10">
                  <Users className="h-5 w-5 text-brand-purple" />
                </div>
                <span className="text-sm font-semibold text-brand-dark">
                  Add Administrator
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition hover:border-brand-purple/30 hover:bg-brand-purple/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple/10">
                  <Monitor className="h-5 w-5 text-brand-purple" />
                </div>
                <span className="text-sm font-semibold text-brand-dark">
                  Register Kiosk
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* PLATFORM ACTIVITY */}

      <div className="rounded-2xl border border-gray-200 bg-white">

        <div className="flex items-center justify-between border-b border-gray-100 p-6">

          <div>

            <h2 className="text-lg font-bold text-brand-dark">
              Platform Activity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest activity across the platform
            </p>

          </div>

          <button
            type="button"
            className="text-gray-400"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>

        </div>

        <div className="flex min-h-[180px] items-center justify-center">

          <p className="text-sm text-gray-400">
            Activity will appear here.
          </p>

        </div>

      </div>

    </div>
  );
}