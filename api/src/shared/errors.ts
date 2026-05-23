export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Mapeia erros do Postgres para erros HTTP com semântica clara
export function mapDbError(err: unknown): never {
  if (!isPostgresError(err)) throw err;

  switch (err.code) {
    case '42703':
      throw new AppError(
        503,
        'SCHEMA_OUTDATED',
        'Banco desatualizado para esta operação. Na pasta api, execute: npm run db:migrate',
      );
    case '42P01':
      throw new AppError(
        503,
        'SCHEMA_OUTDATED',
        'Tabela ausente no banco. Na pasta api, execute: npm run db:migrate ou npm run db:schema',
      );
    case '22P02':
      if (err.message.includes('workspace_role')) {
        throw new AppError(
          503,
          'SCHEMA_OUTDATED',
          'Papel de workspace incompatível. Na pasta api, execute: npm run db:migrate',
        );
      }
      throw err;
    case '23505':
      throw new AppError(409, 'CONFLICT', 'Registro duplicado');
    case '23503':
      throw new AppError(422, 'INVALID_REFERENCE', 'Referência inválida ou inexistente');
    case '23514':
      throw new AppError(422, 'CONSTRAINT_VIOLATION', 'Dados violam uma regra de negócio');
    case 'P0001':
      if (err.message.includes('Invalid lifecycle transition')) {
        throw new AppError(422, 'INVALID_LIFECYCLE_TRANSITION', err.message);
      }
      if (err.message.includes('requires a reason')) {
        throw new AppError(422, 'REASON_REQUIRED', err.message);
      }
      throw new AppError(422, 'BUSINESS_RULE_VIOLATION', err.message);
    default:
      throw err;
  }
}

function isPostgresError(err: unknown): err is { code: string; message: string } {
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
}
