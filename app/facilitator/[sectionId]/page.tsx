"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Circle, MoreVertical, Plus, Vote } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Section = {
  id: number;
  name: string;
  grade_level: number;
};

type Student = {
  id: string;
  full_name: string;
  has_voted: boolean;
  voted_at: string | null;
};

type ResultCandidate = {
  id: string;
  full_name: string;
  position: string;
  target_grade_level: number | null;
  partylist: {
    name: string;
    color_hex: string;
  };
  vote_count: number;
};

export default function FacilitatorPortal() {
  const params = useParams();
  const router = useRouter();
  const sectionId = Number(params.sectionId);

  const [section, setSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sectionResults, setSectionResults] = useState<ResultCandidate[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [voteFilter, setVoteFilter] = useState("all");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [manageUnlocked, setManageUnlocked] = useState(false);
  const [managePin, setManagePin] = useState("");
  const [manageError, setManageError] = useState("");
  const [showTally, setShowTally] = useState(false);
  const supabase = createClient();

  const manageStorageKey = `lhs-facilitator-manage-${sectionId}`;

  useEffect(() => {
    if (!Number.isFinite(sectionId)) return;
    loadSection();
    loadStudents();
    loadSectionResults();

    const studentsChannel = supabase
      .channel("students-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
          filter: `section_id=eq.${sectionId}`,
        },
        () => loadStudents(),
      )
      .subscribe();

    const votesChannel = supabase
      .channel("votes-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "votes",
          filter: `section_id=eq.${sectionId}`,
        },
        () => loadSectionResults(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [sectionId]);

  useEffect(() => {
    if (!Number.isFinite(sectionId)) return;
    const stored = sessionStorage.getItem(manageStorageKey);
    setManageUnlocked(stored === "1");
    setManagePin("");
    setManageError("");
  }, [manageStorageKey, sectionId]);

  const loadSection = async () => {
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("id", sectionId)
      .single();
    setSection(data ?? null);
  };

  const loadStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("section_id", sectionId)
      .order("full_name");
    setStudents(data ?? []);
  };

  const loadSectionResults = async () => {
    const { data: candidates } = await supabase
      .from("candidates")
      .select(
        "id, full_name, position, target_grade_level, partylist:partylists(name, color_hex)",
      )
      .order("position");

    const { data: votes } = await supabase
      .from("votes")
      .select("candidate_id")
      .eq("section_id", sectionId);

    const voteCounts = new Map<string, number>();
    votes?.forEach((vote) => {
      const candidateId = vote.candidate_id as string;
      voteCounts.set(candidateId, (voteCounts.get(candidateId) ?? 0) + 1);
    });

    const resultsWithZeros = (candidates ?? []).map((candidate) => ({
      ...(candidate as unknown as Omit<ResultCandidate, "vote_count">),
      vote_count: voteCounts.get(candidate.id) ?? 0,
    }));

    setSectionResults(resultsWithZeros as ResultCandidate[]);
  };

  const handleAddStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newStudentName.trim()) return;

    await supabase.from("students").insert({
      full_name: newStudentName.trim(),
      section_id: sectionId,
    });

    setNewStudentName("");
    setShowAddStudent(false);
    loadStudents();
  };

  const handleUpdateStudent = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    await supabase.from("students").update({ full_name: newName }).eq("id", id);
    setEditingStudent(null);
    loadStudents();
  };

  const handleDeleteStudent = async (id: string, hasVoted: boolean) => {
    if (hasVoted) {
      alert("Cannot delete a student who has already voted");
      return;
    }
    if (confirm("Delete this student?")) {
      await supabase.from("students").delete().eq("id", id);
      loadStudents();
    }
  };

  const handleStartVoting = (studentId: string) => {
    router.push(`/ballot/${studentId}`);
  };

  const handleManageUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    if (managePin.trim() === "LHS2025") {
      sessionStorage.setItem(manageStorageKey, "1");
      setManageUnlocked(true);
      setManagePin("");
      setManageError("");
    } else {
      setManageError("Incorrect PIN.");
    }
  };

  const handleManageLock = () => {
    sessionStorage.removeItem(manageStorageKey);
    setManageUnlocked(false);
    setManagePin("");
    setManageError("");
    setShowAddStudent(false);
    setEditingStudent(null);
    setMenuOpenId(null);
  };

  const votedCount = students.filter((student) => student.has_voted).length;
  const totalCount = students.length;

  const filteredStudents = students.filter((student) => {
    const matchesQuery = student.full_name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());

    const matchesStatus =
      voteFilter === "all"
        ? true
        : voteFilter === "voted"
          ? student.has_voted
          : !student.has_voted;

    return matchesQuery && matchesStatus;
  });

  const groupedResults = sectionResults.reduce<
    Record<string, ResultCandidate[]>
  >((acc, result) => {
    const key = result.target_grade_level
      ? `${result.position} (Grade ${result.target_grade_level})`
      : result.position;
    if (!acc[key]) acc[key] = [];
    acc[key].push(result);
    return acc;
  }, {});

  Object.keys(groupedResults).forEach((key) => {
    groupedResults[key].sort((a, b) => b.vote_count - a.vote_count);
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          {section && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Section {section.name}
                </h1>
                <p className="text-sm text-slate-600">
                  Grade {section.grade_level} · Facilitator Portal
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/facilitator">
                    <Button variant="outline" size="sm">
                      Back to Sections
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" size="sm">
                      Home
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {votedCount}/{totalCount}
                </p>
                <p className="text-sm text-slate-600">Students Voted</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-slate-600">
                {manageUnlocked
                  ? "Manage mode unlocked. Add, edit, or remove students before they vote."
                  : "Read-only mode. Enter the facilitator PIN to manage students."}
              </p>
            </div>

            {manageUnlocked ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  size="lg"
                  className="gap-2 px-6"
                  onClick={() => setShowAddStudent((value) => !value)}
                >
                  <Plus className="w-5 h-5" />
                  {showAddStudent ? "Close" : "Add New Student"}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={handleManageLock}
                >
                  Lock Management
                </Button>
              </div>
            ) : (
              <form
                onSubmit={handleManageUnlock}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <Input
                  value={managePin}
                  onChange={(event) => setManagePin(event.target.value)}
                  placeholder="Enter PIN"
                  type="password"
                  className="h-11 w-full sm:w-40"
                />
                <Button type="submit" size="lg" className="px-6">
                  Unlock
                </Button>
                {manageError && (
                  <span className="text-xs text-red-600">{manageError}</span>
                )}
              </form>
            )}
          </div>

          {showAddStudent && manageUnlocked && (
            <form onSubmit={handleAddStudent} className="mt-4 flex gap-2">
              <Input
                value={newStudentName}
                onChange={(event) => setNewStudentName(event.target.value)}
                placeholder="Enter student's full name"
                className="h-14 text-lg flex-1"
                autoFocus
              />
              <Button type="submit" size="lg" className="gap-2 px-8">
                Add Student
              </Button>
            </form>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Section Tally
                </h2>
                <p className="text-sm text-slate-600">
                  Live count for this section only
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTally((value) => !value)}
                aria-expanded={showTally}
              >
                {showTally ? "Hide Tally" : "Show Tally"}
              </Button>
            </div>
          </div>
          {showTally && (
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedResults).map(
                  ([position, candidates]) => {
                    const maxVotes = Math.max(
                      ...candidates.map((candidate) => candidate.vote_count),
                      1,
                    );

                    return (
                      <div
                        key={position}
                        className="rounded-lg border border-slate-200 p-4 space-y-3"
                      >
                        <h3 className="text-sm font-semibold text-slate-600">
                          {position}
                        </h3>
                        {candidates.map((candidate) => {
                          const percentage =
                            (candidate.vote_count / maxVotes) * 100;

                          return (
                            <div key={candidate.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-slate-900">
                                    {candidate.full_name}
                                  </span>
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      backgroundColor: `${candidate.partylist.color_hex}20`,
                                      color: candidate.partylist.color_hex,
                                    }}
                                  >
                                    {candidate.partylist.name}
                                  </span>
                                </div>
                                <span className="text-lg font-semibold text-slate-900">
                                  {candidate.vote_count}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor:
                                      candidate.partylist.color_hex,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  },
                )}
              </div>

              {Object.keys(groupedResults).length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  No candidates available yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900">Voter List</h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search student name"
                  className="h-10 w-full sm:w-64"
                />
                <select
                  value={voteFilter}
                  onChange={(event) => setVoteFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                >
                  <option value="all">All</option>
                  <option value="voted">Voted</option>
                  <option value="pending">Not voted</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                {manageUnlocked && editingStudent === student.id ? (
                  <div className="flex gap-2">
                    <Input
                      defaultValue={student.full_name}
                      onBlur={(event) =>
                        handleUpdateStudent(student.id, event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          handleUpdateStudent(
                            student.id,
                            event.currentTarget.value,
                          );
                        }
                      }}
                      className="h-12"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      onClick={() => setEditingStudent(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      {student.has_voted ? (
                        <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
                      ) : (
                        <Circle className="w-8 h-8 text-slate-300 shrink-0" />
                      )}
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {student.full_name}
                        </p>
                        {student.has_voted && student.voted_at && (
                          <p className="text-sm text-slate-500">
                            Voted on{" "}
                            {new Date(student.voted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!student.has_voted && (
                        <Button
                          size="lg"
                          onClick={() => handleStartVoting(student.id)}
                          className="gap-2 px-6"
                        >
                          <Vote className="w-5 h-5" />
                          Start Voting
                        </Button>
                      )}
                      {manageUnlocked && (
                        <div className="relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            onClick={() =>
                              setMenuOpenId(
                                menuOpenId === student.id ? null : student.id,
                              )
                            }
                          >
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                          {menuOpenId === student.id && (
                            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                                onClick={() => {
                                  setEditingStudent(student.id);
                                  setMenuOpenId(null);
                                }}
                              >
                                Edit name
                              </button>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  handleDeleteStudent(
                                    student.id,
                                    student.has_voted,
                                  );
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No matching students found.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
