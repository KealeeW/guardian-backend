process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'gmproject';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const Role = require('../models/Role');

chai.use(chaiHttp);
const { expect } = chai;

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27018/guardian_test?authSource=admin';

describe('auth routes', function () {
  this.timeout(15000);

  before(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
    await Role.create([
      { name: 'admin' },
      { name: 'nurse' },
      { name: 'caretaker' },
      { name: 'doctor' }
    ]);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  // REGISTER TESTS
  it('should register a user with valid data', async () => {
    const res = await chai.request(app)
      .post('/api/v1/auth/register')
      .send({
        fullname: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 'nurse'
      });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('token');
    expect(res.body.user.email).to.equal('test@test.com');
  });

  it('should return 400 when fullname is missing', async () => {
    const res = await chai.request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@test.com',
        password: 'password123',
        role: 'nurse'
      });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('should return 400 when email is missing', async () => {
    const res = await chai.request(app)
      .post('/api/v1/auth/register')
      .send({
        fullname: 'Test User',
        password: 'password123',
        role: 'nurse'
      });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('should return 400 when an invalid role is provided', async () => {
    const res = await chai.request(app)
      .post('/api/v1/auth/register')
      .send({
        fullname: 'Test User',
        email: 'test@test.com',
        password: 'password123',
        role: 'invalidrole'
      });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  // LOGIN TESTS
  it('should login successfully with valid credentials', async () => {
    // First register a user
    await chai.request(app)
      .post('/api/v1/auth/register')
      .send({
        fullname: 'Test User',
        email: 'login@test.com',
        password: 'password123',
        role: 'nurse'
      });

    // Then login
    const res = await chai.request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@test.com',
        password: 'password123'
      });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });

  it('should return 400 when logging in with wrong password', async () => {
    await chai.request(app)
      .post('/api/v1/auth/register')
      .send({
        fullname: 'Test User',
        email: 'login@test.com',
        password: 'password123',
        role: 'nurse'
      });

    const res = await chai.request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@test.com',
        password: 'wrongpassword'
      });
    expect(res.status).to.equal(400);
  });

  it('should return 400 when logging in with non-existent email', async () => {
    const res = await chai.request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nobody@test.com',
        password: 'password123'
      });
    expect(res.status).to.equal(400);
  });

});