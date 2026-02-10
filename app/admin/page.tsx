"use client";

import CandidateManagement from "@/components/admin/CandidateManagement";
import PartylistManagement from "@/components/admin/PartylistManagement";
import SectionManagement from "@/components/admin/SectionManagement";
import StudentRoster from "@/components/admin/StudentRoster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const ADMIN_PIN = "LHS2025";
const ADMIN_KEY = "lhs-admin-unlocked";

export default function AdminDashboard() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY);
    if (stored === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pin === ADMIN_PIN) {
      setUnlocked(true);
      setError("");
      sessionStorage.setItem(ADMIN_KEY, "true");
      return;
    }
    setError("Incorrect PIN. Try again.");
  };

  const handleLock = () => {
    setUnlocked(false);
    setPin("");
    setError("");
    sessionStorage.removeItem(ADMIN_KEY);
  };

  const handleResetVoting = async () => {
    const confirmed = confirm(
      "Reset all votes? This will clear vote records and mark all students as not voted.",
    );
    if (!confirmed) return;

    setResetting(true);

    await supabase
      .from("votes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("students")
      .update({ has_voted: false, voted_at: null })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    setResetting(false);
    alert("Voting has been reset.");
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-16 max-w-lg">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Admin Access
                  </h1>
                  <p className="text-sm text-slate-600">
                    Enter the PIN to continue
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Back to Home
              </Link>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <Input
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder="Enter PIN"
                className="h-12 text-lg"
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              )}
              <Button type="submit" size="lg" className="w-full">
                Unlock Admin Portal
              </Button>
              <p className="text-xs text-slate-500">
                This PIN gate is client-side only. Use Supabase Auth for
                production security.
              </p>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  SSLG Electoral System
                </h1>
                <p className="text-sm text-slate-600">
                  Lungsodaan High School - Admin Portal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
              <Button variant="outline" onClick={handleLock}>
                Lock Admin
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-amber-900">
                Reset Voting Data
              </h2>
              <p className="text-sm text-amber-800">
                Use this after demo runs to clear votes and allow students to
                vote again.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetVoting}
              disabled={resetting}
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              {resetting ? "Resetting..." : "Reset Votes"}
            </Button>
          </div>
        </div>
        <Tabs defaultValue="sections" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white rounded-lg shadow-sm">
            <TabsTrigger value="sections" className="py-3">
              Sections
            </TabsTrigger>
            <TabsTrigger value="partylists" className="py-3">
              Partylists
            </TabsTrigger>
            <TabsTrigger value="candidates" className="py-3">
              Candidates
            </TabsTrigger>
            <TabsTrigger value="roster" className="py-3">
              Student Roster
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections">
            <SectionManagement />
          </TabsContent>

          <TabsContent value="partylists">
            <PartylistManagement />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidateManagement />
          </TabsContent>

          <TabsContent value="roster">
            <StudentRoster />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
