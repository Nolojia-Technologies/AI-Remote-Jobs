export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          career_path_id: string | null;
          goal: string | null;
          xp: number;
          level: number;
          streak_days: number;
          streak_last_date: string | null;
          country: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          career_path_id?: string | null;
          goal?: string | null;
          xp?: number;
          level?: number;
          streak_days?: number;
          streak_last_date?: string | null;
          country?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          career_path_id?: string | null;
          goal?: string | null;
          xp?: number;
          level?: number;
          streak_days?: number;
          streak_last_date?: string | null;
          country?: string | null;
          updated_at?: string;
        };
      };
      career_paths: {
        Row: {
          id: string;
          title: string;
          description: string;
          icon: string;
          color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          icon: string;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          icon?: string;
          color?: string;
          is_active?: boolean;
        };
      };
      modules: {
        Row: {
          id: string;
          career_path_id: string;
          title: string;
          description: string;
          level: "beginner" | "intermediate" | "advanced";
          order_index: number;
          xp_reward: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          career_path_id: string;
          title: string;
          description: string;
          level: "beginner" | "intermediate" | "advanced";
          order_index?: number;
          xp_reward?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          level?: "beginner" | "intermediate" | "advanced";
          order_index?: number;
          xp_reward?: number;
          is_active?: boolean;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          content: string;
          video_url: string | null;
          duration_minutes: number;
          order_index: number;
          xp_reward: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          content: string;
          video_url?: string | null;
          duration_minutes?: number;
          order_index?: number;
          xp_reward?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          video_url?: string | null;
          duration_minutes?: number;
          order_index?: number;
          xp_reward?: number;
          is_active?: boolean;
        };
      };
      user_lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      quizzes: {
        Row: {
          id: string;
          lesson_id: string | null;
          module_id: string | null;
          title: string;
          description: string;
          pass_score: number;
          xp_reward: number;
          time_limit_seconds: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id?: string | null;
          module_id?: string | null;
          title: string;
          description: string;
          pass_score?: number;
          xp_reward?: number;
          time_limit_seconds?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          pass_score?: number;
          xp_reward?: number;
          time_limit_seconds?: number | null;
          is_active?: boolean;
        };
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          question_type: "multiple_choice" | "true_false" | "scenario";
          options: Json;
          correct_answer: string;
          explanation: string | null;
          order_index: number;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          question_type: "multiple_choice" | "true_false" | "scenario";
          options: Json;
          correct_answer: string;
          explanation?: string | null;
          order_index?: number;
        };
        Update: {
          question?: string;
          question_type?: "multiple_choice" | "true_false" | "scenario";
          options?: Json;
          correct_answer?: string;
          explanation?: string | null;
          order_index?: number;
        };
      };
      user_quiz_results: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          score: number;
          passed: boolean;
          answers: Json;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          score: number;
          passed: boolean;
          answers: Json;
          completed_at?: string;
        };
        Update: {
          score?: number;
          passed?: boolean;
          answers?: Json;
        };
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          instructions: string;
          category: string;
          difficulty: "easy" | "medium" | "hard";
          xp_reward: number;
          expires_at: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          instructions: string;
          category: string;
          difficulty: "easy" | "medium" | "hard";
          xp_reward?: number;
          expires_at: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          instructions?: string;
          category?: string;
          difficulty?: "easy" | "medium" | "hard";
          xp_reward?: number;
          expires_at?: string;
          is_active?: boolean;
        };
      };
      challenge_submissions: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          submission_text: string;
          score: number | null;
          feedback: string | null;
          status: "pending" | "reviewed" | "passed" | "failed";
          xp_awarded: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          submission_text: string;
          score?: number | null;
          feedback?: string | null;
          status?: "pending" | "reviewed" | "passed" | "failed";
          xp_awarded?: number;
          submitted_at?: string;
        };
        Update: {
          score?: number | null;
          feedback?: string | null;
          status?: "pending" | "reviewed" | "passed" | "failed";
          xp_awarded?: number;
        };
      };
      achievements: {
        Row: {
          id: string;
          title: string;
          description: string;
          icon: string;
          badge_color: string;
          xp_reward: number;
          requirement_type: string;
          requirement_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          icon?: string;
          badge_color?: string;
          xp_reward?: number;
          requirement_type: string;
          requirement_value: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          icon?: string;
          badge_color?: string;
          xp_reward?: number;
          requirement_type?: string;
          requirement_value?: number;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
        };
        Update: {
          earned_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          career_path_id: string;
          certificate_id: string;
          issued_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          career_path_id: string;
          certificate_id: string;
          issued_at?: string;
        };
        Update: {
          certificate_id?: string;
        };
      };
      opportunities: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: "practice_project" | "ai_simulation" | "skill_challenge" | "mock_freelance" | "remote_job";
          required_xp: number;
          required_level: number;
          required_quiz_id: string | null;
          required_course_id: string | null;
          is_locked: boolean;
          company: string | null;
          location: string | null;
          payout: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: "practice_project" | "ai_simulation" | "skill_challenge" | "mock_freelance" | "remote_job";
          required_xp?: number;
          required_level?: number;
          required_quiz_id?: string | null;
          required_course_id?: string | null;
          is_locked?: boolean;
          company?: string | null;
          location?: string | null;
          payout?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          category?: "practice_project" | "ai_simulation" | "skill_challenge" | "mock_freelance" | "remote_job";
          required_xp?: number;
          required_level?: number;
          is_locked?: boolean;
          company?: string | null;
          location?: string | null;
          payout?: string | null;
        };
      };
      xp_logs: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          source: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          source: string;
          description: string;
          created_at?: string;
        };
        Update: {
          amount?: number;
          source?: string;
          description?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          is_read: boolean;
          data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          type: string;
          is_read?: boolean;
          data?: Json | null;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
          data?: Json | null;
        };
      };
    };
    Views: {
      leaderboard_global: {
        Row: {
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          xp: number;
          level: number;
          rank: number;
          country: string | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
