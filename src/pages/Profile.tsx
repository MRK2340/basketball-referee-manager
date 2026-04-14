import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Star, 
  Trophy, 
  Calendar,
  Edit,
  Save,
  X,
  Upload,
  Loader2,
  Award
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const Profile = () => {
  const { user, updateProfile, uploadAvatar, resetPassword, loading: authLoading } = useAuth();
  const { refereeRatings } = useData();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    experience: '',
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        experience: user.experience || '',
      });
    }
  }, [user]);

  const handleSave = () => {
    const profileUpdates = {
      name: formData.name,
      phone: formData.phone,
      experience: formData.experience,
    };
    updateProfile(profileUpdates);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      experience: user?.experience || '',
    });
    setEditing(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      uploadAvatar(file);
    }
  };

  const handleFeatureClick = (feature) => {
    if (feature === 'change-password' && user?.email) {
      resetPassword(user.email);
      return;
    }
    if (feature === 'notification-settings') {
      navigate('/settings');
      return;
    }
    toast({
      title: "Coming Soon",
      description: "This feature is on our roadmap and will be available in a future update.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Profile - iWhistle</title>
        <meta name="description" content="Manage your referee profile, view statistics, and update your personal information." />
      </Helmet>

      <div className="space-y-8" data-testid="profile-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
          data-testid="profile-page-header"
        >
          <p className="app-kicker mb-3">Account</p>
          <h1 className="app-heading mb-3 text-4xl text-slate-950">Profile</h1>
          <p className="max-w-2xl text-slate-600">Manage your referee information, credentials, and performance details from one place.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="glass-effect border-slate-200" data-testid="profile-summary-card">
              <CardHeader className="text-center">
                <Avatar className="mx-auto w-24 h-24 ring-4 ring-brand-orange mb-4">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback className="bg-slate-200 text-slate-800 text-3xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-slate-900">{user?.name}</CardTitle>
                <CardDescription className="text-slate-600 capitalize">
                  {user?.role}
                </CardDescription>
                {user?.rating && (
                  <div className="flex items-center justify-center space-x-1 mt-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-slate-900 font-semibold">{user.rating}</span>
                    <span className="text-slate-600">/5.0</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <Trophy className="h-6 w-6 text-brand-orange mx-auto mb-1" />
                    <p className="text-slate-900 font-semibold">{user?.gamesOfficiated || 0}</p>
                    <p className="text-slate-600 text-xs">Games</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <Calendar className="h-6 w-6 text-brand-blue mx-auto mb-1" />
                    <p className="text-slate-900 font-semibold">{user?.experience || 'N/A'}</p>
                    <p className="text-slate-600 text-xs">Experience</p>
                  </div>
                </div>
                
                {user?.certifications && user.certifications.length > 0 && (
                  <div>
                    <h4 className="text-slate-900 font-semibold mb-2">Certifications</h4>
                    <div className="space-y-2">
                      {user.certifications.map((cert, index) => (
                        <Badge key={index} variant="secondary" className="w-full justify-center bg-slate-100 text-slate-800">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                />
                <Button 
                  className="w-full basketball-gradient hover:opacity-90 text-white"
                  data-testid="profile-change-photo-button"
                  onClick={() => fileInputRef.current.click()}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Change Photo
                </Button>
                {user?.role === 'referee' && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    data-testid="profile-share-button"
                    onClick={() => {
                      const url = `${window.location.origin}/referee/${user.id}`;
                      navigator.clipboard.writeText(url);
                      toast({ title: 'Link copied', description: 'Your public profile link has been copied to clipboard.' });
                    }}
                  >
                    Share Public Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-effect border-slate-200" data-testid="profile-details-card">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-slate-900">Personal Information</CardTitle>
                    <CardDescription className="text-slate-600">
                      Update your profile details
                    </CardDescription>
                  </div>
                  {!editing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="profile-edit-button"
                      onClick={() => setEditing(true)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        data-testid="profile-save-button"
                        onClick={handleSave}
                        className="basketball-gradient hover:opacity-90 text-white"
                        disabled={authLoading}
                      >
                        {authLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="profile-cancel-button"
                        onClick={handleCancel}
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-800">Full Name</Label>
                    {editing ? (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="name"
                          name="name"
                          data-testid="profile-name-input"
                          value={formData.name}
                          onChange={handleChange}
                          className="pl-10 bg-white border-slate-300 text-slate-900"
                          maxLength="100"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <User className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-900 font-medium">{user?.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-800">Email</Label>
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-900 font-medium">{user?.email}</span>
                      </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-800">Phone Number</Label>
                    {editing ? (
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="phone"
                          name="phone"
                          data-testid="profile-phone-input"
                          value={formData.phone}
                          onChange={handleChange}
                          className="pl-10 bg-white border-slate-300 text-slate-900"
                          maxLength="20"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-900 font-medium">{user?.phone || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-slate-800">Experience</Label>
                    {editing ? (
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <Input
                          id="experience"
                          name="experience"
                          data-testid="profile-experience-input"
                          value={formData.experience}
                          onChange={handleChange}
                          placeholder="e.g., 5 years"
                          className="pl-10 bg-white border-slate-300 text-slate-900"
                          maxLength="50"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-900 font-medium">{user?.experience || 'Not specified'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!editing && (
                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-slate-900 font-semibold mb-4">Account Actions</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        data-testid="profile-change-password-button"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => handleFeatureClick('change-password')}
                      >
                        Reset Password
                      </Button>
                      <Button 
                        variant="outline" 
                        data-testid="profile-notification-settings-button"
                        className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        onClick={() => handleFeatureClick('notification-settings')}
                      >
                        Notification Settings
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Rating History - Referee only */}
          {user?.role === 'referee' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card className="glass-effect border-slate-200 shadow-xs" data-testid="profile-rating-history">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-slate-900 text-lg">Performance Ratings</CardTitle>
                  </div>
                  <CardDescription className="text-slate-600">
                    Ratings submitted by managers after your games.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {refereeRatings.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600 font-medium">No ratings yet</p>
                      <p className="text-slate-400 text-sm">Ratings appear after managers review your game performance.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {refereeRatings.map((rating) => (
                        <div key={rating.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200" data-testid={`profile-rating-${rating.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map((s) => (
                                <Star key={s} className={`h-4 w-4 ${rating.stars >= s ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                              ))}
                              <span className="text-sm font-bold text-slate-700 ml-1">{rating.stars}/5</span>
                            </div>
                            <span className="text-xs text-slate-400">{format(new Date(rating.created_at), 'MMM d, yyyy')}</span>
                          </div>
                          {rating.feedback && (
                            <p className="text-slate-700 text-sm italic">&ldquo;{rating.feedback}&rdquo;</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;