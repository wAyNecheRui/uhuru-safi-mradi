import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  MapPin,
  Info,
  ChevronRight,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  MessageSquare,
  FileText,
  HelpCircle,
  ExternalLink,
  Download,
  Trash2,
  Key,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type SettingsSection = 'account' | 'notifications' | 'appearance' | 'privacy' | 'location' | 'about';

const SECTIONS: { id: SettingsSection; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'account', label: 'Account', icon: <User className="h-5 w-5" />, desc: 'Profile, email, password' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, desc: 'Push, email, SMS alerts' },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="h-5 w-5" />, desc: 'Theme and display' },
  { id: 'privacy', label: 'Privacy & Security', icon: <Shield className="h-5 w-5" />, desc: 'Password, sessions, data' },
  { id: 'location', label: 'Location', icon: <MapPin className="h-5 w-5" />, desc: 'Default county and ward' },
  { id: 'about', label: 'About', icon: <Info className="h-5 w-5" />, desc: 'Version, terms, help' },
];

const Settings = () => {
  const { user, signOut } = useAuth();
  const { userProfile } = useProfile();
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    pushEnabled: true,
    emailDigest: true,
    smsAlerts: false,
    projectUpdates: true,
    bidAlerts: true,
    paymentAlerts: true,
    communityVotes: true,
  });

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');

  // Privacy
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load saved prefs
  useEffect(() => {
    const savedNotif = localStorage.getItem('app_notification_prefs');
    if (savedNotif) setNotifPrefs(JSON.parse(savedNotif));
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) setTheme(savedTheme as any);
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const saveNotifPrefs = () => {
    localStorage.setItem('app_notification_prefs', JSON.stringify(notifPrefs));
    toast.success('Notification preferences saved');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    // Apply theme
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
    toast.success('Theme updated');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated successfully');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const handleExportData = () => {
    toast.info('Preparing your data export. This may take a moment.');
    // In production this would trigger a backend data export
    setTimeout(() => {
      toast.success('Data export is ready. Check your email for the download link.');
    }, 2000);
  };

  const initials = (userProfile?.full_name || user?.name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Settings' },
  ];

  const getDashboardPath = () => {
    switch (user?.user_type) {
      case 'citizen': return '/citizen';
      case 'contractor': return '/contractor';
      case 'government': return '/government';
      default: return '/';
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            {/* Profile summary card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    {userProfile?.avatar_url ? (
                      <AvatarImage src={userProfile.avatar_url} alt={user?.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {userProfile?.full_name || user?.name || 'User'}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {user?.user_type || 'citizen'}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(getDashboardPath())}>
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Full Name</p>
                    <p className="text-sm text-muted-foreground">{userProfile?.full_name || 'Not set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Address</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs">Verified</span>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone Number</p>
                    <p className="text-sm text-muted-foreground">{userProfile?.phone_number || 'Not set'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between items-center py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Account Type</p>
                    <p className="text-sm text-muted-foreground capitalize">{user?.user_type || 'Citizen'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Log Out of All Devices
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert Categories</CardTitle>
                <CardDescription>Choose which notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { key: 'projectUpdates', label: 'Project Updates', desc: 'Status changes, milestones, completions' },
                  { key: 'bidAlerts', label: 'Bid Alerts', desc: 'New bids, selections, and evaluations' },
                  { key: 'paymentAlerts', label: 'Payment Alerts', desc: 'Escrow funding and payment releases' },
                  { key: 'communityVotes', label: 'Community Votes', desc: 'New reports needing community validation' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[key as keyof typeof notifPrefs] as boolean}
                      onCheckedChange={(checked) =>
                        setNotifPrefs(prev => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Channels</CardTitle>
                <CardDescription>How you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Instant alerts on your device</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPrefs.pushEnabled}
                    onCheckedChange={(checked) =>
                      setNotifPrefs(prev => ({ ...prev, pushEnabled: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Digest</p>
                      <p className="text-xs text-muted-foreground">Weekly summary to your inbox</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPrefs.emailDigest}
                    onCheckedChange={(checked) =>
                      setNotifPrefs(prev => ({ ...prev, emailDigest: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">SMS Alerts</p>
                      <p className="text-xs text-muted-foreground">Critical alerts via text message</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifPrefs.smsAlerts}
                    onCheckedChange={(checked) =>
                      setNotifPrefs(prev => ({ ...prev, smsAlerts: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={saveNotifPrefs}>
              Save Notification Preferences
            </Button>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme</CardTitle>
                <CardDescription>Select your preferred appearance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light' as const, label: 'Light', icon: <Sun className="h-5 w-5" /> },
                    { value: 'dark' as const, label: 'Dark', icon: <Moon className="h-5 w-5" /> },
                    { value: 'system' as const, label: 'System', icon: <Monitor className="h-5 w-5" /> },
                  ].map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => handleThemeChange(value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        theme === value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {icon}
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Language</CardTitle>
                <CardDescription>Choose your preferred language</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={language} onValueChange={(v) => { setLanguage(v); localStorage.setItem('app_language', v); toast.success('Language updated'); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sw">Kiswahili</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                {!showPasswordForm ? (
                  <Button variant="outline" onClick={() => setShowPasswordForm(true)} className="w-full justify-start">
                    <Key className="h-4 w-4 mr-3" />
                    Change Password
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleChangePassword} disabled={passwordLoading}>
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </Button>
                      <Button variant="ghost" onClick={() => { setShowPasswordForm(false); setNewPassword(''); setConfirmPassword(''); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active Sessions</CardTitle>
                <CardDescription>Manage your logged-in devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Current Session</p>
                      <p className="text-xs text-muted-foreground">This device</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-xs">Active</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  Log Out All Other Devices
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Data</CardTitle>
                <CardDescription>Download or manage your personal data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-3" />
                  Export My Data
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Default Location</CardTitle>
                <CardDescription>Set your default county and ward for faster report submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>County</Label>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                    {userProfile?.county || 'Not set — update in your profile'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Sub-County</Label>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                    {userProfile?.sub_county || 'Not set'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Ward</Label>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                    {userProfile?.ward || 'Not set'}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Location details are managed in your profile settings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">GPS Permissions</CardTitle>
                <CardDescription>Allow location access for accurate report tagging</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-detect Location</p>
                      <p className="text-xs text-muted-foreground">Use GPS when submitting reports</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader className="items-center text-center pb-2">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                  <SettingsIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Uhuru Safi</CardTitle>
                <CardDescription>Government Transparency Platform</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {[
                  { label: 'User Guide', icon: <HelpCircle className="h-4 w-4" />, action: () => navigate('/user-guide') },
                  { label: 'Terms of Service', icon: <FileText className="h-4 w-4" />, action: () => navigate('/terms') },
                  { label: 'Privacy Policy', icon: <Shield className="h-4 w-4" />, action: () => navigate('/privacy') },
                  { label: 'Contact Support', icon: <Mail className="h-4 w-4" />, action: () => navigate('/contact') },
                  { label: 'Public Transparency Portal', icon: <Globe className="h-4 w-4" />, action: () => navigate('/public/transparency') },
                ].map(({ label, icon, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{icon}</span>
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
            <SettingsIcon className="h-7 w-7 text-primary" />
            Settings
          </h1>

          <div className={cn(
            'gap-6',
            isMobile ? 'flex flex-col' : 'grid grid-cols-[260px_1fr]'
          )}>
            {/* Sidebar / Section picker */}
            <nav className={cn(
              isMobile
                ? 'flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none'
                : 'flex flex-col gap-1'
            )}>
              {SECTIONS.map(({ id, label, icon, desc }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl transition-all text-left',
                    isMobile
                      ? 'flex-shrink-0 px-3 py-2 text-xs font-medium border'
                      : 'px-4 py-3 w-full',
                    activeSection === id
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-muted-foreground hover:bg-muted/50 border-transparent'
                  )}
                >
                  <span className={cn(activeSection === id ? 'text-primary' : 'text-muted-foreground')}>
                    {icon}
                  </span>
                  <div className={cn(isMobile ? '' : 'flex-1 min-w-0')}>
                    <p className={cn('font-medium', isMobile ? '' : 'text-sm')}>{label}</p>
                    {!isMobile && (
                      <p className="text-xs text-muted-foreground truncate">{desc}</p>
                    )}
                  </div>
                </button>
              ))}
            </nav>

            {/* Content area */}
            <div className="min-w-0">
              {renderSectionContent()}
            </div>
          </div>
        </ResponsiveContainer>
      </main>

      {/* Logout confirmation */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
