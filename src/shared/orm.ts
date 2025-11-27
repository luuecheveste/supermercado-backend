import { MikroORM } from '@mikro-orm/mysql';

export const orm = await MikroORM.init({
  // Entidades compiladas (dist)
  entities: ['dist/**/*.entity.js'],
  // Entidades en desarrollo (ts)
  entitiesTs: ['src/**/*.entity.ts'],

  // TiDB Serverless usa mysqls:// y requiere SSL sí o sí.
  clientUrl: process.env.DATABASE_URL,
  dbName: 'supermercado',

  driverOptions: {
    ssl: {
      rejectUnauthorized: false,  // NECESARIO en Render + TiDB
      minVersion: 'TLSv1.2',
    },
  },

  debug: true,

  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
  },
});

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();
};
