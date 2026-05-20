import { Suspense } from "react";
import TeamEditPageClient from "./TeamEditPageClient";
import { Loader2 } from "lucide-react";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

export default function TeamEditPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TeamEditPageClient />
    </Suspense>
  );
}
