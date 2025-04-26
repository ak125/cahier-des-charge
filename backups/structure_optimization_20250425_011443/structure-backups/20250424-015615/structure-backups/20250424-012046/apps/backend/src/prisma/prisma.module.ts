import { Module, Global } from @nestjs/commonstructure-agent';
import { PrismaService } from ./prisma.servicestructure-agent';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}