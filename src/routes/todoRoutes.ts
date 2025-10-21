import { Router } from 'express';
import { listTodos, createTodo, deleteTodo } from '../controllers/todoController';

const router = Router();

router.get('/', listTodos);
router.post('/', createTodo);
router.delete('/:id', deleteTodo);

export default router;
