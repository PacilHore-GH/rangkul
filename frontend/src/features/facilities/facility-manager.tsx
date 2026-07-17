"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, createIdempotencyKey, Facility } from "@/lib/api";
import { sanitizeMultiline, sanitizeSingleLine } from "@/lib/validation";
import { LogoutButton } from "@/components/logout-button";

const facilityTypes = [
  ["hospital", "Rumah sakit"],
  ["clinic", "Klinik"],
  ["therapy_center", "Pusat terapi"],
  ["school", "Sekolah"],
  ["community_service", "Layanan komunitas"],
] as const;

const emptyForm = {
  name: "", facility_type: "hospital", description: "", services: "", address: "",
  city: "", province: "", latitude: "", longitude: "", phone: "", website: "",
  source_name: "", source_url: "", is_active: true,
};

export function FacilityManager() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);

  async function load() {
    setFacilities(await api<Facility[]>("/admin/facilities"));
  }

  useEffect(() => {
    api<Facility[]>("/admin/facilities")
      .then(setFacilities)
      .catch(() => setError("Data fasilitas belum dapat dimuat."));
  }, []);

  function update(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function reset() {
    setSelected(null);
    setForm(emptyForm);
    setIdempotencyKey(createIdempotencyKey());
    setError("");
  }

  function edit(facility: Facility) {
    setSelected(facility);
    setForm({
      name: facility.name,
      facility_type: facility.facility_type,
      description: facility.description ?? "",
      services: facility.services.join(", "),
      address: facility.address,
      city: facility.city,
      province: facility.province,
      latitude: facility.latitude?.toString() ?? "",
      longitude: facility.longitude?.toString() ?? "",
      phone: facility.phone ?? "",
      website: facility.website ?? "",
      source_name: facility.source_name,
      source_url: facility.source_url,
      is_active: facility.is_active,
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: sanitizeSingleLine(form.name, 120),
        facility_type: form.facility_type,
        description: form.description ? sanitizeMultiline(form.description, 2000) : null,
        services: form.services.split(",").map((value) => sanitizeSingleLine(value, 80)).filter(Boolean),
        address: sanitizeSingleLine(form.address, 300),
        city: sanitizeSingleLine(form.city, 80),
        province: sanitizeSingleLine(form.province, 80),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        phone: form.phone ? sanitizeSingleLine(form.phone, 30) : null,
        website: form.website || null,
        source_name: sanitizeSingleLine(form.source_name, 120),
        source_url: form.source_url,
        is_active: form.is_active,
      };
      await api(selected ? `/admin/facilities/${selected.id}` : "/admin/facilities", {
        method: selected ? "PATCH" : "POST",
        headers: selected ? undefined : { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      await load();
      reset();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fasilitas belum berhasil disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(facility: Facility) {
    if (!window.confirm(`Hapus ${facility.name}?`)) return;
    await api(`/admin/facilities/${facility.id}`, { method: "DELETE" });
    await load();
    if (selected?.id === facility.id) reset();
  }

  return <main className="app-shell admin-shell">
    <header className="app-header">
      <div><p className="eyebrow">ADMIN · DATA EKSTERNAL</p><h1>Katalog fasilitas</h1></div>
      <LogoutButton redirectTo="/admin/login" />
    </header>
    <section className="admin-grid">
      <div className="dashboard-card">
        <div className="section-heading"><h2>Fasilitas</h2><button className="primary compact" onClick={reset}>Tambah baru</button></div>
        <div className="profile-list">{facilities.map((facility) => <article className="profile-list-item" key={facility.id}>
          <div><h3>{facility.name}</h3><p className="muted">{facility.city} · {facility.is_active ? "Aktif" : "Nonaktif"}</p></div>
          <div className="button-row">
            <button className="secondary compact" onClick={() => edit(facility)}>Edit</button>
            <button className="danger-button compact" onClick={() => remove(facility)}>Hapus</button>
          </div>
        </article>)}</div>
      </div>
      <section className="dashboard-card">
        <h2>{selected ? "Edit fasilitas" : "Tambah fasilitas"}</h2>
        <form className="form-stack" onSubmit={save}>
          <label>Nama<input className="field" required value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label>Tipe<select className="field" value={form.facility_type} onChange={(event) => update("facility_type", event.target.value)}>{facilityTypes.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
          <label>Layanan, pisahkan dengan koma<input className="field" value={form.services} onChange={(event) => update("services", event.target.value)} /></label>
          <label>Deskripsi<textarea className="field" value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
          <label>Alamat<input className="field" required value={form.address} onChange={(event) => update("address", event.target.value)} /></label>
          <div className="two-columns"><label>Kota<input className="field" required value={form.city} onChange={(event) => update("city", event.target.value)} /></label><label>Provinsi<input className="field" required value={form.province} onChange={(event) => update("province", event.target.value)} /></label></div>
          <div className="two-columns"><label>Latitude<input className="field" type="number" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} /></label><label>Longitude<input className="field" type="number" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} /></label></div>
          <label>Telepon<input className="field" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
          <label>Website<input className="field" type="url" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
          <label>Nama sumber<input className="field" required value={form.source_name} onChange={(event) => update("source_name", event.target.value)} /></label>
          <label>URL sumber<input className="field" type="url" required value={form.source_url} onChange={(event) => update("source_url", event.target.value)} /></label>
          <label className="check"><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} /> Tampilkan kepada keluarga</label>
          {error && <p role="alert" className="form-error">{error}</p>}
          <button className="primary" disabled={saving}>{saving ? "Menyimpan…" : "Simpan fasilitas"}</button>
        </form>
      </section>
    </section>
  </main>;
}
