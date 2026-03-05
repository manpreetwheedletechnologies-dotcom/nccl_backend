import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { Team, TeamDocument } from './team.schema';
import { TeamRequest, TeamRequestDocument } from './team-request.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TeamsService {
    constructor(
        @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
        @InjectModel(TeamRequest.name) private requestModel: Model<TeamRequestDocument>,
        private readonly usersService: UsersService,
        private readonly notificationsService: NotificationsService
    ) { }

    async findAll(): Promise<Team[]> {
        return this.teamModel.find().exec();
    }

    async create(createTeamDto: any): Promise<Team> {
        const createdTeam = new this.teamModel(createTeamDto);
        const team = await createdTeam.save();

        // Ensure owner has the 'team' role
        if (createTeamDto.owner) {
            await this.usersService.addRole(createTeamDto.owner, 'team');
        }

        return team;
    }

    async findByOwner(ownerId: string): Promise<Team[]> {
        return this.teamModel.find({
            $or: [
                { owner: ownerId },
                { players: ownerId }
            ]
        }).populate('players').exec();
    }

    async findById(teamId: string): Promise<Team | null> {
        return this.teamModel.findById(teamId).populate('players').populate('captain').exec();
    }

    // Requests logic
    async createRequest(requestIdDto: any): Promise<TeamRequest> {
        const request = new this.requestModel(requestIdDto);
        const savedRequest = await request.save();

        // Send notification to the receiver
        const team = await this.findById(requestIdDto.team_id);
        const receiverId = requestIdDto.type === 'JOIN' ? team.owner : requestIdDto.user_id;

        await this.notificationsService.create({
            user_id: receiverId,
            title: requestIdDto.type === 'JOIN' ? 'New Join Request' : 'Team Invitation',
            message: requestIdDto.type === 'JOIN'
                ? `A player wants to join ${team.name}`
                : `You have been invited to join ${team.name}`,
            type: 'TEAM_REQUEST',
            data: { requestId: savedRequest._id, teamId: (team as any)._id }
        });

        return savedRequest;
    }

    async respondToRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED', respondingUserId: string): Promise<TeamRequest> {
        const request = await this.requestModel.findById(requestId).populate('team_id').exec();
        if (!request) throw new Error('Request not found');

        // Authorization check
        const team = request.team_id as any;
        const isOwner = team.owner.toString() === respondingUserId;
        const isTargetPlayer = request.user_id.toString() === respondingUserId;

        if (request.type === 'JOIN' && !isOwner) {
            throw new Error('Only team owner can respond to join requests');
        }
        if (request.type === 'ADD' && !isTargetPlayer) {
            throw new Error('Only the invited player can respond to invitations');
        }

        request.status = status;
        const savedRequest = await request.save();

        if (status === 'ACCEPTED') {
            await this.addPlayer(request.team_id, request.user_id);
        }

        // Notify the sender
        await this.notificationsService.create({
            user_id: request.sender_id,
            title: `Request ${status.toLowerCase()}`,
            message: `Your request for ${team.name} has been ${status.toLowerCase()}`,
            type: 'TEAM_REQUEST_RESULT',
            data: { teamId: team._id, status }
        });

        return savedRequest;
    }

    async findRequestsForUser(userId: string): Promise<TeamRequest[]> {
        const userObjId = new Types.ObjectId(userId);

        // Find teams owned by this user
        // Cast query to any for strict type compliance
        const userTeams = await this.teamModel.find({ owner: userObjId as any }).select('_id').exec();
        const teamIds = userTeams.map(t => (t._id as any));

        const query: any = {
            $or: [
                { user_id: userObjId, status: 'PENDING' }, // User is the involved player (invited or requester)
                { team_id: { $in: teamIds }, status: 'PENDING' }, // User is owner of the involved team
                { sender_id: userObjId, status: 'PENDING' } // User sent the request (see their own sent requests)
            ]
        };

        return this.requestModel.find(query)
            .populate('team_id')
            .populate('user_id')
            .exec();
    }

    async findRequestsForTeam(teamId: string): Promise<TeamRequest[]> {
        return this.requestModel.find({ team_id: teamId, status: 'PENDING' }).populate('user_id').exec();
    }

    async addPlayer(teamId: string, playerId: string): Promise<Team> {
        // Check if player is already in another team
        const user = await this.usersService.findById(playerId);
        if (user?.current_team_id && user.current_team_id.toString() !== teamId) {
            throw new Error('Player is already a member of another team');
        }

        const team = await this.teamModel.findByIdAndUpdate(
            teamId,
            { $addToSet: { players: playerId } },
            { new: true }
        ).populate('players').exec();

        if (team) {
            await this.usersService.update(playerId, { current_team_id: teamId });
            await this.usersService.addRole(playerId, 'player');

            // Clear any pending requests for this player and team
            await this.requestModel.updateMany(
                { team_id: teamId, user_id: playerId, status: 'PENDING' },
                { status: 'ACCEPTED' }
            ).exec();
        }

        return team;
    }

    async joinTeam(teamId: string, userId: string): Promise<Team> {
        return this.addPlayer(teamId, userId);
    }

    async createGuestPlayer(teamId: string, guestData: { name: string; phone?: string; location?: string; created_by: string }): Promise<Team> {
        const guest = await this.usersService.createGuest(guestData);
        return this.addPlayer(teamId, (guest as any)._id.toString());
    }

    async removePlayer(teamId: string, playerId: string): Promise<Team> {
        const team = await this.teamModel.findByIdAndUpdate(
            teamId,
            { $pull: { players: new Types.ObjectId(playerId) }, $unset: {} },
            { new: true }
        ).populate('players').exec();

        // If the removed player was the captain, clear captain
        if (team && team.captain && team.captain.toString() === playerId) {
            await this.teamModel.findByIdAndUpdate(teamId, { captain: null }).exec();
        }

        // Clear current_team_id from player
        await this.usersService.update(playerId, { current_team_id: null });

        return team;
    }

    async setCaptain(teamId: string, playerId: string): Promise<Team> {
        // Ensure the player is in the team
        const team = await this.teamModel.findById(teamId).exec();
        if (!team) throw new Error('Team not found');

        const isInTeam = (team.players as any[]).some(
            (p: any) => p.toString() === playerId
        );
        if (!isInTeam) throw new Error('Player is not a member of this team');

        return this.teamModel.findByIdAndUpdate(
            teamId,
            { captain: playerId },
            { new: true }
        ).populate('players').populate('captain').exec();
    }
}
