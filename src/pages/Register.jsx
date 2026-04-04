import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const Register = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'referee'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    const newErrors = {};
    if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number (min 10 digits).";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please check the form for errors.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const result = await register(formData);
      if (result.success) {
        navigate('/login');
      }
    } catch (error) {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: null }));
    }
  };

  return (
    <>
      <Helmet>
        <title>Register - iWhistle</title>
        <meta name="description" content="Create your secure account." />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="absolute inset-0 bg-slate-50" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <Card className="bg-white border-slate-200 shadow-xl">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center shadow-md" style={{background: 'linear-gradient(135deg, #0080C8 0%, #FF8C00 100%)'}}>
                 <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                   <img alt="iWhistle logo" className="w-8 h-8" src="https://horizons-cdn.hostinger.com/182977b3-9034-4aa6-9bf3-458370fd0e4f/49272e180e7aa9962056fc094f275da2.png" />
                 </div>
              </div>
              <div>
                <CardTitle className="text-2xl font-bold" style={{color: '#003D7A'}}>
                  Join iWhistle
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Your journey to officiating excellence starts here
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={`font-semibold ${errors.name ? "text-red-600" : "text-slate-900"}`}>
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      className={`pl-10 bg-white text-slate-900 placeholder:text-slate-500 ${errors.name ? "border-red-500" : "border-slate-300"}`}
                      required
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600 font-medium mt-1">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className={`font-semibold ${errors.email ? "text-red-600" : "text-slate-900"}`}>
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className={`pl-10 bg-white text-slate-900 placeholder:text-slate-500 ${errors.email ? "border-red-500" : "border-slate-300"}`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 font-medium mt-1">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className={`font-semibold ${errors.phone ? "text-red-600" : "text-slate-900"}`}>
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 555 123 4567"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`pl-10 bg-white text-slate-900 placeholder:text-slate-500 ${errors.phone ? "border-red-500" : "border-slate-300"}`}
                      required
                    />
                  </div>
                   {errors.phone && <p className="text-xs text-red-600 font-medium mt-1">{errors.phone}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-900 font-semibold">Role</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="referee">Referee</option>
                    <option value="manager">League Manager</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className={`font-semibold ${errors.password ? "text-red-600" : "text-slate-900"}`}>
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className={`pl-10 pr-10 bg-white text-slate-900 placeholder:text-slate-500 ${errors.password ? "border-red-500" : "border-slate-300"}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-slate-500 hover:text-slate-900"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                   {errors.password && <p className="text-xs text-red-600 font-medium mt-1">{errors.password}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className={`font-semibold ${errors.confirmPassword ? "text-red-600" : "text-slate-900"}`}>
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-10 bg-white text-slate-900 placeholder:text-slate-500 ${errors.confirmPassword ? "border-red-500" : "border-slate-300"}`}
                      required
                    />
                  </div>
                   {errors.confirmPassword && <p className="text-xs text-red-600 font-medium mt-1">{errors.confirmPassword}</p>}
                </div>
                
                <Button
                  type="submit"
                  className="w-full text-white font-bold py-3 mt-2 shadow-md transition-all"
                  style={{backgroundColor: '#0080C8'}}
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Start Your Journey'}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-slate-600 font-medium">
                  Already have an account?{' '}
                  <Link to="/login" className="font-bold transition-colors hover:underline" style={{color: '#0080C8'}}>
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Register;