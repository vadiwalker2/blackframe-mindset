import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Moon, Sun, Bell, LogOut, Trash2, User, ChevronRight } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { useTheme } from "@/lib/theme";
import { useStore } from "@/lib/store";
<<<<<<< HEAD
import { useAuth } from "@/lib/auth";
=======
>>>>>>> 97c7925c995387124162f8826c09cbab7f7e05e2

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Blackframe" },
      { name: "description", content: "Profile, theme, notifications, and data controls." },
    ],
  }),
  component: SettingsPage,
});

function Row({
  icon: Icon, label, value, onClick, danger,
}: { icon: typeof Moon; label: string; value?: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left ${
        danger ? "text-destructive" : ""
      }`}
    >
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium flex-1">{label}</span>
      {value !== undefined ? (
        <span className="text-sm text-muted-foreground">{value}</span>
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 animate-fade-up">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2 px-1">{title}</h2>
      <div className="glass border border-border/60 rounded-2xl overflow-hidden divide-y divide-border/60">
        {children}
      </div>
    </section>
  );
}

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { resetAllData, routines, allTasks } = useStore();
<<<<<<< HEAD
  const { user, signInWithGoogle, signOut } = useAuth();
=======
>>>>>>> 97c7925c995387124162f8826c09cbab7f7e05e2
  const [confirming, setConfirming] = useState(false);

  const handleReset = () => {
    if (!confirming) { setConfirming(true); return; }
    resetAllData();
    setConfirming(false);
  };

  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Configure your Blackframe." />

      <Section title="Account">
        <div className="px-4 py-4 flex items-center gap-3">
<<<<<<< HEAD
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{user ? user.user_metadata?.full_name || user.email : "Guest"}</p>
            <p className="text-xs text-muted-foreground truncate">{user ? user.email : "Not signed in"}</p>
          </div>
          {!user && (
            <button 
              onClick={signInWithGoogle}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          )}
=======
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Guest</p>
            <p className="text-xs text-muted-foreground truncate">Sign in coming soon</p>
          </div>
          <button className="text-xs font-medium px-3 py-1.5 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity">
            Sign in
          </button>
>>>>>>> 97c7925c995387124162f8826c09cbab7f7e05e2
        </div>
      </Section>

      <Section title="Appearance">
        <Row
          icon={theme === "dark" ? Moon : Sun}
          label="Theme"
          value={
            <button onClick={toggle} className="flex items-center gap-2 text-sm hover:text-foreground">
              <span className="capitalize">{theme}</span>
              <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${theme === "dark" ? "bg-foreground" : "bg-muted-foreground/30"}`}>
                <span className={`block w-4 h-4 rounded-full bg-background transition-transform ${theme === "dark" ? "translate-x-4" : ""}`} />
              </span>
            </button>
          }
        />
      </Section>

      <Section title="Notifications">
        <Row icon={Bell} label="Reminders" value="Off" />
      </Section>

      <Section title="Data">
        <div className="px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Local storage</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {routines.length} routines · {allTasks.length} tasks
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          onBlur={() => setConfirming(false)}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm font-medium flex-1">
            {confirming ? "Tap again to confirm" : "Reset all data"}
          </span>
        </button>
<<<<<<< HEAD
        {user && <Row icon={LogOut} label="Sign out" onClick={signOut} />}
      </Section>

      <p className="text-center text-[11px] text-muted-foreground mt-8">
        Blackframe v0.3 · Phase 3 · Cloud Sync
=======
        <Row icon={LogOut} label="Sign out" />
      </Section>

      <p className="text-center text-[11px] text-muted-foreground mt-8">
        Blackframe v0.2 · Phase 2 · Local state engine
>>>>>>> 97c7925c995387124162f8826c09cbab7f7e05e2
      </p>
    </AppShell>
  );
}
