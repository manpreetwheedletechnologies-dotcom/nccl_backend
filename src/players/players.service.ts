import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PlayersService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async searchPlayers(query: string) {
        try {
            const apiKey = this.configService.get<string>('CRICKET_DATA_API_KEY');
            const response = await firstValueFrom(
                this.httpService.get(`https://api.cricapi.com/v1/players?apikey=${apiKey}&offset=0&search=${query}`)
            );
            return response.data;
        } catch (error) {
            console.error('Error searching players:', error.message);
            return { status: 'error', data: [] };
        }
    }

    async getPlayerInfo(id: string) {
        try {
            const apiKey = this.configService.get<string>('CRICKET_DATA_API_KEY');
            const response = await firstValueFrom(
                this.httpService.get(`https://api.cricapi.com/v1/players_info?apikey=${apiKey}&id=${id}`)
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching player info for ${id}:`, error.message);
            throw new NotFoundException(`Player with ID ${id} not found`);
        }
    }
}
