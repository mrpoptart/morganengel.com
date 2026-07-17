import { redirect } from "next/navigation";

// The travel section is now organized by trip.
export default function JournalIndexPage() {
  redirect("/trips");
}
