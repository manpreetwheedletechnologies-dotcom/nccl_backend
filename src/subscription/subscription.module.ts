import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { PremiumPlan, PremiumPlanSchema, Subscription, SubscriptionSchema } from './subscription.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PremiumPlan.name, schema: PremiumPlanSchema },
            { name: Subscription.name, schema: SubscriptionSchema },
        ]),
        UsersModule,
        NotificationsModule
    ],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
})
export class SubscriptionModule { }
