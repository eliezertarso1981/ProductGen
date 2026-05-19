"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackLink } from "@/components/shared/crud-ui";
import { HypothesisDetailContent } from "@/components/hipoteses/hypothesis-detail-content";

export default function HypothesisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";

  return (
    <div className="px-6 py-5">
      <div className="mb-4">
        <BackLink href="/hipoteses" label="Hipóteses" />
      </div>
      <div className="max-w-5xl">
        <HypothesisDetailContent id={id} isNew={isNew} onDeleted={() => router.push("/hipoteses")} />
      </div>
    </div>
  );
}
