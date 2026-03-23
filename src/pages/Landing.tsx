import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building, Eye, Wallet, CheckCircle, TrendingUp, ArrowRight, ExternalLink } from 'lucide-react';
import logoImg from '@/assets/uhuru-safi-logo.png';
import MobileNavigation from '@/components/MobileNavigation';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';

const Landing = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const userTypes = [
    {
      id: 'citizen',
      title: 'Citizens',
      description: 'Report infrastructure problems, verify project progress, and register your skills for opportunities.',
      icon: Users,
      accent: 'bg-primary/10 text-primary',
    },
    {
      id: 'contractor',
      title: 'Contractors',
      description: 'Bid on verified projects, track progress, and receive guaranteed payments through secure escrow.',
      icon: Building,
      accent: 'bg-accent/15 text-accent-foreground',
    },
    {
      id: 'government',
      title: 'Government',
      description: 'Oversee projects, manage budgets, and ensure transparent allocation of public funds.',
      icon: Shield,
      accent: 'bg-success/10 text-success',
    }
  ];

  const features = [
    { icon: Eye, title: 'Full Transparency', description: 'Real-time project tracking and public fund visibility' },
    { icon: Wallet, title: 'Secure Escrow', description: 'Guaranteed contractor payments upon milestone completion' },
    { icon: CheckCircle, title: 'Citizen Verification', description: 'Community-validated project needs and progress' },
    { icon: TrendingUp, title: 'Data Analytics', description: 'Comprehensive reporting and performance insights' },
  ];

  const stats = [
    { value: '47', label: 'Counties Covered' },
    { value: '2,500+', label: 'Projects Tracked' },
    { value: '50K+', label: 'Active Citizens' },
    { value: 'KES 12B', label: 'Funds Monitored' },
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
              <Button 
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:inline-flex"
              >
                Sign In
              </Button>
              <MobileNavigation />
            </div>
          </div>
        </ResponsiveContainer>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-accent/[0.03]" />
          <ResponsiveContainer className="pt-12 sm:pt-20 lg:pt-28 pb-10 sm:pb-16 relative">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
                <div className="w-1.5 h-1.5 bg-primary rounded-full status-pulse" />
                Kenya's Government Transparency Platform
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-foreground mb-5 leading-[1.1] tracking-tight">
                Transparent Government
                <span className="block text-primary mt-1">Project Delivery</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Empowering citizens to identify infrastructure needs, connecting verified contractors, 
                and ensuring transparent project funding through innovative escrow mechanisms.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  size="lg"
                  className="rounded-xl px-8 h-12 text-base shadow-elevation-md"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button 
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 h-12 text-base"
                  onClick={() => navigate('/projects')}
                >
                  View Projects
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </ResponsiveContainer>
        </section>

        {/* Stats Bar */}
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

        {/* Role Cards */}
        <section>
          <ResponsiveContainer className="py-12 sm:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">Who Is This For?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Join as a citizen, contractor, or government official and contribute to transparent infrastructure delivery.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 stagger-children">
              {userTypes.map((userType) => {
                const IconComponent = userType.icon;
                return (
                  <div 
                    key={userType.id} 
                    className="group bg-card border border-border rounded-xl p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate('/auth')}
                  >
                    <div className={`w-12 h-12 ${userType.accent} rounded-xl flex items-center justify-center mb-4`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold font-display text-foreground mb-2">{userType.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{userType.description}</p>
                    <span className="text-sm font-semibold text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Join Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                );
              })}
            </div>
          </ResponsiveContainer>
        </section>

        {/* Features */}
        <section className="bg-secondary/30">
          <ResponsiveContainer className="py-12 sm:py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-3">Key Features</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Built to ensure accountability, transparency, and efficiency in public project delivery.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
              {features.map((f, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-all duration-200">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold font-display text-foreground mb-1.5">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </ResponsiveContainer>
        </section>

        {/* CTA */}
        <section>
          <ResponsiveContainer className="py-12 sm:py-16">
            <div className="text-center bg-primary rounded-2xl p-8 sm:p-12">
              <h3 className="text-xl sm:text-2xl font-bold font-display text-primary-foreground mb-3">Ready to Make a Difference?</h3>
              <p className="text-sm text-primary-foreground/80 mb-6 max-w-md mx-auto leading-relaxed">
                Join thousands of Kenyans working together for transparent, accountable infrastructure delivery.
              </p>
              <Button 
                variant="accent"
                size="lg"
                className="rounded-xl px-8 h-12 text-base"
                onClick={() => navigate('/auth')}
              >
                Get Started Today
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
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
            </div>
            <p className="text-xs text-muted-foreground">Built for transparent Kenyan governance</p>
          </div>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default Landing;
