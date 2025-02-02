/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
import "reflect-metadata";
import {
  Connection,
  ConnectionManager,
  ConnectionOptions,
  createConnection,
  getConnectionManager,
} from "typeorm";

declare var require: any; // eslint-disable-line

if (typeof require.context === "undefined") {
  const fs = require("fs");
  const path = require("path");

  require.context = (
    base = ".",
    scanSubDirectories = false,
    regularExpression = /\.js$/
  ) => {
    const files = {} as any;

    function readDirectory(directory: any) {
      fs.readdirSync(directory).forEach((file: any) => {
        const fullPath = path.resolve(directory, file);

        if (fs.statSync(fullPath).isDirectory()) {
          if (scanSubDirectories) readDirectory(fullPath);

          return;
        }

        if (!regularExpression.test(fullPath)) return;

        files[fullPath] = true;
      });
    }

    readDirectory(path.resolve(__dirname, base));

    function Module(file: any) {
      return require(file);
    }

    Module.keys = () => Object.keys(files);

    return Module;
  };
}

const context = require?.context("../../../api/entities", true, /\.ts$/);
const entityFileNames = context.keys();

const original = (Connection.prototype as any).findMetadata;
(Connection.prototype as any).findMetadata = function findMetadata(
  target: any
) {
  const result = original.call(this, target);
  if (result) {
    return result;
  }

  if (typeof target === "function") {
    return this.entityMetadatas.find(
      (metadata: any) => metadata.name === target.name
    );
  }
};

export default class Database {
  private connectionManager: ConnectionManager;

  constructor() {
    this.connectionManager = getConnectionManager();
  }

  public async connect(name = "default"): Promise<Connection> {
    const CONNECTION_NAME: string = name;
    const hasConnection = this.connectionManager.has(CONNECTION_NAME);
    if (hasConnection) {
      const connection = this.connectionManager.get(CONNECTION_NAME);
      if (connection.isConnected) {
        return connection;
      }

      return await connection.connect();
    }

    const connectionOptions: ConnectionOptions = {
      name: "default",
      type: process.env.TYPEORM_CONNECTION as any,
      host: process.env.TYPEORM_HOST,
      port: Number(process.env.TYPEORM_PORT),
      username: process.env.TYPEORM_USERNAME,
      password: process.env.TYPEORM_PASSWORD,
      database: process.env.TYPEORM_DATABASE,
      synchronize: (process.env.TYPEORM_SYNCHRONIZE as string) === "true",
      logging: (process.env.TYPEORM_LOGGING as string) === "true",
      entities: entityFileNames.map((file: any) => context(file).default),
      migrations: undefined, // [process.env.TYPEORM_MIGRATIONS as string],
      ssl: {
        rejectUnauthorized: false,
      },
    };

    return await createConnection(connectionOptions);
  }
}
