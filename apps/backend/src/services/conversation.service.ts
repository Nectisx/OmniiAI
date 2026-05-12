/**
 * Service de gestion des conversations et messages
 */
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import type { Conversation, Message } from '@omniai/types';

export class ConversationService {

  /** Liste les conversations d'un utilisateur (paginated) */
  async list(userId: number, page = 1, limit = 20): Promise<{
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { contenu: true },
          },
        },
      }),
      prisma.conversation.count({ where: { userId } }),
    ]);

    return {
      conversations: conversations.map(c => ({
        id: c.id,
        userId: c.userId,
        titre: c.titre,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.contenu?.slice(0, 100),
      })),
      total,
      hasMore: skip + limit < total,
    };
  }

  /** Récupère une conversation avec tous ses messages (RG09) */
  async getWithMessages(userId: number, conversationId: number): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new AppError('Conversation introuvable', 404);
    }

    return {
      conversation: {
        id: conversation.id,
        userId: conversation.userId,
        titre: conversation.titre,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      },
      messages: conversation.messages.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role as Message['role'],
        contenu: m.contenu,
        modeleUtilise: m.modeleUtilise,
        fichierJoint: m.fichierJoint,
        tokensConsommes: m.tokensConsommes,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /** Crée une nouvelle conversation */
  async create(userId: number, titre: string): Promise<Conversation> {
    const conv = await prisma.conversation.create({
      data: { userId, titre: titre.slice(0, 255) },
    });

    return {
      id: conv.id,
      userId: conv.userId,
      titre: conv.titre,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    };
  }

  /** Renomme une conversation */
  async rename(userId: number, conversationId: number, titre: string): Promise<void> {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conv) throw new AppError('Conversation introuvable', 404);

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { titre: titre.slice(0, 255) },
    });
  }

  /** Supprime une conversation et tous ses messages */
  async delete(userId: number, conversationId: number): Promise<void> {
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conv) throw new AppError('Conversation introuvable', 404);

    await prisma.conversation.delete({ where: { id: conversationId } });
  }

  /** Ajoute un message à une conversation */
  async addMessage(
    conversationId: number,
    role: 'user' | 'assistant' | 'system',
    contenu: string,
    modeleUtilise?: string,
    tokensConsommes = 0,
    fichierJoint?: string,
  ): Promise<Message> {
    const msg = await prisma.message.create({
      data: {
        conversationId,
        role,
        contenu,
        modeleUtilise,
        tokensConsommes,
        fichierJoint,
      },
    });

    // Mettre à jour le updatedAt de la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role as Message['role'],
      contenu: msg.contenu,
      modeleUtilise: msg.modeleUtilise,
      fichierJoint: msg.fichierJoint,
      tokensConsommes: msg.tokensConsommes,
      createdAt: msg.createdAt.toISOString(),
    };
  }

  /** Récupère l'historique des messages pour le contexte LLM */
  async getContext(conversationId: number, limit = 20): Promise<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>> {
    const messages = await prisma.message.findMany({
      where: { conversationId, role: { in: ['user', 'assistant'] } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, contenu: true },
    });

    // Inverser pour avoir l'ordre chronologique
    return messages.reverse().map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.contenu,
    }));
  }
}

export const conversationService = new ConversationService();
