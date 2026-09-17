import PlaceDetalhe from "./place-detalhe";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return <PlaceDetalhe placeId={placeId} apiKey={apiKey} />;
}
