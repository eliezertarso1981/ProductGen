"use client";

import { useState } from "react";
import { Quote } from "lucide-react";
import {
  getAuthorInitials,
  pickRandomTestimonial,
} from "@/lib/auth-testimonials";
import { BrandMark } from "./brand-mark";

export function TestimonialPanel() {
  const [testimonial] = useState(pickRandomTestimonial);
  const dotPattern = "radial-gradient(circle, rgba(94,234,212,0.18) 1px, transparent 1px)";
  const initials = getAuthorInitials(testimonial.autor);

  return (
    <div
      className="relative hidden h-full flex-col overflow-hidden p-12 md:flex"
      style={{
        backgroundColor: "#0f172a",
        backgroundImage: dotPattern,
        backgroundSize: "24px 24px",
      }}
    >
      <div>
        <BrandMark theme="dark" />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="max-w-xl">
        <Quote size={28} color="var(--primary)" className="mb-5" />
        <p className="text-2xl font-semibold leading-snug text-white">{testimonial.frase}</p>
        <div className="mt-8 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {initials}
          </div>
          <div className="text-sm font-semibold text-white">{testimonial.autor}</div>
        </div>
        </div>
      </div>
    </div>
  );
}
