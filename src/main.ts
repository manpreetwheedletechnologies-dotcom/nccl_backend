import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Global Prefix
    app.setGlobalPrefix('api');

    // Security Headers
    app.use(helmet({
        crossOriginResourcePolicy: false,
    }));

    // Global Validation
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

    // RESTRICTED CORS
    app.enableCors({
        origin: ['http://localhost:3000', 'http://10.0.2.2:8081', 'http://localhost:8081'], // Add trusted origins
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    const port = process.env.PORT || 8000;
    await app.listen(port, '0.0.0.0');
    console.log(`Security-hardened application is running on: http://localhost:${port}`);
}
bootstrap();
