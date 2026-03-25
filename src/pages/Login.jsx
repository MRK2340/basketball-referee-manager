import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, createDemoAccounts } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await login(email, password);
      toast({
        title: "Success! 🎉",
        description: "You've successfully logged in!",
      });
      navigate(user.role === 'manager' ? '/manager' : '/dashboard');
    } catch (error) {
      toast({
        title: "Login Failed 😢",
        description: error.message || "Something went wrong during login. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleDemoLogin = async (role) => {
    setIsDemoLoading(true);
    try {
      await createDemoAccounts();
      const demoEmail = role === 'manager' ? 'manager@demo.com' : 'referee@demo.com';
      const demoPassword = 'password';
      const user = await login(demoEmail, demoPassword);
      toast({
        title: `Logged in as Demo ${role.charAt(0).toUpperCase() + role.slice(1)}!`,
        description: "Welcome to the demo experience!",
      });
      navigate(user.role === 'manager' ? '/manager' : '/dashboard');
    } catch (error) {
      console.error("Demo login error:", error);
      toast({
        title: "Demo Login Failed",
        description: "Could not log in with demo credentials. Please try again.",
        variant: "destructive",
      });
    }
    setIsDemoLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - Basketball Referee Manager</title>
        <meta name="description" content="Log in to your Basketball Referee Manager account to access your schedule, games, and management tools." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[100px]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 space-y-6 rounded-lg bg-white border border-slate-200 shadow-2xl z-10"
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-orange-500 p-1 shadow-lg">
                 <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <img  alt="Basketball Reff logo" className="w-16 h-16 object-contain" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
                 </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">Welcome Back!</h1>
            <p className="text-slate-600 text-center">Sign in to manage your games and schedule.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-900 font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-900 font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-all shadow-md font-bold" 
                disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">Or continue with</span>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-600 bg-transparent font-bold">
                Try Demo Account
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 text-slate-900 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl text-center pb-2 text-slate-900">Select Demo Role</DialogTitle>
                <DialogDescription className="text-center text-slate-600">
                  Experience the platform with pre-populated data. No registration needed.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 pt-4">
                <Button
                  onClick={() => handleDemoLogin('manager')}
                  disabled={isDemoLoading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 text-lg font-bold"
                >
                  {isDemoLoading ? "Loading..." : "Log in as Manager"}
                </Button>
                <Button
                  onClick={() => handleDemoLogin('referee')}
                  disabled={isDemoLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold"
                >
                  {isDemoLoading ? "Loading..." : "Log in as Referee"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>


          <div className="text-center text-slate-600 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-bold transition-colors">
              Register here
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;