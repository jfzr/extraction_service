const request = require('supertest');
const expect = require('chai').expect;
const fs = require('fs');

// Import your app
const app= require('../services/api_service');

describe('Node.js App Tests', () => {
    describe('POST /v1/upload', () => {
        it('should upload a CSV and populate the table', (done) => {
            request(app)
                .post('/v1/upload')
                .attach('file', fs.readFileSync(`${__dirname} + \\..\\SOURCE\\jobs.csv`), 'jobs.csv')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.have.property('message');
                    // Add more assertions as required
                    done();
                });
        });
    });

    describe('GET /v1/employee-stats', () => {
        it('should return employee stats', (done) => {
            request(app)
                .get('/v1/employee-stats')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('array');
                    // Add more assertions as required
                    done();
                });
        });
    });

    describe('GET /v1/top-departments', () => {
        it('should return top departments', (done) => {
            request(app)
                .get('/v1/top-departments')
                .expect(200)
                .end((err, res) => {
                    if (err) return done(err);
                    expect(res.body).to.be.an('array');
                    // Add more assertions as required
                    done();
                });
        });
    });
});
