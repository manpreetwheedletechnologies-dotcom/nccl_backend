import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
    imports: [HttpModule, ConfigModule],
    controllers: [PlayersController],
    providers: [PlayersService],
})
export class PlayersModule { }
