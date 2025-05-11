// Types and interfaces for the Kanban component
export interface Candidate {
  id: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number | null;
  applicationId: number;
}

export interface InterviewStep {
  id: number;
  name: string;
  orderIndex: number;
}

export interface InterviewFlow {
  positionName: string;
  interviewFlow: {
    id: number;
    description: string;
    interviewSteps: InterviewStep[];
  };
}

export interface DraggedCandidate {
  id: number;
  applicationId: number;
}

export interface CandidateCardProps {
  candidate: Candidate;
  onDragStart: (e: React.DragEvent<HTMLElement>, candidateId: number, applicationId: number) => void;
  onViewDetails: (candidateId: number, applicationId: number) => void;
} 