import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LinearAlgebraService } from './math/linear-algebra.service';
import { MovieService } from './movie/movie.service';
import { RecommendationService } from './recommendation/recommendation.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    LinearAlgebraService,
    MovieService,
    RecommendationService,
  ],
})
export class AppModule {}
