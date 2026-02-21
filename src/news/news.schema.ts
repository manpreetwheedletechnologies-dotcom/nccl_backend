import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NewsDocument = News & Document;

@Schema({ timestamps: { createdAt: 'published_at', updatedAt: true } })
export class News {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    summary: string;

    @Prop()
    image_url: string;

    @Prop()
    published_at: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);
