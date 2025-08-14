"use client";

import { useMemo, useState } from "react";
import {
  Button,
  buttonVariants
} from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
  LineChart as ReLineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Search,
  Bell,
  HelpCircle,
  BarChart3,
  Users,
  Ticket,
  Lightbulb,
  MessageSquare,
  FileText,
  Settings,
  Calendar,
  ArrowRight,
  ChevronDown,
  Filter as FilterIcon,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";

/************************************
 * DATA (mock)
 ***********************************/
const months = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"
];

const revenueData = [
  { month: "Jan", revenue: 4200 },
  { month: "Feb", revenue: 3900 },
  { month: "Mar", revenue: 5200 },
  { month: "Apr", revenue: 6100 },
  { month: "May", revenue: 7600 },
  { month: "Jun", revenue: 7400 },
  { month: "Jul", revenue: 8200 },
  { month: "Aug", revenue: 7900 },
  { month: "Sep", revenue: 9100 },
  { month: "Oct", revenue: 9800 },
  { month: "Nov", revenue: 10200 },
  { month: "Dec", revenue: 11400 },
];

const ticketsData = months.map((m, i) => ({
  month: m,
  created: 40 + (i % 5) * 7,
  solved: 35 + (i % 6) * 6,
}));

/************************************
 * LAYOUT SHELL
 ***********************************/
export default function Dashboard({ userName = "Young Alaska", userPlan = "Free Plan" }) {
  const [active, setActive] = useState("Dashboard");

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r bg-background">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground font-bold">M</div>
            <span className="text-lg font-semibold">Metalic</span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <SidebarSection title="Main">
            <SidebarLink icon={BarChart3} label="Dashboard" active={active === "Dashboard"} onClick={() => setActive("Dashboard")} />
            <SidebarLink icon={MessageSquare} label="Inbox" />
            <SidebarLink icon={Users} label="Customer" />
            <SidebarLink icon={Ticket} label="Ticket" />
          </SidebarSection>

          <SidebarSection title="Tools">
            <SidebarLink icon={Lightbulb} label="Insight" />
            <SidebarLink icon={MessageSquare} label="Forum" />
            <SidebarLink icon={FileText} label="Reports" />
          </SidebarSection>

          <SidebarSection title="Conversation">
            <ConversationItem name="Main" phone="(612) 0998 - 3956" color="bg-red-500" unread={15} />
            <ConversationItem name="Marketing" phone="(415) 2357 - 9070" color="bg-pink-500" />
          </SidebarSection>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <SidebarLink icon={Settings} label="Settings" />
          <SidebarLink icon={HelpCircle} label="Help & Support" />

          <div className="rounded-lg bg-primary/10 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Invitation</div>
                <div className="text-xs text-muted-foreground">3 invite available now</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <Topbar userName={userName} userPlan={userPlan} />

        <ScrollArea className="flex-1 p-4 md:p-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Product Revenue" value="€4,250" delta="+8%" deltaTone="positive" subcopy="+ €1,245 Revenue" icon={DollarSign} />
            <KpiCard title="Total Deals" value="1,625" delta="-5%" deltaTone="negative" subcopy="+ 842 Deals" icon={TrendingUp} />
            <KpiCard title="Created Tickets" value="3,452" delta="+16%" deltaTone="positive" subcopy="+ 1,023 Tickets" icon={Ticket} />
            <KpiCard title="Average Reply" value="8:02" delta="+4%" deltaTone="positive" subcopy="+ 0:40 Faster" icon={Clock} />
          </div>

          {/* Charts row: 2/3 + 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Total Revenue</CardTitle>
                  <CardDescription>Year to date</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <FilterIcon className="h-4 w-4" /> Filter
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <SlidersHorizontal className="h-4 w-4" /> Manage
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart data={revenueData} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </ReLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <ProCard />
          </div>

          {/* Tickets bar chart */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Avg. Ticket Created</CardTitle>
                <CardDescription>Created vs Solved per month</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <LegendDot label="Created" className="bg-primary/40" />
                <LegendDot label="Solved" className="bg-primary" />
                <select className="text-sm border rounded-md px-2 py-1 bg-background">
                  <option>Yearly</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={ticketsData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="created" radius={[4, 4, 0, 0]} fill="hsl(var(--primary)/.4)" />
                    <Bar dataKey="solved" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Footer CTA */}
          <Card className="mt-6">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6">
              <div>
                <h3 className="text-lg font-semibold">Upgrade to Pro</h3>
                <p className="text-sm text-muted-foreground">Unlock all features and get unlimited access to our support team.</p>
              </div>
              <Button>Upgrade Now</Button>
            </CardContent>
          </Card>
        </ScrollArea>
      </main>
    </div>
  );
}

/************************************
 * COMPONENTS
 ***********************************/
function Topbar({ userName, userPlan }: { userName: string; userPlan: string }) {
  return (
    <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold truncate">Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>21 Oct — 21 Nov</span>
          </div>
          <div className="hidden sm:block">
            <select className="text-sm border rounded-md px-2 py-1 bg-background">
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>

          <Button variant="default" className="hidden md:inline-flex">Export CSV</Button>

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <HelpCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-2 pl-2 pr-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="https://csspicker.dev/api/image/?q=profile+avatar&image_type=photo" alt="profile" />
                  <AvatarFallback>YA</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm text-left">
                  <span className="block font-medium leading-tight">{userName}</span>
                  <span className="block text-muted-foreground">{userPlan}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="px-2 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/20"
          : "text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function ConversationItem({ name, phone, color, unread }: { name: string; phone: string; color: string; unread?: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
      <div className="flex items-center gap-3">
        <div className={cn("h-3 w-3 rounded", color)} />
        <div>
          <div className="text-sm font-medium leading-tight">{name}</div>
          <div className="text-xs text-muted-foreground">{phone}</div>
        </div>
      </div>
      {typeof unread === "number" && (
        <Badge variant="secondary" className="text-xs">{unread}</Badge>
      )}
    </div>
  );
}

function KpiCard({ title, value, delta, deltaTone, subcopy, icon: Icon }: {
  title: string;
  value: string;
  delta: string;
  deltaTone: "positive" | "negative" | "neutral";
  subcopy: string;
  icon: any;
}) {
  const deltaClass = deltaTone === "positive" ? "text-emerald-600" : deltaTone === "negative" ? "text-rose-600" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardDescription>{title}</CardDescription>
          <div className="mt-1 text-3xl font-bold">{value}</div>
          <div className="text-sm mt-1">
            <span className={cn("font-medium", deltaClass)}>{delta}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{subcopy}</div>
        </div>
        <div className="rounded-md bg-muted p-2">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
    </Card>
  );
}

function ProCard() {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <CardHeader>
        <CardTitle className="text-primary-foreground">Pro Mode</CardTitle>
        <CardDescription className="text-primary-foreground/80">Upgrade now to unlock all features you need.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" className="gap-2">
          Unlock Now <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function LegendDot({ label, className }: { label: string; className?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={cn("h-3 w-3 rounded-full", className)} />
      <span>{label}</span>
    </div>
  );
}
