import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { News, NewsDocument } from './news.schema';

@Injectable()
export class NewsService {
    constructor(@InjectModel(News.name) private newsModel: Model<NewsDocument>) { }

    async findAll(): Promise<News[]> {
        return this.newsModel.find().sort({ published_at: -1 }).exec();
    }

    async create(createNewsDto: any): Promise<News> {
        const createdNews = new this.newsModel(createNewsDto);
        return createdNews.save();
    }
}
