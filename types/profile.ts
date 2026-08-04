export interface ProfileMoodEntry {
  mood: string;
  timestamp: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarColor: string;
  createdAt: string;
  moodHistory: ProfileMoodEntry[];
}
