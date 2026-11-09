import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ErrorState from "../components/ErrorState";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center">
      <ErrorState
        title="This page is missing"
        description="The link you followed may be broken, or the page may have been moved. Let's get you back to your kitchen."
        code="Error 404 • Page not found"
        retryLabel="Back to home"
        retryIcon={<Home className="h-4 w-4" />}
        onRetry={() => navigate("/")}
        backLabel="View history"
        onBack={() => navigate("/history")}
      />
    </div>
  );
}
