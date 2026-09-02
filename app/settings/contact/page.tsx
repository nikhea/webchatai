import { SparklesIcon, BugIcon, AlertCircleIcon, ShieldIcon, ScrollTextIcon, UsersIcon } from "lucide-react";

const items = [
  {
    title: "Have a cool feature idea?",
    desc: "Vote on upcoming features or suggest your own",
    icon: SparklesIcon,
  },
  {
    title: "Found a non-critical bug?",
    desc: "UI glitches or formatting issues? Report them here :)",
    icon: BugIcon,
  },
  {
    title: "Having account or billing issues?",
    desc: "Email us for priority support - support@ping.gg",
    icon: AlertCircleIcon,
  },
  {
    title: "Want to join the community?",
    desc: "Come hang out in our Discord! Chat with the team and other users",
    icon: UsersIcon,
  },
  {
    title: "Privacy Policy",
    desc: "Read our privacy policy and data handling practices",
    icon: ShieldIcon,
  },
  {
    title: "Terms of Service",
    desc: "Review our terms of service and usage guidelines",
    icon: ScrollTextIcon,
  },
];

export default function ContactPage() {
  return (
    <div className="space-y-4 md:max-w-lg">
      <h1 className="text-xl font-semibold">We&apos;re here to help!</h1>
      <div className="flex flex-col">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <a
              key={it.title}
              href="#"
              className="border-secondary hover:bg-secondary/40 block rounded-lg border p-4 transition-colors"
              style={{ marginBottom: "16px", width: "512px", maxWidth: "100%" }}
            >
              <div className="flex items-center gap-4">
                <Icon className="size-5 shrink-0 text-[#a3004c]" style={{ width: "20px", height: "20px" }} />
                <div>
                  <h3 className="font-medium text-zinc-100" style={{ fontSize: "16px" }}>
                    {it.title}
                  </h3>
                  <p className="text-sm text-muted-foreground/80" style={{ fontSize: "14px" }}>
                    {it.desc}
                  </p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
