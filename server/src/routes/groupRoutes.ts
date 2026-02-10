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
  updateGroup,
  deleteGroupMessage,
  inviteMember,
  respondInvite,
  getMyInvites,
  updateNickname,
  toggleMute,
  updateGroupBackground,
  postImageMessage,
  setTyping,
  getTypingUsers,
  markMessagesRead,
  getMessageReaders,
  addReaction,
  getMessageReactions,
} from '../controllers/groupController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas de grupo
router.post('/', createGroup);
router.get('/', getMyGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.delete('/:id', deleteGroup);
router.put('/:groupId/background', updateGroupBackground);

// Rotas de convites
router.post('/:groupId/invite', inviteMember);
router.post('/invites/:inviteId/respond', respondInvite);
router.get('/invites/me', getMyInvites);

// Rotas de membros
router.delete('/:id/members/:memberId', removeMember);
router.put('/:id/members/:memberId/role', updateMemberRole);
router.put('/:groupId/nickname', updateNickname);
router.post('/:groupId/mute', toggleMute);

// Rotas de mensagens
router.post('/:id/messages', moderateTextContent(['content']), postMessage);
router.post('/:groupId/messages/image', postImageMessage);
router.get('/:id/messages', getGroupMessages);
router.delete('/:id/messages/:messageId', deleteGroupMessage);

// Rotas de typing e read receipts
router.post('/:groupId/typing', setTyping);
router.get('/:groupId/typing', getTypingUsers);
router.post('/:groupId/read', markMessagesRead);
router.get('/:groupId/messages/:messageId/readers', getMessageReaders);

// Rotas de reações
router.post('/:id/messages/:messageId/reactions', addReaction);
router.get('/:id/messages/:messageId/reactions', getMessageReactions);

export default router;
