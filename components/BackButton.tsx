import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  href?: string;
  label?: string;
}

export function BackButton({ href = "/", label = "홈으로" }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="self-start">
      <Link href={href}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        {label}
      </Link>
    </Button>
  );
}
