import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoreItem, StoreItemDocument } from './store-item.schema';

@Injectable()
export class StoreService {
    constructor(@InjectModel(StoreItem.name) private storeModel: Model<StoreItemDocument>) { }

    async findAll(): Promise<StoreItem[]> {
        return this.storeModel.find().exec();
    }

    async create(createStoreItemDto: any): Promise<StoreItem> {
        const createdItem = new this.storeModel(createStoreItemDto);
        return createdItem.save();
    }
}
