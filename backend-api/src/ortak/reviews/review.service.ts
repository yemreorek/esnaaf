import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createReview(dto: CreateReviewDto, seekerId: string) {
    this.logger.log(`Creating review for job: ${dto.job_id} by seeker: ${seekerId}`);

    // Check if the service request exists and is completed
    const job = await this.prisma.serviceRequest.findUnique({
      where: { id: dto.job_id },
      include: { accepted_offers: true },
    });

    if (!job) {
      throw new NotFoundException('Hizmet talebi bulunamadı.');
    }

    // Ensure there is an accepted offer for this job and seeker
    const acceptedOffer = job.accepted_offers.find(
      (offer) => offer.seeker_id === seekerId,
    );

    if (!acceptedOffer) {
      throw new BadRequestException('Bu iş için kabul edilmiş teklifiniz bulunmamaktadır.');
    }

    // Check if user already reviewed this job
    const existingReview = await this.prisma.review.findFirst({
      where: {
        job_id: dto.job_id,
        reviewer_id: seekerId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('Bu iş için daha önce değerlendirme yapılmıştır.');
    }

    const providerId = acceptedOffer.provider_id;

    // Create review
    const review = await this.prisma.review.create({
      data: {
        job_id: dto.job_id,
        reviewer_id: seekerId,
        provider_id: providerId,
        rating: dto.rating,
        comment: dto.comment,
        document_url: dto.document_url,
        status: ReviewStatus.pending,
      },
    });

    this.logger.log(`Review created successfully with ID: ${review.id} (Status: pending)`);
    return review;
  }

  async getProviderReviews(providerId: string) {
    this.logger.log(`Fetching approved reviews for provider: ${providerId}`);
    return this.prisma.review.findMany({
      where: {
        provider_id: providerId,
        status: ReviewStatus.approved,
      },
      include: {
        reviewer: {
          select: {
            name: true,
            phone_masked: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async getAdminQueue() {
    this.logger.log('Fetching pending reviews for admin queue');
    return this.prisma.review.findMany({
      where: {
        status: ReviewStatus.pending,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_masked: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        job: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  async approveReview(id: string, adminId: string) {
    this.logger.log(`Admin ${adminId} is approving review ${id}`);

    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Değerlendirme bulunamadı.');
    }

    if (review.status === ReviewStatus.approved) {
      throw new BadRequestException('Bu değerlendirme zaten onaylanmış.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update review status
      const updatedReview = await tx.review.update({
        where: { id },
        data: {
          status: ReviewStatus.approved,
          approved_by: adminId,
          approved_at: new Date(),
        },
      });

      // 2. Fetch all approved reviews for this provider to recalculate metrics
      const approvedReviews = await tx.review.findMany({
        where: {
          provider_id: review.provider_id,
          status: ReviewStatus.approved,
        },
      });

      const totalReviews = approvedReviews.length;
      const sumRatings = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalReviews > 0 ? Number((sumRatings / totalReviews).toFixed(2)) : 0;

      // 3. Update ServiceProvider avg_rating and total_jobs
      await tx.serviceProvider.update({
        where: { id: review.provider_id },
        data: {
          avg_rating: avgRating,
          total_jobs: totalReviews,
        },
      });

      this.logger.log(
        `Provider ${review.provider_id} updated: avg_rating = ${avgRating}, total_jobs = ${totalReviews}`,
      );

      return updatedReview;
    });
  }

  async rejectReview(id: string, adminId: string) {
    this.logger.log(`Admin ${adminId} is rejecting review ${id}`);

    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Değerlendirme bulunamadı.');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        status: ReviewStatus.rejected,
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
  }
}
