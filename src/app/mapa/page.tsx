import MapaClient from "./mapa-client";

export default function MapaPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return (
    <main className="flex flex-1 flex-col min-h-0">
      <MapaClient apiKey={apiKey} />
    </main>
  );
}
