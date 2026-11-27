import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { ROLES, Role } from '../../domain/role';

export class CreateStaffUserDto {
  @ApiProperty({ example: 'Marta Bibliotecaria', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'Escriba el nombre' })
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'personal@example.org', maxLength: 254 })
  @IsEmail({}, { message: 'Escriba un correo válido' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    description: 'Contraseña inicial (12 a 128 caracteres)',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Escriba la contraseña inicial' })
  @MaxLength(200)
  password!: string;
}

export class UpdateUserDto {
  @ApiProperty({ description: 'true activa la cuenta; false la desactiva' })
  @IsBoolean({ message: 'Indique si la cuenta queda activa' })
  active!: boolean;
}

export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: [...ROLES] }) role!: Role;
  @ApiProperty() active!: boolean;
  @ApiProperty() createdAt!: string;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] }) data!: UserResponseDto[];
}

export class CreatedUserResponseDto {
  @ApiProperty() id!: string;
}
