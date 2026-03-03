import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogData {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit log oluştur - Denetim kaydı ekle
 */
export const createAuditLog = async (data: AuditLogData) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action as any,
        entityType: data.entityType as any,
        entityId: data.entityId,
        entityName: data.entityName,
        details: data.details || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    // Audit log hatası ana işlemi etkilememeli
    console.error('Audit log creation failed:', error);
  }
};

/**
 * Request'ten IP adresi al
 */
export const getIpAddress = (req: any): string | undefined => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress
  );
};

/**
 * Request'ten User Agent al
 */
export const getUserAgent = (req: any): string | undefined => {
  return req.headers['user-agent'];
};



