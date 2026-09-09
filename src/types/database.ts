export type RockStatus = 'on-track' | 'off-track' | 'done'
export type TaskFrequency = 'daily' | 'weekly' | 'monthly'
export type TeamTaskStatus = 'todo' | 'in-progress' | 'done'
export type GoalStatus = 'not-started' | 'in-progress' | 'on-track' | 'done'

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

export interface AnnualGoal {
  id: string
  title: string
  description: string | null
  status: GoalStatus
  year: number
  owner_id: string | null
  created_by: string
  created_at: string
  owner?: Profile | null
  creator?: Profile
}

export type MetricKey = 'students' | 'schools' | 'dollars_raised'

export interface ScorecardMetric {
  id: string
  year: number
  metric_key: MetricKey
  target: number | null
  actual: number | null
  updated_by: string | null
  updated_at: string
}

export interface Decision {
  id: string
  title: string
  context: string | null
  decided_by: string | null
  decided_at: string
  created_by: string
  created_at: string
  decider?: Profile | null
}

export interface MeetingTopic {
  id: string
  text: string
  added_by: string | null
  done: boolean
  sort_order: number
  created_at: string
  adder?: Profile | null
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
      annual_goals: {
        Row: AnnualGoal
        Insert: Omit<AnnualGoal, 'id' | 'created_at' | 'owner' | 'creator'>
        Update: Partial<Omit<AnnualGoal, 'id' | 'created_at' | 'owner' | 'creator'>>
      }
    }
  }
}
