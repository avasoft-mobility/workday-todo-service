import Tag from "./tag.model";

interface Todo {
  _id: string;
  microsoftUserId: string;
  title: string;
  comments?: string;
  status: string;
  type: string;
  eta: number;
  ata: number;
  date: Date;
  tags?: Tag[];
  __v: number;
}

export default Todo;
