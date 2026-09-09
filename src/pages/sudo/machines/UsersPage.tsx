// import {
//   Users as UsersIcon,
//   UserPlus,
//   Search,
//   RefreshCw,
//   Trash2,
//   Building2,
//   Mail,
//   Loader2,
//   AlertCircle,
// } from "lucide-react";

// import {
//   useCallback,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import { useNavigate } from "react-router-dom";

// import { toast } from "sonner";

// import { deleteUser, getUsers } from "../../../api/userApi";

// import type { WardenUser } from "../../../types/user";

// export default function UsersPage() {
//   const navigate = useNavigate();

//   const [users, setUsers] = useState<WardenUser[]>([]);

//   const [searchQuery, setSearchQuery] = useState("");

//   const [isLoading, setIsLoading] = useState(true);

//   const [isRefreshing, setIsRefreshing] = useState(false);

//   const [deletingId, setDeletingId] =
//     useState<string | null>(null);

//   const [error, setError] = useState<string | null>(null);

//   const fetchUsers = useCallback(
//     async (showRefreshLoader = false) => {
//       try {
//         setError(null);

//         if (showRefreshLoader) {
//           setIsRefreshing(true);
//         } else {
//           setIsLoading(true);
//         }

//         const data = await getUsers();

//         setUsers(Array.isArray(data) ? data : []);
//       } catch (error) {
//         console.error("Failed to fetch users:", error);

//         const message =
//           error instanceof Error
//             ? error.message
//             : "Failed to load users";

//         setError(message);

//         toast.error(message);
//       } finally {
//         setIsLoading(false);
//         setIsRefreshing(false);
//       }
//     },
//     [],
//   );

//   useEffect(() => {
//     void fetchUsers();
//   }, [fetchUsers]);

//   const filteredUsers = useMemo(() => {
//     const query = searchQuery.trim().toLowerCase();

//     if (!query) {
//       return users;
//     }

//     return users.filter((user) => {
//       return (
//         user.email?.toLowerCase().includes(query) ||
//         user.institution_name
//           ?.toLowerCase()
//           .includes(query) ||
//         user.institution_id
//           ?.toLowerCase()
//           .includes(query) ||
//         user.id?.toLowerCase().includes(query)
//       );
//     });
//   }, [users, searchQuery]);

//   const handleDeleteUser = async (user: WardenUser) => {
//     if (!user.id) {
//       toast.error("User ID is missing");
//       return;
//     }

//     const confirmed = window.confirm(
//       `Are you sure you want to delete "${user.email}"?`,
//     );

//     if (!confirmed) {
//       return;
//     }

//     try {
//       setDeletingId(user.id);

//       await deleteUser(user.id);

//       setUsers((previousUsers) =>
//         previousUsers.filter(
//           (item) => item.id !== user.id,
//         ),
//       );

//       toast.success("User deleted successfully");
//     } catch (error) {
//       console.error("Failed to delete user:", error);

//       const message =
//         error instanceof Error
//           ? error.message
//           : "Failed to delete user";

//       toast.error(message);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex min-h-[500px] items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <Loader2 className="h-10 w-10 animate-spin text-brand-purple" />

//           <p className="text-sm font-medium text-gray-500">
//             Loading users...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//         <div>
//           <div className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/10">
//               <UsersIcon className="h-6 w-6 text-brand-purple" />
//             </div>

//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 Wardens
//               </h1>

//               <p className="mt-1 text-sm text-gray-500">
//                 Manage institution-scoped warden accounts
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => void fetchUsers(true)}
//             disabled={isRefreshing}
//             className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             <RefreshCw
//               className={`h-4 w-4 ${
//                 isRefreshing ? "animate-spin" : ""
//               }`}
//             />
//             Refresh
//           </button>

//           <button
//             type="button"
//             onClick={() => navigate("/sudo/users/create")}
//             className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
//           >
//             <UserPlus className="h-4 w-4" />
//             Add Warden
//           </button>
//         </div>
//       </div>

//       {error && (
//         <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
//           <div className="flex items-center gap-3">
//             <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />

//             <div>
//               <p className="text-sm font-semibold text-red-700">
//                 Failed to load users
//               </p>

//               <p className="text-sm text-red-600">
//                 {error}
//               </p>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={() => void fetchUsers()}
//             className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-100"
//           >
//             Try Again
//           </button>
//         </div>
//       )}

//       <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
//         <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
//           <div>
//             <h2 className="text-lg font-bold text-gray-900">
//               All Wardens
//             </h2>

//             <p className="mt-1 text-sm text-gray-500">
//               {filteredUsers.length} user
//               {filteredUsers.length !== 1 ? "s" : ""} found
//             </p>
//           </div>

//           <div className="relative w-full lg:w-[360px]">
//             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(event) =>
//                 setSearchQuery(event.target.value)
//               }
//               placeholder="Search email or institution..."
//               className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/10"
//             />
//           </div>
//         </div>

//         {filteredUsers.length === 0 ? (
//           <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
//             <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
//               <UsersIcon className="h-8 w-8 text-gray-400" />
//             </div>

//             <h3 className="mt-5 text-lg font-bold text-gray-900">
//               {searchQuery
//                 ? "No users found"
//                 : "No wardens yet"}
//             </h3>

//             <p className="mt-2 max-w-sm text-sm text-gray-500">
//               {searchQuery
//                 ? "Try changing your search query."
//                 : "Create your first warden account to get started."}
//             </p>

//             {!searchQuery && (
//               <button
//                 type="button"
//                 onClick={() =>
//                   navigate("/sudo/users/create")
//                 }
//                 className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
//               >
//                 <UserPlus className="h-4 w-4" />
//                 Add Warden
//               </button>
//             )}
//           </div>
//         ) : (
//           <>
//             {/* DESKTOP TABLE */}
//             <div className="hidden overflow-x-auto lg:block">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
//                       Email
//                     </th>

//                     <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
//                       Institution
//                     </th>

//                     <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
//                       User ID
//                     </th>

//                     <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-gray-100">
//                   {filteredUsers.map((user) => (
//                     <tr
//                       key={user.id}
//                       className="transition hover:bg-gray-50/70"
//                     >
//                       <td className="px-6 py-5">
//                         <div className="flex items-center gap-3">
//                           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
//                             <Mail className="h-5 w-5 text-brand-purple" />
//                           </div>

//                           <span className="font-semibold text-gray-900">
//                             {user.email}
//                           </span>
//                         </div>
//                       </td>

//                       <td className="px-6 py-5">
//                         <div className="flex items-center gap-2">
//                           <Building2 className="h-4 w-4 text-gray-400" />

//                           <span className="text-sm font-medium text-gray-700">
//                             {user.institution_name || "—"}
//                           </span>
//                         </div>
//                       </td>

//                       <td className="px-6 py-5">
//                         <span className="font-mono text-xs text-gray-500">
//                           {user.id}
//                         </span>
//                       </td>

//                       <td className="px-6 py-5">
//                         <div className="flex justify-end gap-2">
//                           <button
//                             type="button"
//                             disabled={deletingId === user.id}
//                             onClick={() =>
//                               void handleDeleteUser(user)
//                             }
//                             title="Delete User"
//                             className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
//                           >
//                             {deletingId === user.id ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Trash2 className="h-4 w-4" />
//                             )}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* MOBILE CARDS */}
//             <div className="divide-y divide-gray-100 lg:hidden">
//               {filteredUsers.map((user) => (
//                 <div key={user.id} className="p-5">
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="flex min-w-0 items-center gap-3">
//                       <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10">
//                         <Mail className="h-5 w-5 text-brand-purple" />
//                       </div>

//                       <div className="min-w-0">
//                         <h3 className="truncate font-semibold text-gray-900">
//                           {user.email}
//                         </h3>

//                         <p className="mt-1 truncate text-xs text-gray-500">
//                           {user.institution_name || "—"}
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="mt-5 flex gap-3">
//                     <button
//                       type="button"
//                       disabled={deletingId === user.id}
//                       onClick={() =>
//                         void handleDeleteUser(user)
//                       }
//                       className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
//                     >
//                       {deletingId === user.id ? (
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                       ) : (
//                         <Trash2 className="h-4 w-4" />
//                       )}
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }