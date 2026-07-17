"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Facility,
  categoryLabels,
  getSavedFacilityIds,
  googleMapsDirectionsUrl,
  osmCoordinatesEmbedUrl,
  osmEmbedUrl,
  searchFacilities,
  toggleSavedFacility,
} from "@/features/facilities/api";

type Coordinates = { latitude: number; longitude: number };

export default function FacilitySearchPage() {
  const [items, setItems] = useState<Facility[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"network" | "server" | null>(null);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [mapFacility, setMapFacility] = useState<Facility | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [nearbySearch, setNearbySearch] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [service, setService] = useState("");
  const [acceptsBpjs, setAcceptsBpjs] = useState(false);
  const [onlineBooking, setOnlineBooking] = useState(false);
  const [accessibility, setAccessibility] = useState("");

  function buildParams(cursor?: string, location = coordinates) {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (region.trim()) params.set("region", region.trim());
    if (category) params.set("category", category);
    if (service.trim()) params.set("service", service.trim());
    if (acceptsBpjs) params.set("accepts_bpjs", "true");
    if (onlineBooking) params.set("online_booking", "true");
    if (accessibility) params.set("accessibility", accessibility);
    if (location) {
      params.set("latitude", String(location.latitude));
      params.set("longitude", String(location.longitude));
      params.set("radius_km", "100");
      params.set("sort", "distance");
    }
    if (cursor) params.set("cursor", cursor);
    return params;
  }

  async function load(
    cursor?: string,
    append = false,
    location = nearbySearch ? coordinates : null,
    clearFilters = false,
  ) {
    setLoading(true);
    setError(null);
    try {
      const result = await searchFacilities(clearFilters ? new URLSearchParams() : buildParams(cursor, location));
      setItems((current) => (append ? [...current, ...result.items] : result.items));
      setNextCursor(result.next_cursor);
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.message === "SERVER_ERROR" ? "server" : "network");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSaved(getSavedFacilityIds());
      void load(undefined, false, null);
    }, 0);
    return () => window.clearTimeout(timer);
    // Initial catalog load only; filters apply after form submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  function withCurrentLocation(action: (location: Coordinates) => void) {
    if (coordinates) {
      action(coordinates);
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage("Browser ini tidak mendukung lokasi.");
      return;
    }
    setLocationMessage("Meminta izin lokasi…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude };
        setCoordinates(location);
        action(location);
      },
      () => setLocationMessage("Lokasi tidak tersedia. Pencarian daftar tetap dapat digunakan."),
      { timeout: 8000 },
    );
  }

  function showCurrentLocation() {
    withCurrentLocation(() => {
      setMapFacility(null);
      setLocationMessage("Lokasi Anda ditampilkan pada peta.");
    });
  }

  function searchNearby() {
    withCurrentLocation((location) => {
      setMapFacility(null);
      setNearbySearch(true);
      setSavedOnly(false);
      setLocationMessage("Menampilkan fasilitas dalam radius 100 km dari lokasi Anda.");
      void load(undefined, false, location);
    });
  }

  function showAllFacilities() {
    setNearbySearch(false);
    setSavedOnly(false);
    setMapFacility(null);
    setQuery("");
    setRegion("");
    setCategory("");
    setService("");
    setAcceptsBpjs(false);
    setOnlineBooking(false);
    setAccessibility("");
    setLocationMessage("Menampilkan kembali semua fasilitas.");
    void load(undefined, false, null, true);
  }

  function toggleSaved(id: string) {
    setSaved(toggleSavedFacility(id));
  }

  function toggleSelected(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(0, 4),
    );
  }

  const visibleItems = savedOnly ? items.filter((item) => saved.includes(item.id)) : items;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <p className="mb-2 text-sm font-semibold text-link">Layanan kesehatan & terapi</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Temukan layanan yang relevan</h1>
        <p className="mt-3 text-secondary">
          Temukan rumah sakit, klinik, pusat terapi, dan sekolah inklusif berdasarkan kebutuhan keluarga. Hasil saat ini menggunakan data demonstrasi yang perlu dikonfirmasi langsung.
        </p>
      </div>

      <form onSubmit={submit} className="mb-8 rounded-2xl border border-default-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium">
            Nama atau layanan
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: fisioterapi"
              maxLength={100}
              className="mt-2 min-h-11 w-full rounded-xl border border-strong-border bg-canvas px-3 outline-none focus:border-focus"
            />
          </label>
          <label className="text-sm font-medium">
            Kota atau provinsi
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="Contoh: Bandung"
              maxLength={100}
              className="mt-2 min-h-11 w-full rounded-xl border border-strong-border bg-canvas px-3 outline-none focus:border-focus"
            />
          </label>
          <label className="text-sm font-medium">
            Jenis fasilitas
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-strong-border bg-canvas px-3 outline-none focus:border-focus"
            >
              <option value="">Semua jenis</option>
              <option value="hospital">Rumah sakit</option>
              <option value="clinic">Klinik</option>
              <option value="therapy_center">Pusat terapi</option>
              <option value="inclusive_school">Sekolah inklusif</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Layanan
            <input
              value={service}
              onChange={(event) => setService(event.target.value)}
              placeholder="Contoh: terapi wicara"
              maxLength={100}
              className="mt-2 min-h-11 w-full rounded-xl border border-strong-border bg-canvas px-3 outline-none focus:border-focus"
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={acceptsBpjs} onChange={(event) => setAcceptsBpjs(event.target.checked)} className="size-5" />
            Menerima BPJS
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={onlineBooking} onChange={(event) => setOnlineBooking(event.target.checked)} className="size-5" />
            Pendaftaran online
          </label>
          <label className="text-sm font-medium">
            Aksesibilitas
            <select
              value={accessibility}
              onChange={(event) => setAccessibility(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-strong-border bg-canvas px-3 outline-none focus:border-focus"
            >
              <option value="">Semua</option>
              <option value="wheelchair_access">Akses kursi roda</option>
              <option value="accessible_toilet">Toilet aksesibel</option>
              <option value="sign_language">Bahasa isyarat</option>
              <option value="sensory_friendly">Ramah sensorik</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <button type="submit" disabled={loading} className="min-h-11 flex-1 rounded-xl bg-brand-primary px-4 font-semibold text-inverse-text hover:bg-brand-primary-hover disabled:opacity-60">
              {loading ? "Mencari…" : "Cari"}
            </button>
            <button type="button" onClick={showCurrentLocation} className="min-h-11 rounded-xl border border-strong-border px-3 hover:bg-subtle">
              Lokasi saya
            </button>
            <button type="button" onClick={searchNearby} className="min-h-11 rounded-xl border border-strong-border px-3 hover:bg-subtle">
              Di sekitar saya
            </button>
          </div>
        </div>
        {locationMessage && <p className="mt-3 text-sm text-secondary" role="status">{locationMessage}</p>}
      </form>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-secondary" aria-live="polite">
          {loading ? "Memuat hasil…" : `${visibleItems.length} fasilitas ditampilkan${nearbySearch ? " dalam radius 100 km" : ""}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {nearbySearch && (
            <button onClick={showAllFacilities} className="min-h-11 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-inverse-text hover:bg-brand-primary-hover">
              Lihat semua fasilitas
            </button>
          )}
          <button onClick={() => setSavedOnly((value) => !value)} className="min-h-11 rounded-xl border border-strong-border px-4 text-sm hover:bg-subtle">
            {savedOnly ? "Tampilkan semua" : `Tersimpan (${saved.length})`}
          </button>
          <Link
            aria-disabled={selected.length < 2}
            href={selected.length >= 2 ? `/app/services/compare?ids=${selected.join(",")}` : "#"}
            className={`flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold ${selected.length >= 2 ? "bg-brand-primary text-inverse-text hover:bg-brand-primary-hover" : "cursor-not-allowed bg-subtle text-secondary"}`}
          >
            Bandingkan ({selected.length}/4)
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 rounded-xl border border-error/30 bg-surface p-4 text-error">
          <p>{error === "server" ? "Server sedang bermasalah." : "Tidak dapat terhubung ke layanan."} Daftar terakhir tetap ditampilkan bila tersedia.</p>
          <button onClick={() => void load()} className="mt-3 min-h-11 rounded-xl border border-error/40 px-4">Coba lagi</button>
        </div>
      )}

      {!mapFacility && !coordinates && (
        <section aria-labelledby="map-title" className="mb-8 rounded-2xl border border-dashed border-strong-border bg-subtle/70 p-8 text-center">
          <h2 id="map-title" className="font-semibold">Peta lokasi</h2>
          <p className="mt-2 text-sm text-secondary">Pilih “Lokasi saya” untuk menampilkan posisi, atau “Di sekitar saya” untuk memfilter fasilitas dalam radius 100 km.</p>
        </section>
      )}

      {(mapFacility || coordinates) && (
        <section aria-labelledby="map-title" className="mb-8 overflow-hidden rounded-2xl border border-default-border bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h2 id="map-title" className="font-semibold">{mapFacility ? `Peta: ${mapFacility.name}` : "Lokasi Anda"}</h2>
              <p className="mt-1 text-sm text-secondary">Daftar di bawah tetap dapat digunakan jika peta gagal dimuat.</p>
            </div>
            {mapFacility && coordinates && (
              <button onClick={() => setMapFacility(null)} className="min-h-11 rounded-xl border border-strong-border px-4 text-sm hover:bg-subtle">Kembali ke lokasi saya</button>
            )}
          </div>
          <iframe
            title={mapFacility ? `Peta ${mapFacility.name}` : "Peta lokasi Anda"}
            src={mapFacility ? osmEmbedUrl(mapFacility) : osmCoordinatesEmbedUrl(coordinates!.latitude, coordinates!.longitude)}
            className="h-72 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </section>
      )}

      {!loading && visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-strong-border p-10 text-center">
          <h2 className="text-lg font-semibold">Belum ada fasilitas yang cocok</h2>
          <p className="mt-2 text-secondary">Kurangi filter atau tampilkan kembali semua fasilitas.</p>
        </div>
      ) : (
        <section aria-label="Hasil pencarian" className="grid gap-4 lg:grid-cols-2">
          {visibleItems.map((facility) => (
            <article key={facility.id} className="rounded-2xl border border-default-border bg-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-link">{categoryLabels[facility.category]}</p>
                  <h2 className="mt-1 text-xl font-bold">{facility.name}</h2>
                  <p className="mt-1 text-sm text-secondary">{facility.city}, {facility.province}{facility.distance_km !== null ? ` · ${facility.distance_km} km` : ""}</p>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selected.includes(facility.id)}
                    disabled={selected.length >= 4 && !selected.includes(facility.id)}
                    onChange={() => toggleSelected(facility.id)}
                    className="size-5"
                  />
                  Pilih
                </label>
              </div>
              {facility.stale && <p className="mt-3 rounded-xl border border-warning/30 bg-surface p-3 text-sm text-warning">Data kedaluwarsa—konfirmasi langsung ke fasilitas.</p>}
              <p className="mt-4 text-sm leading-6 text-primary">{facility.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {facility.services.map((item) => <span key={item.code} className="rounded-full bg-subtle px-3 py-1 text-xs text-primary">{item.name}</span>)}
              </div>
              <p className="mt-4 text-xs text-secondary">Sumber: {facility.source_name} · diperbarui {facility.source_updated_at}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/app/services/${facility.id}`} className="flex min-h-11 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-inverse-text hover:bg-brand-primary-hover">Lihat detail</Link>
                <a href={googleMapsDirectionsUrl(facility)} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-inverse-text hover:bg-brand-primary-hover">Buka rute</a>
                <button onClick={() => setMapFacility(facility)} className="min-h-11 rounded-xl border border-strong-border px-4 text-sm hover:bg-subtle">Lihat di peta</button>
                <button onClick={() => toggleSaved(facility.id)} className="min-h-11 rounded-xl border border-strong-border px-4 text-sm hover:bg-subtle">
                  {saved.includes(facility.id) ? "Hapus simpanan" : "Simpan"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {nextCursor && !savedOnly && (
        <button onClick={() => void load(nextCursor, true)} disabled={loading} className="mt-6 min-h-11 w-full rounded-xl border border-strong-border px-4 hover:bg-surface disabled:opacity-60">
          Muat lebih banyak
        </button>
      )}
    </main>
  );
}
