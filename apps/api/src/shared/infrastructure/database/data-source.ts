import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm-options.js';

/** CLI / migrate job entry (TypeORM DataSource). */
const AppDataSource = new DataSource(buildTypeOrmOptions());

export default AppDataSource;
