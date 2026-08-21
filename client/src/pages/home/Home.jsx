import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiMessageCircle,
  FiPaperclip,
  FiShield,
  FiUsers,
  FiZap,
} from "react-icons/fi";

import { useAppStore } from "@/store";

const Home = () => {
  const userInfo = useAppStore(
    (state) => state.userInfo,
  );

  const appRoute =
    userInfo?.profileSetup
      ? "/chat"
      : "/profile";

  return (
    <main className="min-h-screen bg-[#111218] text-white overflow-hidden">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 py-6">
        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="flex gap-1">
            <span className="block h-7 w-3 skew-x-[-20deg] bg-purple-500" />
            <span className="block h-7 w-3 skew-x-[-20deg] bg-purple-500" />
            <span className="block h-7 w-3 skew-x-[-20deg] bg-purple-500" />
          </div>

          <span className="text-2xl font-bold">
            Syncronus
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {userInfo ? (
            <Link
              to={appRoute}
              className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium hover:bg-purple-500 transition"
            >
              Open Chat
            </Link>
          ) : (
            <>
              <Link
                to="/auth?tab=login"
                className="hidden sm:block px-5 py-3 text-sm text-neutral-300 hover:text-white"
              >
                Sign in
              </Link>

              <Link
                to="/auth?tab=signup"
                className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-medium hover:bg-purple-500 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center px-6 lg:px-10 pt-20 pb-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300 mb-8">
            <FiZap />
            Real-time communication
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
            Conversations that
            <span className="text-purple-500">
              {" "}
              stay in sync.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-neutral-400">
            Message people in real time,
            share files and images, keep
            conversations organized, and
            collaborate through channels
            from one focused workspace.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to={
                userInfo
                  ? appRoute
                  : "/auth?tab=signup"
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-7 py-4 font-medium hover:bg-purple-500 transition"
            >
              {userInfo
                ? "Open Syncronus"
                : "Start Messaging"}

              <FiArrowRight />
            </Link>

            {!userInfo && (
              <Link
                to="/auth?tab=login"
                className="rounded-xl border border-neutral-700 px-7 py-4 font-medium text-neutral-200 hover:border-neutral-500 hover:bg-white/5 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="mt-12 grid sm:grid-cols-3 gap-5 text-sm text-neutral-400">
            <div className="flex items-center gap-2">
              <FiZap className="text-purple-400" />
              Real-time
            </div>

            <div className="flex items-center gap-2">
              <FiShield className="text-purple-400" />
              Private chats
            </div>

            <div className="flex items-center gap-2">
              <FiPaperclip className="text-purple-400" />
              File sharing
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-12 bg-purple-600/10 blur-3xl rounded-full" />

          <div className="relative rounded-3xl border border-white/10 bg-[#191a22] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-purple-600 flex items-center justify-center font-semibold">
                  S
                </div>

                <div>
                  <p className="font-medium">
                    Syncronus Chat
                  </p>
                  <p className="text-xs text-green-400">
                    Online
                  </p>
                </div>
              </div>

              <FiMessageCircle className="text-neutral-500 text-xl" />
            </div>

            <div className="p-6 space-y-5 min-h-[420px]">
              <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-[#292a33] px-5 py-4">
                <p>
                  Hey, did you get the files?
                </p>
                <span className="text-xs text-neutral-500">
                  10:42 AM
                </span>
              </div>

              <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-md bg-purple-600 px-5 py-4">
                <p>
                  Yep. Everything came through.
                </p>
                <span className="text-xs text-purple-200">
                  10:43 AM
                </span>
              </div>

              <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-md bg-purple-600 px-5 py-4">
                <div className="flex items-center gap-3">
                  <FiPaperclip />
                  <div>
                    <p className="font-medium">
                      project-notes.pdf
                    </p>
                    <p className="text-xs text-purple-200">
                      File shared
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-w-[75%] rounded-2xl rounded-bl-md bg-[#292a33] px-5 py-4">
                <p>
                  Perfect. I'll check it now.
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="rounded-xl bg-[#252630] px-5 py-4 text-neutral-500">
                Type a message...
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#14151c]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-purple-400 font-medium">
              Everything you need
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Built for real conversations
            </h2>

            <p className="mt-4 text-neutral-400">
              A focused communication
              experience without unnecessary
              clutter.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-14">
            <Feature
              icon={<FiMessageCircle />}
              title="Instant messaging"
              description="Send and receive messages in real time with persistent conversation history."
            />

            <Feature
              icon={<FiPaperclip />}
              title="Share anything"
              description="Send images and useful files directly inside your conversations."
            />

            <Feature
              icon={<FiUsers />}
              title="Team channels"
              description="Organize discussions around groups and shared conversations."
            />
          </div>
        </div>
      </section>
    </main>
  );
};

const Feature = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1b23] p-7">
      <div className="h-12 w-12 rounded-xl bg-purple-600/15 text-purple-400 flex items-center justify-center text-xl">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-neutral-400 leading-7">
        {description}
      </p>
    </div>
  );
};

export default Home;