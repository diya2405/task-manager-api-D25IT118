const request = require('supertest');
const app = require('../server');

describe('Practical 12: Automated API Test Suite - Diya Shah (D25IT118)', () => {
  it('1. GET /health should return 200 OK with Diya Shah and D25IT118', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.student).toBe('Diya Shah');
    expect(res.body.rollNo).toBe('D25IT118');
    expect(res.body.service).toBe('task-manager-api-D25IT118');
  });

  it('2. POST /events/register should return 201 Created immediately without blocking', async () => {
    const res = await request(app)
      .post('/events/register')
      .send({
        name: 'Diya Shah',
        email: 'diya@example.com',
        event: 'Workshop',
        seats: 1,
        rollNo: 'D25IT118',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Entry received');
    expect(res.body.entry).toBeDefined();
    expect(res.body.entry.name).toBe('Diya Shah');
    expect(res.body.entry.rollNo).toBe('D25IT118');
  });

  it('3. GET /events/pipeline should return 200 OK with active pipeline queues', async () => {
    const res = await request(app).get('/events/pipeline');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.waiting)).toBe(true);
    expect(Array.isArray(res.body.processing)).toBe(true);
    expect(Array.isArray(res.body.confirmed)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('4. GET /tasks without Authorization should return 401 Unauthorized', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(401);
  });

  it('5. GET /unknown-route should return 404 Route not found', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
