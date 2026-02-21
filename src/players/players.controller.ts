import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/players')
export class PlayersController {
    constructor(private readonly playersService: PlayersService) { }

    @Get('search')
    async search(@Query('q') query: string) {
        return this.playersService.searchPlayers(query);
    }

    @Get(':id')
    async getInfo(@Param('id') id: string) {
        return this.playersService.getPlayerInfo(id);
    }
}
