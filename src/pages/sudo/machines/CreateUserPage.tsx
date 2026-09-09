// import {
//   useEffect,
//   useState,
//   type ChangeEvent,
//   type FormEvent,
// } from "react";
// import { useNavigate } from "react-router-dom";

// import {
//   ArrowLeft,
//   Building2,
//   Check,
//   ChevronDown,
//   Loader2,
//   Lock,
//   Mail,
//   Save,
//   UserPlus,
// } from "lucide-react";

// import { toast } from "sonner";

// import { signupUser } from "../../../api/userApi";
// import { getInstitutions } from "../../../api/institutionApi";

// import { useSudoAuth } from "../../../context/SudoAuthContext";

// import type { SignupUserPayload } from "../../../types/user";
// import type { Institution } from "../../../types/institution";

// export default function CreateUserPage() {
//   const navigate = useNavigate();
//   const { accessToken } = useSudoAuth();

//   const [formData, setFormData] = useState({
//     institution_id: "",
//     institution_name: "",
//     email: "",
//     password: "",
//   });

//   const [institutions, setInstitutions] =
//     useState<Institution[]>([]);

//   const [isLoadingInstitutions, setIsLoadingInstitutions] =
//     useState(true);

//   const [institutionDropdownOpen, setInstitutionDropdownOpen] =
//     useState(false);

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     const fetchInstitutions = async () => {
//       if (!accessToken) {
//         setIsLoadingInstitutions(false);
//         return;
//       }

//       try {
//         setIsLoadingInstitutions(true);

//         const result = await getInstitutions(accessToken);

//         setInstitutions(result);
//       } catch (error) {
//         console.error(
//           "Failed to fetch institutions:",
//           error,
//         );

//         const message =
//           error instanceof Error
//             ? error.message
//             : "Failed to load institutions";

//         toast.error(message);
//       } finally {
//         setIsLoadingInstitutions(false);
//       }
//     };

//     fetchInstitutions();
//   }, [accessToken]);

//   const handleChange = (
//     event: ChangeEvent<HTMLInputElement>,
//   ) => {
//     const { name, value } = event.target;

//     setFormData((previous) => ({
//       ...previous,
//       [name]: value,
//     }));
//   };

//   const handleInstitutionSelect = (
//     institution: Institution,
//   ) => {
//     setFormData((previous) => ({
//       ...previous,
//       institution_id: institution.id,
//       institution_name: institution.name,
//     }));

//     setInstitutionDropdownOpen(false);
//   };

//   const handleSubmit = async (
//     event: FormEvent<HTMLFormElement>,
//   ) => {
//     event.preventDefault();

//     if (!formData.institution_id) {
//       toast.error("Please select an institution");
//       return;
//     }

//     if (!formData.email.trim()) {
//       toast.error("Email is required");
//       return;
//     }

//     const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     if (!emailPattern.test(formData.email.trim())) {
//       toast.error("Please enter a valid email");
//       return;
//     }

//     if (!formData.password.trim()) {
//       toast.error("Password is required");
//       return;
//     }

//     if (formData.password.trim().length < 6) {
//       toast.error(
//         "Password must be at least 6 characters",
//       );
//       return;
//     }

//     try {
//       setIsSubmitting(true);

//       const payload: SignupUserPayload = {
//         institution_id: formData.institution_id,
//         institution_name: formData.institution_name,
//         email: formData.email.trim(),
//         password: formData.password,
//       };

//       await signupUser(payload);

//       toast.success("Warden account created successfully");

//       navigate("/sudo/users");
//     } catch (error) {
//       console.error("Create user error:", error);

//       const message =
//         error instanceof Error
//           ? error.message
//           : "Failed to create user";

//       toast.error(message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCancel = () => {
//     navigate("/sudo/users");
//   };

//   return (
//     <div className="mx-auto w-full max-w-4xl">
//       <div className="mb-8">
//         <button
//           type="button"
//           onClick={handleCancel}
//           className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-brand-purple"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back to Users
//         </button>

//         <div className="flex items-start gap-4">
//           <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
//             <UserPlus className="h-7 w-7" />
//           </div>

//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Create Warden
//             </h1>

//             <p className="mt-1 text-sm text-gray-500">
//               Register a new institution-scoped warden
//               account.
//             </p>
//           </div>
//         </div>
//       </div>

//       <form
//         onSubmit={handleSubmit}
//         className="overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm"
//       >
//         <div className="border-b border-gray-100 px-6 py-5">
//           <h2 className="text-lg font-semibold text-gray-900">
//             Warden Information
//           </h2>

//           <p className="mt-1 text-sm text-gray-500">
//             Enter the required information to register
//             the warden.
//           </p>
//         </div>

//         <div className="space-y-6 p-6">
//           <div className="relative">
//             <label className="mb-2 block text-sm font-semibold text-gray-700">
//               Institution
//               <span className="ml-1 text-red-500">*</span>
//             </label>

//             <button
//               type="button"
//               disabled={
//                 isSubmitting || isLoadingInstitutions
//               }
//               onClick={() =>
//                 setInstitutionDropdownOpen(
//                   (previous) => !previous,
//                 )
//               }
//               className="flex h-12 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-left text-sm transition focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
//             >
//               <div className="flex items-center gap-3">
//                 <Building2 className="h-5 w-5 shrink-0 text-gray-400" />

//                 {isLoadingInstitutions ? (
//                   <span className="text-gray-400">
//                     Loading institutions...
//                   </span>
//                 ) : formData.institution_name ? (
//                   <span className="font-medium text-gray-900">
//                     {formData.institution_name}
//                   </span>
//                 ) : (
//                   <span className="text-gray-400">
//                     Select institution
//                   </span>
//                 )}
//               </div>

//               {isLoadingInstitutions ? (
//                 <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
//               ) : (
//                 <ChevronDown
//                   className={`h-5 w-5 text-gray-400 transition ${
//                     institutionDropdownOpen
//                       ? "rotate-180"
//                       : ""
//                   }`}
//                 />
//               )}
//             </button>

//             {institutionDropdownOpen && (
//               <div className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
//                 {institutions.length === 0 ? (
//                   <div className="px-4 py-3 text-sm text-gray-500">
//                     No institutions found
//                   </div>
//                 ) : (
//                   institutions.map((institution) => {
//                     const isSelected =
//                       formData.institution_id ===
//                       institution.id;

//                     return (
//                       <button
//                         key={institution.id}
//                         type="button"
//                         onClick={() =>
//                           handleInstitutionSelect(
//                             institution,
//                           )
//                         }
//                         className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition ${
//                           isSelected
//                             ? "bg-brand-purple/10 text-brand-purple"
//                             : "text-gray-700 hover:bg-gray-50"
//                         }`}
//                       >
//                         <div className="flex items-center gap-3">
//                           <Building2 className="h-4 w-4" />

//                           <span>{institution.name}</span>
//                         </div>

//                         {isSelected && (
//                           <Check className="h-4 w-4" />
//                         )}
//                       </button>
//                     );
//                   })
//                 )}
//               </div>
//             )}

//             <p className="mt-2 text-xs text-gray-500">
//               Select the institution this warden will
//               manage.
//             </p>

//             <input
//               type="hidden"
//               value={formData.institution_id}
//               readOnly
//             />
//           </div>

//           <div>
//             <label
//               htmlFor="email"
//               className="mb-2 block text-sm font-semibold text-gray-700"
//             >
//               Email
//               <span className="ml-1 text-red-500">*</span>
//             </label>

//             <div className="relative">
//               <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

//               <input
//                 id="email"
//                 name="email"
//                 type="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="warden@college.com"
//                 disabled={isSubmitting}
//                 className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
//               />
//             </div>
//           </div>

//           <div>
//             <label
//               htmlFor="password"
//               className="mb-2 block text-sm font-semibold text-gray-700"
//             >
//               Password
//               <span className="ml-1 text-red-500">*</span>
//             </label>

//             <div className="relative">
//               <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

//               <input
//                 id="password"
//                 name="password"
//                 type="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="Enter password"
//                 disabled={isSubmitting}
//                 className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-purple focus:ring-4 focus:ring-brand-purple/10 disabled:cursor-not-allowed disabled:bg-gray-50"
//               />
//             </div>

//             <p className="mt-2 text-xs text-gray-500">
//               At least 6 characters.
//             </p>
//           </div>
//         </div>

//         <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end">
//           <button
//             type="button"
//             onClick={handleCancel}
//             disabled={isSubmitting}
//             className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             Cancel
//           </button>

//           <button
//             type="submit"
//             disabled={
//               isSubmitting || isLoadingInstitutions
//             }
//             className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Creating...
//               </>
//             ) : (
//               <>
//                 <Save className="h-4 w-4" />
//                 Create Warden
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }