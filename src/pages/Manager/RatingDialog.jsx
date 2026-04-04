import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Award } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const StarRating = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
        <Star
          className={`h-8 w-8 transition-all hover:scale-110 ${
            value >= star ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm' : 'text-slate-300 hover:text-yellow-300'
          }`}
        />
      </button>
    ))}
    {value > 0 && (
      <span className="ml-2 text-sm font-semibold text-slate-700">
        {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
      </span>
    )}
  </div>
);

const RatingDialog = ({ open, setOpen, game }) => {
  const { rateReferee } = useData();
  const referees = (game?.assignments || []).filter((a) => a.status !== 'declined');
  const [ratings, setRatings] = useState({});
  const [feedbacks, setFeedbacks] = useState({});

  const setRating = (refId, val) => setRatings((p) => ({ ...p, [refId]: val }));
  const setFeedback = (refId, val) => setFeedbacks((p) => ({ ...p, [refId]: val }));

  const handleSubmit = () => {
    referees.forEach((a) => {
      const stars = ratings[a.refereeId] || 0;
      if (stars > 0) {
        rateReferee(game.id, a.refereeId, stars, feedbacks[a.refereeId] || '');
      }
    });
    setOpen(false);
    setRatings({});
    setFeedbacks({});
  };

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900" data-testid="rating-dialog">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-brand-orange" />
            <DialogTitle className="text-slate-900 text-xl">Rate Referees</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600">
            {game.homeTeam} vs {game.awayTeam} — provide performance ratings for the officiating crew.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto">
          {referees.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No assigned referees to rate for this game.</p>
          ) : (
            referees.map((assignment) => (
              <div key={assignment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3" data-testid={`rating-referee-${assignment.refereeId}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={assignment.referee?.avatarUrl} />
                    <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                      {assignment.referee?.name?.charAt(0) || 'R'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900">{assignment.referee?.name || 'Referee'}</p>
                    <p className="text-xs text-slate-500 capitalize">{assignment.status}</p>
                  </div>
                </div>
                <StarRating value={ratings[assignment.refereeId] || 0} onChange={(v) => setRating(assignment.refereeId, v)} />
                <Textarea
                  placeholder="Optional written feedback..."
                  value={feedbacks[assignment.refereeId] || ''}
                  onChange={(e) => setFeedback(assignment.refereeId, e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm min-h-[70px]"
                  data-testid={`rating-feedback-${assignment.refereeId}`}
                />
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-300 text-slate-700">
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            className="basketball-gradient hover:opacity-90 text-white"
            data-testid="rating-submit-button"
            disabled={referees.length === 0}
          >
            Submit Ratings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;
