import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TournamentDocument = Tournament & Document;

@Schema()
class TournamentSquadPlayer {
    @Prop() player_id: string;
    @Prop() name: string;
    @Prop() role: string; // batsman, bowler, all-rounder, wicket-keeper
}

@Schema()
class TournamentRegistration {
    @Prop({ required: true }) team_id: string;
    @Prop({ required: true }) team_name: string;
    @Prop() team_logo: string;
    @Prop() captain_id: string;
    @Prop() captain_name: string;
    @Prop() registered_by: string; // user_id of team owner
    @Prop({ type: [Object], default: [] }) squad: TournamentSquadPlayer[]; // selected squad for this tournament
    @Prop({ default: Date.now }) registered_at: Date;
}

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
    teams: string[];  // legacy: just team IDs

    @Prop({ type: [Object], default: [] })
    registered_teams: TournamentRegistration[];  // full registration with squad

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

    @Prop({ type: [Object], default: [] })
    points_table: {
        team_id: string;
        team_name: string;
        played: number;
        won: number;
        lost: number;
        tied: number;
        points: number;
        nrr: number;
    }[];

    @Prop({ type: Object, default: null })
    player_of_tournament: {
        player_id: string;
        name: string;
        team_name: string;
    } | null;

    @Prop()
    pot_reason: string;

    @Prop()
    created_by: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);
