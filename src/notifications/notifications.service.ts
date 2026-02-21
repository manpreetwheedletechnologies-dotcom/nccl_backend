import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './notification.schema';

@Injectable()
export class NotificationsService {
    constructor(@InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>) { }

    async findByUserId(userId: string): Promise<Notification[]> {
        return this.notificationModel.find({ user_id: userId }).sort({ createdAt: -1 }).exec();
    }

    async create(createNotificationDto: any): Promise<Notification> {
        const createdNotification = new this.notificationModel(createNotificationDto);
        return createdNotification.save();
    }

    async markAsRead(id: string): Promise<Notification> {
        return this.notificationModel.findByIdAndUpdate(id, { is_read: true }, { new: true }).exec();
    }
}
