import {handler} from '../lib/lambdas/nodeLambdaFunction'


describe('Hello describe test suite', () => {
    it('handler should return 200', async () => {
        const result  = await handler({},{})
       // expect(result.body).toBe('Hello, CDK!');
        expect(result.statusCode).toBe(200);
    });
});