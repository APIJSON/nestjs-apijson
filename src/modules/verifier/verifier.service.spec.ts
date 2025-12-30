import { describe, it, expect, beforeEach } from 'vitest';
import { VerifierService } from './verifier.service';
import { ParseResult, VerifyResult } from '@/interfaces/apijson-request.interface';

describe('VerifierService', () => {
  let service: VerifierService;

  beforeEach(() => {
    service = new VerifierService();
  });

  describe('verify', () => {
    it('should verify a valid parse result', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id', 'name', 'email'],
            where: { id: 1 },
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {
          '@method': { name: 'method', value: 'GET' },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.tables).toBeDefined();
      expect(result.directives).toBeDefined();
    });

    it('should verify multiple tables', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id', 'name'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
          Product: {
            name: 'Product',
            columns: ['id', 'price'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 20,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
      expect(result.tables.User).toBeDefined();
      expect(result.tables.Product).toBeDefined();
    });

    it('should handle empty parse result', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return invalid for invalid table name', async () => {
      const parseResult: ParseResult = {
        tables: {
          '@InvalidTable': {
            name: '@InvalidTable',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('表名 "@InvalidTable" 无效');
    });

    it('should return invalid for table name with invalid characters', async () => {
      const parseResult: ParseResult = {
        tables: {
          'Invalid<>Table': {
            name: 'Invalid<>Table',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('表名 "Invalid<>Table" 无效');
    });

    it('should return invalid for table name exceeding max length', async () => {
      const longTableName = 'a'.repeat(65);
      const parseResult: ParseResult = {
        tables: {
          [longTableName]: {
            name: longTableName,
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(`表名 "${longTableName}" 无效`);
    });

    it('should return invalid for invalid limit', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: -10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('限制必须为正数');
    });

    it('should return invalid for limit exceeding max value', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 1001,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('限制不能超过1000');
    });

    it('should return invalid for negative offset', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: -10,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('偏移必须为非负数');
    });

    it('should return invalid for invalid columns', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: 123,
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('列必须为数组或字符串');
    });

    it('should return invalid for invalid joins', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: 'invalid',
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('连接必须为数组');
    });

    it('should return invalid for join without table name', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [{ type: 'INNER' }],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('连接缺少表名');
    });

    it('should return invalid for invalid join type', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [{ type: 'INVALID', table: 'Profile', on: 'User.id = Profile.userId' }],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('连接类型 "INVALID" 无效');
    });

    it('should return invalid for invalid group', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: 123,
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分组必须为数组或字符串');
    });

    it('should return invalid for invalid order', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: 123,
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('排序必须为数组或字符串');
    });

    it('should return invalid for invalid where', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: 'invalid',
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('条件必须为对象');
    });

    it('should return invalid for invalid having', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: 'invalid',
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('分组条件必须为对象');
    });

    it('should verify valid directives', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@method': { name: 'method', value: 'GET' },
          '@page': { name: 'page', value: 1 },
          '@limit': { name: 'limit', value: 10 },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
      expect(result.directives['@method']).toBeDefined();
      expect(result.directives['@page']).toBeDefined();
      expect(result.directives['@limit']).toBeDefined();
    });

    it('should return invalid for invalid directive name', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@invalid': { name: 'invalid', value: 'value' },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令名 "@invalid" 无效');
    });

    it('should return invalid for invalid method directive value', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@method': { name: 'method', value: 'INVALID' },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令 "@method" 的值 "INVALID" 无效');
    });

    it('should return invalid for invalid page directive value', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@page': { name: 'page', value: 'invalid' },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令 "@page" 的值 "invalid" 必须为数字');
    });

    it('should return invalid for invalid limit directive value', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@limit': { name: 'limit', value: 'invalid' },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令 "@limit" 的值 "invalid" 必须为数字');
    });

    it('should return invalid for invalid order directive value', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@order': { name: 'order', value: 123 },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令 "@order" 的值 "123" 无效');
    });

    it('should return invalid for invalid group directive value', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@group': { name: 'group', value: 123 },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令 "@group" 的值 "123" 无效');
    });

    it('should return invalid for invalid cache directive value', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@cache': { name: 'cache', value: 123 },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('指令 "@cache" 的值 "123" 无效');
    });

    it('should preserve original parse result', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: { test: 'value' },
      };

      const result = await service.verify(parseResult);

      expect(result.original).toEqual(parseResult);
    });

    it('should collect all errors from multiple invalid tables', async () => {
      const parseResult: ParseResult = {
        tables: {
          '@Invalid1': {
            name: '@Invalid1',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: -10,
            offset: -10,
          },
          '@Invalid2': {
            name: '@Invalid2',
            columns: 123,
            where: 'invalid',
            joins: 'invalid',
            group: 'invalid',
            having: 'invalid',
            order: 'invalid',
            limit: 1001,
            offset: -10,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should collect all errors from multiple invalid directives', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@method': { name: 'method', value: 'INVALID' },
          '@page': { name: 'page', value: 'invalid' },
          '@limit': { name: 'limit', value: 'invalid' },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Table Validation', () => {
    it('should validate valid table name with underscore', async () => {
      const parseResult: ParseResult = {
        tables: {
          user_profile: {
            name: 'user_profile',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid table name with numbers', async () => {
      const parseResult: ParseResult = {
        tables: {
          user123: {
            name: 'user123',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid columns array', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id', 'name', 'email', 'createdAt'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid columns string', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: 'id,name,email',
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid where condition', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: { status: 'active', age: { $gt: 18 } },
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid joins', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [
              { type: 'INNER', table: 'Profile', on: 'User.id = Profile.userId' },
              { type: 'LEFT', table: 'Order', on: 'User.id = Order.userId' },
            ],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid group', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: ['department', 'role'],
            having: {},
            order: [],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid order', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: ['name+', 'createdAt-'],
            limit: 10,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid limit', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 100,
            offset: 0,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate valid offset', async () => {
      const parseResult: ParseResult = {
        tables: {
          User: {
            name: 'User',
            columns: ['id'],
            where: {},
            joins: [],
            group: [],
            having: {},
            order: [],
            limit: 10,
            offset: 100,
          },
        },
        directives: {},
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });
  });

  describe('Directive Validation', () => {
    it('should validate all valid HTTP methods', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const parseResult: ParseResult = {
          tables: {},
          directives: {
            '@method': { name: 'method', value: method },
          },
          original: {},
        };

        const result = await service.verify(parseResult);

        expect(result.valid).toBe(true);
      }
    });

    it('should validate boolean cache directive', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@cache': { name: 'cache', value: true },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });

    it('should validate object cache directive', async () => {
      const parseResult: ParseResult = {
        tables: {},
        directives: {
          '@cache': { name: 'cache', value: { enabled: true, ttl: 300 } },
        },
        original: {},
      };

      const result = await service.verify(parseResult);

      expect(result.valid).toBe(true);
    });
  });
});
