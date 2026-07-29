import type React from "react";
import { Cloud, FileStack, Unplug } from "lucide-react";

const primaryFeature = {
  icon: Cloud,
  tagline: "Cloud native data processing",
  title: "Runs on our machines, not yours",
  description:
    "Upload raw traces straight from the scope and start the analysis without waiting on a lab workstation. Parsing and analysis take place on our servers and the results are streamed back to you",
}

const secondaryFeatures = [
  {
    icon: FileStack,
    tagline: "Format",
    title: "Your file's structure stays exactly as attached",
    description:
      "Browse groups, datasets, and attributes before running anything. Nothing gets flattened into a CSV, the hierarchy your scope software wrote is the one we open.",
    sample: "tree" as const,
  },
  {
    icon: Unplug,
    tagline: "Plugins",
    title: "Bring the analysis you already trust",
    description:
      "Wrap an existing routine in a small typed function and it shows up as an option the next time anyone on the team runs an analysis, no rewriting a lab's worth of MATLAB from scratch.",
    sample: "code" as const,
  },
]

function IconBadge({
    icon: Icon,
    size = 24,
  }: {
    icon: React.ElementType;
    size?: number;
  }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center justify-center rounded-md border border-border-strong bg-background p-2.5 text-primary">
      <Icon size={size} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}
export default function Features() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-10">
        <span className="font-mono text-5xl uppercase font-bold">
          Features
        </span>
        <h2
          id="features-heading"
          className="max-w-2xl text-balance font-sans text-3xl font-semibold leading-tight sm:text-4xl"
        >
          Point it at your raw traces — <span className="font-mono text-primary">FullSMS</span> takes it form there
        </h2>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <article className="flex flex-col justify-between gap-8 rounded-lg border border-border bg-card p-8 transition-colors hover:border-border-strong lg:col-span-2 lg:row-span-2">
          <div className="flex flex-col gap-5">
            <IconBadge icon={primaryFeature.icon} size={28} />
            <span className="font-mono text-md tracking-widest text-muted-foreground">
              {primaryFeature.tagline}
            </span>
            <h3 className="text-balance font-sans text-2xl font-semibold sm:text-3xl">
              {primaryFeature.title}
            </h3>
            <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
              {primaryFeature.description}
            </p>
          </div>
        </article>

        {secondaryFeatures.map((feature) => (
          <article
            key={feature.title}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-border-strong"
          >
            <IconBadge icon={feature.icon} />
            <span className="font-mono text-xs tracking-widest text-muted-foreground">
              {feature.tagline}
            </span>
            <h3 className="text-balance font-sans text-lg font-semibold">
              {feature.title}
            </h3>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}