import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase.ts";
import { login } from "../features/login.ts";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice.ts";
import type { RootState } from "../redux/store";
import Navbar from "../components/Navbar.tsx";
import Sidebar from "../components/Sidebar.tsx";
import { Folder, Loader2, Plus } from "lucide-react";
import { getProjects, getStarredProjects } from "../features/project.ts";
import { setProjects } from "../redux/projectSlice.ts";
import ProjectCard from "../components/ProjectCard.tsx";
import CreateProjectModal from "../components/CreateProjectModal.tsx";

function Dashboard() {
    const [loading, setLoading] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const [activeSession, setActiveSession] = useState("projects");
    const dispatch = useDispatch();
    const { userData, isCheckingAuth } = useSelector(
        (state: RootState) => state.user,
    );
    const { projects } = useSelector((state: RootState) => state.project);

    const handleLogin = async () => {
        setLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        const token = await result.user.getIdToken();

        const data = await login(token);
        dispatch(setUserData(data));

        setLoading(false);
    };

    const fetchAllProjects = async () => {
        setLoadingProjects(true);
        const data = await getProjects();
        dispatch(setProjects(data));
        setLoadingProjects(false);
    };
    const fetchStarredProjects = async () => {
        setLoadingProjects(true);
        const data = await getStarredProjects();
        dispatch(setProjects(data));
        setLoadingProjects(false);
    };

    useEffect(() => {
        if (activeSession === "projects") {
            fetchAllProjects();
        } else {
            fetchStarredProjects();
        }
    }, [activeSession]);

    if (isCheckingAuth) {
        return (
            <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 transition-colors duration-300 dark:bg-[#07070c]">
                <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-150 w-150 -translate-x-1/2 rounded-full bg-white/5 blur-[120px] dark:block" />

                <div className="relative w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/8 dark:bg-white/3 dark:shadow-black/40">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5 dark:border-transparent">
                        <span className="text-lg font-bold text-slate-900">
                            AI
                        </span>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                        Welcome to bratCode
                    </h2>
                    <div className="flex items-center justify-center py-10">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800 dark:border-white/20 dark:border-t-white" />
                    </div>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-50 px-4 transition-colors duration-300 dark:bg-[#07070c]">
                <div className="pointer-events-none absolute -top-32 left-1/2 hidden h-150 w-150 -translate-x-1/2 rounded-full bg-white/5 blur-[120px] dark:block" />

                <div className="relative w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white/80 p-8 text-center shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/8 dark:bg-white/3 dark:shadow-black/40">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5 dark:border-transparent">
                        <span className="text-lg font-bold text-slate-900">
                            AI
                        </span>
                    </div>
                    <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                        Welcome to bratCode
                    </h2>
                    <p className="mb-6 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                        Sign in to access your projects and continue building.
                    </p>
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="cursor-pointer flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white py-2.5 text-[13.5px] font-medium text-slate-800 shadow-sm transition-colors duration-150 hover:bg-slate-50 disabled:opacity-70 dark:border-transparent dark:bg-white dark:hover:bg-slate-100"
                    >
                        <FcGoogle />
                        {loading ? "Signing In..." : "Continue with Google"}
                    </button>
                    <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-600">
                        By continuing you agree to our Terms & Privacy Policy.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[#07070c]">
            <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-175 w-175 rounded-full bg-white/4 blur-[140px] dark:block" />

            <div className="pointer-events-none absolute right-0 top-1/3 hidden h-125 w-125 rounded-full bg-white/3 blur-[130px] dark:block" />

            <div className="relative flex min-h-0 flex-1 flex-col">
                <Navbar />

                <div className="flex flex-1 min-h-0">
                    <Sidebar
                        activeSession={activeSession}
                        setActiveSession={setActiveSession}
                    />
                    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8 scrollbar-thin [scrollbar-color:rgba(100,116,139,0.35)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                        <div className="mb-8 flex items-start justify-between">
                            <div>
                                <h1 className="flex items-center gap-2 text-[26px] font-bold text-slate-900 dark:text-white">
                                    Welcome Back,{" "}
                                    {userData?.name?.split(" ")[0] || "User"}
                                    <span>👋</span>
                                </h1>
                                <p className="mt-1 text-[13.5px] text-slate-500 dark:text-slate-400">
                                    Ready to build something amazing today?
                                </p>
                            </div>
                            <button
                                onClick={() => setOpenModal(true)}
                                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-opacity duration-150 hover:opacity-90 dark:bg-white dark:text-slate-900"
                            >
                                <Plus size={16} />
                                New Project
                            </button>
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-[16px] font-semibold text-slate-900 dark:text-white">
                                {activeSession === "starred"
                                    ? "Starred Projects"
                                    : "Recent Projects"}
                            </h2>
                        </div>

                        {loadingProjects ? (
                            <div className="flex min-h-75 items-center justify-center">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-slate-400 dark:text-slate-500"
                                />
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="mb-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 py-16 text-center dark:border-white/10 dark:bg-white/1">
                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/10">
                                    <Folder
                                        size={24}
                                        className="text-slate-500 dark:text-white"
                                    />
                                </div>
                                <h3 className="mb-1.5 text-[16px] font-semibold text-slate-900 dark:text-white">
                                    {activeSession == "starred"
                                        ? "No starred projects"
                                        : "No projects yet"}
                                </h3>

                                <p className="mb-5 max-w-xs text-[13px] text-slate-500 dark:text-slate-500">
                                    {activeSession == "starred"
                                        ? "Star a project to see it here."
                                        : "Create your first project and start building something amazing!"}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {projects.map((p, i) => (
                                    <ProjectCard key={p._id || i} project={p} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {openModal && (
                <CreateProjectModal onClose={() => setOpenModal(false)} />
            )}
        </div>
    );
}

export default Dashboard;
