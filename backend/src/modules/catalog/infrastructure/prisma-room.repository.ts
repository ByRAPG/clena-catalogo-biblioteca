import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { RoomRef, RoomRepository } from '../application/ports/room.repository';

@Injectable()
export class PrismaRoomRepository implements RoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RoomRef | null> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    return room ? { id: room.id, name: room.name } : null;
  }
}
