import prisma from '../config/database';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}

/**
 * Bildirim oluşturur
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type
}: CreateNotificationParams) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
    
    return notification;
  } catch (error) {
    console.error('Notification creation error:', error);
    throw error;
  }
};

/**
 * Classroom davet bildirimi oluşturur
 */
export const notifyClassroomInvite = async (
  studentId: string,
  teacherName: string,
  classroomName: string
) => {
  return createNotification({
    userId: studentId,
    title: 'Yeni Classroom Daveti',
    message: `${teacherName} sizi "${classroomName}" classroom'una davet etti.`,
    type: 'CLASSROOM_INVITE_RECEIVED'
  });
};

/**
 * Classroom katılım isteği bildirimi oluşturur
 */
export const notifyJoinRequest = async (
  teacherId: string,
  studentName: string,
  classroomName: string
) => {
  return createNotification({
    userId: teacherId,
    title: 'Yeni Katılım İsteği',
    message: `${studentName} "${classroomName}" classroom'una katılmak istiyor.`,
    type: 'CLASSROOM_JOIN_REQUEST'
  });
};

/**
 * Davet kabul/red bildirimi oluşturur
 */
export const notifyInvitationResponse = async (
  teacherId: string,
  studentName: string,
  classroomName: string,
  accepted: boolean
) => {
  return createNotification({
    userId: teacherId,
    title: accepted ? 'Davet Kabul Edildi' : 'Davet Reddedildi',
    message: `${studentName} "${classroomName}" classroom'una davetinizi ${accepted ? 'kabul etti' : 'reddetti'}.`,
    type: accepted ? 'CLASSROOM_INVITE_ACCEPTED' : 'CLASSROOM_INVITE_REJECTED'
  });
};

/**
 * Katılım isteği onay/red bildirimi oluşturur
 */
export const notifyJoinResponse = async (
  studentId: string,
  classroomName: string,
  approved: boolean
) => {
  return createNotification({
    userId: studentId,
    title: approved ? 'Katılım Onaylandı' : 'Katılım Reddedildi',
    message: `"${classroomName}" classroom'una katılım isteğiniz ${approved ? 'onaylandı' : 'reddedildi'}.`,
    type: approved ? 'CLASSROOM_JOIN_APPROVED' : 'CLASSROOM_JOIN_REJECTED'
  });
};

/**
 * Classroom'dan çıkarılma bildirimi
 */
export const notifyMemberRemoved = async (
  studentId: string,
  classroomName: string
) => {
  return createNotification({
    userId: studentId,
    title: 'Classroom\'dan Çıkarıldınız',
    message: `"${classroomName}" classroom'undan çıkarıldınız.`,
    type: 'CLASSROOM_MEMBER_REMOVED'
  });
};











