import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Building,
  DollarSign,
  Clock,
} from 'lucide-react';
import { formatCurrency, getInitials } from '@/lib/utils/formatters';
import type { Employee } from '@/types';

export default function EmployeeProfilePage() {
  const { appUser } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser) return;

    const fetchEmployee = async () => {
      const empQuery = query(
        collection(db, 'employees'),
        where('uid', '==', appUser.uid)
      );
      const snapshot = await getDocs(empQuery);
      if (!snapshot.empty) {
        setEmployee({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Employee);
      }
      setLoading(false);
    };

    fetchEmployee();
  }, [appUser]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48 bg-muted" />
        <Skeleton className="h-64 w-full bg-muted" />
      </div>
    );
  }

  const displayName = employee?.name || appUser?.name || appUser?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your employee information</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Profile</CardTitle>
          <CardDescription className="text-muted-foreground">Your account and employment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{displayName}</h2>
              <Badge className="mt-1 bg-primary/20 text-primary border-primary/30">Employee</Badge>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-4">
            <InfoItem icon={User} label="Full Name" value={displayName} />
            <InfoItem icon={Mail} label="Email" value={employee?.email || appUser?.email || '-'} />
            {employee && (
              <>
                <InfoItem icon={Building} label="Department" value={employee.department} />
                <InfoItem icon={DollarSign} label="Basic Salary" value={formatCurrency(employee.salary)} />
                <InfoItem icon={Clock} label="Overtime Hours" value={`${employee.overtimeHours} hrs`} />
              </>
            )}
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
