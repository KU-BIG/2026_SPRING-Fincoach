import type { DataSource } from "../lib/api";

/* Small pill that tells the reader whether what they see is live backend data
   or the bundled demo showcase. Reuses the design's chip language (dot + mono
   label) so it sits naturally in headers. */
export default function SourceBadge({
  source,
  liveLabel = "실시간 데이터",
  demoLabel = "데모 데이터",
}: {
  source: DataSource;
  liveLabel?: string;
  demoLabel?: string;
}) {
  const live = source === "live";
  return (
    <span className={`source-badge ${live ? "live" : "demo"}`}>
      <span className="dot"></span>
      {live ? liveLabel : demoLabel}
    </span>
  );
}
