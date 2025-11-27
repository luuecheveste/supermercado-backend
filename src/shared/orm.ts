import { MikroORM } from '@mikro-orm/mysql';


export const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  clientUrl: process.env.DATABASE_URL,

  driverOptions: {
    connection: {
      ssl: {
        rejectUnauthorized: false,    // OBLIGATORIO en Render + TiDB
      },
    },
  },

  debug: true,

  schemaGenerator: {
    disableForeignKeys: false,
    createForeignKeyConstraints: true,
  },
});

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator();
  await generator.updateSchema();
};
