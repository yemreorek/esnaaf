import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { 
  UserQueryDto, 
  BanUserDto, 
  RejectProviderDto, 
  CreateStaffDto, 
  ResolveDisputeDto, 
  CallTaskResultDto, 
  DisputeDecision, 
  CallTaskResult,
  SaveAbTestConfigDto
} from './dto/admin-users.dto';
import { decryptPhone, encryptPhone, maskPhone } from '../common/utils/phone.util';
import { 
  UserRole, 
  StaffRole, 
  JobCompletionStatus, 
  DisputeStatus, 
  PriorityLevel, 
  CallTaskStatus, 
  CallTaskResult as DbCallTaskResult 
} from '@prisma/client';
import { PERMISSION_MATRIX } from './permissions';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * Helper method to verify staff role permissions on a module
   */
  async checkPermission(email: string, module: string, action: 'read' | 'write') {
    const staff = await this.prisma.staff.findUnique({
      where: { email, is_active: true },
    });

    if (!staff) {
      throw new ForbiddenException('Aktif personel kaydı bulunamadı.');
    }

    if (staff.role === StaffRole.super_admin) {
      return staff;
    }

    const rolePermissions = PERMISSION_MATRIX[staff.role];
    if (!rolePermissions) {
      throw new ForbiddenException('Bu rol için tanımlanmış yetki bulunamadı.');
    }

    const perm = rolePermissions[module];
    if (!perm || perm === 'none') {
      throw new ForbiddenException(`Bu modüle (${module}) erişim yetkiniz bulunmamaktadır.`);
    }

    if (action === 'write' && perm !== 'full') {
      throw new ForbiddenException(`Bu modülde (${module}) değişiklik yapma yetkiniz bulunmamaktadır.`);
    }

    return staff;
  }

  /**
   * Helper method to write database audit logs
   */
  async logAudit(staffId: string, action: string, targetType: string, targetId: string, oldValue?: any, newValue?: any, ipAddress?: string) {
    await this.prisma.auditLog.create({
      data: {
        staff_id: staffId,
        action,
        target_type: targetType,
        target_id: targetId,
        old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        ip_address: ipAddress || '0.0.0.0',
      },
    });
  }

  async getDashboardStats(adminEmail?: string) {
    // If admin email is provided, verify read permission on dashboard
    if (adminEmail) {
      await this.checkPermission(adminEmail, 'dashboard', 'read');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayNewRequests, todayNewUsers, todayOpenComplaints, pendingProviders, pendingComments, paymentsSuccess, paymentsFailed] = await Promise.all([
      this.prisma.serviceRequest.count({
        where: { created_at: { gte: today } },
      }),
      this.prisma.user.count({
        where: { created_at: { gte: today } },
      }),
      this.prisma.jobCompletion.count({
        where: { dispute_status: 'open' },
      }),
      this.prisma.serviceProvider.count({
        where: { is_approved: false },
      }),
      this.prisma.review.count({
        where: { status: 'pending' },
      }),
      this.prisma.payment.count({
        where: { status: 'success', created_at: { gte: today } },
      }),
      this.prisma.payment.count({
        where: { status: 'failed', created_at: { gte: today } },
      }),
    ]);

    return {
      todayNewRequests,
      todayNewUsers,
      todayOpenComplaints,
      pendingProviders,
      pendingComments,
      pendingDisputes: todayOpenComplaints,
      kvkkRequests: 0, // Phase 2 feature mock
      payments24h: {
        success: paymentsSuccess,
        failed: paymentsFailed,
        pending: 0,
      },
    };
  }

  async getUsers(query: UserQueryDto, adminEmail?: string) {
    if (adminEmail) {
      await this.checkPermission(adminEmail, 'users', 'read');
    }

    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      if (status === 'active') {
        where.is_active = true;
      } else if (status === 'inactive' || status === 'ban') {
        where.is_active = false;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Decrypt phone numbers for admin overview
    const mappedUsers = users.map((user) => ({
      ...user,
      phone_decrypted: decryptPhone(user.phone),
    }));

    return {
      data: mappedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserDetail(userId: string, adminEmail?: string) {
    if (adminEmail) {
      await this.checkPermission(adminEmail, 'users', 'read');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        service_provider: true,
      },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    let stats: any = {};
    if (user.role === UserRole.service_seeker) {
      const totalRequests = await this.prisma.serviceRequest.count({
        where: { seeker_id: userId },
      });
      stats = { totalRequests };
    } else if (user.role === UserRole.service_provider && user.service_provider) {
      const providerId = user.service_provider.id;
      const [totalOffers, totalWonJobs] = await Promise.all([
        this.prisma.offer.count({
          where: { provider_id: providerId },
        }),
        this.prisma.acceptedOffer.count({
          where: { provider_id: providerId },
        }),
      ]);
      stats = {
        totalOffers,
        totalWonJobs,
      };
    }

    return {
      ...user,
      phone_decrypted: decryptPhone(user.phone),
      stats,
    };
  }

  async banUser(userId: string, dto: BanUserDto, adminEmail?: string) {
    let staffId = '00000000-0000-0000-0000-000000000000'; // Default E2E system fallback
    if (adminEmail) {
      const staff = await this.checkPermission(adminEmail, 'users', 'write');
      staffId = staff.id;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const oldState = { is_active: user.is_active };
    const newState = { is_active: false };

    await this.prisma.user.update({
      where: { id: userId },
      data: { is_active: false },
    });

    console.log(`[BAN LOG] User ${userId} has been banned. Reason: ${dto.reason}. Notes: ${dto.notes || 'N/A'}`);

    // Record Audit Log
    await this.logAudit(staffId, 'user.ban', 'user', userId, oldState, newState);

    return {
      success: true,
      message: 'Kullanıcı başarıyla banlandı.',
      bannedUser: {
        id: user.id,
        name: user.name,
        reason: dto.reason,
      },
    };
  }

  async toggleUserActive(userId: string, adminEmail?: string) {
    let staffId = '00000000-0000-0000-0000-000000000000';
    if (adminEmail) {
      const staff = await this.checkPermission(adminEmail, 'users', 'write');
      staffId = staff.id;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { is_active: !user.is_active },
    });

    await this.logAudit(
      staffId,
      'user.toggle_active',
      'user',
      userId,
      { is_active: user.is_active },
      { is_active: updatedUser.is_active }
    );

    return {
      success: true,
      message: `Kullanıcı ${updatedUser.is_active ? 'aktif' : 'pasif'} duruma getirildi.`,
      isActive: updatedUser.is_active,
    };
  }

  async kvkkForceDelete(userId: string, adminEmail?: string) {
    let staffId = '00000000-0000-0000-0000-000000000000';
    if (adminEmail) {
      const staff = await this.checkPermission(adminEmail, 'kvkk', 'write');
      staffId = staff.id;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const oldState = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_active: user.is_active,
    };

    const anonymizedPhone = 'deleted_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Eski Kullanıcı',
        phone: anonymizedPhone,
        phone_masked: '0000 *** ** 00',
        email: null,
        is_active: false,
        deleted_at: new Date(),
      },
    });

    console.log(`[KVKK LOG] User ${userId} has been force-deleted for KVKK compliance.`);

    await this.logAudit(
      staffId,
      'user.kvkk_force_delete',
      'user',
      userId,
      oldState,
      { name: 'Eski Kullanıcı', email: null, is_active: false }
    );

    return {
      success: true,
      message: 'Kullanıcı kişisel verileri KVKK gereğince tamamen silindi.',
    };
  }

  async getApprovalQueue(adminEmail?: string) {
    if (adminEmail) {
      await this.checkPermission(adminEmail, 'providers', 'read');
    }

    const providers = await this.prisma.serviceProvider.findMany({
      where: { is_approved: false },
      include: {
        user: true,
      },
      orderBy: { user: { created_at: 'asc' } },
    });

    return providers.map((provider) => ({
      ...provider,
      user: {
        ...provider.user,
        phone_decrypted: decryptPhone(provider.user.phone),
      },
    }));
  }

  async approveProvider(providerId: string, adminEmail?: string) {
    let staffId = '00000000-0000-0000-0000-000000000000';
    if (adminEmail) {
      const staff = await this.checkPermission(adminEmail, 'providers', 'write');
      staffId = staff.id;
    }

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren bulunamadı.');
    }

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        is_approved: true,
        approved_at: new Date(),
      },
    });

    console.log(`[HV-14 Notification] Provider approved: ${provider.user.name || 'N/A'} (Phone: ${decryptPhone(provider.user.phone)})`);

    await this.logAudit(
      staffId,
      'provider.approve',
      'provider',
      providerId,
      { is_approved: false },
      { is_approved: true }
    );

    return {
      success: true,
      message: 'Hizmet veren başarıyla onaylandı.',
    };
  }

  async rejectProvider(providerId: string, dto: RejectProviderDto, adminEmail?: string) {
    let staffId = '00000000-0000-0000-0000-000000000000';
    if (adminEmail) {
      const staff = await this.checkPermission(adminEmail, 'providers', 'write');
      staffId = staff.id;
    }

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { user: true },
    });

    if (!provider) {
      throw new NotFoundException('Hizmet veren bulunamadı.');
    }

    console.log(`[HV-15 Notification] Provider rejected: ${provider.user.name || 'N/A'} (Reason: ${dto.reasonCode}). Notes: ${dto.notes || 'N/A'}`);

    await this.logAudit(
      staffId,
      'provider.reject',
      'provider',
      providerId,
      null,
      { reason_code: dto.reasonCode, notes: dto.notes }
    );

    return {
      success: true,
      message: `Hizmet veren başvurusu reddedildi (Gerekçe: ${dto.reasonCode}).`,
    };
  }

  /**
   * Retrieves all disputed job completions (disputes queue)
   */
  async getDisputes(adminEmail: string) {
    await this.checkPermission(adminEmail, 'disputes', 'read');

    return this.prisma.jobCompletion.findMany({
      where: {
        status: JobCompletionStatus.disputed,
      },
      include: {
        job: {
          include: {
            category: true,
            seeker: true,
          },
        },
        provider: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Resolves a dispute with staff decision
   */
  async resolveDispute(adminEmail: string, disputeId: string, dto: ResolveDisputeDto) {
    const staff = await this.checkPermission(adminEmail, 'disputes', 'write');

    const completion = await this.prisma.jobCompletion.findUnique({
      where: { id: disputeId },
    });

    if (!completion) {
      throw new NotFoundException('Uyuşmazlık kaydı bulunamadı.');
    }

    const updateData: any = {
      dispute_status: DisputeStatus.resolved,
      status: JobCompletionStatus.completed,
      resolved_by: staff.id,
      resolved_at: new Date(),
      resolution_note: `${dto.decision.toUpperCase()}: ${dto.resolutionNote}`,
    };

    if (dto.decision === DisputeDecision.mutual_agreement && dto.resolvedAmount) {
      updateData.seeker_declared_amount = dto.resolvedAmount;
      updateData.provider_declared_amount = dto.resolvedAmount;
    }

    const updated = await this.prisma.jobCompletion.update({
      where: { id: disputeId },
      data: updateData,
    });

    // Record Audit log
    await this.logAudit(
      staff.id,
      'dispute.resolve',
      'job_completion',
      disputeId,
      { status: completion.status, dispute_status: completion.dispute_status },
      { status: updated.status, dispute_status: updated.dispute_status, decision: dto.decision }
    );

    return {
      success: true,
      message: 'Uyuşmazlık çözümlendi ve iş kapatıldı.',
      data: updated,
    };
  }

  /**
   * Lists all staff members
   */
  async getStaffList(adminEmail: string) {
    await this.checkPermission(adminEmail, 'staff', 'read');

    return this.prisma.staff.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Onboards a new staff member and creates their admin User record
   */
  async createStaff(adminEmail: string, dto: CreateStaffDto) {
    const adminStaff = await this.checkPermission(adminEmail, 'staff', 'write');

    const existingStaff = await this.prisma.staff.findUnique({
      where: { email: dto.email },
    });

    if (existingStaff) {
      throw new BadRequestException('Bu e-posta adresine kayıtlı bir personel zaten var.');
    }

    const phone = dto.phone || '+905990000000'; // Default fallback phone
    const encryptedPhone = encryptPhone(phone);

    // Create staff & User record atomically
    const newStaff = await this.prisma.$transaction(async (tx) => {
      // 1. Pre-create User with admin role so they can log in via OTP
      let user = await tx.user.findFirst({
        where: { email: dto.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            phone: encryptedPhone,
            phone_masked: maskPhone(phone),
            name: dto.name || 'Yeni Personel',
            email: dto.email,
            role: UserRole.admin,
            kvkk_consent: true,
          },
        });
      } else {
        // Update role to admin if user exists
        await tx.user.update({
          where: { id: user.id },
          data: { role: UserRole.admin },
        });
      }

      // 2. Create Staff member
      return tx.staff.create({
        data: {
          name: dto.name || 'Yeni Personel',
          email: dto.email,
          phone: phone,
          role: dto.role,
          is_active: true,
          created_by: adminStaff.id,
        },
      });
    });

    // Record Audit Log
    await this.logAudit(
      adminStaff.id,
      'staff.create',
      'staff',
      newStaff.id,
      null,
      { email: newStaff.email, role: newStaff.role }
    );

    return {
      success: true,
      message: 'Yeni personel başarıyla eklendi ve admin kullanıcısı oluşturuldu.',
      data: newStaff,
    };
  }

  /**
   * Quality Staff Call Tasks list in FIFO order
   */
  async getCallTasksFifo(adminEmail: string) {
    await this.checkPermission(adminEmail, 'reviews', 'read'); // quality staff review/satisfaction tasks

    const tasks = await this.prisma.callTask.findMany({
      where: {
        status: {
          in: [CallTaskStatus.pending, CallTaskStatus.in_progress],
        },
      },
      orderBy: { created_at: 'asc' },
    });

    if (tasks.length === 0) return [];

    // Batch fetch all related data to avoid N+1 queries
    const customerIds = [...new Set(tasks.map(t => t.customer_id))];
    const completionIds = [...new Set(tasks.map(t => t.job_completion_id))];

    const [seekers, completions] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: customerIds } },
      }),
      this.prisma.jobCompletion.findMany({
        where: { id: { in: completionIds } },
        include: {
          job: { include: { category: true } },
          provider: { include: { user: true } },
        },
      }),
    ]);

    const seekerMap = new Map(seekers.map(s => [s.id, s]));
    const completionMap = new Map(completions.map(c => [c.id, c]));

    return tasks.map(task => {
      const seeker = seekerMap.get(task.customer_id);
      const completion = completionMap.get(task.job_completion_id);

      return {
        ...task,
        seeker: seeker ? {
          name: seeker.name,
          phone_decrypted: decryptPhone(seeker.phone),
        } : null,
        provider: completion?.provider ? {
          name: completion.provider.user.name,
          phone_decrypted: decryptPhone(completion.provider.user.phone),
        } : null,
        job: completion?.job ? {
          categoryName: completion.job.category.name,
          details: (completion.job.form_data as any)?.details || '',
        } : null,
        declaredAmount: completion?.provider_declared_amount || 0,
      };
    });
  }

  /**
   * Process Quality Personnel Call Task Result (FIFO Dashboard submission)
   */
  async submitCallTaskResult(adminEmail: string, taskId: string, dto: CallTaskResultDto) {
    const staff = await this.checkPermission(adminEmail, 'reviews', 'write');

    const task = await this.prisma.callTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Arama görevi bulunamadı.');
    }

    let status: CallTaskStatus = CallTaskStatus.pending;
    let completedAt: Date | null = null;
    let attemptCount = task.attempt_count;
    let dueAt = task.due_at;

    const result = dto.result;

    if (result === CallTaskResult.satisfied) {
      status = CallTaskStatus.done;
      completedAt = new Date();
    } else if (result === CallTaskResult.partial || result === CallTaskResult.unsatisfied) {
      status = CallTaskStatus.escalated;
      completedAt = new Date();
    } else if (result === CallTaskResult.unreachable) {
      attemptCount += 1;
      if (attemptCount >= 3) {
        status = CallTaskStatus.done;
        completedAt = new Date();
      } else {
        // Reschedule 24h later
        status = CallTaskStatus.pending;
        dueAt = new Date();
        dueAt.setHours(dueAt.getHours() + 24);
      }
    }

    const updatedTask = await this.prisma.callTask.update({
      where: { id: taskId },
      data: {
        status,
        completed_at: completedAt,
        attempt_count: attemptCount,
        due_at: dueAt,
        call_result: result as DbCallTaskResult,
        notes: dto.notes,
        assigned_to: staff.id,
      },
    });

    // Record Audit Log
    await this.logAudit(
      staff.id,
      'call_task.submit_result',
      'call_task',
      taskId,
      { status: task.status, attempt_count: task.attempt_count },
      { status: updatedTask.status, attempt_count: updatedTask.attempt_count, result }
    );

    return {
      success: true,
      message: 'Arama görevi sonucu başarıyla kaydedildi.',
      data: updatedTask,
    };
  }

  // --- NPS, Role Dashboard & A/B Test Methods ---

  async getNpsStats(adminEmail: string) {
    await this.checkPermission(adminEmail, 'dashboard', 'read');

    const responses = await this.prisma.npsResponse.findMany({
      orderBy: { created_at: 'desc' },
    });

    const totalCount = responses.length;
    const promoterCount = responses.filter((r) => r.score >= 7).length;
    const passiveCount = responses.filter((r) => r.score >= 4 && r.score <= 6).length;
    const detractorCount = responses.filter((r) => r.score <= 3).length;

    const npsScore = totalCount > 0
      ? Math.round(((promoterCount - detractorCount) / totalCount) * 100)
      : 0;

    // Kategori bazlı ortalama hesaplama
    const categories = await this.prisma.category.findMany();
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const catResponses = responses.filter((r) => r.category_id === cat.id);
        const count = catResponses.length;
        const avgScore = count > 0
          ? Number((catResponses.reduce((sum, r) => sum + r.score, 0) / count).toFixed(2))
          : 0;
        
        const catPromoter = catResponses.filter((r) => r.score >= 7).length;
        const catDetractor = catResponses.filter((r) => r.score <= 3).length;
        const catNps = count > 0
          ? Math.round(((catPromoter - catDetractor) / count) * 100)
          : 0;

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          avgScore,
          npsScore: catNps,
          totalResponses: count,
        };
      })
    );

    // Son 30 günlük trend datası
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const trendResponses = responses
      .filter((r) => new Date(r.created_at) >= last30Days)
      .map((r) => ({
        score: r.score,
        created_at: r.created_at,
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      npsScore,
      totalCount,
      promoterCount,
      passiveCount,
      detractorCount,
      categoryStats,
      trend: trendResponses,
    };
  }

  async getNpsAlarms(adminEmail: string) {
    await this.checkPermission(adminEmail, 'reviews', 'read');

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Son 30 günde detraktör almış yanıtlar
    const detractorResponses = await this.prisma.npsResponse.findMany({
      where: {
        score: { lte: 3 },
        created_at: { gte: last30Days },
      },
      orderBy: { created_at: 'desc' },
    });

    // Hizmet Veren bazlı detraktör sayımı
    const providerDetractorMap = new Map<string, { count: number; responses: any[] }>();
    for (const resp of detractorResponses) {
      if (!providerDetractorMap.has(resp.provider_id)) {
        providerDetractorMap.set(resp.provider_id, { count: 0, responses: [] });
      }
      const data = providerDetractorMap.get(resp.provider_id)!;
      data.count += 1;
      data.responses.push(resp);
    }

    // 3 ve daha fazla detraktör alan usta ID'leri
    const alarmProviderIds: string[] = [];
    for (const [providerId, data] of providerDetractorMap.entries()) {
      if (data.count >= 3) {
        alarmProviderIds.push(providerId);
      }
    }

    if (alarmProviderIds.length === 0) {
      return [];
    }

    // Usta detaylarını ve kullanıcı bilgilerini çekelim
    const providers = await this.prisma.serviceProvider.findMany({
      where: { id: { in: alarmProviderIds } },
      include: { user: true },
    });

    return providers.map((provider) => {
      const data = providerDetractorMap.get(provider.id)!;
      return {
        providerId: provider.id,
        name: provider.user.name || 'Bilinmeyen Usta',
        email: provider.user.email,
        phone_decrypted: decryptPhone(provider.user.phone),
        detractorCount: data.count,
        avg_rating: provider.avg_rating ? Number(provider.avg_rating) : 0,
        recentResponses: data.responses.slice(0, 5).map((r) => ({
          id: r.id,
          score: r.score,
          comment: r.follow_up_text,
          created_at: r.created_at,
        })),
      };
    });
  }

  async getRoleDashboardStats(adminEmail: string, role: string) {
    await this.checkPermission(adminEmail, 'dashboard', 'read');

    if (role === 'executive') {
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      // Sum of successful payments in the last 30 days (MRR)
      const payments = await this.prisma.payment.findMany({
        where: {
          status: 'success',
          created_at: { gte: last30Days },
        },
        select: { amount: true },
      });
      const mrr = payments.reduce((sum, p) => sum + Number(p.amount), 0);

      // Net NPS score
      const npsResponses = await this.prisma.npsResponse.findMany({
        select: { score: true },
      });
      const totalNps = npsResponses.length;
      const promoters = npsResponses.filter((r) => r.score >= 7).length;
      const detractors = npsResponses.filter((r) => r.score <= 3).length;
      const overallNps = totalNps > 0 ? Math.round(((promoters - detractors) / totalNps) * 100) : 0;

      // Active service providers (approved)
      const activeProvidersCount = await this.prisma.serviceProvider.count({
        where: { is_approved: true },
      });

      // Active requests count (status distributed)
      const activeRequestsCount = await this.prisma.serviceRequest.count({
        where: { status: 'distributed' },
      });

      // Failed iyzico payments
      const failedPayments = await this.prisma.payment.findMany({
        where: { status: 'failed' },
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          subscription: {
            include: {
              provider: {
                include: { user: true },
              },
            },
          },
        },
      });

      const failedPaymentsMapped = failedPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        created_at: p.created_at,
        providerName: p.subscription?.provider?.user?.name || 'Bilinmeyen Usta',
        providerPhone: p.subscription?.provider?.user?.phone ? decryptPhone(p.subscription.provider.user.phone) : '',
      }));

      return {
        mrr,
        overallNps,
        activeProvidersCount,
        activeRequestsCount,
        failedPayments: failedPaymentsMapped,
      };
    } else if (role === 'quality_staff') {
      // FIFO call tasks
      const callTasks = await this.getCallTasksFifo(adminEmail);

      // Comment approval queue
      const pendingReviews = await this.prisma.review.findMany({
        where: { status: 'pending' },
        include: {
          job: { include: { category: true } },
          reviewer: true,
          provider: { include: { user: true } },
        },
        orderBy: { created_at: 'asc' },
      });

      const pendingReviewsMapped = pendingReviews.map((r) => ({
        id: r.id,
        reviewerName: r.reviewer.name || 'Bilinmeyen Kullanıcı',
        providerName: r.provider.user.name || 'Bilinmeyen Usta',
        categoryName: r.job.category.name,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
      }));

      // SLA Priority lists (delayed calltasks due_at < now)
      const now = new Date();
      const slaBreachedCalls = callTasks.filter((t) => new Date(t.due_at) < now);

      return {
        callTasks,
        pendingReviews: pendingReviewsMapped,
        slaBreachedCalls,
      };
    } else if (role === 'sales_staff') {
      // Net active subscriptions
      const activeSubsCount = await this.prisma.subscription.count({
        where: { status: 'active' },
      });

      // Quota usage alerts (> 85%)
      const quotas = await this.prisma.providerMonthlyQuota.findMany({
        include: {
          provider: {
            include: { user: true },
          },
        },
      });

      const highQuotaUsage = quotas
        .filter((q) => q.monthly_limit && (q.accepted_count / q.monthly_limit) > 0.85)
        .map((q) => ({
          providerId: q.provider_id,
          name: q.provider.user.name || 'Bilinmeyen Usta',
          phone_decrypted: decryptPhone(q.provider.user.phone),
          usagePct: Math.round((q.accepted_count / q.monthly_limit!) * 100),
          acceptedCount: q.accepted_count,
          monthlyLimit: q.monthly_limit,
        }));

      // Churn risk HV lists (no offer in 30 days)
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);

      const activeProviders = await this.prisma.serviceProvider.findMany({
        where: {
          subscription: {
            status: { in: ['active', 'trial', 'admin_trial'] },
          },
        },
        include: {
          user: true,
          offers: {
            orderBy: { created_at: 'desc' },
            take: 1,
          },
        },
      });

      const churnRiskProviders = activeProviders
        .filter((p) => {
          if (p.offers.length === 0) return true;
          return p.offers[0].created_at < last30Days;
        })
        .map((p) => ({
          providerId: p.id,
          name: p.user.name || 'Bilinmeyen Usta',
          phone_decrypted: decryptPhone(p.user.phone),
          lastOfferDate: p.offers.length > 0 ? p.offers[0].created_at : null,
        }));

      return {
        activeSubsCount,
        highQuotaUsage,
        churnRiskProviders,
      };
    } else {
      throw new BadRequestException('Böyle bir rol paneli bulunmamaktadır.');
    }
  }

  async getAbTestConfig(adminEmail?: string) {
    if (adminEmail) {
      await this.checkPermission(adminEmail, 'dashboard', 'read');
    }

    const chatModel = await this.redis.get('ab_test:chat_model') || 'gpt-4o';
    const temperatureStr = await this.redis.get('ab_test:temperature');
    const temperature = temperatureStr ? parseFloat(temperatureStr) : 0.7;
    const splitRatioStr = await this.redis.get('ab_test:split_ratio');
    const splitRatio = splitRatioStr ? parseFloat(splitRatioStr) : 0.5;

    return {
      chatModel,
      temperature,
      splitRatio,
    };
  }

  async saveAbTestConfig(adminEmail: string, dto: SaveAbTestConfigDto) {
    const staff = await this.checkPermission(adminEmail, 'dashboard', 'write');

    const oldConfig = await this.getAbTestConfig();

    await this.redis.set('ab_test:chat_model', dto.chatModel);
    await this.redis.set('ab_test:temperature', dto.temperature.toString());
    await this.redis.set('ab_test:split_ratio', dto.splitRatio.toString());

    await this.logAudit(
      staff.id,
      'ab_test.update_config',
      'ab_test_config',
      staff.id,
      oldConfig,
      dto
    );

    return {
      success: true,
      message: 'A/B Test konfigürasyonu başarıyla güncellendi.',
    };
  }
}
