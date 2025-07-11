"use client";

import { cn } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sdk';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { interviewer } from '@/constants';
import { createFeedback } from '@/lib/actions/general.action';

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

interface SavedMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

interface AgentProps {
  userName: string;
  userId: string;
  type: string;
}

const Agent = ({ userName, userId, type, interviewId, questions }: AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [interviewDetails, setInterviewDetails] = useState<{
    type?: string;
    role?: string;
    level?: string;
    techstack?: string;
    amount?: number;
  }>({});

  useEffect(() => {
    const onCallStart = () => {
      console.log('Call started');
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log('Call ended, setting status to FINISHED');
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: any) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
        // Check if the message contains interview details
        try {
          const parsed = JSON.parse(message.transcript);
          if (parsed.type && parsed.role && parsed.level && parsed.techstack && parsed.amount) {
            setInterviewDetails(parsed);
          }
        } catch (e) {
          // Not a JSON message, ignore
        }
      }
      if (message.type === 'interview-generated') {
        console.log('Interview details received:', message.data);
        setInterviewDetails(message.data);
        saveInterview(message.data);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => console.error('VAPI Error:', error);

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('error', onError);

    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
    };
  }, []);

  const handleGenerateFeedback=async(messages:SavedMessage[])=>{
    console.log('Generate feedback here.');

    const {success,feedbackId:id}=await createFeedback({
      interviewId:interviewId!,
      userId:userId!,
      transcript:messages
    })
    
    if(success && id){
      router.push(`/interview/${interviewId}/feedback`);
    } else{
      console.log('Error saving feedback');
      router.push('/');
    }
  }

  useEffect(() => {
    if(callStatus === CallStatus.FINISHED){
      if(type==='generate'){
        router.push('/');
      } else{
        handleGenerateFeedback(messages);
      }
    }
  }, [callStatus, router]);

  const saveInterview = async (details: any) => {
    try {
      const response = await fetch('/api/vapi/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: details.type || type,
          role: details.role,
          level: details.level,
          techstack: details.techstack,
          amount: details.amount,
          userid: userId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save interview');
      }
      console.log('Interview saved successfully:', result);
    } catch (error) {
      console.error('Error saving interview:', error);
    }
  };

  const handleCall = async () => {
    console.log('VAPI Workflow ID:', process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID);
    setCallStatus(CallStatus.CONNECTING);
    if(type==='generate'){
    try {
      const response = await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
          sessionId: Date.now().toString(), // Ensure unique session
        },
      });
      console.log('VAPI start response:', response);
    } catch (error) {
      console.error('Error starting VAPI call:', error);
      setCallStatus(CallStatus.INACTIVE);
    }
  } else{
    let formattedQuestions='';
    if(questions){
      formattedQuestions=questions.map((question)=>`- ${question}`).join('\n');
    }

    await vapi.start(interviewer,{
      variableValues:{
        questions:formattedQuestions
      }
    })
  }
} 

  const handleDisconnect = async () => {
    if (callStatus === CallStatus.ACTIVE) {
      console.log('Disconnecting call, saving interview...');
      setCallStatus(CallStatus.FINISHED);
      await vapi.stop();
      // Save interview if details were collected
      if (interviewDetails.role && interviewDetails.level && interviewDetails.techstack && interviewDetails.amount) {
        await saveInterview(interviewDetails);
      } else {
        console.warn('No interview details collected, skipping save');
      }
    }
  };

  const latestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak"></span>}
          </div>
          <h3>AI Interviewer</h3>
        </div>
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="user-avatar"
              width={540}
              height={540}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={latestMessage}
              className={cn('transition-opacity duration-500 opacity-0', 'animate-fading opacity-100')}
            >
              {latestMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== 'ACTIVE' ? (
          <button className="relative btn-call" onClick={handleCall}>
            <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== 'CONNECTING' && 'hidden')} />
            <span>{isCallInactiveOrFinished ? 'Call' : '. . .'}</span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;