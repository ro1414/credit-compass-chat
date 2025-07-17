import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Target, CreditCard, User as UserIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  email: string;
}

interface CreditInfo {
  credit_score: number;
  total_debt: number;
  late_payments: number;
  credit_utilization: number;
  last_updated: string;
}

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  target_date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'paused';
  notes: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingCredit, setEditingCredit] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_amount: '',
    target_date: '',
    priority: 'medium',
    notes: '',
  });
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      setProfile(profileData);

      // Load credit info
      const { data: creditData, error: creditError } = await supabase
        .from('credit_info')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (creditError && creditError.code !== 'PGRST116') {
        console.log('No credit info found, will create new');
      } else {
        setCreditInfo(creditData);
      }

      // Load goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      setGoals((goalsData || []) as FinancialGoal[]);
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (formData: FormData) => {
    if (!user) return;

    try {
      const profileData = {
        user_id: user.id,
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        age: parseInt(formData.get('age') as string) || null,
        email: user.email,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      setProfile(prev => ({ ...prev, ...profileData } as UserProfile));
      setEditingProfile(false);
      toast({ title: "Profile updated successfully!" });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const updateCreditInfo = async (formData: FormData) => {
    if (!user) return;

    try {
      const creditData = {
        user_id: user.id,
        credit_score: parseInt(formData.get('creditScore') as string) || null,
        total_debt: parseFloat(formData.get('totalDebt') as string) || null,
        late_payments: parseInt(formData.get('latePayments') as string) || 0,
        credit_utilization: parseFloat(formData.get('creditUtilization') as string) || null,
      };

      const { error } = await supabase
        .from('credit_info')
        .upsert(creditData, { onConflict: 'user_id' });

      if (error) throw error;

      setCreditInfo(prev => ({ ...prev, ...creditData } as CreditInfo));
      setEditingCredit(false);
      toast({ title: "Credit information updated successfully!" });
    } catch (error) {
      console.error('Error updating credit info:', error);
      toast({
        title: "Error",
        description: "Failed to update credit information",
        variant: "destructive",
      });
    }
  };

  const addGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    try {
      const goalData = {
        user_id: user.id,
        title: newGoal.title,
        description: newGoal.description,
        target_amount: parseFloat(newGoal.target_amount) || null,
        target_date: newGoal.target_date || null,
        priority: newGoal.priority as 'high' | 'medium' | 'low',
        notes: newGoal.notes,
      };

      const { data, error } = await supabase
        .from('financial_goals')
        .insert(goalData)
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data as FinancialGoal, ...prev]);
      setNewGoal({
        title: '',
        description: '',
        target_amount: '',
        target_date: '',
        priority: 'medium',
        notes: '',
      });
      setShowNewGoalForm(false);
      toast({ title: "Goal added successfully!" });
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive",
      });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast({ title: "Goal deleted successfully!" });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Profile</h1>
        <p className="text-muted-foreground">
          Manage your personal information, credit details, and financial goals
        </p>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="credit" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Credit Info
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Financial Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfile(!editingProfile)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {editingProfile ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent>
              {editingProfile ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateProfile(new FormData(e.currentTarget));
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        defaultValue={profile?.first_name || ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        defaultValue={profile?.last_name || ''}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      defaultValue={profile?.age || ''}
                    />
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="text-foreground">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age</Label>
                    <p className="text-foreground">{profile?.age || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Credit Information</CardTitle>
                <CardDescription>Your current credit and debt details</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCredit(!editingCredit)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {editingCredit ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent>
              {editingCredit ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateCreditInfo(new FormData(e.currentTarget));
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="creditScore">Credit Score</Label>
                      <Input
                        id="creditScore"
                        name="creditScore"
                        type="number"
                        min="300"
                        max="850"
                        defaultValue={creditInfo?.credit_score || ''}
                        placeholder="e.g., 720"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalDebt">Total Debt ($)</Label>
                      <Input
                        id="totalDebt"
                        name="totalDebt"
                        type="number"
                        step="0.01"
                        defaultValue={creditInfo?.total_debt || ''}
                        placeholder="e.g., 15000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latePayments">Late Payments (last 12 months)</Label>
                      <Input
                        id="latePayments"
                        name="latePayments"
                        type="number"
                        min="0"
                        defaultValue={creditInfo?.late_payments || 0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="creditUtilization">Credit Utilization (%)</Label>
                      <Input
                        id="creditUtilization"
                        name="creditUtilization"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        defaultValue={creditInfo?.credit_utilization || ''}
                        placeholder="e.g., 30.5"
                      />
                    </div>
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground">Credit Score</Label>
                    <p className="text-2xl font-bold text-foreground">
                      {creditInfo?.credit_score || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Total Debt</Label>
                    <p className="text-2xl font-bold text-foreground">
                      {creditInfo?.total_debt ? `$${creditInfo.total_debt.toLocaleString()}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Late Payments (12 months)</Label>
                    <p className="text-xl font-semibold text-foreground">
                      {creditInfo?.late_payments ?? 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Credit Utilization</Label>
                    <p className="text-xl font-semibold text-foreground">
                      {creditInfo?.credit_utilization ? `${creditInfo.credit_utilization}%` : 'Not specified'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Financial Goals</CardTitle>
                  <CardDescription>Track your financial objectives and milestones</CardDescription>
                </div>
                <Button onClick={() => setShowNewGoalForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </CardHeader>
              <CardContent>
                {showNewGoalForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Add New Goal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="goalTitle">Goal Title</Label>
                        <Input
                          id="goalTitle"
                          value={newGoal.title}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Buy a house"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="goalDescription">Description</Label>
                        <Textarea
                          id="goalDescription"
                          value={newGoal.description}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Describe your goal in detail..."
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="targetAmount">Target Amount ($)</Label>
                          <Input
                            id="targetAmount"
                            type="number"
                            value={newGoal.target_amount}
                            onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                            placeholder="e.g., 400000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="targetDate">Target Date</Label>
                          <Input
                            id="targetDate"
                            type="date"
                            value={newGoal.target_date}
                            onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priority">Priority</Label>
                          <Select value={newGoal.priority} onValueChange={(value) => setNewGoal(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newGoal.notes}
                          onChange={(e) => setNewGoal(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addGoal} disabled={!newGoal.title.trim()}>
                          Add Goal
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewGoalForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {goals.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No financial goals yet. Add your first goal to get started!
                      </p>
                    </div>
                  ) : (
                    goals.map((goal) => (
                      <Card key={goal.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">{goal.title}</h3>
                                <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}>
                                  {goal.priority}
                                </Badge>
                                <Badge variant="outline">{goal.status}</Badge>
                              </div>
                              {goal.description && (
                                <p className="text-muted-foreground mb-2">{goal.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {goal.target_amount && (
                                  <span>Target: ${goal.target_amount.toLocaleString()}</span>
                                )}
                                {goal.target_date && (
                                  <span>By: {new Date(goal.target_date).toLocaleDateString()}</span>
                                )}
                              </div>
                              {goal.notes && (
                                <p className="text-sm text-muted-foreground mt-2 italic">{goal.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteGoal(goal.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;