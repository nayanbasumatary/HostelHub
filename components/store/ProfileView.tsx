
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import type { Profile, Hostel } from "@/lib/types";

export function ProfileView({
  profile,
  hostels,
}: {
  profile: Profile;
  hostels: Hostel[];
}) {
  const [form, setForm] = useState({
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    hostel_block: profile.hostel_block ?? "",
  });

  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
      let val = e.target.value;

      if (k === "phone") {
        val = val.replace(/\D/g, "").slice(0, 10);
      }

      setForm((f) => ({ ...f, [k]: val }));
    };

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.phone.trim() || !form.hostel_block.trim()) {
      toast.error("Please enter your phone number and select your hostel.");
      return;
    }

    if (form.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim() || null,
          phone: form.phone.trim(),
          room_number: null,
          hostel_block: form.hostel_block.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Unable to save profile.");
        return;
      }

      toast.success("Profile saved successfully!");

      // Return customers to their original destination.
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect");

      const destination =
        redirectTo &&
        redirectTo.startsWith("/") &&
        !redirectTo.startsWith("//")
          ? redirectTo
          : "/";

      window.location.assign(destination);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <form onSubmit={save} className="glass space-y-4 rounded-2xl p-5">
        <div>
          <Label>Full name</Label>
          <Input
            value={form.full_name}
            onChange={set("full_name")}
          />
        </div>

        <div>
          <Label>Phone *</Label>
          <Input
            value={form.phone}
            onChange={set("phone")}
            inputMode="numeric"
            placeholder="Enter 10-digit phone number"
            required
          />
        </div>

        <div>
          <Label>Hostel *</Label>
          <Select
            value={form.hostel_block}
            onChange={set("hostel_block")}
          >
            <option value="">Select hostel</option>
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.name}>
                {hostel.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="num-row rounded-lg bg-white/5 px-3 py-2 text-sm">
          <span className="text-white/50">Account</span>
          <span className="font-semibold capitalize text-white">
            {profile.role}
          </span>
        </div>

        <Button
          type="submit"
          loading={saving}
          disabled={saving}
          className="w-full"
        >
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
