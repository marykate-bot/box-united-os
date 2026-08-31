export type RockStatus = 'on-track' | 'off-track' | 'done'
export type TaskFrequency = 'daily' | 'weekly' | 'monthly'
export type TeamTaskStatus = 'todo' | 'in-progress' | 'done'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  created_at: string
}

export interface Rock {
  id: string
  user_id: string
  title: string
  description: string | null
  status: RockStatus
  quarter: string
  due_date: string | null
  created_at: string
  profiles?: Profile
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  frequency: TaskFrequency
  completed: boolean
  due_date: string | null
  created_at: string
}

export interface TeamTask {
  id: string
  created_by: string
  assigned_to: string | null
  title: string
  description: string | null
  status: TeamTaskStatus
  due_date: string | null
  created_at: string
  creator?: Profile
  assignee?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      rocks: {
        Row: Rock
        Insert: Omit<Rock, 'id' | 'created_at'>
        Update: Partial<Omit<Rock, 'id' | 'created_at'>>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, 'id' | 'created_at'>
        Update: Partial<Omit<Task, 'id' | 'created_at'>>
      }
      team_tasks: {
        Row: TeamTask
        Insert: Omit<TeamTask, 'id' | 'created_at'>
        Update: Partial<Omit<TeamTask, 'id' | 'created_at'>>
      }
    }
  }
}
