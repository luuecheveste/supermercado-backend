import { MikroORM } from '@mikro-orm/mysql';

export const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  clientUrl: process.env.DATABASE_URL,  // TiDB ya te da todo en la URL
  dbName: 'supermercado',

  //
  driverOptions: {
    ssl: {
      rejectUnauthorized: false,   // OBLIGATORIO en Render + TiDB
    },
  },

  debug: true,

  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
});

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();
};
