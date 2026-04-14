"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/db/schema";

export function AdminUserRow({
  user,
  currentAdminId,
}: {
  user: Profile;
  currentAdminId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isSelf = user.id === currentAdminId;

  async function handleRoleChange(newRole: string | null) {
    if (!newRole || newRole === user.role) return;
    setSaving(true);
    try {
      await fetch("/api/admin/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2 font-medium">{user.displayName}</td>
      <td className="px-4 py-2 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-2 text-muted-foreground">
        {user.certAgency} · {user.certLevel}
      </td>
      <td className="px-4 py-2">
        {isSelf ? (
          <Badge variant="default" className="capitalize">
            {user.role}
          </Badge>
        ) : (
          <Select
            value={user.role}
            onValueChange={handleRoleChange}
            disabled={saving}
          >
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diver">Diver</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        )}
      </td>
      <td className="px-4 py-2 text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}
