import React, { useMemo, useState, useEffect } from "react";
import { useLiveData } from "./useLiveData";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Badge } from "./components/ui/badge";
import {
  BadgeCheck,
  CalendarDays,
  Mail,
  MessageSquare,
  QrCode,
  Users,
  BarChart3,
  ClipboardList,
  Sparkles,
  RefreshCw,
  ShoppingCart,
  DollarSign,
  MousePointerClick,
  Store,
  AlertCircle,
  Zap,
  Radio,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const brand = {
  name: "Makamaka Live Growth Command Center",
  tagline: "Klaviyo + Shopify + SMS + QR + Influencer Growth Hub",
};

const connectionStatus = [
  { name: "Klaviyo", status: "Ready to connect", detail: "Email/SMS flows, lists, segments, revenue attribution" },
  { name: "Shopify", status: "Ready to connect", detail: "Orders, customers, abandoned checkout, products" },
  { name: "Buffer", status: "Manual", detail: "Posts managed directly in the Buffer app — no integration needed" },
  { name: "GA4", status: "Optional", detail: "Traffic, conversion paths, landing pages" },
];

const liveKpis = [
  { label: "Revenue Today", value: "$428", change: "+12%", icon: DollarSign },
  { label: "Orders", value: "18", change: "+4", icon: ShoppingCart },
  { label: "Email Click Rate", value: "4.8%", change: "+0.6%", icon: Mail },
  { label: "SMS Click Rate", value: "18.2%", change: "+2.1%", icon: MessageSquare },
  { label: "Cart Recovery", value: "11.4%", change: "+1.3%", icon: MousePointerClick },
  { label: "Retail QR Leads", value: "37", change: "+9", icon: QrCode },
];

const revenueData = [
  { day: "Mon", revenue: 310, sms: 42, email: 88 },
  { day: "Tue", revenue: 420, sms: 75, email: 116 },
  { day: "Wed", revenue: 380, sms: 64, email: 102 },
  { day: "Thu", revenue: 510, sms: 91, email: 130 },
  { day: "Fri", revenue: 740, sms: 180, email: 210 },
  { day: "Sat", revenue: 690, sms: 160, email: 190 },
  { day: "Sun", revenue: 560, sms: 118, email: 165 },
];

const sourceData = [
  { source: "Klaviyo Email", revenue: 920 },
  { source: "SMS", revenue: 760 },
  { source: "QR Retail", revenue: 380 },
  { source: "Influencer", revenue: 300 },
  { source: "Organic Social", revenue: 260 },
];

const flows = [
  {
    name: "Welcome Flow",
    trigger: "Signup form submitted",
    goal: "Convert new leads into first-time buyers",
    liveMetric: "18.7% first purchase conversion",
    status: "Live-ready",
    steps: [
      "Check: has SMS consent?",
      "SMS immediately: ALOHA10 discount + shop link",
      "Email immediately: brand welcome + story",
      "Wait 2 days",
      "Email: product education",
      "Wait 1 day",
      "SMS: coupon reminder",
      "Wait 1 day",
      "Email: recipe / lifestyle use case",
      "Wait 2 days",
      "Email: final offer reminder",
    ],
  },
  {
    name: "Abandoned Cart Flow",
    trigger: "Started checkout, did not purchase",
    goal: "Recover lost carts without over-discounting",
    liveMetric: "11.4% recovery rate",
    status: "Highest priority",
    steps: [
      "Wait 1 hour",
      "SMS: cart reminder if SMS consent exists",
      "Wait 3 hours",
      "Email: product benefits + return to cart button",
      "Check: placed order? If yes, exit",
      "Wait 20 hours",
      "SMS: FINISH10 discount",
      "Wait 24 hours",
      "Email: final push + social proof",
    ],
  },
  {
    name: "Post-Purchase Flow",
    trigger: "Placed order",
    goal: "Create repeat buyers and collect feedback",
    liveMetric: "23.1% repeat purchase path",
    status: "Live-ready",
    steps: [
      "Email immediately: thank you + what to expect",
      "Wait 3 days after delivery estimate",
      "SMS: taste check + simple recipe",
      "Wait 2 days",
      "Email: review request",
      "Wait 5 days",
      "Email: product recommendation",
      "Wait 4 days",
      "SMS: restock reminder",
    ],
  },
  {
    name: "VIP Flow",
    trigger: "Customer has placed 2+ orders",
    goal: "Reward best customers and drive high-LTV revenue",
    liveMetric: "42 VIP customers",
    status: "Expansion",
    steps: [
      "Enter VIP Customer segment",
      "Email: VIP welcome and perks",
      "Wait 1 day",
      "SMS: early access / exclusive drop",
      "Add to VIP campaign list",
      "Send early drops, restocks, seasonal promos",
    ],
  },
];

const smsTemplates = [
  { title: "Welcome SMS", copy: "Aloha 🌺 welcome to Makamaka! Here’s 10% off: ALOHA10 👉 [Shop Link] Reply STOP to opt out" },
  { title: "Cart SMS #1", copy: "Still thinking it over? 👀 Your Makamaka is waiting: [Cart Link] Reply STOP to opt out" },
  { title: "Cart SMS #2", copy: "Take 10% off 🌺 Use: FINISH10 👉 [Cart Link] Reply STOP to opt out" },
  { title: "Post-Purchase SMS", copy: "How’s Makamaka tasting? 🌴 Try this: Makamaka + lime + ice 🔥 [Link] Reply STOP to opt out" },
  { title: "VIP SMS", copy: "VIP access 🌺 New drop before anyone else: [Link] Limited 👀 Reply STOP to opt out" },
  { title: "Flash Sale SMS", copy: "⚡ 24 HOUR DROP 10% OFF: ALOHA10 👉 [Link] Ends tonight Reply STOP to opt out" },
];

const weeklyCalendar = [
  ["Monday", "Buffer", "Product story", "Meet Makamaka: island flavor, premium feel, simple joy.", "Draft"],
  ["Tuesday", "Klaviyo Email", "Story / education", "Why Makamaka belongs in your weekly routine.", "Ready"],
  ["Wednesday", "Buffer", "Recipe", "Makamaka + lime + ice: simple island refreshment.", "Scheduled"],
  ["Thursday", "Buffer", "Social proof", "Feature customer quote, retail shelf photo, or UGC.", "Draft"],
  ["Friday", "SMS", "Conversion push", "Weekend vibes. Stock up on Makamaka.", "Ready"],
  ["Saturday", "Buffer", "Lifestyle", "Beach, family, local flavor, Hawaii energy.", "Scheduled"],
  ["Sunday", "Klaviyo Email", "Lifestyle soft sell", "Slow Sunday, island pantry, order reminder.", "Draft"],
];

const qrFunnels = [
  { location: "Retail shelf card", offer: "Text ALOHA to join VIP + get 10%", destination: "Klaviyo SMS signup form", leads: 14 },
  { location: "Product hang tag / sticker", offer: "Scan for Makamaka recipes", destination: "Recipe landing page + email/SMS capture", leads: 9 },
  { location: "Farmers market / pop-up", offer: "Join VIP for early drops", destination: "Mobile-first Klaviyo form", leads: 11 },
  { location: "Wholesale partner counter", offer: "Win a Makamaka bundle", destination: "Giveaway capture form", leads: 3 },
];

const influencerSystem = [
  "Create unique coupon code for each influencer: MAKAMAKA-[NAME]",
  "Create unique Klaviyo landing page or form for each influencer",
  "Offer: 10% off first order + VIP text access",
  "Influencer posts Reel/TikTok/Story with link + code",
  "New leads enter Welcome Flow",
  "Purchases tracked by code, UTM link, and Klaviyo source",
  "Top performers move to monthly ambassador program",
];

const kpis = [
  ["Email open rate", "30%+"],
  ["Email click rate", "2–5%"],
  ["SMS click rate", "10–25%"],
  ["Abandoned cart recovery", "5–15%"],
  ["Repeat purchase rate", "Track monthly"],
  ["Revenue per recipient", "Improve weekly"],
];

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 rounded-2xl bg-teal-50 shadow-sm"><Icon className="h-5 w-5" /></div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function FlowCard({ flow }) {
  return (
    <Card className="rounded-2xl shadow-sm border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-bold text-lg">{flow.name}</h3>
          <Badge variant="secondary" className="rounded-full">{flow.status}</Badge>
        </div>
        <div className="text-xs text-slate-500 mb-1">Trigger: {flow.trigger}</div>
        <p className="text-sm text-slate-600 mb-3">{flow.goal}</p>
        <div className="mb-4 p-3 rounded-2xl bg-amber-50 text-sm font-semibold">Live KPI: {flow.liveMetric}</div>
        <div className="space-y-2">
          {flow.steps.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1 h-5 w-5 rounded-full bg-teal-100 flex items-center justify-center text-xs font-semibold">{i + 1}</div>
              <p className="text-sm">{s}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ApiCard({ item }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
          </div>
          <Badge className="rounded-full" variant={item.status === "Optional" ? "outline" : "secondary"}>{item.status}</Badge>
        </div>
        <Button variant="outline" size="sm" className="rounded-2xl mt-4 gap-2"><ExternalLink className="h-4 w-4" /> Connect</Button>
      </CardContent>
    </Card>
  );
}

export default function MakamakaCommandCenter() {
  const [query, setQuery] = useState("");
  const { data, loading, error, lastSync, refresh } = useLiveData();

  // Auto-fetch on mount
  useEffect(() => { refresh() }, [refresh]);

  const filteredTemplates = useMemo(() => smsTemplates.filter(t => `${t.title} ${t.copy}`.toLowerCase().includes(query.toLowerCase())), [query]);

  // Build live KPI cards (overlay real values when available)
  const displayKpis = liveKpis.map(kpi => {
    if (!data?.kpis?.kpis) return kpi;
    const k = data.kpis.kpis;
    const overrides = {
      "Revenue Today":   { value: k.revenueToday },
      "Orders":          { value: k.ordersToday },
      "Email Click Rate":{ value: k.emailClickRate },
      "SMS Click Rate":  { value: k.smsClickRate },
      "Cart Recovery":   { value: k.cartAbandoned },
    };
    return { ...kpi, ...(overrides[kpi.label] || {}) };
  });

  // Live Klaviyo flows
  const liveFlows  = data?.flows?.data || [];
  const liveKlaviyoCampaigns = data?.campaigns?.data || [];
  const liveLists  = data?.lists?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-amber-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm text-sm mb-4">
            <Sparkles className="h-4 w-4" /> Live Owner-Operated Growth System
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight">{brand.name}</h1>
              <p className="text-slate-600 mt-3 text-lg max-w-3xl">{brand.tagline}</p>
              <p className="text-xs text-slate-500 mt-2">
                {loading ? '⟳ Syncing live data…' : lastSync ? `Last sync: ${lastSync}` : 'Connecting…'}
                {error && <span className="text-red-400 ml-2">⚠ {error}</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl gap-2" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
              </Button>
              <Button variant="outline" className="rounded-2xl gap-2"><Zap className="h-4 w-4" /> Launch Campaign</Button>
              <Button variant="outline" className="rounded-2xl gap-2"><Radio className="h-4 w-4" /> Send SMS</Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
          {displayKpis.map(({ label, value, change, icon: Icon }) => (
            <Card key={label} className="rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-teal-600" /><span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">{change}</span></div>
                <div className={`text-2xl font-black mt-3 ${loading ? 'opacity-40' : ''}`}>{value}</div>
                <div className="text-sm text-slate-600">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-8 rounded-2xl h-auto p-1 bg-white shadow-sm">
            <TabsTrigger value="live" className="rounded-xl">Live</TabsTrigger>
            <TabsTrigger value="connect" className="rounded-xl">Connect</TabsTrigger>
            <TabsTrigger value="flows" className="rounded-xl">Flows</TabsTrigger>
            <TabsTrigger value="sms" className="rounded-xl">SMS</TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-xl">Calendar</TabsTrigger>
            <TabsTrigger value="qr" className="rounded-xl">QR</TabsTrigger>
            <TabsTrigger value="influencer" className="rounded-xl">Influencer</TabsTrigger>
            <TabsTrigger value="kpi" className="rounded-xl">KPIs</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-6">
            <SectionTitle icon={BarChart3} title="Live Revenue Dashboard" subtitle="Designed to connect to Shopify, Klaviyo, and QR lead sources." />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><h3 className="font-bold mb-4">7-Day Revenue + Channel Lift</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Area type="monotone" dataKey="revenue" fillOpacity={0.2} /><Area type="monotone" dataKey="sms" fillOpacity={0.2} /><Area type="monotone" dataKey="email" fillOpacity={0.2} /></AreaChart></ResponsiveContainer></div></CardContent></Card>
              <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><h3 className="font-bold mb-4">Revenue by Source</h3><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={sourceData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="source" tick={{ fontSize: 11 }} /><YAxis /><Tooltip /><Bar dataKey="revenue" /></BarChart></ResponsiveContainer></div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="flex gap-3"><AlertCircle className="h-5 w-5" /><div><h3 className="font-bold">Action Alert</h3><p className="text-sm text-slate-600 mt-1">Cart recovery is strong. Increase Friday SMS budget and test a no-discount reminder before FINISH10.</p></div></div></CardContent></Card>
              <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="flex gap-3"><Store className="h-5 w-5" /><div><h3 className="font-bold">Retail QR Opportunity</h3><p className="text-sm text-slate-600 mt-1">Shelf card leads are highest. Add QR cards to every retail display and pop-up table.</p></div></div></CardContent></Card>
              <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="flex gap-3"><Users className="h-5 w-5" /><div><h3 className="font-bold">Influencer Push</h3><p className="text-sm text-slate-600 mt-1">Create 5 influencer codes this week and track them by UTM + Shopify discount code.</p></div></div></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="connect" className="mt-6">
            <SectionTitle icon={RefreshCw} title="Live Integration Center" subtitle="Klaviyo is live. Buffer posts managed manually in the Buffer app." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">{connectionStatus.map((item) => {
              const isLive = item.name === 'Klaviyo' && data?.kpis;
              return <ApiCard key={item.name} item={{ ...item, status: isLive ? '✅ Connected' : item.status }} />;
            })}</div>
            <Card className="rounded-2xl shadow-sm"><CardContent className="p-5"><h3 className="font-bold mb-3">Implementation Notes</h3><div className="space-y-2 text-sm text-slate-700"><p><b>Phase 1:</b> Connect Shopify orders, Klaviyo flows, and SMS metrics.</p><p><b>Phase 2:</b> Add Buffer scheduled posts and social campaign status.</p><p><b>Phase 3:</b> Add QR codes with UTM tracking for retail stores, pop-ups, and influencer campaigns.</p><p><b>Phase 4:</b> Add campaign launch approvals so the owner can review before sending.</p></div></CardContent></Card>
          </TabsContent>

          <TabsContent value="flows" className="mt-6">
            <SectionTitle icon={ClipboardList} title="Klaviyo Flows" subtitle={liveFlows.length ? `${liveFlows.length} live flows in your account` : "Flow blueprints shown below — live flows load when Klaviyo is connected."} />

            {liveFlows.length > 0 && (
              <div className="mb-8">
                <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Live in Klaviyo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {liveFlows.map(f => (
                    <Card key={f.id} className="rounded-2xl shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-base">{f.attributes.name}</h4>
                          <Badge variant={f.attributes.status === 'live' ? 'secondary' : 'outline'} className="rounded-full capitalize shrink-0">{f.attributes.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">Trigger: {f.attributes.trigger_type || '—'}</p>
                        <p className="text-xs text-slate-400 mt-1">Created {new Date(f.attributes.created).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Build Blueprints</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{flows.map((f) => <FlowCard key={f.name} flow={f} />)}</div>
          </TabsContent>

          <TabsContent value="sms" className="mt-6">
            <SectionTitle icon={MessageSquare} title="SMS Template Library" subtitle="Copy/paste into Klaviyo SMS blocks. Keep STOP language." />
            <Input placeholder="Search SMS templates..." value={query} onChange={(e) => setQuery(e.target.value)} className="mb-5 rounded-2xl bg-white" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((t) => (
                <Card key={t.title} className="rounded-2xl shadow-sm"><CardContent className="p-5"><h3 className="font-bold mb-2">{t.title}</h3><p className="text-sm text-slate-700 leading-relaxed">{t.copy}</p></CardContent></Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <SectionTitle
              icon={CalendarDays}
              title="Content Calendar"
              subtitle="Weekly cadence template — schedule posts manually in Buffer"
            />

            {/* Template cadence */}
            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Weekly Content Cadence Template</h3>
            <Card className="rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y">
                  {weeklyCalendar.map(([day, channel, purpose, copy, status]) => (
                    <div key={day} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-4 items-center hover:bg-slate-50 transition-colors">
                      <div className="font-bold text-slate-800">{day}</div>
                      <div className="text-sm font-medium text-teal-700">{channel}</div>
                      <div className="text-sm text-slate-600">{purpose}</div>
                      <div className="text-sm text-slate-500 md:col-span-1 line-clamp-2">{copy}</div>
                      <Badge variant={status === "Scheduled" ? "secondary" : "outline"} className="w-fit rounded-full">{status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="mt-6">
            <SectionTitle icon={QrCode} title="Retail QR → SMS Funnel" subtitle="Use this for stores, pop-ups, shelf cards, and Hawaii foot traffic." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {qrFunnels.map((q) => <Card key={q.location} className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="flex justify-between gap-3"><h3 className="font-bold">{q.location}</h3><Badge className="rounded-full">{q.leads} leads</Badge></div><p className="text-sm mt-2"><b>Offer:</b> {q.offer}</p><p className="text-sm mt-1 text-slate-600"><b>Destination:</b> {q.destination}</p></CardContent></Card>)}
            </div>
          </TabsContent>

          <TabsContent value="influencer" className="mt-6">
            <SectionTitle icon={Users} title="Influencer → SMS Capture System" subtitle="Turn creators into measurable growth partners." />
            <Card className="rounded-2xl shadow-sm"><CardContent className="p-5 space-y-3">
              {influencerSystem.map((s, i) => <div key={i} className="flex gap-3"><BadgeCheck className="h-5 w-5 mt-0.5" /><p className="text-sm">{s}</p></div>)}
            </CardContent></Card>
          </TabsContent>

          <TabsContent value="kpi" className="mt-6">
            <SectionTitle icon={BarChart3} title="Growth Dashboard KPIs" subtitle="Review every Monday morning before creating new campaigns." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {kpis.map(([metric, target]) => <Card key={metric} className="rounded-2xl shadow-sm"><CardContent className="p-5"><div className="text-sm text-slate-600">{metric}</div><div className="text-2xl font-black mt-1">{target}</div></CardContent></Card>)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
