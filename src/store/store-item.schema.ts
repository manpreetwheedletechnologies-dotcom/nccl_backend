import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreItemDocument = StoreItem & Document;

@Schema({ timestamps: true })
export class StoreItem {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true })
    image_url: string;

    @Prop({ required: true })
    category: string;

    @Prop({ default: 100 })
    stock: number;

    @Prop({ default: 4.5 })
    rating: number;
}

export const StoreItemSchema = SchemaFactory.createForClass(StoreItem);
