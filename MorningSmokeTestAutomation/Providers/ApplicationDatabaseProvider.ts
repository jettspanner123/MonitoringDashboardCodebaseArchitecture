import { PrismaClient } from '@prisma/client';

export default class ApplicationDatabaseProvider {
    public static current = new ApplicationDatabaseProvider();

    public readonly client: PrismaClient;

    private constructor() {
        this.client = new PrismaClient();
    }

    public async disconnect(): Promise<void> {
        await this.client.$disconnect();
    }
}
