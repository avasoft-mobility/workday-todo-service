import Tag from "./tag.model";
import Todo from "./todo.model";

interface TagAnalysis {
  tag: Tag;
  totalTodos: number;
  totalAta: number;
  totalEta: number;
  todos: Todo[];
}

export default TagAnalysis;
