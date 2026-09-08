import {
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { toast } from "sonner";

import { useSudoAuth } from "../../context/SudoAuthContext";

import WhiteLogo from "../../assets/logo-variation-white.png";
import DarkLogo from "../../assets/logo4-01.png";

export default function SudoSignup() {
  const navigate = useNavigate();

  const { signup } = useSudoAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error(
        "Please fill all fields",
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error(
        "Passwords do not match",
      );
      return;
    }

    if (password.length < 6) {
      toast.error(
        "Password must be at least 6 characters",
      );
      return;
    }

    try {
      setIsLoading(true);

      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      toast.success(
        "Sudo Admin created successfully",
      );

      navigate("/sudo/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create account",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT SIDE */}
        <div className="hidden bg-brand-purple p-12 lg:flex lg:flex-col lg:justify-between">

          {/* Logo */}
          <div>
            <img
              src={WhiteLogo}
              alt="PrintPoint"
              className="h-auto w-44 object-contain"
            />
          </div>

          {/* Content */}
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold leading-tight text-white">
              Control the entire
              <br />
              PrintPoint platform.
            </h1>

            <p className="mt-6 text-base leading-relaxed text-white/80">
              Create your secure Sudo Admin account and
              manage institutions, administrators, kiosks
              and platform operations from one place.
            </p>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} PrintPoint.
            All rights reserved.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex min-h-screen items-center justify-center bg-white px-6 py-10">

          <div className="w-full max-w-sm">

            {/* Logo */}
            <div className="-ml-10">
              <img
                src={DarkLogo}
                alt="PrintPoint"
                className="h-auto w-36 object-contain"
              />
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">
                Create Sudo Admin
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Set up your platform administrator account.
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-4"
            >

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="h-11 w-full rounded-full border border-gray-300 bg-white px-4 text-sm text-brand-dark outline-none transition focus:border-brand-purple"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark">
                  Email Address
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className="h-11 w-full rounded-full border border-gray-300 bg-white px-4 text-sm text-brand-dark outline-none transition focus:border-brand-purple "
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Create a password"
                    autoComplete="new-password"
                    className="h-11 w-full rounded-full border border-gray-300 bg-white px-4 pr-12 text-sm text-brand-dark outline-none transition focus:border-brand-purple "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-brand-purple"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    className="h-11 w-full rounded-full border border-gray-300 bg-white px-4 pr-12 text-sm text-brand-dark outline-none transition focus:border-brand-purple "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-brand-purple"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-purple text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Sudo Admin"
                )}
              </button>
            </form>

            {/* Login */}
            <div className="mt-7 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?
              </p>

              <Link
                to="/sudo/login"
                className="mt-2 inline-block text-sm font-semibold text-brand-purple hover:opacity-80"
              >
                Sign in
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}