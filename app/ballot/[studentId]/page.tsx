"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Vote } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  full_name: string;
  section_id: number;
  has_voted: boolean;
  section: {
    id: number;
    name: string;
    grade_level: number;
  };
};

type Candidate = {
  id: string;
  full_name: string;
  position: string;
  target_grade_level: number | null;
  partylist: {
    name: string;
    color_hex: string;
  };
};

const POSITION_ORDER = [
  "President",
  "Vice-President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Public Information Officer",
  "Protocol Officer",
  "Grade Level Representative",
];

const positionRank = new Map(
  POSITION_ORDER.map((position, index) => [position, index]),
);

export default function BallotPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = String(params.studentId);

  const [student, setStudent] = useState<Student | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadBallot();
  }, [studentId]);

  const loadBallot = async () => {
    const { data: studentData } = await supabase
      .from("students")
      .select("*, section:sections(*)")
      .eq("id", studentId)
      .single();

    if (!studentData) {
      alert("Student not found");
      return;
    }

    if (studentData.has_voted) {
      alert("This student has already voted");
      router.back();
      return;
    }

    setStudent(studentData as Student);

    const { data: candidatesData } = await supabase
      .from("candidates")
      .select("*, partylist:partylists(*)")
      .order("position");

    const voterGrade = studentData.section.grade_level;
    const filtered = (candidatesData ?? []).filter((candidate) => {
      if (candidate.position === "Grade Level Representative") {
        return candidate.target_grade_level === voterGrade + 1;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      const rankA = positionRank.get(a.position) ?? POSITION_ORDER.length;
      const rankB = positionRank.get(b.position) ?? POSITION_ORDER.length;
      if (rankA !== rankB) return rankA - rankB;

      if (a.position === "Grade Level Representative") {
        return (a.target_grade_level ?? 0) - (b.target_grade_level ?? 0);
      }

      return a.full_name.localeCompare(b.full_name);
    });

    setCandidates(sorted as Candidate[]);
    setLoading(false);
  };

  const handleSelect = (
    position: string,
    candidateId: string,
    targetGrade: number | null = null,
  ) => {
    const key = targetGrade ? `${position}-${targetGrade}` : position;
    setSelections({ ...selections, [key]: candidateId });
  };

  const handleSubmit = async () => {
    if (!student) return;

    const votesArray = Object.values(selections).map((candidateId) => ({
      candidate_id: candidateId,
      section_id: student.section_id,
    }));

    if (votesArray.length === 0) {
      alert("Please select at least one candidate");
      return;
    }

    if (!confirm(`Submit ${votesArray.length} vote(s)?`)) return;

    setSubmitting(true);

    const { data, error } = await supabase.rpc("process_vote", {
      p_student_id: studentId,
      p_votes: votesArray,
    });

    if (error || !data?.success) {
      alert(data?.error || "Error submitting vote");
      setSubmitting(false);
      return;
    }

    alert("Vote submitted successfully!");
    router.back();
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Loading ballot...</p>
      </div>
    );
  }

  const groupedCandidates = candidates.reduce<Record<string, Candidate[]>>(
    (acc, candidate) => {
      const key = candidate.target_grade_level
        ? `${candidate.position} (Grade ${candidate.target_grade_level})`
        : candidate.position;
      if (!acc[key]) acc[key] = [];
      acc[key].push(candidate);
      return acc;
    },
    {},
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                SSLG Election Ballot
              </h1>
              <p className="text-lg text-slate-600">
                {student.full_name} · Section {student.section.name}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Select one candidate for each position
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
              <Link href="/">
                <Button variant="outline">Home</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedCandidates).map(
            ([position, positionCandidates]) => {
              const firstCandidate = positionCandidates[0];
              const key = firstCandidate.target_grade_level
                ? `${firstCandidate.position}-${firstCandidate.target_grade_level}`
                : firstCandidate.position;
              const selected = selections[key];

              return (
                <div
                  key={position}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <h2 className="text-xl font-bold text-slate-900 mb-4">
                    {position}
                  </h2>
                  <div className="grid gap-4">
                    {positionCandidates.map((candidate) => {
                      const isSelected = selected === candidate.id;
                      return (
                        <button
                          key={candidate.id}
                          onClick={() =>
                            handleSelect(
                              candidate.position,
                              candidate.id,
                              candidate.target_grade_level,
                            )
                          }
                          className={`
                            p-6 rounded-lg border-2 transition-all text-left
                            hover:shadow-md flex items-center gap-4
                            ${
                              isSelected
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-slate-300"
                            }
                          `}
                          style={{
                            borderLeftWidth: "6px",
                            borderLeftColor: candidate.partylist.color_hex,
                          }}
                        >
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckCircle className="w-10 h-10 text-blue-600" />
                            ) : (
                              <div className="w-10 h-10 rounded-full border-2 border-slate-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xl font-semibold text-slate-900">
                              {candidate.full_name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {candidate.partylist.name}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <Button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(selections).length === 0}
            size="lg"
            className="w-full h-16 text-xl gap-3"
          >
            <Vote className="w-6 h-6" />
            {submitting ? "Submitting..." : "Submit Ballot"}
          </Button>
          <p className="text-center text-sm text-slate-500 mt-4">
            {Object.keys(selections).length} position(s) selected
          </p>
        </div>
      </div>
    </div>
  );
}
