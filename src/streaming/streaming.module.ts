import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StreamingController } from './streaming.controller';
import { StreamingService } from './streaming.service';
import { Stream, StreamSchema } from './stream.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Stream.name, schema: StreamSchema }])
    ],
    controllers: [StreamingController],
    providers: [StreamingService],
    exports: [StreamingService]
})
export class StreamingModule { }
