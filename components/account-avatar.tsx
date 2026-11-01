"use client";
import { UserRound } from "lucide-react";
import type { Account } from "@/lib/accounts";

export function AccountAvatar({
  user,
  className = "avatar",
}: {
  user: Account | null;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      {user ? (
        user.name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
      ) : (
        <UserRound size={17} />
      )}
    </span>
  );
}
