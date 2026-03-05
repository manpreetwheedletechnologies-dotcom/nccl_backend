import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NetworkItemDocument = NetworkItem & Document;

@Schema({ timestamps: true })
export class NetworkItem {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    category: string; // "Academies", "Grounds", "Umpires", "Scorers", etc.

    @Prop({ required: true })
    location: string;

    @Prop({ default: 0 })
    rating: number;

    @Prop({ default: 0 })
    review_count: number;

    @Prop()
    image_url: string;

    @Prop({ required: true })
    contact_number: string;

    @Prop()
    fees_per_match: number;

    @Prop()
    fees_per_day: number;

    @Prop()
    experience_years: number;

    @Prop({ default: 0 })
    total_points: number;

    @Prop({ required: true })
    user_id: string; // To track who created the listing

    @Prop({ default: 0 })
    stats_count: number; // Matches scored/umpired, tournaments organised, etc.

    @Prop({ type: [String], default: [] })
    facilities: string[];

    @Prop({ type: [String], default: [] })
    brands: string[];

    @Prop()
    address: string;

    @Prop()
    city: string;

    @Prop()
    std_code: string;

    @Prop()
    landline_number: string;

    @Prop()
    contact_person_name: string;

    @Prop()
    secondary_contact_number: string;

    @Prop()
    description: string;

    @Prop({ default: false })
    is_premium: boolean;
}

export const NetworkItemSchema = SchemaFactory.createForClass(NetworkItem);
