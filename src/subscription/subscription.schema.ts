import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PremiumPlanDocument = PremiumPlan & Document;
export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class PremiumPlan {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    duration_days: number;

    @Prop([String])
    features: string[];

    @Prop({ default: true })
    is_active: boolean;
}

@Schema({ timestamps: true })
export class Subscription {
    @Prop({ required: true })
    user_id: string;

    @Prop({ required: true })
    plan_id: string;

    @Prop({ required: true })
    start_date: Date;

    @Prop({ required: true })
    end_date: Date;

    @Prop({ default: true })
    is_active: boolean;

    @Prop()
    payment_id: string;
}

export const PremiumPlanSchema = SchemaFactory.createForClass(PremiumPlan);
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
