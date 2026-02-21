import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoreBanner, StoreBannerDocument, HomeBanner, HomeBannerDocument } from './banner.schema';

@Injectable()
export class BannersService {
    constructor(
        @InjectModel(StoreBanner.name) private storeBannerModel: Model<StoreBannerDocument>,
        @InjectModel(HomeBanner.name) private homeBannerModel: Model<HomeBannerDocument>,
    ) { }

    async findStoreBanners(): Promise<StoreBanner[]> {
        return this.storeBannerModel.find({ is_active: true }).exec();
    }

    async createStoreBanner(dto: any): Promise<StoreBanner> {
        const banner = new this.storeBannerModel(dto);
        return banner.save();
    }

    async findHomeBanners(): Promise<HomeBanner[]> {
        return this.homeBannerModel.find({ is_active: true }).exec();
    }

    async createHomeBanner(dto: any): Promise<HomeBanner> {
        const banner = new this.homeBannerModel(dto);
        return banner.save();
    }
}
