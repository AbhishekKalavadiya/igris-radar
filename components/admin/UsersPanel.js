'use client';

import { useState, useEffect } from 'react';
import { Loader2, User, Activity, Search, Calendar, Target, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const PLAN_COLORS = {
  free: '#94a3b8',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  agency: '#ec4899',
  enterprise: '#f59e0b'
};

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected user for logs modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api?path=admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        toast({ title: 'Failed to load users', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error fetching users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openUserLogs = async (user) => {
    setSelectedUser(user);
    setLogsLoading(true);
    setUserLogs([]);
    try {
      const res = await fetch(`/api?path=admin/user-logs&userId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setUserLogs(data.data || []);
      }
    } catch (err) {
      toast({ title: 'Failed to load logs', variant: 'destructive' });
    } finally {
      setLogsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate plan distribution for graph
  const planDistribution = users.reduce((acc, user) => {
    const plan = user.plan || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(planDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PLAN_COLORS[name] || PLAN_COLORS.free
  }));

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase()) || 
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 mt-6 animate-in fade-in zoom-in-95">
      
      {/* Metrics & Graph Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Total Users</CardTitle>
            <CardDescription>Registered accounts on platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              {users.length}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Total Scans Completed: {users.reduce((acc, u) => acc + (u.totalScans || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            {users.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Click on a user to view their activity logs.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Scans</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{user.name || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border" style={{ borderColor: PLAN_COLORS[user.plan||'free'], color: PLAN_COLORS[user.plan||'free'] }}>
                          {user.plan || 'free'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{user.totalScans || 0}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openUserLogs(user)}>
                          View Logs
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Logs Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Activity Logs: {selectedUser?.name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              Recent actions performed by this user on the platform.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-4">
            {logsLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : userLogs.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground border border-dashed rounded-lg mt-4">
                No activity logs found for this user.
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent mt-4">
                {userLogs.map((log) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      {log.action.includes('scan') ? <Target className="w-4 h-4 text-primary" /> : <ShieldAlert className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm capitalize">{log.action.replace(/\./g, ' ')}</span>
                        <time className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </time>
                      </div>
                      <div className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                        {log.metadata ? JSON.stringify(log.metadata) : 'No additional metadata'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
