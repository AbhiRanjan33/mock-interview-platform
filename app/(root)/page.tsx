import InterviewCard from '@/components/InterviewCard';
import { Button } from '@/components/ui/button';
import { getInterviewsByUserId, getLatestInterviews, getFeebackByInterviewId } from '@/lib/actions/general.action';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { getCurrentUser } from '@/lib/actions/auth.action';

const page = async () => {
  const user = await getCurrentUser();

  const [userInterviews, latestInterviews] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id! }),
  ]);

  const hasPastInterviews = userInterviews?.length > 0;
  const hasUpcomingInterviews = latestInterviews?.length > 0;

  // Fetch feedback for each interview in latestInterviews to determine button text and link
  const latestInterviewsWithFeedback = await Promise.all(
    latestInterviews?.map(async (interview) => {
      const feedback = user?.id
        ? await getFeebackByInterviewId({ interviewId: interview.id, userId: user.id })
        : null;
      return { ...interview, hasFeedback: !!feedback };
    }) || []
  );

  return (
    <>
      <section className='card-cta'>
        <div className='flex flex-col gap-6 max-w-lg'>
          <h2>Get Interview Ready with AI-Powered Practice & Feedback</h2>
          <p className='text-lg'>Practice on real interview questions & get instant feedback</p>
          <Button asChild className='btn-primary max-sm:w-full'>
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>
        <Image src="/robot.png" alt="robot" width={400} height={400} className='max-sm:hidden' />
      </section>

      <section className='flex flex-col gap-6 mt-8'>
        <h2>Your Interviews</h2>
        <div className='interviews-section'>
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <p>You haven't taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className='flex flex-col gap-6 mt-8'>
        <h2>Take an Interview</h2>
        <div className='interviews-section'>
          {hasUpcomingInterviews ? (
            latestInterviewsWithFeedback?.map((interview) => (
              <InterviewCard
                {...interview}
                key={interview.id}
                // Pass hasFeedback to InterviewCard to control button text/link
                hasFeedback={interview.hasFeedback}
              />
            ))
          ) : (
            <p>There are no new interviews available</p>
          )}
        </div>
      </section>
    </>
  );
};

export default page;