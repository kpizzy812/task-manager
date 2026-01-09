import { type TaskStatus, type TaskPriority } from "@/lib/validations/task";

export type TaskAssignee = {
  id: string;
  name: string;
  avatar: string | null;
};

export type TaskCreator = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: Date | null;
  order: number;
  assignee: TaskAssignee | null;
  creator: TaskCreator;
};

export type ProjectMember = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};
