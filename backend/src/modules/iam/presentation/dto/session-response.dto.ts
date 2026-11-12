import { ApiProperty } from '@nestjs/swagger';
import { ROLES, Role } from '../../domain/role';

export class SessionUserDto {
  @ApiProperty({ example: 'Bibliotecaria de Demostración' })
  nombre!: string;

  @ApiProperty({ enum: [...ROLES], example: 'STAFF' })
  rol!: Role;
}

export class SessionResponseDto {
  @ApiProperty({
    description:
      'JWT de acceso (15 minutos). Se envía en la cabecera `Authorization: Bearer <token>`.',
  })
  accessToken!: string;

  @ApiProperty({ type: SessionUserDto })
  usuario!: SessionUserDto;
}
