const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/middleware/auth');

describe('CivicConnect M2 Core Engine Verification Tests', () => {
  let requesterToken;
  let staffToken;
  let adminToken;

  beforeAll(() => {
    requesterToken = jwt.sign({ username: 'john_doe', role: 'Requester' }, JWT_SECRET);
    staffToken = jwt.sign({ username: 'staff_officer', role: 'Staff' }, JWT_SECRET);
    adminToken = jwt.sign({ username: 'sys_admin', role: 'Admin' }, JWT_SECRET);
  });

  test('FR003 & FR005: Should create a service request using Factory Pattern', async () => {
    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        title: 'Large Pothole on Main St',
        description: 'Road hazard causing damage',
        category: 'Roads & Stormwater',
        priority: 'High'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toMatch(/^RD-/);
  });

  test('FR011 & FR014: Staff should update report status and trigger Observer Audit Log', async () => {
    // 1. Create a report first so we have a valid ID to update
    const createRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        title: 'Burst Pipe',
        description: 'Water leaking on sidewalk',
        category: 'Water & Sanitation',
        priority: 'High'
      });
    
    const reportId = createRes.body.data.id;

    // 2. Update status as Staff
    const statusRes = await request(app)
      .patch(`/api/v1/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'In Progress' });

    expect(statusRes.statusCode).toEqual(200);
    expect(statusRes.body.data.status).toEqual('In Progress');

    // 3. Verify audit log was written
    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.statusCode).toEqual(200);
    expect(auditRes.body.data.length).toBeGreaterThan(0);
  });
});