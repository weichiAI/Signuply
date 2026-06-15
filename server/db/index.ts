import "reflect-metadata";
import fs from "node:fs";
import path from "node:path";
import { DataSource, type DataSourceOptions } from "typeorm";
import type { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions";
import type { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

const DEFAULT_DATABASE_FILE = "./.data/app.db";
const DEFAULT_SYNCHRONIZE = true;

let dataSource: DataSource | null = null;
let dataSourcePromise: Promise<DataSource> | null = null;
let dataSourceKey: string | null = null;

export type SupportedDataSourceOptions =
  | BetterSqlite3ConnectionOptions
  | PostgresConnectionOptions;

export type CreateDataSourceOptions = {
  databaseFilePath?: string;
  entities?: DataSourceOptions["entities"];
  dataSourceOptions?: SupportedDataSourceOptions;
};

export class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

function resolveDatabaseFilePath(databaseFilePath?: string) {
  const configuredPath = databaseFilePath ?? process.env.DATABASE_FILE?.trim() ?? DEFAULT_DATABASE_FILE;
  const resolvedPath = path.resolve(process.cwd(), configuredPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  return resolvedPath;
}

function normalizeDatabaseType() {
  return process.env.DB_TYPE?.trim().toLowerCase() || "sqlite";
}

function createDefaultDataSourceOptions({
  databaseFilePath,
  entities = [],
}: CreateDataSourceOptions): DataSourceOptions {
  const databaseType = normalizeDatabaseType();

  if (databaseType === "postgres") {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      throw new DatabaseConfigurationError(
        "DATABASE_URL 未设置：当 DB_TYPE=postgres 时，请配置 Postgres 连接串。",
      );
    }

    return {
      type: "postgres",
      url: databaseUrl,
      entities,
      synchronize: DEFAULT_SYNCHRONIZE,
    };
  }

  if (databaseType !== "sqlite") {
    throw new DatabaseConfigurationError(
      `无效 DB_TYPE=${JSON.stringify(process.env.DB_TYPE)}，仅支持 sqlite 或 postgres。`,
    );
  }

  return {
    type: "better-sqlite3",
    database: resolveDatabaseFilePath(databaseFilePath),
    entities,
    synchronize: DEFAULT_SYNCHRONIZE,
  };
}

export function createDataSource({
  databaseFilePath,
  entities = [],
  dataSourceOptions,
}: CreateDataSourceOptions = {}): DataSource {
  if (dataSourceOptions) {
    const configuredType = String(dataSourceOptions.type);
    if (configuredType !== "better-sqlite3" && configuredType !== "postgres") {
      throw new DatabaseConfigurationError(
        `无效数据库类型：${JSON.stringify(configuredType)}，仅支持 better-sqlite3 或 postgres。`,
      );
    }

    return new DataSource(dataSourceOptions);
  }

  return new DataSource(createDefaultDataSourceOptions({ databaseFilePath, entities }));
}

function createDataSourceKey(options: CreateDataSourceOptions) {
  if (options.dataSourceOptions) {
    return JSON.stringify(options.dataSourceOptions);
  }

  const databaseType = normalizeDatabaseType();
  return JSON.stringify({
    databaseType,
    databaseFilePath: databaseType === "sqlite" ? resolveDatabaseFilePath(options.databaseFilePath) : "",
    databaseUrl: process.env.DATABASE_URL?.trim() ?? "",
    entityCount: options.entities?.length ?? 0,
  });
}

export async function getDataSource(
  options: CreateDataSourceOptions = {},
): Promise<DataSource> {
  const nextKey = createDataSourceKey(options);

  if (dataSourceKey !== nextKey) {
    dataSource = null;
    dataSourcePromise = null;
    dataSourceKey = nextKey;
  }

  if (dataSource?.isInitialized) {
    return dataSource;
  }

  if (!dataSourcePromise) {
    const nextDataSource = dataSource ?? createDataSource(options);
    dataSource = nextDataSource;
    dataSourcePromise = nextDataSource.initialize().then((initializedDataSource) => {
      dataSource = initializedDataSource;
      return initializedDataSource;
    }).catch((error) => {
      dataSource = null;
      dataSourcePromise = null;
      throw error;
    });
  }

  return dataSourcePromise;
}

export function getDatabaseReadHelpMessage() {
  const databaseType = normalizeDatabaseType();
  if (databaseType === "sqlite") {
    const databaseFilePath = resolveDatabaseFilePath();
    const relativePath =
      path.relative(process.cwd(), databaseFilePath) ||
      path.basename(databaseFilePath);

    return `请确认 SQLite 数据库路径可写（${relativePath}）。`;
  }

  return "请确认已设置 DATABASE_URL，并且 Postgres 服务可连接。";
}
