import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreItem, StoreItemSchema } from './store-item.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: StoreItem.name, schema: StoreItemSchema }])],
    controllers: [StoreController],
    providers: [StoreService],
})
export class StoreModule { }
