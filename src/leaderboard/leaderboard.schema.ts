import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerStatsDocument = PlayerStats & Document;
export type TeamStatsDocument = TeamStats & Document;

@Schema({ timestamps: true })
export class PlayerStats {
    @Prop({ required: true })
    user_id: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    avatar: string;

    @Prop({ default: 0 })
    matches: number;

    @Prop({ default: 0 })
    runs: number;

    @Prop({ default: 0 })
    wickets: number;

    @Prop({ default: 0 })
    average: number;

    @Prop({ default: 0 })
    strike_rate: number;

    @Prop({ default: 0 })
    catches: number;
}

@Schema({ timestamps: true })
export class TeamStats {
    @Prop({ required: true })
    team_id: string;

    @Prop({ required: true })
    name: string;

    @Prop()
    logo: string;

    @Prop({ default: 0 })
    matches: number;

    @Prop({ default: 0 })
    wins: number;

    @Prop({ default: 0 })
    losses: number;

    @Prop({ default: 0 })
    points: number;
}

export const PlayerStatsSchema = SchemaFactory.createForClass(PlayerStats);
export const TeamStatsSchema = SchemaFactory.createForClass(TeamStats);
