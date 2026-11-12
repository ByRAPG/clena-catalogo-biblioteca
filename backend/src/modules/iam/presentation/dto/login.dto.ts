import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo institucional de la cuenta',
    example: 'personal@example.org',
    maxLength: 254,
  })
  @IsEmail({}, { message: 'Escribe un correo válido' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ description: 'Contraseña de la cuenta', maxLength: 200 })
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu contraseña' })
  @MaxLength(200)
  password!: string;
}
