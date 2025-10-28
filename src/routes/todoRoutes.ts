import { Router } from 'express';
import { listTodos, createTodo, deleteTodo, updateTodo } from '../controllers/todoController';

const router = Router();

router.get('/', listTodos);
router.post('/', createTodo);
router.put('/:id', updateTodo);
router.delete('/:id', deleteTodo);

export default router;
