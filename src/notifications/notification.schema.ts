import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ required: true })
    user_id: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    type: string;

    @Prop({ type: Object })
    data: any;

    @Prop({ default: false })
    is_read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
