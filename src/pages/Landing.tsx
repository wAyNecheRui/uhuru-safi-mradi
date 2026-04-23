import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Shield, Users, Building, Eye, Wallet, CheckCircle, TrendingUp, 
  ArrowRight, ExternalLink, AlertTriangle, Clock, UserX, Search,
  MapPin, FileCheck, Lock, MessageSquare, Star
} from 'lucide-react';
import logoImg from '@/assets/uhuru-safi-logo.png';
import MobileNavigation from '@/components/MobileNavigation';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';
import SEO from '@/components/SEO';

const Landing = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const stats = [
    { value: '47', label: 'Counties Covered' },
    { value: '2,500+', label: 'Projects Tracked' },
    { value: '50K+', label: 'Active Citizens' },
    { value: 'KES 12B', label: 'Funds Monitored' },
  ];

  const challenges = [
    { icon: Clock, title: 'Delayed Projects', description: 'Many public projects stall or take years beyond their deadlines with no accountability.' },
    { icon: UserX, title: 'Limited Citizen Voice', description: 'Citizens rarely know what projects are happening or have a way to provide feedback.' },
    { icon: AlertTriangle, title: 'Risk of Mismanagement', description: 'Without transparency, funds can be misallocated, leading to poor infrastructure outcomes.' },
  ];

  const features = [
    { icon: Search, title: 'Real-Time Project Tracking', description: 'Monitor project status, budget utilisation, timelines, and photo evidence — all in real time.' },
    { icon: MapPin, title: 'Citizen Need Reporting', description: 'Flag infrastructure issues in your county — potholes, broken bridges, stalled projects — with GPS and photos.' },
    { icon: FileCheck, title: 'Verified & Trusted Contractors', description: 'Only KRA-verified, licensed contractors can bid. Background checks and performance ratings are public.' },
    { icon: Lock, title: 'Secure Escrow Funding', description: 'Public funds are held in escrow and released only after milestone completion is independently verified.' },
    { icon: MessageSquare, title: 'Public Participation & Feedback', description: 'Comment, rate, and hold leaders accountable. Community votes prioritise which problems get fixed first.' },
  ];

  const steps = [
    { number: '01', title: 'Report Needs', description: 'Citizens report infrastructure problems or browse ongoing projects in their county.' },
    { number: '02', title: 'Transparent Bidding', description: 'Verified contractors submit competitive, transparent bids on approved projects.' },
    { number: '03', title: 'Escrow Funding', description: 'Government funds are held safely in escrow — no one touches the money until work is verified.' },
    { number: '04', title: 'Live Monitoring', description: 'Work progress is tracked with photos, GPS, and public updates. Citizens can verify on the ground.' },
    { number: '05', title: 'Verified Release', description: 'Payments released only after milestone verification and citizen feedback. Full transparency.' },
  ];

  const benefits = [
    {
      title: 'For Citizens',
      icon: Users,
      items: ['Know exactly where your taxes go', 'Hold leaders accountable', 'Easily report issues in your area', 'Vote on community priorities'],
    },
    {
      title: 'For Contractors',
      icon: Building,
      items: ['Fair and transparent bidding', 'Faster milestone-based payments', 'Build a verified reputation', 'Access more government projects'],
    },
    {
      title: 'For Government',
      icon: Shield,
      items: ['Reduced corruption risk', 'Better project delivery rates', 'Higher public trust', 'Real-time oversight & analytics'],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card/95 backdrop-blur-xl border-b border-border/60 sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2.5">
              <img src={logoImg} alt="Uhuru Safi" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
              <span className="font-bold font-display text-foreground text-base sm:text-lg">Uhuru Safi</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {['Projects', 'Transparency', 'About', 'How it Works', 'Contact'].map((item) => (
                <button 
                  key={item}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium"
                  onClick={() => navigate(item === 'Projects' ? '/projects' : `/${item.toLowerCase().replace(/ /g, '-')}`)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => navigate('/auth')} className="hidden sm:inline-flex">
                Sign In
              </Button>
              <MobileNavigation />
            </div>
          </div>
        </ResponsiveContainer>
      </nav>

      <main>
        {/* ═══ HERO ═══ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
          <ResponsiveContainer className="pt-14 sm:pt-24 lg:pt-32 pb-12 sm:pb-20 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
                <div className="w-1.5 h-1.5 bg-primary rounded-full status-pulse" />
                Kenya's Government Transparency Platform
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-foreground mb-5 leading-[1.1] tracking-tight">
                Transparent Government
                <span className="block text-primary mt-1">Project Delivery</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
                Empowering Kenyan citizens to track, monitor, and participate in public infrastructure
                projects with full transparency and accountability.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground/80 mb-8 max-w-xl mx-auto">
                Real-time tracking &bull; Verified contractors &bull; Secure escrow funding &bull; Citizen-powered oversight
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="rounded-xl px-8 h-12 text-base shadow-elevation-md" onClick={() => navigate('/auth')}>
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-xl px-8 h-12 text-base" onClick={() => navigate('/projects')}>
                  View All Projects <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ STATS BAR ═══ */}
        <section className="border-y border-border bg-secondary/50">
          <ResponsiveContainer className="py-6 sm:py-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold font-display text-foreground">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ THE CHALLENGE ═══ */}
        <section>
          <ResponsiveContainer className="py-14 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">The Challenge We're Solving</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Many public projects in Kenya suffer from delays, cost overruns, and lack of visibility. Citizens often don't know where their taxes are going or when projects will be completed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {challenges.map((c, i) => (
                <div key={i} className="bg-destructive/5 border border-destructive/15 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <c.icon className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="text-base font-bold font-display text-foreground mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ KEY FEATURES (Our Solution) ═══ */}
        <section className="bg-secondary/30">
          <ResponsiveContainer className="py-14 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">Our Solution – Key Features</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Built to ensure accountability, transparency, and efficiency in public project delivery.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-card-hover transition-all duration-200">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold font-display text-foreground mb-2">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section>
          <ResponsiveContainer className="py-14 sm:py-20">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">How It Works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">A simple, transparent 5-step process from problem to solution.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {steps.map((s, i) => (
                <div key={i} className="relative bg-card border border-border rounded-xl p-5 text-center">
                  <div className="text-3xl font-extrabold font-display text-primary/20 mb-2">{s.number}</div>
                  <h4 className="text-sm font-bold font-display text-foreground mb-1.5">{s.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30 z-10" />
                  )}
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ BENEFITS ═══ */}
        <section className="bg-secondary/30">
          <ResponsiveContainer className="py-14 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">Benefits & Impact</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Uhuru Safi creates value for every stakeholder in the public project lifecycle.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {benefits.map((b, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-foreground mb-3">{b.title}</h3>
                  <ul className="space-y-2">
                    {b.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ WHO IS THIS FOR (Role Cards) ═══ */}
        <section>
          <ResponsiveContainer className="py-14 sm:py-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">Who Is This For?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Join as a citizen, contractor, or government official and contribute to transparent infrastructure delivery.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {[
                { id: 'citizen', title: 'Citizens', description: 'Report infrastructure problems, verify project progress, and register your skills for opportunities.', icon: Users, accent: 'bg-primary/10 text-primary' },
                { id: 'contractor', title: 'Contractors', description: 'Bid on verified projects, track progress, and receive guaranteed payments through secure escrow.', icon: Building, accent: 'bg-accent/15 text-accent-foreground' },
                { id: 'government', title: 'Government', description: 'Oversee projects, manage budgets, and ensure transparent allocation of public funds.', icon: Shield, accent: 'bg-success/10 text-success' },
              ].map((userType) => (
                <div 
                  key={userType.id} 
                  className="group bg-card border border-border rounded-xl p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate('/auth')}
                >
                  <div className={`w-12 h-12 ${userType.accent} rounded-xl flex items-center justify-center mb-4`}>
                    <userType.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold font-display text-foreground mb-2">{userType.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{userType.description}</p>
                  <span className="text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Join Now <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ TRUST SECTION ═══ */}
        <section className="border-y border-border bg-secondary/30">
          <ResponsiveContainer className="py-8 sm:py-10">
            <p className="text-center text-sm text-muted-foreground mb-5">
              Built for Kenya's commitment to open governance and the Access to Information Act
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {[
                { icon: Lock, label: 'Data Secured' },
                { icon: CheckCircle, label: 'Real-Time Verified' },
                { icon: Users, label: 'Citizen-First Platform' },
                { icon: Shield, label: 'Government Endorsed' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <badge.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">{badge.label}</span>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* ═══ FINAL CTA ═══ */}
        <section>
          <ResponsiveContainer className="py-14 sm:py-20">
            <div className="text-center bg-primary rounded-2xl p-8 sm:p-12">
              <h3 className="text-xl sm:text-2xl font-bold font-display text-primary-foreground mb-3">
                Ready to make government projects more transparent?
              </h3>
              <p className="text-sm text-primary-foreground/80 mb-6 max-w-md mx-auto leading-relaxed">
                Join thousands of Kenyans working together for transparent, accountable infrastructure delivery.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  variant="accent"
                  size="lg"
                  className="rounded-xl px-8 h-12 text-base"
                  onClick={() => navigate('/auth')}
                >
                  Join as a Citizen <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 h-12 text-base bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => navigate('/auth')}
                >
                  Register as a Contractor
                </Button>
              </div>
            </div>
          </ResponsiveContainer>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <ResponsiveContainer>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoImg} alt="Uhuru Safi" className="w-6 h-6 object-contain" />
              <span className="text-sm font-semibold font-display text-foreground">Uhuru Safi</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => navigate('/contact')} className="hover:text-foreground transition-colors">Contact</button>
              <button onClick={() => navigate('/user-guide')} className="hover:text-foreground transition-colors">User Guide</button>
            </div>
            <p className="text-xs text-muted-foreground">Built for transparent Kenyan governance</p>
          </div>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default Landing;
