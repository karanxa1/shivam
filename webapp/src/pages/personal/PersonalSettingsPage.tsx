import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Pencil,
  Lock,
  Loader2,
} from 'lucide-react';
import { formatDateFull, getInitials } from '@/lib/utils/formatters';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function PersonalSettingsPage() {
  const { appUser, signOut, updateDisplayName, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (!appUser) return null;

  const displayName = appUser.name || appUser.email?.split('@')[0] || 'User';
  const initials = appUser.name ? getInitials(appUser.name) : displayName.charAt(0).toUpperCase();

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await updateDisplayName(newName.trim());
      toast.success('Name updated');
      setIsEditNameOpen(false);
      setNewName('');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated');
      setIsChangePasswordOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      if (msg.includes('requires-recent-login')) {
        toast.error('Please sign out and sign back in before changing your password');
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Profile</CardTitle>
              <CardDescription className="text-muted-foreground">Your account information</CardDescription>
            </div>
            <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
              <DialogTrigger render={
                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted gap-2">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Name
                </Button>
              } />
              <DialogContent className="bg-card border-border sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Display Name</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Update your display name</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdateName}>
                  <div className="py-2">
                    <Label className="text-foreground text-sm">Name</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={displayName}
                      required
                      disabled={saving}
                      className="mt-1.5 bg-muted/50 border-border text-foreground h-10"
                    />
                  </div>
                  <DialogFooter className="mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditNameOpen(false)} className="border-border text-foreground hover:bg-muted">Cancel</Button>
                    <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
              <Badge className="mt-1 bg-primary/20 text-primary border-primary/30">
                {appUser.role.charAt(0).toUpperCase() + appUser.role.slice(1)}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-4">
            <InfoItem icon={User} label="Display Name" value={displayName} />
            <InfoItem icon={Mail} label="Email Address" value={appUser.email} />
            <InfoItem icon={Shield} label="Role" value={appUser.role.charAt(0).toUpperCase() + appUser.role.slice(1)} />
            {appUser.createdAt && (
              <InfoItem icon={Calendar} label="Account Created" value={formatDateFull(appUser.createdAt)} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
              <DialogTrigger render={
                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-muted gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Change
                </Button>
              } />
              <DialogContent className="bg-card border-border sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Change Password</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Enter your new password</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword}>
                  <div className="space-y-3 py-2">
                    <div>
                      <Label className="text-foreground text-sm">New Password</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        disabled={saving}
                        className="mt-1.5 bg-muted/50 border-border text-foreground h-10"
                      />
                    </div>
                    <div>
                      <Label className="text-foreground text-sm">Confirm Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        disabled={saving}
                        className="mt-1.5 bg-muted/50 border-border text-foreground h-10"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsChangePasswordOpen(false)} className="border-border text-foreground hover:bg-muted">Cancel</Button>
                    <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Sign Out</p>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}
