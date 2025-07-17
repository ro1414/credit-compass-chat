import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Target, TrendingUp, Shield } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect authenticated users to chat
    if (user && !loading) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Your Personal Financial Coach AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get personalized financial advice, track your goals, and build a secure financial future with our AI-powered coaching platform.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader className="text-center">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>AI-Powered Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get instant, personalized financial advice through our intelligent chatbot that understands your unique situation.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Goal Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Set and track your financial goals with actionable steps and milestones to keep you on track.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Credit Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Get tailored strategies to improve your credit score and manage debt effectively.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Why Choose Financial Coach AI?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your financial data is encrypted and secure. We never share your information with third parties.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MessageCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">24/7 Availability</h3>
                <p className="text-muted-foreground">
                  Get financial guidance whenever you need it. Our AI coach is available around the clock.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Target className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Personalized Advice</h3>
                <p className="text-muted-foreground">
                  Receive advice tailored to your specific financial situation, goals, and credit profile.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <TrendingUp className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Actionable Steps</h3>
                <p className="text-muted-foreground">
                  Get clear, step-by-step guidance to reach your financial milestones and improve your credit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
