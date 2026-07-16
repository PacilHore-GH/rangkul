"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Person } from "@/lib/api";
export default function ProfilePage() { const [person, setPerson] = useState<Person | null>(null); useEffect(() => { api<Person>("/people/me").then(setPerson); }, []); return <main className="app-shell">{person ? <><Link href="/app/dashboard" className="back">← Dashboard</Link><p className="eyebrow">PROFIL ORANG YANG DIDAMPINGI</p><h1>{person.display_name}</h1><section className="dashboard-card"><h2>Ringkasan</h2><p>Tahun lahir: {person.birth_year ?? "Belum diisi"}</p><p>Kebutuhan dukungan: {person.support_needs.join(", ")}</p><p>Catatan: {person.notes || "Belum ada"}</p></section></> : <p>Memuat profil…</p>}</main>; }
