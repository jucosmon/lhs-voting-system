"use client";

import CandidateManagement from "@/components/admin/CandidateManagement";
import PartylistManagement from "@/components/admin/PartylistManagement";
import SectionManagement from "@/components/admin/SectionManagement";
import StudentRoster from "@/components/admin/StudentRoster";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
