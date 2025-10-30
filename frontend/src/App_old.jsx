import React, { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"

import {
  RefreshCcw,
  LogOut,
  Flame,
  TrendingUp,
  Filter,
  Settings,
  UserRound,
  Sparkles,
  Hash,
  LineChart,
  Palette,
  Equal,
} from "lucide-react"

/* -------------------- Utils & Mini-Helper -------------------- */
const lift = { whileHover: { y: -2 }, transition: { type: "spring", stiffness: 300, damping: 25 } }
const cls = (...a) => a.filter(Boolean).join(" ")

function GlassCard({ children, className = "" }) {
  return (
    <Card className={cls("bg-neutral-900/80 border-white/10 backdrop-blur-xl shadow-xl shadow-black/20", className)}>
      {children}
    </Card>
  )
}

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-xs text-neutral-300">{label}</Label>}
      {children}
      {hint && <p className="text-[11px] text-neutral-500">{hint}</p>}
    </div>
  )
}

function Skeleton({ className = "" }) {
  return <div className={cls("animate-pulse rounded-md bg-white/10", className)} />
}

function GradientButton({ className = "", accent = "fuchsia", children, ...props }) {
  const schemes = {
    fuchsia: "from-fuchsia-500 to-cyan-400",
    violet: "from-violet-500 to-sky-400",
  }
  return (
    <Button
      {...props}
      className={cls(
        "relative text-neutral-900 font-semibold hover:opacity-95 active:translate-y-[1px] bg-gradient-to-r",
        schemes[accent],
        className
      )}
    >
      <span className="absolute inset-0 rounded-md ring-1 ring-white/10 pointer-events-none" />
      {children}
    </Button>
  )
}

/* ============================================================= */

export default function App() {
  // ---- Theme / Density ------------------------------------------------------
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") || "fuchsia")
  const [compact, setCompact] = useState(() => localStorage.getItem("compact") === "1")

  useEffect(() => { localStorage.setItem("accent", accent) }, [accent])
  useEffect(() => { localStorage.setItem("compact", compact ? "1" : "0") }, [compact])

  // ---- Persistente UI-States ------------------------------------------------
  const [styleVal, setStyleVal] = useState(() => localStorage.getItem("styleVal") || "viral")
  const [amountVal, setAmountVal] = useState(() => localStorage.getItem("amountVal") || "mix")
  const [hashtagCount, setHashtagCount] = useState(() => localStorage.getItem("hashtagCount") || "15")
  const [sentimentDepth, setSentimentDepth] = useState(() => localStorage.getItem("sentimentDepth") || "t5")

  useEffect(() => { localStorage.setItem("styleVal", styleVal) }, [styleVal])
  useEffect(() => { localStorage.setItem("amountVal", amountVal) }, [amountVal])
  useEffect(() => { localStorage.setItem("hashtagCount", hashtagCount) }, [hashtagCount])
  useEffect(() => { localStorage.setItem("sentimentDepth", sentimentDepth) }, [sentimentDepth])

  // Shortcut: / fokussiert Thema/Nische
  const topicRef = useRef(null)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault()
        topicRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Accent helpers
  const grad = accent === "fuchsia"
    ? "from-fuchsia-500/20 via-purple-500/15 to-cyan-400/20"
    : "from-violet-500/20 via-indigo-500/15 to-sky-400/20"

  // Density helpers
  const pad = compact ? "p-3" : "p-4"
  const gap = compact ? "gap-3" : "gap-4"
  const hdrPad = compact ? "py-2" : "py-3"
  const textSm = compact ? "text-[13px]" : "text-sm"

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-50 overflow-hidden">
      {/* Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(50%_50%_at_70%_0%,black,transparent)] opacity-40">
        <div className={cls("absolute right-[-20%] top-[-10%] h-[40rem] w-[40rem] rounded-full blur-3xl",
          "bg-gradient-to-tr", grad)} />
      </div>
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%,rgba(255,255,255,.06),transparent 35%),radial-gradient(circle at 80% 0%,rgba(168,85,247,.08),transparent 45%)",
        }}
      />

      <div className={cls("mx-auto max-w-7xl px-6 py-8 space-y-8", compact && "space-y-6")}>
        {/* Header */}
        <header className={cls(
          "backdrop-blur-xl bg-neutral-950/80 ring-1 ring-white/10 border-b border-white/10 rounded-2xl shadow-lg shadow-black/30",
          pad, "flex items-center justify-between"
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={cls("h-7 w-7 rounded-lg bg-gradient-to-tr", accent === "fuchsia" ? "from-fuchsia-500 to-cyan-400" : "from-violet-500 to-sky-400")} />
              <UserRound className="absolute inset-0 m-auto h-4 w-4 text-neutral-900" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Trend-Pro</h1>
            <span className="text-xs text-neutral-400">TikTok Insights • For-You Trends</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setAccent(accent === "fuchsia" ? "violet" : "fuchsia")}
              className="bg-white/10 hover:bg-white/15 border border-white/10 gap-2"
              size={compact ? "sm" : "default"}
              title="Theme wechseln"
            >
              <Palette className="h-4 w-4" /> Accent
            </Button>
            <Button
              variant="secondary"
              onClick={() => setCompact(v => !v)}
              className="bg-white/10 hover:bg-white/15 border border-white/10 gap-2"
              size={compact ? "sm" : "default"}
              title="Dichte umschalten"
            >
              <Equal className="h-4 w-4" /> {compact ? "Comfort" : "Compact"}
            </Button>
            <Badge className="bg-white/10 border-white/10 text-xs">Production-ready UI</Badge>
          </div>
        </header>

        {/* KPI Row */}
        <div className={cls("grid sm:grid-cols-2 lg:grid-cols-4", gap)}>
          {[
            { k: "Aktive Trends", v: "127", Icon: Hash },
            { k: "KI-Genauigkeit", v: "96%", Icon: Sparkles },
            { k: "Content generiert", v: "1.2K", Icon: TrendingUp },
            { k: "Analysierte Videos", v: "2.4M", Icon: LineChart },
          ].map((m, i) => (
            <motion.div key={i} {...lift}>
              <GlassCard>
                <CardContent className={cls("relative overflow-hidden", pad)}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-neutral-400">{m.k}</div>
                    <m.Icon className="h-4 w-4 text-neutral-400" />
                  </div>
                  <div className="text-2xl font-semibold mt-1">{m.v}</div>
                  <div className="mt-3 h-8 rounded-sm opacity-25 bg-[radial-gradient(6px_6px_at_6px_6px,white_30%,transparent_40%)] bg-[length:12px_12px]" />
                </CardContent>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Top Grid: Account / Quick Actions */}
        <div className={cls("grid lg:grid-cols-2", gap)}>
          {/* Account */}
          <motion.div {...lift}>
            <GlassCard>
              <CardHeader className={hdrPad}>
                <SectionHeader title="Account" subtitle="TikTok Login & Token" />
              </CardHeader>
              <CardContent className={cls("space-y-3", pad)}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800/80 text-sm font-semibold">
                    TT
                  </div>
                  <div>
                    <p className={cls("text-neutral-200", textSm)}>Abgemeldet</p>
                    <p className="text-xs text-neutral-500">Bitte einloggen</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className={cls("flex gap-2", pad)}>
                <GradientButton accent={accent} size={compact ? "sm" : "default"} className="gap-1">
                  <RefreshCcw className="h-4 w-4" /> Token refreshen
                </GradientButton>
                <Button size={compact ? "sm" : "default"} variant="secondary" className="gap-1 bg-white/10 hover:bg-white/15 border border-white/10">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </CardFooter>
            </GlassCard>
          </motion.div>

          {/* Quick Actions */}
          <motion.div {...lift}>
            <GlassCard>
              <CardHeader className={hdrPad}>
                <SectionHeader title="Quick Actions" subtitle="Schnelle Analysen" />
              </CardHeader>
              <CardContent className={cls("grid grid-cols-2", gap, pad)}>
                <Button variant="secondary" className="bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-fuchsia-400" /> Hot Hashtags
                </Button>
                <Button variant="secondary" className="bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" /> Top-Views
                </Button>
                <Button variant="secondary" className="bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-400" /> Nischen
                </Button>
                <Button variant="secondary" className="bg-white/10 hover:bg-white/15 border border-white/10 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-400" /> Feeds
                </Button>
              </CardContent>
            </GlassCard>
          </motion.div>
        </div>

        {/* Advanced AI Content Engine */}
        <motion.div {...lift}>
          <GlassCard>
            <CardHeader className={hdrPad}>
              <SectionHeader
                title="Advanced AI Content Engine"
                subtitle="Viral Network • Smart Hashtags • Sentiment & Username Analyse"
                right={<Badge className="bg-white/10 border-white/10">Neural Network</Badge>}
              />
            </CardHeader>

            <CardContent className={pad}>
              <div className={cls("grid lg:grid-cols-4", gap)}>
                {/* Booster */}
                <GlassCard className="shadow-inner shadow-black/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Content Booster</CardTitle>
                    <CardDescription>Viral Engine</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Thema/Nische" hint="Max. 60 Zeichen – drücke ‘/’ zum Fokussieren">
                      <Input
                        ref={topicRef}
                        maxLength={60}
                        placeholder="z.B. Fitness, Tech, Clean, Calm"
                        className="bg-neutral-950/60 border-white/15 placeholder:text-neutral-400 focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/30"
                      />
                    </Field>
                    <div className={cls("grid grid-cols-2", gap)}>
                      <Field label="Content-Stil">
                        <Select value={styleVal} onValueChange={setStyleVal}>
                          <SelectTrigger className="bg-neutral-950/60 border-white/15 focus:ring-2 focus:ring-fuchsia-400/30">
                            <SelectValue placeholder="Content Stil" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viral">Viral & Trendy</SelectItem>
                            <SelectItem value="educ">Educational</SelectItem>
                            <SelectItem value="story">Story</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Menge">
                        <Select value={amountVal} onValueChange={setAmountVal}>
                          <SelectTrigger className="bg-neutral-950/60 border-white/15 focus:ring-2 focus:ring-fuchsia-400/30">
                            <SelectValue placeholder="Content-Menge" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mix">10 Content-Ideen</SelectItem>
                            <SelectItem value="single">1 Skript</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </CardContent>
                  <CardFooter className={cls("gap-2", pad)}>
                    <GradientButton accent={accent} className="flex-1">Content generieren</GradientButton>
                    <Button variant="secondary" className="flex-1 bg-white/10 hover:bg-white/15 border border-white/10">
                      Auto-Boost starten
                    </Button>
                  </CardFooter>
                </GlassCard>

                {/* Smart Hashtags */}
                <GlassCard className="shadow-inner shadow-black/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Smart Hashtags</CardTitle>
                    <CardDescription>Video-Beschreibung analysieren</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Beschreibung">
                      <Input
                        placeholder="Beschreibe dein Video…"
                        className="bg-neutral-950/60 border-white/15 placeholder:text-neutral-400 focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/30"
                      />
                    </Field>
                    <Field label="Anzahl">
                      <Select value={hashtagCount} onValueChange={setHashtagCount}>
                        <SelectTrigger className="bg-neutral-950/60 border-white/15 focus:ring-2 focus:ring-fuchsia-400/30">
                          <SelectValue placeholder="Anzahl Hashtags" />
                        </SelectTrigger>
                        <SelectContent>
                          {[5, 10, 15, 20].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} Hashtags
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                  <CardFooter className={pad}>
                    <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/15 border border-white/10">
                      Hashtags generieren
                    </Button>
                  </CardFooter>
                </GlassCard>

                {/* Sentiment */}
                <GlassCard className="shadow-inner shadow-black/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sentiment Analyse</CardTitle>
                    <CardDescription>Kommentare / Text</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Text">
                      <Input
                        placeholder="Füge Kommentare oder Text ein…"
                        className="bg-neutral-950/60 border-white/15 placeholder:text-neutral-400 focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/30"
                      />
                    </Field>
                    <Field label="Analyse-Tiefe">
                      <Select value={sentimentDepth} onValueChange={setSentimentDepth}>
                        <SelectTrigger className="bg-neutral-950/60 border-white/15 focus:ring-2 focus:ring-fuchsia-400/30">
                          <SelectValue placeholder="Tiefe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="t3">T3</SelectItem>
                          <SelectItem value="t5">T5</SelectItem>
                          <SelectItem value="t7">T7</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                  <CardFooter className={pad}>
                    <GradientButton accent={accent} className="w-full">Sentiment analysieren</GradientButton>
                  </CardFooter>
                </GlassCard>

                {/* Username */}
                <GlassCard className="shadow-inner shadow-black/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Username Analyse</CardTitle>
                    <CardDescription>TikTok Username</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Field label="Username">
                      <Input
                        placeholder="@username_input"
                        className="bg-neutral-950/60 border-white/15 placeholder:text-neutral-400 focus:ring-2 focus:ring-fuchsia-400/40 focus:border-fuchsia-400/30"
                      />
                    </Field>
                    <Field label="Analyse-Tiefe">
                      <Select defaultValue="t5">
                        <SelectTrigger className="bg-neutral-950/60 border-white/15 focus:ring-2 focus:ring-fuchsia-400/30">
                          <SelectValue placeholder="Tiefe" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="t3">T3</SelectItem>
                          <SelectItem value="t5">T5</SelectItem>
                          <SelectItem value="t7">T7</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </CardContent>
                  <CardFooter className={pad}>
                    <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/15 border border-white/10">
                      Username analysieren
                    </Button>
                  </CardFooter>
                </GlassCard>
              </div>
            </CardContent>
          </GlassCard>
        </motion.div>

        {/* Tabs: Trends | Hashtags | Sounds | Creators */}
        <motion.div {...lift}>
          <GlassCard>
            <CardHeader className={hdrPad}>
              <SectionHeader
                title="Explore"
                subtitle="Schnelle Übersicht & Deep-Dive per Tab"
                right={<Badge className="bg-white/10 border-white/10">Beta</Badge>}
              />
            </CardHeader>
            <CardContent className={pad}>
              <Tabs defaultValue="trends">
                <TabsList className="bg-white/10 border border-white/10">
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                  <TabsTrigger value="sounds">Sounds</TabsTrigger>
                  <TabsTrigger value="creators">Creators</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="mt-4">
                  <div className={cls("grid md:grid-cols-2 lg:grid-cols-3", gap)}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <GlassCard key={i}>
                        <CardContent className={pad}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Trend #{i + 1}</div>
                            <Badge className="bg-white/10 border-white/10">Rising</Badge>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">Beispiel-Tagline zu Performance & Wachstum.</p>
                          <div className="mt-3 h-8 rounded-sm opacity-25 bg-[radial-gradient(6px_6px_at_6px_6px,white_30%,transparent_40%)] bg-[length:12px_12px]" />
                        </CardContent>
                      </GlassCard>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="hashtags" className="mt-4">
                  <div className={cls("grid md:grid-cols-2 lg:grid-cols-3", gap)}>
                    {["deep house", "aesthetic edit", "gymtok", "cozy vibes", "retrofilter", "glowup"].map((tag) => (
                      <GlassCard key={tag}>
                        <CardContent className={pad}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">#{tag.replaceAll(" ", "")}</div>
                            <Badge className="bg-white/10 border-white/10">Top 1%</Badge>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">Hohe Engagement-Rate in letzter Woche.</p>
                        </CardContent>
                      </GlassCard>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="sounds" className="mt-4">
                  <div className={cls("grid md:grid-cols-2 lg:grid-cols-3", gap)}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <GlassCard key={i}>
                        <CardContent className={pad}>
                          <div className="text-sm font-medium">Sound {i + 1}</div>
                          <p className="text-xs text-neutral-400 mt-1">Viral-Quote • 128 BPM • 9:16</p>
                        </CardContent>
                      </GlassCard>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="creators" className="mt-4">
                  <div className={cls("grid md:grid-cols-2 lg:grid-cols-3", gap)}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <GlassCard key={i}>
                        <CardContent className={pad}>
                          <div className="text-sm font-medium">@creator_{i + 1}</div>
                          <p className="text-xs text-neutral-400 mt-1">Kategorie: Lifestyle • Wachstum „hoch“</p>
                        </CardContent>
                      </GlassCard>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </GlassCard>
        </motion.div>
      </div>
    </main>
  )
}
