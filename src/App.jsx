import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useUser } from "./contexts/UserContext";
import BadgeUnlockToast from "./components/BadgeUnlockToast";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";

const HomePage = lazy(() => import("./pages/HomePage"));
const LessonView = lazy(() => import("./pages/LessonView"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const RankingPage = lazy(() => import("./pages/RankingPage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const StoriesPage = lazy(() => import("./pages/StoriesPage"));
const WelcomePage = lazy(() => import("./pages/WelcomePage"));

function SplashScreen() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="glass-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 animate-float items-center justify-center rounded-[26px] bg-gradient-to-br from-brand-green to-brand-blue text-4xl text-white shadow-card">
          E
        </div>
        <h1 className="text-3xl font-black">English Quest</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Preparando tu experiencia de aprendizaje...
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ allowOnboarding = false, children }) {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { loading: userLoading, onboardingComplete } = useUser();

  if (loading || (user && userLoading)) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!onboardingComplete && !allowOnboarding) {
    return <Navigate to="/welcome" replace />;
  }

  if (onboardingComplete && allowOnboarding) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  const { onboardingComplete } = useUser();

  if (loading) {
    return <SplashScreen />;
  }

  if (user) {
    return <Navigate to={onboardingComplete ? "/home" : "/welcome"} replace />;
  }

  return children;
}

function AppLayout() {
  const { activeBadgeToast } = useUser();

  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <BottomNav />
        <BadgeUnlockToast badge={activeBadgeToast} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute allowOnboarding>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/modules" element={<ModulePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/stories" element={<StoriesPage />} />
          <Route path="/module/:id" element={<LessonView />} />
          <Route path="/module/:id/quiz" element={<QuizPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
