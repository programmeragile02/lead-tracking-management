"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePathname } from "next/navigation";

export function FAB() {
  const { user } = useCurrentUser();
  const pathname = usePathname();

  const isLeadDetailPage =
    pathname.startsWith("/leads/");

  if (isLeadDetailPage) return null;
  return (
    <>
      {user?.roleCode === "SALES" && (
        <Link href="/leads/new">
          <Button
            size="lg"
            className="fixed bottom-20 right-4 lg:bottom-6 lg:right-8 h-14 w-14 rounded-full shadow-lg bg-primary text-white hover:opacity-90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      )}
    </>
  );
}
