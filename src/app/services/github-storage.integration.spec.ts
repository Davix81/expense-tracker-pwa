import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GitHubStorageService } from './github-storage.service';
import { Expense } from '../models/expense.model';

/**
 * Integration tests for GitHubStorageService
 * These tests verify the complete workflow of reading and writing expenses
 */
describe('GitHubStorageService Integration Tests', () => {
  let service: GitHubStorageService;
  let httpMock: HttpTestingController;

  const mockExpense: Expense = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Electric Bill',
    description: 'Monthly electricity payment',
    issuer: 'Power Company',
    tag: 'utilities',
    category: 'Utilities',
    approximateAmount: 150.00,
    scheduledPaymentDate: new Date('2024-01-15'),
    actualPaymentDate: null,
    actualAmount: null,
    paymentStatus: 'PENDING',
    bank: 'Main Bank',
    createdAt: new Date('2024-01-01')
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GitHubStorageService]
    });
    service = TestBed.inject(GitHubStorageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should complete a full read-write cycle', (done) => {
    const expenses = [mockExpense];

    // Step 1: Write expenses
    service.writeExpenses(expenses).subscribe({
      next: () => {
        // Step 2: Read expenses back
        service.readExpenses().subscribe({
          next: (readExpenses) => {
            expect(readExpenses.length).toBe(1);
            expect(readExpenses[0].id).toBe(mockExpense.id);
            expect(readExpenses[0].name).toBe(mockExpense.name);
            done();
          },
          error: done.fail
        });

        // Handle read request
        const readReq = httpMock.expectOne(req => req.method === 'GET');
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(expenses))));
        readReq.flush({
          content: encodedContent,
          sha: 'abc123',
          encoding: 'base64'
        });
      },
      error: done.fail
    });

    // Handle write requests
    const getReq = httpMock.expectOne(req => req.method === 'GET');
    getReq.flush({ content: '', sha: 'sha1', encoding: 'base64' });
    
    const putReq = httpMock.expectOne(req => req.method === 'PUT');
    putReq.flush({});
  });

  it('should preserve all expense data through encode/decode cycle', (done) => {
    const complexExpense: Expense = {
      ...mockExpense,
      actualPaymentDate: new Date('2024-01-16'),
      actualAmount: 155.50,
      paymentStatus: 'PAID',
      description: 'Complex description with special chars: €£¥ & symbols ☕'
    };
    const expenses = [complexExpense];

    service.writeExpenses(expenses).subscribe({
      next: () => {
        service.readExpenses().subscribe({
          next: (readExpenses) => {
            const expense = readExpenses[0];
            expect(expense.id).toBe(complexExpense.id);
            expect(expense.name).toBe(complexExpense.name);
            expect(expense.description).toBe(complexExpense.description);
            expect(expense.approximateAmount).toBe(complexExpense.approximateAmount);
            expect(expense.actualAmount).toBe(complexExpense.actualAmount);
            expect(expense.paymentStatus).toBe(complexExpense.paymentStatus);
            expect(expense.scheduledPaymentDate).toBeInstanceOf(Date);
            expect(expense.actualPaymentDate).toBeInstanceOf(Date);
            expect(expense.createdAt).toBeInstanceOf(Date);
            done();
          },
          error: done.fail
        });

        const readReq = httpMock.expectOne(req => req.method === 'GET');
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(expenses))));
        readReq.flush({
          content: encodedContent,
          sha: 'abc123',
          encoding: 'base64'
        });
      },
      error: done.fail
    });

    const getReq = httpMock.expectOne(req => req.method === 'GET');
    getReq.flush({ content: '', sha: 'sha1', encoding: 'base64' });
    
    const putReq = httpMock.expectOne(req => req.method === 'PUT');
    putReq.flush({});
  });

  it('should handle multiple expenses correctly', (done) => {
    const expense2: Expense = {
      ...mockExpense,
      id: '223e4567-e89b-12d3-a456-426614174001',
      name: 'Water Bill',
      issuer: 'Water Company'
    };
    const expenses = [mockExpense, expense2];

    service.writeExpenses(expenses).subscribe({
      next: () => {
        service.readExpenses().subscribe({
          next: (readExpenses) => {
            expect(readExpenses.length).toBe(2);
            expect(readExpenses[0].id).toBe(mockExpense.id);
            expect(readExpenses[1].id).toBe(expense2.id);
            expect(readExpenses[1].name).toBe('Water Bill');
            done();
          },
          error: done.fail
        });

        const readReq = httpMock.expectOne(req => req.method === 'GET');
        const encodedContent = btoa(unescape(encodeURIComponent(JSON.stringify(expenses))));
        readReq.flush({
          content: encodedContent,
          sha: 'abc123',
          encoding: 'base64'
        });
      },
      error: done.fail
    });

    const getReq = httpMock.expectOne(req => req.method === 'GET');
    getReq.flush({ content: '', sha: 'sha1', encoding: 'base64' });
    
    const putReq = httpMock.expectOne(req => req.method === 'PUT');
    putReq.flush({});
  });
});
