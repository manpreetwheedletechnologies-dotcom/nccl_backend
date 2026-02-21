import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StoreBannerDocument = StoreBanner & Document;
export type HomeBannerDocument = HomeBanner & Document;

@Schema({ timestamps: true })
export class StoreBanner {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    image_url: string;

    @Prop()
    link: string;

    @Prop({ default: true })
    is_active: boolean;

    @Prop({ default: 'main' })
    type: string;
}

@Schema({ timestamps: true })
export class HomeBanner {
    @Prop({ required: true })
    title: string;

    @Prop()
    subtitle: string;

    @Prop()
    button_text: string;

    @Prop()
    image_url: string;

    @Prop()
    link: string;

    @Prop({ default: true })
    is_active: boolean;
}

export const StoreBannerSchema = SchemaFactory.createForClass(StoreBanner);
export const HomeBannerSchema = SchemaFactory.createForClass(HomeBanner);
