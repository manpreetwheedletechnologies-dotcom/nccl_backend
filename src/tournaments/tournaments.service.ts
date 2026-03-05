import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, TournamentDocument } from './tournament.schema';

@Injectable()
export class TournamentsService {
    constructor(@InjectModel(Tournament.name) private tournamentModel: Model<TournamentDocument>) { }

    async findAll(): Promise<Tournament[]> {
        return this.tournamentModel.find().exec();
    }

    async findById(id: string): Promise<Tournament> {
        const t = await this.tournamentModel.findById(id).exec();
        if (!t) throw new NotFoundException('Tournament not found');
        return t;
    }

    async create(createTournamentDto: any, userId: string): Promise<Tournament> {
        const createdTournament = new this.tournamentModel({
            ...createTournamentDto,
            created_by: userId,
            code: createTournamentDto.code || `TRN-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        });
        return createdTournament.save();
    }

    async registerTeam(tournamentId: string, registrationDto: {
        team_id: string;
        team_name: string;
        team_logo?: string;
        captain_id?: string;
        captain_name?: string;
        registered_by: string;
        squad: { player_id: string; name: string; role?: string }[];
    }): Promise<Tournament> {
        const tournament = await this.tournamentModel.findById(tournamentId).exec();
        if (!tournament) throw new NotFoundException('Tournament not found');

        const t = tournament as any;

        // Check if this team is already registered
        const alreadyRegistered = (t.registered_teams || []).some(
            (r: any) => r.team_id.toString() === registrationDto.team_id.toString()
        );
        if (alreadyRegistered) {
            throw new BadRequestException('This team is already registered in this tournament');
        }

        const registration = {
            team_id: registrationDto.team_id,
            team_name: registrationDto.team_name,
            team_logo: registrationDto.team_logo || '',
            captain_id: registrationDto.captain_id || '',
            captain_name: registrationDto.captain_name || '',
            registered_by: registrationDto.registered_by,
            squad: registrationDto.squad || [],
            registered_at: new Date(),
        };

        return this.tournamentModel.findByIdAndUpdate(
            tournamentId,
            {
                $push: { registered_teams: registration },
                $addToSet: { teams: registrationDto.team_id }
            },
            { new: true }
        ).exec();
    }

    async updatePointsTable(tournamentId: string, match: any): Promise<void> {
        const tournament = await this.tournamentModel.findById(tournamentId).exec();
        if (!tournament) return;

        const table = [...(tournament.points_table || [])];
        const team1Id = match.team1?.id || match.team1?._id;
        const team2Id = match.team2?.id || match.team2?._id;

        const updateTeam = (teamId: string, teamName: string, outcome: 'win' | 'loss' | 'tie') => {
            let entry = table.find(e => e.team_id.toString() === teamId.toString());
            if (!entry) {
                entry = { team_id: teamId, team_name: teamName, played: 0, won: 0, lost: 0, tied: 0, points: 0, nrr: 0 };
                table.push(entry);
            }
            entry.played += 1;
            if (outcome === 'win') { entry.won += 1; entry.points += 2; }
            else if (outcome === 'loss') { entry.lost += 1; }
            else if (outcome === 'tie') { entry.tied += 1; entry.points += 1; }
        };

        const result = match.result || '';
        const team1Name = match.team1?.name;
        const team2Name = match.team2?.name;

        if (result.includes('won by')) {
            const winnerName = result.split(' won by')[0];
            if (winnerName === team1Name) {
                updateTeam(team1Id, team1Name, 'win');
                updateTeam(team2Id, team2Name, 'loss');
            } else {
                updateTeam(team2Id, team2Name, 'win');
                updateTeam(team1Id, team1Name, 'loss');
            }
        } else if (result.toLowerCase().includes('tie') || result.toLowerCase().includes('draw')) {
            updateTeam(team1Id, team1Name, 'tie');
            updateTeam(team2Id, team2Name, 'tie');
        }

        await this.tournamentModel.findByIdAndUpdate(tournamentId, { $set: { points_table: table } }).exec();
    }

    async setPlayerOfTournament(id: string, data: any) {
        return this.tournamentModel.findByIdAndUpdate(id, {
            $set: {
                player_of_tournament: {
                    player_id: data.player_id,
                    name: data.name,
                    team_name: data.team_name,
                },
                pot_reason: data.reason,
            }
        }, { new: true }).exec();
    }

    async addPlayerToTournamentSquad(id: string, teamId: string, player: any) {
        return this.tournamentModel.findOneAndUpdate(
            { _id: id, 'registered_teams.team_id': teamId },
            {
                $push: { 'registered_teams.$.squad': player }
            },
            { new: true }
        ).exec();
    }
}
