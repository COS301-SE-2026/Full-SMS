import type React from "react";
import { Cloud, FileStack, Unplug, Download } from "lucide-react";

const primaryFeature = {
  icon: Cloud,
  tagline: "Cloud native data processing",
  title: "Runs on our machines, not yours",
  description:
    "Upload raw traces straight from the scope and start the analysis without waiting on a lab workstation. Parsing and analysis take place on our servers and the results are streamed back to you",
}

const secondaryFeatures = [
    {
    icon: Cloud,
    tagline: "Cloud native data processing",
    title: "Runs on our machines, not yours",
    description:
      "Upload raw traces straight from the scope and start the analysis without waiting on a lab workstation. Parsing and analysis take place on our servers and the results are streamed back to you",
  },
    {
    icon: Unplug,
    tagline: "Plugin capability",
    title: "Bring the analysis you already trust",
    description:
      "Wrap an existing routine in a small typed function and it shows up as an option the next time anyone on your team runs an analysis, no rewriting a lab's worth of MATLAB from scratch.",
  },
  {
    icon: FileStack,
    tagline: "Format Consistency",
    title: "Your file's structure stays exactly as attached",
    description:
      "Nothing gets flattened into a CSV (unless you want it to), the hierarchy your scope software wrote is the one we open.",
  },
    {
    icon: Download,
    tagline: "Result Exporting",
    title: "Export analysis results and publication ready visualizations",
    description:
      "Export your analysis results, fittings and plots to CSV, XSLS, Parquet and PNG",
  },

]

function IconBadge({
    icon: Icon,
    size = 48,
  }: {
    icon: React.ElementType;
    size?: number;
  }) {
  return (
    <span className="inline-flex w-fit shrink-0 items-center justify-center rounded-md p-1.5 text-primary">
      <Icon size={size} strokeWidth={1.5} aria-hidden="true" />
    </span>
  );
}
export default function Features() {
  return (
    <section
    id="features"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="features-heading"
    >
      <div className="flex flex-col gap-4 pb-10">
        <span className="font-mono text-5xl uppercase font-bold">
          Features
        </span>
        <h2
          id="features-heading"
          className="max-w-2xl text-balance font-sans text-3xl font-semibold leading-tight sm:text-4xl"
        >
          Point to your raw traces, <span className="font-mono text-primary">Full SMS</span> takes it form there
        </h2>
      </div>

      <div className="mt-10 grid gap-4 grid-rows-2">
        {secondaryFeatures.map((feature, index) => (
          <article
            key={feature.title}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-border-strong"
          >
            <div className="items-center gap">
            <IconBadge icon={feature.icon} />
            <span className="font-mono text-2xl tracking-widest text-muted-foreground ml-2">
              {feature.tagline} 
            </span>
            </div>

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