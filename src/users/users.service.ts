import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as fs from 'fs';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async onModuleInit() {
        // Generate app codes for existing users who don't have one
        const usersWithoutCode = await this.userModel.find({ app_code: { $exists: false } }).exec();
        for (const user of usersWithoutCode) {
            user.app_code = await this.generateUniqueAppCode();
            await user.save();
        }
    }

    private async generateUniqueAppCode(): Promise<string> {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters
        let code = '';
        let isUnique = false;

        while (!isUnique) {
            code = 'NC-';
            for (let i = 0; i < 5; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            const existing = await this.userModel.findOne({ app_code: code }).exec();
            if (!existing) isUnique = true;
        }
        return code;
    }

    async create(createUserDto: any): Promise<User> {
        if (!createUserDto.app_code) {
            createUserDto.app_code = await this.generateUniqueAppCode();
        }
        const createdUser = new this.userModel(createUserDto);
        return createdUser.save();
    }

    async createGuest(guestData: { name: string; phone?: string; location?: string; created_by: string }): Promise<User> {
        const appCode = await this.generateUniqueAppCode();
        const createdUser = new this.userModel({
            ...guestData,
            app_code: appCode,
            is_guest: true,
            roles: ['player', 'user'],
        });
        return createdUser.save();
    }

    async findByAppCode(appCode: string): Promise<User | undefined> {
        return this.userModel.findOne({ app_code: appCode }).exec();
    }

    async findOne(phone: string): Promise<User | undefined> {
        return this.userModel.findOne({ phone }).exec();
    }

    async findById(id: string): Promise<User | undefined> {
        return this.userModel.findById(id).exec();
    }

    async update(id: string, updateUserDto: any): Promise<User> {
        const user = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();

        // If user filled in cricket details, add 'player' role
        const playerFields = ['playing_role', 'batting_style', 'bowling_style'];
        const hasPlayerData = playerFields.some(field =>
            updateUserDto[field] && updateUserDto[field].trim() !== ''
        );

        if (hasPlayerData && user) {
            await this.addRole(id, 'player');
        }

        return user;
    }

    async addRole(id: string, role: string): Promise<User> {
        return this.userModel.findByIdAndUpdate(
            id,
            { $addToSet: { roles: role } },
            { new: true }
        ).exec();
    }

    async searchPlayers(query: string, requesterId: string): Promise<User[]> {
        const logPath = '/tmp/search_debug.log';
        const log = (msg: string) => fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);

        log(`Search Request - Query: "${query}", Requester: ${requesterId}`);

        const user = await this.userModel.findById(requesterId).exec();
        const userLocation = user?.location;
        log(`User Location: "${userLocation}"`);

        const filter: any = {
            _id: { $ne: requesterId }, // Exclude self
        };

        // Try to filter by city if location exists
        if (userLocation && userLocation.trim() !== '') {
            const city = userLocation.split(',')[0].trim();
            log(`Extracted City: "${city}"`);
            filter.location = { $regex: city, $options: 'i' };
        }

        if (query) {
            filter.$or = [
                { name: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
            ];
        }

        log(`Filter: ${JSON.stringify(filter)}`);
        let results = await this.userModel.find(filter).limit(20).exec();
        log(`Found ${results.length} local results`);

        // Fallback: If no results in same city AND we had a city filter, search all internal players
        if (results.length === 0 && filter.location) {
            log(`Falling back to all platform players...`);
            delete filter.location;
            results = await this.userModel.find(filter).limit(20).exec();
            log(`Found ${results.length} fallback results`);
        }

        return results;
    }
}
