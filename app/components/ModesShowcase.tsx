import { allModes } from "@/lib/modes";
import ModeCard from "./ModeCard";

interface ModesShowcaseProps {
  limit?: number;
  basePath?: string;
}

export default function ModesShowcase({ limit, basePath = "" }: ModesShowcaseProps) {
  const modes = limit ? allModes.slice(0, limit) : allModes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {modes.map((mode, i) => (
        <div key={mode.slug} className={`animate-fade-in-up stagger-${Math.min(i + 1, 7)}`}>
          <ModeCard {...mode} basePath={basePath} />
        </div>
      ))}
    </div>
  );
}
