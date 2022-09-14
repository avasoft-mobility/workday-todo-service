interface HiveTodo {
  user_id: string;
  work_item: string;
  estimated_hours: number;
  actual_hours: number;
  due_date: string;
  status: string;
  tags: string[];
}

export default HiveTodo;
