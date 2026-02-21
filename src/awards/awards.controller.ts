import { Controller, Get } from '@nestjs/common';
import { AwardsService } from './awards.service';

@Controller('api/awards')
export class AwardsController {
    constructor(private readonly awardsService: AwardsService) { }

    @Get()
    async findAll() {
        return this.awardsService.findAll();
    }
}
