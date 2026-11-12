export const ROOM_REPOSITORY = Symbol('ROOM_REPOSITORY');

export interface RoomRef {
  id: string;
  name: string;
}

export interface RoomRepository {
  findById(id: string): Promise<RoomRef | null>;
}
