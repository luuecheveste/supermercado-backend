import { MikroORM } from '@mikro-orm/mysql';
import fs from 'fs';

const sslCA = fs.readFileSync('./ca.pem');

export const orm = await MikroORM.init({
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  dbName: 'supermercado',
  clientUrl: process.env.DATABASE_URL || 'mysql://root:Root123!@localhost:3306/supermercado',
  driverOptions: {
    ssl: true,
  },
  debug: true,
  schemaGenerator: {
    disableForeignKeys: true,
    createForeignKeyConstraints: true,
    ignoreSchema: [],
  },
})

export const syncSchema = async () => {
  const generator = orm.getSchemaGenerator()
  /*   
  await generator.dropSchema()
  await generator.createSchema()
  */
  await generator.updateSchema()
}