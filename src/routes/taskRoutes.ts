import { Router } from 'express';
import {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask
} from '../controllers/taskController';

const router = Router();

router.get('/', listTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
