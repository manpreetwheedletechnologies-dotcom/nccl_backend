import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, Length } from 'class-validator';

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(15)
    phone: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    @Length(6, 6)
    otp?: string;
}

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(15)
    phone: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsOptional()
    roles?: string[];

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;
}

export class AppCodeLoginDto {
    @IsString()
    @IsNotEmpty()
    @Length(8, 8) // e.g., NC-X7Y2Z
    code: string;
}
