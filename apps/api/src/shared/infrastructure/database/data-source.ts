// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './typeorm-options.js';

/** CLI / migrate job entry (TypeORM DataSource). */
const AppDataSource = new DataSource(buildTypeOrmOptions());

export default AppDataSource;
