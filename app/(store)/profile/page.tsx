
import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getActiveHostels,
} from "@/lib/supabase/queries";
import { ProfileView } from "@/components/store/ProfileView";
import {
  ShareholderAccountCard,
  type MySettlement,
} from "@/components/store/ShareholderAccountCard";
import { createClient } from "@/lib/supabase/server";
import type {
  Shareholder,
  ShareholderSettlement,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [profile, hostels] = await Promise.all([
    getCurrentProfile(),
    getActiveHostels(),
  ]);

  if (!profile) redirect("/login?redirect=/profile");

  const supabase = await createClient();

  // Check whether this account belongs to a shareholder.
  const { data: myShareholderRaw } = await supabase
    .from("shareholders")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const myShareholder = myShareholderRaw as Shareholder | null;

  let mySettlements: MySettlement[] = [];

  if (myShareholder) {
    const { data } = await supabase
      .from("shareholder_settlements")
      .select("*")
      .eq("shareholder_id", myShareholder.id)
      .order("settled_through", { ascending: false });

    mySettlements = (
      (data as ShareholderSettlement[] | null) ?? []
    ).map((s) => ({
      id: s.id,
      amount: Number(s.amount),
      settled_through: s.settled_through,
      status: s.status,
      confirmed_at: s.confirmed_at,
      note: s.note,
      created_at: s.created_at,
    }));
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold text-white">
        Your Profile
      </h1>

      <p className="mb-5 text-sm text-white/50">
        {profile.email}
      </p>

      <ProfileView profile={profile} hostels={hostels} />

      {myShareholder && (
        <ShareholderAccountCard
          name={myShareholder.name}
          sharePercent={Number(myShareholder.share_percent)}
          settlements={mySettlements}
          currency="₹"
        />
      )}
    </div>
  );
}
