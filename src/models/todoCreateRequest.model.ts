interface TodoCreateRequest {
  title: string;
  comments: string;
  type: string;
  status: string;
  eta: number;
  ata: number;
  tags: string[];
  recurringDates: string[];
}

export default TodoCreateRequest;
