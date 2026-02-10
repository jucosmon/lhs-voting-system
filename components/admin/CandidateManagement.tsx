"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { MoreVertical, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";

const POSITIONS = [
  "President",
  "Vice-President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Public Information Officer",
  "Protocol Officer",
];

const GRADE_LEVELS = [8, 9, 10, 11, 12];

type Partylist = {
  id: string;
  name: string;
  color_hex: string;
};

type Candidate = {
  id: string;
  full_name: string;
  position: string;
  partylist_id: string;
  target_grade_level: number | null;
  partylist?: Partylist | null;
};

type Slot = {
  position: string;
  target_grade_level: number | null;
};

export default function CandidateManagement() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [partylists, setPartylists] = useState<Partylist[]>([]);
  const [activeSlot, setActiveSlot] = useState<{
    partylistId: string;
    position: string;
    targetGrade: number | null;
    candidateId: string | null;
  } | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadCandidates();
    loadPartylists();
  }, []);

  const loadCandidates = async () => {
    const { data, error } = await supabase
      .from("candidates")
      .select("*, partylist:partylists(name, color_hex)")
      .order("position");

    if (error) {
      console.error(error);
      return;
    }

    setCandidates(data ?? []);
  };

  const loadPartylists = async () => {
    const { data, error } = await supabase
      .from("partylists")
      .select("id, name, color_hex")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setPartylists(data ?? []);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    await supabase.from("candidates").delete().eq("id", id);
    loadCandidates();
  };

  const handleSaveCandidate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeSlot) return;
    if (!candidateName.trim()) return;

    const payload = {
      full_name: candidateName.trim(),
      position: activeSlot.position,
      partylist_id: activeSlot.partylistId,
      target_grade_level: activeSlot.targetGrade,
    };

    if (activeSlot.candidateId) {
      await supabase
        .from("candidates")
        .update(payload)
        .eq("id", activeSlot.candidateId);
    } else {
      await supabase.from("candidates").insert(payload);
    }

    setActiveSlot(null);
    setCandidateName("");
    loadCandidates();
  };

  const openSlotEditor = (slot: {
    partylistId: string;
    position: string;
    targetGrade: number | null;
    candidate?: Candidate | null;
  }) => {
    setActiveSlot({
      partylistId: slot.partylistId,
      position: slot.position,
      targetGrade: slot.targetGrade,
      candidateId: slot.candidate?.id ?? null,
    });
    setCandidateName(slot.candidate?.full_name ?? "");
  };

  const groupedByPartylist = partylists.reduce<Record<string, Candidate[]>>(
    (acc, party) => {
      acc[party.id] = [];
      return acc;
    },
    {},
  );

  candidates.forEach((candidate) => {
    if (!candidate.partylist_id) return;
    if (!groupedByPartylist[candidate.partylist_id]) {
      groupedByPartylist[candidate.partylist_id] = [];
    }
    groupedByPartylist[candidate.partylist_id].push(candidate);
  });

  const slots: Slot[] = [
    ...POSITIONS.map((position) => ({ position, target_grade_level: null })),
    ...GRADE_LEVELS.map((grade) => ({
      position: "Grade Level Representative",
      target_grade_level: grade,
    })),
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Candidate Management
          </h2>
          <p className="text-sm text-slate-600">
            Add one candidate per position inside each partylist.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {partylists.map((party) => {
          const partyCandidates = groupedByPartylist[party.id] ?? [];
          return (
            <div
              key={party.id}
              className="rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="h-10 w-10 rounded-full border border-slate-200"
                  style={{ backgroundColor: party.color_hex }}
                />
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {party.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {partyCandidates.length} candidate
                    {partyCandidates.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => {
                  const candidate = partyCandidates.find(
                    (item) =>
                      item.position === slot.position &&
                      item.target_grade_level === slot.target_grade_level,
                  );

                  const slotKey = `${slot.position}-${slot.target_grade_level ?? "exec"}`;

                  return (
                    <div
                      key={slotKey}
                      className="rounded-lg border border-slate-200 p-4 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-600">
                          {slot.position}
                        </p>
                        <p className="text-xs text-slate-500">
                          {slot.position === "Grade Level Representative"
                            ? `Grade ${slot.target_grade_level}`
                            : "Executive"}
                        </p>
                      </div>

                      {candidate ? (
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-600" />
                            </div>
                            <p className="font-semibold text-slate-900">
                              {candidate.full_name}
                            </p>
                          </div>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMenuOpenId(
                                  menuOpenId === candidate.id
                                    ? null
                                    : candidate.id,
                                )
                              }
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                            {menuOpenId === candidate.id && (
                              <div className="absolute right-0 mt-2 w-36 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                                  onClick={() => {
                                    openSlotEditor({
                                      partylistId: party.id,
                                      position: slot.position,
                                      targetGrade: slot.target_grade_level,
                                      candidate,
                                    });
                                    setMenuOpenId(null);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    handleDelete(candidate.id);
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-500">Empty</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openSlotEditor({
                                partylistId: party.id,
                                position: slot.position,
                                targetGrade: slot.target_grade_level,
                              })
                            }
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {activeSlot?.partylistId === party.id && (
                <form
                  onSubmit={handleSaveCandidate}
                  className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {activeSlot.position}
                      </p>
                      <p className="text-xs text-slate-500">
                        {activeSlot.position === "Grade Level Representative"
                          ? `Grade ${activeSlot.targetGrade}`
                          : "Executive"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveSlot(null);
                        setCandidateName("");
                      }}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1.5fr_auto] sm:items-end">
                    <div>
                      <Label>Candidate name</Label>
                      <Input
                        value={candidateName}
                        onChange={(event) =>
                          setCandidateName(event.target.value)
                        }
                        placeholder="Juan Dela Cruz"
                        className="h-11"
                        autoFocus
                        required
                      />
                    </div>
                    <Button type="submit">
                      {activeSlot.candidateId ? "Update" : "Save"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
