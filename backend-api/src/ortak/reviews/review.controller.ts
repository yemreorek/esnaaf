import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Roles('service_seeker')
  @Post('musteri/reviews')
  async createReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.reviewService.createReview(dto, user.id);
  }

  @Public()
  @Get('ortak/reviews/provider/:providerId')
  async getProviderReviews(@Param('providerId') providerId: string) {
    return this.reviewService.getProviderReviews(providerId);
  }

  @Roles('admin')
  @Get('admin/reviews/queue')
  async getAdminQueue() {
    return this.reviewService.getAdminQueue();
  }

  @Roles('admin')
  @Put('admin/reviews/:id/approve')
  async approveReview(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.reviewService.approveReview(id, admin.id);
  }

  @Roles('admin')
  @Put('admin/reviews/:id/reject')
  async rejectReview(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.reviewService.rejectReview(id, admin.id);
  }
}
