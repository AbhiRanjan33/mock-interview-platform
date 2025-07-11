
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { getFeebackByInterviewId, getInterviewById, createRetakeInterview } from '@/lib/actions/general.action';
import dayjs from 'dayjs';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

// Server action to handle retake interview
async function handleRetakeInterview(interviewId: string, userId: string) {
  const { success, newInterviewId } = await createRetakeInterview(interviewId, userId);
  if (success && newInterviewId) {
    redirect(`/interview/${newInterviewId}`);
  } else {
    // Handle error (e.g., show error message or redirect to error page)
    redirect('/');
  }
}

const page = async ({ params }: { params: { id: string } }) => {
  const { id } = params;
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect('/login'); // Redirect to login if user is not authenticated
  }

  const interview = await getInterviewById(id);
  if (!interview) {
    redirect('/');
  }

  const feedback = await getFeebackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <section className="section-feedback">
      <div className="flex flex-row justify-center">
        <h1 className="text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-row justify-center">
        <div className="flex flex-row gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore || 'N/A'}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      <p>{feedback?.finalAssessment || 'No final assessment available.'}</p>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-4">
        <h2>Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.length > 0 ? (
          feedback.categoryScores.map((category, index) => (
            <div key={index}>
              <p className="font-bold">
                {index + 1}. {category.name} ({category.score}/100)
              </p>
              <p>{category.comment}</p>
            </div>
          ))
        ) : (
          <p>No breakdown available.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3>Strengths</h3>
        <ul>
          {feedback?.strengths?.length > 0 ? (
            feedback.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))
          ) : (
            <li>No strengths listed.</li>
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h3>Areas for Improvement</h3>
        <ul>
          {feedback?.areasForImprovement?.length > 0 ? (
            feedback.areasForImprovement.map((area, index) => (
              <li key={index}>{area}</li>
            ))
          ) : (
            <li>No areas for improvement listed.</li>
          )}
        </ul>
      </div>

      <div className="buttons">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <form
          action={async () => {
            'use server';
            await handleRetakeInterview(id, user.id);
          }}
        >
          <Button type="submit" className="btn-primary flex-1">
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Button>
        </form>
      </div>
    </section>
  );
};

export default page;