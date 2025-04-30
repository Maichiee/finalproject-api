import { Request, Response, NextFunction } from 'express';

export class SampleController {
  async getSampleData(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({
        success: true,
        message: 'Get data successfull',
        samples: [],
      });
    } catch (error) {
      next(error);
    }
  }
}
