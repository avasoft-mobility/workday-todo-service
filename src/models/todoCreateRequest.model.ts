interface TodoCreateRequest {
  title: string;
  comments: string;
  type: string;
  status: string;
  eta: number;
  tags: string[];
  recurringDates: string[];
}

export default TodoCreateRequest;
