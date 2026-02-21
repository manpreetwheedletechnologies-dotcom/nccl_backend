import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TournamentDocument = Tournament & Document;

@Schema({ timestamps: true })
export class Tournament {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    code: string;

    @Prop({ required: true })
    start_date: Date;

    @Prop({ required: true })
    end_date: Date;

    @Prop({ type: [String], default: [] })
    teams: string[];

    @Prop({ default: 'upcoming' })
    status: string;

    @Prop({ default: 'T20' })
    format: string;

    @Prop()
    city: string;

    @Prop()
    ground: string;

    @Prop({ default: 'Leather' })
    ball_type: string;

    @Prop()
    organizer_name: string;

    @Prop()
    organizer_phone: string;

    @Prop()
    description: string;

    @Prop()
    banner_url: string;

    @Prop()
    created_by: string;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);
