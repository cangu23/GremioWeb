import { Router } from 'express';
import * as SearchController from './search.controller';

const router = Router();

router.get('/', SearchController.search);

export default router;
