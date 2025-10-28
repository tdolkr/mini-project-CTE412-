import { Router } from 'express';
import {
  listHabits,
  createHabit,
  deleteHabit,
  markHabit,
  clearHabit,
  updateHabit
} from '../controllers/habitController';

const router = Router();

router.get('/', listHabits);
router.post('/', createHabit);
router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/checkins', markHabit);
router.delete('/:id/checkins/:date', clearHabit);

export default router;
