import DisambiguateClient from "@/components/DisambiguateClient";
import { AppHeader } from "@/components/AppHeader";

export default function DisambiguatePage({ searchParams }: { searchParams: Record<string,string> }) {
  const trace = searchParams.trace || "";
  const q = searchParams.q || "";
  
  return (
    <>
      <AppHeader />
      <DisambiguateClient trace={trace} query={q} />
    </>
  );
}
