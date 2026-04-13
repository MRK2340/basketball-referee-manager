import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { fetchPublicRefereeProfile } from '@/lib/firestoreService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Trophy, Award, Calendar, ArrowLeft, Loader2 } from 'lucide-react';

interface PublicProfile {
  id: string; name: string; avatarUrl: string; bio: string;
  location: string; certifications: string[]; gamesOfficiated: number;
  rating: number; totalRatings: number; experience: string; createdAt: string;
}

const RefereePublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await fetchPublicRefereeProfile(id);
      if (err) {
        setError(err.message);
      } else {
        setProfile(data as PublicProfile);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#0080C8]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" data-testid="public-profile-error">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">{error || 'This referee profile is not available.'}</p>
            <Link to="/">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = profile.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <>
      <Helmet>
        <title>{profile.name} — Referee Profile | iWhistle</title>
        <meta name="description" content={`${profile.name} — ${profile.experience} experience, ${profile.gamesOfficiated} games officiated. ${profile.bio}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-[#0080C8]/5 to-white" data-testid="public-profile-page">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Back link */}
          <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-[#0080C8] mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> iWhistle Home
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Hero Card */}
            <Card className="mb-6 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-[#0080C8] to-[#005a8c]" />
              <CardContent className="relative pt-0 pb-6 px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                    <AvatarFallback className="text-xl bg-[#0080C8] text-white">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 pt-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                    {profile.location && (
                      <p className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-3.5 w-3.5 mr-1" /> {profile.location}
                      </p>
                    )}
                  </div>
                  {profile.rating > 0 && (
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-amber-700">{profile.rating}</span>
                      <span className="text-xs text-amber-600">({profile.totalRatings})</span>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-5 w-5 mx-auto mb-1.5 text-[#0080C8]" />
                  <div className="text-2xl font-bold text-gray-900">{profile.gamesOfficiated}</div>
                  <div className="text-xs text-gray-500">Games Officiated</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1.5 text-[#0080C8]" />
                  <div className="text-2xl font-bold text-gray-900">{profile.experience || 'N/A'}</div>
                  <div className="text-xs text-gray-500">Experience</div>
                </CardContent>
              </Card>
              <Card className="col-span-2 sm:col-span-1">
                <CardContent className="p-4 text-center">
                  <Award className="h-5 w-5 mx-auto mb-1.5 text-[#0080C8]" />
                  <div className="text-2xl font-bold text-gray-900">{profile.certifications.length}</div>
                  <div className="text-xs text-gray-500">Certifications</div>
                </CardContent>
              </Card>
            </div>

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Certifications</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {profile.certifications.map((cert: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-[#0080C8]/10 text-[#0080C8] border-[#0080C8]/20">
                        <Award className="h-3 w-3 mr-1" /> {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            Powered by <Link to="/" className="text-[#0080C8] hover:underline">iWhistle</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default RefereePublicProfile;
