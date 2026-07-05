import { certificationService } from "@/lib/services/certification";
import { PageHeader } from "@/components/page-header";
import { CertificationClient } from "./_components/certification-client";
import type { CertQuestionStatus } from "@/types/db";

export const dynamic = "force-dynamic";

export default async function CertificationPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const quiz = await certificationService.getLiveQuiz();

  if (!quiz) {
    return (
      <div>
        <PageHeader title="Job Readiness Certification" description="The final gate that makes learners eligible to apply for remote jobs." />
        <CertificationClient quiz={null} questions={[]} stats={null} categories={[]} query="" status="all" category="" />
      </div>
    );
  }

  const status = (sp.status as CertQuestionStatus | "all") || "all";
  const [questions, stats, categories] = await Promise.all([
    certificationService.listQuestions(quiz.id, { status, category: sp.category, search: sp.q }),
    certificationService.stats(quiz.id),
    certificationService.categories(quiz.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Job Readiness Certification"
        description="Manage the certification config and its randomized question bank. Passing it makes a learner Job Ready."
      />
      <CertificationClient
        quiz={quiz}
        questions={questions}
        stats={stats}
        categories={categories}
        query={sp.q ?? ""}
        status={status}
        category={sp.category ?? ""}
      />
    </div>
  );
}
