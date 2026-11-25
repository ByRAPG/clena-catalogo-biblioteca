import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../iam/presentation/guards/jwt-auth.guard';
import { Roles } from '../../iam/presentation/guards/roles.decorator';
import { RolesGuard } from '../../iam/presentation/guards/roles.guard';
import type { LoanClock } from '../application/ports/clock.port';
import { LOAN_CLOCK } from '../application/tokens';
import { ListLoansUseCase } from '../application/use-cases/list-loans.use-case';
import {
  RegisterReaderUseCase,
  SearchLoanCopiesUseCase,
  SearchReadersUseCase,
} from '../application/use-cases/manage-readers.use-case';
import { RegisterLoanUseCase } from '../application/use-cases/register-loan.use-case';
import { ReturnLoanUseCase } from '../application/use-cases/return-loan.use-case';
import {
  ListLoansQueryDto,
  LoanCopyListDto,
  LoanReaderListDto,
  LoanReaderSummaryDto,
  LoanResponseDto,
  PaginatedLoansResponseDto,
  RegisterLoanDto,
  RegisterReaderDto,
  SearchCounterQueryDto,
  toCopySearchItemDto,
  toLoanResponseDto,
  toReaderSummaryDto,
} from './dto/loan.dto';
import { LoansErrorsFilter } from './loans-errors.filter';

/** HU-20: registro y gestión de préstamos y devoluciones. Solo personal y administradores. */
@ApiTags('loans')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
@ApiForbiddenResponse({ description: 'Solo personal y administradores' })
@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
@UseFilters(LoansErrorsFilter)
export class LoansController {
  constructor(
    private readonly registerLoan: RegisterLoanUseCase,
    private readonly returnLoan: ReturnLoanUseCase,
    private readonly listLoans: ListLoansUseCase,
    private readonly searchReaders: SearchReadersUseCase,
    private readonly registerReader: RegisterReaderUseCase,
    private readonly searchCopies: SearchLoanCopiesUseCase,
    @Inject(LOAN_CLOCK) private readonly clock: LoanClock,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar préstamos',
    description:
      'Lista préstamos activos (por defecto), devueltos o todos, con búsqueda por ejemplar, obra o lector.',
  })
  @ApiOkResponse({ type: PaginatedLoansResponseDto })
  async list(
    @Query() query: ListLoansQueryDto,
  ): Promise<PaginatedLoansResponseDto> {
    const result = await this.listLoans.execute(query);
    const now = this.clock.now();
    return {
      data: result.items.map((item) => toLoanResponseDto(item, now)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Registrar un préstamo',
    description:
      'Presta un ejemplar disponible a un lector, calcula la fecha límite de devolución y marca el ejemplar como PRESTADO.',
  })
  @ApiCreatedResponse({ type: LoanResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o plazo fuera de rango',
  })
  @ApiNotFoundResponse({ description: 'Ejemplar o lector no encontrado' })
  @ApiConflictResponse({ description: 'El ejemplar no está disponible' })
  async create(
    @Body() dto: RegisterLoanDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<LoanResponseDto> {
    const record = await this.registerLoan.execute({
      copyId: dto.copyId,
      inventoryCode: dto.inventoryCode,
      readerId: dto.readerId,
      staffId: request.auth!.userId,
      loanDays: dto.loanDays,
    });
    return toLoanResponseDto(record, this.clock.now());
  }

  @Post(':id/return')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Registrar la devolución de un préstamo',
    description:
      'Cierra un préstamo activo con la fecha actual y devuelve el ejemplar al estado DISPONIBLE.',
  })
  @ApiOkResponse({ type: LoanResponseDto })
  @ApiNotFoundResponse({ description: 'Préstamo no encontrado' })
  @ApiConflictResponse({ description: 'El préstamo ya fue devuelto' })
  async markReturned(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<LoanResponseDto> {
    const record = await this.returnLoan.execute(id);
    return toLoanResponseDto(record, this.clock.now());
  }

  @Get('readers')
  @ApiOperation({
    summary: 'Buscar lectores para préstamo',
    description: 'Busca lectores activos por nombre, documento o correo.',
  })
  @ApiOkResponse({ type: LoanReaderListDto })
  async readers(
    @Query() query: SearchCounterQueryDto,
  ): Promise<LoanReaderListDto> {
    const items = await this.searchReaders.execute(query.q, query.limit);
    return { data: items.map(toReaderSummaryDto) };
  }

  @Post('readers')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Registrar lector de mostrador',
    description:
      'Crea un lector sin cuenta de usuario para poder asociarlo a préstamos en el mostrador.',
  })
  @ApiCreatedResponse({ type: LoanReaderSummaryDto })
  @ApiBadRequestResponse({ description: 'Datos del lector inválidos' })
  async createReader(
    @Body() dto: RegisterReaderDto,
  ): Promise<LoanReaderSummaryDto> {
    const reader = await this.registerReader.execute(dto);
    return toReaderSummaryDto(reader);
  }

  @Get('copies')
  @ApiOperation({
    summary: 'Buscar ejemplares para préstamo',
    description:
      'Busca ejemplares no dados de baja por código de inventario o título de la obra.',
  })
  @ApiOkResponse({ type: LoanCopyListDto })
  async copies(
    @Query() query: SearchCounterQueryDto,
  ): Promise<LoanCopyListDto> {
    const items = await this.searchCopies.execute(query.q, query.limit);
    return { data: items.map(toCopySearchItemDto) };
  }
}
