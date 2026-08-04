export interface FeedReaction {
  emoji: string;
  users: string[];
}

export interface FeedComment {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  edited?: boolean;
  editedTime?: string;
  reactions?: FeedReaction[];
  replies?: FeedComment[];
  attachment?: { name: string; type: "image" | "file"; size: string };
  collapsed?: boolean;
}

export interface FeedPost {
  id: string;
  author: string;
  initials: string;
  color: string;
  time: string;
  text: string;
  dept: string;
  designation: string;
  pinned: boolean;
  saved?: boolean;
  priority?: "High" | "Medium" | "Low";
  resolved?: boolean;
  edited?: boolean;
  editedTime?: string;
  reactions: FeedReaction[];
  comments: FeedComment[];
  followers?: string[];
  attachments?: { name: string; type: "image" | "file"; size: string }[];
}
