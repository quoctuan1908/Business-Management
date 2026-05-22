import { PrismaClient } from "@prisma/client";
import EnvVars from "@src/common/constants/env";
import { PrismaPg } from "node_modules/@prisma/adapter-pg/dist";
import { Pool } from 'pg';

const pool = new Pool({ connectionString: EnvVars.DatabaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;