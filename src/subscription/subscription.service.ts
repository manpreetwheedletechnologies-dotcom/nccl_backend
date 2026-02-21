import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PremiumPlan, PremiumPlanDocument, Subscription, SubscriptionDocument } from './subscription.schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectModel(PremiumPlan.name) private premiumPlanModel: Model<PremiumPlanDocument>,
        @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
        private usersService: UsersService,
        private notificationsService: NotificationsService,
    ) { }

    async findAllPlans(): Promise<PremiumPlan[]> {
        return this.premiumPlanModel.find({ is_active: true }).exec();
    }

    async createPlan(createPlanDto: any): Promise<PremiumPlan> {
        const createdPlan = new this.premiumPlanModel(createPlanDto);
        return createdPlan.save();
    }

    async subscribe(dto: any): Promise<Subscription> {
        const plan = await this.premiumPlanModel.findById(dto.plan_id);
        if (!plan) throw new NotFoundException('Plan not found');

        const user = await this.usersService.findById(dto.user_id);
        if (!user) throw new NotFoundException('User not found');

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + plan.duration_days);

        const subscription = new this.subscriptionModel({
            user_id: dto.user_id,
            plan_id: dto.plan_id,
            start_date: startDate,
            end_date: endDate,
            is_active: true,
            payment_id: dto.payment_id
        });
        await subscription.save();

        // Update user status
        await this.usersService.update(dto.user_id, { is_premium: true, premium_expiry: endDate });

        // Notify
        await this.notificationsService.create({
            user_id: dto.user_id,
            title: "Premium Activated! 🎉",
            message: `Your ${plan.name} subscription is now active.`,
            type: "premium_offer"
        });

        return subscription;
    }

    async checkStatus(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        let isPremium = user.is_premium;
        if (isPremium && user.premium_expiry && new Date(user.premium_expiry) < new Date()) {
            isPremium = false;
            await this.usersService.update(userId, { is_premium: false });
        }

        return { is_premium: isPremium, expiry: user.premium_expiry };
    }
}
