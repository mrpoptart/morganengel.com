import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getTripBySlugServer,
  getJournalByTripServer,
} from "@/lib/posts-server";
import type { RoutePoint } from "@/components/TripRouteMap";
import TripContent from "./TripContent";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

function formatDate(ts: FirebaseFirestore.Timestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlugServer(slug);
  if (!trip) return { title: "Trip not found" };
  const image = trip.coverImage ?? "/og-default.png";
  return {
    title: trip.title,
    description: trip.description,
    openGraph: {
      title: trip.title,
      description: trip.description,
      type: "article",
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: trip.title,
      description: trip.description,
      images: [image],
    },
  };
}

export default async function TripPage({ params }: Props) {
  const { slug } = await params;
  const trip = await getTripBySlugServer(slug);
  if (!trip || trip.status !== "published") notFound();

  const entries = await getJournalByTripServer(trip.id);

  const located = entries.filter((e) => e.location);
  const routePoints: RoutePoint[] = located.map((e, i) => ({
    n: i + 1,
    slug: e.slug,
    title: e.title,
    lat: e.location!.lat,
    lng: e.location!.lng,
    label: e.location!.label,
  }));

  const places = new Set(
    located.map(
      (e) => e.location!.label ?? `${e.location!.lat.toFixed(3)},${e.location!.lng.toFixed(3)}`
    )
  );

  const dated = entries.filter((e) => e.publishedAt);
  const dateRange =
    dated.length === 0
      ? ""
      : dated[0].publishedAt!.toMillis() === dated[dated.length - 1].publishedAt!.toMillis()
      ? formatDate(dated[0].publishedAt)
      : `${formatDate(dated[0].publishedAt)} – ${formatDate(dated[dated.length - 1].publishedAt)}`;

  return (
    <TripContent
      title={trip.title}
      description={trip.description}
      coverImage={trip.coverImage}
      author={trip.author}
      dateRange={dateRange}
      entryCount={entries.length}
      placeCount={places.size}
      routePoints={routePoints}
      entries={entries.map((e) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        excerpt: e.excerpt,
        coverImage: e.coverImage,
        location: e.location,
        date: formatDate(e.publishedAt),
        tags: e.tags,
        author: e.author,
      }))}
    />
  );
}
