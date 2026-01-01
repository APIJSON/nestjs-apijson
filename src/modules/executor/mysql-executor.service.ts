import { Injectable, Logger } from '@nestjs/common';
import { BuildResult, ExecuteResult, Query, QueryExecuteResult } from '@/interfaces/apijson-request.interface';
import { DatabaseService } from '@/modules/database/database.service';
import { TableOperation, QueryType } from '@/types/request-method.type';

/**
 * MySQL 执行器服务
 * 负责执行 MySQL SQL 查询并处理结果
 */
@Injectable()
export class MySQLExecutorService {
  private readonly logger = new Logger(MySQLExecutorService.name);

  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * 执行 SQL 查询
   * @param buildResult 构建结果
   * @returns 执行结果
   */
  async execute(buildResult: BuildResult): Promise<ExecuteResult> {
    this.logger.log('开始执行 MySQL SQL 查询');

    const data: { [key: string]: any } = {};

    // 执行表查询
    for (const query of buildResult.queries) {
      const result = await this.executeQuery(query);
      data[query.table] = result;
    }

    const result: ExecuteResult = {
      data,
      directives: buildResult.directives,
      original: buildResult,
    };

    this.logger.log('MySQL SQL 查询执行完成');
    return result;
  }

  /**
   * 执行查询
   * @param query 查询对象
   * @returns 查询执行结果
   */
  private async executeQuery(query: Query): Promise<QueryExecuteResult> {
    this.logger.debug(`执行查询: ${query.sql}, 参数: ${JSON.stringify(query.params)}`);

    try {
      // 根据操作类型执行不同的查询
      switch (query.operation) {
        case TableOperation.SELECT:
          return await this.executeSelect(query);
        case TableOperation.INSERT:
          return await this.executeInsert(query);
        case TableOperation.UPDATE:
          return await this.executeUpdate(query);
        case TableOperation.DELETE:
          return await this.executeDelete(query);
        case TableOperation.COUNT:
          return await this.executeCount(query);
        default:
          throw new Error(`不支持的表操作类型: ${query.operation}`);
      }
    } catch (error) {
      this.logger.error(`查询执行失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 执行 SELECT 查询
   */
  private async executeSelect(query: Query): Promise<QueryExecuteResult> {
    this.logger.debug(`执行 SELECT 查询: ${query.table}`);

    // 检查是否需要查询总数
    const queryType = query.query as any;
    const needTotal = queryType === QueryType.DATA_AND_COUNT || queryType === QueryType.COUNT_ONLY;
    
    let data: any[] = [];
    let total = 0;
    let count = 0;

    if (needTotal) {
      // 执行 COUNT 查询
      const countSql = this.buildCountSql(query.sql);
      const countResult = await this.databaseService.query(countSql, query.params);
      total = this.extractCount(countResult);
    }

    if (queryType !== QueryType.COUNT_ONLY) {
      // 执行数据查询
      const result = await this.databaseService.query(query.sql, query.params);
      data = this.extractRows(result);
      count = data.length;
    }

    // 处理 JOIN 查询结果
    if (query.joins && query.joins.length > 0) {
      data = this.processJoinResults(data, query);
    }

    return {
      data,
      total,
      count,
    };
  }

  /**
   * 执行 INSERT 查询
   */
  private async executeInsert(query: Query): Promise<QueryExecuteResult> {
    this.logger.debug(`执行 INSERT 查询: ${query.table}`);

    const result = await this.databaseService.query(query.sql, query.params);
    const insertId = this.extractInsertId(result);

    // 如果是批量插入，返回所有插入的 ID
    if (Array.isArray(query.data) && query.data.length > 1) {
      const insertIds = [insertId];
      for (let i = 1; i < query.data.length; i++) {
        insertIds.push(insertId + i);
      }

      return {
        data: query.data.map((row, index) => ({
          ...row,
          id: insertIds[index],
        })),
        total: insertIds.length,
        count: insertIds.length,
      };
    }

    // 单条插入
    return {
      data: [
        {
          ...query.data,
          id: insertId,
        },
      ],
      total: 1,
      count: 1,
    };
  }

  /**
   * 执行 UPDATE 查询
   */
  private async executeUpdate(query: Query): Promise<QueryExecuteResult> {
    this.logger.debug(`执行 UPDATE 查询: ${query.table}`);

    const result = await this.databaseService.query(query.sql, query.params);
    const affectedRows = this.extractAffectedRows(result);

    // 如果是批量更新，返回更新后的数据
    if (Array.isArray(query.data)) {
      return {
        data: query.data,
        total: query.data.length,
        count: query.data.length,
      };
    }

    // 单条更新
    return {
      data: [query.data],
      total: 1,
      count: 1,
    };
  }

  /**
   * 执行 DELETE 查询
   */
  private async executeDelete(query: Query): Promise<QueryExecuteResult> {
    this.logger.debug(`执行 DELETE 查询: ${query.table}`);

    const result = await this.databaseService.query(query.sql, query.params);
    const affectedRows = this.extractAffectedRows(result);

    return {
      data: [],
      total: affectedRows,
      count: affectedRows,
    };
  }

  /**
   * 执行 COUNT 查询
   */
  private async executeCount(query: Query): Promise<QueryExecuteResult> {
    this.logger.debug(`执行 COUNT 查询: ${query.table}`);

    const result = await this.databaseService.query(query.sql, query.params);
    const count = this.extractCount(result);

    return {
      data: [{ count }],
      total: count,
      count: 1,
    };
  }

  /**
   * 执行事务
   * @param queries 查询数组
   * @returns 执行结果数组
   */
  async executeTransaction(queries: Query[]): Promise<QueryExecuteResult[]> {
    this.logger.log(`开始执行事务，查询数量: ${queries.length}`);

    const sqlQueries = queries.map(q => ({
      sql: q.sql,
      params: q.params,
    }));

    try {
      const results = await this.databaseService.executeTransaction(sqlQueries);
      
      // 处理每个查询的结果
      const executeResults = queries.map((query, index) => {
        const result = results[index];
        const rows = this.extractRows(result);
        const affectedRows = this.extractAffectedRows(result);
        const insertId = this.extractInsertId(result);

        return {
          data: rows,
          total: rows.length || affectedRows,
          count: rows.length,
        };
      });

      this.logger.log('事务执行成功');
      return executeResults;
    } catch (error) {
      this.logger.error(`事务执行失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 构建 COUNT SQL
   */
  private buildCountSql(sql: string): string {
    // 将 SELECT 字段替换为 COUNT(*)
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
    if (selectMatch) {
      return sql.replace(selectMatch[1], 'COUNT(*)');
    }
    return sql;
  }

  /**
   * 提取查询结果行
   */
  private extractRows(result: any): any[] {
    if (Array.isArray(result)) {
      return result;
    }

    if (result && result.rows) {
      return Array.isArray(result.rows) ? result.rows : [];
    }

    return [];
  }

  /**
   * 提取影响的行数
   */
  private extractAffectedRows(result: any): number {
    if (result && result.affectedRows !== undefined) {
      return result.affectedRows;
    }

    if (result && result.rowCount !== undefined) {
      return result.rowCount;
    }

    return 0;
  }

  /**
   * 提取插入的 ID
   */
  private extractInsertId(result: any): number {
    if (result && result.insertId !== undefined) {
      return result.insertId;
    }

    if (result && result.rows && result.rows[0] && result.rows[0].insertId !== undefined) {
      return result.rows[0].insertId;
    }

    return 0;
  }

  /**
   * 提取 COUNT 结果
   */
  private extractCount(result: any): number {
    const rows = this.extractRows(result);
    
    if (rows.length > 0) {
      // 查找 count 字段
      if (rows[0].count !== undefined) {
        return rows[0].count;
      }
      
      // 查找 COUNT(*) 字段
      const countKey = Object.keys(rows[0]).find(key => 
        key.toLowerCase().includes('count')
      );
      if (countKey) {
        return rows[0][countKey];
      }
    }

    return 0;
  }

  /**
   * 处理 JOIN 查询结果
   */
  private processJoinResults(data: any[], query: Query): any[] {
    if (!query.joins || query.joins.length === 0) {
      return data;
    }

    // 处理 JOIN 结果，将关联表的数据合并到主表
    return data.map(row => {
      const processedRow = { ...row };

      // 处理每个 JOIN
      for (const join of query.joins) {
        const joinTable = join.table;
        
        // 查找关联表的数据
        const joinData = data.filter(r => r._joinTable === joinTable);
        
        if (joinData.length > 0) {
          processedRow[joinTable] = joinData;
        }
      }

      return processedRow;
    });
  }

  /**
   * 测试数据库连接
   */
  async testConnection(): Promise<boolean> {
    this.logger.debug('测试数据库连接');
    
    try {
      return await this.databaseService.testConnection();
    } catch (error) {
      this.logger.error(`数据库连接测试失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 获取数据库版本
   */
  async getDatabaseVersion(): Promise<string> {
    this.logger.debug('获取数据库版本');
    
    try {
      return await this.databaseService.getDatabaseVersion();
    } catch (error) {
      this.logger.error(`获取数据库版本失败: ${error.message}`, error.stack);
      return 'unknown';
    }
  }

  /**
   * 获取数据库大小
   */
  async getDatabaseSize(): Promise<{ database: string; size: number; unit: string }> {
    this.logger.debug('获取数据库大小');
    
    try {
      return await this.databaseService.getDatabaseSize();
    } catch (error) {
      this.logger.error(`获取数据库大小失败: ${error.message}`, error.stack);
      return {
        database: 'unknown',
        size: 0,
        unit: 'MB',
      };
    }
  }
}
