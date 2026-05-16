import { Quote } from "lucide-react";
import { BrandMark } from "./brand-mark";

export function TestimonialPanel() {
  const dotPattern = "radial-gradient(circle, rgba(94,234,212,0.18) 1px, transparent 1px)";

  return (
    <div
      className="relative hidden h-full flex-col justify-between overflow-hidden p-12 md:flex"
      style={{
        backgroundColor: "#0f172a",
        backgroundImage: dotPattern,
        backgroundSize: "24px 24px",
      }}
    >
      <div>
        <BrandMark theme="dark" />
      </div>

      <div className="max-w-xl">
        <Quote size={28} color="var(--primary)" className="mb-5" />
        <p className="text-2xl font-semibold leading-snug text-white">
          Pela primeira vez consigo provar que o que entregamos moveu o que prometemos.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            MS
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Maria Souza</div>
            <div className="text-xs" style={{ color: "var(--fg-faint)" }}>
              VP de Produto, Acme Corp
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-10 gap-y-2 text-xs font-semibold tracking-[0.2em]"
        style={{ color: "#475569" }}
      >
        <span>ACME</span>
        <span>NIMBUS</span>
        <span>HELIA</span>
        <span>STRATA</span>
        <span>VOLTA</span>
      </div>
    </div>
  );
}
