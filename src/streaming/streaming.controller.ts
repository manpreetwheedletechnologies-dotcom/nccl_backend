import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { StreamingService } from './streaming.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/streaming')
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) { }

    @Get('live')
    async getLiveStreams() {
        return this.streamingService.findAllActive();
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin', 'team') // Allow admins and teams to create streams
    async createStream(@Body() streamDto: any) {
        return this.streamingService.create(streamDto);
    }
}
