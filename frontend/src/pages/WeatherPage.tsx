import { useEffect, useState } from 'react';
import { api } from '../api';

// 🌤 Weather: today + the next 4 days (click a day for its hours) from /api/weather (routes/weather.py; Open-Meteo, cached on the server for 4 hours)
export type Weather = { place: string; at?: number; error?: string; current?: { temp: number; feels: number; code: number; wind: number; day: boolean }; days?: Array<{ date: string; code: number; max: number; min: number; rain: number; sunrise: string; sunset: string }>; hours?: Array<{ t: string; temp: number; code: number; rain: number; day: boolean }> };

// WMO weather codes -> an icon and a word
export const weatherLook = (code?: number, day = true): [string, string] => {
  const c = Number(code);
  if (c === 0) return [day ? '☀️' : '🌙', 'Clear'];
  if (c <= 2) return [day ? '🌤️' : '☁️', c === 1 ? 'Mostly clear' : 'Partly cloudy'];
  if (c === 3) return ['☁️', 'Cloudy'];
  if (c <= 48) return ['🌫️', 'Fog'];
  if (c <= 57) return ['🌦️', 'Drizzle'];
  if (c <= 67 || (c >= 80 && c <= 82)) return ['🌧️', c >= 80 ? 'Showers' : 'Rain'];
  if (c <= 77 || c === 85 || c === 86) return ['🌨️', 'Snow'];
  if (c >= 95) return ['⛈️', 'Thunderstorm'];
  return ['🌡️', ''];
};
export const loadWeather = (refresh = false) => api<Weather>(`/api/weather${refresh ? '?refresh=1' : ''}`);
const round = (n?: number) => (n == null ? '–' : Math.round(n));

export function WeatherPage() {
  const [w, setW] = useState<Weather | null>(null), [error, setError] = useState(''), [place, setPlace] = useState(''), [editing, setEditing] = useState(false), [pick, setPick] = useState(0);
  useEffect(() => { loadWeather().then(setW).catch(e => setError(e.message)); }, []);
  const changePlace = async () => {
    if (!place.trim()) return;
    try { setW(await api<Weather>('/api/weather', { method: 'POST', body: JSON.stringify({ place }) })); setEditing(false); setError(''); window.dispatchEvent(new CustomEvent('callstudio:weather-updated')); } catch (e) { setError(e instanceof Error ? e.message : 'not found'); }
  };
  const days = w?.days || [], pickDate = days[pick]?.date, nowHour = new Date().getHours();
  // the picked day's hours; for today, from this hour on
  const hours = (w?.hours || []).filter(h => h.t.slice(0, 10) === pickDate && (pick > 0 || Number(h.t.slice(11, 13)) >= nowHour));
  const [icon, word] = weatherLook(w?.current?.code, w?.current?.day);
  return <main className="modern-page weather-page">
    <header className="page-hero compact"><div><small>WEATHER</small><h1>{w?.current ? `${icon} ${round(w.current.temp)}° · ${word}` : 'Weather'}</h1>
      <p>{w ? <>📍 {editing ? <span className="wx-place"><input autoFocus value={place} onChange={e => setPlace(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') changePlace(); if (e.key === 'Escape') setEditing(false); }} placeholder="Town or city…" /><button onClick={changePlace}>Set</button></span> : <button className="wx-link" title="Change the place" onClick={() => { setPlace(''); setEditing(true); }}>{w.place}</button>}{w.current && ` · feels ${round(w.current.feels)}° · wind ${round(w.current.wind)} km/h`}</> : 'Loading…'}</p>
      {(error || w?.error) && <p className="wx-err">⚠️ {error || `Offline — showing the last forecast (${w?.error})`}</p>}</div>
      {w?.at && <button title="Look it up again now" onClick={() => loadWeather(true).then(setW)}>↻ Updated {new Date(w.at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</button>}</header>
    <div className="wx-days">{days.map((d, i) => { const [di, dw] = weatherLook(d.code); return <section key={d.date} className={i === pick ? 'today' : ''} onClick={() => setPick(i)} title="Show its hours">
      <b>{i === 0 ? 'Today' : new Date(`${d.date}T12:00:00`).toLocaleDateString([], { weekday: 'short', day: 'numeric' })}</b>
      <span className="wx-icon">{di}</span><small>{dw}</small>
      <strong>{round(d.max)}° <em>{round(d.min)}°</em></strong>
      <small>💧 {d.rain ?? 0}%</small><small className="wx-sun">↑ {d.sunrise} · ↓ {d.sunset}</small>
    </section>; })}</div>
    {hours.length > 0 && <div className="wx-hours">{hours.map(h => { const [hi] = weatherLook(h.code, h.day), hr = Number(h.t.slice(11, 13)); return <div key={h.t} className={pick === 0 && hr === nowHour ? 'now' : ''}>
      <small>{pick === 0 && hr === nowHour ? 'Now' : `${h.t.slice(11, 13)}:00`}</small><span>{hi}</span><b>{round(h.temp)}°</b><small className={h.rain >= 50 ? 'wet' : ''}>💧 {h.rain ?? 0}%</small>
    </div>; })}</div>}
  </main>;
}
