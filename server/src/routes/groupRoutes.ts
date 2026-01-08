import express from 'express';
import {
  createGroup,
  getMyGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  postMessage,
  getGroupMessages,
  removeMember,
  updateMemberRole,
  deleteGroup,
  deleteGroupMessage,
} from '../controllers/groupController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de grupo
router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.delete('/:id', deleteGroup);

// Rotas de mensagens
router.post('/:id/messages', postMessage);
router.get('/:id/messages', getGroupMessages);
router.delete('/:id/messages/:messageId', deleteGroupMessage);

// Rotas de membros
router.delete('/:id/members/:memberId', removeMember);
router.put('/:id/members/:memberId/role', updateMemberRole);

export default router;
