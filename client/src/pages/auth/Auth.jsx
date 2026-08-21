import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  FiEye,
  FiEyeOff,
  FiArrowLeft,
} from "react-icons/fi";

import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
} from "../../components/ui/tabs";

import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";

import { toast } from "sonner";

import apiClient from "../../lib/api-client";
import { useAppStore } from "../../store";

const Auth = () => {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const { setUserInfo } =
    useAppStore();

  const initialTab =
    searchParams.get("tab") ===
    "signup"
      ? "signup"
      : "login";

  const [activeTab, setActiveTab] =
    useState(initialTab);

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
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    const tab =
      searchParams.get("tab");

    if (
      tab === "login" ||
      tab === "signup"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const changeTab = (tab) => {
    setActiveTab(tab);

    setSearchParams({
      tab,
    });
  };

  const normalizedEmail =
    email.trim().toLowerCase();

  const validateEmail = () => {
    if (!normalizedEmail) {
      toast.error(
        "Email is required",
      );
      return false;
    }

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !validEmail.test(
        normalizedEmail,
      )
    ) {
      toast.error(
        "Enter a valid email address",
      );

      return false;
    }

    return true;
  };

  const validateLogin = () => {
    if (!validateEmail()) {
      return false;
    }

    if (!password) {
      toast.error(
        "Password is required",
      );

      return false;
    }

    return true;
  };

  const validateSignup = () => {
    if (!validateEmail()) {
      return false;
    }

    if (password.length < 6) {
      toast.error(
        "Password must be at least 6 characters",
      );

      return false;
    }

    if (
      password !== confirmPassword
    ) {
      toast.error(
        "Passwords do not match",
      );

      return false;
    }

    return true;
  };

  const continueAfterAuth = (
    user,
  ) => {
    setUserInfo(user);

    if (user.profileSetup) {
      navigate("/chat");
    } else {
      navigate("/profile");
    }
  };

  const handleLogin =
    async (event) => {
      event.preventDefault();

      if (!validateLogin()) {
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await apiClient.post(
            "/api/auth/login",
            {
              email:
                normalizedEmail,
              password,
            },
          );

        if (
          response.data?.user?.id
        ) {
          toast.success(
            "Welcome back",
          );

          continueAfterAuth(
            response.data.user,
          );
        }
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to login",
        );
      } finally {
        setSubmitting(false);
      }
    };

  const handleSignup =
    async (event) => {
      event.preventDefault();

      if (!validateSignup()) {
        return;
      }

      try {
        setSubmitting(true);

        const response =
          await apiClient.post(
            "/api/auth/signup",
            {
              email:
                normalizedEmail,
              password,
            },
          );

        if (
          response.data?.user?.id
        ) {
          toast.success(
            "Account created",
          );

          continueAfterAuth(
            response.data.user,
          );
        }
      } catch (error) {
        toast.error(
          error.response?.data
            ?.message ||
            "Unable to create account",
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <main className="min-h-screen bg-[#111218] text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#191a22] overflow-hidden shadow-2xl grid lg:grid-cols-2">
        <section className="hidden lg:flex relative flex-col justify-between p-12 bg-gradient-to-br from-purple-700 to-[#1a102b]">
          <Link
            to="/"
            className="flex items-center gap-3 text-white"
          >
            <div className="flex gap-1">
              <span className="block h-7 w-3 skew-x-[-20deg] bg-white" />
              <span className="block h-7 w-3 skew-x-[-20deg] bg-white" />
              <span className="block h-7 w-3 skew-x-[-20deg] bg-white" />
            </div>

            <span className="text-2xl font-bold">
              Syncronus
            </span>
          </Link>

          <div>
            <h2 className="text-4xl font-bold leading-tight">
              One place for
              conversations that matter.
            </h2>

            <p className="mt-5 text-purple-100/80 leading-7">
              Real-time messages,
              persistent conversations,
              file sharing and channels in
              one focused workspace.
            </p>
          </div>

          <p className="text-sm text-purple-200/70">
            Fast. Focused. Connected.
          </p>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
          >
            <FiArrowLeft />
            Back to home
          </Link>

          <div className="mt-9">
            <h1 className="text-3xl font-bold">
              {activeTab === "login"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p className="mt-2 text-neutral-400">
              {activeTab === "login"
                ? "Sign in to continue your conversations."
                : "Join Syncronus and start connecting."}
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={
              changeTab
            }
            className="mt-8"
          >
            <TabsList className="w-full grid grid-cols-2 bg-[#252630] p-1 rounded-xl">
              <TabsTrigger
                value="login"
                className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Login
              </TabsTrigger>

              <TabsTrigger
                value="signup"
                className="rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="login"
              className="mt-7"
            >
              <form
                onSubmit={
                  handleLogin
                }
                className="space-y-5"
              >
                <AuthInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                />

                <PasswordField
                  value={password}
                  onChange={
                    setPassword
                  }
                  showPassword={
                    showPassword
                  }
                  setShowPassword={
                    setShowPassword
                  }
                />

                <Button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500"
                >
                  {submitting
                    ? "Signing in..."
                    : "Sign In"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-neutral-400">
                Don't have an
                account?{" "}
                <button
                  type="button"
                  onClick={() =>
                    changeTab(
                      "signup",
                    )
                  }
                  className="text-purple-400 hover:text-purple-300"
                >
                  Create one
                </button>
              </p>
            </TabsContent>

            <TabsContent
              value="signup"
              className="mt-7"
            >
              <form
                onSubmit={
                  handleSignup
                }
                className="space-y-5"
              >
                <AuthInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                />

                <PasswordField
                  value={password}
                  onChange={
                    setPassword
                  }
                  showPassword={
                    showPassword
                  }
                  setShowPassword={
                    setShowPassword
                  }
                />

                <AuthInput
                  label="Confirm password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Repeat your password"
                />

                <Button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-500"
                >
                  {submitting
                    ? "Creating account..."
                    : "Create Account"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-neutral-400">
                Already have an
                account?{" "}
                <button
                  type="button"
                  onClick={() =>
                    changeTab(
                      "login",
                    )
                  }
                  className="text-purple-400 hover:text-purple-300"
                >
                  Sign in
                </button>
              </p>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </main>
  );
};

const AuthInput = ({
  label,
  ...props
}) => (
  <label className="block">
    <span className="block mb-2 text-sm text-neutral-300">
      {label}
    </span>

    <Input
      {...props}
      className="h-12 rounded-xl bg-[#252630] border-white/10 text-white placeholder:text-neutral-500 focus:border-purple-500"
    />
  </label>
);

const PasswordField = ({
  value,
  onChange,
  showPassword,
  setShowPassword,
}) => (
  <label className="block">
    <span className="block mb-2 text-sm text-neutral-300">
      Password
    </span>

    <div className="relative">
      <Input
        type={
          showPassword
            ? "text"
            : "password"
        }
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder="Enter your password"
        className="h-12 pr-12 rounded-xl bg-[#252630] border-white/10 text-white placeholder:text-neutral-500 focus:border-purple-500"
      />

      <button
        type="button"
        onClick={() =>
          setShowPassword(
            (current) =>
              !current,
          )
        }
        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
      >
        {showPassword ? (
          <FiEyeOff />
        ) : (
          <FiEye />
        )}
      </button>
    </div>
  </label>
);

export default Auth;