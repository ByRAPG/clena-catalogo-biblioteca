import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Carmen Pérez', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'Escriba su nombre' })
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'lector@example.org', maxLength: 254 })
  @IsEmail({}, { message: 'Escriba un correo válido' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ description: '12 a 128 caracteres', maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'Escriba una contraseña' })
  @MaxLength(200)
  password!: string;

  @ApiProperty({
    description: 'Debe ser true: aceptación expresa del aviso de privacidad',
  })
  @IsBoolean({ message: 'Debe aceptar el tratamiento de sus datos' })
  acceptPrivacy!: boolean;
}

export class RegisterResponseDto {
  @ApiProperty({ example: true }) registrado!: boolean;
}

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Contraseña actual, para confirmar',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Escriba su contraseña' })
  @MaxLength(200)
  password!: string;
}

export class AccountResponseDto {
  @ApiProperty() nombre!: string;
  @ApiProperty() correo!: string;
  @ApiProperty({ nullable: true, type: String }) consentimientoEn!:
    string | null;
  @ApiProperty({ nullable: true, type: String }) versionAviso!: string | null;
}
