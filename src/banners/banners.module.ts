import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';
import { StoreBanner, StoreBannerSchema, HomeBanner, HomeBannerSchema } from './banner.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: StoreBanner.name, schema: StoreBannerSchema },
            { name: HomeBanner.name, schema: HomeBannerSchema },
        ]),
    ],
    controllers: [BannersController],
    providers: [BannersService],
})
export class BannersModule { }
